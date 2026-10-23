import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Actor } from '../lib/auth';
import { database } from '../lib/erp';
import { VIEWER_PREFIX, TakeoffViewerAccessError, viewerScope, type ViewerRelations } from '../lib/takeoff-viewer-access';

const admin: Actor = { id: 'fixture-admin', email: 'admin@example.test', role: 'admin', tenantId: 'company-a', projectIds: [] };
const staff: Actor = { ...admin, id: 'fixture-staff', role: 'staff' };
const client: Actor = { ...admin, id: 'fixture-client', role: 'client', projectIds: ['project-a'] };
const vendor: Actor = { ...admin, id: 'fixture-vendor', role: 'vendor', projectIds: ['project-a'], vendorId: 'vendor-a' };
const other: Actor = { ...admin, tenantId: 'company-b' };
const fails = (status: number) => (error: unknown) => error instanceof TakeoffViewerAccessError && error.status === status;
const digest = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');

function relationsFixture(): ViewerRelations {
  return {
    schemaVersion: 'takeoff-viewer-relations/v1', bundleId: 'fixture-bundle', relationsId: 'relations-' + 'a'.repeat(64), manifestSha256: 'b'.repeat(64),
    contexts: [
      { contextKey: 'ctx-a', displayName: 'Company A fixture', identityStatus: 'resolved', documentIds: ['viewer-client', 'viewer-internal', 'viewer-vendor', 'viewer-client-owner'] },
      { contextKey: 'ctx-b', displayName: 'Company B fixture', identityStatus: 'resolved', documentIds: ['viewer-b'] },
      { contextKey: 'ctx-unresolved', displayName: 'Unknown fixture identity', identityStatus: 'unresolved', documentIds: ['viewer-unresolved'] },
    ],
    documents: [
      { documentId: 'viewer-client', contextKeys: ['ctx-a'], assetIds: ['asset-client', 'asset-shared'], kind: 'drawing_pdf' },
      { documentId: 'viewer-internal', contextKeys: ['ctx-a'], assetIds: ['asset-shared'], kind: 'drawing_pdf' },
      { documentId: 'viewer-vendor', contextKeys: ['ctx-a'], assetIds: ['asset-vendor'], kind: 'drawing_pdf' },
      { documentId: 'viewer-client-owner', contextKeys: ['ctx-a'], assetIds: ['asset-owner'], kind: 'reference' },
      { documentId: 'viewer-b', contextKeys: ['ctx-b'], assetIds: ['asset-b'], kind: 'drawing_pdf' },
      { documentId: 'viewer-unresolved', contextKeys: ['ctx-unresolved'], assetIds: ['asset-unresolved'], kind: 'drawing_pdf' },
    ],
    assets: [
      { assetId: 'asset-client', documentIds: ['viewer-client'] }, { assetId: 'asset-shared', documentIds: ['viewer-client', 'viewer-internal'] },
      { assetId: 'asset-vendor', documentIds: ['viewer-vendor'] }, { assetId: 'asset-owner', documentIds: ['viewer-client-owner'] },
      { assetId: 'asset-b', documentIds: ['viewer-b'] }, { assetId: 'asset-unresolved', documentIds: ['viewer-unresolved'] },
    ],
  };
}
function mappingFixture() {
  return { schemaVersion: 'tayco-takeoff-viewer-access/v1', bundleId: 'fixture-bundle', relationsSha256: '', mappings: [
    { tenantId: 'company-a', projectId: 'project-a', contextKey: 'ctx-a', documents: [
      { viewerDocumentId: 'viewer-client', erpDocumentId: 'erp-client' }, { viewerDocumentId: 'viewer-internal', erpDocumentId: 'erp-internal' },
      { viewerDocumentId: 'viewer-vendor', erpDocumentId: 'erp-vendor' }, { viewerDocumentId: 'viewer-client-owner', erpDocumentId: 'erp-client-owner' },
    ] },
    { tenantId: 'company-b', projectId: 'project-b', contextKey: 'ctx-b', documents: [{ viewerDocumentId: 'viewer-b', erpDocumentId: 'erp-b' }] },
  ] };
}

function fixture(run: (f: ReturnType<typeof createFixture>) => void, seed = true) {
  const f = createFixture();
  try { if (seed) f.seed(); run(f); }
  finally { f.cleanup(); }
}
function createFixture() {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-takeoff-access-'));
  const erpFile = path.join(folder, 'erp.sqlite'), authFile = path.join(folder, 'auth.sqlite');
  const relationsFile = path.join(folder, 'relations.json'), mappingFile = path.join(folder, 'mapping.json');
  const previous = { erp: process.env.TAYCO_ERP_DB_PATH, auth: process.env.TAYCO_AUTH_DB_PATH, relations: process.env.TAYCO_TAKEOFF_RELATIONS_PATH, mapping: process.env.TAYCO_TAKEOFF_MAPPING_PATH };
  process.env.TAYCO_ERP_DB_PATH = erpFile; process.env.TAYCO_AUTH_DB_PATH = authFile;
  process.env.TAYCO_TAKEOFF_RELATIONS_PATH = relationsFile; process.env.TAYCO_TAKEOFF_MAPPING_PATH = mappingFile;
  const relations = relationsFixture();
  const publish = (value: unknown = relations, mapping: unknown = mappingFixture()) => {
    const bytes = JSON.stringify(value) + '\n';
    writeFileSync(relationsFile, bytes);
    const configured = { ...(mapping as ReturnType<typeof mappingFixture>), relationsSha256: digest(bytes) };
    writeFileSync(mappingFile, JSON.stringify(configured)); return configured;
  };
  publish();
  const put = (id: string, kind: 'project' | 'document', tenant: string, project: string, owner: string, data: Record<string, unknown> = {}) => {
    const at = '2026-10-23T00:00:00.000Z';
    database().prepare('INSERT INTO records VALUES(?,?,?,?,?,?,1,?,?)').run(id, kind, tenant, project, owner, JSON.stringify(data), at, at);
  };
  const data = (id: string, next: Record<string, unknown>) => database().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify(next), id);
  return { folder, erpFile, authFile, relationsFile, mappingFile, relations, publish, put, data,
    seed() {
      put('project-a', 'project', 'company-a', 'project-a', admin.id, { name: 'Private ERP project A' });
      put('project-a2', 'project', 'company-a', 'project-a2', admin.id);
      put('project-b', 'project', 'company-b', 'project-b', admin.id);
      put('erp-client', 'document', 'company-a', 'project-a', staff.id, { visibility: 'client', blobPath: '/fixture/private/client.pdf' });
      put('erp-internal', 'document', 'company-a', 'project-a', staff.id, { visibility: 'internal' });
      put('erp-vendor', 'document', 'company-a', 'project-a', vendor.id, { visibility: 'internal' });
      put('erp-client-owner', 'document', 'company-a', 'project-a', client.id, { visibility: 'internal' });
      put('erp-b', 'document', 'company-b', 'project-b', staff.id, { visibility: 'client' });
    },
    cleanup() {
      if (existsSync(erpFile)) database().close();
      for (const [key, value] of Object.entries({ TAYCO_ERP_DB_PATH: previous.erp, TAYCO_AUTH_DB_PATH: previous.auth, TAYCO_TAKEOFF_RELATIONS_PATH: previous.relations, TAYCO_TAKEOFF_MAPPING_PATH: previous.mapping })) {
        if (value === undefined) delete process.env[key]; else process.env[key] = value;
      }
      rmSync(folder, { recursive: true, force: true });
    },
  };
}

test('guest and invalid actors are denied before policy and ERP access', () => fixture(f => {
  writeFileSync(f.mappingFile, 'invalid secret fixture config');
  for (const role of ['guest', 'unknown', '', 'ADMIN']) assert.throws(() => viewerScope({ ...admin, role, projectIds: ['project-a', 'project-b'] } as Actor), fails(403));
  for (const actor of [{ ...client, projectIds: ['../bad'] }, { ...client, projectIds: ['project-a', 'project-a'] }, { ...admin, tenantId: '' }, null])
    assert.throws(() => viewerScope(actor as Actor), fails(403));
  assert.equal(existsSync(f.erpFile), false); assert.equal(existsSync(f.authFile), false);
}, false));

test('missing, unreadable and oversized config fail generically before database access', () => fixture(f => {
  delete process.env.TAYCO_TAKEOFF_MAPPING_PATH;
  assert.throws(() => viewerScope(admin), fails(503));
  process.env.TAYCO_TAKEOFF_MAPPING_PATH = path.join(f.folder, 'not-there.json');
  assert.throws(() => viewerScope(admin), fails(503));
  process.env.TAYCO_TAKEOFF_MAPPING_PATH = f.folder;
  assert.throws(() => viewerScope(admin), fails(503));
  process.env.TAYCO_TAKEOFF_MAPPING_PATH = f.mappingFile;
  writeFileSync(f.mappingFile, 'x'.repeat(1024 * 1024 + 1));
  assert.throws(() => viewerScope(admin), fails(503));
  f.publish(); writeFileSync(f.relationsFile, 'x'.repeat(5 * 1024 * 1024 + 1));
  assert.throws(() => viewerScope(admin), fails(503));
  assert.equal(existsSync(f.erpFile), false); assert.equal(existsSync(f.authFile), false);
}, false));

test('internal scope is explicit, company-scoped and contains only plain permitted identifiers', () => fixture(f => {
  assert.equal(VIEWER_PREFIX, '/api/takeoff-viewer');
  const result = viewerScope(admin);
  assert.deepEqual(result, viewerScope(staff, 'project-a'));
  assert.deepEqual(result.documentIds, ['viewer-client', 'viewer-client-owner', 'viewer-internal', 'viewer-vendor']);
  assert.deepEqual(result.contexts, [{ key: 'ctx-a', documentIds: result.documentIds }]);
  assert.deepEqual(result.assetIds, ['asset-client', 'asset-owner', 'asset-shared', 'asset-vendor']);
  assert.deepEqual(Object.keys(result).sort(), ['bundleId', 'relationsId', 'manifestSha256', 'contexts', 'documentIds', 'assetIds', 'documents'].sort());
  assert.equal(Object.getPrototypeOf(result), Object.prototype); assert.equal(Object.getPrototypeOf(result.contexts[0]), Object.prototype);
  const serialized = JSON.stringify(result);
  for (const forbidden of [f.folder, 'blobPath', 'Private ERP', 'Company A fixture', 'ctx-b', 'viewer-b', 'ctx-unresolved', 'erp-client']) assert.ok(!serialized.includes(forbidden), forbidden);
  assert.deepEqual(viewerScope(other).documentIds, ['viewer-b']);
  for (const project of ['project-a2', 'project-b', 'missing-project', '../project-a', '']) assert.throws(() => viewerScope(admin, project), fails(404));
}));

test('client scope requires existing assigned project and explicit client visibility', () => fixture(() => {
  const result = viewerScope(client);
  assert.deepEqual(result.documentIds, ['viewer-client']);
  assert.deepEqual(result.contexts, [{ key: 'ctx-a', documentIds: ['viewer-client'] }]);
  assert.deepEqual(result.documents, [{ id: 'viewer-client', contextKey: 'ctx-a', assetIds: ['asset-client', 'asset-shared'] }]);
  assert.deepEqual(result.assetIds, ['asset-client', 'asset-shared']);
  assert.ok(!result.documentIds.includes('viewer-client-owner'), 'owning an internal ERP document does not bypass client visibility');
  assert.throws(() => viewerScope({ ...client, projectIds: [] }), fails(404));
  assert.throws(() => viewerScope({ ...client, projectIds: ['project-b'] }), fails(404));
  assert.throws(() => viewerScope({ ...client, tenantId: 'company-b', projectIds: ['project-a'] }), fails(404));
}));

test('vendor scope requires ownership and a current assigned existing project', () => fixture(f => {
  assert.deepEqual(viewerScope(vendor).documentIds, ['viewer-vendor']);
  assert.deepEqual(viewerScope(vendor).assetIds, ['asset-vendor']);
  assert.throws(() => viewerScope({ ...vendor, id: 'other-vendor' }), fails(404));
  assert.throws(() => viewerScope({ ...vendor, projectIds: [] }), fails(404));
  database().prepare('DELETE FROM records WHERE id=?').run('project-a');
  assert.throws(() => viewerScope(vendor), fails(404));
  assert.throws(() => viewerScope(admin), fails(404));
  assert.ok(existsSync(f.erpFile));
}));

test('shared full-file asset never grants sibling document or context metadata', () => fixture(f => {
  const map = mappingFixture(); map.mappings[0].documents = [map.mappings[0].documents[0]];
  f.publish(f.relations, map);
  const result = viewerScope(client);
  assert.deepEqual(result.documentIds, ['viewer-client']);
  assert.ok(result.assetIds.includes('asset-shared'));
  assert.ok(!result.documentIds.includes('viewer-internal'));
  assert.deepEqual(result.contexts, [{ key: 'ctx-a', documentIds: ['viewer-client'] }]);
  assert.deepEqual(viewerScope(admin).documentIds, ['viewer-client'], 'internal role does not imply whole-catalog permission');
}));

test('missing mapping never falls back to company catalog or opens the databases', () => fixture(f => {
  const map = mappingFixture(); map.mappings = [map.mappings[1]]; f.publish(f.relations, map);
  assert.throws(() => viewerScope(admin), fails(404));
  assert.equal(existsSync(f.erpFile), false); assert.equal(existsSync(f.authFile), false);
  f.publish(f.relations, { ...map, mappings: [] }); assert.throws(() => viewerScope(admin), fails(404));
}, false));

test('each mapped ERP document must exist in the same company and project', () => fixture(f => {
  const map = mappingFixture(); map.mappings = [{ ...map.mappings[0], documents: [{ viewerDocumentId: 'viewer-client', erpDocumentId: 'erp-b' }] }];
  f.publish(f.relations, map); assert.throws(() => viewerScope(admin), fails(404));
  map.mappings[0].documents[0].erpDocumentId = 'missing-document';
  f.publish(f.relations, map); assert.throws(() => viewerScope(admin), fails(404));
  map.mappings[0].documents[0].erpDocumentId = 'project-a';
  f.publish(f.relations, map); assert.throws(() => viewerScope(admin), fails(404));
  map.mappings[0].documents[0].erpDocumentId = 'erp-client'; map.mappings[0].projectId = 'project-a2';
  f.publish(f.relations, map); assert.throws(() => viewerScope(admin), fails(404));
}));

test('unresolved context is never silently promoted by a mapping', () => fixture(f => {
  const map = mappingFixture(); map.mappings = [{ tenantId: admin.tenantId, projectId: 'project-a', contextKey: 'ctx-unresolved', documents: [{ viewerDocumentId: 'viewer-unresolved', erpDocumentId: 'erp-client' }] }];
  f.publish(f.relations, map); assert.throws(() => viewerScope(admin), fails(503));
  assert.equal(existsSync(f.erpFile), false);
}, false));

test('deleted, purged, moved and visibility-changed documents revoke access on the next call', () => fixture(f => {
  assert.deepEqual(viewerScope(client).documentIds, ['viewer-client']);
  for (const flag of ['deletedAt', 'purgedAt']) {
    f.data('erp-client', { visibility: 'client', [flag]: '2026-10-23T00:00:00Z' });
    assert.throws(() => viewerScope(client), fails(404));
  }
  f.data('erp-client', { visibility: 'internal' }); assert.throws(() => viewerScope(client), fails(404));
  f.data('erp-client', { visibility: 'client' }); assert.deepEqual(viewerScope(client).documentIds, ['viewer-client']);
  database().prepare('UPDATE records SET project_id=? WHERE id=?').run('project-a2', 'erp-client');
  assert.throws(() => viewerScope(client), fails(404));
}));

test('raw artifact pin covers exact bytes, schema parsing and UTF-8 without exposing input', () => fixture(f => {
  const original = readFileSync(f.relationsFile);
  writeFileSync(f.relationsFile, Buffer.concat([original, Buffer.from(' ')]));
  assert.throws(() => viewerScope(admin), fails(503));
  const invalid = Buffer.from([0xff, 0xfe, 0xff]);
  const map = f.publish(); writeFileSync(f.relationsFile, invalid); writeFileSync(f.mappingFile, JSON.stringify({ ...map, relationsSha256: digest(invalid) }));
  assert.throws(() => viewerScope(admin), fails(503));
  writeFileSync(f.mappingFile, '{"privateFixture":"NEVER_RETURN_THIS_BODY"');
  try { viewerScope(admin); assert.fail('Corrupt config must fail'); }
  catch (error) { assert.ok(error instanceof TakeoffViewerAccessError); assert.equal(error.status, 503); assert.ok(!error.message.includes(f.folder)); assert.ok(!error.message.includes('NEVER_RETURN')); }
  assert.equal(existsSync(f.erpFile), false);
}, false));

test('relations reject duplicate IDs, owner ambiguity and every broken inverse relationship', () => fixture(f => {
  const r = f.relations;
  const invalid: unknown[] = [
    { ...r, schemaVersion: 'takeoff-viewer-relations/v2' }, { ...r, privatePath: '/fixture/private' },
    { ...r, bundleId: '../bundle' }, { ...r, manifestSha256: 'bad' }, { ...r, relationsId: 'not-a-relations-id' },
    { ...r, contexts: [...r.contexts, r.contexts[0]] }, { ...r, documents: [...r.documents, r.documents[0]] }, { ...r, assets: [...r.assets, r.assets[0]] },
    { ...r, contexts: r.contexts.map((c, i) => i ? c : { ...c, documentIds: [...c.documentIds, c.documentIds[0]] }) },
    { ...r, contexts: r.contexts.map((c, i) => i ? c : { ...c, documentIds: c.documentIds.slice(1) }) },
    { ...r, documents: r.documents.map((d, i) => i ? d : { ...d, contextKeys: ['ctx-a', 'ctx-b'] }) },
    { ...r, documents: r.documents.map((d, i) => i ? d : { ...d, contextKeys: ['missing-context'] }) },
    { ...r, documents: r.documents.map((d, i) => i ? d : { ...d, assetIds: ['missing-asset'] }) },
    { ...r, documents: r.documents.map((d, i) => i ? d : { ...d, assetIds: [] }) },
    { ...r, documents: r.documents.map((d, i) => i ? d : { ...d, kind: 'partial_page' }) },
    { ...r, documents: r.documents.map((d, i) => i ? d : { ...d, pages: [1] }) },
    { ...r, assets: r.assets.map((a, i) => i === 1 ? { ...a, documentIds: ['viewer-internal'] } : a) },
    { ...r, assets: r.assets.map((a, i) => i === 1 ? { ...a, documentIds: ['viewer-client', 'viewer-internal', 'viewer-b'] } : a) },
    { ...r, assets: r.assets.map((a, i) => i ? a : { ...a, documentIds: [] }) },
    { ...r, contexts: r.contexts.map((c, i) => i ? c : { ...c, identityStatus: 'approved' }) },
    { ...r, contexts: r.contexts.map((c, i) => i ? c : { ...c, displayName: 'C:\\fixture\\private.pdf' }) },
    { ...r, contexts: Array(513).fill(r.contexts[0]) }, { ...r, documents: Array(4097).fill(r.documents[0]) },
    { ...r, assets: Array(8193).fill(r.assets[0]) },
  ];
  for (const relation of invalid) { f.publish(relation); assert.throws(() => viewerScope(admin), fails(503)); }
  assert.equal(existsSync(f.erpFile), false);
}, false));

test('mapping validates version, bundle, scope, uniqueness and source references', () => fixture(f => {
  const map = mappingFixture(), a = map.mappings[0];
  const invalid: unknown[] = [
    { ...map, schemaVersion: 'wrong' }, { ...map, bundleId: 'different-bundle' }, { ...map, path: '/fixture/private' },
    { ...map, mappings: [a, a] }, { ...map, mappings: [{ ...a, tenantId: '../company-a' }] },
    { ...map, mappings: [{ ...a, documents: [...a.documents, a.documents[0]] }] },
    { ...map, mappings: [{ ...a, documents: [{ ...a.documents[0], extra: true }] }] },
    { ...map, mappings: [{ ...a, contextKey: 'missing-context' }] },
    { ...map, mappings: [{ ...a, documents: [{ ...a.documents[0], viewerDocumentId: 'viewer-b' }] }] },
    { ...map, mappings: [{ ...a, documents: [{ ...a.documents[0], viewerDocumentId: 'missing-document' }] }] },
    { ...map, mappings: [{ ...a, documents: [] }] }, { ...map, mappings: Array(2049).fill(a) },
  ];
  for (const mapping of invalid) { f.publish(f.relations, mapping); assert.throws(() => viewerScope(admin), fails(503)); }
  const configured = f.publish(); writeFileSync(f.mappingFile, JSON.stringify({ ...configured, relationsSha256: '0'.repeat(64) }));
  assert.throws(() => viewerScope(admin), fails(503));
  assert.equal(existsSync(f.erpFile), false);
}, false));

test('policy files are reread so removing an explicit grant takes effect immediately', () => fixture(f => {
  const beforeRelations = readFileSync(f.relationsFile), beforeMapping = readFileSync(f.mappingFile);
  viewerScope(client);
  assert.deepEqual(readFileSync(f.relationsFile), beforeRelations); assert.deepEqual(readFileSync(f.mappingFile), beforeMapping);
  const map = mappingFixture(); map.mappings[0].documents = map.mappings[0].documents.filter(document => document.viewerDocumentId !== 'viewer-client');
  f.publish(f.relations, map); assert.throws(() => viewerScope(client), fails(404));
}));
