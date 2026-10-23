import type { Entry } from './erp';
import { isValidUsdAmount } from './financial-values';

export type FinancialAudience = 'client' | 'vendor' | 'internal' | 'unknown';
export type FinancialStatus = 'submitted' | 'approved' | 'paid' | 'returned';
export type FinancialPeriod = { year: number | null; month: number | null };
export type AudienceTotals = { issuedCount: number; issuedCents: number; paymentCount: number; paymentCents: number; currentStatus: Record<FinancialStatus, { count: number; cents: number }> };
export type PeriodTotals = { byAudience: Record<FinancialAudience, AudienceTotals> };
export type InvoicePeriodRow = { entry: Entry; date: string | null; dateSource: 'issued_on' | 'recorded_at' | 'unknown'; audience: FinancialAudience; status: FinancialStatus | null; amountCents: number | null };
export type PaymentPeriodRow = { invoiceId: string; projectId: string; audience: FinancialAudience; id: string; occurredOn: string; amountCents: number; reference: string; recordedAt: string };
export type FinancialWarning = { code: 'invalid_invoice_date' | 'invalid_invoice_amount' | 'invalid_invoice_status' | 'unknown_audience' | 'invalid_payment' | 'duplicate_payment_id' | 'legacy_paid_date_unknown' | 'aggregate_overflow'; invoiceId: string };
const AUDIENCES: FinancialAudience[] = ['client', 'vendor', 'internal', 'unknown'];
const STATUSES: FinancialStatus[] = ['submitted', 'approved', 'paid', 'returned'];

/** Query/GUI period parser. A calendar month is meaningful only with an explicit year. */
export function parseFinancialPeriod(year?: unknown, month?: unknown): FinancialPeriod {
  const parse = (value: unknown, min: number, max: number) => {
    if (value === undefined || value === null || value === '' || value === 'all') return null;
    if ((typeof value !== 'string' && typeof value !== 'number') || !/^\d+$/.test(String(value))) throw new RangeError('Choose a valid financial period.');
    const n = Number(value); if (!Number.isInteger(n) || n < min || n > max) throw new RangeError('Choose a valid financial period.'); return n;
  };
  const result = { year: parse(year, 1900, 9999), month: parse(month, 1, 12) };
  if (result.month !== null && result.year === null) throw new RangeError('Choose a year before choosing a month.');
  return result;
}
export function isFinancialDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^(19|[2-9]\d)\d{2}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function timestamp(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value) || !isFinancialDate(value.slice(0, 10))) return null;
  const parsed = new Date(value); return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}
export function invoicePeriodDate(entry: Entry): Pick<InvoicePeriodRow, 'date' | 'dateSource'> {
  if (entry.data.issuedOn !== undefined && entry.data.issuedOn !== null && entry.data.issuedOn !== '') return isFinancialDate(entry.data.issuedOn) ? { date: entry.data.issuedOn, dateSource: 'issued_on' } : { date: null, dateSource: 'unknown' };
  const recorded = timestamp(entry.createdAt); return recorded ? { date: recorded.slice(0, 10), dateSource: 'recorded_at' } : { date: null, dateSource: 'unknown' };
}
function emptyAudience(): AudienceTotals { return { issuedCount: 0, issuedCents: 0, paymentCount: 0, paymentCents: 0, currentStatus: { submitted: { count: 0, cents: 0 }, approved: { count: 0, cents: 0 }, paid: { count: 0, cents: 0 }, returned: { count: 0, cents: 0 } } }; }
function emptyTotals(): PeriodTotals { return { byAudience: { client: emptyAudience(), vendor: emptyAudience(), internal: emptyAudience(), unknown: emptyAudience() } }; }
function matches(date: string | null, period: FinancialPeriod) { if (!date) return period.year === null && period.month === null; return (period.year === null || Number(date.slice(0, 4)) === period.year) && (period.month === null || Number(date.slice(5, 7)) === period.month); }
function audience(value: unknown): FinancialAudience { return AUDIENCES.includes(value as FinancialAudience) ? value as FinancialAudience : 'unknown'; }

/**
 * Pure reporting over an already-authorized snapshot. This function is NOT an access-control filter.
 * Invoice month describes the issuance cohort; payment month describes a separately recorded effective date.
 * Current status never supplies a missing payment date or proves bank settlement.
 */
export function financialPeriods(entries: readonly Entry[], options: FinancialPeriod & { asOf: string; projectId?: string }) {
  const selection = parseFinancialPeriod(options.year, options.month); const asOf = timestamp(options.asOf);
  if (!asOf) throw new RangeError('A valid UTC snapshot timestamp is required.');
  const chartYear = selection.year ?? Number(asOf.slice(0, 4));
  const years = new Set<number>([chartYear]); const warnings: FinancialWarning[] = [];
  const invoices: InvoicePeriodRow[] = []; const payments: PaymentPeriodRow[] = [];
  for (const entry of entries.filter(entry => entry.kind === 'invoice' && (!options.projectId || entry.projectId === options.projectId))) {
    const invoiceAudience = audience(entry.data.audience); const date = invoicePeriodDate(entry);
    const amountCents = isValidUsdAmount(entry.data.amountUsd) ? Math.round(entry.data.amountUsd * 100) : null;
    const status = STATUSES.includes(entry.data.status as FinancialStatus) ? entry.data.status as FinancialStatus : null;
    invoices.push({ entry, ...date, amountCents, status, audience: invoiceAudience });
    if (date.date) years.add(Number(date.date.slice(0, 4))); else warnings.push({ code: 'invalid_invoice_date', invoiceId: entry.id });
    if (amountCents === null) warnings.push({ code: 'invalid_invoice_amount', invoiceId: entry.id });
    if (!status) warnings.push({ code: 'invalid_invoice_status', invoiceId: entry.id });
    if (invoiceAudience === 'unknown') warnings.push({ code: 'unknown_audience', invoiceId: entry.id });
    const list = entry.data.payments === undefined || entry.data.payments === null ? [] : entry.data.payments;
    if (!Array.isArray(list)) { warnings.push({ code: 'invalid_payment', invoiceId: entry.id }); if (status === 'paid') warnings.push({ code: 'legacy_paid_date_unknown', invoiceId: entry.id }); continue; }
    const ids = new Map<string, number>();
    for (const item of list) if (item && typeof item === 'object' && typeof item.id === 'string') ids.set(item.id, (ids.get(item.id) || 0) + 1);
    let datedPayments = 0;
    for (const item of list) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) { warnings.push({ code: 'invalid_payment', invoiceId: entry.id }); continue; }
      if (item.voidedAt !== undefined && item.voidedAt !== null && item.voidedAt !== '') continue;
      if (typeof item.id === 'string' && (ids.get(item.id) || 0) > 1) { warnings.push({ code: 'duplicate_payment_id', invoiceId: entry.id }); continue; }
      const recordedAt = timestamp(item.recordedAt);
      if (typeof item.id !== 'string' || !item.id || item.id.length > 100 || !isFinancialDate(item.occurredOn) || !isValidUsdAmount(item.amountUsd) || item.amountUsd <= 0 || typeof item.reference !== 'string' || !item.reference.trim() || item.reference.length > 200 || !recordedAt || recordedAt > asOf || item.occurredOn > asOf.slice(0, 10) || (date.dateSource === 'issued_on' && date.date !== null && item.occurredOn < date.date)) { warnings.push({ code: 'invalid_payment', invoiceId: entry.id }); continue; }
      payments.push({ invoiceId: entry.id, projectId: entry.projectId, audience: invoiceAudience, id: item.id, occurredOn: item.occurredOn, amountCents: Math.round(item.amountUsd * 100), reference: item.reference, recordedAt });
      years.add(Number(item.occurredOn.slice(0, 4))); datedPayments++;
    }
    if (status === 'paid' && datedPayments === 0) warnings.push({ code: 'legacy_paid_date_unknown', invoiceId: entry.id });
  }
  function aggregate(period: FinancialPeriod): PeriodTotals {
    const result = emptyTotals();
    const add = (left: number, right: number, invoiceId: string) => { const value = left + right; if (!Number.isSafeInteger(value)) { warnings.push({ code: 'aggregate_overflow', invoiceId }); throw new RangeError('Financial totals exceed the safe reporting range.'); } return value; };
    for (const invoice of invoices) {
      if (!matches(invoice.date, period) || !invoice.date || invoice.amountCents === null || !invoice.status) continue;
      const total = result.byAudience[invoice.audience]; total.issuedCount++; total.issuedCents = add(total.issuedCents, invoice.amountCents, invoice.entry.id);
      total.currentStatus[invoice.status].count++; total.currentStatus[invoice.status].cents = add(total.currentStatus[invoice.status].cents, invoice.amountCents, invoice.entry.id);
    }
    for (const payment of payments) { if (!matches(payment.occurredOn, period)) continue; const total = result.byAudience[payment.audience]; total.paymentCount++; total.paymentCents = add(total.paymentCents, payment.amountCents, payment.invoiceId); }
    return result;
  }
  return {
    selection, chartYear, asOf, availableYears: [...years].sort((a, b) => b - a),
    months: Array.from({ length: 12 }, (_, index) => ({ year: chartYear, month: index + 1, key: `${chartYear}-${String(index + 1).padStart(2, '0')}`, ...aggregate({ year: chartYear, month: index + 1 }) })),
    selected: aggregate(selection),
    invoices: invoices.filter(invoice => matches(invoice.date, selection)),
    payments: payments.filter(payment => matches(payment.occurredOn, selection)),
    unknownDateInvoices: invoices.filter(invoice => !invoice.date),
    recordedDateFallbackCount: invoices.filter(invoice => invoice.dateSource === 'recorded_at').length,
    legacyPaidWithoutPaymentDateCount: warnings.filter(warning => warning.code === 'legacy_paid_date_unknown').length,
    warnings,
  };
}
