import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Actor } from '../lib/auth';
import { database, execute, snapshot } from '../lib/erp';
import { financialForecast, nextFinancialMonth } from '../lib/financial-forecast';
import { monthlyFinancialDetail } from '../lib/monthly-financial-detail';

test('new projects are reusable independent records, with no inherited source archive, dates, financials or team', () => {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-project-reuse-'));
  process.env.TAYCO_ERP_DB_PATH = path.join(folder, 'erp.sqlite');
  process.env.TAYCO_AUTH_DB_PATH = path.join(folder, 'auth.sqlite');
  const actor: Actor = { id: 'fixture-admin', email: 'reuse@example.test', role: 'admin', tenantId: 'fixture-reuse', projectIds: [] };
  const run = (input: Record<string, unknown>) => execute(actor, randomUUID(), input);
  const today = new Date().toISOString().slice(0, 10), month = today.slice(0, 7), nonce = randomUUID();
  try {
    const first = run({ action: 'create_project', name: 'Reusable project A ' + nonce, clientName: 'Synthetic client A', nextAction: 'Review actual source scope' });
    run({ action: 'record_project_forecast', id: first.id, version: first.version, title: 'Only project A source', direction: 'client_collection', amountUsd: 123.45, dueOn: nextFinancialMonth(month) + '-10', source: 'Synthetic project A schedule' });
    let invoice = run({ action: 'record_invoice', projectId: first.id, reference: 'Only-A-' + nonce, amountUsd: 45.67, issuedOn: today, dueDate: today, source: 'Synthetic project A invoice', audience: 'client' });
    invoice = run({ action: 'update_invoice', id: invoice.id, version: invoice.version, status: 'approved' });
    run({ action: 'record_invoice_payment', invoiceId: invoice.id, version: invoice.version, amountUsd: 45.67, occurredOn: today, reference: 'Only-A-payment-' + nonce });
    const second = run({ action: 'create_project', name: 'Reusable project B ' + nonce, clientName: 'Synthetic client B' });
    assert.notEqual(first.id, second.id);
    const observed = snapshot(actor), asOf = observed.updatedAt;
    const fresh = observed.entries.find(entry => entry.id === second.id)!;
    assert.equal(fresh.data.name, 'Reusable project B ' + nonce);
    assert.equal(fresh.data.clientName, 'Synthetic client B');
    assert.equal(fresh.data.status, 'planning'); assert.equal(fresh.data.nextAction, '');
    assert.equal(fresh.data.progress, null); assert.equal(fresh.data.budgetUsd, null);
    assert.equal(fresh.data.budgetSource, ''); assert.equal(fresh.data.budgetApprovedOn, ''); assert.equal(fresh.data.budgetUpdatedAt, undefined);
    assert.equal(fresh.data.sourceProjectSlug, undefined);
    assert.ok(!fresh.data.plannedStart && !fresh.data.plannedEnd && !fresh.data.completedOn);
    assert.ok(!fresh.data.forecastPlans || (fresh.data.forecastPlans as unknown[]).length === 0);
    assert.ok(!fresh.data.teamMembers || (fresh.data.teamMembers as unknown[]).length === 0);
    assert.equal(observed.entries.filter(entry => entry.projectId === second.id && entry.kind !== 'project').length, 0);
    const firstReport = financialForecast(observed.entries, { month, asOf, projectId: first.id });
    const secondReport = financialForecast(observed.entries, { month, asOf, projectId: second.id });
    assert.equal(firstReport.base.clientCollectionCents, 12345);
    assert.equal(secondReport.base.clientCollectionCents, 0);
    assert.equal(secondReport.pipelineUpside.proposalFaceCents, 0);
    const firstWeekly = monthlyFinancialDetail(observed.entries, { month, asOf, projectId: first.id });
    assert.equal(firstWeekly.totals.incomeCents, 4567);
    const weekly = monthlyFinancialDetail(observed.entries, { month, asOf, projectId: second.id });
    assert.equal(weekly.totals.incomeCents, 0); assert.equal(weekly.totals.expenseCents, 0); assert.equal(weekly.projects.length, 0);
    const client = { ...actor, id: 'fixture-client', email: 'client@example.test', role: 'client' as const, projectIds: [second.id] };
    assert.deepEqual(snapshot(client).entries.map(entry => entry.id), [second.id]);
  } finally { database().close(); rmSync(folder, { recursive: true, force: true }); }
});

test('project creation requires explicit approval evidence for every non-null budget, including zero', () => {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-project-approval-'));
  const previousErp = process.env.TAYCO_ERP_DB_PATH, previousAuth = process.env.TAYCO_AUTH_DB_PATH;
  process.env.TAYCO_ERP_DB_PATH = path.join(folder, 'erp.sqlite');
  process.env.TAYCO_AUTH_DB_PATH = path.join(folder, 'auth.sqlite');
  const actor: Actor = { id: 'fixture-admin', email: 'approval@example.test', role: 'admin', tenantId: 'fixture-approval', projectIds: [] };
  const run = (input: Record<string, unknown>, key = randomUUID()) => execute(actor, key, input);
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.parse(today + 'T12:00:00Z') + 86400000).toISOString().slice(0, 10);
  try {
    for (const budgetUsd of [0, 123.45]) {
      const base = { action: 'create_project', name: 'Synthetic approved project', budgetUsd };
      const before = database().prepare('SELECT COUNT(*) AS count FROM records').get() as { count: number };
      assert.throws(() => run(base), /budget approval source/);
      assert.throws(() => run({ ...base, budgetSource: '   ', budgetApprovedOn: today }), /budget approval source/);
      assert.throws(() => run({ ...base, budgetSource: 'Synthetic approval' }), /budget approval date/);
      assert.throws(() => run({ ...base, budgetSource: 'Synthetic approval', budgetApprovedOn: '2026-02-30' }), /valid calendar date/);
      assert.throws(() => run({ ...base, budgetSource: 'Synthetic approval', budgetApprovedOn: tomorrow }), /cannot be in the future/);
      assert.equal((database().prepare('SELECT COUNT(*) AS count FROM records').get() as { count: number }).count, before.count, 'Rejected approvals create no project.');
      const key = randomUUID();
      assert.throws(() => run(base, key), /budget approval source/);
      const approved = run({ ...base, budgetSource: 'Synthetic approval', budgetApprovedOn: today }, key);
      assert.equal(approved.data.budgetUsd, budgetUsd);
      assert.equal(approved.data.budgetSource, 'Synthetic approval'); assert.equal(approved.data.budgetApprovedOn, today);
      assert.equal(approved.data.progress, null); assert.ok(typeof approved.data.budgetUpdatedAt === 'string');
    }
    assert.throws(() => run({ action: 'create_project', name: 'Synthetic fractional budget', budgetUsd: 0.001 }), /two decimal/);
    const unknown = run({ action: 'create_project', name: 'Synthetic unknown budget', budgetUsd: null });
    assert.equal(unknown.data.budgetUsd, null); assert.equal(unknown.data.budgetSource, ''); assert.equal(unknown.data.budgetApprovedOn, '');
  } finally {
    database().close();
    if (previousErp === undefined) delete process.env.TAYCO_ERP_DB_PATH; else process.env.TAYCO_ERP_DB_PATH = previousErp;
    if (previousAuth === undefined) delete process.env.TAYCO_AUTH_DB_PATH; else process.env.TAYCO_AUTH_DB_PATH = previousAuth;
    rmSync(folder, { recursive: true, force: true });
  }
});
