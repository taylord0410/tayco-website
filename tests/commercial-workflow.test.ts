import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Actor } from '../lib/auth';
import type { CommercialStageRecord } from '../lib/commercial-stages';
import { database, execute, snapshot, ErpError, type Data, type Entry } from '../lib/erp';

const admin: Actor = { id: 'fixture-admin', email: 'admin@example.test', role: 'admin', tenantId: 'fixture-company', projectIds: [] };
const staff: Actor = { ...admin, id: 'fixture-staff', role: 'staff' };
const source = 'Private fixture company report: three earlier steps completed; actual occurrence dates unknown.';
const priorStages = ['contacted', 'meeting_scheduled', 'estimate_provided'];
const denied = (status: number) => (error: unknown) => error instanceof ErpError && error.status === status;
const command = (entry: Entry, fields: Data = {}) => ({ action: 'record_commercial_stage', id: entry.id, version: entry.version, currentStage: 'awaiting_insurance_information', source, reportedCompletedStages: priorStages, ...fields });
const progress = (entry: Entry) => entry.data.commercialProgress as CommercialStageRecord;
const read = (id: string): Entry => snapshot(admin).entries.find(entry => entry.id === id)!;
async function fixture(run: () => Promise<void> | void) {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-commercial-workflow-'));
  const previous = { TAYCO_ERP_DB_PATH: process.env.TAYCO_ERP_DB_PATH, TAYCO_AUTH_DB_PATH: process.env.TAYCO_AUTH_DB_PATH };
  process.env.TAYCO_ERP_DB_PATH = path.join(folder, 'erp.sqlite');
  process.env.TAYCO_AUTH_DB_PATH = path.join(folder, 'auth.sqlite');
  try { await run(); }
  finally {
    database().close();
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    rmSync(folder, { recursive: true, force: true });
  }
}
function project() { return execute(admin, randomUUID(), { action: 'create_project', name: 'Synthetic workflow fixture' }); }
function lead() { return execute(admin, randomUUID(), { action: 'create_lead', name: 'Synthetic lead fixture', email: 'lead@example.test', details: 'Isolated commercial workflow test fixture.' }); }
function auditCount() { return Number(database().prepare('SELECT count(*) AS count FROM audit').get()!.count); }
function commandCount() { return Number(database().prepare('SELECT count(*) AS count FROM commands').get()!.count); }

test('explicit company report records three prior steps with unknown dates without changing execution or proposal state', async () => {
  await fixture(() => {
    const item = project();
    const proposal = execute(admin, randomUUID(), { action: 'create_proposal', projectId: item.id, reference: 'FIXTURE-PROP-1', title: 'Synthetic proposal fixture', clientName: 'Synthetic fixture client', amountUsd: 1234, currency: 'USD', source: 'Isolated fixture source', issuedOn: '2025-01-01', validUntil: '' });
    const before = snapshot(admin).entries;
    const start = Date.now();
    const result = execute(staff, randomUUID(), command(item, { occurredOn: null }));
    assert.equal(result.version, item.version + 1);
    assert.equal(progress(result).currentStage, 'awaiting_insurance_information');
    assert.equal(progress(result).source, source);
    assert.deepEqual(progress(result).reportedCompletedStages, priorStages);
    assert.equal(progress(result).occurredOn, null);
    assert.equal(progress(result).actorId, staff.id);
    assert.ok(Date.parse(progress(result).recordedAt) >= start);
    assert.ok(Date.parse(progress(result).recordedAt) <= Date.now());
    const { history, ...current } = progress(result);
    assert.equal(history.length, 1);
    assert.deepEqual(history[0], current);
    const rest = { ...result.data }; delete rest.commercialProgress;
    assert.deepEqual(rest, item.data);
    assert.equal(result.data.status, 'planning');
    assert.equal(result.data.progress, null);
    for (const field of ['contacts', 'meetingDate', 'proposalId', 'insuranceVerified', 'completedOn']) assert.equal(result.data[field], undefined);
    const after = snapshot(admin).entries;
    assert.equal(after.length, before.length);
    for (const other of before.filter(entry => entry.id !== item.id)) assert.deepEqual(after.find(entry => entry.id === other.id), other);
    assert.deepEqual(after.find(entry => entry.id === proposal.id), proposal);
    assert.equal(proposal.data.status, 'draft');
    assert.deepEqual(after.filter(entry => ['corporate_meeting', 'invoice', 'estimate'].includes(entry.kind)), []);
    const audit = database().prepare("SELECT actor_id,action,resource_id FROM audit WHERE action='record_commercial_stage'").all();
    assert.deepEqual(audit.map(row => ({ ...row })), [{ actor_id: staff.id, action: 'record_commercial_stage', resource_id: item.id }]);
    assert.ok(database().prepare("SELECT id FROM audit WHERE action='update_project' AND resource_id=?").get(item.id));
  });
});

test('lead progress preserves lead state and carries only explicitly reported completion steps', async () => {
  await fixture(() => {
    const initial = lead();
    const waiting = execute(admin, randomUUID(), { action: 'update_lead', id: initial.id, version: initial.version, status: 'waiting', nextAction: 'Fixture source review' });
    const first = execute(admin, randomUUID(), command(waiting, { currentStage: 'estimate_provided', reportedCompletedStages: ['contacted'], occurredOn: '2025-01-15' }));
    assert.deepEqual(progress(first).reportedCompletedStages, ['contacted']);
    assert.equal(progress(first).occurredOn, '2025-01-15');
    assert.equal(first.data.status, 'waiting');
    const secondBody = command(first);
    delete (secondBody as Data).reportedCompletedStages;
    const second = execute(staff, randomUUID(), secondBody);
    assert.deepEqual(progress(second).reportedCompletedStages, ['contacted']);
    assert.equal(progress(second).occurredOn, null);
    assert.equal(progress(second).history.length, 2);
    assert.equal(second.data.status, 'waiting');
    assert.equal(second.data.nextAction, waiting.data.nextAction);
    const rest = { ...second.data }; delete rest.commercialProgress;
    assert.deepEqual(rest, waiting.data);
    const forward = execute(admin, randomUUID(), command(project(), { reportedCompletedStages: [] }));
    assert.deepEqual(progress(forward).reportedCompletedStages, []);
  });
});

test('commercial commands use existing version, transaction and idempotency guards', async () => {
  await fixture(() => {
    const item = project();
    const key = randomUUID();
    const body = command(item);
    const first = execute(admin, key, body);
    const writtenAudits = auditCount();
    const writtenCommands = commandCount();
    assert.deepEqual(execute(admin, key, body), first);
    assert.equal(auditCount(), writtenAudits);
    assert.equal(commandCount(), writtenCommands);
    assert.equal(progress(read(item.id)).history.length, 1);
    assert.throws(() => execute(admin, key, { ...body, source: 'Different fixture source' }), denied(409));
    assert.throws(() => execute(admin, randomUUID(), body), denied(409));
    assert.equal(auditCount(), writtenAudits);
    assert.equal(commandCount(), writtenCommands);
    const next = execute(staff, randomUUID(), command(first, { currentStage: 'insurance_information_received', reportedCompletedStages: [...priorStages, 'awaiting_insurance_information'], occurredOn: '2025-01-20', source: 'Private fixture: company explicitly reports information received.' }));
    assert.equal(next.version, first.version + 1);
    assert.equal(progress(next).history.length, 2);
    assert.deepEqual(progress(next).history[0], progress(first).history[0]);
    assert.deepEqual(execute(admin, key, body), first);
    assert.equal(progress(read(item.id)).history.length, 2);
    // A rejected stale write cannot create partial history, command receipts or audit rows.
    const counts = { audits: auditCount(), commands: commandCount() };
    assert.throws(() => execute(admin, randomUUID(), command(first)), denied(409));
    assert.deepEqual({ audits: auditCount(), commands: commandCount() }, counts);
    assert.deepEqual(read(item.id), next);
  });
});

test('noninternal, cross-company and wrong-kind commands cannot record commercial progress', async () => {
  await fixture(() => {
    const item = project();
    const body = command(item);
    const before = { audits: auditCount(), commands: commandCount() };
    for (const role of ['client', 'vendor', 'guest'] as const) {
      const actor: Actor = { ...admin, id: 'fixture-outsider', role, projectIds: [item.id], vendorId: role === 'vendor' ? 'fixture-vendor' : undefined };
      assert.throws(() => execute(actor, randomUUID(), body), denied(403));
    }
    assert.throws(() => execute({ ...admin, tenantId: 'different-company' }, randomUUID(), body), denied(404));
    assert.throws(() => execute(staff, randomUUID(), { ...body, id: 'missing-record' }), denied(404));
    assert.deepEqual({ audits: auditCount(), commands: commandCount() }, before);
    const proposal = execute(admin, randomUUID(), { action: 'create_proposal', projectId: item.id, reference: 'FIXTURE-PROP-2', title: 'Synthetic proposal fixture', clientName: 'Synthetic fixture client', amountUsd: 10, source: 'Isolated fixture source', issuedOn: '2025-01-01', validUntil: '' });
    assert.throws(() => execute(admin, randomUUID(), command(proposal)), denied(422));
    assert.equal(read(item.id).data.commercialProgress, undefined);
    assert.equal(read(proposal.id).data.commercialProgress, undefined);
    const key = randomUUID();
    execute(admin, key, body);
    assert.throws(() => execute({ ...admin, role: 'client', projectIds: [item.id] }, key, body), denied(409));
  });
});

test('commercial source and history stay absent from assigned client and vendor snapshots and command responses', async () => {
  await fixture(() => {
    const item = project();
    const written = execute(admin, randomUUID(), command(item));
    const client: Actor = { id: 'fixture-client', email: 'client@example.test', role: 'client', tenantId: admin.tenantId, projectIds: [item.id] };
    const vendor: Actor = { ...client, id: 'fixture-vendor', role: 'vendor', vendorId: 'fixture-vendor-record' };
    for (const actor of [client, vendor]) {
      const data = snapshot(actor);
      assert.ok(data.entries.find(entry => entry.id === item.id));
      assert.equal(data.entries.find(entry => entry.id === item.id)!.data.commercialProgress, undefined);
      assert.equal(JSON.stringify(data).includes(source), false);
      assert.equal(JSON.stringify(data).includes('reportedCompletedStages'), false);
      assert.deepEqual(data.audit, []);
    }
    assert.deepEqual(progress(read(item.id)), progress(written));
    // Exercise the common exposed() path for an idempotent project response under current client access.
    const key = randomUUID();
    const body = { action: 'fixture_cached_response', id: item.id };
    const hash = createHash('sha256').update(JSON.stringify({ role: client.role, projects: [...client.projectIds].sort(), vendorId: null, input: body })).digest('hex');
    database().prepare('INSERT INTO commands VALUES(?,?,?,?,?)').run(client.tenantId, client.id, key, hash, JSON.stringify(written));
    const replay = execute(client, key, body);
    assert.equal(replay.data.commercialProgress, undefined);
    assert.equal(JSON.stringify(replay).includes(source), false);
  });
});

test('strict field and occurrence validation rolls back malformed commercial reports', async () => {
  await fixture(() => {
    const item = project();
    const baseline = { audits: auditCount(), commands: commandCount() };
    const invalid: Data[] = [
      { source: '' }, { source: 'x'.repeat(1001) }, { currentStage: 'unknown' },
      { occurredOn: '2025-02-30' }, { occurredOn: '2999-01-01' }, { occurredOn: '2025-01-01T00:00:00Z' },
      { reportedCompletedStages: ['contacted', 'contacted'] },
      { reportedCompletedStages: ['awaiting_insurance_information'] },
      { reportedCompletedStages: ['insurance_information_received'] },
      { reportedCompletedStages: ['unknown'] }, { reportedCompletedStages: 'contacted' },
      { actorId: 'spoofed' }, { recordedAt: '2025-01-01T00:00:00Z' }, { tenantId: 'other-company' },
      { history: [] }, { status: 'active' }, { projectId: item.id }, { arbitrary: true },
    ];
    for (const fields of invalid) assert.throws(() => execute(admin, randomUUID(), command(item, fields)), denied(400), JSON.stringify(fields));
    assert.deepEqual({ audits: auditCount(), commands: commandCount() }, baseline);
    assert.deepEqual(read(item.id), item);
    const normalized = execute(admin, randomUUID(), command(item, { reportedCompletedStages: ['estimate_provided', 'contacted', 'meeting_scheduled'] }));
    assert.deepEqual(progress(normalized).reportedCompletedStages, priorStages);
    const malformed = { ...normalized.data, commercialProgress: { ...progress(normalized), history: [] } };
    database().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify(malformed), item.id);
    const beforeRejected = { audits: auditCount(), commands: commandCount() };
    assert.throws(() => execute(admin, randomUUID(), command(normalized)), denied(409));
    assert.deepEqual({ audits: auditCount(), commands: commandCount() }, beforeRejected);
  });
});
