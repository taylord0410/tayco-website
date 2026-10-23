import { isValidUsdAmount } from './financial-values';

/** A versioned estimate snapshot. It is never an invoice, payment or approved budget. */
export type ProjectEstimate = {
  id: string;
  projectId: string;
  projectName: string;
  sourceProjectSlug: string;
  status: 'estimate';
  currency: 'USD';
  version: string;
  estimatedOn: string | null;
  dateBasis: 'source_snapshot' | 'source_date' | 'unknown';
  amountUsd: number | null;
  directCostUsd: number | null;
  sourceName: string;
  sourceRef: string;
  sourceSha256: string;
  capturedAt: string;
  sourceAvailability: 'available' | 'archived' | 'missing';
  breakdown: { code: string; label: string; amountUsd: number }[];
  breakdownBasis: 'direct_cost' | 'bid';
  breakdownReconciled: boolean;
  costTiers: { code: string; label: string; amountUsd: number }[];
  costTiersReconciled: boolean;
  rawCostLineCount: number | null;
  sourceFacts: string[];
};

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new TypeError('Expected an estimate record.');
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number, label: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) throw new TypeError(`Invalid estimate ${label}.`);
  return value.trim();
}
function calendar(value: unknown): value is string {
  if (typeof value !== 'string' || !/^(19|[2-9]\d)\d{2}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function amount(value: unknown): number | null {
  if (value === null) return null;
  if (!isValidUsdAmount(value)) throw new TypeError('Estimate amounts require nonnegative USD cents or an explicit unknown value.');
  return Math.round(value * 100) / 100;
}
function sourceDate(value: unknown): value is string {
  if (calendar(value)) return true;
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value) && calendar(value.slice(0, 10)) && Number.isFinite(Date.parse(value));
}

/** Strict allowlist; no operational status, raw customer contact or storage content is copied. */
export function parseProjectEstimate(input: unknown): ProjectEstimate {
  const data = object(input);
  if (data.status !== 'estimate' || data.currency !== 'USD') throw new TypeError('Only USD estimate snapshots are supported.');
  const dateBasis = data.dateBasis;
  if (!['source_snapshot', 'source_date', 'unknown'].includes(String(dateBasis))) throw new TypeError('Invalid estimate date basis.');
  if (data.estimatedOn !== null && !sourceDate(data.estimatedOn)) throw new TypeError('Invalid estimate source date.');
  if ((dateBasis === 'unknown') !== (data.estimatedOn === null)) throw new TypeError('Unknown estimate dates must remain explicit.');
  const capturedAt = text(data.capturedAt, 50, 'capture timestamp');
  if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?Z$/.test(capturedAt) || !calendar(capturedAt.slice(0, 10)) || !Number.isFinite(Date.parse(capturedAt))) throw new TypeError('Estimate capture timestamp must be valid UTC.');
  const sourceRef = text(data.sourceRef, 800, 'source reference');
  if (sourceRef.includes('\\') || sourceRef.includes(':') || sourceRef.startsWith('/') || sourceRef.includes('%') || sourceRef.split('/').some(part => !part || part === '.' || part === '..') || /[?#]/.test(sourceRef)) throw new TypeError('Estimate sources require a relative reference, never a public URL or absolute storage path.');
  const sourceSha256 = text(data.sourceSha256, 64, 'source digest').toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(sourceSha256)) throw new TypeError('Invalid estimate source digest.');
  if (!['available', 'archived', 'missing'].includes(String(data.sourceAvailability))) throw new TypeError('Invalid estimate source availability.');
  if (!Array.isArray(data.breakdown) || data.breakdown.length > 1000 || typeof data.breakdownReconciled !== 'boolean') throw new TypeError('Invalid estimate division breakdown.');
  const codes = new Set<string>();
  const breakdown = data.breakdown.map(value => {
    const row = object(value), code = text(row.code, 32, 'division code');
    if (codes.has(code)) throw new TypeError('Duplicate estimate division code.');
    codes.add(code);
    const amountUsd = amount(row.amountUsd);
    if (amountUsd === null) throw new TypeError('Division amounts must be recorded explicitly.');
    return { code, label: text(row.label, 200, 'division label'), amountUsd };
  });
  const amountUsd = amount(data.amountUsd), directCostUsd = amount(data.directCostUsd);
  if (!['direct_cost', 'bid'].includes(String(data.breakdownBasis))) throw new TypeError('Choose the estimate breakdown basis explicitly.');
  const sumCents = breakdown.reduce((sum, row) => sum + Math.round(row.amountUsd * 100), 0);
  if (!Number.isSafeInteger(sumCents)) throw new TypeError('Estimate breakdown exceeds the reporting range.');
  const reconciliationTotal = data.breakdownBasis === 'direct_cost' ? directCostUsd : amountUsd;
  if (data.breakdownReconciled && (!breakdown.length || reconciliationTotal === null || sumCents !== Math.round(reconciliationTotal * 100))) throw new TypeError('Estimate breakdown does not reconcile to this revision basis.');
  const rawTiers = data.costTiers === undefined ? [] : data.costTiers;
  const costTiersReconciled = data.costTiersReconciled === undefined ? false : data.costTiersReconciled;
  if (!Array.isArray(rawTiers) || rawTiers.length > 1000 || typeof costTiersReconciled !== 'boolean') throw new TypeError('Invalid estimate cost tiers.');
  const tierCodes = new Set<string>();
  const costTiers = rawTiers.map(value => {
    const row = object(value), code = text(row.code, 32, 'cost tier code');
    if (tierCodes.has(code)) throw new TypeError('Duplicate estimate cost tier code.');
    tierCodes.add(code);
    const amountUsd = amount(row.amountUsd);
    if (amountUsd === null) throw new TypeError('Cost tier amounts must be recorded explicitly.');
    return { code, label: text(row.label, 200, 'cost tier label'), amountUsd };
  });
  const tierCents = costTiers.reduce((sum, tier) => sum + Math.round(tier.amountUsd * 100), 0);
  if (!Number.isSafeInteger(tierCents)) throw new TypeError('Estimate cost tiers exceed the reporting range.');
  if (costTiersReconciled && (!costTiers.length || directCostUsd === null || tierCents !== Math.round(directCostUsd * 100))) throw new TypeError('Estimate cost tiers do not reconcile to this revision direct cost.');
  if (data.rawCostLineCount !== null && (!Number.isSafeInteger(data.rawCostLineCount) || (data.rawCostLineCount as number) < 0 || (data.rawCostLineCount as number) > 1_000_000)) throw new TypeError('Invalid estimate raw line count.');
  if (!Array.isArray(data.sourceFacts) || data.sourceFacts.length > 50) throw new TypeError('Invalid estimate source facts.');
  return {
    id: text(data.id, 100, 'id'), projectId: text(data.projectId, 100, 'project id'), projectName: text(data.projectName, 200, 'project name'),
    sourceProjectSlug: text(data.sourceProjectSlug, 160, 'source project slug'), status: 'estimate', currency: 'USD', version: text(data.version, 160, 'version'),
    estimatedOn: data.estimatedOn as string | null, dateBasis: dateBasis as ProjectEstimate['dateBasis'], amountUsd, directCostUsd,
    sourceName: text(data.sourceName, 200, 'source name'), sourceRef, sourceSha256, capturedAt: new Date(capturedAt).toISOString(),
    sourceAvailability: data.sourceAvailability as ProjectEstimate['sourceAvailability'], breakdown, breakdownBasis: data.breakdownBasis as ProjectEstimate['breakdownBasis'], breakdownReconciled: data.breakdownReconciled,
    costTiers, costTiersReconciled,
    rawCostLineCount: data.rawCostLineCount as number | null, sourceFacts: data.sourceFacts.map(value => text(value, 1000, 'source fact')),
  };
}

/** Receives already-authorized records; this pure grouping function grants no project access. */
export function groupProjectEstimates(inputs: readonly unknown[], projectId?: string): { estimates: ProjectEstimate[]; invalidCount: number } {
  const parsed: ProjectEstimate[] = [];
  let invalidCount = 0;
  for (const input of inputs) {
    try { parsed.push(parseProjectEstimate(input)); } catch { invalidCount++; }
  }
  const ids = new Map<string, number>();
  for (const row of parsed) ids.set(row.id, (ids.get(row.id) || 0) + 1);
  const estimates = parsed.filter(row => {
    if (ids.get(row.id)! > 1) { invalidCount++; return false; }
    return !projectId || row.projectId === projectId;
  }).sort((a, b) => a.projectId.localeCompare(b.projectId) || (b.estimatedOn || '').localeCompare(a.estimatedOn || '') || a.version.localeCompare(b.version) || a.id.localeCompare(b.id));
  return { estimates, invalidCount };
}
