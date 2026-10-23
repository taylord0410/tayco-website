import test from 'node:test';
import assert from 'node:assert/strict';
import type { Entry } from '../lib/erp';
import { buildWorkLogReport, parseWorkLogSelection, workLogCsv, workLogIsoWeek } from '../lib/work-log-report';

const asOf = '2026-10-23T16:00:00.000Z';
const project: Entry = { id: 'project-a', kind: 'project', tenantId: 'fixture', ownerId: 'admin', projectId: 'project-a', version: 1, data: { name: 'Synthetic project' }, createdAt: asOf, updatedAt: asOf };
function hours(id: string, data: Record<string, unknown> = {}, extra: Partial<Entry> = {}): Entry {
  return { ...project, id, kind: 'hours', ownerId: 'supplier-one', data: { date: '2026-01-05', hours: 1, trade: 'Electrical', status: 'submitted', ...data }, ...extra };
}
function report(entries: Entry[], filters: Parameters<typeof parseWorkLogSelection>[0] = {}) { return buildWorkLogReport([project, ...entries], { ...parseWorkLogSelection(filters), asOf }); }

test('inclusive real UTC work dates and ISO weeks preserve the week-year boundary', () => {
  assert.equal(workLogIsoWeek('2021-01-01'), '2020-W53');
  assert.equal(workLogIsoWeek('2021-01-04'), '2021-W01');
  assert.equal(workLogIsoWeek('2024-12-30'), '2025-W01');
  assert.equal(workLogIsoWeek('2020-12-31'), '2020-W53');
  assert.equal(workLogIsoWeek('2028-02-29'), '2028-W09');
  const result = report([hours('before', { date: '2026-01-04' }), hours('first'), hours('last', { date: '2026-01-06' }), hours('after', { date: '2026-01-07' })], { from: '2026-01-05', to: '2026-01-06' });
  assert.deepEqual(result.rows.map(row => row.id), ['last', 'first']); assert.equal(result.totals.exactHours, '2');
});
test('date, status and project filters reject ambiguous inputs instead of widening scope', () => {
  for (const input of [{ from: '2026-02-29' }, { to: '2026-04-31' }, { from: '2026-01-02', to: '2026-01-01' }, { from: '2026-01-01T00:00:00Z' }, { status: 'paid' }, { status: ['approved'] }, { projectId: '../../project-a' }]) assert.throws(() => parseWorkLogSelection(input), RangeError);
  assert.deepEqual(parseWorkLogSelection(), { from: null, to: null, status: 'all' });
  assert.throws(() => buildWorkLogReport([], { ...parseWorkLogSelection(), asOf: 'unknown' }), RangeError);
  assert.throws(() => buildWorkLogReport([], { ...parseWorkLogSelection(), asOf: '2026-10-23T10:00:00' }), RangeError);
  assert.throws(() => workLogIsoWeek('2026-02-29'), RangeError);
});
test('grouping separates project, ISO week, trade, submitter and review status', () => {
  const result = report([hours('a'), hours('b', { hours: 2 }), hours('status', { status: 'approved' }), hours('owner', {}, { ownerId: 'supplier-two' }), hours('trade', { trade: 'Plumbing' }), hours('week', { date: '2026-01-12' }), hours('project', {}, { projectId: 'project-b' })]);
  assert.equal(result.groups.length, 6); assert.equal(result.totals.count, 7); assert.equal(result.totals.exactHours, '8');
  const group = result.groups.find(row => row.recordIds.includes('a'))!; assert.equal(group.exactHours, '3'); assert.equal(group.count, 2); assert.equal(group.isoWeek, '2026-W02');
  assert.equal(result.totals.byStatus.approved.exactHours, '1'); assert.equal(result.totals.byStatus.returned.exactHours, '0');
  assert.equal(report(result.rows.map(row => hours(row.id, { hours: row.hours, status: row.status }, { projectId: row.projectId })), { projectId: 'project-b' }).totals.count, 1);
  assert.equal(report([hours('a'), hours('b', { status: 'approved' })], { status: 'approved' }).rows[0].id, 'b');
});
test('decimal sums retain source precision without binary addition drift or invented rounding', () => {
  assert.equal(report([hours('a', { hours: .1 }), hours('b', { hours: .2 })]).totals.exactHours, '0.3');
  const result = report([hours('source', { hours: .30000000000000004 }), hours('more', { hours: .1 })]);
  assert.equal(result.totals.exactHours, '0.40000000000000004');
  assert.equal(result.rows.find(row => row.id === 'source')!.exactHours, '0.30000000000000004');
  assert.equal(report([]).totals.exactHours, '0'); assert.equal(report([hours('full', { hours: 24 })]).totals.exactHours, '24');
});
test('invalid and duplicated sources are excluded with coverage warnings; createdAt never supplies a work date', () => {
  const result = report([hours('missing-date', { date: null }), hours('bad-date', { date: '2026-02-29' }), hours('bad-hours', { hours: '8' }), hours('negative', { hours: -1 }), hours('over', { hours: 25 }), hours('status', { status: 'paid' }), hours('duplicate'), hours('duplicate', { hours: 20 }), hours('future', { date: '2026-12-01', trade: '' }, { ownerId: '' }), hours('good')]);
  assert.equal(result.totals.count, 2); assert.equal(result.excludedRecordCount, 8);
  assert.equal(result.warnings.filter(row => row.code === 'duplicate_id').length, 1);
  assert.equal(result.warnings.filter(row => row.code === 'invalid_date').length, 2);
  assert.ok(result.warnings.some(row => row.code === 'future_work_date'));
  assert.ok(result.warnings.some(row => row.code === 'missing_owner')); assert.ok(result.warnings.some(row => row.code === 'missing_trade'));
  assert.equal(result.rows.some(row => row.id === 'missing-date'), false);
});
test('CSV is an allowlisted source export with exact hours, fixed width and spreadsheet escaping', () => {
  const result = report([hours('formula', { trade: '=SUM(1,2)', hours: .1, privateSalary: 999, response: 'Private review detail' })]);
  const csv = workLogCsv(result); assert.ok(csv.startsWith('\uFEFF')); assert.match(csv, /'\=SUM\(1,2\)/); assert.match(csv, /"0.1"/);
  assert.doesNotMatch(csv, /999|privateSalary|Private review detail/); assert.match(csv, /not payroll or a WH-347 certification/);
  assert.equal(JSON.parse(JSON.stringify(result)).totals.exactHours, '0.1');
  const lengths = csv.trim().split('\r\n').map(row => row.match(/"(?:[^"]|"")*"/g)!.length); assert.equal(new Set(lengths).size, 1);
});
