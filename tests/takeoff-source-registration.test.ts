import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Actor } from '../lib/auth';
import { database, documentForActor, financialSummary } from '../lib/erp';
import { commitTakeoffSourceRegistration, planTakeoffSourceRegistration, TakeoffSourceRegistrationError, type TakeoffSourceRegistrationInput } from '../lib/takeoff-source-registration';

const admin: Actor = { id: 'fixture-admin', email: 'admin@example.test', role: 'admin', tenantId: 'fixture-company', projectIds: [] };
const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const fails = (status: number) => (cause: unknown) => cause instanceof TakeoffSourceRegistrationError && cause.status === status;
function manifestFixture() {
  return { schema_version: 'takeoff-viewer-bundle/v1', bundle_id: 'fixture-bundle',
    projects: [
      { key: 'ctx-a', display_name: 'Verified fixture project', identity_status: 'resolved', document_ids: ['doc-a', 'doc-b'], metadata: { budgetUsd: 123456, contact: 'PRIVATE_CONTACT', location: 'PRIVATE_LOCATION' } },
      { key: 'ctx-unresolved', display_name: 'Unknown identity', identity_status: 'unresolved', document_ids: ['doc-u'], metadata: {} },
    ],
    documents: [
      { id: 'doc-a', project_key: 'ctx-a', title: 'Verified plan title', source_name: 'fixture-plan.pdf', source_sha256: 'c'.repeat(64), kind: 'drawing_pdf', asset_id: 'asset-a', page_count: 1 },
      { id: 'doc-b', project_key: 'ctx-a', title: 'Verified processed note', source_name: 'fixture-note.docx', source_sha256: 'd'.repeat(64), kind: 'processed_docx', asset_id: 'asset-b', page_count: null },
      { id: 'doc-u', project_key: 'ctx-unresolved', title: 'Unresolved source', source_name: 'unknown.pdf', source_sha256: 'e'.repeat(64), kind: 'drawing_pdf', asset_id: 'asset-u', page_count: 1 },
    ],
    assets: [
      { id: 'asset-a', path: 'assets/not-present-plan.pdf', media_type: 'application/pdf', size_bytes: 12, sha256: 'c'.repeat(64) },
      { id: 'asset-b', path: 'assets/not-present-note.docx', media_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size_bytes: 20, sha256: 'd'.repeat(64) },
      { id: 'asset-u', path: 'assets/not-present-unknown.pdf', media_type: 'application/pdf', size_bytes: 15, sha256: 'e'.repeat(64) },
    ],
  };
}
function fixture(run: (f: ReturnType<typeof createFixture>) => void) { const f = createFixture(); try { run(f); } finally { f.cleanup(); } }
function createFixture() {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-source-registration-'));
  const erpFile = path.join(folder, 'erp.sqlite'), authFile = path.join(folder, 'auth.sqlite'), manifestFile = path.join(folder, 'manifest.json'), relationsFile = path.join(folder, 'relations.json'), mappingFile = path.join(folder, 'operator-mapping.json');
  const variables = { TAYCO_ERP_DB_PATH: erpFile, TAYCO_AUTH_DB_PATH: authFile, TAYCO_TAKEOFF_MANIFEST_PATH: manifestFile, TAYCO_TAKEOFF_RELATIONS_PATH: relationsFile, TAYCO_TAKEOFF_MAPPING_PATH: mappingFile };
  const previous = Object.fromEntries(Object.keys(variables).map(key => [key, process.env[key]]));
  for (const [key, value] of Object.entries(variables)) process.env[key] = value;
  const manifest = manifestFixture();
  const relations = { schemaVersion: 'takeoff-viewer-relations/v1', bundleId: manifest.bundle_id, relationsId: 'relations-' + 'a'.repeat(64), manifestSha256: '',
    contexts: manifest.projects.map(project => ({ contextKey: project.key, displayName: project.display_name, identityStatus: project.identity_status, documentIds: project.document_ids })),
    documents: manifest.documents.map(document => ({ documentId: document.id, contextKeys: [document.project_key], assetIds: [document.asset_id], kind: document.kind })),
    assets: manifest.assets.map(asset => ({ assetId: asset.id, documentIds: manifest.documents.filter(document => document.asset_id === asset.id).map(document => document.id) })),
  };
  const publish = (nextManifest: unknown = manifest, nextRelations: unknown = relations): TakeoffSourceRegistrationInput => {
    const raw = JSON.stringify(nextManifest) + '\n'; writeFileSync(manifestFile, raw);
    const related = { ...(nextRelations as typeof relations), manifestSha256: digest(raw) };
    const rawRelations = JSON.stringify(related) + '\n'; writeFileSync(relationsFile, rawRelations);
    return { expectedBundleId: manifest.bundle_id, expectedRelationsId: relations.relationsId, expectedManifestSha256: digest(raw), expectedRelationsSha256: digest(rawRelations), contextKey: 'ctx-a', viewerDocumentIds: ['doc-a', 'doc-b'], visibility: 'owner', project: { mode: 'create' } };
  };
  const input = publish();
  const counts = () => ['records', 'audit', 'commands'].map(table => Number(database().prepare(`SELECT count(*) AS n FROM ${table}`).get()!.n));
  const entry = (id: string) => {
    const row = database().prepare('SELECT * FROM records WHERE id=?').get(id)!;
    return { id: row.id, kind: row.kind, tenantId: row.tenant_id, projectId: row.project_id, ownerId: row.owner_id, version: row.version, data: JSON.parse(String(row.payload)) };
  };
  return { folder, erpFile, authFile, manifestFile, relationsFile, mappingFile, manifest, relations, publish, input, counts, entry,
    commit(actor = admin, value: TakeoffSourceRegistrationInput = input, key = 'fixture-import-request-001') {
      const plan = planTakeoffSourceRegistration(actor, value); return commitTakeoffSourceRegistration(actor, key, value, plan.planHash);
    },
    cleanup() {
      if (existsSync(erpFile)) database().close();
      for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
      rmSync(folder, { recursive: true, force: true });
    },
  };
}

test('only administrators can preview or commit, before reading sources or opening ERP', () => fixture(f => {
  writeFileSync(f.manifestFile, 'PRIVATE_INVALID_FIXTURE');
  for (const role of ['staff', 'client', 'vendor', 'guest', 'unknown']) {
    const actor = { ...admin, role } as Actor;
    assert.throws(() => planTakeoffSourceRegistration(actor, f.input), fails(403));
    assert.throws(() => commitTakeoffSourceRegistration(actor, 'fixture-import-request-001', f.input, 'a'.repeat(64)), fails(403));
  }
  assert.equal(existsSync(f.erpFile), false);
}));

test('all expected pins, explicit visibility and exact input schema are mandatory', () => fixture(f => {
  const invalid: unknown[] = [null, [], { ...f.input, tenantId: 'foreign-company' }, { ...f.input, blobPath: 'fake.pdf' }, { ...f.input, guestReviews: [] }, { ...f.input, visibility: 'public' }, { ...f.input, viewerDocumentIds: [] }, { ...f.input, viewerDocumentIds: ['doc-a', 'doc-a'] }, { ...f.input, contextKey: '../ctx-a' }, { ...f.input, project: { mode: 'create', name: 'Invented' } }, { ...f.input, project: { mode: 'existing', id: 'fixture-project', expectedVersion: 0 } }];
  for (const key of ['expectedBundleId', 'expectedRelationsId', 'expectedRelationsSha256', 'expectedManifestSha256']) { const value = { ...f.input } as Record<string, unknown>; delete value[key]; invalid.push(value); }
  for (const value of invalid) assert.throws(() => planTakeoffSourceRegistration(admin, value), fails(422));
  assert.equal(existsSync(f.erpFile), false);
}));

test('preview is deterministic, source-backed and creates no project, document, audit or grant', () => fixture(f => {
  const beforeManifest = readFileSync(f.manifestFile), beforeRelations = readFileSync(f.relationsFile);
  const plan = planTakeoffSourceRegistration(admin, f.input);
  assert.deepEqual(plan, planTakeoffSourceRegistration(admin, { ...f.input, viewerDocumentIds: ['doc-b', 'doc-a'] }));
  assert.equal(plan.project.name, f.manifest.projects[0].display_name); assert.equal(plan.project.action, 'create'); assert.equal(plan.project.version, 0);
  assert.deepEqual(plan.documents.map(document => document.name), ['Verified plan title', 'Verified processed note']);
  assert.deepEqual(f.counts(), [0, 0, 0]); assert.equal(existsSync(f.mappingFile), false); assert.equal(existsSync(f.authFile), false);
  assert.equal(existsSync(path.join(f.folder, 'assets')), false, 'no customer asset bytes are needed or read');
  assert.deepEqual(readFileSync(f.manifestFile), beforeManifest); assert.deepEqual(readFileSync(f.relationsFile), beforeRelations);
}));

test('commit atomically registers genuine external references with unknown finances and dates', () => fixture(f => {
  const plan = planTakeoffSourceRegistration(admin, f.input), result = commitTakeoffSourceRegistration(admin, 'fixture-import-request-001', f.input, plan.planHash);
  assert.equal(result.projectId, plan.project.id); assert.equal(result.projectCreated, true); assert.deepEqual(f.counts(), [3, 3, 1]);
  const project = f.entry(result.projectId);
  assert.equal(project.projectId, result.projectId); assert.equal(project.data.progress, null); assert.equal(project.data.budgetUsd, null); assert.equal(project.data.plannedStart, null); assert.equal(project.data.plannedEnd, null);
  for (const document of result.documents) {
    const stored = documentForActor(admin, document.id);
    assert.equal(stored.projectId, result.projectId); assert.equal(stored.data.storage, 'takeoff_viewer'); assert.equal(stored.data.type, 'project'); assert.equal(stored.data.status, 'approved'); assert.equal(stored.data.visibility, 'owner');
    assert.equal(stored.data.viewerDocumentId, document.viewerDocumentId); assert.equal(stored.data.contextKey, 'ctx-a'); assert.equal(stored.data.bundleId, f.input.expectedBundleId); assert.equal(stored.data.manifestSha256, f.input.expectedManifestSha256); assert.equal(stored.data.relationsSha256, f.input.expectedRelationsSha256); assert.equal(stored.data.relationsId, f.input.expectedRelationsId);
    assert.equal(Object.hasOwn(stored.data, 'blobPath'), false); assert.equal(stored.data.expiresAt, null); assert.equal(stored.data.registeredBy, admin.id); assert.ok(Number.isFinite(Date.parse(String(stored.data.registeredAt))));
    assert.equal(Object.hasOwn(stored.data, 'amountUsd'), false); assert.equal(Object.hasOwn(stored.data, 'occurredOn'), false);
  }
  assert.equal(f.entry(result.documents[1].id).data.pageCount, null);
  const all = JSON.stringify(database().prepare('SELECT payload FROM records').all());
  for (const forbidden of ['123456', 'PRIVATE_CONTACT', 'PRIVATE_LOCATION', 'blobPath', 'not-present-plan', 'insurance']) assert.ok(!all.includes(forbidden), forbidden);
  assert.equal(existsSync(f.mappingFile), false);
}));

test('exact receipt replay and identical imports with new keys create no duplicates', () => fixture(f => {
  const plan = planTakeoffSourceRegistration(admin, f.input), result = commitTakeoffSourceRegistration(admin, 'fixture-import-request-001', f.input, plan.planHash);
  assert.deepEqual(commitTakeoffSourceRegistration(admin, 'fixture-import-request-001', f.input, plan.planHash), result);
  const next = planTakeoffSourceRegistration(admin, f.input); assert.equal(next.planHash, plan.planHash); assert.equal(next.project.action, 'unchanged');
  const repeat = commitTakeoffSourceRegistration(admin, 'fixture-import-request-002', f.input, next.planHash);
  assert.equal(repeat.projectCreated, false); assert.ok(repeat.documents.every(document => !document.created)); assert.deepEqual(f.counts(), [3, 3, 2]);
  assert.throws(() => commitTakeoffSourceRegistration(admin, 'fixture-import-request-001', { ...f.input, visibility: 'client' }, plan.planHash), fails(409));
}));

test('source pins, selected context and unresolved identity cannot be bypassed', () => fixture(f => {
  for (const value of [{ ...f.input, expectedManifestSha256: '0'.repeat(64) }, { ...f.input, expectedRelationsSha256: '0'.repeat(64) }, { ...f.input, expectedBundleId: 'wrong-bundle' }, { ...f.input, expectedRelationsId: 'relations-' + '0'.repeat(64) }, { ...f.input, viewerDocumentIds: ['doc-u'] }, { ...f.input, contextKey: 'ctx-unresolved', viewerDocumentIds: ['doc-u'] }, { ...f.input, viewerDocumentIds: ['missing-doc'] }]) assert.throws(() => planTakeoffSourceRegistration(admin, value), fails(409));
  assert.equal(existsSync(f.erpFile), false);
}));

test('bad source graph, duplicated IDs, private labels and absent config fail closed', () => fixture(f => {
  const m = f.manifest, r = f.relations;
  const invalid: [unknown, unknown][] = [
    [{ ...m, schema_version: 'wrong' }, r], [{ ...m, documents: [...m.documents, m.documents[0]] }, r],
    [{ ...m, assets: m.assets.map((asset, i) => i ? asset : { ...asset, path: '../private.pdf' }) }, r],
    [{ ...m, documents: m.documents.map((document, i) => i ? document : { ...document, source_sha256: 'bad' }) }, r],
    [m, { ...r, documents: r.documents.map((document, i) => i ? document : { ...document, contextKeys: ['ctx-a', 'ctx-unresolved'] }) }],
    [m, { ...r, assets: r.assets.map((asset, i) => i ? asset : { ...asset, documentIds: ['doc-b'] }) }],
    [m, { ...r, contexts: [...r.contexts, r.contexts[0]] }],
  ];
  for (const [manifest, relations] of invalid) { const value = f.publish(manifest, relations); assert.throws(() => planTakeoffSourceRegistration(admin, value), fails(503)); }
  delete process.env.TAYCO_TAKEOFF_MANIFEST_PATH; assert.throws(() => planTakeoffSourceRegistration(admin, f.input), fails(503));
  assert.equal(existsSync(f.erpFile), false);
}));

test('wrong approved plan hash and changed source bytes cannot commit', () => fixture(f => {
  const plan = planTakeoffSourceRegistration(admin, f.input);
  assert.throws(() => commitTakeoffSourceRegistration(admin, 'fixture-import-request-001', f.input, '0'.repeat(64)), fails(409)); assert.deepEqual(f.counts(), [0, 0, 0]);
  writeFileSync(f.manifestFile, Buffer.concat([readFileSync(f.manifestFile), Buffer.from(' ')]));
  assert.throws(() => commitTakeoffSourceRegistration(admin, 'fixture-import-request-001', f.input, plan.planHash), fails(409)); assert.deepEqual(f.counts(), [0, 0, 0]);
}));

test('existing project link requires company and current version, and preserves project state', () => fixture(f => {
  const at = '2026-10-23T00:00:00.000Z', data = { name: 'Explicit existing company project', status: 'active', progress: 37, budgetUsd: 5000, source: 'existing-company-source' };
  database().prepare('INSERT INTO records VALUES(?,?,?,?,?,?,4,?,?)').run('existing-project', 'project', admin.tenantId, 'existing-project', admin.id, JSON.stringify(data), at, at);
  const input: TakeoffSourceRegistrationInput = { ...f.input, project: { mode: 'existing', id: 'existing-project', expectedVersion: 4 }, visibility: 'client' };
  const plan = planTakeoffSourceRegistration(admin, input); assert.equal(plan.project.action, 'existing');
  const result = commitTakeoffSourceRegistration(admin, 'fixture-import-request-001', input, plan.planHash);
  assert.equal(result.projectCreated, false); assert.deepEqual(f.entry('existing-project').data, data); assert.equal(f.entry('existing-project').version, 4);
  const client: Actor = { ...admin, id: 'fixture-client', role: 'client', projectIds: ['existing-project'] };
  assert.equal(documentForActor(client, result.documents[0].id).data.visibility, 'client');
  assert.throws(() => planTakeoffSourceRegistration(admin, { ...input, project: { ...input.project, expectedVersion: 3 } }), fails(409));
  assert.throws(() => planTakeoffSourceRegistration({ ...admin, tenantId: 'other-company' }, input), fails(409));
  database().prepare('UPDATE records SET version=5 WHERE id=?').run('existing-project');
  assert.throws(() => commitTakeoffSourceRegistration(admin, 'fixture-import-request-002', input, plan.planHash), fails(409));
  database().prepare('INSERT INTO records VALUES(?,?,?,?,?,?,1,?,?)').run('foreign-private-project', 'project', 'other-company', 'foreign-private-project', 'other-admin', 'INVALID_PRIVATE_FOREIGN_PAYLOAD', at, at);
  assert.throws(() => planTakeoffSourceRegistration(admin, { ...f.input, project: { mode: 'existing', id: 'foreign-private-project', expectedVersion: 1 } }), fails(409), 'foreign payloads are never decoded');
}));

test('tenant-scoped deterministic IDs do not collide or permit foreign plan reuse', () => fixture(f => {
  const first = f.commit(); const other: Actor = { ...admin, tenantId: 'other-company' };
  const plan = planTakeoffSourceRegistration(other, f.input);
  assert.notEqual(plan.project.id, first.projectId); assert.ok(plan.documents.every(document => !first.documents.some(old => old.id === document.id)));
  assert.throws(() => commitTakeoffSourceRegistration(other, 'fixture-import-request-001', f.input, first.planHash), fails(409));
  const second = commitTakeoffSourceRegistration(other, 'fixture-import-request-001', f.input, plan.planHash);
  assert.equal(f.entry(second.projectId).tenantId, other.tenantId); assert.deepEqual(f.counts(), [6, 6, 2]);
}));

test('changed or deleted existing source documents conflict instead of being overwritten or restored', () => fixture(f => {
  const result = f.commit(), document = f.entry(result.documents[0].id);
  for (const patch of [{ viewerDocumentId: 'different-document' }, { manifestSha256: '0'.repeat(64) }, { deletedAt: '2026-10-23T00:00:00Z' }, { purgedAt: '2026-10-23T00:00:00Z' }, { blobPath: 'fabricated-path' }, { visibility: 'client' }]) {
    database().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify({ ...document.data, ...patch }), String(document.id));
    assert.throws(() => planTakeoffSourceRegistration(admin, f.input), fails(409));
  }
  database().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify(document.data), String(document.id));
  database().prepare('INSERT INTO records SELECT ?,kind,tenant_id,project_id,owner_id,payload,version,created_at,updated_at FROM records WHERE id=?').run('duplicate-source-alias', String(document.id));
  assert.throws(() => planTakeoffSourceRegistration(admin, f.input), fails(409));
}));

test('audit or receipt failure rolls back all registrations and permits the original request retry', () => fixture(f => {
  const plan = planTakeoffSourceRegistration(admin, f.input);
  for (const table of ['audit', 'commands']) {
    database().exec(`CREATE TRIGGER fixture_abort BEFORE INSERT ON ${table} BEGIN SELECT RAISE(ABORT,'fixture injected failure'); END`);
    assert.throws(() => commitTakeoffSourceRegistration(admin, 'fixture-import-request-001', f.input, plan.planHash), fails(503)); assert.deepEqual(f.counts(), [0, 0, 0]);
    database().exec('DROP TRIGGER fixture_abort');
  }
  const result = commitTakeoffSourceRegistration(admin, 'fixture-import-request-001', f.input, plan.planHash);
  assert.equal(result.projectCreated, true); assert.deepEqual(f.counts(), [3, 3, 1]);
}));

test('registration does not alter actual financial totals or publish grants', () => fixture(f => {
  const before = financialSummary(admin); f.commit(); const after = financialSummary(admin);
  assert.deepEqual(after.invoices, before.invoices); assert.equal(after.paidRecordedUsd, before.paidRecordedUsd); assert.equal(after.recordCount, before.recordCount);
  assert.equal(after.projects.length, 1); assert.equal(after.projects[0].budgetUsd, null); assert.equal(existsSync(f.mappingFile), false);
  const records = database().prepare('SELECT kind FROM records').all(); assert.ok(records.every(row => row.kind === 'project' || row.kind === 'document'));
  const projectId = String(database().prepare("SELECT id FROM records WHERE kind='project'").get()!.id);
  const guest: Actor = { ...admin, id: 'fixture-guest', role: 'guest', projectIds: [] };
  assert.throws(() => documentForActor(guest, String(database().prepare("SELECT id FROM records WHERE kind='document'").get()!.id)));
  const project = f.entry(projectId); assert.equal(project.data.progress, null);
}));
