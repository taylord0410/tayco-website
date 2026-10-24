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
  const invoiceEntries = entries.filter(entry => entry.kind === 'invoice' && (!options.projectId || entry.projectId === options.projectId));
  if (invoiceEntries.length > 0) {
    for (const entry of invoiceEntries) {
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
  } else {
    const asOfDate = asOf.slice(0, 10);
    const scoped = entries.filter(entry => !options.projectId || entry.projectId === options.projectId || entry.id === options.projectId);

    // 1. Projects (budgetUsd, forecastPlans, plannedStart, plannedEnd, status)
    for (const entry of scoped.filter(e => e.kind === 'project')) {
      const budgetUsd = entry.data.budgetUsd;
      const plans = Array.isArray(entry.data.forecastPlans) ? entry.data.forecastPlans : [];
      let hasValidPlans = false;

      for (const rawPlan of plans) {
        const p = rawPlan && typeof rawPlan === 'object' && !Array.isArray(rawPlan) ? rawPlan as Record<string, unknown> : null;
        if (!p || p.status === 'cancelled') continue;
        if (isValidUsdAmount(p.amountUsd) && isFinancialDate(p.dueOn)) {
          hasValidPlans = true;
          const planCents = Math.round(Number(p.amountUsd) * 100);
          const dir: FinancialAudience = p.direction === 'vendor_payment' ? 'vendor' : p.direction === 'internal_cost' ? 'internal' : 'client';
          const planStatus: FinancialStatus = String(p.dueOn) <= asOfDate ? 'paid' : 'approved';
          invoices.push({ entry, date: String(p.dueOn), dateSource: 'issued_on', audience: dir, status: planStatus, amountCents: planCents });
          years.add(Number(String(p.dueOn).slice(0, 4)));
          if (String(p.dueOn) <= asOfDate) {
            payments.push({ invoiceId: entry.id, projectId: entry.id, audience: dir, id: String(p.id || `plan-${entry.id}-${p.dueOn}`), occurredOn: String(p.dueOn), amountCents: planCents, reference: String(p.title || 'Project plan'), recordedAt: timestamp(p.createdAt) || asOf });
            years.add(Number(String(p.dueOn).slice(0, 4)));
          }
        }
      }

      if (!hasValidPlans && isValidUsdAmount(budgetUsd) && budgetUsd > 0) {
        const totalCents = Math.round(budgetUsd * 100);
        const pStart = isFinancialDate(entry.data.plannedStart) ? entry.data.plannedStart : null;
        const pEnd = isFinancialDate(entry.data.plannedEnd) ? entry.data.plannedEnd : null;
        const bApp = isFinancialDate(entry.data.budgetApprovedOn) ? entry.data.budgetApprovedOn : null;
        const projStatus: FinancialStatus = entry.data.status === 'closed' ? 'paid' : (entry.data.status === 'active' || entry.data.status === 'handover') ? 'approved' : 'submitted';

        if (pStart && pEnd && pStart <= pEnd) {
          const sy = Number(pStart.slice(0, 4)), sm = Number(pStart.slice(5, 7));
          const ey = Number(pEnd.slice(0, 4)), em = Number(pEnd.slice(5, 7));
          const numMonths = Math.min(60, Math.max(1, (ey - sy) * 12 + (em - sm) + 1));
          const trancheCents = Math.floor(totalCents / numMonths);
          let remaining = totalCents;

          for (let i = 0; i < numMonths; i++) {
            const mOffset = (sm - 1 + i);
            const curY = sy + Math.floor(mOffset / 12);
            const curM = (mOffset % 12) + 1;
            const curMonthKey = `${curY}-${String(curM).padStart(2, '0')}`;
            const trancheDate = i === 0 ? pStart : i === numMonths - 1 ? pEnd : `${curMonthKey}-01`;
            const trancheAmount = i === numMonths - 1 ? remaining : trancheCents;
            remaining -= trancheAmount;

            invoices.push({ entry, date: trancheDate, dateSource: 'issued_on', audience: 'client', status: projStatus, amountCents: trancheAmount });
            years.add(curY);

            if ((entry.data.status === 'closed' || entry.data.status === 'active') && trancheDate <= asOfDate) {
              payments.push({ invoiceId: entry.id, projectId: entry.id, audience: 'client', id: `proj-${entry.id}-m${i}`, occurredOn: trancheDate, amountCents: trancheAmount, reference: String(entry.data.name || 'Project budget schedule'), recordedAt: asOf });
              years.add(curY);
            }
          }
        } else {
          const singleDate = bApp || pStart || (timestamp(entry.createdAt)?.slice(0, 10) ?? null);
          const dateSource = (bApp || pStart) ? 'issued_on' : timestamp(entry.createdAt) ? 'recorded_at' : 'unknown';
          invoices.push({ entry, date: singleDate, dateSource, audience: 'client', status: projStatus, amountCents: totalCents });
          if (singleDate) years.add(Number(singleDate.slice(0, 4)));

          if (entry.data.status === 'closed') {
            const compDate = isFinancialDate(entry.data.completedOn) ? entry.data.completedOn : singleDate;
            if (compDate && compDate <= asOfDate) {
              payments.push({ invoiceId: entry.id, projectId: entry.id, audience: 'client', id: `proj-${entry.id}-close`, occurredOn: compDate, amountCents: totalCents, reference: String(entry.data.name || 'Completed project'), recordedAt: asOf });
              years.add(Number(compDate.slice(0, 4)));
            }
          }
        }
      }
    }

    // 2. Proposals (amountUsd, status, validUntil / createdAt, issuedOn)
    for (const entry of scoped.filter(e => e.kind === 'proposal')) {
      const amountCents = isValidUsdAmount(entry.data.amountUsd) ? Math.round(entry.data.amountUsd * 100) : null;
      const date = isFinancialDate(entry.data.issuedOn) ? entry.data.issuedOn : isFinancialDate(entry.data.validUntil) ? entry.data.validUntil : (timestamp(entry.createdAt)?.slice(0, 10) ?? null);
      const dateSource = isFinancialDate(entry.data.issuedOn) || isFinancialDate(entry.data.validUntil) ? 'issued_on' : timestamp(entry.createdAt) ? 'recorded_at' : 'unknown';
      const status: FinancialStatus = entry.data.status === 'accepted' ? 'paid' : entry.data.status === 'sent' ? 'approved' : (entry.data.status === 'declined' || entry.data.status === 'withdrawn') ? 'returned' : 'submitted';

      invoices.push({ entry, date, dateSource, audience: 'client', status, amountCents });
      if (date) years.add(Number(date.slice(0, 4)));

      if (entry.data.status === 'accepted' && amountCents !== null && amountCents > 0) {
        const decidedOn = isFinancialDate(entry.data.decidedOn) ? entry.data.decidedOn : isFinancialDate(entry.data.issuedOn) ? entry.data.issuedOn : date;
        if (decidedOn && decidedOn <= asOfDate) {
          payments.push({ invoiceId: entry.id, projectId: entry.projectId || entry.id, audience: 'client', id: `prop-pay-${entry.id}`, occurredOn: decidedOn, amountCents, reference: String(entry.data.reference || entry.data.title || 'Accepted proposal'), recordedAt: timestamp(entry.data.decisionRecordedAt) || asOf });
          years.add(Number(decidedOn.slice(0, 4)));
        }
      }
    }

    // 3. Estimates (amountUsd, estimatedOn / issuedOn / createdAt)
    for (const entry of scoped.filter(e => e.kind === 'estimate')) {
      const amountCents = isValidUsdAmount(entry.data.amountUsd) ? Math.round(entry.data.amountUsd * 100) : null;
      const date = isFinancialDate(entry.data.estimatedOn) ? entry.data.estimatedOn : isFinancialDate(entry.data.issuedOn) ? entry.data.issuedOn : (timestamp(entry.createdAt)?.slice(0, 10) ?? null);
      const dateSource = isFinancialDate(entry.data.estimatedOn) || isFinancialDate(entry.data.issuedOn) ? 'issued_on' : timestamp(entry.createdAt) ? 'recorded_at' : 'unknown';

      invoices.push({ entry, date, dateSource, audience: 'client', status: 'submitted', amountCents });
      if (date) years.add(Number(date.slice(0, 4)));
    }
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
