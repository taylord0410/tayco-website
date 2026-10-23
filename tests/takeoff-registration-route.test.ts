import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { NextRequest } from 'next/server';
import { GET, HEAD, OPTIONS, POST } from '../app/api/takeoff-registration/route';
import { acceptInvitation, createInvitation, createSession, provisionAdmin, requireActor, sessionCookie } from '../lib/auth';
import { database } from '../lib/erp';

const digest = (raw: string) => createHash('sha256').update(raw).digest('hex');
const origin = 'https://tayco.test';

test('temporary administrator registration route uses persisted authentication and fixed, pinned source metadata', async t => {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-registration-route-'));
  const erpFile = path.join(folder, 'erp.sqlite');
  const authFile = path.join(folder, 'auth.sqlite');
  const manifestFile = path.join(folder, 'PRIVATE_MANIFEST.json');
  const relationsFile = path.join(folder, 'PRIVATE_RELATIONS.json');
  const mappingFile = path.join(folder, 'never-created-mapping.json');
  const env = {
    TAYCO_AUTH_DB_PATH: authFile, TAYCO_ERP_DB_PATH: erpFile,
    TAYCO_SESSION_SECRET: 'temporary-registration-fixture-secret-at-least-32-characters',
    TAYCO_APP_URL: origin, TAYCO_TAKEOFF_MANIFEST_PATH: manifestFile,
    TAYCO_TAKEOFF_RELATIONS_PATH: relationsFile, TAYCO_TAKEOFF_MAPPING_PATH: mappingFile,
    TAYCO_TAKEOFF_REGISTRATION_ENABLED: 'true',
  };
  const previous = Object.fromEntries(Object.keys(env).map(key => [key, process.env[key]]));
  Object.assign(process.env, env);
  const manifest = {
    schema_version: 'takeoff-viewer-bundle/v1', bundle_id: 'fixture-bundle',
    projects: [
      { key: 'ctx-a', display_name: 'Verified fixture project', identity_status: 'resolved', document_ids: ['doc-a'], metadata: { budgetUsd: 123456, contact: 'PRIVATE_CONTACT', location: 'PRIVATE_LOCATION' } },
      { key: 'ctx-u', display_name: 'Unresolved private project', identity_status: 'unresolved', document_ids: ['doc-u'] },
    ],
    documents: [
      { id: 'doc-a', project_key: 'ctx-a', title: 'Verified fixture plan', source_name: 'PRIVATE_SOURCE.pdf', source_sha256: 'c'.repeat(64), kind: 'drawing_pdf', asset_id: 'asset-a', page_count: 1 },
      { id: 'doc-u', project_key: 'ctx-u', title: 'Unresolved private plan', source_name: 'PRIVATE_UNRESOLVED.pdf', source_sha256: 'd'.repeat(64), kind: 'drawing_pdf', asset_id: 'asset-u', page_count: 1 },
    ],
    assets: [
      { id: 'asset-a', path: 'assets/PRIVATE_SOURCE.pdf', media_type: 'application/pdf', size_bytes: 12, sha256: 'c'.repeat(64) },
      { id: 'asset-u', path: 'assets/PRIVATE_UNRESOLVED.pdf', media_type: 'application/pdf', size_bytes: 12, sha256: 'd'.repeat(64) },
    ],
  };
  const rawManifest = JSON.stringify(manifest) + '\n';
  const relations = {
    schemaVersion: 'takeoff-viewer-relations/v1', bundleId: manifest.bundle_id,
    relationsId: 'relations-' + 'a'.repeat(64), manifestSha256: digest(rawManifest),
    contexts: [
      { contextKey: 'ctx-a', displayName: 'Verified fixture project', identityStatus: 'resolved', documentIds: ['doc-a'] },
      { contextKey: 'ctx-u', displayName: 'Unresolved private project', identityStatus: 'unresolved', documentIds: ['doc-u'] },
    ],
    documents: [
      { documentId: 'doc-a', contextKeys: ['ctx-a'], assetIds: ['asset-a'], kind: 'drawing_pdf' },
      { documentId: 'doc-u', contextKeys: ['ctx-u'], assetIds: ['asset-u'], kind: 'drawing_pdf' },
    ],
    assets: [{ assetId: 'asset-a', documentIds: ['doc-a'] }, { assetId: 'asset-u', documentIds: ['doc-u'] }],
  };
  const rawRelations = JSON.stringify(relations) + '\n';
  writeFileSync(manifestFile, rawManifest); writeFileSync(relationsFile, rawRelations);
  const input = {
    expectedBundleId: manifest.bundle_id, expectedRelationsId: relations.relationsId,
    expectedManifestSha256: digest(rawManifest), expectedRelationsSha256: digest(rawRelations),
    contextKey: 'ctx-a', viewerDocumentIds: ['doc-a'], visibility: 'owner', project: { mode: 'create' },
  };
  const request = (method: string, cookie?: string, body?: unknown, options: { origin?: string | null; contentType?: string; query?: string; raw?: string; site?: string } = {}) => {
    const headers: Record<string, string> = {};
    if (cookie) headers.cookie = cookie;
    if (options.origin !== null) headers.origin = options.origin ?? origin;
    if (options.site) headers['sec-fetch-site'] = options.site;
    if (body !== undefined || options.raw !== undefined) headers['content-type'] = options.contentType ?? 'application/json';
    return new NextRequest(`${origin}/api/takeoff-registration${options.query ?? ''}`, { method, headers, ...(body === undefined && options.raw === undefined ? {} : { body: options.raw ?? JSON.stringify(body) }) });
  };
  const privateResponse = (response: Response, status: number) => {
    assert.equal(response.status, status);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('vary'), 'Cookie');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  };
  const counts = () => ['records', 'audit', 'commands'].map(table => Number(database().prepare(`SELECT count(*) AS n FROM ${table}`).get()!.n));
  try {
    const adminId = await provisionAdmin('operator@example.test', 'Fixture password 123!', 'fixture-company');
    let adminCookie = sessionCookie(await createSession(adminId)).split(';')[0];
    const admin = await requireActor(request('GET', adminCookie));
    const cookies: Record<string, string> = {};
    for (const role of ['guest', 'staff'] as const) {
      const invitation = createInvitation(admin, { email: `${role}@example.test`, role, tenantId: admin.tenantId, projectIds: [] });
      cookies[role] = sessionCookie((await acceptInvitation(invitation.token, `${role}@example.test`, 'Fixture password 123!')).cookie).split(';')[0];
    }
    await t.test('flag is explicit and fails closed before authentication or reading sources', async () => {
      for (const flag of [undefined, 'false', 'TRUE']) {
        if (flag === undefined) delete process.env.TAYCO_TAKEOFF_REGISTRATION_ENABLED;
        else process.env.TAYCO_TAKEOFF_REGISTRATION_ENABLED = flag;
        for (const response of [await GET(request('GET')), await POST(request('POST', adminCookie, { mode: 'plan', input })), await OPTIONS(request('OPTIONS', adminCookie))]) privateResponse(response, 404);
      }
      assert.equal(existsSync(erpFile), false);
      process.env.TAYCO_TAKEOFF_REGISTRATION_ENABLED = 'true';
    });
    await t.test('anonymous, guest, staff and disabled persisted accounts cannot import', async () => {
      for (const [cookie, status] of [[undefined, 401], [cookies.guest, 403], [cookies.staff, 403]] as const) {
        privateResponse(await GET(request('GET', cookie)), status);
        privateResponse(await POST(request('POST', cookie, { mode: 'plan', input })), status);
      }
      const authDb = new DatabaseSync(authFile);
      try {
        authDb.prepare('UPDATE auth_users SET disabled=1 WHERE id=?').run(adminId);
        privateResponse(await GET(request('GET', adminCookie)), 401);
        privateResponse(await POST(request('POST', adminCookie, { mode: 'plan', input })), 401);
        authDb.prepare('UPDATE auth_users SET disabled=0 WHERE id=?').run(adminId);
      } finally { authDb.close(); }
      adminCookie = sessionCookie(await createSession(adminId)).split(';')[0];
      assert.equal(existsSync(erpFile), false);
    });
    await t.test('control summary exposes only raw pins and resolved labels and does not open ERP', async () => {
      const response = await GET(request('GET', adminCookie)); privateResponse(response, 200);
      assert.deepEqual(await response.json(), { success: true, source: {
        bundleId: manifest.bundle_id, relationsId: relations.relationsId,
        manifestSha256: digest(rawManifest), relationsSha256: digest(rawRelations),
        contexts: [{ contextKey: 'ctx-a', displayName: 'Verified fixture project', documents: [{ viewerDocumentId: 'doc-a', title: 'Verified fixture plan' }] }],
      } });
      assert.equal(existsSync(erpFile), false);
      privateResponse(await GET(request('GET', adminCookie, undefined, { query: '?manifestPath=private' })), 400);
      const head = await HEAD(request('HEAD', adminCookie)); privateResponse(head, 200); assert.equal(await head.text(), '');
      const options = await OPTIONS(request('OPTIONS', adminCookie)); privateResponse(options, 405); assert.equal(options.headers.get('allow'), 'GET, POST, HEAD');
    });
    await t.test('POST validates origin and bounded JSON before planning', async () => {
      for (const options of [{ origin: 'https://attacker.test' }, { origin: null }, { site: 'cross-site' }]) privateResponse(await POST(request('POST', adminCookie, { mode: 'plan', input }, options)), 403);
      assert.equal(existsSync(erpFile), false);
      privateResponse(await POST(request('POST', adminCookie, undefined, { raw: '{broken' })), 400);
      privateResponse(await POST(request('POST', adminCookie, {}, { contentType: 'text/plain' })), 415);
      privateResponse(await POST(request('POST', adminCookie, { padding: 'x'.repeat(10_001) })), 413);
      for (const body of [{ mode: 'other', input }, { mode: 'plan', input, manifestPath: manifestFile }, { mode: 'plan', input: { ...input, upstreamUrl: 'https://attacker.test' } }, { mode: 'plan', input: { ...input, expectedManifestSha256: undefined } }, { mode: 'commit', input, key: 'fixture-key', expectedPlanHash: 4 }]) privateResponse(await POST(request('POST', adminCookie, body)), 422);
      assert.equal(existsSync(erpFile), false);
    });
    let planHash = '';
    await t.test('planning creates no business records, audit events or receipts', async () => {
      const response = await POST(request('POST', adminCookie, { mode: 'plan', input })); privateResponse(response, 200);
      const result = await response.json(); assert.equal(result.success, true); planHash = result.plan.planHash;
      assert.match(planHash, /^[a-f0-9]{64}$/); assert.deepEqual(counts(), [0, 0, 0]);
      const conflict = await POST(request('POST', adminCookie, { mode: 'commit', input, key: 'fixture-import-001', expectedPlanHash: '0'.repeat(64) })); privateResponse(conflict, 409); assert.deepEqual(counts(), [0, 0, 0]);
    });
    await t.test('commit is atomic, replayable and does not create grants or read source files', async () => {
      const body = { mode: 'commit', input, key: 'fixture-import-001', expectedPlanHash: planHash };
      const response = await POST(request('POST', adminCookie, body)); privateResponse(response, 200); const result = await response.json();
      assert.equal(result.result.projectCreated, true); assert.deepEqual(counts(), [2, 2, 1]);
      const replay = await POST(request('POST', adminCookie, body)); privateResponse(replay, 200); assert.deepEqual(await replay.json(), result); assert.deepEqual(counts(), [2, 2, 1]);
      const noOp = await POST(request('POST', adminCookie, { ...body, key: 'fixture-import-002' })); privateResponse(noOp, 200); assert.deepEqual(counts(), [2, 2, 2]);
      privateResponse(await POST(request('POST', adminCookie, { ...body, input: { ...input, visibility: 'client' } })), 409); assert.deepEqual(counts(), [2, 2, 2]);
      assert.equal(existsSync(mappingFile), false); assert.equal(existsSync(path.join(folder, 'assets')), false);
      assert.equal(readFileSync(manifestFile, 'utf8'), rawManifest); assert.equal(readFileSync(relationsFile, 'utf8'), rawRelations);
      const documents = database().prepare("SELECT payload FROM records WHERE kind='document'").all();
      assert.equal(documents.length, 1); const payload = JSON.parse(String(documents[0].payload));
      assert.equal(payload.storage, 'takeoff_viewer'); assert.equal(payload.type, 'project'); assert.equal(Object.hasOwn(payload, 'blobPath'), false);
    });
    await t.test('source failures are generic and feature can be disabled for the same session', async () => {
      writeFileSync(relationsFile, 'PRIVATE_CORRUPT_SOURCE_WITH_PATH');
      const response = await GET(request('GET', adminCookie)); privateResponse(response, 503);
      const error = await response.text(); for (const secret of [folder, 'PRIVATE_CORRUPT', 'PRIVATE_CONTACT', 'PRIVATE_SOURCE']) assert.equal(error.includes(secret), false);
      assert.deepEqual(counts(), [2, 2, 2]);
      process.env.TAYCO_TAKEOFF_REGISTRATION_ENABLED = 'false';
      privateResponse(await GET(request('GET', adminCookie)), 404);
      privateResponse(await POST(request('POST', adminCookie, { mode: 'plan', input })), 404);
    });
  } finally {
    if (existsSync(erpFile)) database().close();
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    rmSync(folder, { recursive: true, force: true });
  }
});
