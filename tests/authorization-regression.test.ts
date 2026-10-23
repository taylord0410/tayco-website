import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Actor } from '../lib/auth';
import { database, execute, snapshot, ErpError } from '../lib/erp';

test('authorization regression: replay cannot recover revoked or newly private records', async t => {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-authorization-'));
  const previous = process.env.TAYCO_ERP_DB_PATH;
  process.env.TAYCO_ERP_DB_PATH = path.join(folder, 'erp.sqlite');
  const admin: Actor = { id: 'fixture-admin', email: 'admin@example.test', role: 'admin', tenantId: 'fixture-company', projectIds: [] };
  const denied = (error: unknown) => error instanceof ErpError && [403, 404, 409].includes(error.status);
  try {
    const createKey = randomUUID(); const createBody = { action: 'create_project', name: 'Isolated fixture project', budgetUsd: 12345 };
    const project = execute(admin, createKey, createBody);
    const client: Actor = { id: 'fixture-client', email: 'client@example.test', role: 'client', tenantId: admin.tenantId, projectIds: [project.id] };
    const vendor: Actor = { id: 'fixture-vendor', email: 'vendor@example.test', role: 'vendor', tenantId: admin.tenantId, projectIds: [project.id], vendorId: 'fixture-vendor-record' };
    await t.test('demoted user cannot replay an earlier internal command', () => {
      const demoted: Actor = { ...admin, role: 'client', projectIds: [] };
      assert.equal(snapshot(demoted).entries.length, 0);
      assert.throws(() => execute(demoted, createKey, createBody), denied);
    });
    await t.test('removed project assignment also invalidates a previously valid replay', () => {
      const key = randomUUID(); const body = { action: 'add_note', projectId: project.id, title: 'Fixture note', details: 'Fixture update' };
      execute(client, key, body);
      assert.throws(() => execute({ ...client, projectIds: [] }, key, body), denied);
    });
    await t.test('current record visibility is checked even when actor scope is unchanged', () => {
      const key = randomUUID(); const body = { action: 'add_note', projectId: project.id, title: 'Fixture client note', details: 'Fixture content' };
      const note = execute(client, key, body);
      // Simulate a team member making the record private after the original operation.
      database().prepare('UPDATE records SET payload=?,version=version+1 WHERE id=?').run(JSON.stringify({ ...note.data, visibility: 'internal' }), note.id);
      assert.equal(snapshot(client).entries.some(e => e.id === note.id), false);
      assert.throws(() => execute(client, key, body), denied);
    });
    await t.test('supplier does not receive client changes or other people’s private notes', () => {
      const change = execute(client, randomUUID(), { action: 'request_change', projectId: project.id, title: 'Fixture commercial request', details: 'Client and team conversation' });
      const privateNote = execute(admin, randomUUID(), { action: 'add_note', projectId: project.id, title: 'Fixture internal note', details: 'Internal team conversation' });
      const clientNote = execute(client, randomUUID(), { action: 'add_note', projectId: project.id, title: 'Fixture client update', details: 'Client and team update' });
      const supplierNote = execute(vendor, randomUUID(), { action: 'add_note', projectId: project.id, title: 'Fixture supplier note', details: 'Supplier and team update' });
      const visible = snapshot(vendor).entries.map(e => e.id);
      assert.equal(visible.includes(change.id), false); assert.equal(visible.includes(privateNote.id), false); assert.equal(visible.includes(clientNote.id), false); assert.equal(visible.includes(supplierNote.id), true);
      assert.equal(snapshot({ ...vendor, id: 'other-supplier', vendorId: 'other-record' }).entries.some(e => e.id === supplierNote.id), false);
      assert.equal(snapshot(client).entries.some(e => e.id === privateNote.id), false);
      assert.equal(snapshot(vendor).entries.find(e => e.id === project.id)?.data.budgetUsd, undefined);
    });
    await t.test('a stale version conflicts instead of overwriting a newer update', () => {
      const updated = execute(admin, randomUUID(), { action: 'update_project', id: project.id, version: project.version, status: 'active', progress: 25, nextAction: 'Fixture next action' });
      assert.equal(updated.version, project.version + 1);
      assert.throws(() => execute(admin, randomUUID(), { action: 'update_project', id: project.id, version: project.version, status: 'closed', progress: 100, nextAction: 'Stale fixture' }), error => error instanceof ErpError && error.status === 409);
      assert.equal(snapshot(admin).entries.find(e => e.id === project.id)?.data.progress, 25);
    });
  } finally { database().close(); if (previous === undefined) delete process.env.TAYCO_ERP_DB_PATH; else process.env.TAYCO_ERP_DB_PATH = previous; rmSync(folder, { recursive: true, force: true }); }
});
