import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Actor } from '../lib/auth';
import { database, execute, snapshot, ErpError } from '../lib/erp';
import { takeoffEstimateSnapshots } from '../lib/takeoff-estimate-source';

const folder = mkdtempSync(path.join(os.tmpdir(), 'tayco-estimate-recovery-'));
process.env.TAYCO_ERP_DB_PATH = path.join(folder, 'erp.sqlite');
process.env.TAYCO_AUTH_DB_PATH = path.join(folder, 'auth.sqlite');
test.after(() => { database().close(); try { rmSync(folder, { recursive: true, force: true }); } catch { /* Windows may retain an auth SQLite handle until test worker exits. */ } });
const admin: Actor = { id: 'fixture-admin', email: 'fixture-admin@example.test', role: 'admin', tenantId: 'estimate-fixture', projectIds: [] };
const run = (actor: Actor, input: Record<string, unknown>) => execute(actor, randomUUID(), input);
const status = (code: number) => (error: unknown) => error instanceof ErpError && error.status === code;
const scenario = (extra: Record<string, unknown> = {}) => Buffer.from(JSON.stringify({ schema: 'takeoff_active_scenario.v1', project_id: 'synthetic_fixture', updated_at: '2026-10-01T11:00:00-04:00', active_total_bid_usd: 125, active_direct_cost_usd: 90, ...extra }));
const payload = (extra: Record<string, unknown> = {}) => ({ project_id: 'synthetic_fixture', project_name: 'Synthetic estimating fixture', generated_at: '2026-10-01 15:00 UTC', financial_summary: { currency: 'USD', direct_cost_usd: 100, grand_total_bid_usd: 140 }, materials_count: 4, csi_packages_count: 2, ...extra });
const table = '<table id="csi-summary-table"><tr><th>Code</th></tr><tr><td>CSI 01.01</td><td>General &amp; setup</td><td>A-1</td><td>×1</td><td>2</td><td>$40.05</td></tr><tr><td>CSI 03.01</td><td>Concrete</td><td>S-1</td><td>×1</td><td>2</td><td>$59.95</td></tr></table>';
const report = (data = payload(), rows = table) => Buffer.from('<script>globalThis.__taycoEstimateExecuted = true; throw new Error("must never run");</script><script id="report-json-data" type="application/json">' + JSON.stringify(data) + '</script>' + rows);
const sources = (projectId = 'fixture-project') => ({ projectId, projectSlug: 'synthetic_fixture', scenario: { reference: 'private-estimates/fixture/scenario.json', bytes: scenario() }, report: { reference: 'private-estimates/fixture/report.html', bytes: report() }, capturedAt: '2026-10-23T12:00:00Z' });

test('inert HTML produces independent source revisions with exact direct-cost reconciliation', () => {
  const [first, second] = takeoffEstimateSnapshots(sources());
  assert.equal((globalThis as Record<string, unknown>).__taycoEstimateExecuted, undefined);
  assert.equal(first.status, 'estimate'); assert.equal(first.amountUsd, 125); assert.equal(second.amountUsd, 140);
  assert.notEqual(first.id, second.id); assert.notEqual(first.sourceSha256, second.sourceSha256);
  assert.equal(second.breakdownBasis, 'direct_cost'); assert.equal(second.breakdownReconciled, true);
  assert.deepEqual(second.breakdown.map(row => row.amountUsd), [40.05, 59.95]); assert.equal(second.breakdown[0].label, 'General & setup');
  assert.equal(first.estimatedOn, '2026-10-01T11:00:00-04:00'); assert.equal(second.estimatedOn, '2026-10-01T15:00:00Z');
  assert.ok(first.sourceFacts.some(fact => fact.includes('totals differ'))); assert.equal(first.sourceAvailability, 'archived');
});
test('wrong project, currency, schema and over-limit source fail before importing anything', () => {
  const input = sources();
  assert.throws(() => takeoffEstimateSnapshots({ ...input, projectSlug: '../fixture' }));
  assert.throws(() => takeoffEstimateSnapshots({ ...input, scenario: { ...input.scenario, bytes: scenario({ project_id: 'another' }) } }));
  assert.throws(() => takeoffEstimateSnapshots({ ...input, scenario: { ...input.scenario, bytes: scenario({ schema: 'unknown.v1' }) } }));
  assert.throws(() => takeoffEstimateSnapshots({ ...input, report: { ...input.report, bytes: report(payload({ project_id: 'another' })) } }));
  assert.throws(() => takeoffEstimateSnapshots({ ...input, report: { ...input.report, bytes: report(payload({ financial_summary: { currency: 'EUR', direct_cost_usd: 100, grand_total_bid_usd: 140 } })) } }));
  assert.throws(() => takeoffEstimateSnapshots({ ...input, report: { ...input.report, bytes: Buffer.alloc(10 * 1024 * 1024 + 1) } }));
});
test('APU is an independent third source with reconciled packages and three direct-cost tiers', () => {
  const input = sources();
  const apu = { schema: 'takeoff_apu_procurement.v1', project_id: 'synthetic_fixture', updated_at: '2026-10-02T12:00:00Z', apu_breakdown: {
    project_id: 'synthetic_fixture', status: 'ok', total_direct_cost_usd: 90, total_bid_cost_usd: 125,
    total_materials_usd: 45, total_labor_usd: 30, total_equipment_usd: 15,
    total_man_hours: 12, total_crew_days: 2,
    apu_items: [10, 20, 5, 15, 10, 20, 10].map((subtotal_usd, index) => ({ csi_code: 'CSI ' + String(index + 1).padStart(2, '0'), csi_division: 'Synthetic package ' + (index + 1), subtotal_usd, man_hours_total: 1, crew_composition: 'Synthetic crew estimate', sheet_ref: 'A-1' })),
  } };
  const source = (value: unknown) => ({ reference: 'private-estimates/fixture/apu.json', bytes: Buffer.from(JSON.stringify(value)) });
  const rows = takeoffEstimateSnapshots({ ...input, apu: source(apu) });
  assert.equal(rows.length, 3); assert.equal(new Set(rows.map(row => row.sourceSha256)).size, 3);
  assert.deepEqual(rows.map(row => row.amountUsd), [125, 140, 125]);
  const third = rows[2]; assert.equal(third.breakdown.length, 7); assert.equal(third.breakdownReconciled, true);
  assert.equal(third.breakdownBasis, 'direct_cost'); assert.equal(third.directCostUsd, 90);
  assert.deepEqual(third.costTiers.map(row => row.amountUsd), [45, 30, 15]); assert.equal(third.costTiersReconciled, true);
  assert.ok(third.sourceFacts.some(fact => fact.includes('not actual execution or paid payroll')));
  for (const wrong of [{ ...apu, project_id: 'another-project' }, { ...apu, apu_breakdown: { ...apu.apu_breakdown, project_id: 'another-project' } }]) assert.throws(() => takeoffEstimateSnapshots({ ...input, apu: source(wrong) }));
  const unmatched = takeoffEstimateSnapshots({ ...input, apu: source({ ...apu, apu_breakdown: { ...apu.apu_breakdown, total_labor_usd: 31 } }) });
  assert.equal(unmatched[2].breakdownReconciled, true); assert.equal(unmatched[2].costTiersReconciled, false);
});
test('malformed payloads fail; absent or mismatched table never claims reconciliation', () => {
  const input = sources();
  for (const bytes of [Buffer.from('<p>No payload</p>'), Buffer.from('<script id="report-json-data">bad json</script>'), report(payload({ generated_at: '2026-02-30 10:00 UTC' })), report(payload(), table.replace('$40.05', 'not a number'))]) {
    assert.throws(() => takeoffEstimateSnapshots({ ...input, report: { ...input.report, bytes } }));
  }
  for (const rows of ['', table.replace('$40.05', '$40.06'), '<table id="csi-summary-table"><tr><td>CSI 01</td><td>Incomplete</td></tr></table>']) {
    const [, estimate] = takeoffEstimateSnapshots({ ...input, report: { ...input.report, bytes: report(payload(), rows) } });
    assert.equal(estimate.breakdownReconciled, false);
  }
});
test('missing CSI values never become zero; only explicit monetary zero reconciles', () => {
  const input = sources();
  const zeroPayload = payload({ financial_summary: { currency: 'USD', direct_cost_usd: 0, grand_total_bid_usd: 0 } });
  const zeroTable = (value: string) => '<table id="csi-summary-table"><tr><td>CSI 01.01</td><td>Synthetic zero scope</td><td>A-1</td><td>×1</td><td>1</td><td>' + value + '</td></tr></table>';
  for (const value of ['', ' ', '$', '$ ', '$1,00', '$1,2,3.00', '1.000,50', '$.00', '-0', '0.001']) {
    assert.throws(() => takeoffEstimateSnapshots({ ...input, report: { ...input.report, bytes: report(zeroPayload, zeroTable(value)) } }), 'Reject missing or malformed amount: ' + JSON.stringify(value));
  }
  for (const value of ['0', '0.00', '$0.00']) {
    const [, estimate] = takeoffEstimateSnapshots({ ...input, report: { ...input.report, bytes: report(zeroPayload, zeroTable(value)) } });
    assert.equal(estimate.directCostUsd, 0); assert.equal(estimate.amountUsd, 0); assert.equal(estimate.breakdown[0].amountUsd, 0); assert.equal(estimate.breakdownReconciled, true);
  }
});
test('only administrator can recover/import and project restoration does not infer operational records', () => {
  for (const role of ['staff', 'client', 'vendor'] as const) assert.throws(() => run({ ...admin, role }, { action: 'restore_estimate_project', sourceProjectSlug: 'role_fixture', name: 'Fixture' }), status(403));
  const project = run(admin, { action: 'restore_estimate_project', sourceProjectSlug: 'synthetic_fixture', name: 'Recovered synthetic fixture' });
  assert.equal(project.data.status, 'planning'); assert.equal(project.data.progress, null); assert.equal(project.data.budgetUsd, null);
  assert.equal(project.data.progress === 0, false, 'An estimate recovery does not establish measured execution progress.');
  assert.equal(project.data.budgetApprovedOn, undefined);
  const again = run(admin, { action: 'restore_estimate_project', sourceProjectSlug: 'synthetic_fixture', name: 'Do not overwrite existing name' });
  assert.equal(again.id, project.id); assert.equal(again.data.name, project.data.name);
  const estimates = takeoffEstimateSnapshots(sources(project.id));
  for (const role of ['staff', 'client', 'vendor'] as const) assert.throws(() => run({ ...admin, role, projectIds: [project.id] }, { action: 'import_project_estimate', projectId: project.id, estimate: estimates[0] }), status(403));
  const imported = estimates.map(estimate => run(admin, { action: 'import_project_estimate', projectId: project.id, estimate }));
  assert.equal(imported.length, 2);
  const state = snapshot(admin);
  assert.equal(state.entries.filter(entry => entry.kind === 'invoice').length, 0);
  assert.equal(state.entries.filter(entry => entry.kind === 'estimate' && entry.projectId === project.id).length, 2);
  assert.equal(state.entries.find(entry => entry.id === project.id)?.data.budgetUsd, null);
  assert.equal(database().prepare('SELECT COUNT(*) AS count FROM outbox').get()?.count, 0);
});
test('re-import under new command/capture time deduplicates and changed values cannot overwrite source identity', () => {
  const project = run(admin, { action: 'restore_estimate_project', sourceProjectSlug: 'synthetic_fixture', name: 'Fixture' });
  const [estimate] = takeoffEstimateSnapshots(sources(project.id));
  const first = run(admin, { action: 'import_project_estimate', projectId: project.id, estimate });
  const again = run(admin, { action: 'import_project_estimate', projectId: project.id, estimate: { ...estimate, capturedAt: '2026-10-23T13:00:00Z' } });
  assert.equal(again.id, first.id); assert.equal(again.version, first.version); assert.equal(again.data.capturedAt, estimate.capturedAt);
  for (const change of [{ amountUsd: 999 }, { sourceSha256: 'f'.repeat(64) }, { id: 'new-id-same-source' }]) assert.throws(() => run(admin, { action: 'import_project_estimate', projectId: project.id, estimate: { ...estimate, ...change } }), status(409));
  const changedSource = { ...estimate, id: 'distinct-revision', sourceSha256: 'e'.repeat(64), amountUsd: 130, version: 'revised fixture' };
  const next = run(admin, { action: 'import_project_estimate', projectId: project.id, estimate: changedSource });
  assert.notEqual(next.id, first.id);
});
test('source/project mismatch, external role visibility and cross-tenant access remain denied', () => {
  const project = run(admin, { action: 'restore_estimate_project', sourceProjectSlug: 'synthetic_fixture', name: 'Fixture' });
  const [estimate] = takeoffEstimateSnapshots(sources(project.id));
  for (const change of [{ projectId: 'another-project' }, { sourceProjectSlug: 'another_slug' }]) assert.throws(() => run(admin, { action: 'import_project_estimate', projectId: project.id, estimate: { ...estimate, ...change } }), status(422));
  const other = { ...admin, tenantId: 'other-company' };
  assert.throws(() => run(other, { action: 'import_project_estimate', projectId: project.id, estimate }), status(404));
  for (const role of ['client', 'vendor'] as const) {
    const actor = { ...admin, id: 'fixture-' + role, role, projectIds: [project.id] };
    assert.ok(!snapshot(actor).entries.some(entry => entry.kind === 'estimate'));
  }
  assert.ok(!snapshot(other).entries.some(entry => entry.projectId === project.id));
});
