import { AuthError, type Actor } from './auth';
import { VIEWER_PREFIX, TakeoffViewerAccessError, viewerScope, type ViewerScope } from './takeoff-viewer-access';

const MAX_JSON_BYTES = 4 * 1024 * 1024;
const ID = /^[A-Za-z0-9_-]{1,200}$/;
type JsonObject = Record<string, unknown>;
type Route = { kind: 'shell' | 'static' | 'catalog' | 'project' | 'document' | 'asset'; id?: string; pathname: string; search: string };
export function viewerResponseHeaders() {
  return new Headers({
    'Cache-Control': 'private, no-store', 'Pragma': 'no-cache', Vary: 'Cookie',
    'Cross-Origin-Embedder-Policy': 'require-corp', 'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN',
    'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; form-action 'none'",
  });
}
export function viewerFailure(error: unknown, head = false) {
  const status = error instanceof AuthError || error instanceof TakeoffViewerAccessError ? error.status : 502;
  const message = error instanceof AuthError || error instanceof TakeoffViewerAccessError ? error.message : 'The drawing viewer is temporarily unavailable.';
  const headers = viewerResponseHeaders(); headers.set('Content-Type', 'application/json');
  if (status === 405) headers.set('Allow', 'GET, HEAD');
  return new Response(head ? null : JSON.stringify({ error: message }), { status, headers });
}
const fail = (status: number, message: string): never => { throw new TakeoffViewerAccessError(status, message); };
function upstreamOrigin() {
  const configured = process.env.TAYCO_TAKEOFF_VIEWER_INTERNAL_URL;
  if (!configured) fail(503, 'The drawing viewer is not configured.');
  if (!/^https?:\/\/[^/?#\\\\]+\/?$/i.test(configured!)) fail(503, 'The drawing viewer is not configured correctly.');
  let url: URL;
  try { url = new URL(configured!); } catch { return fail(503, 'The drawing viewer is not configured correctly.'); }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash || !['http:', 'https:'].includes(url.protocol)
    || (url.protocol === 'http:' && !loopback && !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.railway\.internal$/i.test(url.hostname))) fail(503, 'The drawing viewer is not configured correctly.');
  return url.origin;
}
function routeFor(request: Request, scope: ViewerScope): Route {
  const url = new URL(request.url);
  if (!url.pathname.startsWith(VIEWER_PREFIX + '/') && url.pathname !== VIEWER_PREFIX) fail(404, 'Viewer resource not found.');
  const tail = url.pathname.slice(VIEWER_PREFIX.length) || '/';
  if (tail.includes('%') || tail.includes('\\') || tail.includes('//') || tail.split('/').some(segment => segment === '.' || segment === '..')) fail(400, 'Invalid viewer resource.');
  let kind: Route['kind']; let id: string | undefined;
  if (['/', '/viewer', '/viewer/'].includes(tail)) kind = 'shell';
  else if (/^\/static\/(viewer\.(css|js)|i18n\.js)$/.test(tail) || /^\/static\/pdfjs\/(build\/pdf(?:\.worker)?\.mjs|LICENSE)$/.test(tail)
    || /^\/static\/pdfjs\/(cmaps|standard_fonts|wasm)\/[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*(?:\/[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*)*$/.test(tail)) kind = 'static';
  else if (tail === '/api/v1/projects') kind = 'catalog';
  else {
    const match = tail.match(/^\/api\/v1\/(projects|documents|assets)\/([A-Za-z0-9_-]{1,200})$/);
    if (!match) return fail(404, 'Viewer resource not found.');
    kind = ({ projects: 'project', documents: 'document', assets: 'asset' } as const)[match[1] as 'projects' | 'documents' | 'assets'];
    id = match[2];
    if (kind === 'project' && !scope.contexts.some(context => context.key === id)) fail(404, 'Viewer resource not found.');
    if (kind === 'document' && !scope.documentIds.includes(id)) fail(404, 'Viewer resource not found.');
    if (kind === 'asset' && !scope.assetIds.includes(id)) fail(404, 'Viewer resource not found.');
  }
  if (kind !== 'shell' && url.search) fail(400, 'This viewer resource does not accept a query.');
  if (kind === 'shell') {
    const seen = new Set<string>();
    for (const [key, value] of url.searchParams) {
      if (!['embed', 'project', 'document', 'page'].includes(key) || seen.has(key)) fail(400, 'Invalid viewer options.');
      seen.add(key);
      if (key === 'embed' && !['0', '1', 'true', 'false'].includes(value)) fail(400, 'Invalid viewer options.');
      if (key === 'page' && (!/^[1-9]\d{0,5}$/.test(value))) fail(400, 'Invalid viewer page.');
      if ((key === 'project' || key === 'document') && !ID.test(value)) fail(400, 'Invalid viewer options.');
      if (key === 'project' && !scope.contexts.some(context => context.key === value)) fail(404, 'Viewer resource not found.');
      if (key === 'document' && !scope.documentIds.includes(value)) fail(404, 'Viewer resource not found.');
    }
    const project = url.searchParams.get('project'), document = url.searchParams.get('document');
    if (project && document && !scope.contexts.find(context => context.key === project)!.documentIds.includes(document)) fail(404, 'Viewer resource not found.');
  }
  return { kind, id, pathname: VIEWER_PREFIX + tail, search: url.search };
}
function object(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(502, 'The viewer returned an invalid document response.');
  return value as JsonObject;
}
function string(value: unknown, max = 2000): string {
  if (typeof value !== 'string' || value.length > max) fail(502, 'The viewer returned an invalid document response.');
  return value as string;
}
function list(value: unknown): unknown[] { if (!Array.isArray(value) || value.length > 10000) fail(502, 'The viewer returned an invalid document response.'); return value as unknown[]; }
function descriptor(value: unknown) {
  const row = object(value);
  const pageCount = row.page_count ?? null;
  if (!ID.test(string(row.id, 200)) || (pageCount !== null && (!Number.isInteger(pageCount) || Number(pageCount) < 0 || Number(pageCount) > 1_000_000))) fail(502, 'The viewer returned an invalid document response.');
  return { id: row.id as string, title: string(row.title), kind: string(row.kind, 100), page_count: pageCount as number | null, source_name: string(row.source_name), revisions: [] };
}
const scalarKeys = new Set(['text', 'title', 'label', 'description', 'unit', 'units', 'quantity', 'value', 'amount', 'rate', 'total', 'count', 'length', 'area', 'volume', 'width', 'height', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'confidence', 'status', 'type', 'category', 'item_code', 'page', 'page_number', 'pdf_page_label', 'reported_index_label', 'candidates', 'calibration_applied', 'text_available', 'sheet_marks_candidates', 'children', 'items', 'points', 'measurements']);
function boundedContent(value: unknown, depth = 0): unknown {
  if (depth > 8) fail(502, 'The viewer document structure is too deep.');
  if (value === null || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) return value;
  if (typeof value === 'string') return string(value, 2_000_000);
  if (Array.isArray(value)) return list(value).map(item => boundedContent(item, depth + 1));
  const output: JsonObject = {};
  for (const [key, item] of Object.entries(object(value))) if (scalarKeys.has(key)) output[key] = boundedContent(item, depth + 1);
  return output;
}
function filterJson(value: unknown, route: Route, scope: ViewerScope): JsonObject {
  const row = object(value);
  if (route.kind === 'catalog') {
    if (row.bundle_id !== scope.bundleId) fail(502, 'The viewer bundle does not match the authorized publication.');
    const projects = list(row.projects).map(object).filter(project => scope.contexts.some(context => context.key === project.key)).map(project => {
      const context = scope.contexts.find(context => context.key === project.key)!;
      return { key: context.key, display_name: string(project.display_name), identity_status: string(project.identity_status, 100), metadata: {}, document_count: context.documentIds.length, document_kinds: [] };
    });
    return { bundle_id: scope.bundleId, projects };
  }
  if (route.kind === 'project') {
    if (row.key !== route.id) fail(502, 'The viewer returned a different project.');
    const context = scope.contexts.find(item => item.key === route.id)!;
    return { key: context.key, display_name: string(row.display_name), identity_status: string(row.identity_status, 100), metadata: {},
      documents: list(row.documents).filter(raw => context.documentIds.includes(string(object(raw).id, 200))).map(descriptor) };
  }
  if (row.id !== route.id || !scope.contexts.some(context => context.key === row.project_key && context.documentIds.includes(route.id!))) fail(502, 'The viewer returned a different document.');
  const result: JsonObject = { ...descriptor(row), project_key: row.project_key, metadata: {}, references: [],
    source_sha256: string(row.source_sha256, 64), asset_media_type: string(row.asset_media_type, 150) };
  if (!/^[a-f0-9]{64}$/i.test(result.source_sha256 as string)) fail(502, 'The viewer returned an invalid document digest.');
  const asset = string(row.asset_url, 500);
  const documentScope = scope.documents.find(document => document.id === route.id && document.contextKey === row.project_key);
  if (!documentScope || !documentScope.assetIds.some(id => asset === VIEWER_PREFIX + '/api/v1/assets/' + id)) fail(502, 'The viewer returned an unauthorized asset link.');
  result.asset_url = asset;
  for (const key of ['ocr_status', 'index_status', 'calibration_status']) {
    if (row[key] !== null && row[key] !== undefined) result[key] = string(row[key], 200);
    else result[key] = null;
  }
  result.declared_scale = row.declared_scale === undefined ? null : boundedContent(row.declared_scale);
  for (const key of ['measurements', 'boq', 'paragraphs']) result[key] = boundedContent(row[key] ?? []);
  if (row.index === null || row.index === undefined) result.index = null;
  else {
    const index = object(row.index), clean: JsonObject = {};
    for (const key of ['label', 'text', 'caveat']) if (index[key] !== undefined && index[key] !== null) clean[key] = string(index[key], 2_000_000);
    for (const key of ['text_is_candidate_extraction', 'full_text_or_OCR_claimed', 'pagination_inferred']) if (index[key] !== undefined) { if (typeof index[key] !== 'boolean') fail(502, 'The viewer returned an invalid document index.'); clean[key] = index[key]; }
    for (const key of ['pages', 'paragraphs']) if (index[key] !== undefined) clean[key] = boundedContent(list(index[key]));
    result.index = clean;
  }
  return result;
}
async function readJson(response: Response) {
  if (!response.headers.get('content-type')?.toLowerCase().startsWith('application/json')) fail(502, 'The viewer returned an invalid document response.');
  if (Number(response.headers.get('content-length')) > MAX_JSON_BYTES) fail(502, 'The viewer document response is too large.');
  const reader = response.body?.getReader();
  if (!reader) fail(502, 'The viewer returned an empty document response.');
  const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    for (;;) { const { done, value } = await reader!.read(); if (done) break; bytes += value.byteLength; if (bytes > MAX_JSON_BYTES) fail(502, 'The viewer document response is too large.'); chunks.push(value); }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return fail(502, 'The viewer returned invalid document JSON.'); }
  } finally { await reader!.cancel().catch(() => {}); }
}
export async function handleViewerRequest(request: Request, actor: Actor): Promise<Response> {
  const head = request.method === 'HEAD';
  let cleanup: (() => void) | undefined;
  try {
    if (actor.role === 'guest' || !['admin', 'staff', 'client', 'vendor'].includes(actor.role)) fail(403, 'This account cannot open project documents.');
    if (!['GET', 'HEAD'].includes(request.method)) fail(405, 'Only document reads are supported.');
    const scope = viewerScope(actor);
    const route = routeFor(request, scope);
    const origin = upstreamOrigin();
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => { clearTimeout(timer); timer = setTimeout(() => controller.abort(), 30_000); timer.unref?.(); };
    const abort = () => controller.abort();
    request.signal.addEventListener('abort', abort, { once: true });
    if (request.signal.aborted) controller.abort();
    cleanup = () => { clearTimeout(timer); request.signal.removeEventListener('abort', abort); controller.abort(); };
    arm();
    const json = ['catalog', 'project', 'document'].includes(route.kind);
    const headers = new Headers({ 'Accept-Encoding': 'identity' });
    if (!json && route.kind !== 'shell') for (const name of ['Range', 'If-Range', 'If-None-Match', 'If-Modified-Since']) { const value = request.headers.get(name); if (value && value.length < 1000 && !/[\r\n]/.test(value)) headers.set(name, value); }
    const upstream = await fetch(origin + route.pathname + route.search, { method: json ? 'GET' : request.method, headers, redirect: 'manual', cache: 'no-store', signal: controller.signal });
    if (upstream.headers.get('X-Takeoff-Bundle-Id') !== scope.bundleId || upstream.headers.get('X-Takeoff-Manifest-Sha256') !== scope.manifestSha256) fail(502, 'The viewer publication does not match the authorized bundle.');
    if (upstream.status >= 300 && upstream.status < 400 && upstream.status !== 304) fail(502, 'The viewer attempted an unsupported redirect or response.');
    const output = viewerResponseHeaders();
    if (json) {
      if (upstream.status !== 200) fail(upstream.status === 404 ? 404 : 502, 'The viewer document is unavailable.');
      const filtered = filterJson(await readJson(upstream), route, scope);
      output.set('Content-Type', 'application/json');
      const body = JSON.stringify(filtered); output.set('Content-Length', String(Buffer.byteLength(body)));
      cleanup(); cleanup = undefined;
      return new Response(head ? null : body, { headers: output });
    }
    if (![200, 206, 304, 404, 416].includes(upstream.status)) fail(502, 'The viewer resource is unavailable.');
    if (upstream.status === 404) fail(404, 'Viewer resource not found.');
    for (const name of ['Accept-Ranges', 'Content-Range', 'ETag', 'Last-Modified', 'Content-Length']) {
      const value = upstream.headers.get(name);
      if (value && value.length < 1000 && !/[\r\n]/.test(value)) output.set(name, value);
    }
    let media: string;
    if (route.kind === 'shell') media = 'text/html; charset=utf-8';
    else if (route.kind === 'static') media = route.pathname.endsWith('.css') ? 'text/css' : /\.m?js$/.test(route.pathname) ? 'text/javascript' : route.pathname.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream';
    else {
      const supplied = upstream.headers.get('Content-Type')?.split(';')[0].toLowerCase() || '';
      media = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(supplied) ? supplied : 'application/octet-stream';
      output.set('Content-Disposition', media === 'application/octet-stream' ? 'attachment' : 'inline');
    }
    output.set('Content-Type', media);
    if (head || [304, 416].includes(upstream.status) || !upstream.body) {
      await upstream.body?.cancel(); cleanup(); cleanup = undefined;
      return new Response(null, { status: upstream.status, headers: output });
    }
    const reader = upstream.body.getReader(), finish = cleanup; cleanup = undefined;
    const body = new ReadableStream<Uint8Array>({
      async pull(target) { try { arm(); const chunk = await reader.read(); if (chunk.done) { finish(); target.close(); } else target.enqueue(chunk.value); } catch { finish(); target.error(new Error('The drawing transfer was interrupted.')); } },
      async cancel() { finish(); await reader.cancel().catch(() => {}); },
    });
    return new Response(body, { status: upstream.status, headers: output });
  } catch (error) { cleanup?.(); return viewerFailure(error, head); }
}
