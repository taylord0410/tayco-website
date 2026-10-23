// Server-only whitelist reporting. Raw payloads, contacts, credentials, storage and private notes never leave this module.
import type { Actor } from './auth';
import { database, ErpError, type Kind } from './erp';
import { isFinancialDate } from './financial-periods';
import { isValidUsdAmount } from './financial-values';
import { currentReportingPeriod, isGuestReportingPeriod } from './guest-period';
import { guestProjectReviews } from './takeoff-viewer-access';
import { COMPLIANCE_CATEGORY_OPTIONS } from './project-classification';

export type GuestModuleRecord = { id: string; kind: Kind | 'team'; projectId: string | null; title: string; status: string | null; date: string | null; fields: { label: string; value: string | number | null }[] };
type Project = { id: string; name: string; period: string };
type ModuleKind = Exclude<Kind, 'project' | 'document' | 'estimate'>;
type Row = Record<string, unknown> & { id: string; project_id: string; created_at: string };
type Field = { path: string; type?: 'text' | 'number' | 'presence' };
const text = (path: string): Field => ({ path, type: 'text' });
const number = (path: string): Field => ({ path, type: 'number' });
const raw = (path: string): Field => ({ path });
const identity = /^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/;
const LIMIT = 5000;
const common: Record<string, Field> = {
  review_period: raw('$.reviewPeriod'), reporting_period: raw('$.reportingPeriod'), period: raw('$.period'),
  deleted_at: raw('$.deletedAt'), purged_at: raw('$.purgedAt'), revoked_at: raw('$.revokedAt'), purge_state: raw('$.purgeState'), expires_at: raw('$.expiresAt'),
  source: raw('$.source'), source_project: { path: '$.sourceProjectSlug', type: 'presence' }, source_bundle: { path: '$.sourceBundleId', type: 'presence' },
  source_context: { path: '$.sourceContextKey', type: 'presence' }, imported_at: { path: '$.importedAt', type: 'presence' },
  declared_project: raw('$.projectId'), status: text('$.status'),
};
const schemas: Record<ModuleKind, { company: boolean; dates: string[]; event?: boolean; fields: Record<string, Field>; statuses: string[] }> = {
  lead: { company: true, dates: [], event: true, fields: { name: text('$.name'), request_kind: text('$.kind'), project_type: text('$.projectType'), estimated_value: number('$.estimatedValueUsd') }, statuses: ['new','reviewing','waiting','quoted','accepted','closed'] },
  vendor: { company: true, dates: [], event: true, fields: { name: text('$.businessName'), trade: text('$.trades'), state: text('$.stateServed'), crew_size: number('$.crewSize') }, statuses: ['pending_review','reviewing','approved','active','returned','declined','closed'] },
  note: { company: false, dates: [], event: true, fields: { title: text('$.title'), visibility: text('$.visibility') }, statuses: [] },
  change: { company: false, dates: [], event: true, fields: { title: text('$.title') }, statuses: ['requested','reviewing','proposed','accepted','declined'] },
  hours: { company: false, dates: ['$.date','$.workDate'], fields: { trade: text('$.trade'), hours: number('$.hours') }, statuses: ['submitted','approved','returned'] },
  invoice: { company: false, dates: ['$.issuedOn','$.issueDate'], fields: { amount: number('$.amountUsd'), currency: raw('$.currency'), audience: text('$.audience') }, statuses: ['submitted','approved','paid','returned'] },
  proposal: { company: false, dates: ['$.issuedOn','$.issueDate'], fields: { title: text('$.title'), amount: number('$.amountUsd'), currency: raw('$.currency') }, statuses: ['draft','sent','accepted','declined','cancelled'] },
  bid: { company: false, dates: ['$.issuedOn','$.issueDate'], fields: { supplier: text('$.supplierName'), amount: number('$.amountUsd'), currency: raw('$.currency') }, statuses: ['submitted','reviewing','shortlisted','accepted','declined'] },
  purchase_order: { company: false, dates: ['$.issuedOn','$.issueDate'], fields: { supplier: text('$.supplierName'), amount: number('$.amountUsd'), currency: raw('$.currency') }, statuses: ['draft','issued','acknowledged','received','cancelled','closed'] },
  compliance: { company: false, dates: ['$.dueDate'], fields: { title: text('$.topic'), category: text('$.category'), jurisdiction: text('$.jurisdiction'), reviewed_on: raw('$.reviewedOn') }, statuses: ['pending','in_review','complete','not_applicable','expired'] },
  corporate_meeting: { company: true, dates: ['$.date','$.scheduledOn','$.scheduledDate'], fields: { title: text('$.title'), time: text('$.time'), priority: text('$.priority') }, statuses: ['scheduled','completed','cancelled'] },
  followup: { company: true, dates: ['$.dueDate','$.scheduledOn'], fields: { title: text('$.title'), priority: text('$.priority') }, statuses: ['open','in_progress','completed','cancelled'] },
};
function access(actor: Actor) {
  if (!actor || actor.role !== 'guest' || typeof actor.id !== 'string' || !identity.test(actor.id) || typeof actor.tenantId !== 'string' || !identity.test(actor.tenantId) ||
    !Array.isArray(actor.projectIds) || actor.projectIds.length !== 0 || actor.vendorId !== undefined) throw new ErpError(403, 'Not authorized for guest module reporting.');
}
function label(value: unknown, max = 200): string | null {
  if (typeof value !== 'string' || !value.trim() || value.length > max ||
    /[\u0000-\u001f\u007f-\u009f\\/@<>]|(?:https?:|file:|[A-Za-z]:)|(?:\d[\s().-]*){7,}|(?:token|secret|password|routing|account)\s*[:=]/i.test(value)) return null;
  return value.trim();
}
function day(value: unknown): string | null {
  if (isFinancialDate(value)) return value;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value) || !isFinancialDate(value.slice(0, 10))) return null;
  const time = new Date(value); return Number.isFinite(time.getTime()) ? time.toISOString().slice(0, 10) : null;
}
function period(row: Row): string | null | undefined {
  const values = [row.review_period, row.reporting_period, row.period].filter(value => value !== null && value !== undefined);
  if (!values.length) return undefined;
  return values.every(value => isGuestReportingPeriod(value) && value === values[0]) ? values[0] as string : null;
}
function active(row: Row, now: Date) {
  if ([row.deleted_at,row.purged_at,row.revoked_at,row.purge_state].some(value => value !== null && value !== undefined) ||
    ['revoked','expired','deleted','purged','rejected'].includes(String(row.status))) return false;
  if (row.expires_at === null || row.expires_at === undefined || row.expires_at === '') return true;
  const expiry = day(row.expires_at);
  return Boolean(expiry && (isFinancialDate(row.expires_at) ? expiry >= now.toISOString().slice(0, 10) : Date.parse(String(row.expires_at)) > now.getTime()));
}
function imported(row: Row) { return Boolean(row.source_project || row.source_bundle || row.source_context || row.imported_at); }
function sqlField(alias: string, field: Field, document = "CASE WHEN json_valid(payload) THEN payload ELSE '{}' END") {
  const value = `json_extract(${document},'${field.path}')`, type = `json_type(${document},'${field.path}')`;
  const expression = field.type === 'text' ? `CASE WHEN ${type}='text' THEN ${value} ELSE NULL END`
    : field.type === 'number' ? `CASE WHEN ${type} IN ('integer','real') THEN ${value} ELSE NULL END`
    : field.type === 'presence' ? `CASE WHEN ${type} IS NOT NULL AND ${type}<>'null' THEN 1 ELSE 0 END` : value;
  return `${expression} AS ${alias}`;
}
function query(actor: Actor, kind: Kind, fields: Record<string, Field>, projectIds?: string[], company = false): Row[] {
  if (projectIds && !projectIds.length && !company) return [];
  const scoped = projectIds === undefined ? '' : `AND (${company ? "project_id=''" : '0'}${projectIds.length ? ` OR project_id IN (${projectIds.map(() => '?').join(',')})` : ''})`;
  const result = database().prepare(`SELECT id,project_id,created_at,${Object.entries({ ...common, ...fields }).map(([alias, field]) => sqlField(alias, field)).join(',')}
    FROM records WHERE tenant_id=? AND kind=? ${scoped} AND length(payload)<=1048576 AND json_valid(payload)
    AND json_type(CASE WHEN json_valid(payload) THEN payload ELSE '{}' END)='object' ORDER BY id LIMIT ${LIMIT + 1}`)
    .all(actor.tenantId, kind, ...(projectIds ?? [])) as Row[];
  if (result.length > LIMIT) throw new ErpError(503, 'Guest module reporting requires operator review before reporting this many records.');
  return result.filter(row => identity.test(row.id) && (row.project_id === '' || identity.test(row.project_id)) &&
    (row.declared_project === null || row.declared_project === undefined || row.declared_project === row.project_id));
}
function authorizedProjects(actor: Actor, candidates: readonly Project[], now: Date) {
  if (candidates.length > LIMIT || candidates.some(project => !project || typeof project.id !== 'string' || !identity.test(project.id))) throw new ErpError(422, 'Invalid guest project scope.');
  const current = currentReportingPeriod(now), requested = new Set(candidates.filter(project => project.period === current).map(project => project.id));
  if (!requested.size) return new Map<string, string>();
  const grants = new Set(guestProjectReviews(actor, now).filter(grant => grant.period === current).map(grant => grant.projectId));
  const result = new Map<string, string>();
  for (const row of query(actor, 'project', { name: text('$.name') })) {
    if (!requested.has(row.id) || row.project_id !== row.id || !active(row, now)) continue;
    const declared = period(row);
    if (declared !== undefined ? declared !== current : row.source === 'team' && !imported(row) ? day(row.created_at)?.slice(0, 7) !== current : !grants.has(row.id)) continue;
    result.set(row.id, label(row.name) ?? 'Project');
  }
  return result;
}
function selectedDate(row: Row, kind: ModuleKind, now: Date): { date: string | null; basis: string } | null {
  const current = currentReportingPeriod(now), declared = period(row), spec = schemas[kind];
  if (declared !== undefined && declared !== current) return null;
  let dates = spec.dates.map((_, index) => row['business_date_' + index]).filter(value => value !== null && value !== undefined && value !== '');
  if (kind === 'compliance' && !dates.length && row.reviewed_on !== null && row.reviewed_on !== undefined && row.reviewed_on !== '') dates = [row.reviewed_on];
  if (dates.length) {
    // Optional aliases can contradict a canonical date, but cannot authorize an otherwise undated record.
    if (kind !== 'compliance' && (row.business_date_0 === null || row.business_date_0 === undefined || row.business_date_0 === '')) return null;
    const days = dates.map(day);
    if (days.some(value => !value || value.slice(0, 7) !== current || value !== days[0])) return null;
    if (['hours','invoice','proposal','bid','purchase_order'].includes(kind) && days.some(value => value! > now.toISOString().slice(0, 10))) return null;
    return { date: days[0], basis: kind === 'compliance' && !row.business_date_0 ? 'Recorded review date' : 'Source date' };
  }
  if (!spec.event) return null;
  // A declared business period supersedes the ingestion month; no invented source day is displayed.
  if (declared === current) return { date: null, basis: 'Declared reporting period' };
  const canonical = !imported(row) && (['team','manual','website'].includes(String(row.source)) || ((kind === 'note' || kind === 'change') && row.source == null));
  if (!canonical) return null;
  const recorded = day(row.created_at);
  if (!recorded || recorded.slice(0, 7) !== current || Date.parse(row.created_at) > now.getTime()) return null;
  return { date: recorded, basis: 'Recorded date' };
}
function money(row: Row, kind: ModuleKind) {
  if (kind === 'proposal' ? row.currency !== 'USD' : row.currency !== null && row.currency !== undefined && row.currency !== 'USD') return null;
  return isValidUsdAmount(row.amount) ? row.amount : null;
}
function moduleRecord(row: Row, kind: ModuleKind, projectName: string | null, selected: { date: string | null; basis: string }): GuestModuleRecord {
  const fields: GuestModuleRecord['fields'] = [{ label: 'Date basis', value: selected.basis }];
  if (projectName) fields.push({ label: 'Project', value: projectName });
  const add = (name: string, value: string | number | null) => fields.push({ label: name, value });
  let title = label(row.title);
  if (kind === 'lead') {
    title = label(row.name) ?? 'Lead'; add('Request type', ['estimate','investor'].includes(String(row.request_kind)) ? row.request_kind as string : null);
    add('Project type', label(row.project_type)); add('Estimated project value (USD)', isValidUsdAmount(row.estimated_value) ? row.estimated_value : null);
  } else if (kind === 'vendor') {
    title = label(row.name) ?? 'Provider'; add('Trades', label(row.trade)); add('State served', label(row.state));
    add('Crew size', typeof row.crew_size === 'number' && Number.isSafeInteger(row.crew_size) && row.crew_size >= 0 && row.crew_size <= 100000 ? row.crew_size : null);
  } else if (kind === 'hours') {
    title = 'Work hours'; add('Trade', label(row.trade)); add('Recorded hours', typeof row.hours === 'number' && Number.isFinite(row.hours) && row.hours >= 0.1 && row.hours <= 24 ? row.hours : null);
  } else if (['invoice','proposal','bid','purchase_order'].includes(kind)) {
    title = title ?? ({ invoice: 'Invoice', proposal: 'Proposal', bid: 'Supplier bid', purchase_order: 'Purchase order' } as Record<string, string>)[kind];
    add('Recorded amount (USD)', money(row, kind));
    if (kind === 'invoice') add('Audience', ['client','vendor','internal'].includes(String(row.audience)) ? row.audience as string : null);
    if (kind === 'bid' || kind === 'purchase_order') add('Supplier', label(row.supplier));
  } else if (kind === 'compliance') {
    title = title ?? 'Compliance requirement'; add('Category', COMPLIANCE_CATEGORY_OPTIONS.some(option => option.value === row.category) ? row.category as string : null); add('Jurisdiction', label(row.jurisdiction));
  } else if (kind === 'corporate_meeting' || kind === 'followup') {
    title = title ?? (kind === 'followup' ? 'Follow-up' : 'Corporate meeting'); add('Priority', ['low','normal','high','urgent'].includes(String(row.priority)) ? row.priority as string : null);
    if (kind === 'corporate_meeting') add('Scheduled time', typeof row.time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(row.time) ? row.time : null);
  } else title = title ?? (kind === 'note' ? 'Project update' : 'Scope change');
  return { id: row.id, kind, projectId: row.project_id || null, title, status: schemas[kind].statuses.includes(String(row.status)) ? row.status as string : null, date: selected.date, fields };
}
function teamRecords(actor: Actor, projects: Map<string, string>, now: Date): GuestModuleRecord[] {
  if (!projects.size) return [];
  const safe = "CASE WHEN json_valid(r.payload) THEN r.payload ELSE '{}' END", item = "CASE WHEN json_valid(t.value) THEN t.value ELSE '{}' END";
  const fields: Record<string, Field> = { member_id: text('$.memberId'), responsibility: text('$.responsibility'), assigned_on: raw('$.assignedOn'), removed_on: raw('$.removedOn'), review_period: raw('$.reviewPeriod'), reporting_period: raw('$.reportingPeriod'), period: raw('$.period') };
  const rows = database().prepare(`SELECT r.id,r.project_id,r.created_at,CAST(t.key AS INTEGER) AS assignment_index,${Object.entries(fields).map(([alias, field]) => sqlField(alias, field, item)).join(',')}
    FROM records r,json_each(CASE WHEN json_type(${safe},'$.teamMembers')='array' AND json_array_length(${safe},'$.teamMembers')<=200 THEN json_extract(${safe},'$.teamMembers') ELSE '[]' END) t
    WHERE r.tenant_id=? AND r.kind='project' AND r.project_id=r.id AND r.id IN (${[...projects.keys()].map(() => '?').join(',')})
    AND length(r.payload)<=1048576 AND json_valid(r.payload) AND t.type='object' ORDER BY r.id,t.key LIMIT ${LIMIT + 1}`).all(actor.tenantId, ...projects.keys()) as Row[];
  if (rows.length > LIMIT) throw new ErpError(503, 'Guest team reporting requires operator review before reporting this many assignments.');
  const result: GuestModuleRecord[] = [], seen = new Set<string>(), current = currentReportingPeriod(now), today = now.toISOString().slice(0, 10);
  for (const row of rows) {
    const assigned = day(row.assigned_on), removed = row.removed_on === null || row.removed_on === undefined ? null : day(row.removed_on), declared = period(row);
    const key = row.id + ':' + String(row.member_id) + ':' + assigned;
    if (typeof row.member_id !== 'string' || !identity.test(row.member_id) || seen.has(key) || !assigned || assigned.slice(0, 7) !== current || assigned > today ||
      (declared !== undefined && declared !== current) || (row.removed_on != null && (!removed || removed.slice(0, 7) !== current || removed < assigned || removed > today))) continue;
    seen.add(key);
    result.push({ id: 'team:' + row.id + ':' + String(row.assignment_index), kind: 'team', projectId: row.id, title: label(row.responsibility, 160) ?? 'Team assignment', status: removed ? 'ended' : 'active', date: assigned,
      fields: [{ label: 'Project', value: projects.get(row.id)! }, { label: 'Assigned on', value: assigned }, { label: 'Removed on', value: removed }] });
  }
  return result;
}
/** Current-project candidates are rechecked inside their tenant before authorizing child records. */
export function guestModuleProjection(actor: Actor, currentProjects: readonly Project[], now = new Date()): GuestModuleRecord[] {
  access(actor); currentReportingPeriod(now);
  if (!Array.isArray(currentProjects)) throw new ErpError(422, 'Invalid guest project scope.');
  const projects = authorizedProjects(actor, currentProjects, now), result: GuestModuleRecord[] = [];
  for (const kind of Object.keys(schemas) as ModuleKind[]) {
    const schema = schemas[kind], fields = { ...schema.fields, ...Object.fromEntries(schema.dates.map((path, index) => ['business_date_' + index, raw(path)])) };
    for (const row of query(actor, kind, fields, [...projects.keys()], schema.company)) {
      if (!active(row, now) || (kind === 'note' && row.visibility !== 'client')) continue;
      const selected = selectedDate(row, kind, now); if (!selected) continue;
      result.push(moduleRecord(row, kind, projects.get(row.project_id) ?? null, selected));
      if (result.length > LIMIT) throw new ErpError(503, 'Guest module reporting requires operator review before reporting this many records.');
    }
  }
  result.push(...teamRecords(actor, projects, now));
  if (result.length > LIMIT) throw new ErpError(503, 'Guest module reporting requires operator review before reporting this many records.');
  return result.sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
}
