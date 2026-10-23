import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Actor } from '../lib/auth';
import { database, ErpError, execute, snapshot, type Data, type Entry } from '../lib/erp';
import {
  CLASSIFICATION_HISTORY_LIMIT, COMPLIANCE_CATEGORY_OPTIONS, CONTRACT_TYPE_OPTIONS,
  FUNDING_TYPE_OPTIONS, LABOR_REGIME_OPTIONS, readComplianceCategory, readProjectClassification,
} from '../lib/project-classification';

function fixture(run: (admin: Actor) => void) {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-classification-'));
  const priorErp = process.env.TAYCO_ERP_DB_PATH, priorAuth = process.env.TAYCO_AUTH_DB_PATH;
  process.env.TAYCO_ERP_DB_PATH = path.join(folder, 'erp.sqlite');
  process.env.TAYCO_AUTH_DB_PATH = path.join(folder, 'auth.sqlite');
  const admin: Actor = { id: 'classification-admin', email: 'classification@example.test', role: 'admin', tenantId: 'classification-fixture', projectIds: [] };
  try { run(admin); } finally {
    database().close();
    if (priorErp === undefined) delete process.env.TAYCO_ERP_DB_PATH; else process.env.TAYCO_ERP_DB_PATH = priorErp;
    if (priorAuth === undefined) delete process.env.TAYCO_AUTH_DB_PATH; else process.env.TAYCO_AUTH_DB_PATH = priorAuth;
    rmSync(folder, { recursive: true, force: true });
  }
}
const run = (actor: Actor, input: Data, key = randomUUID()) => execute(actor, key, input);
const status = (code: number) => (error: unknown) => error instanceof ErpError && error.status === code;
const create = (actor: Actor, data: Data = {}) => run(actor, { action: 'create_project', name: 'Synthetic classification project', ...data });
const classification = (entry: Entry) => readProjectClassification(entry.data.classification);
function stored(id: string) {
  return JSON.parse((database().prepare('SELECT payload FROM records WHERE id=?').get(id) as { payload: string }).payload) as Data;
}

test('legacy and explicit unknown classification stay unknown without inventing a review', () => fixture(admin => {
  for (const fields of [{}, { contractType: 'unknown', fundingType: 'unknown', laborRegime: 'unknown', jurisdiction: '', classificationSource: '' }]) {
    const project = create(admin, fields), value = classification(project);
    assert.deepEqual(value, { contractType: 'unknown', fundingType: 'unknown', laborRegime: 'unknown', jurisdiction: '', source: '', reviewedAt: null, reviewedBy: null, history: [] });
  }
  assert.equal(readProjectClassification(undefined).contractType, 'unknown');
  assert.equal(readProjectClassification({ contractType: 'public', fundingType: false, laborRegime: ['union'], history: [null, 'bad'] }).laborRegime, 'unknown');
  const original = { name: 'Federal union source title', sourceProjectSlug: 'federal_union' };
  const before = JSON.stringify(original);
  assert.deepEqual(readProjectClassification((original as Data).classification), readProjectClassification(undefined));
  assert.equal(JSON.stringify(original), before, 'Presentation helper never mutates a legacy source.');
  assert.equal(readComplianceCategory(undefined), 'general');
  assert.equal(readComplianceCategory('unrecognized'), 'general');
  assert.deepEqual(CONTRACT_TYPE_OPTIONS.map(item => item.value), ['unknown', 'private', 'federal', 'state', 'local', 'tribal', 'mixed']);
  assert.deepEqual(FUNDING_TYPE_OPTIONS.map(item => item.value), ['unknown', 'private', 'federal', 'state_local', 'tribal', 'mixed']);
  assert.deepEqual(LABOR_REGIME_OPTIONS.map(item => item.value), ['unknown', 'union', 'non_union', 'mixed']);
}));

test('contract, funding and labor axes are independent source-backed project facts', () => fixture(admin => {
  const federal = create(admin, { contractType: 'federal', laborRegime: 'union', classificationSource: 'Synthetic contract and labor schedule', reviewedAt: '1900-01-01', reviewedBy: 'forged', history: ['forged'] });
  const privateFunding = create(admin, { contractType: 'private', fundingType: 'federal', laborRegime: 'non_union', jurisdiction: 'Synthetic project jurisdiction', classificationSource: 'Synthetic private contract and funding award' });
  assert.equal(classification(federal).contractType, 'federal'); assert.equal(classification(federal).laborRegime, 'union'); assert.equal(classification(federal).fundingType, 'unknown');
  assert.equal(classification(privateFunding).contractType, 'private'); assert.equal(classification(privateFunding).fundingType, 'federal'); assert.equal(classification(privateFunding).laborRegime, 'non_union');
  assert.equal(classification(federal).reviewedBy, admin.id); assert.notEqual(classification(federal).reviewedAt, '1900-01-01');
  assert.ok(Number.isFinite(Date.parse(classification(federal).reviewedAt!)));
  assert.equal(classification(federal).history.length, 1);
  assert.equal(federal.data.source, 'team', 'Classification evidence does not replace the project source.');
  const privateBefore = JSON.stringify(stored(privateFunding.id));
  const changed = run(admin, { action: 'update_project_classification', id: federal.id, version: federal.version, contractType: 'tribal', fundingType: 'mixed', laborRegime: 'mixed', classificationSource: 'Synthetic corrected contract review' });
  assert.equal(classification(changed).history.length, 2);
  assert.equal(classification(changed).history[0].source, 'Synthetic contract and labor schedule');
  assert.equal(JSON.stringify(stored(privateFunding.id)), privateBefore, 'Another project remains independent.');
  assert.equal(snapshot(admin).entries.filter(entry => entry.kind === 'compliance').length, 0, 'Classification creates no requirements or legal approvals.');
}));

test('known classifications require bounded explicit source with no title-based inference', () => fixture(admin => {
  const before = () => (database().prepare('SELECT COUNT(*) AS count FROM records').get() as { count: number }).count;
  for (const fields of [
    { contractType: 'federal' }, { fundingType: 'federal' }, { laborRegime: 'union' }, { jurisdiction: 'Fixture jurisdiction' },
    { contractType: 'private', classificationSource: '  ' }, { contractType: 'public', classificationSource: 'Synthetic source' },
    { fundingType: 'state', classificationSource: 'Synthetic source' }, { laborRegime: 'nonunion', classificationSource: 'Synthetic source' },
    { contractType: null }, { jurisdiction: 123 }, { classificationSource: [] },
    { jurisdiction: 'x'.repeat(201), classificationSource: 'Synthetic source' }, { classificationSource: 'x'.repeat(1001) },
  ]) {
    const count = before();
    assert.throws(() => create(admin, fields), status(422));
    assert.equal(before(), count, 'Rejected declarations create no partial project.');
  }
  const p = create(admin, { name: 'Federal Union Tribal Project', classificationSource: '   ' });
  assert.equal(classification(p).contractType, 'unknown'); assert.equal(classification(p).laborRegime, 'unknown');
  const valid = create(admin, { contractType: 'local', jurisdiction: 'x'.repeat(200), classificationSource: 'x'.repeat(1000) });
  assert.equal(classification(valid).jurisdiction.length, 200);
}));

test('classification update preserves project state, budget, schedule and estimate source', () => fixture(admin => {
  const today = new Date().toISOString().slice(0, 10);
  let project = create(admin, { budgetUsd: 50, budgetSource: 'Synthetic approval', budgetApprovedOn: today });
  project = run(admin, { action: 'set_project_schedule', id: project.id, version: project.version, plannedStart: '2026-01-01', plannedEnd: '2026-12-31' });
  const baseline = stored(project.id);
  const changed = run(admin, { action: 'update_project_classification', id: project.id, version: project.version, contractType: 'state', classificationSource: 'Synthetic state contract', status: 'closed', budgetUsd: 999, plannedStart: '1900-01-01', sourceProjectSlug: 'forged' });
  const { classification: ignoredBefore, ...before } = baseline;
  const { classification: ignoredAfter, ...after } = stored(project.id);
  void ignoredBefore; void ignoredAfter;
  assert.deepEqual(after, before);
  assert.equal(changed.data.status, 'planning'); assert.equal(changed.data.budgetUsd, 50);
  const reset = run(admin, { action: 'update_project_classification', id: changed.id, version: changed.version });
  assert.equal(classification(reset).contractType, 'unknown'); assert.equal(classification(reset).source, '');
  assert.equal(classification(reset).history.length, 2, 'An explicit reset is recorded rather than erasing history.');
}));

test('classification authorizations, tenant privacy and replay use existing server authority', () => fixture(admin => {
  const p = create(admin, { contractType: 'private', classificationSource: 'Private classification evidence' });
  const body = { action: 'update_project_classification', id: p.id, version: p.version, fundingType: 'federal', classificationSource: 'Private funding evidence' };
  const foreign = { ...admin, id: 'other-admin', tenantId: 'other-fixture' };
  assert.throws(() => run(foreign, body), status(404));
  assert.equal(snapshot(foreign).entries.length, 0);
  for (const role of ['client', 'vendor'] as const) {
    const actor = { ...admin, id: 'assigned-' + role, email: role + '@example.test', role, projectIds: [p.id] };
    assert.throws(() => run(actor, body), status(403));
    assert.throws(() => create(actor, { contractType: 'federal', classificationSource: 'External declaration' }), status(403));
    assert.throws(() => run(actor, { action: 'create_compliance', projectId: p.id, jurisdiction: 'Fixture', topic: 'No external requirement', source: 'Fixture' }), status(403));
    const visible = snapshot(actor).entries.find(entry => entry.id === p.id)!;
    assert.equal((visible.data.classification as Data).contractType, 'private');
    for (const field of ['source', 'history', 'reviewedBy']) assert.equal((visible.data.classification as Data)[field], undefined);
  }
  assert.equal(classification(snapshot(admin).entries.find(entry => entry.id === p.id)!).source, 'Private classification evidence', 'External redaction does not mutate stored private evidence.');
  const staff = { ...admin, id: 'classification-staff', role: 'staff' as const };
  const key = randomUUID(), first = run(staff, body, key);
  assert.equal(classification(first).reviewedBy, staff.id);
  const current = run(admin, { ...body, version: first.version, fundingType: 'tribal', classificationSource: 'Later synthetic review' });
  const replay = run(staff, body, key);
  assert.equal(replay.version, first.version, 'An idempotent replay returns its original saved version.');
  assert.deepEqual(replay.data, first.data);
  assert.equal(classification(current).history.length, 3);
  assert.throws(() => run(staff, { ...body, fundingType: 'private' }, key), status(409));
  assert.throws(() => run(admin, body), status(409));
  assert.throws(() => run(admin, { ...body, id: randomUUID() }), status(404));
  assert.equal(classification(snapshot(admin).entries.find(entry => entry.id === p.id)!).history.length, 3, 'Rejected writes and replay add no extra review.');
}));

test('legacy classification edits and bounded history never silently drop prior reviews', () => fixture(admin => {
  const p = create(admin), payload = stored(p.id);
  delete payload.classification;
  payload.source = 'estimate_recovery'; payload.sourceProjectSlug = 'synthetic_legacy';
  database().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify(payload), p.id);
  const changed = run(admin, { action: 'update_project_classification', id: p.id, version: p.version, laborRegime: 'union', classificationSource: 'Synthetic legacy review' });
  assert.equal(changed.data.sourceProjectSlug, 'synthetic_legacy');
  assert.equal(classification(changed).history.length, 1);
  const storedBefore = stored(p.id), value = storedBefore.classification as Data;
  value.history = Array.from({ length: CLASSIFICATION_HISTORY_LIMIT }, () => classification(changed).history[0]);
  database().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify(storedBefore), p.id);
  assert.throws(() => run(admin, { action: 'update_project_classification', id: p.id, version: changed.version }), /history before another change/);
  assert.equal((stored(p.id).classification as Data).history instanceof Array, true);
  assert.equal(((stored(p.id).classification as Data).history as unknown[]).length, CLASSIFICATION_HISTORY_LIMIT);
}));

test('manual requirements accept categories and authority without weakening evidence reviews', () => fixture(admin => {
  const p = create(admin, { contractType: 'federal', laborRegime: 'union', classificationSource: 'Synthetic contract' });
  const base = { action: 'create_compliance', projectId: p.id, jurisdiction: 'Synthetic jurisdiction', topic: 'Manually supplied requirement', source: 'Synthetic supplied contract clause', dueDate: '' };
  const generic = run(admin, base);
  assert.equal(generic.data.category, 'general'); assert.equal(generic.data.authority, ''); assert.equal(generic.data.status, 'pending');
  for (const option of COMPLIANCE_CATEGORY_OPTIONS) {
    const requirement = run(admin, { ...base, category: option.value, authority: 'Synthetic contract reviewer' });
    assert.equal(requirement.data.category, option.value); assert.equal(requirement.data.status, 'pending');
  }
  assert.throws(() => run(admin, { ...base, category: 'automatic_legal_approval' }), status(422));
  assert.throws(() => run(admin, { ...base, authority: 'x'.repeat(201) }), status(422));
  assert.throws(() => run(admin, { ...base, source: '' }), status(422));
  assert.throws(() => run(admin, { action: 'review_compliance', id: generic.id, version: generic.version, status: 'complete', evidence: '', reviewedOn: new Date().toISOString().slice(0, 10) }), status(422));
  const reviewed = run(admin, { action: 'review_compliance', id: generic.id, version: generic.version, status: 'complete', evidence: 'Synthetic human review evidence', reviewedOn: new Date().toISOString().slice(0, 10) });
  assert.equal(reviewed.data.category, 'general'); assert.equal(reviewed.data.status, 'complete');
}));
