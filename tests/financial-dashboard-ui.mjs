/**
 * Authenticated financial dashboard certification against a disposable :3010 fixture.
 * No customer data, real financial transaction, ACL change or external request is permitted.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash, randomUUID } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
assert.ok(process.env.TAYCO_TEST_CONFIG, 'Private synthetic fixture config required.');
const configPath = fs.realpathSync(path.resolve(process.env.TAYCO_TEST_CONFIG));
const fixtureRelative = path.relative(path.join(root, '.data'), configPath).split(path.sep);
assert.ok(fixtureRelative.length === 2 && /^certification-modules-[\w-]+$/.test(fixtureRelative[0]) && !fixtureRelative.includes('..'));
const config = JSON.parse(fs.readFileSync(configPath, 'utf8')), base = config.baseUrl;
assert.match(base, /^http:\/\/(?:localhost|127\.0\.0\.1):3010$/);
for (const database of [config.authDb, config.erpDb]) {
  const relative = path.relative(path.dirname(configPath), fs.realpathSync(database));
  assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'Disposable databases must belong to the fixture.');
}
for (const account of Object.values(config.accounts)) assert.ok(account.email?.endsWith('@example.test') && account.cookie);
for (const role of ['admin', 'client', 'vendor']) assert.ok(config.accounts[role]);
assert.equal(process.env.TAYCO_FINANCIAL_UI_BUILD_READY, '1', 'Wait for explicit new isolated build readiness before executing.');
const evidence = path.resolve(process.env.TAYCO_EVIDENCE_DIR || path.join(root, '.data', 'certification', 'financial-dashboard-' + Date.now()));
const evidenceRelative = path.relative(path.join(root, '.data'), evidence);
assert.ok(evidenceRelative && !evidenceRelative.startsWith('..') && !path.isAbsolute(evidenceRelative));
fs.mkdirSync(evidence, { recursive: true });
const { chromium } = createRequire(import.meta.url)(process.env.TAYCO_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true }), contexts = [], errors = [], sessions = new Map();
const nonce = randomUUID().replaceAll('-', '').slice(0, 12), name = 'Synthetic financial dashboard ' + nonce;
const today = new Date().toISOString().slice(0, 10), currentMonth = today.slice(0, 7);
const shiftedMonth = delta => { const date = new Date(today + 'T12:00:00Z'); date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + delta); return date.toISOString().slice(0, 7); };
const historicalMonth = shiftedMonth(-1), nextMonth = shiftedMonth(1), historicalIssued = historicalMonth + '-01', historicalPaid = historicalMonth + '-10', dueOn = nextMonth + '-15';
const monthName = month => new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(month + '-01T12:00:00Z'));
const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
const report = { startedAt: new Date().toISOString(), base, sourceSha256: createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'), results: [], limits: ['Private disposable fixture and nonce records only; no ACL/session changes.', 'Recorded payments and planning assumptions are bookkeeping evidence, not bank settlement.', 'Touch and keyboard browser emulation does not certify physical mobile hardware.'] };
async function session(role, viewport = { width: 1440, height: 1000 }, touch = false) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce', hasTouch: touch, isMobile: touch }); contexts.push(context);
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort('blockedbyclient'));
  await context.addCookies([{ name: 'tayco_session', value: encodeURIComponent(config.accounts[role].cookie), url: base, httpOnly: true, sameSite: 'Lax', secure: true }]);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push({ role, type: 'pageerror', message: error.message }));
  page.on('console', message => { if (message.type() === 'error' && /React|hydration|server rendered HTML|uncaught|unhandled/i.test(message.text())) errors.push({ role, type: 'console', message: message.text() }); });
  return { context, page, role, touch };
}
async function namedSession(role) { if (!sessions.has(role)) sessions.set(role, await session(role)); return sessions.get(role); }
async function snapshot(s) { const response = await s.context.request.get(base + '/api/erp-suite'); assert.equal(response.status(), 200); return response.json(); }
async function command(s, data, expected = 200) {
  const response = await s.context.request.post(base + '/api/erp-suite', { headers: { Origin: base, 'Idempotency-Key': randomUUID() }, data });
  assert.equal(response.status(), expected, await response.text());
  return expected === 200 ? (await response.json()).result : null;
}
async function entry(s, id) { const result = (await snapshot(s)).entries.find(item => item.id === id); assert.ok(result, 'Record is visible: ' + id); return result; }
async function find(s, predicate) { const result = (await snapshot(s)).entries.find(predicate); assert.ok(result, 'Synthetic record is visible'); return result; }
async function nav(s, label) {
  const navigation = s.page.getByRole('navigation', { name: 'Command Center Navigation', exact: true });
  if (!await navigation.isVisible()) await s.page.getByRole('button', { name: 'Open modules', exact: true }).click();
  await navigation.getByRole('button', { name: label, exact: true }).click();
}
async function open(s, projectId = '') {
  await s.page.goto(base + '/portal', { waitUntil: 'domcontentloaded' }); await s.page.getByTestId('executive-console').waitFor();
  await nav(s, 'Financial dashboard'); await s.page.getByTestId('financial-dashboard').waitFor();
  await s.page.locator('#portal-project-filter').selectOption(projectId);
}
async function refresh(s) {
  const pending = s.page.waitForResponse(response => response.url() === base + '/api/erp-suite' && response.request().method() === 'GET');
  await s.page.getByRole('button', { name: 'Refresh', exact: true }).click(); await pending;
  await s.page.getByRole('button', { name: 'Refresh', exact: true }).waitFor();
}
async function month(s, value) { await s.page.getByLabel('Financial reporting month', { exact: true }).fill(value); await s.page.locator('.fd-month-detail h3').filter({ hasText: monthName(value) }).waitFor(); }
async function form(scope, title) {
  const summary = scope.locator('summary').filter({ hasText: new RegExp('^' + title.replace(/[.*+?^\$()|[\]\\]/g, '\\$&') + '$') });
  assert.equal(await summary.count(), 1, 'Unique form: ' + title);
  const details = summary.locator('..'); if (await details.getAttribute('open') === null) await summary.click();
  return details.locator('form');
}
async function fill(f, values) {
  for (const [key, value] of Object.entries(values)) {
    const input = f.locator('[name="' + key + '"]');
    if (await input.evaluate(element => element.tagName === 'SELECT')) await input.selectOption(String(value)); else await input.fill(String(value));
  }
}
async function save(f) {
  const pending = f.page().waitForResponse(response => response.url() === base + '/api/erp-suite' && response.request().method() === 'POST');
  await f.getByRole('button', { name: 'Save', exact: true }).click(); const response = await pending;
  assert.equal(response.status(), 200, await response.text());
  await Promise.race([f.getByRole('status').waitFor(), f.waitFor({ state: 'detached' })]);
  if (await f.count()) await f.page().waitForFunction(element => element.getAttribute('aria-busy') === 'false', await f.elementHandle());
}
async function manage(s) {
  const summary = s.page.locator('.fd-planning-controls > .fd-panel-content > details > summary');
  if (await summary.locator('..').getAttribute('open') === null) await summary.click();
}
async function amount(s, label, cents) {
  const box = s.page.getByTestId('financial-dashboard').locator('.fd-amount').filter({ has: s.page.locator('span', { hasText: new RegExp('^' + label + '$') }) });
  assert.equal(await box.count(), 1, 'Unique amount: ' + label); assert.equal((await box.locator('strong').textContent()).trim(), money(cents), label);
}
async function amountCents(s, label) {
  const box = s.page.locator('.fd-amount').filter({ has: s.page.locator('span', { hasText: new RegExp('^' + label + '$') }) });
  return Math.round(Number((await box.locator('strong').textContent()).replace(/[^0-9.-]/g, '')) * 100);
}
async function disclosed(scope, summaryText) {
  const summary = scope.locator('summary').filter({ hasText: summaryText }); assert.equal(await summary.count(), 1);
  const details = summary.locator('..'); if (await details.getAttribute('open') === null) await summary.click(); return details;
}
async function run(label, fn) {
  const started = Date.now(); try { const details = await fn(); report.results.push({ label, passed: true, elapsedMs: Date.now() - started, ...details }); console.log(label + ': passed'); }
  catch (error) { report.results.push({ label, passed: false, error: error.message }); throw error; }
}
let projectId, invoiceId, proposalId;
try {
  const admin = await namedSession('admin');
  await command(admin, { action: 'create_project', name, location: 'Private synthetic fixture', nextAction: 'Synthetic dated source review' });
  projectId = (await find(admin, item => item.kind === 'project' && item.data.name === name)).id;
  report.projectId = projectId;
  await run('dated-source-cohorts-and-twelve-month-chart', async () => {
    for (const [suffix, amountUsd, audience, issuedOn] of [['HIST', 125.55, 'client', historicalIssued], ['CURRENT', 20.01, 'client', today], ['INTERNAL', 30.13, 'internal', today]]) {
      await command(admin, { action: 'record_invoice', projectId, reference: suffix + '-' + nonce, amountUsd, audience, issuedOn, dueDate: dueOn, source: 'Synthetic invoice evidence ' + nonce });
    }
    let invoice = await find(admin, item => item.kind === 'invoice' && item.data.reference === 'HIST-' + nonce); invoiceId = invoice.id;
    await command(admin, { action: 'update_invoice', id: invoiceId, version: invoice.version, status: 'approved' }); invoice = await entry(admin, invoiceId);
    await command(admin, { action: 'record_invoice_payment', invoiceId, version: invoice.version, amountUsd: 25.05, occurredOn: historicalPaid, reference: 'PAY-' + nonce });
    invoice = await entry(admin, invoiceId); assert.equal(invoice.updatedAt.slice(0, 7), currentMonth); assert.equal(invoice.data.issuedOn, historicalIssued);
    await open(admin, projectId); await month(admin, historicalMonth);
    const chart = admin.page.getByTestId('financial-year-chart'); assert.equal(await chart.getByRole('button').count(), 12);
    await amount(admin, 'Issued invoice records', 12555); await amount(admin, 'Dated payment entries', 2505);
    const historicButton = chart.getByRole('button', { name: new RegExp('^' + monthName(historicalMonth) + ': issued invoices \\$125.55') });
    assert.equal(await historicButton.getAttribute('aria-pressed'), 'true');
    const sources = await disclosed(admin.page.locator('.fd-month-detail'), /^Inspect this month/);
    await sources.getByText('HIST-' + nonce, { exact: true }).waitFor(); await sources.getByText('PAY-' + nonce, { exact: true }).waitFor();
    await month(admin, currentMonth); await amount(admin, 'Issued invoice records', 2001); await amount(admin, 'Dated payment entries', 0);
    await admin.page.getByRole('button', { name: 'Internal records', exact: true }).click(); await amount(admin, 'Issued invoice records', 3013);
    await admin.page.getByRole('button', { name: 'Provider records', exact: true }).click(); await amount(admin, 'Issued invoice records', 0);
    await admin.page.getByRole('button', { name: 'Client records', exact: true }).click();
    return { historicalIssued, historicalPaid, updatedThisMonth: true, nativeMonthButtons: 12, separateAudiences: true };
  });
  await run('executive-widgets-and-interactive-month-handoff', async () => {
    await nav(admin, 'Executive overview');
    const dashboard = admin.page.getByTestId('dashboard-command-center'); await dashboard.waitFor();
    assert.equal(await dashboard.locator('.dcc-kpis > button').count(), 4); assert.equal(await dashboard.locator('.dcc-chart-month').count(), 12);
    const ytd = historicalMonth.slice(0, 4) === currentMonth.slice(0, 4) ? 14556 : 2001;
    assert.equal((await dashboard.locator('.dcc-kpi').filter({ hasText: 'Client invoices · year to date' }).locator('strong').textContent()).trim(), money(ytd));
    assert.equal((await dashboard.locator('.dcc-kpi').filter({ hasText: 'Active projects' }).locator('strong').textContent()).trim(), '0');
    assert.equal((await dashboard.locator('.dcc-kpi').filter({ hasText: 'Follow-ups waiting' }).locator('strong').textContent()).trim(), '1');
    await dashboard.locator('.dcc-calendar').waitFor(); await dashboard.locator('.dcc-quick-access').waitFor();
    const calendarDay = dashboard.locator('.dcc-calendar-day.has-events'); assert.equal(await calendarDay.count(), 1); await calendarDay.click();
    assert.equal(await calendarDay.getAttribute('aria-pressed'), 'true'); assert.equal(await dashboard.locator('.dcc-calendar-items li').count(), 3);
    await calendarDay.click(); assert.equal(await calendarDay.getAttribute('aria-pressed'), 'false');
    await admin.page.evaluate(() => scrollTo(0, 0));
    await admin.page.screenshot({ path: path.join(evidence, 'executive-dashboard-desktop.png'), fullPage: true });
    await admin.page.screenshot({ path: path.join(evidence, 'executive-dashboard-viewport.png') });
    await dashboard.getByRole('button', { name: new RegExp('^' + monthName(historicalMonth) + ': invoices') }).click();
    await admin.page.getByTestId('financial-dashboard').waitFor();
    assert.equal(await admin.page.getByLabel('Financial reporting month', { exact: true }).inputValue(), historicalMonth);
    await amount(admin, 'Issued invoice records', 12555); await month(admin, currentMonth);
    return { fourCompactSourceKpis: true, twelveInteractiveMonths: true, historicalReportingMonthHandoff: true, sourceCalendarAndQuickAccess: true, calendarShowsEverySelectedDaySource: true };
  });
  await run('source-backed-planning-and-linked-invoice-deduplication', async () => {
    await manage(admin);
    for (const [title, direction, amountUsd, linkedInvoiceId] of [['Standalone collection', 'client_collection', 11.11, ''], ['Provider obligation', 'vendor_payment', 22.22, ''], ['Internal labour', 'internal_cost', 33.33, ''], ['Linked invoice coverage', 'client_collection', 100.50, invoiceId]]) {
      const f = await form(admin.page.locator('.fd-planning-controls'), 'Add a dated project forecast');
      await fill(f, { title: title + ' ' + nonce, direction, amountUsd, dueOn, source: 'Synthetic agreement ' + nonce, linkedInvoiceId }); await save(f);
    }
    await amount(admin, 'Planned client collections', 11161); await amount(admin, 'Planned provider payments', 2222); await amount(admin, 'Explicit planned internal costs', 3333);
    const baseSources = await disclosed(admin.page.getByTestId('financial-next-month-outlook'), /^Inspect base sources/);
    assert.equal(await baseSources.locator('li').count(), 4); assert.equal(await baseSources.getByText('Linked invoice coverage ' + nonce, { exact: true }).count(), 0);
    const coverage = await disclosed(admin.page, /^Outlook coverage/); await coverage.getByText('1 linked or duplicate sources excluded', { exact: true }).waitFor();
    const planCard = admin.page.locator('.fd-plan-register article').filter({ hasText: 'Provider obligation ' + nonce });
    const cancel = await form(planCard, 'Cancel this planning source'); await fill(cancel, { cancelReason: 'Synthetic source cancelled ' + nonce }); await save(cancel);
    await amount(admin, 'Planned provider payments', 0); await planCard.getByText('Cancelled · Synthetic source cancelled ' + nonce, { exact: true }).waitFor();
    assert.equal(await admin.page.getByLabel('Financial reporting month', { exact: true }).inputValue(), currentMonth);
    return { clientBaseCents: 11161, providerPlanCancelled: true, internalCostCents: 3333, linkedInvoiceAddedOnce: true, periodRetained: true };
  });
  await run('conditional-proposal-assumptions-and-version-conflict', async () => {
    for (const [suffix, amountUsd, sent, validUntil] of [['VALID', 100.01, true, dueOn], ['EXPIRED', 900, true, historicalPaid], ['DRAFT', 800, false, dueOn]]) {
      await command(admin, { action: 'create_proposal', projectId, reference: suffix + '-' + nonce, title: suffix + ' proposal ' + nonce, clientName: 'Synthetic client', amountUsd, issuedOn: historicalIssued, validUntil, source: 'Synthetic scope ' + nonce });
      let proposal = await find(admin, item => item.kind === 'proposal' && item.data.reference === suffix + '-' + nonce);
      if (sent) { await command(admin, { action: 'send_proposal', id: proposal.id, version: proposal.version, sentOn: historicalIssued }); proposal = await entry(admin, proposal.id); }
      if (suffix === 'VALID') proposalId = proposal.id;
      else await command(admin, { action: 'set_proposal_forecast', id: proposal.id, version: proposal.version, expectedBillingOn: dueOn, probabilityPercent: 100, allocationPercent: 100, source: 'Synthetic excluded scenario ' + nonce });
    }
    await refresh(admin); await manage(admin);
    const card = admin.page.locator('.fd-proposal-planning article').filter({ hasText: 'VALID-' + nonce });
    const f = await form(card, 'Set proposal planning assumptions');
    await fill(f, { expectedBillingOn: dueOn, probabilityPercent: 50, allocationPercent: 50, source: 'Synthetic 50 percent assumptions ' + nonce }); await save(f);
    await amount(admin, 'Proposal face amount', 10001); await amount(admin, 'Allocated billing scenario', 5001); await amount(admin, 'Weighted billing scenario', 2500);
    await amount(admin, 'Planned client collections', 11161);
    await fill(f, { probabilityPercent: 25, source: 'Unsaved draft ' + nonce });
    const old = await entry(admin, proposalId);
    await command(admin, { action: 'set_proposal_forecast', id: old.id, version: old.version, expectedBillingOn: dueOn, probabilityPercent: 30, allocationPercent: 40, source: 'Concurrent source ' + nonce });
    await refresh(admin); await f.getByTestId('record-version-conflict').waitFor();
    assert.equal(await f.locator('[name="probabilityPercent"]').inputValue(), '25'); assert.equal(await f.locator('[name="source"]').inputValue(), 'Unsaved draft ' + nonce);
    assert.equal(await f.getByRole('button', { name: 'Save', exact: true }).isDisabled(), true);
    await f.getByRole('button', { name: 'Discard draft and load current values', exact: true }).click();
    assert.equal(await f.locator('[name="probabilityPercent"]').inputValue(), '30'); assert.equal(await f.locator('[name="allocationPercent"]').inputValue(), '40');
    assert.equal(await f.locator('[name="source"]').inputValue(), 'Concurrent source ' + nonce); assert.equal(await f.getByTestId('record-version-conflict').count(), 0);
    assert.equal(await f.getByRole('button', { name: 'Save', exact: true }).isDisabled(), false);
    await fill(f, { probabilityPercent: 50, allocationPercent: 50, source: 'Synthetic restored assumptions ' + nonce }); await save(f);
    await amount(admin, 'Weighted billing scenario', 2500);
    const assumptions = await disclosed(admin.page, /^Inspect proposal assumptions/); assert.equal(await assumptions.locator('li').count(), 1);
    const coverage = await disclosed(admin.page, /^Outlook coverage/); await coverage.getByText(/expired.*excluded from upside/i).waitFor();
    const remove = await form(card, 'Remove proposal planning assumptions'); await fill(remove, { reason: 'Synthetic scenario withdrawal ' + nonce }); await save(remove);
    await amount(admin, 'Weighted billing scenario', 0);
    await fill(f, { expectedBillingOn: dueOn, probabilityPercent: 50, allocationPercent: 50, source: 'Synthetic final assumptions ' + nonce }); await save(f);
    const record = await entry(admin, proposalId); assert.ok(record.data.forecastHistory.some(item => item.reason === 'Synthetic scenario withdrawal ' + nonce));
    return { faceCents: 10001, allocatedCents: 5001, weightedCentsRoundedOnce: 2500, separateFromBase: true, expiredAndDraftExcluded: true, draftConflictPreserved: true, explicitReloadOfCurrentDefaults: true, assumptionRemovalAudited: true };
  });
  await run('explicit-completion-does-not-create-financial-records', async () => {
    let project = await entry(admin, projectId);
    await command(admin, { action: 'update_project', id: projectId, version: project.version, status: 'closed', progress: 100, nextAction: 'Synthetic completion evidence review' });
    await refresh(admin); assert.equal(await admin.page.locator('.fd-completed-grid button').count(), 0);
    await admin.page.locator('.fd-completed').getByText(/closed project has no usable completion date/).waitFor();
    const before = (await snapshot(admin)).entries.filter(item => item.kind === 'invoice' && item.projectId === projectId).map(item => ({ id: item.id, data: item.data }));
    await manage(admin); const completion = await form(admin.page, 'Record an explicit project completion');
    await fill(completion, { completedOn: historicalPaid, evidence: 'Synthetic signed completion evidence ' + nonce }); await save(completion);
    const after = (await snapshot(admin)).entries.filter(item => item.kind === 'invoice' && item.projectId === projectId).map(item => ({ id: item.id, data: item.data }));
    assert.deepEqual(after, before); await month(admin, historicalMonth);
    const completed = admin.page.locator('.fd-completed-grid button'); assert.equal(await completed.count(), 1); await completed.getByText(name, { exact: true }).waitFor();
    await completed.getByText('Completed · ' + historicalPaid, { exact: true }).waitFor();
    await month(admin, currentMonth); assert.equal(await admin.page.locator('.fd-completed-grid button').count(), 0);
    return { closedStatusDidNotInferDate: true, completionDate: historicalPaid, invoiceAndPaymentRecordsUnchanged: true };
  });
  await run('provider-effective-date-and-obligation-delta', async () => {
    await admin.page.locator('#portal-project-filter').selectOption(config.projects[0]); await month(admin, currentMonth);
    const baseline = await amountCents(admin, 'Planned provider payments');
    const vendor = await namedSession('vendor');
    await command(vendor, { action: 'record_invoice', projectId: config.projects[0], reference: 'VENDOR-' + nonce, amountUsd: 88.88, issuedOn: historicalIssued, dueDate: dueOn, source: 'Synthetic provider source ' + nonce });
    let invoice = await find(admin, item => item.kind === 'invoice' && item.data.reference === 'VENDOR-' + nonce);
    await command(admin, { action: 'update_invoice', id: invoice.id, version: invoice.version, status: 'approved' }); invoice = await entry(admin, invoice.id);
    await command(admin, { action: 'record_invoice_payment', invoiceId: invoice.id, version: invoice.version, amountUsd: 8.08, occurredOn: historicalPaid, reference: 'VENDOR-PAY-' + nonce });
    await refresh(admin); await amount(admin, 'Planned provider payments', baseline + 8080);
    await admin.page.getByRole('button', { name: 'Provider records', exact: true }).click(); await month(admin, historicalMonth);
    const sources = await disclosed(admin.page.locator('.fd-month-detail'), /^Inspect this month/);
    await sources.getByText('VENDOR-' + nonce, { exact: true }).waitFor(); await sources.getByText('VENDOR-PAY-' + nonce, { exact: true }).waitFor();
    await admin.page.locator('#portal-project-filter').selectOption(projectId); await month(admin, currentMonth); await admin.page.getByRole('button', { name: 'Client records', exact: true }).click();
    return { vendorFixtureProjectOnly: true, existingAclUntouched: true, priorProviderBaseCents: baseline, addedOutstandingCents: 8080, sourceDatesRetained: true };
  });
  await run('external-role-boundaries', async () => {
    for (const role of ['client', 'vendor']) {
      const s = await namedSession(role); await s.page.goto(base + '/portal', { waitUntil: 'domcontentloaded' }); await s.page.getByTestId('executive-console').waitFor();
      const navigation = s.page.getByRole('navigation', { name: 'Command Center Navigation', exact: true });
      assert.equal(await navigation.getByRole('button', { name: 'Financial dashboard', exact: true }).count(), 0);
      assert.equal(await s.page.getByTestId('financial-dashboard').count(), 0);
      const available = (await snapshot(s)).entries;
      for (const item of available.filter(item => item.kind === 'project')) for (const key of ['forecastPlans', 'completionEvidence', 'completionHistory', 'completionRecordedAt']) assert.equal(Object.hasOwn(item.data, key), false, role + ' internal field ' + key);
      const project = await entry(admin, projectId), proposal = await entry(admin, proposalId);
      for (const data of [
        { action: 'record_project_forecast', id: project.id, version: project.version, title: 'Denied', direction: 'internal_cost', amountUsd: 1, dueOn, source: 'Denied' },
        { action: 'record_project_completion', id: project.id, version: project.version, completedOn: historicalPaid, evidence: 'Denied' },
        { action: 'set_proposal_forecast', id: proposal.id, version: proposal.version, expectedBillingOn: dueOn, probabilityPercent: 50, allocationPercent: 50, source: 'Denied' },
        { action: 'clear_proposal_forecast', id: proposal.id, version: proposal.version, reason: 'Denied' },
      ]) await command(s, data, 403);
    }
    return { internalNavigationAbsent: true, internalPlanningFieldsAbsent: true, allPlanningAndCompletionMutationsForbidden: true };
  });
  await run('urgent-followups-complete-list-and-overdue-expiry', async () => {
    const assigneeId = (await snapshot(admin)).assignees.find(member => member.email === config.accounts.staff.email)?.id; assert.ok(assigneeId);
    for (const title of ['A', 'B', 'C', 'D', 'E']) await command(admin, { action: 'create_followup', projectId, title: title + ' low ' + nonce, notes: 'Synthetic low priority follow-up', priority: 'low', dueDate: dueOn, assigneeId });
    await command(admin, { action: 'create_followup', projectId, title: 'Z urgent ' + nonce, notes: 'Synthetic overdue urgent follow-up', priority: 'urgent', dueDate: historicalPaid, assigneeId });
    await refresh(admin); await nav(admin, 'Executive overview');
    const dashboard = admin.page.getByTestId('dashboard-command-center'); await dashboard.waitFor();
    const followups = dashboard.locator('.dcc-followups'); assert.equal(await followups.locator('li').count(), 5);
    await followups.locator('li').first().getByText('Z urgent ' + nonce, { exact: true }).waitFor(); await followups.locator('li').first().getByText(/urgent priority.*Overdue/).waitFor();
    await followups.getByRole('button', { name: 'View all follow-ups (6)', exact: true }).click(); assert.equal(await followups.locator('li').count(), 6);
    await followups.getByRole('button', { name: 'Show fewer follow-ups', exact: true }).click(); assert.equal(await followups.locator('li').count(), 5);
    await dashboard.locator('.dcc-tabs').getByRole('button', { name: /^Overdue/ }).click();
    await dashboard.locator('.dcc-agenda-list').getByText('EXPIRED proposal ' + nonce, { exact: true }).waitFor();
    await dashboard.screenshot({ path: path.join(evidence, 'executive-urgent-overdue.png') });
    await nav(admin, 'Financial dashboard'); await admin.page.getByTestId('financial-dashboard').waitFor();
    return { urgentZBeforeFiveLowPrioritySources: true, allSixSourcesReachable: true, overdueProposalExpiryRetained: true };
  });
  await run('weekly-cash-detail-and-evidenced-monthly-projects', async () => {
    await month(admin, historicalMonth);
    const weekly = admin.page.getByTestId('financial-weekly-detail'); await weekly.waitFor();
    const source = await entry(admin, invoiceId);
    const receipts = source.data.payments.filter(payment => !payment.voidedAt && payment.occurredOn.slice(0, 7) === historicalMonth).reduce((sum, payment) => sum + Math.round(payment.amountUsd * 100), 0);
    assert.equal(receipts, 2505); await amount(admin, 'Client receipts', receipts); await amount(admin, 'Provider payments', 0); await amount(admin, 'Recorded cash result', receipts);
    const values = await weekly.locator('tbody tr').evaluateAll(rows => rows.map(row => [...row.querySelectorAll('td')].map(cell => Math.round(Number(cell.textContent.replace(/[^0-9.-]/g, '')) * 100))));
    assert.equal(values.reduce((sum, row) => sum + row[0], 0), receipts); assert.equal(values.reduce((sum, row) => sum + row[1], 0), 0); assert.equal(values.reduce((sum, row) => sum + row[2], 0), receipts);
    const paidDate = new Date(historicalPaid + 'T12:00:00Z'), weekday = paidDate.getUTCDay(), start = new Date(paidDate), end = new Date(paidDate);
    start.setUTCDate(start.getUTCDate() - (weekday + 6) % 7); end.setUTCDate(end.getUTCDate() + (7 - weekday) % 7);
    const startDate = start.toISOString().slice(0, 10) < historicalMonth + '-01' ? historicalMonth + '-01' : start.toISOString().slice(0, 10);
    const lastDate = new Date(Date.UTC(Number(historicalMonth.slice(0, 4)), Number(historicalMonth.slice(5, 7)), 0)).toISOString().slice(0, 10);
    const endDate = end.toISOString().slice(0, 10) > lastDate ? lastDate : end.toISOString().slice(0, 10);
    const displayDate = date => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
    const row = weekly.locator('tbody tr').filter({ hasText: displayDate(startDate) + ' – ' + displayDate(endDate) }); assert.equal(await row.count(), 1);
    assert.equal((await row.locator('td').nth(0).textContent()).trim(), money(receipts)); assert.equal((await row.locator('td').nth(2).textContent()).trim(), money(receipts));
    const project = weekly.locator('.fd-month-projects button').filter({ hasText: name }); assert.equal(await project.count(), 1);
    await project.getByText(/Invoice issuance record/).waitFor(); await project.getByText(/Dated payment movement/).waitFor(); await project.getByText(/Evidenced completion date/).waitFor();
    await weekly.screenshot({ path: path.join(evidence, 'weekly-detail-historical.png') });
    await month(admin, currentMonth); await amount(admin, 'Client receipts', 0); await amount(admin, 'Provider payments', 0); await amount(admin, 'Recorded cash result', 0);
    return { snapshotReceiptCents: receipts, effectiveDate: historicalPaid, weekFrom: startDate, weekThrough: endDate, allWeekSumsReconcile: true, projectSourceReasonsVisible: true, reportingMonthChangesCashDetail: true };
  });
  await run('touch-keyboard-and-six-responsive-sizes', async () => {
    const measurements = [];
    for (const [width, height] of [[320, 740], [360, 740], [390, 844], [768, 1024], [844, 390], [1440, 900]]) {
      const s = await session('admin', { width, height }, true); await open(s, projectId);
      await nav(s, 'Executive overview'); const executive = s.page.getByTestId('dashboard-command-center'); await executive.waitFor();
      assert.equal(await executive.locator('.dcc-kpis > button').count(), 4);
      const executiveOverflow = await s.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert.ok(executiveOverflow <= 1, width + 'px executive overflow: ' + executiveOverflow);
      if (width === 390 || width === 1440) { await s.page.evaluate(() => scrollTo(0, 0)); await s.page.screenshot({ path: path.join(evidence, 'executive-dashboard-' + width + '.png'), fullPage: true }); await s.page.screenshot({ path: path.join(evidence, 'executive-viewport-' + width + '.png') }); }
      await executive.getByRole('button', { name: new RegExp('^' + monthName(historicalMonth) + ': invoices') }).tap();
      await s.page.getByTestId('financial-dashboard').waitFor(); assert.equal(await s.page.getByLabel('Financial reporting month', { exact: true }).inputValue(), historicalMonth); await month(s, currentMonth);
      const chart = s.page.getByTestId('financial-year-chart'), buttons = chart.getByRole('button'); assert.equal(await buttons.count(), 12);
      const historical = buttons.filter({ hasText: new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(new Date(historicalMonth + '-01T12:00:00Z')) });
      await historical.tap(); assert.equal(await s.page.getByLabel('Financial reporting month', { exact: true }).inputValue(), historicalMonth);
      const next = s.page.getByRole('button', { name: 'Next financial month', exact: true }); await next.focus(); await s.page.keyboard.press('Enter');
      assert.equal(await s.page.getByLabel('Financial reporting month', { exact: true }).inputValue(), currentMonth);
      const provider = s.page.getByRole('button', { name: 'Provider records', exact: true }); await provider.focus(); await s.page.keyboard.press('Space'); assert.equal(await provider.getAttribute('aria-pressed'), 'true');
      await s.page.getByRole('button', { name: 'Client records', exact: true }).tap(); await manage(s);
      const planning = await form(s.page, 'Add a dated project forecast'); await planning.locator('[name="title"]').fill('Unsaved responsive draft ' + nonce);
      const overflow = await s.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert.ok(overflow <= 1, width + 'px viewport overflow: ' + overflow);
      const touch = await s.page.evaluate(() => navigator.maxTouchPoints); assert.ok(touch > 0);
      measurements.push({ width, height, overflow, executiveOverflow, touchPoints: touch, nativeMonthSelection: true, keyboardMonthAndAudience: true, planningFormUsable: true });
      if (width === 390 || width === 1440) { await s.page.evaluate(() => scrollTo(0, 0)); await s.page.screenshot({ path: path.join(evidence, 'financial-dashboard-' + width + '.png'), fullPage: true }); }
      await s.context.close();
    }
    return { measurements, physicalHardwareTested: false };
  });
  assert.equal(errors.length, 0, 'Zero browser runtime, hydration and React errors: ' + JSON.stringify(errors)); report.passed = true;
} catch (error) {
  report.passed = false; report.failure = { message: error.message, stack: error.stack }; console.error(error.stack); process.exitCode = 1;
  const admin = sessions.get('admin'); if (admin) await admin.page.screenshot({ path: path.join(evidence, 'failure.png'), fullPage: true }).catch(() => {});
}
finally {
  for (const context of contexts) await context.close().catch(() => {}); await browser.close();
  report.completedAt = new Date().toISOString(); report.browserErrors = errors;
  fs.writeFileSync(path.join(evidence, 'runtime-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, groups: report.results.map(({ label, passed }) => ({ label, passed })), evidence }));
}
