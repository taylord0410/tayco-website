/** Shared, browser-safe validation for recorded USD amounts. Never round invalid source data. */
export function isValidUsdAmount(value: unknown): value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1e10) return false;
  const cents = value * 100, nearest = Math.round(cents);
  return Number.isSafeInteger(nearest) && Math.abs(cents - nearest) <= Math.max(1, Math.abs(cents)) * Number.EPSILON * 4;
}
