import type { Entry } from './erp';
import { financialPeriods, isFinancialDate, type FinancialWarning } from './financial-periods';
import { isValidUsdAmount } from './financial-values';

export type ForecastDirection = 'client_collection' | 'vendor_payment' | 'internal_cost';
export type ForecastSource = {
  id: string; projectId: string; title: string; direction: ForecastDirection;
  amountCents: number; dueOn: string; source: string; kind: 'invoice' | 'project_plan'; linkedInvoiceId?: string;
};
export type ProposalForecastSource = {
  id: string; projectId: string; title: string; faceCents: number; allocatedCents: number; weightedCents: number;
  probabilityPercent: number; allocationPercent: number; expectedBillingOn: string; source: string;
};
export type FinancialForecastWarning = { code: string; recordId: string; message: string };
export type FinancialForecastReport = {
  reportMonth: string; nextMonth: string; asOf: string;
  base: { clientCollectionCents: number; vendorPaymentCents: number; internalCostCents: number; sources: ForecastSource[] };
  pipelineUpside: { proposalFaceCents: number; allocatedBillingCents: number; weightedBillingCents: number; sources: ProposalForecastSource[] };
  completedProjects: { id: string; name: string; completedOn: string }[];
  coverage: {
    warnings: FinancialForecastWarning[]; missingInvoiceDueDates: number; excludedInvoicePaymentSources: number;
    missingProposalAssumptions: number; invalidPlans: number; duplicateLinkedPlans: number;
    undatedClosedProjects: number; unlinkedManualPlans: number;
  };
  notes: string[];
};
const directions: ForecastDirection[] = ['client_collection', 'vendor_payment', 'internal_cost'];
const field = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const object = (value: unknown): Record<string, unknown> | null => !!value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
function timestamp(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value) || !isFinancialDate(value.slice(0, 10))) return null;
  const parsed = new Date(value); return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}
/** Percentages are explicit hundredth-percent inputs, never defaults or unconstrained floating weights. */
export function isForecastPercentage(value: unknown): value is number {
  return isValidUsdAmount(value) && value <= 100;
}
export function nextFinancialMonth(month: string): string {
  if (!/^(19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/.test(month)) throw new RangeError('Choose a valid reporting month.');
  const year = Number(month.slice(0, 4)), index = Number(month.slice(5, 7));
  if (year === 9999 && index === 12) throw new RangeError('The next reporting month exceeds the supported calendar.');
  return String(index === 12 ? year + 1 : year) + '-' + String(index === 12 ? 1 : index + 1).padStart(2, '0');
}
function add(left: number, right: number): number {
  const result = left + right;
  if (!Number.isSafeInteger(result)) throw new RangeError('Forecast totals exceed the safe reporting range.');
  return result;
}
function weightedCents(amountCents: number, probabilityPercent: number, allocationPercent: number): number {
  const numerator = BigInt(amountCents) * BigInt(Math.round(probabilityPercent * 100)) * BigInt(Math.round(allocationPercent * 100));
  return Number((numerator + BigInt(50_000_000)) / BigInt(100_000_000));
}
const paymentWarnings = new Set<FinancialWarning['code']>(['invalid_payment', 'duplicate_payment_id']);

/**
 * Scenario arithmetic over an ALREADY AUTHORIZED snapshot; this is not an authorization filter.
 * The selected month identifies the report, while source status and outstanding amounts use asOf.
 * No historical month-end balance, future settlement, project revenue or bank balance is inferred.
 */
export function financialForecast(entries: readonly Entry[], options: { month: string; asOf: string; projectId?: string }): FinancialForecastReport {
  const nextMonth = nextFinancialMonth(options.month);
  const asOf = financialPeriods([], { year: null, month: null, asOf: options.asOf }).asOf;
  const asOfDate = asOf.slice(0, 10);
  const report: FinancialForecastReport = {
    reportMonth: options.month, nextMonth, asOf,
    base: { clientCollectionCents: 0, vendorPaymentCents: 0, internalCostCents: 0, sources: [] },
    pipelineUpside: { proposalFaceCents: 0, allocatedBillingCents: 0, weightedBillingCents: 0, sources: [] },
    completedProjects: [],
    coverage: { warnings: [], missingInvoiceDueDates: 0, excludedInvoicePaymentSources: 0, missingProposalAssumptions: 0, invalidPlans: 0, duplicateLinkedPlans: 0, undatedClosedProjects: 0, unlinkedManualPlans: 0 },
    notes: [
      'The base contains approved invoice balances with explicit due dates and separately recorded project plans. These are planning sources, not bank-settlement evidence.',
      'Proposal upside uses only sent proposals with explicit billing dates, probabilities, allocations and sources; it remains separate from the base.',
      'Completed projects use explicit completion dates with recorded evidence and do not create invoices, payments or forecast collections.',
      'Source states and outstanding balances use the current snapshot, not a reconstruction of the selected month-end.',
    ],
  };
  const warn = (code: string, recordId: string, message: string) => report.coverage.warnings.push({ code, recordId, message });
  const scoped = entries.filter(entry => ['project', 'invoice', 'proposal'].includes(entry.kind) && (!options.projectId || (entry.kind === 'project' ? entry.id === options.projectId : entry.projectId === options.projectId)));
  const counts = new Map<string, number>();
  for (const entry of scoped) counts.set(entry.id, (counts.get(entry.id) || 0) + 1);
  const duplicates = new Set<string>();
  const known = scoped.filter(entry => {
    if (!field(entry.id) || (counts.get(entry.id) || 0) > 1) {
      if (!duplicates.has(entry.id)) { duplicates.add(entry.id); warn('duplicate_record_id', entry.id, 'An ambiguous record identity is excluded from the forecast.'); }
      return false;
    }
    const created = timestamp(entry.createdAt), updated = timestamp(entry.updatedAt);
    if (!created || !updated || created > asOf || updated > asOf || updated < created) {
      warn('record_not_known_at_snapshot', entry.id, 'This record has invalid or later snapshot metadata and is excluded.');
      return false;
    }
    return true;
  });
  const invoices = known.filter(entry => entry.kind === 'invoice');
  const invoiceById = new Map(invoices.map(entry => [entry.id, entry]));
  const approved = invoices.filter(entry => entry.data.status === 'approved');
  // Reuse the same date, money, duplicate-ID and active-payment rules as actual financial reporting.
  const actual = financialPeriods(approved, { year: null, month: null, asOf });
  const warningsByInvoice = new Map<string, FinancialWarning[]>();
  for (const warning of actual.warnings) warningsByInvoice.set(warning.invoiceId, [...(warningsByInvoice.get(warning.invoiceId) || []), warning]);
  const paymentIds = new Map<string, Set<string>>();
  for (const payment of actual.payments) paymentIds.set(payment.id, new Set([...(paymentIds.get(payment.id) || []), payment.invoiceId]));
  const conflictingPayments = new Set<string>();
  for (const ids of paymentIds.values()) if (ids.size > 1) for (const id of ids) conflictingPayments.add(id);
  const includeBase = (source: ForecastSource) => {
    const key = source.direction === 'client_collection' ? 'clientCollectionCents' : source.direction === 'vendor_payment' ? 'vendorPaymentCents' : 'internalCostCents';
    report.base[key] = add(report.base[key], source.amountCents); report.base.sources.push(source);
  };
  for (const invoice of actual.invoices) {
    const entry = invoice.entry, due = entry.data.dueDate;
    if (due === undefined || due === null || due === '') {
      report.coverage.missingInvoiceDueDates++; warn('missing_invoice_due_date', entry.id, 'An approved invoice has no due date; its forecast month is not guessed.'); continue;
    }
    if (!isFinancialDate(due)) { warn('invalid_invoice_due_date', entry.id, 'An approved invoice has an invalid due date and is excluded.'); continue; }
    if (due.slice(0, 7) !== nextMonth) continue;
    if (invoice.audience === 'internal') { warn('ambiguous_invoice_direction', entry.id, 'Internal invoice records do not establish a cost direction. Only explicitly directed planning sources can contribute internal costs.'); continue; }
    const sourceWarnings = warningsByInvoice.get(entry.id) || [];
    let invalidHistory = conflictingPayments.has(entry.id) || sourceWarnings.some(warning => paymentWarnings.has(warning.code));
    const rawPayments = Array.isArray(entry.data.payments) ? entry.data.payments : [];
    for (const raw of rawPayments) {
      const item = object(raw);
      if (!item || item.voidedAt === undefined || item.voidedAt === null || item.voidedAt === '') continue;
      const voidedAt = timestamp(item.voidedAt);
      if (!voidedAt || voidedAt > asOf || !field(item.voidReason)) invalidHistory = true;
    }
    if (invalidHistory) {
      report.coverage.excludedInvoicePaymentSources++; warn('unreliable_invoice_payment_history', entry.id, 'Invalid, duplicate or ambiguous payment/void records prevent a reliable outstanding amount.'); continue;
    }
    if (invoice.amountCents === null || !invoice.date || invoice.audience === 'unknown' ||
      (invoice.dateSource === 'issued_on' && (invoice.date > asOfDate || due < invoice.date))) {
      warn('invalid_invoice_source', entry.id, 'An approved invoice has incomplete amount, issue-date or audience evidence and is excluded.'); continue;
    }
    const paid = actual.payments.filter(payment => payment.invoiceId === entry.id).reduce((sum, payment) => add(sum, payment.amountCents), 0);
    if (paid > invoice.amountCents) {
      report.coverage.excludedInvoicePaymentSources++; warn('invoice_overpayment', entry.id, 'Recorded payments exceed the invoice amount; no outstanding balance is guessed.'); continue;
    }
    const outstanding = invoice.amountCents - paid;
    if (!outstanding) continue;
    includeBase({
      id: entry.id, projectId: entry.projectId, title: field(entry.data.reference) || 'Approved invoice',
      direction: invoice.audience === 'client' ? 'client_collection' : 'vendor_payment',
      amountCents: outstanding, dueOn: due, source: field(entry.data.source) || 'Approved invoice source record',
      kind: 'invoice', linkedInvoiceId: entry.id,
    });
  }
  const projects = known.filter(entry => entry.kind === 'project');
  for (const project of projects) {
    const completion = project.data.completedOn;
    if (project.data.status === 'closed') {
      if (!isFinancialDate(completion) || completion > asOfDate) {
        report.coverage.undatedClosedProjects++; warn('missing_project_completion_date', project.id, 'A closed project has no usable completion date; no reporting month is inferred.');
      } else if (!field(project.data.completionEvidence).trim()) {
        warn('missing_project_completion_evidence', project.id, 'A closed project has a completion date but no recorded evidence; it is excluded from completed-project activity.');
      } else if (completion.slice(0, 7) === options.month) report.completedProjects.push({ id: project.id, name: field(project.data.name) || 'Project', completedOn: completion });
    } else if (completion) warn('completion_state_mismatch', project.id, 'A completion date on a project not currently closed is excluded from completed-project activity.');
    const rawPlans = project.data.forecastPlans;
    if (rawPlans === undefined || rawPlans === null) continue;
    if (!Array.isArray(rawPlans)) { report.coverage.invalidPlans++; warn('invalid_forecast_plan_list', project.id, 'The project forecast-plan list needs review.'); continue; }
    const ids = new Map<string, number>();
    for (const raw of rawPlans) { const plan = object(raw); if (plan && field(plan.id)) ids.set(field(plan.id), (ids.get(field(plan.id)) || 0) + 1); }
    for (const raw of rawPlans) {
      const plan = object(raw);
      if (plan?.status === 'cancelled') continue;
      const created = plan ? timestamp(plan.createdAt) : null;
      if (!plan || plan.status !== 'planned' || !field(plan.id) || (ids.get(field(plan.id)) || 0) !== 1 ||
        !field(plan.title) || !directions.includes(plan.direction as ForecastDirection) || !isValidUsdAmount(plan.amountUsd) ||
        !isFinancialDate(plan.dueOn) || !field(plan.source) || !created || created > asOf) {
        report.coverage.invalidPlans++; warn('invalid_forecast_plan', project.id, 'A plan has invalid identity, amount, date, direction or source metadata and is excluded.'); continue;
      }
      if (plan.dueOn.slice(0, 7) !== nextMonth) continue;
      if (plan.linkedInvoiceId !== undefined && plan.linkedInvoiceId !== null && plan.linkedInvoiceId !== '') {
        const linked = typeof plan.linkedInvoiceId === 'string' ? invoiceById.get(plan.linkedInvoiceId) : undefined;
        if (!linked || linked.projectId !== project.id) {
          report.coverage.invalidPlans++; warn('invalid_plan_invoice_link', field(plan.id), 'A linked invoice is absent or belongs to another project; the plan is excluded.'); continue;
        }
        report.coverage.duplicateLinkedPlans++; warn('linked_invoice_authoritative', field(plan.id), 'This plan is linked to an invoice. Only the invoice balance and its own due date can contribute; the plan is not added again.'); continue;
      }
      report.coverage.unlinkedManualPlans++;
      includeBase({ id: field(plan.id), projectId: project.id, title: field(plan.title), direction: plan.direction as ForecastDirection, amountCents: Math.round(plan.amountUsd * 100), dueOn: plan.dueOn, source: field(plan.source), kind: 'project_plan' });
    }
  }
  for (const proposal of known.filter(entry => entry.kind === 'proposal' && entry.data.status === 'sent')) {
    const d = proposal.data, assumption = object(d.forecast);
    if (d.validUntil !== undefined && d.validUntil !== null && d.validUntil !== '' && (!isFinancialDate(d.validUntil) || d.validUntil < asOfDate)) {
      report.coverage.missingProposalAssumptions++; warn('expired_proposal', proposal.id, 'An expired or invalid proposal acceptance window is excluded from upside. Review its commercial validity first.'); continue;
    }
    const issued = d.issuedOn, sent = d.sentOn, updated = assumption ? timestamp(assumption.updatedAt) : null;
    if (!assumption || !isFinancialDate(assumption.expectedBillingOn) || !isForecastPercentage(assumption.probabilityPercent) ||
      !isForecastPercentage(assumption.allocationPercent) || !field(assumption.source) || !updated || updated > asOf ||
      !isValidUsdAmount(d.amountUsd) || d.currency !== 'USD' || !isFinancialDate(issued) || !isFinancialDate(sent) ||
      issued > sent || sent > asOfDate || assumption.expectedBillingOn < sent) {
      report.coverage.missingProposalAssumptions++; warn('missing_proposal_assumptions', proposal.id, 'A sent proposal lacks usable explicit billing-date, probability, allocation or source assumptions and is excluded from upside.'); continue;
    }
    if (assumption.expectedBillingOn.slice(0, 7) !== nextMonth) continue;
    const faceCents = Math.round(d.amountUsd * 100);
    const allocatedCents = weightedCents(faceCents, 100, assumption.allocationPercent);
    const weighted = weightedCents(faceCents, assumption.probabilityPercent, assumption.allocationPercent);
    report.pipelineUpside.proposalFaceCents = add(report.pipelineUpside.proposalFaceCents, faceCents);
    report.pipelineUpside.allocatedBillingCents = add(report.pipelineUpside.allocatedBillingCents, allocatedCents);
    report.pipelineUpside.weightedBillingCents = add(report.pipelineUpside.weightedBillingCents, weighted);
    report.pipelineUpside.sources.push({ id: proposal.id, projectId: proposal.projectId, title: field(d.title) || field(d.reference) || 'Sent proposal', faceCents, allocatedCents, weightedCents: weighted, probabilityPercent: assumption.probabilityPercent, allocationPercent: assumption.allocationPercent, expectedBillingOn: assumption.expectedBillingOn, source: field(assumption.source) });
  }
  if (report.coverage.unlinkedManualPlans) report.notes.push('Unlinked manual plans are treated as separate source records. Review their overlap with invoices and proposal assumptions; similar names or amounts are not fuzzy-deduplicated.');
  if (nextMonth <= asOfDate.slice(0, 7)) report.notes.push('The selected next-month period has already begun or passed relative to this snapshot. This is a current-source planning scenario, not a historical forecast or month-end balance.');
  report.base.sources.sort((a, b) => a.dueOn.localeCompare(b.dueOn) || a.id.localeCompare(b.id));
  report.pipelineUpside.sources.sort((a, b) => a.expectedBillingOn.localeCompare(b.expectedBillingOn) || a.id.localeCompare(b.id));
  report.completedProjects.sort((a, b) => a.completedOn.localeCompare(b.completedOn) || a.id.localeCompare(b.id));
  return report;
}
