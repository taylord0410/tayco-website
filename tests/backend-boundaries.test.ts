import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { NextRequest } from 'next/server';
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from 'undici';
import { acceptInvitation, createInvitation, provisionAdmin, sessionCookie, signIn } from '../lib/auth';
import { database, execute, registerDocument, submitWebsite, ErpError } from '../lib/erp';
import { processNotifications } from '../lib/notifications';
import { POST as upload } from '../app/api/upload-doc/route';
import { POST as estimate } from '../app/api/estimate/route';

test('backend boundaries use local fixtures and a network-disabled Blob dispatcher', async t => {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-boundaries-'));
  const names = ['TAYCO_AUTH_DB_PATH', 'TAYCO_ERP_DB_PATH', 'TAYCO_APP_URL', 'TAYCO_SESSION_SECRET', 'BLOB_READ_WRITE_TOKEN', 'VERCEL_BLOB_API_URL', 'TAYCO_PUBLIC_TENANT_ID', 'RESEND_API_KEY', 'TAYCO_NOTIFY_EMAIL', 'TAYCO_EMAIL_FROM'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const previousDispatcher = getGlobalDispatcher(); const agent = new MockAgent(); agent.disableNetConnect(); setGlobalDispatcher(agent);
  Object.assign(process.env, { TAYCO_AUTH_DB_PATH: path.join(folder, 'auth.sqlite'), TAYCO_ERP_DB_PATH: path.join(folder, 'erp.sqlite'), TAYCO_APP_URL: 'https://tayco.test', TAYCO_SESSION_SECRET: randomBytes(48).toString('hex'), BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_fixture_fake-only', VERCEL_BLOB_API_URL: 'https://blob-fixture.test', TAYCO_PUBLIC_TENANT_ID: 'tayco_llc', RESEND_API_KEY: 'fixture-only-no-real-key', TAYCO_NOTIFY_EMAIL: 'fixture@example.test', TAYCO_EMAIL_FROM: 'fixture@example.test' });
  const requestCookie = (cookie: string) => sessionCookie(cookie).split(';')[0];
  const publicRequest = (body: unknown, extra: Record<string, string> = {}) => new NextRequest('https://tayco.test/api/estimate', { method: 'POST', headers: { origin: 'https://tayco.test', 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID(), ...extra }, body: JSON.stringify(body) });
  let opened = false;
  try {
    const password = 'Boundary-test-only-fixture-password!'; await provisionAdmin('admin@example.test', password);
    const admin = await signIn('admin@example.test', password);
    const project = execute(admin.actor, randomUUID(), { action: 'create_project', name: 'Assigned fixture' }); opened = true;
    const otherProject = execute(admin.actor, randomUUID(), { action: 'create_project', name: 'Unassigned fixture' });
    const supplier = submitWebsite('vendor', { businessName: 'Fixture supplier', email: 'vendor@example.test' }, randomUUID());
    const invitation = createInvitation(admin.actor, { email: 'vendor@example.test', role: 'vendor', tenantId: admin.actor.tenantId, projectIds: [project.id], vendorId: supplier.id });
    const supplierCookie = (await acceptInvitation(invitation.token, 'vendor@example.test', password)).cookie;
    const journalDir = path.join(folder, 'upload-intents');
    const formRequest = (projectId: string, cookie = supplierCookie) => {
      const form = new FormData(); form.set('file', new File(['%PDF-1.7\nfixture'], 'fixture.pdf', { type: 'application/pdf' })); form.set('type', 'project'); form.set('projectId', projectId);
      return new NextRequest('https://tayco.test/api/upload-doc', { method: 'POST', headers: { origin: 'https://tayco.test', ...(cookie ? { cookie: requestCookie(cookie) } : {}) }, body: form });
    };
    await t.test('unauthenticated and unassigned uploads stop before Blob or intent creation', async () => {
      assert.equal((await upload(formRequest(project.id, ''))).status, 401);
      assert.equal((await upload(formRequest(otherProject.id))).status, 404);
      assert.equal(readdirSync(folder).includes('upload-intents'), false);
    });
    await t.test('multipart without a content length is bounded before parsing', async () => {
      let cancelled = false; let produced = 0;
      const body = new ReadableStream<Uint8Array>({ pull(controller) { produced++; controller.enqueue(new Uint8Array(128 * 1024)); if (produced === 200) controller.close(); }, cancel() { cancelled = true; } });
      const init = { method: 'POST', headers: { origin: 'https://tayco.test', cookie: requestCookie(supplierCookie), 'Content-Type': 'multipart/form-data; boundary=fixture' }, body, duplex: 'half' as const };
      const response = await upload(new NextRequest('https://tayco.test/api/upload-doc', init));
      assert.equal(response.status, 413); assert.equal(cancelled, true); assert.ok(produced < 200);
    });
    await t.test('mock provider rejection retains a private deferred intent and confirms no receipt', async () => {
      let putCalls = 0;
      agent.get('https://blob-fixture.test').intercept({ path: /.*/, method: 'PUT' }).reply(403, () => { putCalls++; return { error: { code: 'forbidden', message: 'Fixture provider rejection' } }; }, { headers: { 'Content-Type': 'application/json' } });
      const response = await upload(formRequest(project.id)); assert.equal(response.status, 503); assert.equal(putCalls, 1);
      const files = readdirSync(journalDir); assert.equal(files.length, 1); const intent = JSON.parse(readFileSync(path.join(journalDir, files[0]), 'utf8'));
      assert.match(intent.blobPath, /^vendor-docs\/project-/); assert.equal(Number.isFinite(Date.parse(intent.createdAt)), true);
      assert.equal((database().prepare("SELECT count(*) AS count FROM records WHERE kind='document'").get() as { count: number }).count, 0);
    });
    await t.test('dry-run reconciliation preserves registered blobs and defers recent unknown results', () => {
      mkdirSync(journalDir, { recursive: true });
      const registeredPath = `vendor-docs/project-${randomUUID()}.pdf`;
      registerDocument(admin.actor, { blobPath: registeredPath, name: 'Fixture', contentType: 'application/pdf', type: 'project', projectId: project.id });
      writeFileSync(path.join(journalDir, `${randomUUID()}.json`), JSON.stringify({ blobPath: registeredPath, createdAt: '2000-01-01T00:00:00.000Z' }));
      writeFileSync(path.join(journalDir, `${randomUUID()}.json`), JSON.stringify({ blobPath: `vendor-docs/project-${randomUUID()}.pdf`, createdAt: new Date(Date.now() - 25 * 3600_000).toISOString() }));
      const output = execFileSync(process.execPath, ['--import', 'tsx', 'scripts/reconcile-uploads.ts'], { cwd: process.cwd(), env: process.env, encoding: 'utf8' });
      const result = JSON.parse(output.trim()); assert.equal(result.dryRun, true); assert.equal(result.registered, 1); assert.equal(result.orphaned, 1); assert.equal(result.deferred, 1); assert.equal(result.cleaned, 0); assert.equal(readdirSync(journalDir).length, 3);
    });
    const valid = { fullName: 'Fixture contact', phone: 'fixture phone', email: 'limited@example.test', projectType: 'Commercial', projectDetails: 'Fixture details' };
    await t.test('public allowlist and persistent normalized email limit resist spoofed forwarding headers', async () => {
      assert.equal((await estimate(publicRequest({ ...valid, w9Status: 'VERIFIED' }))).status, 422);
      for (let i = 0; i < 5; i++) assert.equal((await estimate(publicRequest({ ...valid, email: i % 2 ? 'LIMITED@example.test' : valid.email }, { 'x-forwarded-for': `192.0.2.${i}` }))).status, 201);
      assert.equal((await estimate(publicRequest(valid, { 'x-forwarded-for': '198.51.100.99' }))).status, 429);
      const independent = new DatabaseSync(process.env.TAYCO_ERP_DB_PATH!);
      try { const row = independent.prepare('SELECT count,until_ms FROM public_rate WHERE key=?').get(`email:${valid.email}`) as { count: number; until_ms: number }; assert.equal(row.count, 5); assert.ok(row.until_ms > Date.now()); } finally { independent.close(); }
    });
    await t.test('public global limit is shared across different emails', async () => {
      database().prepare('DELETE FROM public_rate').run();
      for (let i = 0; i < 100; i++) assert.equal((await estimate(publicRequest({ ...valid, email: `global-${i}@example.test` }))).status, 201);
      assert.equal((await estimate(publicRequest({ ...valid, email: 'global-overflow@example.test' }))).status, 429);
      assert.equal((database().prepare("SELECT count FROM public_rate WHERE key='global'").get() as { count: number }).count, 100);
    });
    await t.test('calendar dates reject nonexistent days before saving hours, invoices or document reviews', () => {
      const invalid = (error: unknown) => error instanceof ErpError && error.status === 422;
      for (const date of ['2026-99-99', '2026-02-29', 'not-a-date']) assert.throws(() => execute(admin.actor, randomUUID(), { action: 'log_hours', projectId: project.id, date, hours: 1, trade: 'Fixture trade' }), invalid);
      const leapDay = execute(admin.actor, randomUUID(), { action: 'log_hours', projectId: project.id, date: '2028-02-29', hours: 1, trade: 'Fixture trade' }); assert.equal(leapDay.data.date, '2028-02-29');
      assert.throws(() => execute(admin.actor, randomUUID(), { action: 'record_invoice', projectId: project.id, reference: 'Fixture invoice', amountUsd: 10, dueDate: '2026-04-31' }), invalid);
      const doc = registerDocument(admin.actor, { blobPath: `vendor-docs/project-${randomUUID()}.pdf`, name: 'Fixture date review', type: 'project', contentType: 'application/pdf', projectId: project.id });
      assert.throws(() => execute(admin.actor, randomUUID(), { action: 'review_document', id: doc.id, version: doc.version, status: 'approved', response: 'Fixture review', expiresAt: '2026-02-30' }), invalid);
    });
    await t.test('notification completion cannot overwrite a newer reclaimed lease', async () => {
      database().prepare('DELETE FROM outbox').run();
      submitWebsite('estimate', valid, randomUUID());
      let resolveFirst!: (response: Response) => void; const firstTransport = (() => new Promise<Response>(resolve => { resolveFirst = resolve; })) as typeof fetch;
      const first = processNotifications(admin.actor, firstTransport);
      const job = database().prepare('SELECT id FROM outbox').get() as { id: string };
      database().prepare("UPDATE outbox SET next_attempt_at='2000-01-01T00:00:00.000Z' WHERE id=?").run(job.id);
      const second = await processNotifications(admin.actor, (async () => Response.json({ id: 'fixture-provider-id' })) as typeof fetch); assert.equal(second.delivered, 1);
      resolveFirst(new Response(null, { status: 403 })); await first;
      const final = database().prepare('SELECT status,attempts FROM outbox WHERE id=?').get(job.id) as { status: string; attempts: number }; assert.equal(final.status, 'delivered'); assert.equal(final.attempts, 2);
    });
    await t.test('malformed and future notification timestamps are quarantined before delivery', async () => {
      for (const createdAt of ['not-an-iso-date', new Date(Date.now() + 48 * 3600_000).toISOString(), new Date(Date.now() - 24 * 3600_000).toISOString()]) {
        database().prepare('DELETE FROM outbox').run(); submitWebsite('estimate', valid, randomUUID());
        database().prepare('UPDATE outbox SET created_at=?').run(createdAt);
        let calls = 0; await processNotifications(admin.actor, (async () => { calls++; return Response.json({ id: 'fixture' }); }) as typeof fetch);
        assert.equal(calls, 0); assert.equal((database().prepare('SELECT status FROM outbox').get() as { status: string }).status, 'needs_attention');
      }
    });
  } finally {
    if (opened) database().close(); for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    setGlobalDispatcher(previousDispatcher); await agent.close(); rmSync(folder, { recursive: true, force: true });
  }
});
