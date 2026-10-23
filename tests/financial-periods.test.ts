import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Entry } from '../lib/erp';
import { financialPeriods, invoicePeriodDate, isFinancialDate, parseFinancialPeriod } from '../lib/financial-periods';

const asOf = '2026-03-31T23:59:59.000Z';
function invoice(id: string, data: Record<string, unknown> = {}, extra: Partial<Entry> = {}): Entry { return { id, kind: 'invoice', tenantId: 'fixture-company', projectId: 'project-1', ownerId: 'fixture-owner', version: 1, createdAt: '2026-01-10T10:00:00.000Z', updatedAt: '2026-03-01T10:00:00.000Z', data: { reference: id, amountUsd: 100, audience: 'client', status: 'approved', issuedOn: '2026-01-10', ...data }, ...extra }; }
const payment = (id: string, occurredOn: string, amountUsd: number, extra: Record<string, unknown> = {}) => ({ id, occurredOn, amountUsd, reference: 'Fixture payment ' + id, recordedAt: '2026-03-01T10:00:00.000Z', ...extra });
const report = (entries: Entry[], year: number | null = 2026, month: number | null = null, projectId?: string) => financialPeriods(entries, { year, month, asOf, projectId });

test('period parsing rejects ambiguous or impossible calendar ranges', () => {
  assert.deepEqual(parseFinancialPeriod(), { year: null, month: null }); assert.deepEqual(parseFinancialPeriod('2026', '02'), { year: 2026, month: 2 }); assert.deepEqual(parseFinancialPeriod('all', 'all'), { year: null, month: null });
  for (const [year, month] of [[2026, 0], [2026, 13], [2026, 1.5], [1800, 1], [10000, 1], ['2e3', 1], [true, 1], [null, 2]]) assert.throws(() => parseFinancialPeriod(year, month), RangeError);
  assert.equal(isFinancialDate('2028-02-29'), true); assert.equal(isFinancialDate('2026-02-29'), false); assert.equal(isFinancialDate('2026-04-31'), false);
});
test('issue cohorts and dated payment movements belong to their own months', () => {
  const rows = [invoice('jan', { amountUsd: 100, payments: [payment('jan-payment', '2026-02-05', 40)] }), invoice('feb', { issuedOn: '2026-02-01', amountUsd: 60, status: 'paid', payments: [payment('feb-payment', '2026-02-20', 60)] })];
  const january = report(rows, 2026, 1); assert.equal(january.selected.byAudience.client.issuedCents, 10000); assert.equal(january.selected.byAudience.client.paymentCents, 0);
  const february = report(rows, 2026, 2); assert.equal(february.selected.byAudience.client.issuedCents, 6000); assert.equal(february.selected.byAudience.client.paymentCents, 10000); assert.equal(february.payments.length, 2); assert.equal(february.invoices.length, 1);
  const all = report(rows); assert.equal(all.months.length, 12); assert.equal(all.months[0].byAudience.client.currentStatus.approved.cents, 10000); assert.equal(all.months[1].byAudience.client.currentStatus.paid.cents, 6000);
});
test('client billing and supplier costs remain separated rather than becoming invented net revenue', () => {
  const rows = [invoice('client', { amountUsd: 100, audience: 'client', payments: [payment('c', '2026-02-01', 20)] }), invoice('supplier', { amountUsd: 60, audience: 'vendor', payments: [payment('s', '2026-02-01', 10)] }), invoice('internal', { amountUsd: 7, audience: 'internal' }), invoice('unknown', { amountUsd: 3, audience: null })];
  const data = report(rows); assert.equal(data.selected.byAudience.client.issuedCents, 10000); assert.equal(data.selected.byAudience.vendor.issuedCents, 6000); assert.equal(data.selected.byAudience.internal.issuedCents, 700); assert.equal(data.selected.byAudience.unknown.issuedCents, 300); assert.equal('netRevenue' in data, false);
  assert.equal(report([rows[0]]).selected.byAudience.vendor.issuedCount, 0); assert.equal(report([rows[1]]).selected.byAudience.client.issuedCount, 0);
});
test('missing issue date is explicitly labeled as record-date fallback, invalid explicit dates stay unknown', () => {
  const fallback = invoice('fallback', { issuedOn: undefined }); const invalid = invoice('invalid', { issuedOn: '2026-02-30' }); const noDate = invoice('unknown', { issuedOn: null }, { createdAt: 'not-a-date' });
  assert.deepEqual(invoicePeriodDate(fallback), { date: '2026-01-10', dateSource: 'recorded_at' }); assert.deepEqual(invoicePeriodDate(invalid), { date: null, dateSource: 'unknown' });
  const data = report([fallback, invalid, noDate]); assert.equal(data.recordedDateFallbackCount, 1); assert.equal(data.unknownDateInvoices.length, 2); assert.equal(data.selected.byAudience.client.issuedCount, 1); assert.equal(report([invalid], null).invoices.length, 1);
});
test('legacy paid status never manufactures a payment date from updatedAt', () => {
  const legacy = invoice('legacy', { status: 'paid', payments: undefined }, { updatedAt: '2026-02-20T10:00:00.000Z' });
  const data = report([legacy], 2026, 2); assert.equal(data.selected.byAudience.client.paymentCents, 0); assert.equal(data.payments.length, 0); assert.equal(data.legacyPaidWithoutPaymentDateCount, 1); assert.equal(data.months[0].byAudience.client.currentStatus.paid.cents, 10000);
});
test('backdated payment is assigned to effective date and retains its later entry timestamp', () => {
  const row = invoice('backdated', { issuedOn: '2025-12-20', payments: [payment('backdate', '2026-01-05', 12.34)] });
  const january = report([row], 2026, 1); assert.equal(january.invoices.length, 0); assert.equal(january.selected.byAudience.client.paymentCents, 1234); assert.equal(january.payments[0].recordedAt, '2026-03-01T10:00:00.000Z');
});
test('UTC year boundary respects actual date origins instead of display timezone', () => {
  const row = invoice('utc', { issuedOn: undefined, payments: [payment('newyear', '2026-01-01', 10)] }, { createdAt: '2026-01-01T00:15:00+02:00' });
  assert.equal(invoicePeriodDate(row).date, '2025-12-31'); assert.equal(report([row], 2025, 12).selected.byAudience.client.issuedCount, 1); assert.equal(report([row], 2026, 1).selected.byAudience.client.paymentCents, 1000);
});
test('voids and duplicate IDs are excluded while dated remaining entries are preserved', () => {
  const row = invoice('history', { payments: [payment('void', '2026-01-20', 50, { voidedAt: '2026-02-01T10:00:00Z', voidReason: 'Fixture correction' }), payment('valid', '2026-02-01', 10), payment('duplicate', '2026-02-01', 5), payment('duplicate', '2026-02-02', 5)] });
  const data = report([row]); assert.equal(data.selected.byAudience.client.paymentCents, 1000); assert.deepEqual(data.payments.map(p => p.id), ['valid']); assert.ok(data.warnings.some(w => w.code === 'duplicate_payment_id'));
});
test('negative, zero, malformed, future and pre-issue payment entries never enter totals', () => {
  const row = invoice('invalid-payments', { payments: [payment('negative', '2026-01-20', -2), payment('zero', '2026-01-20', 0), payment('fraction', '2026-01-20', 1.001), payment('future', '2027-01-01', 1), payment('before-issue', '2026-01-01', 1), payment('no-reference', '2026-01-20', 1, { reference: '' }), payment('future-recorded', '2026-01-20', 1, { recordedAt: '2027-01-01T00:00:00Z' }), payment('bad-date', '2026-02-30', 1)] });
  const data = report([row]); assert.equal(data.payments.length, 0); assert.equal(data.selected.byAudience.client.paymentCents, 0); assert.equal(data.warnings.filter(w => w.code === 'invalid_payment').length, 8);
});
test('zero invoice amounts are valid and null/overprecise amounts remain unknown', () => {
  const data = report([invoice('zero', { amountUsd: 0 }), invoice('null', { amountUsd: null }), invoice('fraction', { amountUsd: 1.001 }), invoice('negative', { amountUsd: -1 })]);
  assert.equal(data.selected.byAudience.client.issuedCount, 1); assert.equal(data.selected.byAudience.client.issuedCents, 0); assert.equal(data.warnings.filter(w => w.code === 'invalid_invoice_amount').length, 3);
});
test('project scoping is applied before invoice and payment aggregation and the input is immutable', () => {
  const first = invoice('first', { payments: [payment('first', '2026-02-01', 0.1)] }); const second = invoice('second', { amountUsd: 1000, payments: [payment('second', '2026-02-01', 1000)] }, { projectId: 'project-2' });
  const original = JSON.stringify([first, second]); Object.freeze(first.data); Object.freeze(first); const data = report([first, second], 2026, null, 'project-1'); assert.equal(data.selected.byAudience.client.issuedCents, 10000); assert.equal(data.selected.byAudience.client.paymentCents, 10); assert.equal(JSON.stringify([first, second]), original);
});
test('cents sum exactly, empty months stay empty and snapshot timestamps are validated', () => {
  const data = report([invoice('decimal-a', { amountUsd: 0.1 }), invoice('decimal-b', { amountUsd: 0.2 })]); assert.equal(data.selected.byAudience.client.issuedCents, 30); assert.equal(data.months[11].byAudience.client.issuedCents, 0); assert.equal(data.months[11].byAudience.client.issuedCount, 0);
  assert.throws(() => financialPeriods([], { year: 2026, month: 1, asOf: '2026-02-30T00:00:00Z' }), RangeError);
  assert.throws(() => financialPeriods([], { year: 2026, month: 1, asOf: '2026-12-31T24:00:00Z' }), RangeError);
});
