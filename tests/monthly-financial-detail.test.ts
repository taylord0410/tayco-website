import test from 'node:test';
import assert from 'node:assert/strict';
import type { Entry } from '../lib/erp';
import { monthlyFinancialDetail } from '../lib/monthly-financial-detail';
const asOf = '2026-10-23T12:00:00.000Z';
const record = (id: string, kind: Entry['kind'], data: Entry['data'], projectId = 'p'): Entry => ({ id, kind, data, projectId, ownerId: 'fixture', tenantId: 'fixture', version: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: asOf });
const project = (id = 'p', data: Entry['data'] = {}) => record(id, 'project', { name: id, status: 'active', ...data }, id);
const invoice = (id: string, audience: string, payments: Record<string, unknown>[], projectId = 'p') => record(id, 'invoice', { reference: id, amountUsd: 100, audience, status: 'approved', issuedOn: '2026-09-20', payments }, projectId);
const payment = (id: string, amountUsd: number, occurredOn: string, extra = {}) => ({ id, amountUsd, occurredOn, reference: id, recordedAt: asOf, ...extra });
const options = { month: '2026-10', asOf };
test('weekly cash result uses dated receipts/payments, exact cents, clipped Monday–Sunday weeks and no future movements', () => {
  const report = monthlyFinancialDetail([project(), invoice('client', 'client', [payment('a', .1, '2026-10-04'), payment('b', .2, '2026-10-05'), payment('future', 90, '2026-10-25')]), invoice('provider', 'vendor', [payment('c', .05, '2026-10-05')]), invoice('internal', 'internal', [payment('d', 3, '2026-10-05')])], options);
  assert.deepEqual(report.weeks.map(week => [week.from, week.through]), [['2026-10-01','2026-10-04'],['2026-10-05','2026-10-11'],['2026-10-12','2026-10-18'],['2026-10-19','2026-10-25'],['2026-10-26','2026-10-31']]);
  assert.deepEqual(report.totals, { incomeCents: 30, expenseCents: 5, resultCents: 25, unclassifiedCents: 300 });
  assert.equal(report.weeks[0].incomeCents, 10); assert.equal(report.weeks[1].resultCents, 15); assert.equal(report.weeks[4].future, true); assert.match(report.basis, /not accounting profit/);
});
test('voided/duplicated payment references and duplicate source identities cannot inflate a week', () => {
  const duplicate = invoice('duplicate', 'client', [payment('a', 50, '2026-10-03')]);
  const report = monthlyFinancialDetail([project(), duplicate, duplicate, invoice('ok', 'client', [payment('same', 20, '2026-10-03'), payment('same', 20, '2026-10-03'), payment('void', 30, '2026-10-04', { voidedAt: asOf }), payment('valid', .01, '2026-10-05')])], options);
  assert.equal(report.totals.incomeCents, 1); assert.ok(report.warnings.length > 0);
});
test('monthly projects use explicit schedule or dated activity; current active state and createdAt do not fabricate history', () => {
  const report = monthlyFinancialDetail([project(), project('scheduled', { plannedStart: '2026-09-01', plannedEnd: '2026-11-01' }), project('hours'), project('done', { status: 'closed', completedOn: '2026-10-10', completionEvidence: 'Acceptance' }), project('invalid', { plannedStart: '2026-10-35', plannedEnd: '2026-11-01' }), record('work', 'hours', { date: '2026-10-01', hours: 1 }, 'hours')], options);
  assert.deepEqual(report.projects.map(item => item.id), ['done','hours','scheduled']); assert.equal(report.projects.find(item => item.id === 'scheduled')?.reasons[0], 'Recorded schedule overlaps this month');
});
test('selected project excludes other project sources and months do not mix years', () => {
  const input = [project(), project('other'), invoice('a','client',[payment('p',10,'2026-10-01')]), invoice('b','client',[payment('o',20,'2026-10-01')],'other'), invoice('prior','client',[payment('old',30,'2025-10-01')])];
  const before = JSON.stringify(input); const report = monthlyFinancialDetail(input, { ...options, projectId: 'p' }); assert.equal(report.totals.incomeCents, 1000); assert.deepEqual(report.projects.map(item => item.id), ['p']); assert.equal(JSON.stringify(input), before);
  assert.throws(() => monthlyFinancialDetail(input, { ...options, month: '2026-13' }));
});
