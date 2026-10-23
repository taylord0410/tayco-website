import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes } from 'node:crypto';
import { acceptInvitation, assertSameOrigin, AuthError, changePassword, createInvitation, getActor, provisionAdmin, requireActor, requireProject, requireRole, resetPasswordPrivately, revokeInvitation, revokeUserSessionsPrivately, sessionCookie, signIn, signOut } from '../lib/auth';

test('account lifecycle uses isolated SQLite fixtures and fails closed', async t => {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-auth-test-'));
  const previous = { db: process.env.TAYCO_AUTH_DB_PATH, secret: process.env.TAYCO_SESSION_SECRET, url: process.env.TAYCO_APP_URL };
  process.env.TAYCO_AUTH_DB_PATH = path.join(folder, 'auth.sqlite'); process.env.TAYCO_SESSION_SECRET = randomBytes(48).toString('hex'); process.env.TAYCO_APP_URL = 'https://tayco.test';
  const request = (cookie?: string) => new Request('https://tayco.test/api/erp-suite', { headers: cookie ? { cookie: sessionCookie(cookie).split(';')[0] } : {} });
  const password = 'Only-an-isolated-fixture-password!';
  const fails = (code: number) => (error: unknown) => error instanceof AuthError && error.status === code;
  try {
    const adminId = await provisionAdmin('admin@example.test', password);
    const adminLogin = await signIn('ADMIN@example.test', password);
    const admin = adminLogin.actor;
    await t.test('no public or legacy-code access and no second bootstrap', async () => {
      assert.equal(await getActor(request()), null);
      await assert.rejects(requireActor(request()), fails(401));
      assert.equal(await getActor(request('INV-TAYCO-MASTER')), null);
      await assert.rejects(provisionAdmin('second@example.test', password), fails(409));
      assert.equal((await requireActor(request(adminLogin.cookie))).id, adminId);
    });
    await t.test('generic credential errors, tampered cookie, password length and CSRF', async () => {
      await assert.rejects(signIn('missing@example.test', password), /Email or password is incorrect/);
      await assert.rejects(signIn('admin@example.test', 'incorrect'), /Email or password is incorrect/);
      const tampered = `${adminLogin.cookie.slice(0, 70)}${adminLogin.cookie[70] === 'A' ? 'B' : 'A'}${adminLogin.cookie.slice(71)}`;
      assert.equal(await getActor(request(tampered)), null);
      assert.throws(() => assertSameOrigin(new Request('https://tayco.test/api/auth/logout', { method: 'POST' })), fails(403));
      assert.throws(() => assertSameOrigin(new Request('https://tayco.test/api/auth/logout', { method: 'POST', headers: { origin: 'https://attacker.test' } })), fails(403));
      assert.doesNotThrow(() => assertSameOrigin(new Request('https://tayco.test/api/auth/logout', { method: 'POST', headers: { origin: 'https://tayco.test' } })));
      assert.match(sessionCookie('fixture'), /HttpOnly; SameSite=Lax/);
      assert.match(sessionCookie('', true), /Max-Age=0/);
    });
    const clientInvite = createInvitation(admin, { email: 'client@example.test', role: 'client', tenantId: admin.tenantId, projectIds: ['project-1'] });
    let clientCookie = '';
    await t.test('single-use invitation bound to email, with exact project scope', async () => {
      await assert.rejects(acceptInvitation(clientInvite.token, 'other@example.test', password), fails(400));
      await assert.rejects(acceptInvitation(clientInvite.token, 'client@example.test', 'short'), fails(400));
      clientCookie = (await acceptInvitation(clientInvite.token, 'client@example.test', password)).cookie;
      const actor = await requireActor(request(clientCookie));
      assert.equal(actor.role, 'client'); assert.deepEqual(actor.projectIds, ['project-1']);
      assert.doesNotThrow(() => requireProject(actor, 'project-1', admin.tenantId));
      assert.throws(() => requireProject(actor, 'project-2', admin.tenantId), fails(403));
      assert.throws(() => requireProject(actor, 'project-1', 'other-tenant'), fails(403));
      assert.throws(() => requireRole(actor, ['admin', 'staff']), fails(403));
      assert.throws(() => createInvitation(actor, { email: 'bad@example.test', role: 'staff', tenantId: admin.tenantId, projectIds: [] }), fails(403));
      await assert.rejects(acceptInvitation(clientInvite.token, 'client@example.test', password), fails(400));
    });
    await t.test('revoked, expired and invalid invitations never grant access', async () => {
      const revoked = createInvitation(admin, { email: 'revoked@example.test', role: 'client', tenantId: admin.tenantId, projectIds: [] }); revokeInvitation(admin, revoked.id);
      await assert.rejects(acceptInvitation(revoked.token, 'revoked@example.test', password), fails(400));
      const expired = createInvitation(admin, { email: 'expired@example.test', role: 'client', tenantId: admin.tenantId, projectIds: [] });
      const db = new DatabaseSync(process.env.TAYCO_AUTH_DB_PATH!); db.prepare('UPDATE auth_invites SET expires_at=0 WHERE id=?').run(expired.id); db.close();
      await assert.rejects(acceptInvitation(expired.token, 'expired@example.test', password), fails(400));
      await assert.rejects(acceptInvitation('legacy-master', 'x@example.test', password), fails(400));
      assert.throws(() => createInvitation(admin, { email: 'x@example.test', role: 'client', tenantId: 'other-tenant', projectIds: [] }), fails(403));
      assert.throws(() => createInvitation(admin, { email: 'x@example.test', role: 'vendor', tenantId: admin.tenantId, projectIds: [] }), fails(400));
    });
    await t.test('logout, session expiry and disabled accounts revoke server access', async () => {
      await signOut(request(clientCookie)); assert.equal(await getActor(request(clientCookie)), null);
      const login = await signIn('client@example.test', password);
      const db = new DatabaseSync(process.env.TAYCO_AUTH_DB_PATH!); db.prepare('UPDATE auth_sessions SET expires_at=0 WHERE user_id=?').run(login.actor.id); db.close();
      assert.equal(await getActor(request(login.cookie)), null);
      const another = await signIn('client@example.test', password); revokeUserSessionsPrivately('client@example.test', true);
      assert.equal(await getActor(request(another.cookie)), null);
      await assert.rejects(signIn('client@example.test', password), fails(401));
    });
    await t.test('password change and private recovery revoke all devices', async () => {
      const old = await signIn('admin@example.test', password);
      await changePassword(admin, password, `${password}-updated`);
      assert.equal(await getActor(request(old.cookie)), null); assert.equal(await getActor(request(adminLogin.cookie)), null);
      await resetPasswordPrivately('admin@example.test', `${password}-recovered`);
      assert.equal((await signIn('admin@example.test', `${password}-recovered`)).actor.id, adminId);
    });
    await t.test('persistent rate limiter and missing secret fail closed', async () => {
      for (let i = 0; i < 8; i++) await assert.rejects(signIn('limited@example.test', password), fails(401));
      await assert.rejects(signIn('limited@example.test', password), fails(429));
      delete process.env.TAYCO_SESSION_SECRET;
      await assert.rejects(signIn('admin@example.test', password), fails(503));
    });
  } finally { for (const [name, value] of Object.entries({ TAYCO_AUTH_DB_PATH: previous.db, TAYCO_SESSION_SECRET: previous.secret, TAYCO_APP_URL: previous.url })) { if (value === undefined) delete process.env[name]; else process.env[name] = value; } rmSync(folder, { recursive: true, force: true }); }
});
