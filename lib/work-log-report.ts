import type { Entry } from './erp';
import { isFinancialDate } from './financial-periods';

export const WORK_LOG_STATUSES = ['submitted', 'approved', 'returned'] as const;
export type WorkLogStatus = typeof WORK_LOG_STATUSES[number];
export type WorkLogSelection = { from: string | null; to: string | null; projectId?: string; status: 'all' | WorkLogStatus };
export type WorkLogTotal = { count: number; hours: number; exactHours: string };
export type WorkLogRow = { id: string; projectId: string; projectName: string; ownerId: string; date: string; isoWeek: string; trade: string; status: WorkLogStatus; hours: number; exactHours: string; recordedAt: string | null };
export type WorkLogGroup = WorkLogTotal & { projectId: string; projectName: string; isoWeek: string; trade: string; ownerId: string; status: WorkLogStatus; recordIds: string[] };
export type WorkLogWarning = { recordId: string; code: 'invalid_date' | 'invalid_hours' | 'invalid_status' | 'duplicate_id' | 'missing_trade' | 'missing_owner' | 'future_work_date' };
export type WorkLogReport = { selection: WorkLogSelection; asOf: string; dateBasis: 'recorded_work_date'; rows: WorkLogRow[]; groups: WorkLogGroup[]; totals: WorkLogTotal & { byStatus: Record<WorkLogStatus, WorkLogTotal> }; warnings: WorkLogWarning[]; excludedRecordCount: number };

/** Boundaries are inclusive calendar dates in UTC. No timestamp or record-date fallback. */
export function parseWorkLogSelection(input: { from?: unknown; to?: unknown; projectId?: unknown; status?: unknown } = {}): WorkLogSelection {
  const date = (value: unknown, label: string) => {
    if (value === undefined || value === null || value === '') return null;
    if (!isFinancialDate(value)) throw new RangeError('Choose a valid ' + label + ' date (YYYY-MM-DD).');
    return value as string;
  };
  const from = date(input.from, 'start'), to = date(input.to, 'end');
  if (from && to && from > to) throw new RangeError('The start date must not be after the end date.');
  const status = input.status === undefined || input.status === null || input.status === '' ? 'all' : input.status;
  if (status !== 'all' && !WORK_LOG_STATUSES.includes(status as WorkLogStatus)) throw new RangeError('Choose a valid work-log status.');
  const projectId = input.projectId === undefined || input.projectId === null || input.projectId === '' ? undefined : input.projectId;
  if (projectId !== undefined && (typeof projectId !== 'string' || !/^[\w-]{1,100}$/.test(projectId))) throw new RangeError('Choose a valid project reference.');
  return { from, to, status: status as WorkLogSelection['status'], ...(projectId ? { projectId: projectId as string } : {}) };
}

export function workLogIsoWeek(date: string): string {
  if (!isFinancialDate(date)) throw new RangeError('A valid work date is required.');
  const day = new Date(date + 'T00:00:00.000Z');
  day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
  const year = day.getUTCFullYear();
  const first = new Date(0); first.setUTCFullYear(year, 0, 1); first.setUTCHours(0, 0, 0, 0);
  return year + '-W' + String(Math.ceil(((day.valueOf() - first.valueOf()) / 86_400_000 + 1) / 7)).padStart(2, '0');
}

type Decimal = { units: bigint; scale: number };
function decimal(raw: string): Decimal {
  const [mantissa, exponent = '0'] = raw.toLowerCase().split('e');
  const [whole, fraction = ''] = mantissa.split('.');
  let units = BigInt(whole + fraction), scale = fraction.length - Number(exponent);
  if (scale < 0) { units *= BigInt(10) ** BigInt(-scale); scale = 0; }
  return { units, scale };
}
function add(left: Decimal, right: Decimal): Decimal {
  const scale = Math.max(left.scale, right.scale);
  return { units: left.units * BigInt(10) ** BigInt(scale - left.scale) + right.units * BigInt(10) ** BigInt(scale - right.scale), scale };
}
function exact(value: Decimal): string {
  if (!value.scale) return String(value.units);
  const digits = String(value.units).padStart(value.scale + 1, '0');
  return (digits.slice(0, -value.scale) + '.' + digits.slice(-value.scale)).replace(/\.?0+$/, '');
}
function total(rows: readonly WorkLogRow[]): WorkLogTotal {
  const exactHours = exact(rows.reduce((sum, row) => add(sum, decimal(row.exactHours)), { units: BigInt(0), scale: 0 }));
  return { count: rows.length, hours: Number(exactHours), exactHours };
}

/** Pure report over ALREADY-authorized snapshot entries. This function grants no access. */
export function buildWorkLogReport(entries: readonly Entry[], input: WorkLogSelection & { asOf: string }): WorkLogReport {
  const selection = parseWorkLogSelection(input);
  if (typeof input.asOf !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(input.asOf) || !Number.isFinite(Date.parse(input.asOf)) || !isFinancialDate(input.asOf.slice(0, 10))) throw new RangeError('A valid snapshot timestamp with a timezone is required.');
  const asOfDate = new Date(input.asOf).toISOString().slice(0, 10);
  const projects = new Map(entries.filter(entry => entry.kind === 'project').map(entry => [entry.id, typeof entry.data.name === 'string' ? entry.data.name : 'Project name not recorded']));
  const source = entries.filter(entry => entry.kind === 'hours' && (!selection.projectId || entry.projectId === selection.projectId));
  const idCounts = new Map<string, number>(); for (const entry of source) idCounts.set(entry.id, (idCounts.get(entry.id) || 0) + 1);
  const rows: WorkLogRow[] = [], warnings: WorkLogWarning[] = [];
  const excluded = new Set<string>(); let excludedRecordCount = 0;
  for (const entry of source) {
    const warn = (code: WorkLogWarning['code']) => warnings.push({ recordId: entry.id, code });
    if (idCounts.get(entry.id)! > 1) { if (!excluded.has(entry.id)) warn('duplicate_id'); excluded.add(entry.id); excludedRecordCount++; continue; }
    if (!WORK_LOG_STATUSES.includes(entry.data.status as WorkLogStatus)) { warn('invalid_status'); excludedRecordCount++; continue; }
    const status = entry.data.status as WorkLogStatus;
    if (selection.status !== 'all' && status !== selection.status) continue;
    if (!isFinancialDate(entry.data.date)) { warn('invalid_date'); excludedRecordCount++; continue; }
    const date = entry.data.date as string;
    if ((selection.from && date < selection.from) || (selection.to && date > selection.to)) continue;
    const hours = entry.data.hours;
    if (typeof hours !== 'number' || !Number.isFinite(hours) || hours < .1 || hours > 24) { warn('invalid_hours'); excludedRecordCount++; continue; }
    const trade = typeof entry.data.trade === 'string' && entry.data.trade.trim() ? entry.data.trade.trim() : 'Trade not recorded';
    if (trade === 'Trade not recorded') warn('missing_trade');
    if (!entry.ownerId) warn('missing_owner');
    if (date > asOfDate) warn('future_work_date');
    rows.push({ id: entry.id, projectId: entry.projectId, projectName: projects.get(entry.projectId) || 'Project name not available in this scope', ownerId: entry.ownerId || '', date, isoWeek: workLogIsoWeek(date), trade, status, hours, exactHours: exact(decimal(String(hours))), recordedAt: typeof entry.createdAt === 'string' && Number.isFinite(Date.parse(entry.createdAt)) ? entry.createdAt : null });
  }
  rows.sort((a, b) => b.date.localeCompare(a.date) || a.projectId.localeCompare(b.projectId) || a.trade.localeCompare(b.trade) || a.ownerId.localeCompare(b.ownerId) || a.id.localeCompare(b.id));
  const buckets = new Map<string, WorkLogRow[]>();
  for (const row of rows) { const key = JSON.stringify([row.projectId, row.isoWeek, row.trade, row.ownerId, row.status]); const bucket = buckets.get(key) || []; bucket.push(row); buckets.set(key, bucket); }
  const groups = [...buckets.values()].map(bucket => { const first = bucket[0]; return { projectId: first.projectId, projectName: first.projectName, isoWeek: first.isoWeek, trade: first.trade, ownerId: first.ownerId, status: first.status, ...total(bucket), recordIds: bucket.map(row => row.id) }; });
  const byStatus = Object.fromEntries(WORK_LOG_STATUSES.map(status => [status, total(rows.filter(row => row.status === status))])) as Record<WorkLogStatus, WorkLogTotal>;
  return { selection, asOf: input.asOf, dateBasis: 'recorded_work_date', rows, groups, totals: { ...total(rows), byStatus }, warnings, excludedRecordCount };
}

function csvCell(value: string | number | null) {
  const raw = value === null ? '' : String(value), safe = /^[\s]*[=+@-]/.test(raw) || /^[\t\r\n]/.test(raw) ? "'" + raw : raw;
  return '"' + safe.replaceAll('"', '""') + '"';
}
/** Detail rows are the audit source; grouping is supplied separately by the JSON report. */
export function workLogCsv(report: WorkLogReport): string {
  const headers = ['record_id', 'project_id', 'project_name', 'owner_id', 'work_date_utc', 'iso_week', 'trade', 'review_status', 'recorded_hours', 'recorded_at', 'snapshot_at', 'basis', 'excluded_invalid_records'];
  const rows: (string | number | null)[][] = [headers, ...report.rows.map(row => [row.id, row.projectId, row.projectName, row.ownerId, row.date, row.isoWeek, row.trade, row.status, row.exactHours, row.recordedAt, report.asOf, 'Recorded work logs; not payroll or a WH-347 certification', report.excludedRecordCount])];
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
