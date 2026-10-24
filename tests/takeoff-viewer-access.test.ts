import { syntheticViewerCohort } from './viewer-cohort-fixture';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { AuthError, requireProject, type Actor } from '../lib/auth';
import { database, documentForActor, ErpError, execute, financialSummary, snapshot } from '../lib/erp';
import { currentReportingPeriod } from '../lib/guest-period';
import { VIEWER_PREFIX, TakeoffViewerAccessError, guestProjectReviews, viewerScope, type ViewerRelations } from '../lib/takeoff-viewer-access';

const admin: Actor = { id: 'fixture-admin', email: 'admin@example.test', role: 'admin', tenantId: 'company-a', projectIds: [] };
const staff: Actor = { ...admin, id: 'fixture-staff', role: 'staff' };
const client: Actor = { ...admin, id: 'fixture-client', role: 'client', projectIds: ['project-a'] };
const vendor: Actor = { ...admin, id: 'fixture-vendor', role: 'vendor', projectIds: ['project-a'], vendorId: 'vendor-a' };
const other: Actor = { ...admin, tenantId: 'company-b' };
const guest: Actor = { ...admin, id: 'fixture-guest', role: 'guest', projectIds: [] };
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
function guestMapping(viewerDocumentIds = ['viewer-client'], period = currentReportingPeriod()) {
  return { ...mappingFixture(), schemaVersion: 'tayco-takeoff-viewer-access/v2', guestReviews: [{ tenantId: guest.tenantId, guestId: guest.id, projectId: 'project-a', period, viewerDocumentIds }] };
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
  const previous = { erp: process.env.TAYCO_ERP_DB_PATH, auth: process.env.TAYCO_AUTH_DB_PATH, relations: process.env.TAYCO_TAKEOFF_RELATIONS_PATH, mapping: process.env.TAYCO_TAKEOFF_MAPPING_PATH, manifest: process.env.TAYCO_TAKEOFF_MANIFEST_PATH };
  process.env.TAYCO_ERP_DB_PATH = erpFile; process.env.TAYCO_AUTH_DB_PATH = authFile;
  process.env.TAYCO_TAKEOFF_RELATIONS_PATH = relationsFile; process.env.TAYCO_TAKEOFF_MAPPING_PATH = mappingFile;
  const relations = relationsFixture();
  const cohort = syntheticViewerCohort(folder, relations);
  process.env.TAYCO_TAKEOFF_MANIFEST_PATH = cohort.manifestPath;
  const deliveryByERP = new Map(mappingFixture().mappings.flatMap(mapping => mapping.documents.map(doc => [doc.erpDocumentId, cohort.delivery(doc.viewerDocumentId)] as const)));
  const publish = (value: unknown = relations, mapping: unknown = mappingFixture()) => {
    const bytes = JSON.stringify(value) + '\n';
    writeFileSync(relationsFile, bytes);
    const configured = { ...(mapping as ReturnType<typeof mappingFixture>), relationsSha256: digest(bytes) };
    writeFileSync(mappingFile, JSON.stringify(configured)); return configured;
  };
  publish();
  const put = (id: string, kind: 'project' | 'document', tenant: string, project: string, owner: string, data: Record<string, unknown> = {}) => {
    const at = '2026-10-23T00:00:00.000Z';
    database().prepare('INSERT INTO records VALUES(?,?,?,?,?,?,1,?,?)').run(id, kind, tenant, project, owner, JSON.stringify({ ...deliveryByERP.get(id), ...data }), at, at);
  };
  const data = (id: string, next: Record<string, unknown>) => database().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify({ ...deliveryByERP.get(id), ...next }), id);
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
      for (const [key, value] of Object.entries({ TAYCO_ERP_DB_PATH: previous.erp, TAYCO_AUTH_DB_PATH: previous.auth, TAYCO_TAKEOFF_RELATIONS_PATH: previous.relations, TAYCO_TAKEOFF_MAPPING_PATH: previous.mapping, TAYCO_TAKEOFF_MANIFEST_PATH: previous.manifest })) {
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
  assert.deepEqual(Object.keys(result).sort(), ['bundleId', 'relationsId', 'manifestSha256', 'relationsSha256', 'contexts', 'documentIds', 'assetIds', 'documents'].sort());
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
  assert.deepEqual(result.documents, [{ id: 'viewer-client', contextKey: 'ctx-a', assetIds: ['asset-client', 'asset-shared'], sourceSha256: 'c'.repeat(64) }]);
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

test('v1 and missing config deny guests before ERP reads while monthly summary stays usable', () => fixture(f => {
  assert.throws(() => viewerScope(guest), fails(403)); assert.deepEqual(guestProjectReviews(guest), []);
  delete process.env.TAYCO_TAKEOFF_MAPPING_PATH;
  assert.throws(() => viewerScope(guest), fails(403)); assert.deepEqual(guestProjectReviews(guest), []);
  process.env.TAYCO_TAKEOFF_MAPPING_PATH = path.join(f.folder, 'absent-policy.json');
  assert.throws(() => viewerScope(guest), fails(403)); assert.deepEqual(guestProjectReviews(guest), []);
  assert.equal(existsSync(f.erpFile), false); assert.equal(existsSync(f.authFile), false);
}, false));

test('v2 guest grant is exact and exposes only explicitly selected project-category plans', () => fixture(f => {
  f.data('erp-client', { type: 'project', visibility: 'internal', source: 'PRIVATE_SOURCE', blobPath: '/fixture/private/plan.pdf' });
  f.publish(f.relations, guestMapping());
  const result = viewerScope(guest, 'project-a');
  assert.deepEqual(result.documentIds, ['viewer-client']);
  assert.deepEqual(result.contexts, [{ key: 'ctx-a', documentIds: ['viewer-client'] }]);
  assert.deepEqual(result.documents, [{ id: 'viewer-client', contextKey: 'ctx-a', assetIds: ['asset-client', 'asset-shared'], sourceSha256: 'c'.repeat(64) }]);
  assert.deepEqual(result.assetIds, ['asset-client', 'asset-shared']);
  assert.ok(!JSON.stringify(result).includes('PRIVATE_SOURCE')); assert.ok(!JSON.stringify(result).includes('viewer-internal'));
  assert.throws(() => viewerScope({ ...guest, id: 'another-guest' }), fails(403));
  assert.throws(() => viewerScope({ ...guest, tenantId: 'company-b' }), fails(403));
  assert.throws(() => viewerScope(guest, 'project-a2'), fails(403));
  assert.throws(() => viewerScope(guest, 'project-b'), fails(403));
  assert.throws(() => viewerScope({ ...guest, projectIds: ['project-a'] }), fails(403));
  assert.throws(() => viewerScope({ ...guest, vendorId: 'forged-vendor' }), fails(403));
  assert.deepEqual(guestProjectReviews({ ...guest, id: 'another-guest' }), []);
  assert.deepEqual(guestProjectReviews(admin), []);
}));

test('guest project summary whitelists useful values and excludes every private ERP field', () => fixture(f => {
  f.data('erp-client', { type: 'project', visibility: 'owner', contact: 'private@example.test', blobPath: '/fixture/private/plan.pdf' });
  f.data('project-a', { name: 'Approved October plans', status: 'planning', progress: null, location: 'PRIVATE_LOCATION', clientEmail: 'private@example.test', clientPhone: 'PRIVATE_PHONE', budgetUsd: 123456, source: 'PRIVATE_SOURCE', history: ['PRIVATE_HISTORY'], commercialProgress: { currentStage: 'awaiting_insurance_information', reportedCompletedStages: ['contacted', 'meeting_scheduled', 'estimate_provided'], source: 'PRIVATE_INSURANCE_EXPLANATION', actorId: 'PRIVATE_AUTHOR', history: ['PRIVATE_STAGE_HISTORY'] } });
  f.publish(f.relations, guestMapping());
  const result = guestProjectReviews(guest);
  assert.deepEqual(result, [{ projectId: 'project-a', name: 'Approved October plans', period: currentReportingPeriod(), status: 'planning', progress: null, commercialStage: 'awaiting_insurance_information', completedStages: ['contacted', 'meeting_scheduled', 'estimate_provided'], documentCount: 1 }]);
  assert.equal(Object.getPrototypeOf(result[0]), Object.prototype);
  const serialized = JSON.stringify(result);
  for (const field of ['PRIVATE_', 'private@example', '123456', '/fixture/private', 'budget', 'location', 'source', 'actorId', 'history', '"contact":', 'blobPath', 'viewer-client', 'asset-client']) assert.ok(!serialized.includes(field), field);
  assert.equal(existsSync(f.authFile), false, 'guest plan projection never invokes staff/auth snapshot reads');
}));

test('only current UTC guest approvals grant detailed cards or viewer scope', () => fixture(f => {
  const now = new Date('2026-10-23T12:00:00Z');
  f.data('erp-client', { type: 'project' });
  const config = guestMapping(['viewer-client'], '2026-10');
  config.guestReviews.push({ ...config.guestReviews[0], period: '2026-09' });
  config.guestReviews.push({ ...config.guestReviews[0], period: '2026-11' });
  f.publish(f.relations, config);
  assert.deepEqual(guestProjectReviews(guest, now).map(review => review.period), ['2026-10']);
  assert.deepEqual(viewerScope(guest, 'project-a', now).documentIds, ['viewer-client']);
  for (const period of ['2026-09','2026-11','2025-12','2027-01']) {
    f.publish(f.relations, guestMapping(['viewer-client'], period));
    assert.deepEqual(guestProjectReviews(guest, now), []);
    assert.throws(() => viewerScope(guest, 'project-a', now), fails(403));
    assert.throws(() => viewerScope(guest, undefined, now), fails(403));
  }
}));

test('guest v2 validates strict schema, period, membership and duplicate approvals before DB reads', () => fixture(f => {
  const config = guestMapping(), grant = config.guestReviews[0];
  const invalid: unknown[] = [
    { ...config, guestReviews: undefined }, { ...config, guests: config.guestReviews },
    { ...config, guestReviews: [{ ...grant, extra: 'PRIVATE' }] },
    { ...config, guestReviews: [{ ...grant, guestId: '*' }] },
    { ...config, guestReviews: [{ ...grant, viewerDocumentIds: [] }] },
    { ...config, guestReviews: [{ ...grant, viewerDocumentIds: ['viewer-client', 'viewer-client'] }] },
    { ...config, guestReviews: [{ ...grant, viewerDocumentIds: ['viewer-b'] }] },
    { ...config, guestReviews: [{ ...grant, viewerDocumentIds: ['missing-viewer-document'] }] },
    { ...config, guestReviews: [{ ...grant, projectId: 'project-a2' }] },
    { ...config, guestReviews: [{ ...grant, tenantId: 'company-b' }] },
    { ...config, guestReviews: [grant, grant] },
    ...['2026-1', '2026-00', '2026-13', '2026-10-01', 'October', '1899-12'].map(period => ({ ...config, guestReviews: [{ ...grant, period }] })),
  ];
  for (const value of invalid) { f.publish(f.relations, value); assert.throws(() => viewerScope(guest), fails(503)); assert.deepEqual(guestProjectReviews(guest), []); }
  f.publish(f.relations, { ...mappingFixture(), guestReviews: [grant] }); assert.throws(() => viewerScope(guest), fails(503));
  assert.equal(existsSync(f.erpFile), false); assert.equal(existsSync(f.authFile), false);
}, false));

test('guest plan approval never grants tax, insurance, W9 or other non-project documents', () => fixture(f => {
  f.publish(f.relations, guestMapping());
  for (const type of ['w9', 'tax', 'insurance', 'invoice', '', undefined, 'PROJECT']) {
    f.data('erp-client', { type, visibility: 'client' });
    assert.throws(() => viewerScope(guest), fails(403)); assert.deepEqual(guestProjectReviews(guest), []);
  }
  f.data('erp-client', { type: 'project' });
  assert.equal(guestProjectReviews(guest)[0].documentCount, 1);
  database().prepare('UPDATE records SET kind=? WHERE id=?').run('invoice', 'erp-client');
  assert.throws(() => viewerScope(guest), fails(403)); assert.deepEqual(guestProjectReviews(guest), []);
}));

test('guest grants are revoked by document deletion, purge, moves, foreign tenant or missing project', () => fixture(f => {
  f.publish(f.relations, guestMapping()); f.data('erp-client', { type: 'project' });
  assert.equal(guestProjectReviews(guest).length, 1);
  for (const flag of ['deletedAt', 'purgedAt']) {
    f.data('erp-client', { type: 'project', [flag]: '2026-10-23T00:00:00Z' });
    assert.throws(() => viewerScope(guest), fails(403)); assert.deepEqual(guestProjectReviews(guest), []);
  }
  f.data('erp-client', { type: 'project' });
  database().prepare('UPDATE records SET project_id=? WHERE id=?').run('project-a2', 'erp-client');
  assert.throws(() => viewerScope(guest), fails(403));
  database().prepare('UPDATE records SET project_id=?,tenant_id=? WHERE id=?').run('project-a', 'company-b', 'erp-client');
  assert.throws(() => viewerScope(guest), fails(403));
  database().prepare('UPDATE records SET tenant_id=? WHERE id=?').run('company-a', 'erp-client');
  f.data('project-a', { name: 'Approved project', deletedAt: '2026-10-23T00:00:00Z' });
  assert.throws(() => viewerScope(guest), fails(403)); assert.deepEqual(guestProjectReviews(guest), []);
  database().prepare('DELETE FROM records WHERE id=?').run('project-a');
  assert.throws(() => viewerScope(guest), fails(403));
}));

test('guest summary counts only usable granted plans and never invents progress or completions', () => fixture(f => {
  f.publish(f.relations, guestMapping(['viewer-client', 'viewer-vendor']));
  f.data('erp-client', { type: 'project' }); f.data('erp-vendor', { type: 'insurance' });
  f.data('project-a', { name: '/fixture/private/source.pdf', status: 'PRIVATE_STATUS', progress: true, commercialProgress: { currentStage: 'estimate_provided', reportedCompletedStages: ['contacted', 'awaiting_insurance_information'] } });
  const result = guestProjectReviews(guest)[0];
  assert.equal(result.documentCount, 1); assert.equal(result.name, 'Project plans'); assert.equal(result.status, 'unknown'); assert.equal(result.progress, null); assert.deepEqual(result.completedStages, []);
  f.data('project-a', { name: 'Approved project', status: 'active', progress: 0, commercialProgress: { currentStage: 'PRIVATE_STAGE', reportedCompletedStages: ['contacted'] } });
  assert.equal(guestProjectReviews(guest)[0].progress, 0); assert.equal(guestProjectReviews(guest)[0].commercialStage, null); assert.deepEqual(guestProjectReviews(guest)[0].completedStages, []);
  assert.deepEqual(viewerScope(guest).documentIds, ['viewer-client']);
}));

test('explicit plan approval leaves every general ERP guest guard intact', () => fixture(f => {
  f.data('erp-client', { type: 'project' }); f.publish(f.relations, guestMapping());
  assert.equal(guestProjectReviews(guest).length, 1);
  const erpDenied = (error: unknown) => error instanceof ErpError && error.status === 403;
  assert.throws(() => snapshot(guest), erpDenied);
  assert.throws(() => financialSummary(guest), erpDenied);
  assert.throws(() => documentForActor(guest, 'erp-client'), erpDenied);
  assert.throws(() => execute(guest, 'guest-command-fixture-001', { action: 'create_project', name: 'Denied' }), erpDenied);
  assert.throws(() => requireProject(guest, 'project-a', guest.tenantId), (error: unknown) => error instanceof AuthError && error.status === 403);
}));

test('removing a v2 grant revokes the same guest without changing session assignments', () => fixture(f => {
  f.data('erp-client', { type: 'project' }); f.publish(f.relations, guestMapping());
  assert.deepEqual(viewerScope(guest).documentIds, ['viewer-client']);
  f.publish(f.relations, { ...guestMapping(), guestReviews: [] });
  assert.throws(() => viewerScope(guest), fails(403)); assert.deepEqual(guestProjectReviews(guest), []);
  assert.deepEqual(guest.projectIds, []);
}));

test('explicit project periods cannot contradict a current grant, including lower-priority fields', () => fixture(f => {
  const now = new Date('2026-10-23T12:00:00Z');
  f.data('erp-client', { type: 'project' });
  f.publish(f.relations, guestMapping(['viewer-client'], '2026-10'));
  const allowed = () => {
    assert.deepEqual(viewerScope(guest, 'project-a', now).documentIds, ['viewer-client']);
    assert.equal(guestProjectReviews(guest, now).length, 1);
  };
  const denied = () => {
    assert.throws(() => viewerScope(guest, 'project-a', now), fails(403));
    assert.throws(() => viewerScope(guest, undefined, now), fails(403));
    assert.deepEqual(guestProjectReviews(guest, now), []);
  };
  for (const field of ['reviewPeriod','reportingPeriod','period']) {
    f.data('project-a', { name: 'Current source project', [field]: '2026-10' }); allowed();
    for (const period of ['2026-09','2026-11','invalid','2026-1','',true,0,{},[]]) {
      f.data('project-a', { name: 'Rejected source period', [field]: period }); denied();
    }
  }
  f.data('project-a', { reviewPeriod: '2026-10', reportingPeriod: '2026-09' }); denied();
  f.data('project-a', { reviewPeriod: '2026-10', reportingPeriod: '2026-10', period: '2026-11' }); denied();
  f.data('project-a', { reviewPeriod: '2026-10', reportingPeriod: '2026-10', period: '2026-10' }); allowed();
  database().prepare('UPDATE records SET tenant_id=? WHERE id=?').run('company-b', 'project-a'); denied();
  database().prepare('UPDATE records SET tenant_id=? WHERE id=?').run('company-a', 'project-a'); allowed();
  assert.throws(() => viewerScope({ ...guest, tenantId: 'company-b' }, 'project-a', now), fails(403));
  assert.deepEqual(guestProjectReviews({ ...guest, tenantId: 'company-b' }, now), []);
}));

test('document declarations and lifecycle deny direct viewer access even for a current project grant', () => fixture(f => {
  const now = new Date('2026-10-23T12:00:00Z');
  f.data('project-a', { name: 'Current project', reviewPeriod: '2026-10' });
  f.publish(f.relations, guestMapping(['viewer-client'], '2026-10'));
  for (const field of ['reviewPeriod','reportingPeriod','period']) {
    f.data('erp-client', { type: 'project', [field]: '2026-10' });
    assert.deepEqual(viewerScope(guest, 'project-a', now).documentIds, ['viewer-client']);
    for (const period of ['2026-09','2026-11','invalid','',false,{},[]]) {
      f.data('erp-client', { type: 'project', [field]: period });
      assert.throws(() => viewerScope(guest, 'project-a', now), fails(403));
      assert.deepEqual(guestProjectReviews(guest, now), []);
    }
  }
  const rejected = [
    { reviewPeriod: '2026-10', reportingPeriod: '2026-09' },
    { reportingPeriod: '2026-10', period: '2026-11' },
    { revokedAt: '2026-10-23T00:00:00Z' }, { revokedAt: false }, { purgeState: 'processing' }, { purgeState: 'retry' },
    { status: 'revoked' }, { status: 'expired' }, { status: 'deleted' }, { status: 'purged' },
    { expiresAt: '2026-10-22' }, { expiresAt: '2026-10-23T11:59:59Z' }, { expiresAt: '2026-10-23T12:00:00Z' },
    { expiresAt: '2026-02-31' }, { expiresAt: 'bad' }, { expiresAt: {} },
  ];
  for (const fields of rejected) {
    f.data('erp-client', { type: 'project', ...fields });
    assert.throws(() => viewerScope(guest, 'project-a', now), fails(403));
    assert.deepEqual(guestProjectReviews(guest, now), []);
  }
  for (const expiresAt of [null, '', '2026-10-23', '2026-10-24', '2026-10-23T12:00:01Z']) {
    f.data('erp-client', { type: 'project', expiresAt });
    assert.deepEqual(viewerScope(guest, 'project-a', now).documentIds, ['viewer-client']);
  }
  f.data('erp-client', { type: 'project', period: '2026-09' });
  assert.deepEqual(viewerScope(staff, 'project-a', now).documentIds, ['viewer-client','viewer-client-owner','viewer-internal','viewer-vendor']);
}));

test('UTC rollover revalidates the grant for each resource request and needs no session change', () => fixture(f => {
  f.data('erp-client', { type: 'project' });
  f.publish(f.relations, guestMapping(['viewer-client'], '2026-10'));
  const lastInstant = new Date('2026-10-31T23:59:59.999Z'), nextInstant = new Date('2026-11-01T00:00:00Z');
  assert.deepEqual(viewerScope(guest, 'project-a', lastInstant).documentIds, ['viewer-client']);
  assert.equal(guestProjectReviews(guest, lastInstant).length, 1);
  assert.throws(() => viewerScope(guest, 'project-a', nextInstant), fails(403));
  assert.deepEqual(guestProjectReviews(guest, nextInstant), []);
  f.publish(f.relations, guestMapping(['viewer-client'], '2026-11'));
  assert.deepEqual(viewerScope(guest, 'project-a', nextInstant).documentIds, ['viewer-client']);
  f.data('project-a', { period: '2026-10' });
  assert.throws(() => viewerScope(guest, 'project-a', nextInstant), fails(403));
  assert.deepEqual(guest.projectIds, []);
}));

test('a current exact document approval declares an undated import business period without inventing a source date', () => fixture(f => {
  const now = new Date('2026-10-23T12:00:00Z');
  f.data('project-a', { name: 'Undated import', source: 'takeoff_source_registration' });
  f.data('erp-client', { type: 'project', storage: 'takeoff_viewer' });
  database().prepare("UPDATE records SET created_at='2025-01-01T00:00:00Z' WHERE id IN ('project-a','erp-client')").run();
  f.publish(f.relations, guestMapping(['viewer-client'], '2026-10'));
  assert.deepEqual(viewerScope(guest, 'project-a', now).documentIds, ['viewer-client']);
  assert.equal(guestProjectReviews(guest, now)[0].period, '2026-10');
  f.data('erp-client', { type: 'project', period: '2025-01' });
  assert.throws(() => viewerScope(guest, 'project-a', now), fails(403));
  assert.deepEqual(guestProjectReviews(guest, now), []);
}));

test('historical and future grants are denied before ERP initialization', () => fixture(f => {
  const now = new Date('2026-10-23T12:00:00Z');
  for (const period of ['2026-09','2026-11']) {
    f.publish(f.relations, guestMapping(['viewer-client'], period));
    assert.throws(() => viewerScope(guest, 'project-a', now), fails(403));
    assert.deepEqual(guestProjectReviews(guest, now), []);
    assert.equal(existsSync(f.erpFile), false);
    assert.equal(existsSync(f.authFile), false);
  }
}, false));

test('malformed source JSON never broadens a current guest approval', () => fixture(f => {
  const now = new Date('2026-10-23T12:00:00Z');
  f.publish(f.relations, guestMapping(['viewer-client'], '2026-10'));
  f.data('erp-client', { type: 'project' });
  database().prepare('UPDATE records SET payload=? WHERE id=?').run('{bad json', 'project-a');
  assert.throws(() => viewerScope(guest, 'project-a', now), fails(403));
  assert.deepEqual(guestProjectReviews(guest, now), []);
  f.data('project-a', { name: 'Current project' });
  database().prepare('UPDATE records SET payload=? WHERE id=?').run('{bad json', 'erp-client');
  assert.throws(() => viewerScope(guest, 'project-a', now), fails(403));
  assert.deepEqual(guestProjectReviews(guest, now), []);
}));
