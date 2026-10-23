import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { type Actor, AuthError, createSession, provisionAdmin, sessionCookie } from '../lib/auth';
import { GUEST_ACTIVITY_ELEMENTS, GuestActivityError, guestActivityReport, recordGuestActivity } from '../lib/guest-activity';
import { GET, POST } from '../app/api/guest-activity/route';

const guest: Actor = { id: 'guest-one', email: 'guest@example.test', role: 'guest', tenantId: 'company-one', projectIds: [] };
const admin: Actor = { ...guest, id: 'admin-one', email: 'admin@example.test', role: 'admin' };
const event = (elementId: string = 'review.visit', extra: Record<string, unknown> = {}) => ({ eventId: randomUUID(), elementId, ...extra });
const fails = (status: number) => (error: unknown) => (error instanceof GuestActivityError || error instanceof AuthError) && error.status === status;

async function fixture(run: (filename: string, folder: string) => Promise<void>) {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-guest-activity-'));
  const keys = ['TAYCO_ERP_DB_PATH', 'TAYCO_AUTH_DB_PATH', 'TAYCO_APP_URL', 'TAYCO_SESSION_SECRET', 'TAYCO_GUEST_ACTIVITY_RETENTION_DAYS'] as const;
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const filename = path.join(folder, 'activity', 'erp.sqlite');
  process.env.TAYCO_ERP_DB_PATH = filename;
  process.env.TAYCO_AUTH_DB_PATH = path.join(folder, 'auth.sqlite');
  process.env.TAYCO_APP_URL = 'https://tayco.test';
  process.env.TAYCO_SESSION_SECRET = randomBytes(48).toString('hex');
  delete process.env.TAYCO_GUEST_ACTIVITY_RETENTION_DAYS;
  try { await run(filename, folder); }
  finally {
    for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
    rmSync(folder, { recursive: true, force: true });
  }
}
function inspect<T>(filename: string, fn: (db: DatabaseSync) => T) { const db = new DatabaseSync(filename); try { return fn(db); } finally { db.close(); } }
async function sessions() {
  const adminId = await provisionAdmin('admin@example.test', 'Activity-fixture-admin-password!', admin.tenantId);
  const db = new DatabaseSync(process.env.TAYCO_AUTH_DB_PATH!);
  const actors: Record<string, Actor> = { admin: { ...admin, id: adminId } };
  try {
    for (const role of ['guest', 'staff', 'client', 'vendor'] as const) {
      const actor: Actor = { ...guest, id: `fixture-${role}`, role, email: `${role}@example.test`, ...(role === 'vendor' ? { vendorId: 'vendor-one' } : {}) };
      db.prepare('INSERT INTO auth_users VALUES(?,?,?,?,?,?,?,0,?)').run(actor.id, actor.email, 'unused-fixture-hash', role, actor.tenantId, '[]', actor.vendorId ?? null, Date.now());
      actors[role] = actor;
    }
    const otherAdmin = { ...admin, id: 'other-admin', email: 'other-admin@example.test', tenantId: 'company-two' };
    db.prepare('INSERT INTO auth_users VALUES(?,?,?,?,?,?,?,0,?)').run(otherAdmin.id, otherAdmin.email, 'unused-fixture-hash', 'admin', otherAdmin.tenantId, '[]', null, Date.now());
    actors.otherAdmin = otherAdmin;
  } finally { db.close(); }
  const cookies: Record<string, string> = {};
  for (const [role, actor] of Object.entries(actors)) cookies[role] = await createSession(actor.id);
  return { actors, cookies };
}
function post(cookie: string | undefined, body: unknown, options: { origin?: string | null; contentType?: string } = {}) {
  const headers: Record<string, string> = { 'content-type': options.contentType ?? 'application/json' };
  if (options.origin !== null) headers.origin = options.origin ?? 'https://tayco.test';
  if (cookie) headers.cookie = sessionCookie(cookie).split(';')[0];
  return new Request('https://tayco.test/api/guest-activity', { method: 'POST', headers, body: JSON.stringify(body) });
}
function get(cookie?: string) { return new Request('https://tayco.test/api/guest-activity', { headers: cookie ? { cookie: sessionCookie(cookie).split(';')[0] } : {} }); }

test('role guards and HTTP authentication run before body consumption or activity storage', async () => {
  await fixture(async filename => {
    for (const role of ['admin', 'staff', 'client', 'vendor'] as const) assert.throws(() => recordGuestActivity({ ...guest, role }, event()), fails(403));
    for (const role of ['guest', 'staff', 'client', 'vendor'] as const) assert.throws(() => guestActivityReport({ ...guest, role }), fails(403));
    assert.equal(existsSync(filename), false);
    const { cookies } = await sessions();
    for (const role of ['admin', 'staff', 'client', 'vendor']) {
      const request = post(cookies[role], { ignored: 'x'.repeat(11_000) });
      assert.equal((await POST(request)).status, 403);
      assert.equal(request.bodyUsed, false);
    }
    for (const role of ['guest', 'staff', 'client', 'vendor']) assert.equal((await GET(get(cookies[role]))).status, 403);
    const missing = post(undefined, event());
    assert.equal((await POST(missing)).status, 401);
    assert.equal(missing.bodyUsed, false);
    assert.equal((await GET(get())).status, 401);
    const csrf = post(cookies.guest, event(), { origin: null });
    assert.equal((await POST(csrf)).status, 403);
    assert.equal(csrf.bodyUsed, false);
    assert.equal((await POST(post(cookies.guest, event(), { origin: 'https://attacker.test' }))).status, 403);
    assert.equal(existsSync(filename), false);
  });
});

test('HTTP schema, origin and body bounds reject spoofed or arbitrary telemetry', async () => {
  await fixture(async filename => {
    const { cookies } = await sessions();
    for (const field of ['actorId', 'tenantId', 'createdAt', 'timestamp', 'page', 'url', 'ip', 'userAgent', 'text', 'value']) {
      const response = await POST(post(cookies.guest, event('review.visit', { [field]: 'spoofed' })));
      assert.equal(response.status, 400, field);
      assert.equal(response.headers.get('Cache-Control'), 'no-store, private');
    }
    for (const invalid of [
      event('unknown.control'), event('review.visit', { period: '2025-01' }), event('account.open', { year: 2025 }),
      event('year.select'), event('month.select'), event('year.select', { year: '2025' }), event('month.select', { period: '2025-13' }),
      event('year.select', { year: 2025, period: '2025-01' }), event('month.select', { period: '2025-01', year: 2025 }),
      { eventId: 'not-a-uuid', elementId: 'review.visit' }, [], null,
    ]) assert.equal((await POST(post(cookies.guest, invalid))).status, 400);
    assert.equal((await POST(post(cookies.guest, event(), { contentType: 'text/plain' }))).status, 415);
    assert.equal((await POST(post(cookies.guest, { huge: 'x'.repeat(10_001) }))).status, 413);
    const malformed = new Request('https://tayco.test/api/guest-activity', { method: 'POST', headers: { origin: 'https://tayco.test', cookie: sessionCookie(cookies.guest).split(';')[0], 'content-type': 'application/json' }, body: '{' });
    assert.equal((await POST(malformed)).status, 400);
    assert.equal(existsSync(filename), false);
  });
});

test('allowed activity is server-scoped, deduplicated, conflict checked and admin-company isolated', async () => {
  await fixture(async filename => {
    const { cookies, actors } = await sessions();
    const visit = event();
    const first = await POST(post(cookies.guest, visit));
    assert.equal(first.status, 200);
    assert.deepEqual(await first.json(), { success: true, duplicate: false });
    const duplicate = await POST(post(cookies.guest, visit));
    assert.deepEqual(await duplicate.json(), { success: true, duplicate: true });
    assert.equal((await POST(post(cookies.guest, { ...visit, elementId: 'summary.retry' }))).status, 409);
    for (const elementId of GUEST_ACTIVITY_ELEMENTS.filter(id => !['year.select', 'month.select', 'review.visit'].includes(id))) assert.equal((await POST(post(cookies.guest, event(elementId)))).status, 200);
    // The same event ID belongs independently to a different actor and a different company.
    recordGuestActivity({ ...guest, id: 'another-guest' }, visit);
    recordGuestActivity({ ...guest, id: 'other-company-guest', tenantId: 'company-two' }, visit);
    const response = await GET(get(cookies.admin));
    const report = await response.json();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'no-store, private');
    assert.equal(report.success, true);
    assert.equal(report.totalEvents, 5);
    assert.equal(report.retentionDays, 90);
    assert.equal(report.counts.reduce((sum: number, row: { count: number }) => sum + row.count, 0), 5);
    assert.equal(report.events.length, 5);
    const own = report.events.find((row: { actorId: string; eventId: string }) => row.actorId === actors.guest.id && row.eventId === visit.eventId);
    assert.deepEqual(Object.keys(own).sort(), ['actorId', 'createdAt', 'elementId', 'eventId', 'page']);
    assert.equal(own.page, 'portal');
    assert.equal(Number.isFinite(Date.parse(own.createdAt)), true);
    assert.equal(report.events.some((row: { actorId: string }) => row.actorId === 'other-company-guest'), false);
    const other = await (await GET(get(cookies.otherAdmin))).json();
    assert.equal(other.totalEvents, 1);
    assert.equal(other.events[0].actorId, 'other-company-guest');
    inspect(filename, db => {
      assert.equal(db.prepare('SELECT tenant_id FROM guest_activity WHERE actor_id=? LIMIT 1').get(actors.guest.id)!.tenant_id, actors.guest.tenantId);
      assert.equal(db.prepare('PRAGMA journal_mode').get()!.journal_mode, 'wal');
    });
  });
});

test('UTC completed-month and year boundaries use the server clock', async t => {
  await fixture(async () => {
    t.mock.method(Date, 'now', () => Date.parse('2026-01-01T00:00:00Z'));
    assert.deepEqual(recordGuestActivity(guest, event('month.select', { period: '2025-12' })), { duplicate: false });
    assert.deepEqual(recordGuestActivity(guest, event('year.select', { year: 2026 })), { duplicate: false });
    for (const period of ['2026-01', '2026-02', '2027-01', '0000-12', '2025-1']) assert.throws(() => recordGuestActivity(guest, event('month.select', { period })), fails(400));
    for (const year of [0, 2027, 2025.5, '2025']) assert.throws(() => recordGuestActivity(guest, event('year.select', { year })), fails(400));
    const report = guestActivityReport(admin);
    assert.equal(report.events.find(row => row.elementId === 'month.select')!.period, '2025-12');
    assert.equal(report.events.find(row => row.elementId === 'year.select')!.year, 2026);
    assert.equal(report.generatedAt, '2026-01-01T00:00:00.000Z');
  });
});

test('rolling per-actor rate rejects only new events and recovers after one minute', async t => {
  await fixture(async () => {
    let now = Date.parse('2026-10-23T12:00:00Z');
    t.mock.method(Date, 'now', () => now);
    const first = event();
    recordGuestActivity(guest, first);
    for (let index = 1; index < 120; index++) recordGuestActivity(guest, event());
    assert.deepEqual(recordGuestActivity(guest, first), { duplicate: true });
    assert.throws(() => recordGuestActivity(guest, event()), fails(429));
    assert.throws(() => recordGuestActivity(guest, { ...first, elementId: 'summary.retry' }), fails(409));
    assert.deepEqual(recordGuestActivity({ ...guest, id: 'second-guest' }, event()), { duplicate: false });
    now += 59_999;
    assert.throws(() => recordGuestActivity(guest, event()), fails(429));
    now += 1;
    assert.deepEqual(recordGuestActivity(guest, event()), { duplicate: false });
    assert.equal(guestActivityReport(admin).totalEvents, 122);
  });
});

test('HTTP rate errors keep their typed status', async () => {
  await fixture(async () => {
    const { cookies, actors } = await sessions();
    const first = event();
    recordGuestActivity(actors.guest, first);
    for (let index = 1; index < 120; index++) recordGuestActivity(actors.guest, event());
    assert.equal((await POST(post(cookies.guest, event()))).status, 429);
    assert.equal((await POST(post(cookies.guest, first))).status, 200);
  });
});

test('retention and per-company caps bound reports and prune during ordinary writes', async t => {
  await fixture(async filename => {
    const now = Date.parse('2026-10-23T12:00:00Z');
    let serverClock = now - 20_000;
    t.mock.method(Date, 'now', () => serverClock);
    process.env.TAYCO_GUEST_ACTIVITY_RETENTION_DAYS = '1';
    const first = event();
    recordGuestActivity(guest, first);
    serverClock = now;
    const oldestId = randomUUID();
    inspect(filename, db => {
      db.exec('BEGIN');
      try {
        const insert = db.prepare('INSERT INTO guest_activity VALUES(?,?,?,?,?,?,?,?)');
        insert.run(oldestId, 'seed-guest', guest.tenantId, 'review.visit', null, null, 'portal', now - 20_000);
        for (let index = 0; index < 10_005; index++) insert.run(randomUUID(), 'seed-guest', guest.tenantId, 'review.visit', null, null, 'portal', now - 10_010 + index);
        insert.run(randomUUID(), 'other-company', 'company-two', 'review.visit', null, null, 'portal', now - 1000);
        insert.run(randomUUID(), 'expired', guest.tenantId, 'review.visit', null, null, 'portal', now - 86_400_001);
        insert.run(randomUUID(), 'expired-other', 'company-two', 'review.visit', null, null, 'portal', now - 86_400_001);
        db.prepare('INSERT INTO guest_activity_rate_events VALUES(?,?,?,?,?)').run(guest.tenantId, 'expired-rate', randomUUID(), now - 60_000, 'expired-payload-hash');
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    });
    // Reports exclude expired rows even if no subsequent write has pruned them.
    assert.equal(guestActivityReport({ ...admin, tenantId: 'company-two' }).totalEvents, 1);
    recordGuestActivity(guest, event('summary.retry'));
    assert.deepEqual(recordGuestActivity(guest, first), { duplicate: true });
    assert.throws(() => recordGuestActivity(guest, { ...first, elementId: 'summary.retry' }), fails(409));
    const report = guestActivityReport(admin);
    assert.equal(report.retentionDays, 1);
    assert.equal(report.windowStart, new Date(now - 86_400_000).toISOString());
    assert.equal(report.events.length, 200);
    assert.equal(report.totalEvents, 10_000);
    inspect(filename, db => {
      assert.equal(db.prepare('SELECT count(*) AS n FROM guest_activity WHERE tenant_id=?').get(guest.tenantId)!.n, 10_000);
      assert.equal(db.prepare('SELECT event_id FROM guest_activity WHERE event_id=?').get(oldestId), undefined);
      assert.equal(db.prepare('SELECT event_id FROM guest_activity WHERE event_id=?').get(first.eventId), undefined);
      assert.equal(db.prepare("SELECT count(*) AS n FROM guest_activity WHERE actor_id LIKE 'expired%'").get()!.n, 0);
      assert.equal(db.prepare("SELECT count(*) AS n FROM guest_activity_rate_events WHERE actor_id='expired-rate'").get()!.n, 0);
      assert.equal(db.prepare("SELECT count(*) AS n FROM guest_activity WHERE tenant_id='company-two'").get()!.n, 1);
    });
  });
});

test('retention configuration validates its supported bounds before storage', async () => {
  await fixture(async filename => {
    for (const days of ['', '0', '-1', '366', '1.5', 'oops']) {
      process.env.TAYCO_GUEST_ACTIVITY_RETENTION_DAYS = days;
      assert.throws(() => recordGuestActivity(guest, event()), fails(503));
      assert.throws(() => guestActivityReport(admin), fails(503));
      assert.equal(existsSync(filename), false);
    }
    for (const days of ['1', '365']) {
      process.env.TAYCO_GUEST_ACTIVITY_RETENTION_DAYS = days;
      recordGuestActivity(guest, event());
      assert.equal(guestActivityReport(admin).retentionDays, Number(days));
    }
  });
});
