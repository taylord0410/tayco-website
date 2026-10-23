// Server-only projection. Import DTOs with `import type` from client components.
import type { Actor } from './auth';
import { database, ErpError, type Entry } from './erp';
import { isFinancialDate } from './financial-periods';
import { isValidUsdAmount } from './financial-values';
import { COMMERCIAL_STAGE_CODES } from './commercial-stages';
import { guestMonthlyEstimateSummary, type GuestMonthlyEstimateSummary } from './monthly-management-estimates';
import { guestProjectReviews, viewerScope } from './takeoff-viewer-access';
import { currentReportingPeriod, isGuestReportingPeriod, requireGuestPeriod } from './guest-period';
import { isGuestSection, type GuestSection } from './guest-sections';
import { guestModuleProjection, type GuestModuleRecord } from './guest-module-projection';
export type { GuestModuleRecord } from './guest-module-projection';

export type GuestConsoleProject = { id: string; name: string; period: string; status: string; progress: number | null; location: string | null; commercialStage: string | null; documentCount: number };
export type GuestConsoleEstimate = { id: string; projectId: string; projectName: string; name: string; amountUsd: number | null; currency: 'USD'; estimatedOn: string | null; sourceLabel: string | null };
export type GuestConsoleDocument = { id: string; projectId: string; projectName: string; name: string; contentType: string; available: boolean; viewerHref: string | null; downloadHref: string | null };
export type GuestConsoleData = {
  actor: { id: string; email: string; role: 'guest' }; currentPeriod: string; period: string; asOf: string; detailAllowed: boolean;
  historicalSummary: GuestMonthlyEstimateSummary; projects: GuestConsoleProject[]; estimates: GuestConsoleEstimate[]; documents: GuestConsoleDocument[]; moduleRecords: GuestModuleRecord[];
};
type Options = { period?: string; section?: GuestSection; now?: Date };
type Row = Record<string, unknown> & { id: string; project_id: string; created_at: string };
const idPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/;
const MAX_ROWS = 5000;
const common = {
  review_period: '$.reviewPeriod', reporting_period: '$.reportingPeriod', period: '$.period',
  deleted_at: '$.deletedAt', purged_at: '$.purgedAt', revoked_at: '$.revokedAt', expires_at: '$.expiresAt', purge_state: '$.purgeState',
  source: '$.source', source_project: '$.sourceProjectSlug', source_bundle: '$.sourceBundleId', source_context: '$.sourceContextKey',
};
function assertGuest(actor: Actor) {
  if (!actor || actor.role !== 'guest' || typeof actor.id !== 'string' || !idPattern.test(actor.id) ||
    typeof actor.tenantId !== 'string' || !idPattern.test(actor.tenantId) || typeof actor.email !== 'string' || !actor.email.trim() || actor.email.length > 254 ||
    /[\u0000-\u001f\u007f-\u009f]/.test(actor.email) || !Array.isArray(actor.projectIds) || actor.projectIds.length !== 0 || actor.vendorId !== undefined)
    throw new ErpError(403, 'Not authorized for the guest console.');
}
function safeLabel(value: unknown, max = 200): string | null {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f\u007f-\u009f\\<>]|(?:https?:|file:|[A-Za-z]:[\/])|(?:^|\s)[^\s@]+@[^\s@]+|(?:^|\s)\/[^\s]+/i.test(value)) return null;
  return value.trim();
}
/** Every SQL JSON expression protects itself, independent of SQLite predicate evaluation order. */
function rows(actor: Actor, kind: 'project' | 'estimate' | 'document', fields: Record<string, string>, projectIds?: string[]): Row[] {
  if (projectIds && !projectIds.length) return [];
  const columns = Object.entries({ ...common, ...fields }).map(([alias, field]) => {
    const safe = "CASE WHEN json_valid(payload) THEN payload ELSE '{}' END";
    const type = `json_type(${safe},'${field}')`, value = `json_extract(${safe},'${field}')`;
    if (['progress_type','amount_type'].includes(alias)) return `${type} AS ${alias}`;
    if (['source_project','source_bundle','source_context'].includes(alias)) return `CASE WHEN ${type} IS NOT NULL AND ${type}<>'null' THEN 1 ELSE 0 END AS ${alias}`;
    if (alias === 'blob_present') return `CASE WHEN ${type}='text' AND length(${value})>0 THEN 1 ELSE 0 END AS ${alias}`;
    // JSON containers must never become a seemingly safe display string.
    return ['name','title','location','source_name'].includes(alias) ? `CASE WHEN ${type} IN ('object','array') THEN NULL ELSE ${value} END AS ${alias}` : `${value} AS ${alias}`;
  }).join(',');
  const result = database().prepare(`SELECT id,project_id,created_at,${columns} FROM records
    WHERE tenant_id=? AND kind=? AND length(payload)<=1048576 AND json_valid(payload)
    AND json_type(CASE WHEN json_valid(payload) THEN payload ELSE '{}' END)='object'
    ${projectIds ? `AND project_id IN (${projectIds.map(() => '?').join(',')})` : ''}
    ORDER BY id LIMIT ${MAX_ROWS + 1}`).all(actor.tenantId, kind, ...(projectIds ?? [])) as Row[];
  if (result.length > MAX_ROWS) throw new ErpError(503, 'The guest projection requires operator review before reporting this many records.');
  return result.filter(row => idPattern.test(row.id) && idPattern.test(row.project_id));
}
function date(value: unknown): string | null {
  if (isFinancialDate(value)) return value;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value) || !isFinancialDate(value.slice(0, 10))) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : null;
}
function active(row: Row, now: Date) {
  if (row.deleted_at != null || row.purged_at != null || row.revoked_at != null || row.purge_state != null || ['revoked','expired','deleted','purged','rejected'].includes(String(row.status))) return false;
  if (row.expires_at != null && row.expires_at !== '') {
    const expiry = date(row.expires_at);
    if (!expiry || (isFinancialDate(row.expires_at) ? expiry < now.toISOString().slice(0, 10) : Date.parse(String(row.expires_at)) <= now.getTime())) return false;
  }
  return true;
}
function declaredPeriod(row: Row): string | null | undefined {
  const values = ['review_period', 'reporting_period', 'period'].map(field => row[field]).filter(value => value !== undefined && value !== null);
  if (!values.length) return undefined;
  if (values.some(value => !isGuestReportingPeriod(value) || value !== values[0])) return null;
  return values[0] as string;
}
function projectPeriod(row: Row, granted?: string): string | null {
  const explicit = declaredPeriod(row); if (explicit !== undefined) return explicit;
  // Only manually created team projects use the recorded month. Imported source dates are never invented.
  if (row.source === 'team' && !row.source_project && !row.source_bundle && !row.source_context) return date(row.created_at)?.slice(0, 7) ?? null;
  return isGuestReportingPeriod(granted) ? granted : null;
}
function projected(actor: Actor, now: Date) {
  const current = currentReportingPeriod(now);
  const grants = new Map(guestProjectReviews(actor, now).map(grant => [grant.projectId, grant]));
  const sourceProjects = rows(actor, 'project', { name: '$.name', status: '$.status', progress: '$.progress', progress_type: '$.progress', location: '$.location', stage: '$.commercialProgress.currentStage' });
  const projects: GuestConsoleProject[] = [];
  for (const row of sourceProjects) {
    if (row.id !== row.project_id || !active(row, now) || projectPeriod(row, grants.get(row.id)?.period) !== current) continue;
    projects.push({ id: row.id, name: safeLabel(row.name) ?? 'Project', period: current,
      status: typeof row.status === 'string' && ['planning','active','on_hold','paused','completed','cancelled'].includes(row.status) ? row.status : 'unknown',
      progress: ['integer','real'].includes(String(row.progress_type)) && typeof row.progress === 'number' && Number.isFinite(row.progress) && row.progress >= 0 && row.progress <= 100 ? row.progress : null,
      location: safeLabel(row.location), commercialStage: typeof row.stage === 'string' && (COMMERCIAL_STAGE_CODES as readonly string[]).includes(row.stage) ? row.stage : null, documentCount: 0 });
  }
  const projectMap = new Map(projects.map(project => [project.id, project])), ids = [...projectMap.keys()];
  const estimates: GuestConsoleEstimate[] = [];
  for (const row of rows(actor, 'estimate', { name: '$.name', title: '$.title', amount: '$.amountUsd', amount_type: '$.amountUsd', currency: '$.currency', estimated_on: '$.estimatedOn', issued_on: '$.issuedOn', date_basis: '$.dateBasis', source_name: '$.sourceName', status: '$.status' }, ids)) {
    const parent = projectMap.get(row.project_id)!;
    // A parent grant cannot promote an undated or historical child estimate into the current month.
    const dates = [row.estimated_on, row.issued_on].filter(value => value !== null && value !== undefined);
    if (!active(row, now) || row.currency !== 'USD' || row.date_basis === 'unknown' || !dates.length || dates.some(value => date(value)?.slice(0, 7) !== current)) continue;
    const explicit = declaredPeriod(row); if (explicit !== undefined && explicit !== current) continue;
    estimates.push({ id: row.id, projectId: parent.id, projectName: parent.name, name: safeLabel(row.name) ?? safeLabel(row.title) ?? 'Estimate',
      amountUsd: ['integer','real'].includes(String(row.amount_type)) && isValidUsdAmount(row.amount) ? row.amount : null, currency: 'USD', estimatedOn: date(dates[0]), sourceLabel: safeLabel(row.source_name) });
  }
  const documents: GuestConsoleDocument[] = [];
  const documentRows = new Map<string, Row>();
  const scopes = new Map<string, ReturnType<typeof viewerScope> | null>();
  for (const row of rows(actor, 'document', { name: '$.name', content_type: '$.contentType', type: '$.type', storage: '$.storage', viewer_id: '$.viewerDocumentId', blob_present: '$.blobPath', status: '$.status' }, ids)) {
    if (!active(row, now) || row.type !== 'project' || ['revoked','expired','deleted','purged','rejected'].includes(String(row.status))) continue;
    const explicit = declaredPeriod(row);
    if ((explicit === undefined ? (row.storage === 'takeoff_viewer' ? grants.get(row.project_id)?.period : date(row.created_at)?.slice(0, 7)) : explicit) !== current) continue;
    const parent = projectMap.get(row.project_id)!;
    let viewerHref: string | null = null, downloadHref: string | null = null;
    if (row.storage === 'takeoff_viewer') {
      if (!scopes.has(parent.id)) { try { scopes.set(parent.id, viewerScope(actor, parent.id, now)); } catch { scopes.set(parent.id, null); } }
      if (!scopes.get(parent.id)?.documentIds.includes(String(row.viewer_id))) continue;
      viewerHref = '/portal/takeoff/' + encodeURIComponent(parent.id);
    } else if (row.blob_present === 1) {
      downloadHref = '/api/documents/' + encodeURIComponent(row.id);
    }
    const contentType = typeof row.content_type === 'string' && /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/i.test(row.content_type) && row.content_type.length <= 150 ? row.content_type : 'application/octet-stream';
    documents.push({ id: row.id, projectId: parent.id, projectName: parent.name, name: safeLabel(row.name) ?? 'Project document', contentType,
      available: Boolean(viewerHref || downloadHref), viewerHref, downloadHref });
    documentRows.set(row.id, row); parent.documentCount++;
  }
  return { projects, estimates, documents, documentRows };
}
export function guestConsoleSnapshot(actor: Actor, options: Options = {}): GuestConsoleData {
  assertGuest(actor);
  if (!options || typeof options !== 'object' || Array.isArray(options) || Object.keys(options).some(key => !['period','section','now'].includes(key))) throw new ErpError(422, 'Choose a valid guest console selection.');
  const now = options.now ?? new Date(), currentPeriod = currentReportingPeriod(now), period = options.period ?? currentPeriod, section = options.section ?? 'summary';
  if (!isGuestReportingPeriod(period) || !isGuestSection(section)) throw new ErpError(422, 'Choose a valid guest console selection.');
  if (period > currentPeriod) throw new ErpError(403, 'Not authorized for future reporting periods.');
  const detailAllowed = period === currentPeriod;
  if (!detailAllowed && section !== 'summary') requireGuestPeriod(period, now);
  const historicalSummary = guestMonthlyEstimateSummary(actor, detailAllowed ? undefined : { year: Number(period.slice(0, 4)) }, now);
  const detail = detailAllowed ? projected(actor, now) : { projects: [], estimates: [], documents: [] };
  return { actor: { id: actor.id, email: actor.email, role: 'guest' }, currentPeriod, period, asOf: now.toISOString(), detailAllowed, historicalSummary, projects: detail.projects, estimates: detail.estimates, documents: detail.documents, moduleRecords: detailAllowed ? guestModuleProjection(actor, detail.projects, now) : [] };
}

/** SERVER ONLY: raw storage metadata is loaded only after exact current-period authorization. Never serialize this Entry. */
export function guestConsoleDocument(actor: Actor, id: string, now = new Date()): Entry {
  assertGuest(actor);
  if (typeof id !== 'string' || !idPattern.test(id)) throw new ErpError(403, 'Not authorized for this project document.');
  currentReportingPeriod(now);
  const authorized = projected(actor, now).documentRows.get(id);
  if (!authorized) throw new ErpError(403, 'Not authorized for this project document.');
  const row = database().prepare("SELECT * FROM records WHERE tenant_id=? AND kind='document' AND id=? AND project_id=? AND length(payload)<=1048576 AND json_valid(payload)").get(actor.tenantId, id, authorized.project_id) as { id: string; tenant_id: string; project_id: string; owner_id: string; version: number; created_at: string; updated_at: string; payload: string } | undefined;
  if (!row) throw new ErpError(403, 'Not authorized for this project document.');
  let data: unknown; try { data = JSON.parse(row.payload); } catch { throw new ErpError(403, 'Not authorized for this project document.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new ErpError(403, 'Not authorized for this project document.');
  return { id: row.id, kind: 'document', tenantId: row.tenant_id, projectId: row.project_id, ownerId: row.owner_id, version: row.version, createdAt: row.created_at, updatedAt: row.updated_at, data: data as Entry['data'] };
}
