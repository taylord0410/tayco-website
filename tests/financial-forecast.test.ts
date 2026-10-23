import test from 'node:test';
import assert from 'node:assert/strict';
import type { Entry } from '../lib/erp';
import { financialForecast, isForecastPercentage, nextFinancialMonth } from '../lib/financial-forecast';

const asOf = '2026-10-23T12:00:00.000Z';
const options = { month: '2026-10', asOf };
const entry = (id: string, kind: Entry['kind'], data: Entry['data'], projectId = 'p'): Entry => ({
  id, kind, data, projectId, ownerId: 'fixture-owner', tenantId: 'fixture-company', version: 1,
  createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-20T10:00:00.000Z',
});
const project = (data: Entry['data'] = {}, id = 'p') => entry(id, 'project', { name: 'Synthetic project', status: 'active', ...data }, id);
const invoice = (id: string, data: Entry['data'] = {}, projectId = 'p') => entry(id, 'invoice', {
  reference: id, amountUsd: 100, status: 'approved', audience: 'client', issuedOn: '2026-10-02', dueDate: '2026-11-05', source: 'Synthetic invoice evidence', payments: [], ...data,
}, projectId);
const payment = (id = 'pay', amountUsd = 40, extra: Record<string, unknown> = {}) => ({
  id, amountUsd, occurredOn: '2026-10-15', reference: 'Synthetic payment', recordedAt: '2026-10-20T10:00:00.000Z', ...extra,
});
const plan = (id = 'plan', extra: Record<string, unknown> = {}) => ({
  id, title: 'Synthetic independent plan', direction: 'client_collection', amountUsd: 20,
  dueOn: '2026-11-10', status: 'planned', source: 'Synthetic planning source',
  createdAt: '2026-10-10T10:00:00.000Z', ...extra,
});
const proposal = (id = 'proposal', data: Entry['data'] = {}, projectId = 'p') => entry(id, 'proposal', {
  title: 'Synthetic sent proposal', amountUsd: 1000, currency: 'USD', status: 'sent',
  issuedOn: '2026-10-02', sentOn: '2026-10-03', validUntil: '2026-10-31',
  forecast: { expectedBillingOn: '2026-11-15', probabilityPercent: 50, allocationPercent: 40, source: 'Manual fixture assumptions', updatedAt: '2026-10-10T10:00:00.000Z' }, ...data,
}, projectId);

test('next month uses selected report month and handles December, leap years and calendar limits', () => {
  assert.equal(nextFinancialMonth('2026-10'), '2026-11');
  assert.equal(nextFinancialMonth('2026-12'), '2027-01');
  assert.equal(nextFinancialMonth('2028-01'), '2028-02');
  assert.equal(nextFinancialMonth('1900-01'), '1900-02');
  for (const month of ['2026-13', '2026-00', '2026-1', '1899-12', '10000-01', '9999-12', 'not-a-month']) assert.throws(() => nextFinancialMonth(month), RangeError);
  assert.throws(() => financialForecast([], { ...options, asOf: '2026-02-30T00:00:00Z' }), RangeError);
});
test('approved client collections, supplier payments and explicitly planned internal costs remain separate', () => {
  const rows = [project({ forecastPlans: [plan('explicit-internal', { direction: 'internal_cost', amountUsd: 12.34 })] }), invoice('client', { payments: [payment()] }), invoice('supplier', { amountUsd: 70, audience: 'vendor', payments: [payment('supplier-payment', 10)] }), invoice('cost', { amountUsd: 12.34, audience: 'internal' })];
  const report = financialForecast(rows, options);
  assert.equal(report.base.clientCollectionCents, 6000); assert.equal(report.base.vendorPaymentCents, 6000); assert.equal(report.base.internalCostCents, 1234);
  assert.equal(report.base.sources.length, 3); assert.equal(report.nextMonth, '2026-11');
  assert.equal(report.base.sources.filter(source => source.kind === 'invoice').length, 2); assert.equal(report.base.sources.filter(source => source.kind === 'project_plan').length, 1);
  assert.equal('cashBalance' in report, false); assert.equal('profit' in report, false); assert.equal('netRevenue' in report, false);
});
test('internal invoice audience never implicitly becomes an expense direction', () => {
  const report = financialForecast([invoice('internal-only', { audience: 'internal', amountUsd: 500 }), project({ forecastPlans: [plan('explicit-cost', { direction: 'internal_cost', amountUsd: 20 })] })], options);
  assert.equal(report.base.internalCostCents, 2000); assert.deepEqual(report.base.sources.map(source => source.id), ['explicit-cost']);
  assert.ok(report.coverage.warnings.some(warning => warning.code === 'ambiguous_invoice_direction' && warning.recordId === 'internal-only'));
});
test('paid, submitted, returned, fully settled and out-of-period invoices do not create base sources', () => {
  const rows = [invoice('paid', { status: 'paid' }), invoice('submitted', { status: 'submitted' }), invoice('returned', { status: 'returned' }), invoice('settled', { payments: [payment('full', 100)] }), invoice('other', { dueDate: '2026-12-01' })];
  assert.equal(financialForecast(rows, options).base.sources.length, 0);
});
test('missing and invalid due dates are coverage gaps, never guessed from issue dates', () => {
  const report = financialForecast([invoice('missing', { dueDate: null }), invoice('bad', { dueDate: '2026-11-31' }), invoice('unknown', { audience: null })], options);
  assert.equal(report.coverage.missingInvoiceDueDates, 1); assert.equal(report.base.sources.length, 0);
  assert.ok(report.coverage.warnings.some(warning => warning.code === 'invalid_invoice_due_date'));
  assert.ok(report.coverage.warnings.some(warning => warning.code === 'invalid_invoice_source'));
});
test('invalid, duplicate, future and pre-issue payment records exclude ambiguous outstanding balances', () => {
  const rows = [
    invoice('invalid', { payments: [payment('bad', -1)] }),
    invoice('duplicate', { payments: [payment('same', 20), payment('same', 20)] }),
    invoice('future', { payments: [payment('future-pay', 10, { recordedAt: '2026-11-01T00:00:00Z' })] }),
    invoice('before', { payments: [payment('before-issue', 10, { occurredOn: '2026-10-01' })] }),
    invoice('bad-list', { payments: 'unknown history' }),
  ];
  const report = financialForecast(rows, options);
  assert.equal(report.base.sources.length, 0); assert.equal(report.coverage.excludedInvoicePaymentSources, 5);
});
test('valid voids restore planned outstanding; malformed or future void metadata never hides payment ambiguity', () => {
  const report = financialForecast([
    invoice('valid', { payments: [payment('voided', 40, { voidedAt: '2026-10-22T00:00:00Z', voidReason: 'Synthetic correction' })] }),
    invoice('bad-void', { payments: [payment('invalid-void', 40, { voidedAt: 'garbage', voidReason: '' })] }),
    invoice('future-void', { payments: [payment('future-void', 40, { voidedAt: '2026-11-01T00:00:00Z', voidReason: 'Future correction' })] }),
  ], options);
  assert.equal(report.base.clientCollectionCents, 10000); assert.deepEqual(report.base.sources.map(source => source.id), ['valid']); assert.equal(report.coverage.excludedInvoicePaymentSources, 2);
});
test('overpayment and cross-invoice payment identity collisions are not clamped into invented balances', () => {
  const report = financialForecast([invoice('over', { payments: [payment('overpayment', 101)] }), invoice('a', { payments: [payment('shared', 10)] }), invoice('b', { payments: [payment('shared', 10)] })], options);
  assert.equal(report.base.sources.length, 0); assert.equal(report.coverage.excludedInvoicePaymentSources, 3);
  assert.ok(report.coverage.warnings.some(warning => warning.code === 'invoice_overpayment'));
});
test('future issue dates, impossible due chronology and invalid money never enter base', () => {
  const report = financialForecast([invoice('future-issue', { issuedOn: '2026-10-24' }), invoice('before-issue', { issuedOn: '2026-12-01' }), invoice('fraction', { amountUsd: 1.001 }), invoice('negative', { amountUsd: -1 })], options);
  assert.equal(report.base.sources.length, 0);
});
test('independent project plans are source-backed and cancelled, invalid or duplicate IDs are excluded', () => {
  const report = financialForecast([project({ forecastPlans: [plan(), plan('supplier', { direction: 'vendor_payment', amountUsd: 15 }), plan('cost', { direction: 'internal_cost', amountUsd: 3.21 }), plan('cancelled', { status: 'cancelled' }), plan('invalid', { amountUsd: '30' }), plan('duplicate'), plan('duplicate'), plan('late', { dueOn: '2026-12-01' })] })], options);
  assert.equal(report.base.clientCollectionCents, 2000); assert.equal(report.base.vendorPaymentCents, 1500); assert.equal(report.base.internalCostCents, 321);
  assert.equal(report.coverage.unlinkedManualPlans, 3); assert.equal(report.coverage.invalidPlans, 3);
  assert.ok(report.notes.some(note => note.includes('not fuzzy-deduplicated')));
});
test('linked plans never duplicate an invoice, including settled or differently dated invoices', () => {
  const report = financialForecast([
    project({ forecastPlans: [plan('linked', { linkedInvoiceId: 'approved' }), plan('linked-paid', { linkedInvoiceId: 'paid' }), plan('linked-other', { linkedInvoiceId: 'other-month' }), plan('unknown-link', { linkedInvoiceId: 'absent' })] }),
    invoice('approved', { payments: [payment()] }), invoice('paid', { status: 'paid' }), invoice('other-month', { dueDate: '2026-12-01' }),
  ], options);
  assert.equal(report.base.clientCollectionCents, 6000); assert.equal(report.coverage.duplicateLinkedPlans, 3); assert.equal(report.coverage.invalidPlans, 1);
  assert.equal(report.base.sources.filter(source => source.kind === 'project_plan').length, 0);
});
test('cross-project invoice links are invalid even when both projects are authorized', () => {
  const report = financialForecast([project({ forecastPlans: [plan('cross', { linkedInvoiceId: 'other' })] }), project({}, 'other-project'), invoice('other', {}, 'other-project')], options);
  assert.equal(report.coverage.invalidPlans, 1); assert.equal(report.base.clientCollectionCents, 10000);
});
test('sent proposal upside uses explicit probabilities and billing allocation, separate from base', () => {
  const report = financialForecast([project(), proposal(), proposal('draft', { status: 'draft' }), proposal('accepted', { status: 'accepted' }), proposal('declined', { status: 'declined' })], options);
  assert.equal(report.base.clientCollectionCents, 0); assert.equal(report.pipelineUpside.proposalFaceCents, 100000);
  assert.equal(report.pipelineUpside.allocatedBillingCents, 40000); assert.equal(report.pipelineUpside.weightedBillingCents, 20000);
  assert.equal(report.pipelineUpside.sources.length, 1); assert.equal(report.pipelineUpside.sources[0].probabilityPercent, 50);
});
test('missing assumptions and expired proposals remain visible as coverage without guessed probability', () => {
  const report = financialForecast([
    proposal('missing', { forecast: undefined }), proposal('incomplete', { forecast: { expectedBillingOn: '2026-11-01', probabilityPercent: 80, source: 'Missing allocation', updatedAt: asOf } }),
    proposal('expired', { validUntil: '2026-10-22' }), proposal('foreign', { currency: 'EUR' }),
  ], options);
  assert.equal(report.pipelineUpside.sources.length, 0); assert.equal(report.coverage.missingProposalAssumptions, 4);
  assert.ok(report.coverage.warnings.some(warning => warning.code === 'expired_proposal'));
});
test('billing after a future acceptance deadline is valid, zero percentages are explicit, and outside-month assumptions do not shift', () => {
  const forecast = { expectedBillingOn: '2026-11-15', probabilityPercent: 0, allocationPercent: 100, source: 'Explicit zero scenario', updatedAt: asOf };
  const report = financialForecast([proposal('zero', { forecast }), proposal('outside', { forecast: { ...forecast, expectedBillingOn: '2026-12-01', probabilityPercent: 100 } })], options);
  assert.equal(report.pipelineUpside.sources.length, 1); assert.equal(report.pipelineUpside.weightedBillingCents, 0); assert.equal(report.pipelineUpside.allocatedBillingCents, 100000);
  for (const invalid of [-1, 100.01, 50.001, NaN, Infinity, '50', null]) assert.equal(isForecastPercentage(invalid), false);
  for (const valid of [0, 100, 50.01]) assert.equal(isForecastPercentage(valid), true);
});
test('basis-point weighting rounds once to cents with large values and half-cent boundaries', () => {
  const make = (id: string, amountUsd: number, probabilityPercent: number, allocationPercent: number) => proposal(id, { amountUsd, forecast: { expectedBillingOn: '2026-11-01', probabilityPercent, allocationPercent, source: 'Arithmetic fixture', updatedAt: asOf } });
  const report = financialForecast([make('half', 0.01, 50, 100), make('quarter', 0.01, 50, 50), make('large', 1e10, 99.99, 99.99)], options);
  const rows = new Map(report.pipelineUpside.sources.map(row => [row.id, row]));
  assert.equal(rows.get('half')?.weightedCents, 1); assert.equal(rows.get('quarter')?.weightedCents, 0); assert.equal(rows.get('large')?.weightedCents, 999800010000);
  assert.equal(rows.get('large')?.allocatedCents, 999900000000);
});
test('completed projects require an explicit date, evidence, reporting month and current closed state', () => {
  const report = financialForecast([
    project({ status: 'closed', progress: 100, completedOn: '2026-10-20', completionEvidence: 'Owner acceptance, fixture reference' }, 'done'),
    project({ status: 'closed', completedOn: '2026-10-20' }, 'date-only'),
    project({ status: 'closed', completedOn: '2026-10-20', completionEvidence: '   ' }, 'blank-evidence'),
    project({ status: 'closed', progress: 100 }, 'undated'),
    project({ status: 'active', progress: 100, completedOn: '2026-10-20' }, 'active'),
    project({ status: 'closed', completedOn: '2026-09-20' }, 'past'),
    project({ status: 'closed', completedOn: '2026-10-24' }, 'future'),
  ], options);
  assert.deepEqual(report.completedProjects.map(project => project.id), ['done']); assert.equal(report.coverage.undatedClosedProjects, 2);
  assert.equal(report.base.sources.length, 0); assert.equal(report.pipelineUpside.sources.length, 0);
  assert.deepEqual(report.coverage.warnings.filter(row => row.code === 'missing_project_completion_evidence').map(row => row.recordId).sort(), ['blank-evidence', 'date-only', 'past']);
});
test('selected project filtering, duplicate identities, snapshot provenance and immutability are explicit', () => {
  const rows = [project({ forecastPlans: [plan()] }), invoice('first', { payments: [payment()] }), project({}, 'other'), invoice('other-invoice', {}, 'other'), proposal('other-proposal', {}, 'other')];
  const before = JSON.stringify(rows);for (const row of rows) { Object.freeze(row.data); Object.freeze(row); }Object.freeze(rows);
  const report = financialForecast(rows, { ...options, projectId: 'p' });assert.equal(report.base.clientCollectionCents, 8000);assert.equal(report.pipelineUpside.sources.length, 0);assert.equal(JSON.stringify(rows), before);
  const duplicate = invoice('duplicate');assert.equal(financialForecast([duplicate, duplicate], options).base.sources.length, 0);
  const future = { ...invoice('future'), updatedAt: '2026-11-01T00:00:00Z' };assert.equal(financialForecast([future], options).base.sources.length, 0);
  const past = financialForecast([invoice('current-state', { dueDate: '2026-10-05' })], { ...options, month: '2026-09' });assert.equal(past.base.clientCollectionCents, 10000);assert.ok(past.notes.some(note => note.includes('not a historical forecast')));
});
test('decimal cents remain exact and aggregate overflow fails closed', () => {
  const report = financialForecast([invoice('ten', { amountUsd: 0.1 }), invoice('twenty', { amountUsd: 0.2 })], options);assert.equal(report.base.clientCollectionCents, 30);
  const plans = Array.from({ length: 9008 }, (_, index) => plan('large-' + index, { amountUsd: 1e10 }));
  assert.throws(() => financialForecast([project({ forecastPlans: plans })], options), RangeError);
});
