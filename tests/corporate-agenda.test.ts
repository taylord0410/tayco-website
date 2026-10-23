import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { provisionAdmin, createInvitation, acceptInvitation, getActor, type Actor } from '../lib/auth';
import { database, execute, snapshot, type Entry } from '../lib/erp';

const folder = mkdtempSync(path.join(tmpdir(), 'tayco-corporate-agenda-'));
process.env.TAYCO_AUTH_DB_PATH = path.join(folder, 'auth.sqlite');
process.env.TAYCO_ERP_DB_PATH = path.join(folder, 'erp.sqlite');
process.env.TAYCO_SESSION_SECRET = randomUUID() + randomUUID();
const password = randomUUID() + 'Aa1!';
let admin: Actor, staff: Actor, foreign: Actor, disabled: Actor, client: Actor, vendor: Actor, projectId: string, otherProjectId: string;
const run = (input: Record<string, unknown>, actor = admin, key = randomUUID()) => execute(actor, key, input);
const status = (expected: number) => (error: unknown) => Boolean(error && typeof error === 'object' && 'status' in error && error.status === expected);
const current = (id: string) => snapshot(admin).entries.find(entry => entry.id === id)!;
const meeting = () => ({ action: 'create_corporate_meeting', title: 'Synthetic corporate review', date: '2026-10-23', time: '09:30', location: 'Synthetic conference room', assigneeId: staff.id, notes: 'Synthetic internal discussion', priority: 'high' });
const followup = () => ({ action: 'create_followup', title: 'Synthetic next action', dueDate: '2026-10-24', assigneeId: staff.id, notes: 'Review the synthetic scope', priority: 'normal' });
before(async () => {
  const id = await provisionAdmin('agenda-owner@example.test', password); admin = { id, email: 'agenda-owner@example.test', role: 'admin', tenantId: 'tayco_llc', projectIds: [] };
  async function member(email: string, owner = admin) {
    const invite = createInvitation(owner, { email, role: 'staff', tenantId: owner.tenantId, projectIds: [] });
    const accepted = await acceptInvitation(invite.token, email, password);
    return (await getActor(new Request('http://localhost', { headers: { cookie: 'tayco_session=' + encodeURIComponent(accepted.cookie) } })))!;
  }
  staff = await member('agenda-staff@example.test'); foreign = await member('agenda-foreign@example.test', { ...admin, tenantId: 'other_company' }); disabled = await member('agenda-disabled@example.test');
  const auth = new DatabaseSync(process.env.TAYCO_AUTH_DB_PATH!); auth.prepare('UPDATE auth_users SET disabled=1 WHERE id=?').run(disabled.id); auth.close();
  projectId = run({ action: 'create_project', name: 'Synthetic agenda project' }).id; otherProjectId = run({ action: 'create_project', name: 'Other synthetic project' }).id;
  client = { ...admin, id: 'agenda-client', role: 'client', projectIds: [projectId] }; vendor = { ...client, id: 'agenda-vendor', role: 'vendor' };
});
after(() => { database().close(); try { rmSync(folder, { recursive: true, force: true }); } catch { /* Worker-scoped fixture handles only. */ } });

test('meetings and followups persist entered fields, current responsible account and explicit initial states', () => {
  const m = run(meeting()), f = run(followup(), staff);
  assert.equal(m.kind, 'corporate_meeting'); assert.equal(m.projectId, ''); assert.equal(m.data.status, 'scheduled'); assert.equal(m.data.time, '09:30'); assert.equal('timezone' in m.data, false);
  assert.equal(m.data.assigneeId, staff.id); assert.equal(m.data.assigneeEmail, staff.email); assert.equal(m.data.priority, 'high');
  assert.equal(f.kind, 'followup'); assert.equal(f.data.dueDate, '2026-10-24'); assert.equal(f.data.status, 'open');
  const persisted = new DatabaseSync(process.env.TAYCO_ERP_DB_PATH!);
  for (const entry of [m, f]) { const row = persisted.prepare('SELECT payload,version FROM records WHERE id=?').get(entry.id)!; assert.deepEqual(JSON.parse(String(row.payload)), entry.data); assert.equal(row.version, 1); }
  persisted.close(); assert.equal((m.data.history as unknown[]).length, 1);
  assert.equal(database().prepare('SELECT COUNT(*) AS count FROM outbox').get()!.count, 0, 'Saving internal agenda records sends nothing');
});

test('exact calendar dates, optional HH:MM time, required responsibility and bounded input reject malformed values atomically', () => {
  const count = () => snapshot(admin).entries.length, before = count();
  for (const patch of [{ date: '2026-02-30' }, { date: '2026-1-02' }, { time: '24:00' }, { time: '9:30' }, { time: '09:30Z' }, { title: '' }, { title: 'x'.repeat(201) }, { notes: 'x'.repeat(4001) }, { priority: 'critical' }, { assigneeId: '' }]) assert.throws(() => run({ ...meeting(), ...patch }), status(422));
  for (const dueDate of ['2026-02-29', 'invalid', '2026-10-23T00:00:00Z']) assert.throws(() => run({ ...followup(), dueDate }), status(422));
  assert.equal(count(), before);
  const key = randomUUID(); assert.throws(() => run({ ...meeting(), date: '2026-02-30' }, admin, key), status(422));
  const corrected = run({ ...meeting(), date: '2028-02-29', time: '' }, admin, key); assert.equal(corrected.data.date, '2028-02-29'); assert.equal(corrected.data.time, '');
});

test('responsible accounts must be active internal members in the same tenant on create and detail updates', () => {
  for (const assigneeId of [foreign.id, disabled.id, client.id, vendor.id, 'missing']) assert.throws(() => run({ ...meeting(), assigneeId }), status(422));
  const m = run(meeting());
  for (const assigneeId of [foreign.id, disabled.id, client.id]) assert.throws(() => run({ ...meeting(), action: 'update_corporate_meeting', id: m.id, version: m.version, assigneeId }), status(422));
  const updated = run({ ...meeting(), action: 'update_corporate_meeting', id: m.id, version: m.version, assigneeId: admin.id }); assert.equal(updated.data.assigneeEmail, admin.email);
});

test('idempotency, compare-and-swap, explicit state notes, audit and bounded history protect durable agenda records', () => {
  const key = randomUUID(), body = meeting(), created = run(body, admin, key), replay = run(body, admin, key); assert.equal(created.id, replay.id);
  assert.equal(database().prepare('SELECT COUNT(*) AS count FROM audit WHERE resource_id=?').get(created.id)!.count, 1);
  assert.throws(() => run({ ...body, title: 'Changed intent' }, admin, key), status(409));
  assert.throws(() => run({ ...meeting(), action: 'update_corporate_meeting', id: created.id, version: 1, status: 'completed' }), status(422));
  const changed = run({ ...meeting(), action: 'update_corporate_meeting', id: created.id, version: 1, date: '2026-10-25', priority: 'urgent', notes: 'Revised synthetic notes' }); assert.equal(changed.version, 2);
  assert.throws(() => run({ action: 'set_corporate_meeting_state', id: created.id, version: 1, status: 'completed', stateReason: 'Stale completion' }), status(409));
  assert.throws(() => run({ action: 'set_corporate_meeting_state', id: created.id, version: 2, status: 'completed', stateReason: '' }), status(422));
  assert.throws(() => run({ action: 'set_corporate_meeting_state', id: created.id, version: 2, status: 'open', stateReason: 'Invalid meeting state' }), status(422));
  const command = { action: 'set_corporate_meeting_state', id: created.id, version: 2, status: 'completed', stateReason: 'Synthetic review finished' }, stateKey = randomUUID();
  const completed = run(command, staff, stateKey); assert.equal(run(command, staff, stateKey).version, completed.version); assert.equal(completed.data.status, 'completed'); assert.equal(completed.data.priority, 'urgent');
  assert.equal((completed.data.history as unknown[]).length, 3); assert.ok(snapshot(admin).audit.some(event => event.action === 'set_corporate_meeting_state' && event.resource_id === created.id));
  const payload = JSON.parse(String(database().prepare('SELECT payload FROM records WHERE id=?').get(created.id)!.payload)); assert.equal(payload.stateReason, 'Synthetic review finished');
  database().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify({ ...completed.data, history: Array.from({ length: 100 }, () => ({ action: 'fixture' })) }), created.id);
  assert.throws(() => run({ action: 'set_corporate_meeting_state', id: created.id, version: 3, status: 'scheduled', stateReason: 'History full' }), status(422));
  assert.equal(current(created.id).version, 3);
});

test('followups support priority/detail changes, explicit work states and retained notes', () => {
  let f: Entry = run(followup());
  for (const state of ['in_progress', 'completed', 'open', 'cancelled']) {
    f = run({ action: 'set_followup_state', id: f.id, version: f.version, status: state, stateReason: 'Synthetic state evidence: ' + state }); assert.equal(f.data.status, state);
  }
  f = run({ ...followup(), action: 'update_followup', id: f.id, version: f.version, dueDate: '2026-11-01', priority: 'low', notes: 'Retained correction' });
  assert.equal(f.data.status, 'cancelled'); assert.equal(f.data.priority, 'low'); assert.equal(f.data.notes, 'Retained correction'); assert.equal((f.data.history as unknown[]).length, 6);
  assert.throws(() => run({ action: 'set_followup_state', id: f.id, version: f.version, status: 'cancelled', stateReason: 'Same state' }), status(409));
});

test('external roles and other tenants cannot read, update or replay internal agenda records even with project assignments', () => {
  const m = run({ ...meeting(), projectId }), f = run({ ...followup(), projectId });
  for (const actor of [client, vendor]) {
    assert.ok(!snapshot(actor).entries.some(entry => [m.id, f.id].includes(entry.id)));
    for (const body of [meeting(), followup(), { action: 'update_corporate_meeting', id: m.id, version: 1 }, { action: 'set_followup_state', id: f.id, version: 1, status: 'completed', stateReason: 'Forbidden' }]) assert.throws(() => run(body, actor), status(403));
  }
  assert.ok(!snapshot(foreign).entries.some(entry => [m.id, f.id].includes(entry.id)));
  assert.throws(() => run({ ...meeting(), action: 'update_corporate_meeting', id: m.id, version: 1 }, foreign), status(404));
  const key = randomUUID(), created = run(meeting(), admin, key); assert.throws(() => run(meeting(), { ...admin, role: 'client' }, key), status(409)); assert.equal(current(created.id).version, 1);
});

test('optional project links validate tenant and immutable scope without mutating either project', () => {
  const foreignProject = run({ action: 'create_project', name: 'Other tenant agenda scope' }, foreign);
  assert.throws(() => run({ ...meeting(), projectId: foreignProject.id }), status(404)); assert.throws(() => run({ ...followup(), projectId: 'missing-project' }), status(404));
  const m = run({ ...meeting(), projectId }); assert.equal(m.projectId, projectId);
  assert.throws(() => run({ ...meeting(), action: 'update_corporate_meeting', id: m.id, version: 1, projectId: otherProjectId }), status(422));
  assert.throws(() => run({ action: 'set_followup_state', id: m.id, version: 1, status: 'completed', stateReason: 'Wrong record kind' }), status(404));
  assert.equal(current(projectId).version, 1); assert.equal(current(otherProjectId).version, 1); assert.equal(current(m.id).projectId, projectId);
});
