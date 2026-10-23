import type { Entry } from './erp';
import { financialPeriods, invoicePeriodDate, isFinancialDate } from './financial-periods';

type ProjectActivity = { id: string; name: string; status: string; reasons: string[] };
const rows = (value: unknown): Record<string, unknown>[] => Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : [];
const day = (value: unknown): string | null => isFinancialDate(value) ? value : null;
const nextDay = (value: string, delta: number) => new Date(Date.parse(value + 'T12:00:00Z') + delta * 86400000).toISOString().slice(0, 10);
const add = (left: number, right: number) => { const total = left + right; if (!Number.isSafeInteger(total)) throw new RangeError('Weekly totals exceed the supported reporting range.'); return total; };

/** Recorded cash movement basis, not accrual profit. Receives an authorized internal snapshot. */
export function monthlyFinancialDetail(entries: readonly Entry[], options: { month: string; asOf: string; projectId?: string }) {
  if (!/^(19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/.test(options.month)) throw new RangeError('Choose a valid reporting month.');
  const start = options.month + '-01', year = Number(options.month.slice(0, 4)), month = Number(options.month.slice(5, 7));
  const end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10), asOfDate = options.asOf.slice(0, 10);
  const counts = new Map<string, number>(); for (const entry of entries) counts.set(entry.id, (counts.get(entry.id) || 0) + 1);
  const unique = entries.filter(entry => counts.get(entry.id) === 1 && (!options.projectId || entry.projectId === options.projectId || entry.id === options.projectId));
  const report = financialPeriods(unique, { year, month, asOf: options.asOf, projectId: options.projectId });
  const warnings: string[] = [];
  if (unique.length !== entries.filter(entry => !options.projectId || entry.projectId === options.projectId || entry.id === options.projectId).length) warnings.push('Duplicate record identities are excluded from this detail.');
  const weeks: { from: string; through: string; incomeCents: number; expenseCents: number; resultCents: number; unclassifiedCents: number; count: number; future: boolean }[] = [];
  for (let cursor = start; cursor <= end;) {
    const weekday = new Date(cursor + 'T12:00:00Z').getUTCDay(), sunday = nextDay(cursor, (7 - weekday) % 7), through = sunday < end ? sunday : end;
    weeks.push({ from: cursor, through, incomeCents: 0, expenseCents: 0, resultCents: 0, unclassifiedCents: 0, count: 0, future: cursor > asOfDate });
    if (through === end) break;
    cursor = nextDay(through, 1);
  }
  for (const payment of report.payments) {
    const week = weeks.find(week => payment.occurredOn >= week.from && payment.occurredOn <= week.through);
    if (!week) continue;
    week.count++;
    if (payment.audience === 'client') week.incomeCents = add(week.incomeCents, payment.amountCents);
    else if (payment.audience === 'vendor') week.expenseCents = add(week.expenseCents, payment.amountCents);
    else week.unclassifiedCents = add(week.unclassifiedCents, payment.amountCents);
    week.resultCents = add(week.incomeCents, -week.expenseCents);
  }
  const inMonth = (value: unknown) => { const date = day(value); return Boolean(date && date >= start && date <= end); };
  const projects: ProjectActivity[] = [];
  for (const project of unique.filter(entry => entry.kind === 'project')) {
    const reasons = new Set<string>(), related = unique.filter(entry => entry.projectId === project.id);
    const plannedStart = day(project.data.plannedStart), plannedEnd = day(project.data.plannedEnd);
    if (plannedStart && plannedEnd && plannedStart <= plannedEnd && plannedStart <= end && plannedEnd >= start) reasons.add('Recorded schedule overlaps this month');
    if (project.data.status === 'closed' && inMonth(project.data.completedOn) && String(project.data.completedOn) <= asOfDate && String(project.data.completionEvidence || '').trim()) reasons.add('Evidenced completion date');
    if (rows(project.data.milestones).some(item => item.status !== 'cancelled' && inMonth(item.dueDate))) reasons.add('Dated project milestone');
    if (related.some(entry => entry.kind === 'hours' && inMonth(entry.data.date) && String(entry.data.date) <= asOfDate)) reasons.add('Dated work logs');
    if (related.some(entry => entry.kind === 'invoice' && inMonth(invoicePeriodDate(entry).date))) reasons.add('Invoice issuance record');
    if (report.payments.some(payment => payment.projectId === project.id)) reasons.add('Dated payment movement');
    if (related.some(entry => entry.kind === 'proposal' && (inMonth(entry.data.issuedOn) || inMonth(entry.data.decidedOn)))) reasons.add('Dated client proposal activity');
    if (reasons.size) projects.push({ id: project.id, name: typeof project.data.name === 'string' ? project.data.name : 'Project', status: typeof project.data.status === 'string' ? project.data.status : 'Not recorded', reasons: [...reasons] });
  }
  const totals = weeks.reduce((sum, week) => ({ incomeCents: add(sum.incomeCents, week.incomeCents), expenseCents: add(sum.expenseCents, week.expenseCents), resultCents: add(sum.resultCents, week.resultCents), unclassifiedCents: add(sum.unclassifiedCents, week.unclassifiedCents) }), { incomeCents: 0, expenseCents: 0, resultCents: 0, unclassifiedCents: 0 });
  if (report.warnings.length) warnings.push('Some financial sources need review; inspect the monthly source coverage before relying on totals.');
  if (totals.unclassifiedCents) warnings.push('Internal or unclassified payment movements are shown separately and are not assumed to be an expense or income.');
  return { month: options.month, asOf: options.asOf, weeks, totals, projects: projects.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)), warnings, basis: 'Dated client receipts less dated provider payments. This cash movement result excludes unrecorded overhead, payroll, taxes and accrual adjustments; it is not accounting profit.' };
}
