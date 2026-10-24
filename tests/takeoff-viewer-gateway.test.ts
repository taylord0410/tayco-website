import { reviewAuditReport } from '../lib/review-audit';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type IncomingHttpHeaders } from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { type Actor, acceptInvitation, createInvitation, createSession, provisionAdmin, requireActor, requireProject, revokeUserSessionsPrivately, sessionCookie } from '../lib/auth';
import { NextRequest } from 'next/server';
import { database, execute, registerDocument } from '../lib/erp';
import { handleViewerRequest } from '../lib/takeoff-viewer-gateway';
import { GET, HEAD, POST } from '../app/api/takeoff-viewer/[[...path]]/route';

const prefix = '/api/takeoff-viewer';
type Mode = 'ok' | 'redirect' | 'malformed' | 'oversize' | 'bundle' | 'link' | 'otherlink' | 'missingpin' | 'pin' | 'docx' | 'failure' | 'holdpdf' | 'holdheaders' | 'shelloversize';
type Fixture = { actor: Actor; projectId: string; filename: string; seen: { path: string; method: string; headers: IncomingHttpHeaders }[]; state: { mode: Mode; pdfDone: boolean;releasePdf?:()=>void;waitingForHeaders?:()=>void }; cookie: string };
const req = (tail = '/', init?: ConstructorParameters<typeof NextRequest>[1]) => new NextRequest('https://tayco.test' + prefix + tail, init);
const doc = (id: string, context = 'ctx-a') => ({ id, title: 'Fixture drawing', kind: 'drawing_pdf', page_count: 2, source_name: 'fixture.pdf', revisions: [{ document_id: 'doc-private', source: 'SECRET REVISION' }], finance: { budgetUsd: 999999, source: 'SECRET FINANCE' }, raw_source_path: '/internal/source-private.pdf', project_key: context, source_sha256: 'c'.repeat(64), metadata: { related_documents: ['doc-private'], secret: 'SECRET META' }, references: ['SECRET REFERENCE'], declared_scale: { status: 'unverified_text_candidates', candidates: [{ text: '1/4 in = 1 ft (candidate only)', page: 1, document_id: 'doc-private' }], calibration_applied: false, private_metadata: 'SECRET SCALE' }, ocr_status: null, index_status: 'indexed', calibration_status: null,
  index: { label: 'Authorized extract', pages: [{ page_number: 1, title: 'Fixture sheet', text_available: true, sheet_marks_candidates: ['A-101', 'S-201'], private_metadata: 'SECRET PAGE', document_id: 'doc-private', asset_url: 'https://outside.test/secret' }], text: 'Authorized document extract', related_documents: ['doc-private'] },
  measurements: [{ description: 'Fixture area', quantity: 12, unit: 'sf', document_id: 'doc-private', path: '/internal/file' }], boq: [{ description: 'Fixture item', quantity: 3, unit: 'ea', url: 'https://outside.test' }], paragraphs: [{ text: 'Fixture paragraph', related_documents: ['doc-private'] }], asset_url: prefix + '/api/v1/assets/asset-shared', asset_media_type: 'application/pdf' });
function protectedHeaders(response: Response) {
  assert.equal(response.headers.get('Cross-Origin-Embedder-Policy'), 'require-corp');
  assert.equal(response.headers.get('Cross-Origin-Resource-Policy'), 'same-origin');
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(response.headers.get('Vary'), 'Cookie');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(response.headers.get('X-Frame-Options'), 'SAMEORIGIN');
  assert.match(response.headers.get('Content-Security-Policy')!, /frame-ancestors 'self'/);
  for (const name of ['set-cookie', 'location', 'x-upstream-secret', 'connection', 'transfer-encoding']) assert.equal(response.headers.get(name), null);
}
async function fixture(run: (value: Fixture) => Promise<void>) {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-viewer-gateway-'));
  const keys = ['TAYCO_AUTH_DB_PATH', 'TAYCO_ERP_DB_PATH', 'TAYCO_SESSION_SECRET', 'TAYCO_TAKEOFF_RELATIONS_PATH', 'TAYCO_TAKEOFF_MAPPING_PATH', 'TAYCO_TAKEOFF_VIEWER_INTERNAL_URL'] as const;
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  process.env.TAYCO_AUTH_DB_PATH = path.join(folder, 'auth.sqlite'); process.env.TAYCO_ERP_DB_PATH = path.join(folder, 'erp.sqlite'); process.env.TAYCO_SESSION_SECRET = 'fixture-only-secret-'.repeat(4);
  const adminId = await provisionAdmin('fixture-admin@example.test', 'Isolated-viewer-password-2026!');
  const actor: Actor = { id: adminId, email: 'fixture-admin@example.test', role: 'admin', tenantId: 'tayco_llc', projectIds: [] };
  const project = execute(actor, randomUUID(), { action: 'create_project', name: 'Isolated gateway fixture' });
  const document = registerDocument(actor, { blobPath: 'fixture/local.pdf', name: 'fixture.pdf', contentType: 'application/pdf', type: 'project', projectId: project.id });
  const secondDocument = registerDocument(actor, { blobPath: 'fixture/second.pdf', name: 'second.pdf', contentType: 'application/pdf', type: 'project', projectId: project.id });
  const relations = { schemaVersion: 'takeoff-viewer-relations/v1', bundleId: 'fixture-bundle', relationsId: 'relations-' + 'a'.repeat(64), manifestSha256: 'b'.repeat(64),
    contexts: [{ contextKey: 'ctx-a', displayName: 'Fixture project', identityStatus: 'resolved', documentIds: ['doc-a', 'doc-b', 'doc-private'] }, { contextKey: 'ctx-secret', displayName: 'SECRET PROJECT', identityStatus: 'resolved', documentIds: ['doc-secret'] }],
    documents: [{ documentId: 'doc-b', contextKeys: ['ctx-a'], assetIds: ['asset-other-allowed'], kind: 'drawing_pdf' }, { documentId: 'doc-a', contextKeys: ['ctx-a'], assetIds: ['asset-shared'], kind: 'drawing_pdf' }, { documentId: 'doc-private', contextKeys: ['ctx-a'], assetIds: ['asset-shared'], kind: 'drawing_pdf' }, { documentId: 'doc-secret', contextKeys: ['ctx-secret'], assetIds: ['asset-secret'], kind: 'drawing_pdf' }],
    assets: [{ assetId: 'asset-other-allowed', documentIds: ['doc-b'] }, { assetId: 'asset-shared', documentIds: ['doc-a', 'doc-private'] }, { assetId: 'asset-secret', documentIds: ['doc-secret'] }] };
  const raw = JSON.stringify(relations);
  process.env.TAYCO_TAKEOFF_RELATIONS_PATH = path.join(folder, 'relations.json'); writeFileSync(process.env.TAYCO_TAKEOFF_RELATIONS_PATH, raw);
  process.env.TAYCO_TAKEOFF_MAPPING_PATH = path.join(folder, 'mapping.json'); writeFileSync(process.env.TAYCO_TAKEOFF_MAPPING_PATH, JSON.stringify({ schemaVersion: 'tayco-takeoff-viewer-access/v1', bundleId: relations.bundleId, relationsSha256: createHash('sha256').update(raw).digest('hex'), mappings: [{ tenantId: actor.tenantId, projectId: project.id, contextKey: 'ctx-a', documents: [{ viewerDocumentId: 'doc-a', erpDocumentId: document.id }, { viewerDocumentId: 'doc-b', erpDocumentId: secondDocument.id }] }] }));
  const seen: Fixture['seen'] = [], state:Fixture['state'] = { mode: 'ok' as Mode, pdfDone: false };
  const server = createServer((request, response) => {
    seen.push({ path: request.url!, method: request.method!, headers: request.headers });
    if (state.mode !== 'missingpin') { response.setHeader('X-Takeoff-Bundle-Id', relations.bundleId); response.setHeader('X-Takeoff-Manifest-Sha256', state.mode === 'pin' ? 'e'.repeat(64) : relations.manifestSha256); }
    response.setHeader('Set-Cookie', 'upstream=secret'); response.setHeader('X-Upstream-Secret', 'hidden');
    response.setHeader('Cache-Control', 'public, max-age=9999'); response.setHeader('Cross-Origin-Embedder-Policy', ['require-corp', 'unsafe-none']);
    if (state.mode === 'redirect') { response.writeHead(302, { Location: 'http://outside.test/secret' }); response.end(); return; }
    if (state.mode === 'failure') { response.writeHead(503); response.end('SECRET INTERNAL ERROR'); return; }
    const tail = request.url!.slice(prefix.length).split('?')[0];
    if (tail.startsWith('/api/v1/') && !tail.includes('/assets/')) {
      response.setHeader('Content-Type', 'application/json');
      if (state.mode === 'malformed') { response.end('{broken'); return; }
      if (state.mode === 'oversize') { response.write('{"padding":"'); response.write('x'.repeat(4 * 1024 * 1024 + 1)); response.end('"}'); return; }
      let result: unknown;
      if (tail === '/api/v1/projects') result = { bundle_id: state.mode === 'bundle' ? 'wrong-bundle' : relations.bundleId, projects: [{ key: 'ctx-a', display_name: 'Fixture project', identity_status: 'resolved', metadata: { related_documents: ['doc-private'] }, document_count: 2, document_kinds: ['drawing_pdf', 'SECRET KIND'] }, { key: 'ctx-secret', display_name: 'SECRET PROJECT', identity_status: 'resolved', metadata: {}, document_count: 1, document_kinds: ['drawing_pdf'] }] };
      else if (tail === '/api/v1/projects/ctx-a') result = { key: 'ctx-a', display_name: 'Fixture project', identity_status: 'resolved', metadata: { related_documents: ['doc-private'] }, documents: [doc('doc-a'), doc('doc-b'), doc('doc-private')] };
      else if (tail === '/api/v1/documents/doc-a') result = { ...doc('doc-a'), ...(state.mode === 'link' ? { asset_url: 'https://outside.test/file.pdf' } : state.mode === 'otherlink' ? { asset_url: prefix + '/api/v1/assets/asset-other-allowed' } : state.mode === 'docx' ? { kind: 'processed_docx', page_count: null, paragraphs: ['Paragraph one', { text: 'Paragraph two', document_id: 'doc-private' }], index: { label: 'Processed text', paragraphs: ['Index paragraph'], text_is_candidate_extraction: true, full_text_or_OCR_claimed: false, metadata: { secret: 'SECRET INDEX META' } } } : {}) };
      else { response.statusCode = 404; response.end('{}'); return; }
      response.end(JSON.stringify(result)); return;
    }
    if (tail === '/api/v1/assets/asset-shared') {
      const content = Buffer.from('%PDF-fixture-bytes');
      response.setHeader('Content-Type', 'application/pdf'); response.setHeader('Accept-Ranges', 'bytes'); response.setHeader('ETag', '"fixture-etag"');
      if (request.headers.range === 'bytes=99-') { response.writeHead(416, { 'Content-Range': 'bytes */' + content.length }); response.end(); return; }
      if (request.headers.range) { response.writeHead(206, { 'Content-Range': 'bytes 1-3/' + content.length, 'Content-Length': 3 }); response.end(request.method === 'HEAD' ? undefined : content.subarray(1, 4)); return; }
      response.setHeader('Content-Length', content.length);
      if (request.method === 'HEAD') { response.end(); return; }
      if(state.mode==='holdheaders'){state.releasePdf=()=>response.end(content);state.waitingForHeaders?.();return;}
      state.pdfDone = false; response.write(content.subarray(0, 4));
      const finish=()=>{state.pdfDone=true;response.end(content.subarray(4));};
      if(state.mode==='holdpdf')state.releasePdf=finish;else setTimeout(finish,100);
      return;
    }
    if(state.mode==='shelloversize'){response.setHeader('Content-Type','text/html');response.end('x'.repeat(512*1024+1));return;}
    response.setHeader('Content-Type', tail.endsWith('.css') ? 'text/css' : tail.includes('/static/') ? 'text/javascript' : 'text/html');
    response.end(request.method === 'HEAD' ? undefined : tail.includes('/static/') ? '/* fixture static */' : '<html><body>Fixture viewer</body></html>');
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); assert.ok(address && typeof address === 'object');
  process.env.TAYCO_TAKEOFF_VIEWER_INTERNAL_URL = 'http://127.0.0.1:' + address.port;
  try { await run({ actor, projectId: project.id, filename: process.env.TAYCO_ERP_DB_PATH, seen, state, cookie: await createSession(actor.id) }); }
  finally {
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
    database().close();
    for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
    rmSync(folder, { recursive: true, force: true });
  }
}

test('fresh authentication, guest and document scope deny before upstream traffic', async () => {
  await fixture(async ({ actor, seen, cookie, projectId }) => {
    delete process.env.TAYCO_TAKEOFF_RELATIONS_PATH;
    const guest = await handleViewerRequest(req('/api/v1/projects'), { ...actor, role: 'guest' });
    assert.equal(guest.status, 403); protectedHeaders(guest);
    assert.equal((await GET(req('/'))).status, 401);
    const unauthHead = await HEAD(req('/', { method: 'HEAD' })); assert.equal(unauthHead.status, 401); assert.equal(await unauthHead.text(), ''); protectedHeaders(unauthHead);
    assert.equal(seen.length, 0);
    const noConfig = await handleViewerRequest(req('/'), actor); assert.equal(noConfig.status, 503); protectedHeaders(noConfig);
    const auth = req('/', { headers: { cookie: sessionCookie(cookie).split(';')[0] } });
    assert.equal((await GET(auth)).status, 503);
    const invitation = createInvitation(actor, { email: 'gateway-guest@example.test', role: 'guest', tenantId: actor.tenantId, projectIds: [] });
    const guestCookie = (await acceptInvitation(invitation.token, 'gateway-guest@example.test', 'Isolated-guest-password-2026!')).cookie;
    const guestRoute = await GET(req('/api/v1/projects', { headers: { cookie: sessionCookie(guestCookie).split(';')[0] } }));
    assert.equal(guestRoute.status, 403); protectedHeaders(guestRoute);
    revokeUserSessionsPrivately(actor.email, true);
    const disabled = await GET(auth);
    assert.equal(disabled.status, 401); protectedHeaders(disabled);
    assert.equal((await handleViewerRequest(req('/'), { ...actor, role: 'client', projectIds: [projectId] })).status, 503);
    assert.equal(seen.length, 0);
  });
});

test('catalog, context and document JSON omit unauthorized sibling metadata and asset links', async () => {
  await fixture(async ({ actor, seen }) => {
    for (const tail of ['/api/v1/projects', '/api/v1/projects/ctx-a', '/api/v1/documents/doc-a']) {
      const response = await handleViewerRequest(req(tail), actor);
      assert.equal(response.status, 200); protectedHeaders(response);
      const text = await response.text();
      for (const secret of ['doc-private', 'ctx-secret', 'SECRET', 'outside.test', '/internal/file', 'related_documents', 'document_id']) assert.equal(text.includes(secret), false, secret);
      const result = JSON.parse(text);
      if (tail.endsWith('/projects')) { assert.equal(result.bundle_id, 'fixture-bundle'); assert.equal(result.projects.length, 1); assert.equal(result.projects[0].document_count, 2); }
      if (tail.endsWith('/ctx-a')) { assert.equal(result.documents.length, 2); assert.equal(result.documents[0].id, 'doc-a'); }
      if (tail.endsWith('/doc-a')) { assert.equal(result.asset_url, prefix + '/api/v1/assets/asset-shared'); assert.equal(result.measurements[0].quantity, 12); assert.equal(result.boq[0].quantity, 3); assert.equal(result.index.pages[0].page_number, 1); assert.equal(result.index.pages[0].text_available, true); assert.deepEqual(result.index.pages[0].sheet_marks_candidates, ['A-101', 'S-201']); assert.deepEqual(result.declared_scale, { status: 'unverified_text_candidates', candidates: [{ text: '1/4 in = 1 ft (candidate only)', page: 1 }], calibration_applied: false }); assert.equal(result.paragraphs[0].text, 'Fixture paragraph'); }
    }
    const before = seen.length;
    for (const tail of ['/api/v1/projects/ctx-secret', '/api/v1/documents/doc-private', '/api/v1/documents/doc-secret', '/api/v1/assets/asset-secret']) {
      const response = await handleViewerRequest(req(tail), actor); assert.equal(response.status, 404); protectedHeaders(response);
    }
    assert.equal(seen.length, before);
  });
});

test('GET HEAD and Range preserve binary streaming and never forward browser credentials', async () => {
  await fixture(async ({ actor, seen, state, cookie }) => {
    const headers = { cookie: 'private-browser-secret', Authorization: 'Bearer browser-secret', 'X-Forwarded-For': '203.0.113.5', Range: 'bytes=1-3', 'If-Range': '"fixture-etag"' };
    const range = await handleViewerRequest(req('/api/v1/assets/asset-shared', { headers }), actor);
    assert.equal(range.status, 206); assert.equal(await range.text(), 'PDF'); assert.match(range.headers.get('Content-Range')!, /^bytes 1-3\//); protectedHeaders(range);
    const last = seen.at(-1)!; assert.equal(last.path, prefix + '/api/v1/assets/asset-shared'); assert.equal(last.headers.range, 'bytes=1-3');
    for (const name of ['cookie', 'authorization', 'x-forwarded-for']) assert.equal(last.headers[name], undefined);
    const head = await HEAD(req('/api/v1/assets/asset-shared', { method: 'HEAD', headers: { cookie: sessionCookie(cookie).split(';')[0] } }));
    assert.equal(head.status, 200); assert.equal(await head.text(), ''); assert.equal(seen.at(-1)!.method, 'HEAD'); protectedHeaders(head);
    const jsonHead = await handleViewerRequest(req('/api/v1/documents/doc-a', { method: 'HEAD' }), actor);
    assert.equal(jsonHead.status, 200); assert.equal(await jsonHead.text(), ''); assert.equal(seen.at(-1)!.method, 'GET'); protectedHeaders(jsonHead);
    const invalidRange = await handleViewerRequest(req('/api/v1/assets/asset-shared', { headers: { Range: 'bytes=99-' } }), actor);
    assert.equal(invalidRange.status, 416); assert.match(invalidRange.headers.get('Content-Range')!, /^bytes \*\//); protectedHeaders(invalidRange);
    const stream = await handleViewerRequest(req('/api/v1/assets/asset-shared'), actor);
    assert.equal(state.pdfDone, false);
    assert.equal(await stream.text(), '%PDF-fixture-bytes'); assert.equal(state.pdfDone, true); protectedHeaders(stream);
  });
});

test('strict routes, shell options and methods reject traversal, query injection and arbitrary targets', async () => {
  await fixture(async ({ actor, seen, cookie }) => {
    for (const tail of ['/healthz', '/arbitrary', '/static/other.js', '/static/pdfjs/build/other.mjs', '/static/pdfjs/cmaps/%2e%2e/private', '/static/pdfjs/cmaps/a%2fb', '/static//viewer.js', '/api/v1/projects?url=https://outside.test', '/api/v1/assets/asset-shared?x=1', '/?embed=1&embed=1', '/?unknown=1', '/?page=0', '/?page=NaN', '/?project=ctx-secret', '/?document=doc-private', '/?project=ctx-secret&document=doc-a']) {
      const response = await handleViewerRequest(req(tail), actor); assert.ok([400, 404].includes(response.status), tail); protectedHeaders(response);
    }
    assert.equal(seen.length, 0);
    const method = await POST(req('/', { method: 'POST', headers: { cookie: sessionCookie(cookie).split(';')[0] } }));
    assert.equal(method.status, 405); protectedHeaders(method);
    assert.equal(seen.length, 0);
    for (const tail of ['/?embed=1&project=ctx-a&document=doc-a&page=2', '/viewer', '/viewer/', '/static/viewer.css', '/static/viewer.js', '/static/i18n.js', '/static/pdfjs/build/pdf.mjs', '/static/pdfjs/build/pdf.worker.mjs', '/static/pdfjs/LICENSE', '/static/pdfjs/cmaps/Adobe-CNS1-UCS2.bcmap', '/static/pdfjs/standard_fonts/FoxitSans.pfb', '/static/pdfjs/wasm/openjpeg.wasm']) {
      const response = await handleViewerRequest(req(tail), actor); assert.equal(response.status, 200, tail); protectedHeaders(response); await response.arrayBuffer();
      assert.ok(seen.at(-1)!.path.startsWith(prefix));
    }
  });
});

test('untrusted upstream JSON, bundle mismatch, redirects and availability errors fail closed', async () => {
  await fixture(async ({ actor, state }) => {
    for (const mode of ['malformed', 'oversize', 'bundle', 'redirect', 'failure'] as const) {
      state.mode = mode;
      const response = await handleViewerRequest(req('/api/v1/projects'), actor);
      assert.equal(response.status, 502, mode); protectedHeaders(response);
      const text = await response.text(); assert.equal(text.includes('SECRET'), false); assert.equal(text.includes('outside.test'), false);
    }
    for (const mode of ['link', 'otherlink', 'missingpin', 'pin'] as const) {
      state.mode = mode;
      for (const resource of ['/api/v1/documents/doc-a', '/api/v1/assets/asset-shared']) {
        if ((mode === 'link' || mode === 'otherlink') && resource.includes('/assets/')) continue;
        const rejected = await handleViewerRequest(req(resource), actor); assert.equal(rejected.status, 502, mode); protectedHeaders(rejected);
      }
    }
    state.mode = 'docx';
    const processed = await handleViewerRequest(req('/api/v1/documents/doc-a'), actor);
    assert.equal(processed.status, 200); const parsed = await processed.json();
    assert.equal(parsed.page_count, null); assert.deepEqual(parsed.paragraphs, ['Paragraph one', { text: 'Paragraph two' }]);
    assert.deepEqual(parsed.index.paragraphs, ['Index paragraph']); assert.equal(parsed.index.text_is_candidate_extraction, true);
    assert.equal(JSON.stringify(parsed).includes('SECRET'), false); assert.equal(JSON.stringify(parsed).includes('doc-private'), false);
    state.mode = 'ok';
    process.env.TAYCO_TAKEOFF_VIEWER_INTERNAL_URL = 'http://127.0.0.1:1';
    const unavailable = await handleViewerRequest(req('/'), actor); assert.equal(unavailable.status, 502); protectedHeaders(unavailable);
  });
});

test('explicit v2 guest review grants only approved October documents through fresh authenticated routes', async () => {
  await fixture(async ({ actor, projectId, seen }) => {
    const invitation = createInvitation(actor, { email: 'approved-review@example.test', role: 'guest', tenantId: actor.tenantId, projectIds: [] });
    const cookie = (await acceptInvitation(invitation.token, 'approved-review@example.test', 'Isolated-review-password-2026!')).cookie;
    const headers = { cookie: sessionCookie(cookie).split(';')[0] };
    const guest = await requireActor(req('/', { headers }));
    assert.deepEqual(guest.projectIds, []); assert.equal(guest.role, 'guest'); assert.equal(guest.vendorId, undefined);
    assert.throws(() => requireProject(guest, projectId, actor.tenantId), (error: unknown) => error instanceof Error && 'status' in error && error.status === 403);
    const legacy = await GET(req('/api/v1/projects', { headers }));
    assert.equal(legacy.status, 403); protectedHeaders(legacy); assert.equal(seen.length, 0);
    const mappingPath = process.env.TAYCO_TAKEOFF_MAPPING_PATH!;
    const mapping = JSON.parse(readFileSync(mappingPath, 'utf8'));
    mapping.schemaVersion = 'tayco-takeoff-viewer-access/v2';
    mapping.guestReviews = [{ tenantId: actor.tenantId, guestId: guest.id, projectId, period: '2026-10', viewerDocumentIds: ['doc-a'] }];
    writeFileSync(mappingPath, JSON.stringify(mapping));
    const catalog = await GET(req('/api/v1/projects', { headers }));
    assert.equal(catalog.status, 200); protectedHeaders(catalog);
    const listed = await catalog.json(); assert.equal(listed.projects.length, 1); assert.equal(listed.projects[0].key, 'ctx-a'); assert.equal(listed.projects[0].document_count, 1);
    const context = await GET(req('/api/v1/projects/ctx-a', { headers }));
    assert.equal(context.status, 200);
    assert.deepEqual((await context.json()).documents.map((item: { id: string }) => item.id), ['doc-a']);
    const detail = await GET(req('/api/v1/documents/doc-a', { headers }));
    assert.equal(detail.status, 200); protectedHeaders(detail);
    const text = await detail.text(), approved = JSON.parse(text);
    assert.equal(approved.id, 'doc-a'); assert.equal(approved.asset_url, prefix + '/api/v1/assets/asset-shared');
    for (const secret of ['doc-private', 'doc-b', 'ctx-secret', 'SECRET', 'raw_source_path', 'source-private', 'finance', 'budgetUsd', '999999', 'related_documents']) assert.equal(text.includes(secret), false, secret);
    const beforeBridge=seen.length,bridge=await GET(req('/static/viewer-review-events.js',{headers}));
    assert.equal(bridge.status,200);assert.match(await bridge.text(),/postMessage/);assert.equal(seen.length,beforeBridge);
    const head = await HEAD(req('/api/v1/assets/asset-shared', { method: 'HEAD', headers }));
    assert.equal(head.status, 200); assert.equal(await head.text(), ''); protectedHeaders(head);
    const partial = await GET(req('/api/v1/assets/asset-shared', { headers: { ...headers, Range: 'bytes=1-3' } }));
    assert.equal(partial.status, 206); assert.equal(await partial.text(), 'PDF'); protectedHeaders(partial);
    const transport=reviewAuditReport(actor).events.filter(e=>e.kind.startsWith('document.'));
    assert.equal(transport.length,2); // HEAD and JSON metadata never complete a PDF transport.
    assert.equal(transport.find(e=>e.kind==='document.completed')!.bytesSent,3);
    assert.equal(transport.every(e=>e.resourceKind==='asset'&&e.resourceId==='asset-shared'&&e.responseKind==='range'),true);
    const previousCalls = seen.length;
    for (const tail of ['/api/v1/documents/doc-private', '/api/v1/documents/doc-b', '/api/v1/documents/doc-secret', '/api/v1/projects/ctx-secret', '/api/v1/assets/asset-other-allowed', '/api/v1/assets/asset-secret', '/api/v1/assets/asset-source-private', '/api/v1/source']) {
      const denied = await GET(req(tail, { headers })); assert.equal(denied.status, 404, tail); protectedHeaders(denied);
    }
    assert.equal(seen.length, previousCalls);
    assert.equal(reviewAuditReport(actor).events.filter(e=>e.kind==='access.denied').every(e=>!('resourceId'in e)),true);
    const otherInvitation = createInvitation(actor, { email: 'unapproved-review@example.test', role: 'guest', tenantId: actor.tenantId, projectIds: [] });
    const otherCookie = (await acceptInvitation(otherInvitation.token, 'unapproved-review@example.test', 'Isolated-review-password-2026!')).cookie;
    const outsider = await GET(req('/api/v1/projects', { headers: { cookie: sessionCookie(otherCookie).split(';')[0] } }));
    assert.equal(outsider.status, 403); protectedHeaders(outsider); assert.equal(seen.length, previousCalls);
    mapping.guestReviews = []; writeFileSync(mappingPath, JSON.stringify(mapping));
    const revoked = await GET(req('/api/v1/documents/doc-a', { headers }));
    assert.equal(revoked.status, 403); protectedHeaders(revoked); assert.equal(seen.length, previousCalls);
  });
});

test('upstream origin is configuration-only and rejects credentials, paths and unsafe plain HTTP', async () => {
  await fixture(async ({ actor, seen }) => {
    for (const origin of ['http://outside.test', 'ftp://localhost', 'http://user:secret@localhost', 'http://localhost/base', 'http://localhost?url=x', 'http://localhost/#secret']) {
      process.env.TAYCO_TAKEOFF_VIEWER_INTERNAL_URL = origin;
      const response = await handleViewerRequest(req('/'), actor); assert.equal(response.status, 503, origin); protectedHeaders(response);
    }
    assert.equal(seen.length, 0);
  });
});


test('revocation while the upstream read waits prevents the next chunk through the actual route',async()=>{
 await fixture(async({actor,state,cookie})=>{
  state.mode='holdpdf';
  const headers={cookie:sessionCookie(cookie).split(';')[0]};
  const response=await GET(req('/api/v1/assets/asset-shared',{headers}));assert.equal(response.status,200);
  const reader=response.body!.getReader();
  assert.equal(Buffer.from((await reader.read()).value!).toString(),'%PDF');
  const next=reader.read();
  await new Promise<void>(resolve=>setImmediate(resolve));
  revokeUserSessionsPrivately(actor.email);
  state.releasePdf!();
  await assert.rejects(next,/interrupted/);
 });
});
test('guest absolute deadline reached during a pending PDF read cuts the stream',async()=>{
 await fixture(async({actor,state,projectId})=>{
  const originalNow=Date.now;
  try{
   const invitation=createInvitation(actor,{email:'slow-review@example.test',role:'guest',tenantId:actor.tenantId,projectIds:[]});
   const cookie=(await acceptInvitation(invitation.token,'slow-review@example.test','Isolated-review-password-2026!')).cookie;
   const headers={cookie:sessionCookie(cookie).split(';')[0]},guest=await requireActor(req('/',{headers}));
   const mappingPath=process.env.TAYCO_TAKEOFF_MAPPING_PATH!,mapping=JSON.parse(readFileSync(mappingPath,'utf8'));
   mapping.schemaVersion='tayco-takeoff-viewer-access/v2';
   mapping.guestReviews=[{tenantId:actor.tenantId,guestId:guest.id,projectId,period:new Date().toISOString().slice(0,7),viewerDocumentIds:['doc-a']}];
   writeFileSync(mappingPath,JSON.stringify(mapping));
   state.mode='holdpdf';
   const response=await GET(req('/api/v1/assets/asset-shared',{headers}));assert.equal(response.status,200);
   const reader=response.body!.getReader();assert.equal(Buffer.from((await reader.read()).value!).toString(),'%PDF');
   const next=reader.read();await new Promise<void>(resolve=>setImmediate(resolve));
   Date.now=()=>invitation.expiresAt+1;
   state.releasePdf!();await assert.rejects(next,/interrupted/);
   assert.equal((await HEAD(req('/api/v1/assets/asset-shared',{method:'HEAD',headers}))).status,401);
  }finally{Date.now=originalNow;state.releasePdf?.();}
 });
});


test('revocation while waiting for provider headers denies the response before any source bytes',async()=>{
 await fixture(async({actor,state,cookie})=>{
  state.mode='holdheaders';
  let ready!:()=>void;const waiting=new Promise<void>(resolve=>{ready=resolve;});state.waitingForHeaders=ready;
  const pending=GET(req('/api/v1/assets/asset-shared',{headers:{cookie:sessionCookie(cookie).split(';')[0]}}));
  await waiting;revokeUserSessionsPrivately(actor.email);state.releasePdf!();
  const response=await pending;assert.equal(response.status,401);protectedHeaders(response);assert.equal((await response.text()).includes('%PDF'),false);
 });
});

test('authenticated shell rewriting and control bridge remain bounded, protected and same-origin',async()=>{
 await fixture(async({cookie,seen,state,actor})=>{
  const headers={cookie:sessionCookie(cookie).split(';')[0]};
  const shell=await GET(req('/viewer/',{headers}));assert.equal(shell.status,200);protectedHeaders(shell);
  const html=await shell.text();assert.match(html,/<script src="\/api\/takeoff-viewer\/static\/viewer-review-events\.js" defer><\/script>/);
  assert.equal(Number(shell.headers.get('content-length')),Buffer.byteLength(html));
  const head=await HEAD(req('/viewer/',{method:'HEAD',headers}));assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(head.headers.get('content-length'),shell.headers.get('content-length'));
  const before=seen.length,script=await GET(req('/static/viewer-review-events.js',{headers}));assert.equal(script.status,200);protectedHeaders(script);assert.match(await script.text(),/tayco-review-viewer-control/);assert.equal(seen.length,before);
  assert.equal((await GET(req('/static/viewer-review-events.js'))).status,401);assert.equal((await GET(req('/static/viewer-review-events.js?extra=private',{headers}))).status,400);assert.equal(seen.length,before);
  const invitation=createInvitation(actor,{email:'bridge-unapproved@example.test',role:'guest',tenantId:actor.tenantId,projectIds:[]});
  const guestCookie=(await acceptInvitation(invitation.token,'bridge-unapproved@example.test','Isolated-review-password-2026!')).cookie;
  assert.equal((await GET(req('/static/viewer-review-events.js',{headers:{cookie:sessionCookie(guestCookie).split(';')[0]}}))).status,403);assert.equal(seen.length,before);
  state.mode='shelloversize';const oversized=await GET(req('/viewer/',{headers}));assert.equal(oversized.status,502);assert.equal((await oversized.text()).includes('xxxx'),false);
 });
});
