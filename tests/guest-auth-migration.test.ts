import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, createHash, scryptSync } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { spawn } from 'node:child_process';
import { sealData } from 'iron-session';
import { acceptInvitation, AuthError, type Actor, canAccessProject, changePassword, createInvitation, getActor, listAccounts, requireActor, requireProject, sessionCookie, signIn, signOut, updateAccountAccess } from '../lib/auth';

const password = 'Legacy-fixture-password-2026!';
const nextPassword = 'Updated-guest-password-2026!';
const admin: Actor = { id: 'old-admin', email: 'admin@example.test', role: 'admin', tenantId: 'tayco_llc', projectIds: [] };
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const request = (cookie: string) => new Request('https://tayco.test/portal', { headers: { cookie: sessionCookie(cookie).split(';')[0] } });
const fails = (status: number) => (error: unknown) => error instanceof AuthError && error.status === status;
const legacySchema = `
CREATE TABLE auth_users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','staff','client','vendor')),tenant_id TEXT NOT NULL,project_ids TEXT NOT NULL,vendor_id TEXT,disabled INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);
CREATE TABLE auth_sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES auth_users(id),expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE auth_invites(id TEXT PRIMARY KEY,token_hash TEXT UNIQUE NOT NULL,email TEXT NOT NULL,role TEXT NOT NULL,tenant_id TEXT NOT NULL,project_ids TEXT NOT NULL,vendor_id TEXT,expires_at INTEGER NOT NULL,revoked_at INTEGER,accepted_at INTEGER,created_by TEXT NOT NULL REFERENCES auth_users(id),created_at INTEGER NOT NULL);
CREATE TABLE auth_rate_limits(bucket TEXT PRIMARY KEY,window_start INTEGER NOT NULL,hits INTEGER NOT NULL);
CREATE TABLE auth_audit(id TEXT PRIMARY KEY,actor_id TEXT,event TEXT NOT NULL,subject_id TEXT,created_at INTEGER NOT NULL);
CREATE TABLE fixture_links(user_id TEXT REFERENCES auth_users(id), label TEXT);
CREATE TABLE fixture_log(user_id TEXT);
CREATE INDEX fixture_users_role ON auth_users(role);
CREATE TRIGGER fixture_users_updated AFTER UPDATE ON auth_users BEGIN INSERT INTO fixture_log VALUES(new.id); END;
`;

async function fixture(run: (filename: string, token: string, hash: string) => Promise<void>) {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-guest-auth-'));
  const keys = ['TAYCO_AUTH_DB_PATH', 'TAYCO_SESSION_SECRET', 'TAYCO_APP_URL'] as const;
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const filename = path.join(folder, 'legacy.sqlite');
  process.env.TAYCO_AUTH_DB_PATH = filename;
  process.env.TAYCO_SESSION_SECRET = randomBytes(48).toString('hex');
  process.env.TAYCO_APP_URL = 'https://tayco.test';
  const token = randomBytes(32).toString('base64url');
  const salt = '1234567890abcdef1234567890abcdef';
  const hash = `scrypt$32768$8$3$${salt}$${scryptSync(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }).toString('hex')}`;
  const db = new DatabaseSync(filename);
  try {
    db.exec('PRAGMA foreign_keys=ON');
    db.exec(legacySchema);
    for (const role of ['admin', 'staff', 'client', 'vendor']) {
      db.prepare('INSERT INTO auth_users VALUES(?,?,?,?,?,?,?,0,?)').run(`old-${role}`, `${role}@example.test`, hash, role, 'tayco_llc', role === 'admin' || role === 'staff' ? '[]' : '["project-one"]', role === 'vendor' ? 'vendor-one' : null, 1234);
      db.prepare('INSERT INTO auth_sessions VALUES(?,?,?,?)').run(digest(role === 'admin' ? token : `old-session-${role}`), `old-${role}`, Date.now() + 3600_000, 1234);
      db.prepare('INSERT INTO fixture_links VALUES(?,?)').run(`old-${role}`, role);
    }
    db.prepare('INSERT INTO auth_invites VALUES(?,?,?,?,?,?,?,?,NULL,NULL,?,?)').run('old-invite', digest('L'.repeat(43)), 'pending@example.test', 'client', 'tayco_llc', '["project-one"]', null, Date.now() + 3600_000, admin.id, 1234);
    db.prepare('INSERT INTO auth_audit VALUES(?,?,?,?,?)').run('old-audit', admin.id, 'fixture.previous', null, 1234);
  } finally { db.close(); }
  try { await run(filename, token, hash); }
  finally {
    for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
    rmSync(folder, { recursive: true, force: true });
  }
}
function inspect<T>(filename: string, fn: (db: DatabaseSync) => T) {
  const db = new DatabaseSync(filename);
  try { db.exec('PRAGMA foreign_keys=ON'); return fn(db); } finally { db.close(); }
}
function schema(filename: string) {
  return inspect(filename, db => String(db.prepare("SELECT sql FROM sqlite_schema WHERE name='auth_users'").get()!.sql));
}

test('legacy migration preserves all roles, password hashes, existing sessions, invitations and foreign keys', async () => {
  await fixture(async (filename, token, hash) => {
    const before = inspect(filename, db => ({
      users: db.prepare('SELECT * FROM auth_users ORDER BY id').all(),
      sessions: db.prepare('SELECT * FROM auth_sessions ORDER BY token_hash').all(),
      invites: db.prepare('SELECT * FROM auth_invites').all(),
    }));
    const cookie = await sealData({ token }, { password: process.env.TAYCO_SESSION_SECRET!, ttl: 3600 });
    assert.equal((await requireActor(request(cookie))).id, admin.id);
    assert.match(schema(filename), /'guest'/);
    for (let repeat = 0; repeat < 3; repeat++) assert.equal(listAccounts(admin).length, 4);
    inspect(filename, db => {
      assert.deepEqual(db.prepare('SELECT * FROM auth_users ORDER BY id').all(), before.users);
      assert.deepEqual(db.prepare('SELECT * FROM auth_sessions ORDER BY token_hash').all(), before.sessions);
      assert.deepEqual(db.prepare('SELECT * FROM auth_invites').all(), before.invites);
      assert.equal(db.prepare('SELECT password_hash FROM auth_users WHERE id=?').get(admin.id)!.password_hash, hash);
      assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
      for (const name of ['auth_sessions', 'auth_invites', 'fixture_links']) {
        assert.equal(db.prepare(`PRAGMA foreign_key_list(${name})`).get()!.table, 'auth_users');
      }
      assert.ok(db.prepare("SELECT name FROM sqlite_schema WHERE name='fixture_users_role'").get());
      assert.ok(db.prepare("SELECT name FROM sqlite_schema WHERE name='fixture_users_updated'").get());
      assert.equal(db.prepare("SELECT event FROM auth_audit WHERE id='old-audit'").get()!.event, 'fixture.previous');
      assert.throws(() => db.prepare('INSERT INTO auth_sessions VALUES(?,?,?,?)').run('bad-fk', 'missing-user', Date.now() + 1000, 0), /FOREIGN KEY/);
    });
    assert.equal((await signIn(admin.email, password)).actor.id, admin.id);
    const accepted = await acceptInvitation('L'.repeat(43), 'pending@example.test', password);
    assert.deepEqual((await requireActor(request(accepted.cookie))).projectIds, ['project-one']);
    assert.equal((await requireActor(request(cookie))).id, admin.id);
  });
});

test('concurrent legacy initializations rebuild once and preserve referencing data', async () => {
  await fixture(async (filename) => {
    const script = `const { listAccounts } = require('./lib/auth.ts'); const rows = listAccounts(${JSON.stringify(admin)}); if (rows.length !== 4) process.exit(9);`;
    await Promise.all(Array.from({ length: 4 }, () => new Promise<void>((resolve, reject) => {
      const child = spawn(process.execPath, ['--import', 'tsx', '--eval', script], { cwd: process.cwd(), env: process.env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      let stderr = '';
      child.stderr.on('data', chunk => { stderr += chunk; });
      child.on('error', reject);
      child.on('exit', code => code === 0 ? resolve() : reject(new Error(`initializer exited ${code}: ${stderr}`)));
    })));
    inspect(filename, db => {
      assert.match(schema(filename), /'guest'/);
      assert.equal(db.prepare('SELECT count(*) AS n FROM auth_users').get()!.n, 4);
      assert.equal(db.prepare('SELECT count(*) AS n FROM auth_sessions').get()!.n, 4);
      assert.equal(db.prepare('SELECT count(*) AS n FROM auth_invites').get()!.n, 1);
      assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
      assert.equal(db.prepare("SELECT name FROM sqlite_schema WHERE name='auth_users_guest_migration'").get(), undefined);
    });
  });
});

test('failed foreign-key verification rolls back the complete legacy rebuild and supports retry', async () => {
  await fixture(async (filename, _token, hash) => {
    inspect(filename, db => {
      db.exec('PRAGMA foreign_keys=OFF');
      db.prepare('INSERT INTO auth_sessions VALUES(?,?,?,?)').run('orphan-session', 'missing-user', Date.now() + 1000, 0);
    });
    assert.throws(() => listAccounts(admin), /foreign-key check/);
    assert.doesNotMatch(schema(filename), /'guest'/);
    inspect(filename, db => {
      assert.equal(db.prepare('SELECT count(*) AS n FROM auth_users').get()!.n, 4);
      assert.equal(db.prepare('SELECT password_hash FROM auth_users WHERE id=?').get(admin.id)!.password_hash, hash);
      assert.equal(db.prepare('SELECT count(*) AS n FROM auth_invites').get()!.n, 1);
      assert.equal(db.prepare('SELECT count(*) AS n FROM auth_sessions').get()!.n, 5);
      assert.ok(db.prepare("SELECT name FROM sqlite_schema WHERE name='fixture_users_updated'").get());
      assert.equal(db.prepare("SELECT name FROM sqlite_schema WHERE name='auth_users_guest_migration'").get(), undefined);
      db.prepare("DELETE FROM auth_sessions WHERE token_hash='orphan-session'").run();
    });
    assert.equal(listAccounts(admin).length, 4);
    assert.match(schema(filename), /'guest'/);
    assert.deepEqual(inspect(filename, db => db.prepare('PRAGMA foreign_key_check').all()), []);
  });
});

test('guest invitation, account updates, password and logout enforce empty assignments', async () => {
  await fixture(async (filename) => {
    for (const assignment of [{ projectIds: ['project-one'] }, { projectIds: [], vendorId: 'vendor-one' }, { projectIds: [], vendorId: '' }]) {
      assert.throws(() => createInvitation(admin, { email: 'invalid@example.test', role: 'guest', tenantId: admin.tenantId, ...assignment }), fails(400));
    }
    const invitation = createInvitation(admin, { email: 'guest@example.test', role: 'guest', tenantId: admin.tenantId, projectIds: [] });
    const accepted = await acceptInvitation(invitation.token, 'guest@example.test', password);
    const guest = await requireActor(request(accepted.cookie));
    assert.equal(guest.role, 'guest');
    assert.deepEqual(guest.projectIds, []);
    assert.equal(guest.vendorId, undefined);
    for (const forged of [guest, { ...guest, projectIds: ['project-one'] }, { ...guest, projectIds: ['project-one'], vendorId: 'vendor-one' }]) {
      assert.throws(() => requireProject(forged, 'project-one', admin.tenantId), fails(403));
      assert.equal(canAccessProject(forged, 'project-one', admin.tenantId), false);
    }
    let account = listAccounts(admin).find(row => row.id === guest.id)!;
    const update = { id: guest.id, role: 'guest' as const, projectIds: [], disabled: false, accessVersion: account.accessVersion };
    assert.throws(() => updateAccountAccess(admin, { ...update, projectIds: ['project-one'] }), fails(400));
    assert.throws(() => updateAccountAccess(admin, { ...update, vendorId: 'vendor-one' }), fails(400));
    assert.equal((await requireActor(request(accepted.cookie))).id, guest.id);
    updateAccountAccess(admin, update);
    assert.equal(await getActor(request(accepted.cookie)), null);
    const login = await signIn('guest@example.test', password);
    await changePassword(login.actor, password, nextPassword);
    assert.equal(await getActor(request(login.cookie)), null);
    await assert.rejects(signIn('guest@example.test', password), fails(401));
    const newLogin = await signIn('guest@example.test', nextPassword);
    assert.equal(newLogin.actor.role, 'guest');
    await signOut(request(newLogin.cookie));
    assert.equal(await getActor(request(newLogin.cookie)), null);
    // Existing client accounts may be changed to the same restricted role by the ordinary admin flow.
    account = listAccounts(admin).find(row => row.id === 'old-client')!;
    updateAccountAccess(admin, { id: account.id, role: 'guest', projectIds: [], disabled: false, accessVersion: account.accessVersion });
    assert.equal((await signIn('client@example.test', password)).actor.role, 'guest');
    assert.deepEqual(inspect(filename, db => db.prepare('PRAGMA foreign_key_check').all()), []);
  });
});

test('stored invitation tampering and persisted guest assignments fail closed', async () => {
  await fixture(async (filename) => {
    for (const field of ['projects', 'vendor', 'json'] as const) {
      const email = `tampered-${field}@example.test`;
      const invitation = createInvitation(admin, { email, role: 'guest', tenantId: admin.tenantId, projectIds: [] });
      inspect(filename, db => {
        if (field === 'vendor') db.prepare('UPDATE auth_invites SET vendor_id=? WHERE id=?').run('vendor-one', invitation.id);
        else db.prepare('UPDATE auth_invites SET project_ids=? WHERE id=?').run(field === 'json' ? '{invalid' : '["project-one"]', invitation.id);
      });
      await assert.rejects(acceptInvitation(invitation.token, email, password), fails(400));
      inspect(filename, db => {
        assert.equal(db.prepare('SELECT id FROM auth_users WHERE email=?').get(email), undefined);
        assert.equal(db.prepare('SELECT accepted_at FROM auth_invites WHERE id=?').get(invitation.id)!.accepted_at, null);
      });
    }
    const invitation = createInvitation(admin, { email: 'stored-guest@example.test', role: 'guest', tenantId: admin.tenantId, projectIds: [] });
    const cookie = (await acceptInvitation(invitation.token, 'stored-guest@example.test', password)).cookie;
    const guest = await requireActor(request(cookie));
    inspect(filename, db => db.prepare('UPDATE auth_users SET project_ids=? WHERE id=?').run('["project-one"]', guest.id));
    await assert.rejects(requireActor(request(cookie)), fails(403));
  });
});
