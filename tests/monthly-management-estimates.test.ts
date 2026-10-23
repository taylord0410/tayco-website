import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Actor } from '../lib/auth';
import { financialPeriods } from '../lib/financial-periods';
import { guestMonthlyEstimateSummary, listMonthlyManagementEstimates, saveMonthlyManagementEstimate,
  MonthlyManagementEstimateError, type MonthlyManagementEstimateInput } from '../lib/monthly-management-estimates';

const admin: Actor = { id: 'fixture-admin', email: 'admin@example.test', role: 'admin', tenantId: 'fixture-company', projectIds: [] };
const staff: Actor = { ...admin, id: 'fixture-staff', role: 'staff' };
const guest = { ...admin, id: 'fixture-guest', role: 'guest' } as Actor;
const other: Actor = { ...admin, tenantId: 'other-company' };
const input = (period = '2026-01'): MonthlyManagementEstimateInput => ({ period, lowUsd: 200000, highUsd: 500000, source: 'Company management statement; isolated fixture', expectedVersion: 0 });
const fails = (status: number) => (error: unknown) => error instanceof MonthlyManagementEstimateError && error.status === status;

/** Each case uses a fresh disposable database. Never opens the configured operational database. */
function fixture(run: (file: string) => void) {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-monthly-estimates-'));
  const previous = process.env.TAYCO_ERP_DB_PATH;
  const file = path.join(folder, 'erp.sqlite'); process.env.TAYCO_ERP_DB_PATH = file;
  try { run(file); }
  finally { if (previous === undefined) delete process.env.TAYCO_ERP_DB_PATH; else process.env.TAYCO_ERP_DB_PATH = previous; rmSync(folder, { recursive: true, force: true }); }
}
function sql<T>(file: string, run: (db: DatabaseSync) => T): T { const db = new DatabaseSync(file); try { return run(db); } finally { db.close(); } }
function counts(file: string) { return sql(file, db => ['monthly_management_estimates', 'monthly_management_estimate_history', 'monthly_management_estimate_audit', 'monthly_management_estimate_requests'].map(table => Number(db.prepare(`SELECT count(*) AS n FROM ${table}`).get()!.n))); }

test('role guards execute before storage, and only internal actors get raw rows', () => fixture(file => {
  for (const role of ['guest', 'client', 'vendor', 'unknown']) {
    const actor = { ...admin, role } as Actor;
    assert.throws(() => listMonthlyManagementEstimates(actor), fails(403));
    assert.throws(() => saveMonthlyManagementEstimate(actor, 'fixture-request-001', input()), fails(403));
  }
  for (const role of ['client', 'vendor', 'unknown']) assert.throws(() => guestMonthlyEstimateSummary({ ...admin, role } as Actor), fails(403));
  assert.throws(() => listMonthlyManagementEstimates({ ...admin, tenantId: '' }), fails(403));
  assert.equal(existsSync(file), false);
  assert.deepEqual(listMonthlyManagementEstimates(admin), []);
  const first = saveMonthlyManagementEstimate(staff, 'fixture-request-001', input());
  assert.equal(first.authorId, staff.id); assert.equal(first.version, 1);
  assert.equal(listMonthlyManagementEstimates(admin).length, 1);
  assert.equal(Object.getPrototypeOf(first), Object.prototype);
}));

test('company scope is server-owned for reads, writes, receipts and guest summaries', () => fixture(() => {
  const value = saveMonthlyManagementEstimate(admin, 'fixture-request-001', input());
  assert.deepEqual(listMonthlyManagementEstimates(other), []);
  assert.equal(guestMonthlyEstimateSummary({ ...guest, tenantId: other.tenantId }, undefined, new Date('2026-10-23T00:00:00Z')).months.length, 0);
  assert.throws(() => saveMonthlyManagementEstimate(admin, 'fixture-request-002', { ...input(), tenantId: other.tenantId }), fails(422));
  const foreign = saveMonthlyManagementEstimate(other, 'fixture-request-001', { ...input(), lowUsd: 100 });
  assert.equal(foreign.tenantId, other.tenantId); assert.equal(foreign.lowUsd, 100);
  assert.deepEqual(listMonthlyManagementEstimates(admin), [value]);
}));

test('schema, period, source, version, amount and request-reference validation fail closed', () => fixture(file => {
  const invalid: unknown[] = [null, [], 'text', Object.create(input()), { ...input(), currency: 'USD' }, { ...input(), authorId: admin.id }, { ...input(), source: { note: 'unvalidated' } },
    ...['', ' ', 'x'.repeat(1001), 'line\nsource', '\u0000source'].map(source => ({ ...input(), source })),
    ...['2026-00', '2026-13', '2026-1', '2026-02-01', '1899-12', '10000-01'].map(period => ({ ...input(), period })),
    ...[-1, 1.1, '0', undefined, null, Number.MAX_SAFE_INTEGER + 1].map(expectedVersion => ({ ...input(), expectedVersion })),
    ...[-1, NaN, Infinity, '1', 1.001, 1e10 + 1].map(lowUsd => ({ ...input(), lowUsd })), { ...input(), lowUsd: 500001 }, { ...input(), highUsd: 1.001 }];
  for (const value of invalid) assert.throws(() => saveMonthlyManagementEstimate(admin, 'fixture-request-001', value), fails(422));
  for (const key of ['', 'short', 'key with spaces that is invalid', 'a'.repeat(101)]) assert.throws(() => saveMonthlyManagementEstimate(admin, key, input()), fails(422));
  assert.equal(existsSync(file), false);
  const cents = saveMonthlyManagementEstimate(admin, 'fixture-request-001', { ...input(), lowUsd: 0.1, highUsd: 0.29 });
  assert.equal(cents.lowUsd, 0.1); assert.equal(cents.highUsd, 0.29);
  assert.deepEqual(saveMonthlyManagementEstimate(admin, 'fixture-request-001', { ...input(), lowUsd: 0.1, highUsd: 0.29 }), cents);
  assert.equal(saveMonthlyManagementEstimate(admin, 'fixture-request-002', { ...input('2026-02'), lowUsd: 0, highUsd: 0 }).highUsd, 0);
}));

test('exact request replay returns the original receipt and rejects conflicting payload', () => fixture(file => {
  const first = saveMonthlyManagementEstimate(admin, 'fixture-request-001', input());
  assert.deepEqual(saveMonthlyManagementEstimate(admin, 'fixture-request-001', input()), first);
  assert.throws(() => saveMonthlyManagementEstimate(admin, 'fixture-request-001', { ...input(), highUsd: 600000 }), fails(409));
  assert.throws(() => saveMonthlyManagementEstimate(admin, 'fixture-request-001', { ...input(), expectedVersion: 1 }), fails(409));
  const revised = saveMonthlyManagementEstimate(staff, 'fixture-request-002', { ...input(), highUsd: 600000, expectedVersion: 1 });
  assert.equal(revised.version, 2);
  assert.deepEqual(saveMonthlyManagementEstimate(admin, 'fixture-request-001', input()), first);
  assert.equal(listMonthlyManagementEstimates(admin)[0].version, 2);
  assert.deepEqual(counts(file), [1, 2, 2, 2]);
}));

test('semantic no-op with new key preserves author, timestamps, version and history', () => fixture(file => {
  const first = saveMonthlyManagementEstimate(admin, 'fixture-request-001', input());
  const repeat = saveMonthlyManagementEstimate(staff, 'fixture-request-002', { ...input(), source: ` ${input().source} ` });
  assert.deepEqual(repeat, first);
  assert.deepEqual(saveMonthlyManagementEstimate(staff, 'fixture-request-002', input()), first);
  assert.deepEqual(counts(file), [1, 1, 1, 2]);
}));

test('changed ranges and attribution require the current version and preserve history', () => fixture(file => {
  assert.throws(() => saveMonthlyManagementEstimate(admin, 'fixture-request-000', { ...input(), expectedVersion: 1 }), fails(409));
  const first = saveMonthlyManagementEstimate(admin, 'fixture-request-001', input());
  assert.throws(() => saveMonthlyManagementEstimate(staff, 'fixture-request-002', { ...input(), lowUsd: 250000 }), fails(409));
  assert.throws(() => saveMonthlyManagementEstimate(staff, 'fixture-request-002', { ...input(), source: 'Changed attribution' }), fails(409));
  const second = saveMonthlyManagementEstimate(staff, 'fixture-request-002', { ...input(), lowUsd: 250000, expectedVersion: 1 });
  assert.equal(second.version, 2); assert.equal(second.authorId, staff.id); assert.equal(second.recordedAt, first.recordedAt);
  assert.throws(() => saveMonthlyManagementEstimate(admin, 'fixture-request-003', { ...input(), highUsd: 600000, expectedVersion: 1 }), fails(409));
  const third = saveMonthlyManagementEstimate(admin, 'fixture-request-003', { ...input(), lowUsd: 250000, source: 'Updated company attribution', expectedVersion: 2 });
  assert.equal(third.version, 3);
  assert.deepEqual(counts(file), [1, 3, 3, 3]);
  sql(file, db => {
    const history = db.prepare('SELECT version,low_cents,source,author_id FROM monthly_management_estimate_history ORDER BY version').all();
    assert.deepEqual(history.map(row => row.version), [1, 2, 3]);
    assert.equal(history[0].low_cents, 20000000); assert.equal(history[1].author_id, staff.id); assert.equal(history[2].source, third.source);
  });
}));

test('audit failure rolls back current value, history and receipt; original key can retry', () => fixture(file => {
  const first = saveMonthlyManagementEstimate(admin, 'fixture-request-001', input());
  sql(file, db => db.exec("CREATE TRIGGER fixture_reject_audit BEFORE INSERT ON monthly_management_estimate_audit BEGIN SELECT RAISE(ABORT,'injected audit failure'); END"));
  assert.throws(() => saveMonthlyManagementEstimate(staff, 'fixture-request-002', { ...input(), lowUsd: 250000, expectedVersion: 1 }), fails(503));
  assert.deepEqual(listMonthlyManagementEstimates(admin), [first]); assert.deepEqual(counts(file), [1, 1, 1, 1]);
  sql(file, db => db.exec('DROP TRIGGER fixture_reject_audit'));
  assert.equal(saveMonthlyManagementEstimate(staff, 'fixture-request-002', { ...input(), lowUsd: 250000, expectedVersion: 1 }).version, 2);
  assert.deepEqual(counts(file), [1, 2, 2, 2]);
}));

test('receipt failure rolls back a new month, history and audit together', () => fixture(file => {
  listMonthlyManagementEstimates(admin);
  sql(file, db => db.exec("CREATE TRIGGER fixture_reject_receipt BEFORE INSERT ON monthly_management_estimate_requests BEGIN SELECT RAISE(ABORT,'injected receipt failure'); END"));
  assert.throws(() => saveMonthlyManagementEstimate(admin, 'fixture-request-001', input()), fails(503));
  assert.deepEqual(counts(file), [0, 0, 0, 0]);
  sql(file, db => db.exec('DROP TRIGGER fixture_reject_receipt'));
  assert.equal(saveMonthlyManagementEstimate(admin, 'fixture-request-001', input()).version, 1);
}));

test('guest projection includes multiple historical months and only the documented plain DTO', () => fixture(() => {
  for (const period of ['2025-01', '2025-12', '2026-01', '2026-02', '2026-09', '2026-10', '2026-11', '2027-01'])
    saveMonthlyManagementEstimate(admin, `fixture-request-${period}`, input(period));
  const summary = guestMonthlyEstimateSummary({ ...guest, projectIds: ['forged-project'], vendorId: 'forged-vendor' }, undefined, new Date('2026-10-23T20:00:00Z'));
  assert.deepEqual(Object.keys(summary).sort(), ['currency', 'asOf', 'reportingTimeZone', 'year', 'availableYears', 'months'].sort());
  assert.deepEqual(summary.availableYears, [2026, 2025]);
  assert.deepEqual(summary.months.map(row => row.period), ['2026-01', '2026-02', '2026-09']);
  for (const month of summary.months) {
    assert.deepEqual(Object.keys(month).sort(), ['period', 'lowUsd', 'highUsd', 'basis', 'updatedAt'].sort());
    assert.equal(month.basis, 'management_estimate'); assert.equal(Object.getPrototypeOf(month), Object.prototype);
  }
  assert.equal(Object.getPrototypeOf(summary), Object.prototype);
  const serialized = JSON.stringify(summary);
  for (const forbidden of ['source', 'authorId', 'tenantId', 'fixture-admin', 'fixture-company', 'projectId', 'version', 'Company management statement']) assert.ok(!serialized.includes(forbidden), forbidden);
  assert.deepEqual(guestMonthlyEstimateSummary(guest, { year: '2025' }, new Date('2026-10-23Z')).months.map(row => row.period), ['2025-01', '2025-12']);
  assert.deepEqual(guestMonthlyEstimateSummary(guest, { year: '2026', month: '02' }, new Date('2026-10-23Z')).months.map(row => row.period), ['2026-02']);
}));

test('UTC January rollover defaults to the previous year and permits twelve older months', () => fixture(() => {
  for (let month = 1; month <= 12; month++) {
    const period = `2025-${String(month).padStart(2, '0')}`;
    saveMonthlyManagementEstimate(admin, `fixture-request-${period}`, input(period));
  }
  saveMonthlyManagementEstimate(admin, 'fixture-request-2026-01', input('2026-01'));
  const january = new Date('2025-12-31T20:00:00-04:00');
  const summary = guestMonthlyEstimateSummary(guest, undefined, january);
  assert.equal(summary.year, 2025); assert.equal(summary.months.length, 12); assert.equal(summary.months[11].period, '2025-12');
  assert.equal(summary.asOf, '2026-01-01T00:00:00.000Z'); assert.equal(summary.reportingTimeZone, 'UTC');
  assert.deepEqual(guestMonthlyEstimateSummary(guest, { year: 2026 }, january).months, []);
  assert.throws(() => guestMonthlyEstimateSummary(guest, { year: 2026, month: 1 }, january), fails(422));
  assert.equal(guestMonthlyEstimateSummary(guest, { year: 2026 }, new Date('2026-02-01T00:00:00Z')).months[0].period, '2026-01');
  assert.equal(guestMonthlyEstimateSummary(guest, { year: 2026 }, new Date('2026-01-31T23:59:59.999Z')).months.length, 0);
}));

test('client cannot authorize a current/future period or supply an asOf clock', () => fixture(file => {
  const now = new Date('2026-10-01T00:00:00Z');
  for (const selection of [{ year: 2026, month: 10 }, { year: 2026, month: 11 }, { year: 2027 }, { month: 1 }, { year: 1899 }, { year: '2026.0' }, { year: 2026, month: 13 }, { year: 2026, asOf: '2030-01-01' }, { tenantId: 'other-company' }])
    assert.throws(() => guestMonthlyEstimateSummary(guest, selection, now), fails(422));
  assert.throws(() => guestMonthlyEstimateSummary(guest, undefined, new Date(NaN)), fails(422));
  assert.equal(existsSync(file), false);
}));

test('actual financial reporting and generic schema/version remain unchanged', () => fixture(file => {
  const actual = { id: 'invoice-fixture', kind: 'invoice' as const, tenantId: admin.tenantId, projectId: 'project-fixture', ownerId: admin.id, version: 1, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', data: { issuedOn: '2026-01-01', amountUsd: 1234.56, status: 'approved', audience: 'client', payments: [{ id: 'payment-fixture', amountUsd: 100, occurredOn: '2026-01-02', reference: 'private payment ref', recordedAt: '2026-01-02T00:00:00Z' }] } };
  const report = () => financialPeriods([actual], { year: 2026, month: null, asOf: '2026-10-23T00:00:00Z' });
  const before = report();
  sql(file, db => { db.exec('PRAGMA user_version=37; CREATE TABLE records(id TEXT PRIMARY KEY,payload TEXT NOT NULL)'); db.prepare('INSERT INTO records VALUES(?,?)').run(actual.id, JSON.stringify(actual)); });
  for (let month = 1; month <= 9; month++) { const period = `2026-${String(month).padStart(2, '0')}`; saveMonthlyManagementEstimate(admin, `fixture-request-${period}`, input(period)); }
  assert.deepEqual(report(), before);
  sql(file, db => { assert.equal(db.prepare('PRAGMA user_version').get()!.user_version, 37); assert.equal(db.prepare('SELECT payload FROM records').get()!.payload, JSON.stringify(actual)); assert.equal(db.prepare('PRAGMA journal_mode').get()!.journal_mode, 'wal'); });
  assert.equal(listMonthlyManagementEstimates(admin).length, 9);
}));

test('malformed preexisting schema and damaged stored ranges fail without unsafe output', () => fixture(file => {
  sql(file, db => db.exec('CREATE TABLE monthly_management_estimates(tenant_id TEXT, period TEXT)'));
  assert.throws(() => listMonthlyManagementEstimates(admin), fails(503));
  assert.throws(() => saveMonthlyManagementEstimate(admin, 'fixture-request-001', input()), fails(503));
  sql(file, db => { assert.deepEqual(db.prepare('PRAGMA table_info(monthly_management_estimates)').all().map(row => row.name), ['tenant_id', 'period']); db.exec('DROP TABLE monthly_management_estimates'); });
  saveMonthlyManagementEstimate(admin, 'fixture-request-001', input());
  sql(file, db => db.prepare('UPDATE monthly_management_estimates SET low_cents=?').run(100.5));
  assert.throws(() => listMonthlyManagementEstimates(admin), fails(503));
  assert.throws(() => guestMonthlyEstimateSummary(guest, { year: 2026 }, new Date('2026-10-23Z')), fails(503));
}));
