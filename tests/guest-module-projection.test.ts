import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Actor } from '../lib/auth';
import { database, ErpError, type Kind } from '../lib/erp';
import { guestModuleProjection } from '../lib/guest-module-projection';
import { guestConsoleSnapshot } from '../lib/guest-workspace';
import { guestSections } from '../lib/guest-sections';
import { requireGuestPeriod } from '../lib/guest-period';
import { saveMonthlyManagementEstimate } from '../lib/monthly-management-estimates';

const actor: Actor = { id: 'guest', email: 'guest@example.test', role: 'guest', tenantId: 'company-one', projectIds: [] };
const now = new Date('2026-10-23T18:00:00Z'), current = '2026-10', created = '2026-10-02T12:00:00Z';
const candidates = [{ id: 'project-current', name: 'Current project', period: current }];
type ModuleKind = Exclude<Kind, 'project' | 'document' | 'estimate'>;
const examples: Record<ModuleKind, Record<string, unknown>> = {
  lead: { name: 'Current opportunity', source: 'team', status: 'new', estimatedValueUsd: 1234, projectType: 'Commercial' },
  vendor: { businessName: 'Current builder', source: 'website', status: 'pending_review', trades: 'Carpentry', stateServed: 'WI', crewSize: 5 },
  note: { title: 'Client update', visibility: 'client' },
  change: { title: 'Current scope change', status: 'requested' },
  hours: { date: '2026-10-10', hours: 8.5, trade: 'Carpentry', status: 'submitted' },
  invoice: { issuedOn: '2026-10-10', amountUsd: 1200, status: 'submitted', audience: 'client' },
  proposal: { issuedOn: '2026-10-10', amountUsd: 2300, currency: 'USD', title: 'Current proposal', status: 'draft' },
  bid: { issuedOn: '2026-10-10', amountUsd: 3400, supplierName: 'Builder LLC', status: 'submitted' },
  purchase_order: { issuedOn: '2026-10-10', amountUsd: 4500, supplierName: 'Builder LLC', status: 'draft' },
  compliance: { dueDate: '2026-10-10', topic: 'Current requirement', category: 'general', jurisdiction: 'WI', status: 'pending' },
  corporate_meeting: { date: '2026-10-10', title: 'Current meeting', time: '10:30', priority: 'normal', status: 'scheduled' },
  followup: { dueDate: '2026-10-10', title: 'Current follow-up', priority: 'high', status: 'open' },
};
const sourceField: Partial<Record<ModuleKind, string>> = { hours: 'date', invoice: 'issuedOn', proposal: 'issuedOn', bid: 'issuedOn', purchase_order: 'issuedOn', compliance: 'dueDate', corporate_meeting: 'date', followup: 'dueDate' };
const privateFields = { email: 'PRIVATE_EMAIL_SENTINEL@example.test', phone: 'PRIVATE_PHONE_SENTINEL', contacts: [{ name: 'PRIVATE_CONTACT_SENTINEL' }],
  notes: 'PRIVATE_NOTES_SENTINEL', details: 'PRIVATE_DETAILS_SENTINEL', internalNotes: 'PRIVATE_INTERNAL_SENTINEL', blobPath: 'PRIVATE_STORAGE_SENTINEL/x.pdf',
  sourceRef: 'PRIVATE_SOURCE_REF_SENTINEL', accessToken: 'PRIVATE_TOKEN_SENTINEL', accountNumber: 'PRIVATE_BANK_SENTINEL', history: ['PRIVATE_HISTORY_SENTINEL'], assigneeEmail: 'PRIVATE_ASSIGNEE_SENTINEL@example.test' };
const fails = (status: number) => (error: unknown) => error instanceof ErpError && error.status === status;
function fixture(run: (f: { put: (id: string, kind: Kind, data: unknown, projectId?: string, at?: string, tenant?: string) => void; project: (id: string, data?: Record<string, unknown>, at?: string, tenant?: string) => void }) => void) {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-guest-modules-')), names = ['TAYCO_ERP_DB_PATH','TAYCO_TAKEOFF_RELATIONS_PATH','TAYCO_TAKEOFF_MAPPING_PATH'];
  const old = Object.fromEntries(names.map(name => [name, process.env[name]]));
  process.env.TAYCO_ERP_DB_PATH = path.join(folder, 'erp.sqlite');
  process.env.TAYCO_TAKEOFF_RELATIONS_PATH = path.join(folder, 'absent-relations.json'); process.env.TAYCO_TAKEOFF_MAPPING_PATH = path.join(folder, 'absent-mapping.json');
  const db = database();
  const put = (id: string, kind: Kind, data: unknown, projectId = 'project-current', at = created, tenant = actor.tenantId) =>
    db.prepare('INSERT INTO records VALUES(?,?,?,?,?,?,1,?,?)').run(id, kind, tenant, projectId, 'owner', typeof data === 'string' ? data : JSON.stringify({ ...privateFields, ...(data as object) }), at, at);
  const project = (id: string, data: Record<string, unknown> = {}, at = created, tenant = actor.tenantId) => put(id, 'project', { name: id, source: 'team', ...data }, id, at, tenant);
  try { project('project-current'); run({ put, project }); }
  finally {
    db.close(); for (const name of names) if (old[name] === undefined) delete process.env[name]; else process.env[name] = old[name];
    rmSync(folder, { recursive: true, force: true });
  }
}

test('every new module projects current records using its canonical date and safe fields', () => fixture(f => {
  for (const kind of Object.keys(examples) as ModuleKind[]) f.put('current-' + kind, kind, examples[kind]);
  const data = guestModuleProjection(actor, candidates, now);
  assert.equal(data.length, Object.keys(examples).length);
  assert.deepEqual(data.map(row => row.kind).sort(), Object.keys(examples).sort());
  for (const row of data) {
    assert.deepEqual(Object.keys(row).sort(), ['id','kind','projectId','title','status','date','fields'].sort());
    assert.equal(row.projectId, 'project-current'); assert.ok(row.date?.startsWith('2026-10'));
    for (const field of row.fields) { assert.deepEqual(Object.keys(field).sort(), ['label','value']); assert.ok(field.value === null || ['string','number'].includes(typeof field.value)); }
  }
  assert.equal(data.find(row => row.kind === 'hours')?.fields.find(field => field.label === 'Recorded hours')?.value, 8.5);
  assert.equal(data.find(row => row.kind === 'invoice')?.fields.find(field => field.label === 'Recorded amount (USD)')?.value, 1200);
  assert.doesNotMatch(JSON.stringify(data), /PRIVATE_|payload|email|phone|blobPath|sourceRef|accessToken|accountNumber|contacts|internalNotes|revenue|profit/i);
  assert.deepEqual(guestConsoleSnapshot(actor, { now }).moduleRecords, data);
}));

test('all module kinds isolate tenant, current parent and source month, even with forged project candidates', () => fixture(f => {
  f.project('project-past', {}, '2026-09-10T12:00:00Z');
  f.project('project-future', {}, '2026-11-10T12:00:00Z');
  f.project('project-foreign', {}, created, 'company-two');
  for (const kind of Object.keys(examples) as ModuleKind[]) {
    f.put('ok-' + kind, kind, examples[kind]);
    f.put('foreign-' + kind, kind, examples[kind], 'project-current', created, 'company-two');
    for (const parent of ['project-past','project-future','project-foreign','project-missing']) f.put(parent + '-' + kind, kind, examples[kind], parent);
    const field = sourceField[kind];
    for (const [prefix, value, at] of [['past','2026-09-10','2026-09-10T12:00:00Z'],['future','2026-11-10','2026-11-10T12:00:00Z']]) {
      f.put(prefix + '-' + kind, kind, { ...examples[kind], ...(field ? { [field]: value } : {}) }, 'project-current', field ? created : at);
    }
  }
  const forged = [...candidates, ...['project-past','project-future','project-foreign','project-missing'].map(id => ({ id, name: 'Forged current project', period: current }))];
  assert.deepEqual(guestModuleProjection(actor, forged, now).map(row => row.id).sort(), Object.keys(examples).map(kind => 'ok-' + kind).sort());
  assert.deepEqual(guestModuleProjection({ ...actor, tenantId: 'company-two' }, candidates, now), []);
  for (const forgedActor of [{ ...actor, projectIds: ['project-current'] }, { ...actor, vendorId: 'vendor-forged' }, { ...actor, role: 'admin' as const }])
    assert.throws(() => guestModuleProjection(forgedActor, candidates, now), fails(403));
}));

test('only eligible company modules allow no project, and orphan references never become company scope', () => fixture(f => {
  for (const kind of Object.keys(examples) as ModuleKind[]) {
    f.put('company-' + kind, kind, examples[kind], '');
    f.put('orphan-' + kind, kind, examples[kind], 'project-missing');
  }
  assert.deepEqual(guestModuleProjection(actor, [], now).map(row => row.kind).sort(), ['corporate_meeting','followup','lead','vendor']);
}));

test('explicit past, future, invalid or contradictory periods revoke every module kind', () => fixture(f => {
  for (const kind of Object.keys(examples) as ModuleKind[]) {
    for (const [index, declarations] of [
      { reviewPeriod: '2026-09' }, { reportingPeriod: '2026-11' }, { period: 'bad' }, { period: {} },
      { reviewPeriod: current, reportingPeriod: '2026-09' }, { reportingPeriod: current, period: '2026-11' },
    ].entries()) f.put('rejected-' + kind + '-' + index, kind, { ...examples[kind], ...declarations });
  }
  assert.deepEqual(guestModuleProjection(actor, candidates, now), []);
}));

test('imports require source-date evidence or an explicit business period instead of their ingestion timestamp', () => fixture(f => {
  for (const kind of ['lead','vendor','note','change'] as const) {
    f.put('unknown-' + kind, kind, { ...examples[kind], source: 'legacy_import' });
    f.put('marker-' + kind, kind, { ...examples[kind], source: 'team', sourceBundleId: 'legacy-bundle' });
    f.put('known-' + kind, kind, { ...examples[kind], source: 'legacy_import', reviewPeriod: current }, 'project-current', '2025-01-01T12:00:00Z');
  }
  for (const kind of Object.keys(sourceField) as ModuleKind[]) {
    const field = sourceField[kind]!;
    f.put('unknown-' + kind, kind, { ...examples[kind], [field]: null, reviewPeriod: current });
    f.put('invalid-' + kind, kind, { ...examples[kind], [field]: '2026-02-31' });
  }
  const data = guestModuleProjection(actor, candidates, now);
  assert.deepEqual(data.map(row => row.id).sort(), ['known-change','known-lead','known-note','known-vendor']);
  assert.ok(data.every(row => row.date === null && row.fields.some(field => field.value === 'Declared reporting period')));
}));

test('canonical dates cannot be replaced by aliases, contradicted by aliases or shifted to future occurred days', () => fixture(f => {
  for (const [kind, canonical, alias] of [['hours','date','workDate'],['invoice','issuedOn','issueDate'],['corporate_meeting','date','scheduledDate']] as const) {
    f.put('alias-only-' + kind, kind, { ...examples[kind], [canonical]: null, [alias]: '2026-10-10' });
    f.put('alias-conflict-' + kind, kind, { ...examples[kind], [alias]: '2026-10-11' });
  }
  for (const kind of ['hours','invoice','proposal','bid','purchase_order'] as const) f.put('future-day-' + kind, kind, { ...examples[kind], [sourceField[kind]!]: '2026-10-24' });
  f.put('future-day-meeting', 'corporate_meeting', { ...examples.corporate_meeting, date: '2026-10-30' });
  f.put('reviewed-compliance', 'compliance', { ...examples.compliance, dueDate: '', reviewedOn: '2026-10-12' });
  assert.deepEqual(guestModuleProjection(actor, candidates, now).map(row => row.id).sort(), ['future-day-meeting','reviewed-compliance']);
}));

test('private notes and private values never appear; malformed values stay unknown rather than fabricated', () => fixture(f => {
  f.put('internal-note', 'note', { ...examples.note, visibility: 'internal', title: 'PRIVATE_NOTE_TITLE_SENTINEL' });
  f.put('owner-note', 'note', { ...examples.note, visibility: 'owner' });
  f.put('safe-note', 'note', { ...examples.note, title: 'personal@example.test' });
  f.put('bool-invoice', 'invoice', { ...examples.invoice, amountUsd: true, source: 'PRIVATE_SOURCE_SENTINEL' });
  f.put('decimal-invoice', 'invoice', { ...examples.invoice, amountUsd: 12.345 });
  f.put('currency-invoice', 'invoice', { ...examples.invoice, currency: 'EUR' });
  f.put('bool-hours', 'hours', { ...examples.hours, hours: true, trade: '555-123-4567' });
  f.put('nested-lead', 'lead', { ...examples.lead, name: { details: 'PRIVATE_NESTED_SENTINEL' } });
  f.put('bank-vendor', 'vendor', { ...examples.vendor, businessName: 'Account: 123456789012', trades: 'C:\\private\\trade.json' });
  f.put('malformed', 'invoice', '{not json');
  const data = guestModuleProjection(actor, candidates, now);
  assert.equal(data.length, 7); assert.doesNotMatch(JSON.stringify(data), /PRIVATE_|555|123456789012|personal@/);
  for (const row of data.filter(row => row.kind === 'invoice')) assert.equal(row.fields.find(field => field.label === 'Recorded amount (USD)')?.value, null);
  assert.equal(data.find(row => row.id === 'bool-hours')?.fields.find(field => field.label === 'Recorded hours')?.value, null);
  assert.equal(data.find(row => row.id === 'nested-lead')?.title, 'Lead');
}));

test('team projection uses current project assignment dates and excludes email, member IDs and account records', () => fixture(() => {
  database().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify({ source: 'team', name: 'Current project', teamMembers: [
    { memberId: 'member-active', email: 'PRIVATE_TEAM_EMAIL_SENTINEL@example.test', responsibility: 'Site coordination', assignedOn: '2026-10-02', removedOn: null },
    { memberId: 'member-ended', email: 'PRIVATE_TEAM_EMAIL_SENTINEL@example.test', responsibility: 'QA review', assignedOn: '2026-10-03', removedOn: '2026-10-04' },
    { memberId: 'member-past', responsibility: 'Old assignment', assignedOn: '2026-09-03', removedOn: null },
    { memberId: 'member-future', responsibility: 'Future assignment', assignedOn: '2026-11-03', removedOn: null },
    { memberId: 'member-contradiction', responsibility: 'Rejected assignment', assignedOn: '2026-10-03', period: '2026-09' },
    { memberId: 'member-undated', responsibility: 'Unknown assignment', assignedOn: null },
  ] }), 'project-current');
  const data = guestModuleProjection(actor, candidates, now);
  assert.equal(data.length, 2); assert.ok(data.every(row => row.kind === 'team' && row.projectId === 'project-current'));
  assert.deepEqual(data.map(row => row.status).sort(), ['active','ended']);
  assert.doesNotMatch(JSON.stringify(data), /PRIVATE_|email|member-active|member-ended|password|invitation|auth_users/);
}));

test('lifecycle revocation and invalid scopes fail closed for all module kinds', () => fixture(f => {
  for (const kind of Object.keys(examples) as ModuleKind[]) for (const [index, flag] of [
    { deletedAt: created }, { purgedAt: created }, { revokedAt: created }, { purgeState: 'processing' },
    { expiresAt: '2026-10-22' }, { expiresAt: 'invalid' }, { projectId: 'other-project' },
  ].entries()) f.put('lifecycle-' + kind + '-' + index, kind, { ...examples[kind], ...flag });
  assert.deepEqual(guestModuleProjection(actor, candidates, now), []);
  assert.throws(() => guestModuleProjection(actor, [{ id: "' OR 1=1", name: 'Forged', period: current }], now), fails(422));
}));

test('closed months have no module detail and every non-summary section returns Month closed', () => fixture(f => {
  f.put('current-invoice', 'invoice', examples.invoice);
  assert.deepEqual(guestConsoleSnapshot(actor, { now, period: '2026-09' }).moduleRecords, []);
  for (const section of guestSections.filter(section => section !== 'summary'))
    assert.throws(() => guestConsoleSnapshot(actor, { now, period: '2026-09', section }), error => fails(403)(error) && /Month closed/.test((error as Error).message));
  assert.throws(() => requireGuestPeriod('2026-09', now), error => fails(403)(error) && /Month closed/.test((error as Error).message));
  for (const section of guestSections) assert.doesNotThrow(() => guestConsoleSnapshot(actor, { now, section }));
}));

test('module reporting refuses a partial result beyond its bounded row limit', () => fixture(f => {
  const db = database(); db.exec('BEGIN');
  try { for (let i = 0; i < 5001; i++) f.put('bounded-' + i, 'lead', examples.lead, ''); db.exec('COMMIT'); }
  catch (error) { db.exec('ROLLBACK'); throw error; }
  assert.throws(() => guestModuleProjection(actor, [], now), fails(503));
}));

test('historical deep links retain all completed months of that year and January can still review the prior year', () => fixture(() => {
  const admin = { ...actor, role: 'admin' as const };
  for (const [index, month] of ['2025-12','2026-08','2026-09'].entries())
    saveMonthlyManagementEstimate(admin, 'history-estimate-key-' + index, { period: month, lowUsd: 100, highUsd: 200, source: 'PRIVATE_SOURCE_SENTINEL', expectedVersion: 0 });
  for (const period of ['2026-08','2026-09']) {
    const data = guestConsoleSnapshot(actor, { now, period, section: 'summary' });
    assert.equal(data.period, period);
    assert.deepEqual(data.historicalSummary.months.map(month => month.period), ['2026-08','2026-09']);
    assert.ok(data.historicalSummary.availableYears.includes(2025));
    assert.deepEqual(data.moduleRecords, []); assert.deepEqual(data.projects, []);
  }
  const priorYear = guestConsoleSnapshot(actor, { now, period: '2025-12' });
  assert.equal(priorYear.historicalSummary.year, 2025);
  assert.deepEqual(priorYear.historicalSummary.months.map(month => month.period), ['2025-12']);
  const january = guestConsoleSnapshot(actor, { now: new Date('2027-01-02T12:00:00Z') });
  assert.equal(january.currentPeriod, '2027-01');
  assert.equal(january.historicalSummary.year, 2026);
  assert.deepEqual(january.historicalSummary.months.map(month => month.period), ['2026-08','2026-09']);
  assert.deepEqual(january.moduleRecords, []);
  const januaryLink = guestConsoleSnapshot(actor, { now: new Date('2026-01-02T12:00:00Z'), period: '2025-12' });
  assert.deepEqual(januaryLink.historicalSummary.months.map(month => month.period), ['2025-12']);
  assert.doesNotMatch(JSON.stringify(januaryLink), /PRIVATE_|sourceRef|blobPath|contacts/);
}));

test('canonical operational states are reported while expired records remain excluded', () => fixture(f => {
  f.put('closed-order', 'purchase_order', { ...examples.purchase_order, status: 'closed' });
  f.put('complete-compliance', 'compliance', { ...examples.compliance, status: 'complete' });
  f.put('expired-compliance', 'compliance', { ...examples.compliance, status: 'expired' });
  const data = guestModuleProjection(actor, candidates, now);
  assert.equal(data.find(row => row.id === 'closed-order')?.status, 'closed');
  assert.equal(data.find(row => row.id === 'complete-compliance')?.status, 'complete');
  assert.equal(data.length, 2);
  assert.ok(!data.some(row => row.id === 'expired-compliance'));
  assert.doesNotMatch(JSON.stringify(data), /downloadHref|viewerHref|revenue|profit|payment|bank|token/i);
}));
