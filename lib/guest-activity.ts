import { mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { type Actor, requireRole } from './auth';
import { guestProjectReviews } from './takeoff-viewer-access';

export const GUEST_ACTIVITY_ELEMENTS = ['review.visit', 'account.open', 'session.signout', 'year.select', 'month.select', 'summary.retry', 'project.open'] as const;
export type GuestActivityElement = typeof GUEST_ACTIVITY_ELEMENTS[number];
export type GuestActivityInput = { eventId: string; elementId: GuestActivityElement; period?: string; year?: number; projectId?: string };
export interface GuestActivityEvent extends GuestActivityInput { actorId: string; page: 'portal'; createdAt: string }
export interface GuestActivityReport {
  events: GuestActivityEvent[];
  counts: { elementId: GuestActivityElement; count: number }[];
  totalEvents: number;
  retentionDays: number;
  windowStart: string;
  generatedAt: string;
}
export class GuestActivityError extends Error {
  constructor(message: string, public status = 400) { super(message); this.name = 'GuestActivityError'; }
}

const MAX_COMPANY_EVENTS = 10_000;
const RATE_WINDOW_MS = 60_000;
function retentionDays() {
  const configured = process.env.TAYCO_GUEST_ACTIVITY_RETENTION_DAYS;
  if (configured === undefined) return 90;
  if (!/^[1-9]\d{0,2}$/.test(configured) || Number(configured) > 365) throw new GuestActivityError('Activity retention is not configured correctly.', 503);
  return Number(configured);
}
function database() {
  const filename = process.env.TAYCO_ERP_DB_PATH || path.join(process.cwd(), '.data', 'tayco-erp.sqlite');
  mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename);
  try {
    db.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS guest_activity(
        event_id TEXT NOT NULL,actor_id TEXT NOT NULL,tenant_id TEXT NOT NULL,element_id TEXT NOT NULL,
        period TEXT,selected_year INTEGER,page TEXT NOT NULL CHECK(page='portal'),created_at INTEGER NOT NULL,project_id TEXT,
        PRIMARY KEY(tenant_id,actor_id,event_id)
      );
      CREATE INDEX IF NOT EXISTS guest_activity_company_time ON guest_activity(tenant_id,created_at DESC);
      CREATE TABLE IF NOT EXISTS guest_activity_rate_events(
        tenant_id TEXT NOT NULL,actor_id TEXT NOT NULL,event_id TEXT NOT NULL,created_at INTEGER NOT NULL,payload_hash TEXT NOT NULL,
        PRIMARY KEY(tenant_id,actor_id,event_id)
      );
      CREATE INDEX IF NOT EXISTS guest_activity_rate_time ON guest_activity_rate_events(created_at);
      CREATE INDEX IF NOT EXISTS guest_activity_rate_actor ON guest_activity_rate_events(tenant_id,actor_id,created_at);`);
    if (!db.prepare('PRAGMA table_info(guest_activity)').all().some(column => column.name === 'project_id')) {
      db.exec('BEGIN IMMEDIATE');
      try {
        // Recheck while holding the write lock so concurrent processes migrate once.
        if (!db.prepare('PRAGMA table_info(guest_activity)').all().some(column => column.name === 'project_id')) {
          db.exec('ALTER TABLE guest_activity ADD COLUMN project_id TEXT');
        }
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
    return db;
  } catch (error) { db.close(); throw error; }
}
function withDb<T>(fn: (db: DatabaseSync) => T) { const db = database(); try { return fn(db); } finally { db.close(); } }
function validateInput(value: unknown, now: number): GuestActivityInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new GuestActivityError('Send a valid activity event.');
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some(key => !['eventId', 'elementId', 'period', 'year', 'projectId'].includes(key))) throw new GuestActivityError('Activity events contain unsupported fields.');
  if (typeof input.eventId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.eventId)) throw new GuestActivityError('Choose a valid activity event ID.');
  if (typeof input.elementId !== 'string' || !(GUEST_ACTIVITY_ELEMENTS as readonly string[]).includes(input.elementId)) throw new GuestActivityError('Choose a known review control.');
  const result: GuestActivityInput = { eventId: input.eventId.toLowerCase(), elementId: input.elementId as GuestActivityElement };
  if (result.elementId === 'project.open') {
    if (typeof input.projectId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/.test(input.projectId)) throw new GuestActivityError('Choose an approved project for this activity.');
    result.projectId = input.projectId;
  } else if (Object.hasOwn(input, 'projectId')) throw new GuestActivityError('This control does not accept project metadata.');
  const current = new Date(now);
  if (result.elementId === 'month.select') {
    const currentPeriod = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, '0')}`;
    if (typeof input.period !== 'string' || !/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(input.period) || input.period >= currentPeriod || Object.hasOwn(input, 'year')) throw new GuestActivityError('Choose a completed month for this activity.');
    result.period = input.period;
  } else if (result.elementId === 'year.select') {
    if (!Number.isInteger(input.year) || Number(input.year) < 1 || Number(input.year) > current.getUTCFullYear() || Object.hasOwn(input, 'period')) throw new GuestActivityError('Choose a valid review year.');
    result.year = input.year as number;
  } else if (Object.hasOwn(input, 'period') || Object.hasOwn(input, 'year')) throw new GuestActivityError('This control does not accept period or year metadata.');
  return result;
}

export function recordGuestActivity(actor: Actor, value: unknown): { duplicate: boolean } {
  requireRole(actor, ['guest']);
  const now = Date.now();
  const input = validateInput(value, now);
  if (input.elementId === 'project.open') {
    let approved = false;
    try { approved = guestProjectReviews(actor).some(project => project.projectId === input.projectId); } catch { /* A denied or unavailable publication grants no activity write. */ }
    if (!approved) throw new GuestActivityError('This project is not available for review.', 403);
  }
  const payloadHash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const days = retentionDays();
  return withDb(db => {
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare('DELETE FROM guest_activity WHERE created_at<?').run(now - days * 86_400_000);
      db.prepare('DELETE FROM guest_activity_rate_events WHERE created_at<=?').run(now - RATE_WINDOW_MS);
      const previous = db.prepare('SELECT element_id,period,selected_year,project_id FROM guest_activity WHERE tenant_id=? AND actor_id=? AND event_id=?').get(actor.tenantId, actor.id, input.eventId);
      if (previous) {
        if (previous.element_id !== input.elementId || previous.period !== (input.period ?? null) || previous.selected_year !== (input.year ?? null) || previous.project_id !== (input.projectId ?? null)) throw new GuestActivityError('This event ID was already used for different activity.', 409);
        db.exec('COMMIT');
        return { duplicate: true };
      }
      // Cap pruning can remove a recent display row; retain its retry identity for the rate window.
      const recentIdentity = db.prepare('SELECT payload_hash FROM guest_activity_rate_events WHERE tenant_id=? AND actor_id=? AND event_id=?').get(actor.tenantId, actor.id, input.eventId);
      if (recentIdentity) {
        if (recentIdentity.payload_hash !== payloadHash) throw new GuestActivityError('This event ID was already used for different activity.', 409);
        db.exec('COMMIT');
        return { duplicate: true };
      }
      const recent = db.prepare('SELECT count(*) AS count FROM guest_activity_rate_events WHERE tenant_id=? AND actor_id=? AND created_at>?').get(actor.tenantId, actor.id, now - RATE_WINDOW_MS)!;
      if (Number(recent.count) >= 120) throw new GuestActivityError('Too much activity. Please try again shortly.', 429);
      db.prepare('INSERT INTO guest_activity(event_id,actor_id,tenant_id,element_id,period,selected_year,page,created_at,project_id) VALUES(?,?,?,?,?,?,?,?,?)').run(input.eventId, actor.id, actor.tenantId, input.elementId, input.period ?? null, input.year ?? null, 'portal', now, input.projectId ?? null);
      db.prepare('INSERT INTO guest_activity_rate_events VALUES(?,?,?,?,?)').run(actor.tenantId, actor.id, input.eventId, now, payloadHash);
      db.prepare('DELETE FROM guest_activity WHERE rowid IN (SELECT rowid FROM guest_activity WHERE tenant_id=? ORDER BY created_at DESC,rowid DESC LIMIT -1 OFFSET ?)').run(actor.tenantId, MAX_COMPANY_EVENTS);
      db.exec('COMMIT');
      return { duplicate: false };
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  });
}

export function guestActivityReport(actor: Actor): GuestActivityReport {
  requireRole(actor, ['admin']);
  const now = Date.now();
  const days = retentionDays();
  const cutoff = now - days * 86_400_000;
  return withDb(db => {
    db.exec('BEGIN');
    try {
      const rows = db.prepare('SELECT event_id,actor_id,element_id,period,selected_year,created_at,project_id FROM guest_activity WHERE tenant_id=? AND created_at>=? ORDER BY created_at DESC,rowid DESC LIMIT 200').all(actor.tenantId, cutoff);
      const events: GuestActivityEvent[] = rows.map(row => ({
        eventId: String(row.event_id), actorId: String(row.actor_id), elementId: row.element_id as GuestActivityElement, page: 'portal',
        createdAt: new Date(Number(row.created_at)).toISOString(),
        ...(row.period !== null ? { period: String(row.period) } : {}),
        ...(row.selected_year !== null ? { year: Number(row.selected_year) } : {}),
        ...(row.project_id !== null ? { projectId: String(row.project_id) } : {}),
      }));
      const counts = db.prepare('SELECT element_id,count(*) AS count FROM guest_activity WHERE tenant_id=? AND created_at>=? GROUP BY element_id ORDER BY element_id').all(actor.tenantId, cutoff).map(row => ({ elementId: row.element_id as GuestActivityElement, count: Number(row.count) }));
      db.exec('COMMIT');
      return { events, counts, totalEvents: counts.reduce((total, row) => total + row.count, 0), retentionDays: days, windowStart: new Date(cutoff).toISOString(), generatedAt: new Date(now).toISOString() };
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  });
}
