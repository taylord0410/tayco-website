import { ErpError } from './erp';

const reportingPeriod = /^(?:19|[2-9]\d)\d{2}-(?:0[1-9]|1[0-2])$/;

/** Reporting uses UTC, matching the monthly management summary. The clock is server-only. */
export function currentReportingPeriod(now = new Date()): string {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime()) || now.getUTCFullYear() < 1900 || now.getUTCFullYear() > 9999)
    throw new ErpError(422, 'A valid server reporting clock is required.');
  return now.toISOString().slice(0, 7);
}

export function isGuestReportingPeriod(period: unknown): period is string {
  return typeof period === 'string' && reportingPeriod.test(period);
}

/** Detail, viewer resources and downloads must pass this check on every request. */
export function requireGuestPeriod(period: unknown, now = new Date()): string {
  if (!isGuestReportingPeriod(period)) throw new ErpError(422, 'Choose a valid YYYY-MM period.');
  const current = currentReportingPeriod(now);
  if (period < current) throw new ErpError(403, 'Month closed. Not authorized for details outside the current month.');
  if (period > current) throw new ErpError(403, 'Not authorized for future reporting periods.');
  return period;
}
