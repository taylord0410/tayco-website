import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import {
  AuthError, acceptInvitation, createInvitation, getActor, listAccounts, provisionAdmin,
  provisionAdditionalAdminPrivately, revokeUserSessionsPrivately, sessionCookie, signIn, updateAccountAccess,
} from '../lib/auth';

async function fixture(run: (file: string, password: string) => Promise<void>) {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-additional-admin-'));
  const previous = { db: process.env.TAYCO_AUTH_DB_PATH, secret: process.env.TAYCO_SESSION_SECRET };
  process.env.TAYCO_AUTH_DB_PATH = path.join(folder, 'auth.sqlite');
  process.env.TAYCO_SESSION_SECRET = randomBytes(48).toString('hex');
  const password = randomBytes(24).toString('base64url');
  try { await run(process.env.TAYCO_AUTH_DB_PATH, password); } finally {
    if (previous.db === undefined) delete process.env.TAYCO_AUTH_DB_PATH; else process.env.TAYCO_AUTH_DB_PATH = previous.db;
    if (previous.secret === undefined) delete process.env.TAYCO_SESSION_SECRET; else process.env.TAYCO_SESSION_SECRET = previous.secret;
    rmSync(folder, { recursive: true, force: true });
  }
}
function dbRead<T>(file: string, run: (db: DatabaseSync) => T): T {
  const db = new DatabaseSync(file); try { return run(db); } finally { db.close(); }
}
const fails = (status: number) => (error: unknown) => error instanceof AuthError && error.status === status;
const counts = (file: string) => dbRead(file, db => ({
  users: db.prepare('SELECT COUNT(*) AS count FROM auth_users').get()!.count,
  audit: db.prepare('SELECT COUNT(*) AS count FROM auth_audit').get()!.count,
}));
const request = (cookie: string) => new Request('https://fixture.test/api/auth/session', { headers: { cookie: sessionCookie(cookie).split(';')[0] } });

test('additional administrator requires a preexisting active administrator in the explicit same company', async () => fixture(async (file, password) => {
  await assert.rejects(provisionAdditionalAdminPrivately('second@example.test', password, 'fixture-company'), fails(409));
  assert.deepEqual(counts(file), { users: 0, audit: 0 });
  await provisionAdmin('first@example.test', password, 'other-company');
  const before = counts(file);
  await assert.rejects(provisionAdditionalAdminPrivately('second@example.test', password, 'fixture-company'), fails(409));
  assert.deepEqual(counts(file), before);
  revokeUserSessionsPrivately('first@example.test', true);
  const disabledBefore = counts(file);
  await assert.rejects(provisionAdditionalAdminPrivately('second@example.test', password, 'other-company'), fails(409));
  assert.deepEqual(counts(file), disabledBefore);
  revokeUserSessionsPrivately('first@example.test', false);
  const id = await provisionAdditionalAdminPrivately('second@example.test', password, 'other-company');
  assert.ok(id);
}));

test('separate additional administrator logins retain independent hashes, identities, sessions and operator audit', async () => fixture(async (file, firstPassword) => {
  const secondPassword = randomBytes(24).toString('base64url');
  const firstId = await provisionAdmin('first@example.test', firstPassword, 'fixture-company');
  const firstSession = await signIn('first@example.test', firstPassword);
  const secondId = await provisionAdditionalAdminPrivately(' SECOND@example.test ', secondPassword, 'fixture-company');
  assert.notEqual(firstId, secondId);
  const secondSession = await signIn('second@example.test', secondPassword);
  assert.equal(secondSession.actor.role, 'admin'); assert.equal(secondSession.actor.tenantId, 'fixture-company');
  assert.deepEqual(secondSession.actor.projectIds, []); assert.equal(secondSession.actor.vendorId, undefined);
  assert.equal((await getActor(request(firstSession.cookie)))!.id, firstId);
  assert.equal((await getActor(request(secondSession.cookie)))!.id, secondId);
  assert.equal((await signIn('first@example.test', firstPassword)).actor.id, firstId);
  await assert.rejects(signIn('second@example.test', firstPassword), fails(401));
  await assert.rejects(signIn('first@example.test', secondPassword), fails(401));
  const data = dbRead(file, db => ({
    users: db.prepare('SELECT id,password_hash FROM auth_users ORDER BY email').all(),
    event: db.prepare("SELECT actor_id,event,subject_id FROM auth_audit WHERE event='admin.provisioned_by_operator'").get(),
  }));
  assert.notEqual(data.users[0].password_hash, data.users[1].password_hash);
  for (const user of data.users) {
    assert.match(String(user.password_hash), /^scrypt\$32768\$8\$3\$/);
    assert.notEqual(user.password_hash, firstPassword); assert.notEqual(user.password_hash, secondPassword);
  }
  assert.deepEqual({ ...data.event }, { actor_id: null, event: 'admin.provisioned_by_operator', subject_id: secondId });
  const accounts = listAccounts(firstSession.actor);
  assert.equal(accounts.length, 2); assert.ok(accounts.every(account => account.role === 'admin' && !account.editable));
  revokeUserSessionsPrivately('second@example.test', true);
  assert.equal(await getActor(request(secondSession.cookie)), null);
  assert.equal((await getActor(request(firstSession.cookie)))!.id, firstId, 'Second-account revocation does not revoke the first.');
  await assert.rejects(provisionAdmin('third@example.test', secondPassword, 'fixture-company'), fails(409));
}));

test('duplicate normalized emails and other-role collisions never promote or mutate an account', async () => fixture(async (file, password) => {
  await provisionAdmin('first@example.test', password, 'fixture-company');
  const admin = (await signIn('first@example.test', password)).actor;
  const invite = createInvitation(admin, { email: 'client@example.test', role: 'client', tenantId: admin.tenantId, projectIds: [] });
  await acceptInvitation(invite.token, 'client@example.test', password);
  const before = dbRead(file, db => db.prepare('SELECT * FROM auth_users ORDER BY email').all());
  for (const email of ['FIRST@example.test', ' client@example.test ']) {
    const prior = counts(file);
    await assert.rejects(provisionAdditionalAdminPrivately(email, randomBytes(24).toString('base64url'), 'fixture-company'), fails(409));
    assert.deepEqual(counts(file), prior);
    assert.deepEqual(dbRead(file, db => db.prepare('SELECT * FROM auth_users ORDER BY email').all()), before);
  }
  assert.throws(() => createInvitation(admin, { email: 'web-admin@example.test', role: 'admin', tenantId: admin.tenantId, projectIds: [] }), fails(403));
  const client = listAccounts(admin).find(account => account.role === 'client')!;
  assert.throws(() => updateAccountAccess(admin, { id: client.id, role: 'admin', projectIds: [], disabled: false, accessVersion: client.accessVersion }), fails(403));
}));

test('additional administrator rejects missing or invalid tenant, email and password before creating a database', async () => fixture(async (file, password) => {
  for (const tenant of [undefined, null, '', ' ', 'company with spaces', '../company', 'x'.repeat(101)] as unknown[]) {
    await assert.rejects(provisionAdditionalAdminPrivately('second@example.test', password, tenant as string), fails(400));
  }
  for (const invalid of ['', 'short', 'x'.repeat(129), null] as unknown[]) {
    await assert.rejects(provisionAdditionalAdminPrivately('second@example.test', invalid as string, 'fixture-company'), fails(400));
  }
  await assert.rejects(provisionAdditionalAdminPrivately('invalid-address', password, 'fixture-company'), fails(400));
  assert.equal(existsSync(file), false);
}));

test('additional administrator insert and operator audit roll back together', async () => fixture(async (file, password) => {
  await provisionAdmin('first@example.test', password, 'fixture-company');
  dbRead(file, db => db.exec("CREATE TRIGGER reject_operator_audit BEFORE INSERT ON auth_audit WHEN NEW.event='admin.provisioned_by_operator' BEGIN SELECT RAISE(ABORT,'Synthetic audit failure'); END;"));
  const before = counts(file);
  await assert.rejects(provisionAdditionalAdminPrivately('second@example.test', password, 'fixture-company'), /Synthetic audit failure/);
  assert.deepEqual(counts(file), before);
  dbRead(file, db => db.exec('DROP TRIGGER reject_operator_audit;'));
  await provisionAdditionalAdminPrivately('second@example.test', password, 'fixture-company');
  assert.equal(counts(file).users, 2);
}));

test('private add-admin CLI requires an explicit environment tenant and emits no credentials', async () => fixture(async (file, password) => {
  await provisionAdmin('first@example.test', password, 'fixture-company');
  const email = 'cli-' + randomUUID() + '@example.test', secondPassword = randomBytes(24).toString('base64url');
  const env = { ...process.env, TAYCO_ADDITIONAL_ADMIN_EMAIL: email, TAYCO_ADDITIONAL_ADMIN_PASSWORD: secondPassword };
  delete (env as Record<string, string | undefined>).TAYCO_ADDITIONAL_ADMIN_TENANT;
  const invoke = (childEnv: NodeJS.ProcessEnv) => spawnSync(process.execPath, ['--import', 'tsx', 'scripts/auth-admin.ts', 'add-admin'], { cwd: process.cwd(), env: childEnv, encoding: 'utf8', timeout: 30000 });
  const before = counts(file), missing = invoke(env);
  assert.equal(missing.status, 1); assert.deepEqual(counts(file), before);
  assert.match(missing.stderr, /TAYCO_ADDITIONAL_ADMIN_TENANT/);
  const result = invoke({ ...env, TAYCO_ADDITIONAL_ADMIN_TENANT: 'fixture-company' });
  assert.equal(result.status, 0, 'Private add-admin process succeeds.');
  assert.match(result.stdout, /Additional administrator created/);
  for (const output of [missing.stdout + missing.stderr, result.stdout + result.stderr]) {
    assert.ok(!output.includes(email)); assert.ok(!output.includes(secondPassword)); assert.ok(!output.includes(password)); assert.ok(!output.includes('scrypt$'));
  }
  assert.equal((await signIn(email, secondPassword)).actor.role, 'admin');
}));
