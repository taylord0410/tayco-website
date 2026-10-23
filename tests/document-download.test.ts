import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from 'undici';
import { acceptInvitation, createInvitation, provisionAdmin, sessionCookie, signIn } from '../lib/auth';
import { database, documentForActor, execute, submitWebsite } from '../lib/erp';
import { POST as upload } from '../app/api/upload-doc/route';
import { GET as download } from '../app/api/documents/[id]/route';

test('private document HTTP happy path and cross-account denial with mocked provider bytes', async t => {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-document-download-'));
  const names = ['TAYCO_AUTH_DB_PATH', 'TAYCO_ERP_DB_PATH', 'TAYCO_APP_URL', 'TAYCO_SESSION_SECRET', 'BLOB_READ_WRITE_TOKEN', 'VERCEL_BLOB_API_URL', 'TAYCO_PUBLIC_TENANT_ID'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const previousDispatcher = getGlobalDispatcher(); const agent = new MockAgent(); agent.disableNetConnect(); setGlobalDispatcher(agent);
  Object.assign(process.env, { TAYCO_AUTH_DB_PATH: path.join(folder, 'auth.sqlite'), TAYCO_ERP_DB_PATH: path.join(folder, 'erp.sqlite'), TAYCO_APP_URL: 'https://tayco.test', TAYCO_SESSION_SECRET: randomBytes(48).toString('hex'), BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_fixture_fake-only', VERCEL_BLOB_API_URL: 'https://blob-fixture.test', TAYCO_PUBLIC_TENANT_ID: 'tayco_llc' });
  const bytes = Buffer.from('%PDF-1.7\nLocal fixture document bytes.\n');
  let opened = false; let putCalls = 0; let getCalls = 0; let storedPath = ''; let documentId = '';
  try {
    const password = 'Private-document-fixture-password-only!'; await provisionAdmin('admin@example.test', password);
    const admin = await signIn('admin@example.test', password);
    const project = execute(admin.actor, randomUUID(), { action: 'create_project', name: 'Shared fixture project' }); opened = true;
    const otherProject = execute(admin.actor, randomUUID(), { action: 'create_project', name: 'Other fixture project' });
    async function client(email: string, projectId: string) { const invite = createInvitation(admin.actor, { email, role: 'client', tenantId: admin.actor.tenantId, projectIds: [projectId] }); return (await acceptInvitation(invite.token, email, password)).cookie; }
    async function supplier(email: string) { const record = submitWebsite('vendor', { businessName: 'Private fixture supplier', email }, randomUUID()); const invite = createInvitation(admin.actor, { email, role: 'vendor', tenantId: admin.actor.tenantId, projectIds: [project.id], vendorId: record.id }); return (await acceptInvitation(invite.token, email, password)).cookie; }
    const ownerCookie = await supplier('owner@example.test'); const otherSupplierCookie = await supplier('other-supplier@example.test');
    const assignedClientCookie = await client('assigned-client@example.test', project.id); const otherClientCookie = await client('other-client@example.test', otherProject.id);
    const cookieHeader = (cookie: string) => sessionCookie(cookie).split(';')[0];
    const getDocument = (cookie: string) => download(new NextRequest(`https://tayco.test/api/documents/${documentId}`, { headers: cookie ? { cookie: cookieHeader(cookie) } : {} }), { params: Promise.resolve({ id: documentId }) });
    agent.get('https://blob-fixture.test').intercept({ path: /.*/, method: 'PUT' }).reply(200, options => {
      putCalls++; storedPath = new URL(String(options.path), 'https://blob-fixture.test').searchParams.get('pathname')!;
      return { url: `https://fixture.private.blob.vercel-storage.com/${storedPath}`, downloadUrl: `https://fixture.private.blob.vercel-storage.com/${storedPath}?download=1`, pathname: storedPath, contentType: 'application/pdf', contentDisposition: 'attachment', etag: 'fixture-etag' };
    }, { headers: { 'Content-Type': 'application/json' } });
    agent.get('https://fixture.private.blob.vercel-storage.com').intercept({ path: /.*/, method: 'GET' }).reply(200, () => { getCalls++; return bytes; }, { headers: { 'Content-Type': 'application/pdf', 'Content-Length': String(bytes.byteLength) } }).persist();
    await t.test('successful mocked upload registers a pending review receipt and removes its intent', async () => {
      const form = new FormData(); form.set('file', new File([bytes], 'fixture-document.pdf', { type: 'application/pdf' })); form.set('type', 'project'); form.set('projectId', project.id);
      const response = await upload(new NextRequest('https://tayco.test/api/upload-doc', { method: 'POST', headers: { origin: 'https://tayco.test', cookie: cookieHeader(ownerCookie) }, body: form }));
      assert.equal(response.status, 200); const data = await response.json(); documentId = data.documentId;
      assert.equal(data.success, true); assert.equal(data.status, 'pending_review'); assert.equal(typeof documentId, 'string'); assert.equal(data.blobPath, undefined); assert.equal(data.url, undefined); assert.equal(putCalls, 1);
      assert.equal(documentForActor(admin.actor, documentId).data.blobPath, storedPath); assert.equal(readdirSync(path.join(folder, 'upload-intents')).length, 0);
    });
    async function expectDownload(cookie: string) { const response = await getDocument(cookie); assert.equal(response.status, 200); assert.match(response.headers.get('Content-Disposition')!, /^attachment;/); assert.equal(response.headers.get('Content-Type'), 'application/octet-stream'); assert.match(response.headers.get('Cache-Control')!, /private.*no-store/); assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff'); assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes); }
    await t.test('owner receives the exact attachment bytes through the actual SDK get seam', async () => { await expectDownload(ownerCookie); assert.equal(getCalls, 1); });
    await t.test('unauthenticated and unshared clients cannot reach provider content', async () => {
      assert.equal((await getDocument('')).status, 401); assert.equal((await getDocument(assignedClientCookie)).status, 404); assert.equal((await getDocument(otherClientCookie)).status, 404); assert.equal((await getDocument(otherSupplierCookie)).status, 404); assert.equal(getCalls, 1);
    });
    await t.test('explicitly approved client-visible project document reaches the assigned client only', async () => {
      const entry = documentForActor(admin.actor, documentId);
      execute(admin.actor, randomUUID(), { action: 'review_document', id: documentId, version: entry.version, status: 'approved', response: 'Fixture review approval', visibility: 'client' });
      await expectDownload(assignedClientCookie); assert.equal(getCalls, 2);
      assert.equal((await getDocument(otherClientCookie)).status, 404); assert.equal((await getDocument(otherSupplierCookie)).status, 404); assert.equal(getCalls, 2);
    });
  } finally {
    if (opened) database().close(); for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    setGlobalDispatcher(previousDispatcher); await agent.close(); rmSync(folder, { recursive: true, force: true });
  }
});
