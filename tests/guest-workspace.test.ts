import { syntheticViewerCohort } from './viewer-cohort-fixture';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Actor } from '../lib/auth';
import { database, ErpError, snapshot, execute } from '../lib/erp';
import { saveMonthlyManagementEstimate } from '../lib/monthly-management-estimates';
import { guestConsoleSnapshot, guestConsoleDocument } from '../lib/guest-workspace';
import { currentReportingPeriod, requireGuestPeriod } from '../lib/guest-period';

const guest: Actor = { id: 'guest-one', email: 'guest@example.test', role: 'guest', tenantId: 'tenant-one', projectIds: [] };
const admin: Actor = { ...guest, id: 'admin-one', role: 'admin' };
const now = new Date('2026-10-23T18:00:00Z');
const fails = (status: number) => (error: unknown) => error instanceof ErpError && error.status === status;

test('guest reporting period validates detail and UTC boundaries', () => {
  assert.equal(currentReportingPeriod(new Date('2026-11-01T00:00:00Z')), '2026-11');
  assert.equal(currentReportingPeriod(new Date('2026-10-31T23:59:59-01:00')), '2026-11');
  assert.equal(requireGuestPeriod('2026-10', now), '2026-10');
  for (const value of ['2026-09', '2026-11', '2027-01']) assert.throws(() => requireGuestPeriod(value, now), fails(403));
  for (const value of [null, '', '2026-13', '2026-1', '2026-10 OR 1=1', '0000-01']) assert.throws(() => requireGuestPeriod(value, now), fails(422));
  assert.throws(() => currentReportingPeriod(new Date('invalid')), fails(422));
});

test('guest console uses whitelisted current-period projections and fails closed', async t => {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-guest-workspace-'));
  const names = ['TAYCO_ERP_DB_PATH', 'TAYCO_TAKEOFF_RELATIONS_PATH', 'TAYCO_TAKEOFF_MAPPING_PATH', 'TAYCO_TAKEOFF_MANIFEST_PATH'];
  const old = Object.fromEntries(names.map(name => [name, process.env[name]]));
  process.env.TAYCO_ERP_DB_PATH = path.join(folder, 'erp.sqlite');
  process.env.TAYCO_TAKEOFF_RELATIONS_PATH = path.join(folder, 'missing-relations.json');
  process.env.TAYCO_TAKEOFF_MAPPING_PATH = path.join(folder, 'missing-mapping.json');
  const db = database(), createdAt = '2026-10-02T00:00:00Z';
  const insert = (id: string, kind: string, projectId: string, data: unknown, created = createdAt, tenantId = guest.tenantId) => {
    db.prepare('INSERT INTO records VALUES(?,?,?,?,?,?,1,?,?)').run(id, kind, tenantId, projectId, admin.id, typeof data === 'string' ? data : JSON.stringify(data), created, created);
  };
  const project = (id: string, data: Record<string, unknown> = {}, created = createdAt, tenant = guest.tenantId) =>
    insert(id, 'project', id, { name: id, status: 'active', progress: 40, source: 'team', location: 'North site', commercialProgress: { currentStage: 'unknown' }, ...data }, created, tenant);
  const doc = (id: string, projectId = 'current-project', data: Record<string, unknown> = {}, created = createdAt, tenant = guest.tenantId) =>
    insert(id, 'document', projectId, { name: id + '.pdf', contentType: 'application/pdf', type: 'project', blobPath: 'PRIVATE_BLOB_SENTINEL/' + id, internalNotes: 'PRIVATE_NOTES_SENTINEL', ...data }, created, tenant);
  const estimate = (id: string, projectId = 'current-project', data: Record<string, unknown> = {}, created = createdAt) =>
    insert(id, 'estimate', projectId, { name: id, currency: 'USD', amountUsd: 1200, estimatedOn: '2026-10-10', dateBasis: 'source_date', sourceName: 'Published estimate', sourceRef: 'PRIVATE_SOURCE_REF_SENTINEL', clientEmail: 'PRIVATE_CONTACT_SENTINEL@example.test', ...data }, created);
  try {
    project('current-project', { clientName: 'PRIVATE_CLIENT_SENTINEL', nextAction: 'PRIVATE_ACTION_SENTINEL', budgetUsd: 999999 });
    project('past-project', {}, '2026-09-30T23:59:59Z');
    project('future-project', {}, '2026-11-01T00:00:00Z');
    project('cross-project', {}, createdAt, 'other-tenant');
    project('deleted-project', { deletedAt: createdAt });
    project('purged-project', { purgedAt: createdAt });
    project('revoked-project', { revokedAt: createdAt });
    project('unknown-import', { source: 'estimate_recovery', sourceProjectSlug: 'historical-source' });
    project('unknown-source', { source: 'unrecognized-import' });
    project('disguised-import', { source: 'team', sourceBundleId: 'import-bundle' });
    project('explicit-current', { reviewPeriod: '2026-10', progress: true, name: { text: 'PRIVATE_NESTED_NAME_SENTINEL' } }, '2026-09-01T00:00:00Z');
    project('explicit-past', { reviewPeriod: '2026-09', reportingPeriod: '2026-10' });
    project('explicit-future', { reportingPeriod: '2026-11' });
    project('invalid-period', { reviewPeriod: 'bad', reportingPeriod: '2026-10' });
    project('invalid-date', {}, '2026-02-31T00:00:00Z');
    insert('malformed', 'project', 'malformed', '{bad json');
    insert('array-json', 'project', 'array-json', []);
    insert('other-record', 'note', 'current-project', { text: 'PRIVATE_NOTE_RECORD_SENTINEL' });
    doc('current-doc'); doc('past-doc', 'current-project', {}, '2026-09-01T00:00:00Z');
    doc('future-doc', 'current-project', {}, '2026-11-01T00:00:00Z');
    doc('cross-doc', 'current-project', {}, createdAt, 'other-tenant');
    doc('past-parent-doc', 'past-project'); doc('future-parent-doc', 'future-project');
    doc('unknown-parent-doc', 'unknown-import'); doc('deleted-parent-doc', 'deleted-project');
    doc('deleted-doc', 'current-project', { deletedAt: createdAt }); doc('purged-doc', 'current-project', { purgedAt: createdAt });
    doc('purging-doc', 'current-project', { purgeState: 'processing' }); doc('retry-doc', 'current-project', { purgeState: 'retry' });
    doc('revoked-doc', 'current-project', { revokedAt: createdAt }); doc('revoked-status-doc', 'current-project', { status: 'revoked' });
    doc('expired-doc', 'current-project', { expiresAt: '2026-10-22' }); doc('expired-timestamp-doc', 'current-project', { expiresAt: '2026-10-23T17:59:59Z' }); doc('bad-expiry', 'current-project', { expiresAt: 'bad' });
    doc('vendor-doc', 'current-project', { type: 'insurance' });
    doc('explicit-past-doc', 'current-project', { period: '2026-09' });
    doc('explicit-current-doc', 'current-project', { period: '2026-10' }, '2026-09-02T00:00:00Z');
    doc('missing-file-doc', 'current-project', { blobPath: null });
    doc('unsafe-name-doc', 'current-project', { name: 'C:\\private\\document.pdf' });
    estimate('current-estimate'); estimate('past-estimate', 'current-project', { estimatedOn: '2026-09-30' });
    estimate('future-estimate', 'current-project', { estimatedOn: '2026-11-01' });
    estimate('unknown-estimate', 'current-project', { estimatedOn: null, dateBasis: 'unknown' });
    estimate('missing-date-estimate', 'current-project', { estimatedOn: null, dateBasis: null });
    estimate('invalid-date-estimate', 'current-project', { estimatedOn: '2026-02-31' });
    estimate('contradictory-date-estimate', 'current-project', { issuedOn: '2026-09-01' });
    estimate('prior-period-estimate', 'current-project', { period: '2026-09' });
    estimate('past-parent-estimate', 'past-project'); estimate('future-parent-estimate', 'future-project'); estimate('unknown-parent-estimate', 'unknown-import');
    estimate('unknown-amount-estimate', 'current-project', { amountUsd: true, sourceName: 'C:\\private\\estimate.json' });
    insert('cross-estimate', 'estimate', 'current-project', { estimatedOn: '2026-10-10', amountUsd: 900, currency: 'USD' }, createdAt, 'other-tenant');
    saveMonthlyManagementEstimate(admin, 'fixture-september-estimate-request', { period: '2026-09', lowUsd: 100, highUsd: 200, source: 'PRIVATE_MANAGEMENT_SOURCE_SENTINEL', expectedVersion: 0 });
    saveMonthlyManagementEstimate(admin, 'fixture-october-estimate-request', { period: '2026-10', lowUsd: 900, highUsd: 1000, source: 'PRIVATE_CURRENT_MANAGEMENT_SOURCE_SENTINEL', expectedVersion: 0 });

    await t.test('current detail works without a viewer publication and contains no private fields', () => {
      const data = guestConsoleSnapshot(guest, { now });
      assert.equal(data.actor.role, 'guest'); assert.equal(data.currentPeriod, '2026-10'); assert.equal(data.detailAllowed, true);
      assert.deepEqual(data.projects.map(p => p.id).sort(), ['current-project', 'explicit-current']);
      assert.equal(data.projects.find(p => p.id === 'current-project')?.documentCount, 4);
      assert.equal(data.projects.find(p => p.id === 'explicit-current')?.progress, null);
      assert.equal(data.projects.find(p => p.id === 'explicit-current')?.name, 'Project');
      assert.deepEqual(data.estimates.map(e => e.id).sort(), ['current-estimate', 'unknown-amount-estimate']);
      assert.equal(data.estimates.find(e => e.id === 'unknown-amount-estimate')?.amountUsd, null);
      assert.equal(data.estimates.find(e => e.id === 'unknown-amount-estimate')?.sourceLabel, null);
      assert.deepEqual(data.documents.map(d => d.id).sort(), ['current-doc', 'explicit-current-doc', 'missing-file-doc', 'unsafe-name-doc']);
      assert.equal(data.documents.find(d => d.id === 'unsafe-name-doc')?.name, 'Project document');
      assert.equal(data.documents.find(d => d.id === 'missing-file-doc')?.available, false);
      assert.equal(data.documents.find(d => d.id === 'current-doc')?.downloadHref, '/api/documents/current-doc');
      assert.equal(data.documents.find(d => d.id === 'current-doc')?.contentType, 'application/pdf');
      assert.deepEqual(data.historicalSummary.months.map(m => m.period), ['2026-09']);
      assert.doesNotMatch(JSON.stringify(data), /PRIVATE_|blobPath|sourceRef|clientEmail|budgetUsd|nextAction|ownerId|tenantId/);
      assert.deepEqual(Object.keys(data.projects[0]).sort(), ['id','name','period','status','progress','location','commercialStage','documentCount'].sort());
      assert.deepEqual(Object.keys(data.estimates[0]).sort(), ['id','projectId','projectName','name','amountUsd','currency','estimatedOn','sourceLabel'].sort());
      assert.deepEqual(Object.keys(data.documents[0]).sort(), ['id','projectId','projectName','name','contentType','available','viewerHref','downloadHref'].sort());
    });
    await t.test('historical months expose general summary only and reject all detail requests', () => {
      const data = guestConsoleSnapshot(guest, { period: '2026-09', now });
      assert.equal(data.detailAllowed, false); assert.deepEqual(data.projects, []); assert.deepEqual(data.estimates, []); assert.deepEqual(data.documents, []);
      assert.equal(data.historicalSummary.months[0].lowUsd, 100);
      for (const section of ['projects','estimates','plans'] as const) assert.throws(() => guestConsoleSnapshot(guest, { period: '2026-09', section, now }), fails(403));
      assert.throws(() => guestConsoleSnapshot(guest, { period: '2026-11', now }), fails(403));
      assert.throws(() => guestConsoleSnapshot(guest, { period: '2026-99', now }), fails(422));
      assert.throws(() => guestConsoleSnapshot(guest, { section: 'private' as 'summary', now }), fails(422));
    });
    await t.test('document requests authorize exact tenant, project, period and lifecycle before raw lookup', () => {
      assert.equal(guestConsoleDocument(guest, 'current-doc', now).data.blobPath, 'PRIVATE_BLOB_SENTINEL/current-doc');
      for (const id of ['missing-id','past-doc','future-doc','cross-doc','past-parent-doc','future-parent-doc','unknown-parent-doc','deleted-parent-doc','deleted-doc','purged-doc','purging-doc','retry-doc','revoked-doc','revoked-status-doc','expired-doc','expired-timestamp-doc','bad-expiry','vendor-doc','explicit-past-doc', "current-doc' OR 1=1"])
        assert.throws(() => guestConsoleDocument(guest, id, now), fails(403), id);
      assert.throws(() => guestConsoleDocument(guest, 'current-doc', new Date('2026-11-01T00:00:00Z')), fails(403));
    });
    await t.test('forged assignments and role changes cannot promote a guest', () => {
      for (const actor of [{ ...guest, projectIds: ['current-project'] }, { ...guest, vendorId: 'vendor-forged' }, admin, { ...guest, tenantId: 'tenant-one\n' }]) {
        assert.throws(() => guestConsoleSnapshot(actor, { now }), fails(403));
        assert.throws(() => guestConsoleDocument(actor, 'current-doc', now), fails(403));
      }
      assert.throws(() => snapshot(guest), fails(403));
      assert.throws(() => execute(guest, 'write-forbidden', { action: 'create_project', name: 'forbidden' }), fails(403));
    });
    await t.test('a current explicit viewer grant admits an imported project without inventing source dates', () => {
      const relations = { schemaVersion: 'takeoff-viewer-relations/v1', bundleId: 'fixture-bundle', relationsId: 'relations-' + 'a'.repeat(64), manifestSha256: 'b'.repeat(64),
        contexts: [{ contextKey: 'context-one', displayName: 'Imported project', identityStatus: 'resolved', documentIds: ['viewer-one'] }],
        documents: [{ documentId: 'viewer-one', contextKeys: ['context-one'], assetIds: ['asset-one'], kind: 'drawing_pdf' }],
        assets: [{ assetId: 'asset-one', documentIds: ['viewer-one'] }] };
      const cohort = syntheticViewerCohort(folder,relations); process.env.TAYCO_TAKEOFF_MANIFEST_PATH=cohort.manifestPath;
      const bytes = cohort.rawRelations;
      process.env.TAYCO_TAKEOFF_RELATIONS_PATH = path.join(folder, 'relations.json');
      process.env.TAYCO_TAKEOFF_MAPPING_PATH = path.join(folder, 'mapping.json');
      writeFileSync(process.env.TAYCO_TAKEOFF_RELATIONS_PATH, bytes);
      const config = { schemaVersion: 'tayco-takeoff-viewer-access/v2', bundleId: 'fixture-bundle', relationsSha256: createHash('sha256').update(bytes).digest('hex'),
        mappings: [{ tenantId: guest.tenantId, projectId: 'unknown-import', contextKey: 'context-one', documents: [{ viewerDocumentId: 'viewer-one', erpDocumentId: 'viewer-doc' }] }],
        guestReviews: [{ tenantId: guest.tenantId, guestId: guest.id, projectId: 'unknown-import', period: '2026-10', viewerDocumentIds: ['viewer-one'] }] };
      writeFileSync(process.env.TAYCO_TAKEOFF_MAPPING_PATH, JSON.stringify(config));
      doc('viewer-doc', 'unknown-import', { ...cohort.delivery('viewer-one'), blobPath: null });
      const data = guestConsoleSnapshot(guest, { now });
      assert.ok(data.projects.some(p => p.id === 'unknown-import'));
      assert.equal(data.documents.find(d => d.id === 'viewer-doc')?.viewerHref, '/portal/takeoff/unknown-import');
      assert.equal(data.documents.find(d => d.id === 'viewer-doc')?.downloadHref, null);
      assert.ok(!data.estimates.some(e => e.id === 'unknown-parent-estimate' && e.estimatedOn === null));
      config.guestReviews[0].period = '2026-09';
      writeFileSync(process.env.TAYCO_TAKEOFF_MAPPING_PATH, JSON.stringify(config));
      assert.ok(!guestConsoleSnapshot(guest, { now }).projects.some(p => p.id === 'unknown-import'));
      assert.throws(() => guestConsoleDocument(guest, 'viewer-doc', now), fails(403));
      config.guestReviews[0].period = '2026-11';
      writeFileSync(process.env.TAYCO_TAKEOFF_MAPPING_PATH, JSON.stringify(config));
      assert.ok(!guestConsoleSnapshot(guest, { now }).projects.some(p => p.id === 'unknown-import'));
    });
    await t.test('bounded projections fail closed rather than publishing a partial answer', () => {
      db.exec('BEGIN');
      try { for (let i = 0; i < 5001; i++) project('bounded-' + i); db.exec('COMMIT'); }
      catch (error) { db.exec('ROLLBACK'); throw error; }
      assert.throws(() => guestConsoleSnapshot(guest, { now }), fails(503));
      assert.throws(() => guestConsoleDocument(guest, 'current-doc', now), fails(503));
    });
  } finally {
    db.close();
    for (const name of names) if (old[name] === undefined) delete process.env[name]; else process.env[name] = old[name];
    rmSync(folder, { recursive: true, force: true });
  }
});
