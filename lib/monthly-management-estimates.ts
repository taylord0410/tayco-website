import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Actor } from './auth';
import { isValidUsdAmount } from './financial-values';

/** HTTP adapters may map status directly; validation=422, access=403, conflict=409, storage=503. */
export class MonthlyManagementEstimateError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'MonthlyManagementEstimateError'; }
}
export type MonthlyManagementEstimateInput = { period: string; lowUsd: number; highUsd: number; source: string; expectedVersion: number };
export type MonthlyManagementEstimate = {
  tenantId: string; period: string; lowUsd: number; highUsd: number; source: string;
  authorId: string; recordedAt: string; updatedAt: string; version: number;
};
export type GuestMonthlyEstimateSelection = { year?: unknown; month?: unknown };
export type GuestMonthlyEstimateSummary = {
  currency: 'USD'; asOf: string; reportingTimeZone: 'UTC'; year: number; availableYears: number[];
  months: { period: string; lowUsd: number; highUsd: number; basis: 'management_estimate'; updatedAt: string }[];
};
type EstimateRow = { tenant_id: string; period: string; low_cents: number; high_cents: number; source: string; author_id: string; recorded_at: string; updated_at: string; version: number };
type ParsedInput = MonthlyManagementEstimateInput & { lowCents: number; highCents: number };
const controls = /[\u0000-\u001f\u007f-\u009f]/;
const periodPattern = /^(?:19|[2-9]\d)\d{2}-(?:0[1-9]|1[0-2])$/;

function access(actor: Actor, roles: readonly string[]) {
  if (!actor || !roles.includes(actor.role) || !validText(actor.id, 200) || !validText(actor.tenantId, 200))
    throw new MonthlyManagementEstimateError(403, 'This account cannot access monthly management estimates.');
}
function validText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length <= max && value.trim().length > 0 && !controls.test(value);
}
function object(value: unknown, allowed: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype || Object.getOwnPropertySymbols(value).length ||
    Object.getOwnPropertyNames(value).some(key => !allowed.includes(key) || !Object.hasOwn(Object.getOwnPropertyDescriptor(value, key)!, 'value')))
    throw new MonthlyManagementEstimateError(422, 'Use only the documented monthly estimate fields.');
  return value as Record<string, unknown>;
}
function parseInput(value: unknown): ParsedInput {
  const input = object(value, ['period', 'lowUsd', 'highUsd', 'source', 'expectedVersion']);
  if (typeof input.period !== 'string' || !periodPattern.test(input.period)) throw new MonthlyManagementEstimateError(422, 'Choose a valid YYYY-MM period.');
  if (!isValidUsdAmount(input.lowUsd) || !isValidUsdAmount(input.highUsd) || input.lowUsd > input.highUsd)
    throw new MonthlyManagementEstimateError(422, 'Use a nonnegative USD range with at most two decimal places.');
  if (!validText(input.source, 1000)) throw new MonthlyManagementEstimateError(422, 'Provide a management estimate source of 1 to 1000 characters.');
  if (!Number.isSafeInteger(input.expectedVersion) || (input.expectedVersion as number) < 0)
    throw new MonthlyManagementEstimateError(422, 'Provide the current estimate version, or zero for a new month.');
  const lowCents = Math.round(input.lowUsd * 100), highCents = Math.round(input.highUsd * 100);
  return { period: input.period, lowUsd: lowCents / 100, highUsd: highCents / 100, source: input.source.trim(), expectedVersion: input.expectedVersion as number, lowCents, highCents };
}

/** Own tables only: never changes ERP records, invoices, payments or its schema version. No default data. */
function database() {
  const file = process.env.TAYCO_ERP_DB_PATH || path.join(process.cwd(), '.data', 'tayco-erp.sqlite');
  mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(file);
  try {
    db.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS monthly_management_estimates(
        tenant_id TEXT NOT NULL,period TEXT NOT NULL,low_cents INTEGER NOT NULL CHECK(low_cents>=0),
        high_cents INTEGER NOT NULL CHECK(high_cents>=low_cents),source TEXT NOT NULL CHECK(length(source) BETWEEN 1 AND 1000),
        author_id TEXT NOT NULL,recorded_at TEXT NOT NULL,updated_at TEXT NOT NULL,version INTEGER NOT NULL CHECK(version>0),PRIMARY KEY(tenant_id,period));
      CREATE TABLE IF NOT EXISTS monthly_management_estimate_history(
        tenant_id TEXT NOT NULL,period TEXT NOT NULL,version INTEGER NOT NULL,low_cents INTEGER NOT NULL,high_cents INTEGER NOT NULL,
        source TEXT NOT NULL,author_id TEXT NOT NULL,recorded_at TEXT NOT NULL,PRIMARY KEY(tenant_id,period,version));
      CREATE TABLE IF NOT EXISTS monthly_management_estimate_audit(
        id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,actor_id TEXT NOT NULL,period TEXT NOT NULL,version INTEGER NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('created','revised')),recorded_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS monthly_management_estimate_requests(
        tenant_id TEXT NOT NULL,actor_id TEXT NOT NULL,request_key TEXT NOT NULL,hash TEXT NOT NULL,result TEXT NOT NULL,
        recorded_at TEXT NOT NULL,PRIMARY KEY(tenant_id,actor_id,request_key));
      SELECT tenant_id,period,low_cents,high_cents,source,author_id,recorded_at,updated_at,version FROM monthly_management_estimates LIMIT 0;
      SELECT tenant_id,period,version,low_cents,high_cents,source,author_id,recorded_at FROM monthly_management_estimate_history LIMIT 0;
      SELECT id,tenant_id,actor_id,period,version,action,recorded_at FROM monthly_management_estimate_audit LIMIT 0;
      SELECT tenant_id,actor_id,request_key,hash,result,recorded_at FROM monthly_management_estimate_requests LIMIT 0;
      COMMIT;`);
    return db;
  } catch (error) { try { db.exec('ROLLBACK'); } catch { /* No active transaction. */ } db.close(); throw error; }
}
function withDb<T>(run: (db: DatabaseSync) => T): T {
  let db: DatabaseSync | undefined;
  try { db = database(); return run(db); }
  catch (error) {
    if (error instanceof MonthlyManagementEstimateError) throw error;
    throw new MonthlyManagementEstimateError(503, 'Monthly management estimates are temporarily unavailable.');
  } finally { db?.close(); }
}
function decoded(row: EstimateRow): MonthlyManagementEstimate {
  if (!row || !validText(row.tenant_id, 200) || !periodPattern.test(row.period) || !Number.isSafeInteger(row.low_cents) || !Number.isSafeInteger(row.high_cents) ||
    !isValidUsdAmount(row.low_cents / 100) || !isValidUsdAmount(row.high_cents / 100) || row.low_cents > row.high_cents || !validText(row.source, 1000) ||
    !validText(row.author_id, 200) || !Number.isSafeInteger(row.version) || row.version < 1 ||
    !validTimestamp(row.recorded_at) || !validTimestamp(row.updated_at))
    throw new MonthlyManagementEstimateError(503, 'Monthly management estimate data needs operator review.');
  return { tenantId: row.tenant_id, period: row.period, lowUsd: row.low_cents / 100, highUsd: row.high_cents / 100, source: row.source,
    authorId: row.author_id, recordedAt: row.recorded_at, updatedAt: row.updated_at, version: row.version };
}
function validTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

/** Internal company view. Guests must use guestMonthlyEstimateSummary instead. */
export function listMonthlyManagementEstimates(actor: Actor): MonthlyManagementEstimate[] {
  access(actor, ['admin', 'staff']);
  return withDb(db => (db.prepare('SELECT * FROM monthly_management_estimates WHERE tenant_id=? ORDER BY period DESC').all(actor.tenantId) as EstimateRow[]).map(decoded));
}

/**
 * Atomic current value + full immutable revision + audit + request receipt.
 * Same key is exact replay; a new key with an identical range/source is a semantic no-op.
 * Changed values require expectedVersion=current; first creation requires expectedVersion=0.
 */
export function saveMonthlyManagementEstimate(actor: Actor, key: string, value: unknown): MonthlyManagementEstimate {
  access(actor, ['admin', 'staff']);
  if (typeof key !== 'string' || !/^[\w-]{16,100}$/.test(key)) throw new MonthlyManagementEstimateError(422, 'A valid request reference is required.');
  const input = parseInput(value);
  const hash = createHash('sha256').update(JSON.stringify({ period: input.period, lowCents: input.lowCents, highCents: input.highCents, source: input.source, expectedVersion: input.expectedVersion })).digest('hex');
  return withDb(db => {
    db.exec('BEGIN IMMEDIATE');
    try {
      const receipt = db.prepare('SELECT hash,result FROM monthly_management_estimate_requests WHERE tenant_id=? AND actor_id=? AND request_key=?').get(actor.tenantId, actor.id, key) as { hash: string; result: string } | undefined;
      if (receipt) {
        if (receipt.hash !== hash) throw new MonthlyManagementEstimateError(409, 'This request reference was already used for different data.');
        const result = JSON.parse(receipt.result) as MonthlyManagementEstimate;
        // Receipts are internal-only and remain company scoped even if storage is damaged.
        if (result.tenantId !== actor.tenantId || result.period !== input.period || !isValidUsdAmount(result.lowUsd) || !isValidUsdAmount(result.highUsd))
          throw new MonthlyManagementEstimateError(503, 'Monthly estimate receipt needs operator review.');
        const validated = decoded({ tenant_id: result.tenantId, period: result.period, low_cents: Math.round(result.lowUsd * 100), high_cents: Math.round(result.highUsd * 100),
          source: result.source, author_id: result.authorId, recorded_at: result.recordedAt, updated_at: result.updatedAt, version: result.version });
        db.exec('COMMIT'); return validated;
      }
      const row = db.prepare('SELECT * FROM monthly_management_estimates WHERE tenant_id=? AND period=?').get(actor.tenantId, input.period) as EstimateRow | undefined;
      const current = row ? decoded(row) : undefined, at = new Date().toISOString();
      let result: MonthlyManagementEstimate;
      if (current && row!.low_cents === input.lowCents && row!.high_cents === input.highCents && current.source === input.source) result = current;
      else {
        if (input.expectedVersion !== (current?.version ?? 0)) throw new MonthlyManagementEstimateError(409, 'This month changed. Refresh and review its current estimate version.');
        const version = (current?.version ?? 0) + 1;
        if (!Number.isSafeInteger(version)) throw new MonthlyManagementEstimateError(409, 'This estimate version needs operator review.');
        result = { tenantId: actor.tenantId, period: input.period, lowUsd: input.lowUsd, highUsd: input.highUsd, source: input.source,
          authorId: actor.id, recordedAt: current?.recordedAt ?? at, updatedAt: at, version };
        db.prepare(`INSERT INTO monthly_management_estimates VALUES(?,?,?,?,?,?,?,?,?)
          ON CONFLICT(tenant_id,period) DO UPDATE SET low_cents=excluded.low_cents,high_cents=excluded.high_cents,source=excluded.source,
          author_id=excluded.author_id,updated_at=excluded.updated_at,version=excluded.version`).run(actor.tenantId, input.period, input.lowCents, input.highCents, input.source, actor.id, result.recordedAt, at, version);
        db.prepare('INSERT INTO monthly_management_estimate_history VALUES(?,?,?,?,?,?,?,?)').run(actor.tenantId, input.period, version, input.lowCents, input.highCents, input.source, actor.id, at);
        db.prepare('INSERT INTO monthly_management_estimate_audit VALUES(?,?,?,?,?,?,?)').run(randomUUID(), actor.tenantId, actor.id, input.period, version, current ? 'revised' : 'created', at);
      }
      db.prepare('INSERT INTO monthly_management_estimate_requests VALUES(?,?,?,?,?,?)').run(actor.tenantId, actor.id, key, hash, JSON.stringify(result), at);
      db.exec('COMMIT'); return result;
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  });
}

function selectedNumber(value: unknown, min: number, max: number): number | undefined {
  if (value === undefined || value === null || value === '' || value === 'all') return undefined;
  if (!['string', 'number'].includes(typeof value) || !/^\d+$/.test(String(value))) throw new MonthlyManagementEstimateError(422, 'Choose a valid completed-month period.');
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new MonthlyManagementEstimateError(422, 'Choose a valid completed-month period.');
  return n;
}

/**
 * Guest-safe selector and sole guest export: no raw row, source, author, IDs or project detail.
 * The optional clock is server/test dependency injection, never a query/body parameter.
 * Historical years include all months; the current UTC year includes completed months only.
 */
export function guestMonthlyEstimateSummary(actor: Actor, selection?: GuestMonthlyEstimateSelection, now = new Date()): GuestMonthlyEstimateSummary {
  access(actor, ['admin', 'staff', 'guest']);
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new MonthlyManagementEstimateError(422, 'A valid server reporting clock is required.');
  const query = selection === undefined ? {} : object(selection, ['year', 'month']);
  const explicitYear = selectedNumber(query.year, 1900, 9999), month = selectedNumber(query.month, 1, 12);
  if (month !== undefined && explicitYear === undefined) throw new MonthlyManagementEstimateError(422, 'Choose a year before choosing a month.');
  const currentYear = now.getUTCFullYear(), currentMonth = now.getUTCMonth() + 1;
  const year = explicitYear ?? (currentMonth === 1 ? currentYear - 1 : currentYear);
  const cutoff = `${String(currentYear).padStart(4, '0')}-${String(currentMonth).padStart(2, '0')}`;
  const requestedPeriod = month === undefined ? undefined : `${year}-${String(month).padStart(2, '0')}`;
  if (year > currentYear || (requestedPeriod && requestedPeriod >= cutoff)) throw new MonthlyManagementEstimateError(422, 'Only completed months are available for review.');
  return withDb(db => {
    const years = db.prepare('SELECT DISTINCT substr(period,1,4) AS year FROM monthly_management_estimates WHERE tenant_id=? AND period<? ORDER BY year DESC').all(actor.tenantId, cutoff) as { year: string }[];
    const rows = db.prepare(`SELECT * FROM monthly_management_estimates WHERE tenant_id=? AND period>=? AND period<=? AND period<? ORDER BY period LIMIT 12`).all(actor.tenantId, requestedPeriod ?? `${year}-01`, requestedPeriod ?? `${year}-12`, cutoff) as EstimateRow[];
    const months = rows.map(row => { const entry = decoded(row); return { period: entry.period, lowUsd: entry.lowUsd, highUsd: entry.highUsd, basis: 'management_estimate' as const, updatedAt: entry.updatedAt }; });
    return { currency: 'USD', asOf: now.toISOString(), reportingTimeZone: 'UTC', year,
      availableYears: [...new Set([year, ...years.map(row => Number(row.year)).filter(n => Number.isInteger(n) && n >= 1900 && n <= currentYear)])].sort((a, b) => b - a), months };
  });
}
