import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { provisionAdmin, signIn, sessionCookie } from '../lib/auth';
import { database, execute } from '../lib/erp';
import { POST as login } from '../app/api/auth/login/route';
import { POST as logout } from '../app/api/auth/logout/route';
import { GET as session } from '../app/api/auth/session/route';
import { POST as invite, GET as invitations } from '../app/api/auth/invitations/route';
import { POST as accept } from '../app/api/auth/accept-invite/route';

test('HTTP boundary: authentication, CSRF, assignment validation and cookie lifecycle', async () => {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-auth-http-'));
  const old = { TAYCO_AUTH_DB_PATH: process.env.TAYCO_AUTH_DB_PATH, TAYCO_ERP_DB_PATH: process.env.TAYCO_ERP_DB_PATH, TAYCO_APP_URL: process.env.TAYCO_APP_URL, TAYCO_SESSION_SECRET: process.env.TAYCO_SESSION_SECRET };
  process.env.TAYCO_AUTH_DB_PATH = path.join(folder, 'auth.sqlite'); process.env.TAYCO_ERP_DB_PATH = path.join(folder, 'erp.sqlite'); process.env.TAYCO_APP_URL = 'https://tayco.test'; process.env.TAYCO_SESSION_SECRET = randomBytes(48).toString('hex');
  let dbOpened = false;
  const req = (url: string, body?: unknown, cookie = '', origin = 'https://tayco.test') => new Request(`https://tayco.test/api/auth/${url}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', origin, ...(cookie ? { cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  try {
    const password = 'Isolated-HTTP-fixture-password-only!';
    await provisionAdmin('operator@example.test', password);
    assert.equal((await session(req('session'))).status, 401);
    assert.equal((await login(req('login', { email: 'operator@example.test', password }, '', 'https://attacker.test'))).status, 403);
    const response = await login(req('login', { email: 'operator@example.test', password })); assert.equal(response.status, 200); assert.match(response.headers.get('cache-control')!, /no-store/);
    const adminCookie = response.headers.get('set-cookie')!.split(';')[0]; assert.match(response.headers.get('set-cookie')!, /HttpOnly/);
    const admin = (await signIn('operator@example.test', password)).actor;
    const project = execute(admin, randomUUID(), { action: 'create_project', name: 'Fixture project', location: '' }); dbOpened = true;
    const other = execute({ ...admin, tenantId: 'other-company' }, randomUUID(), { action: 'create_project', name: 'Other fixture project', location: '' });
    const body = { email: 'client@example.test', role: 'client', projectIds: [project.id] };
    assert.equal((await invite(req('invitations', body))).status, 401);
    assert.equal((await invite(req('invitations', { ...body, projectIds: [other.id] }, adminCookie))).status, 404);
    assert.equal((await invite(req('invitations', { ...body, projectIds: ['missing-project'] }, adminCookie))).status, 404);
    const created = await invite(req('invitations', body, adminCookie)); assert.equal(created.status, 201);
    const token = (await created.json()).invitation.token;
    const listing = await (await invitations(req('invitations', undefined, adminCookie))).json(); assert.equal(listing.invitations.length, 1); assert.equal(listing.invitations[0].token, undefined); assert.equal(listing.invitations[0].token_hash, undefined);
    const accepted = await accept(req('accept-invite', { token, email: body.email, password })); assert.equal(accepted.status, 200);
    const clientCookie = accepted.headers.get('set-cookie')!.split(';')[0];
    assert.equal((await invitations(req('invitations', undefined, clientCookie))).status, 403);
    assert.equal((await invite(req('invitations', body, clientCookie))).status, 403);
    const current = await session(req('session', undefined, clientCookie)); assert.equal(current.status, 200); assert.deepEqual((await current.json()).actor.projectIds, [project.id]);
    const signedOut = await logout(req('logout', {}, clientCookie)); assert.equal(signedOut.status, 200); assert.match(signedOut.headers.get('set-cookie')!, /Max-Age=0/);
    assert.equal((await session(req('session', undefined, clientCookie))).status, 401);
    assert.match(sessionCookie('value'), /Path=\//);
  } finally {
    if (dbOpened) database().close();
    for (const [key, value] of Object.entries(old)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    rmSync(folder, { recursive: true, force: true });
  }
});
