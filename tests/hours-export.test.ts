import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { acceptInvitation, createInvitation, provisionAdmin, sessionCookie, signIn, type Actor } from '../lib/auth';
import { database, execute } from '../lib/erp';
import { GET } from '../app/api/hours/export/route';

test('real export route authenticates, scopes suppliers and rejects client/cross-project access without external transport', async () => {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-hours-export-'));
  const keys = ['TAYCO_AUTH_DB_PATH', 'TAYCO_ERP_DB_PATH', 'TAYCO_APP_URL', 'TAYCO_SESSION_SECRET'] as const;
  const old = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  process.env.TAYCO_AUTH_DB_PATH = path.join(folder, 'auth.sqlite'); process.env.TAYCO_ERP_DB_PATH = path.join(folder, 'erp.sqlite'); process.env.TAYCO_APP_URL = 'https://tayco.test'; process.env.TAYCO_SESSION_SECRET = randomBytes(48).toString('hex');
  const previousFetch = globalThis.fetch; globalThis.fetch = async () => { throw new Error('No network permitted in this fixture.'); };
  const request = (cookie = '', query = '') => new NextRequest('https://tayco.test/api/hours/export' + query, { headers: cookie ? { cookie } : {} });
  try {
    const password = 'Local-hours-test-fixture-only-password!';
    await provisionAdmin('hours-admin@example.test', password);
    const login = await signIn('hours-admin@example.test', password), admin = login.actor, adminCookie = sessionCookie(login.cookie).split(';')[0];
    const project = execute(admin, randomUUID(), { action: 'create_project', name: 'Synthetic hours = project' });
    const otherProject = execute(admin, randomUUID(), { action: 'create_project', name: 'Other assigned project' });
    const otherTenant = execute({ ...admin, tenantId: 'another-company' }, randomUUID(), { action: 'create_project', name: 'Private other-company project' });
    async function account(role: 'vendor' | 'staff' | 'client', name: string, projects: string[]): Promise<{ actor: Actor; cookie: string }> {
      const invite = createInvitation(admin, { email: name + '@example.test', role, tenantId: admin.tenantId, projectIds: projects, ...(role === 'vendor' ? { vendorId: 'synthetic-' + name } : {}) });
      const accepted = await acceptInvitation(invite.token, name + '@example.test', password);
      const signed = await signIn(name + '@example.test', password); return { actor: signed.actor, cookie: sessionCookie(accepted.cookie).split(';')[0] };
    }
    const first = await account('vendor', 'first-supplier', [project.id]), second = await account('vendor', 'second-supplier', [project.id]), client = await account('client', 'hours-client', [project.id]), staff = await account('staff', 'hours-staff', []);
    const own = execute(first.actor, randomUUID(), { action: 'log_hours', projectId: project.id, date: '2026-10-19', hours: .1, trade: '=FORMULA()' });
    const theirs = execute(second.actor, randomUUID(), { action: 'log_hours', projectId: project.id, date: '2026-10-20', hours: 8, trade: 'Private other supplier trade' });
    execute(admin, randomUUID(), { action: 'log_hours', projectId: otherProject.id, date: '2026-10-21', hours: .2, trade: 'Other project trade' });
    execute({ ...admin, tenantId: 'another-company' }, randomUUID(), { action: 'log_hours', projectId: otherTenant.id, date: '2026-10-21', hours: 7, trade: 'Other company trade' });
    database().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify({ ...own.data, privatePayroll: 1000, response: 'Private supervisor details' }), own.id);
    assert.equal((await GET(request())).status, 401);
    assert.equal((await GET(request(client.cookie, '?format=json'))).status, 403);
    const supplierResponse = await GET(request(first.cookie, '?format=json&projectId=' + project.id)); assert.equal(supplierResponse.status, 200);
    assert.match(supplierResponse.headers.get('cache-control')!, /private.*no-store/); assert.equal(supplierResponse.headers.get('x-content-type-options'), 'nosniff');
    const supplier = await supplierResponse.json(); assert.equal(supplier.report.totals.exactHours, '0.1'); assert.deepEqual(supplier.report.rows.map((row: { id: string }) => row.id), [own.id]);
    assert.doesNotMatch(JSON.stringify(supplier), /privatePayroll|1000|Private supervisor details|Private other supplier|Other company/);
    assert.equal((await GET(request(first.cookie, '?projectId=' + otherProject.id))).status, 404);
    assert.equal((await GET(request(adminCookie, '?projectId=' + otherTenant.id))).status, 404);
    assert.equal((await GET(request(adminCookie, '?projectId=missing-project'))).status, 404);
    const all = await (await GET(request(adminCookie, '?format=json'))).json(); assert.equal(all.report.totals.exactHours, '8.3'); assert.ok(all.report.rows.some((row: { id: string }) => row.id === theirs.id));
    assert.equal((await GET(request(staff.cookie))).status, 200);
    const csvResponse = await GET(request(first.cookie, '?format=csv&from=2026-10-19&to=2026-10-19')); const csv = await csvResponse.text(); assert.equal(csvResponse.status, 200); assert.match(csvResponse.headers.get('content-disposition')!, /attachment/); assert.match(csv, /'\=FORMULA/); assert.match(csv, /"0.1"/); assert.doesNotMatch(csv, /other supplier|supervisor|Other company/);
    for (const query of ['?format=xml', '?from=2026-02-29', '?from=2026-10-20&to=2026-10-19', '?status=paid', '?status=approved&status=submitted', '?projectId=..%2F..%2Fx']) assert.equal((await GET(request(adminCookie, query))).status, 422, query);
  } finally {
    globalThis.fetch = previousFetch;
    database().close();
    for (const key of keys) { const value = old[key]; if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    rmSync(folder, { recursive: true, force: true });
  }
});
