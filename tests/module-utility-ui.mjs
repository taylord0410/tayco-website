/** Isolated GUI certification of CRM, recorded hours, procurement and draft concurrency. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
assert.ok(process.env.TAYCO_TEST_CONFIG, 'A disposable module fixture is required.');
const configPath = fs.realpathSync(path.resolve(process.env.TAYCO_TEST_CONFIG));
assert.ok(configPath.startsWith(path.join(root, '.data', 'certification-modules-')));
const config = JSON.parse(fs.readFileSync(configPath, 'utf8')), base = config.baseUrl;
assert.match(base, /^http:\/\/(?:localhost|127\.0\.0\.1):3010$/);
for (const database of [config.authDb, config.erpDb]) {
  const relative = path.relative(path.dirname(configPath), fs.realpathSync(database));
  assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'Only isolated fixture databases are allowed.');
}
for (const account of Object.values(config.accounts)) assert.ok(account.email.endsWith('@example.test'));
const out = path.resolve(process.env.TAYCO_EVIDENCE_DIR || path.join(root, '.data', 'certification', 'module-utility-' + Date.now()));
assert.ok(out.startsWith(path.join(root, '.data') + path.sep)); fs.mkdirSync(out, { recursive: true });
const { chromium } = createRequire(import.meta.url)(process.env.TAYCO_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true }), contexts = [], sessions = new Map(), nonce = Date.now().toString(36);
const runtimeErrors = [], report = { startedAt: new Date().toISOString(), base, nonce, sourceSha256: createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'), results: [], limits: ['Disposable synthetic fixture only; no customer records, account permissions or external systems changed.', 'Hours are recorded source logs, not wages, paid payroll or certified WH-347.', 'Responsive browser emulation does not certify physical mobile hardware.'] };
const exact = text => new RegExp('^' + text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$');
async function session(role) {
  if (sessions.has(role)) return sessions.get(role);
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }); contexts.push(context);
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await context.addCookies([{ name: 'tayco_session', value: encodeURIComponent(config.accounts[role].cookie), url: base, httpOnly: true, sameSite: 'Lax', secure: true }]);
  const page = await context.newPage(); page.setDefaultTimeout(12000);
  page.on('pageerror', error => runtimeErrors.push({ role, message: error.message }));
  page.on('console', message => { if (message.type() === 'error' && /hydration|Minified React error|server rendered HTML/i.test(message.text())) runtimeErrors.push({ role, message: message.text() }); });
  await page.goto(base + '/portal', { waitUntil: 'domcontentloaded' }); await hydrated({ page });
  const s = { context, page }; sessions.set(role, s); return s;
}
async function snapshot(s) { const r = await s.context.request.get(base + '/api/erp-suite'); assert.equal(r.status(), 200); return r.json(); }
async function post(s, data) { return s.context.request.post(base + '/api/erp-suite', { headers: { Origin: base, 'Idempotency-Key': randomUUID() }, data }); }
async function good(s, data) { const r = await post(s, data); assert.equal(r.status(), 200, await r.text()); return r.json(); }
async function record(s, id) { return (await snapshot(s)).entries.find(e => e.id === id); }
async function find(s, predicate) { const e = (await snapshot(s)).entries.find(predicate); assert.ok(e, 'Expected synthetic source record'); return e; }
async function hydrated(s) {
  await s.page.getByTestId('executive-console').waitFor(); await s.page.locator('body[data-motion="reduced"]').waitFor();
  const controls = s.page.getByTestId('workspace-display-controls'); if (await controls.getAttribute('open') === null) await controls.locator('summary').click();
  await controls.getByRole('button', { name: 'Calm', exact: true }).click(); await s.page.locator('[data-testid="executive-console"][data-atmosphere="calm"]').waitFor();
  await controls.getByRole('button', { name: 'Deep', exact: true }).click(); await s.page.locator('[data-testid="executive-console"][data-atmosphere="deep"]').waitFor(); await controls.locator('summary').click();
}
async function reload(s) { await s.page.reload({ waitUntil: 'domcontentloaded' }); await hydrated(s); }
async function nav(s, label) {
  const toggle = s.page.getByRole('button', { name: 'Open modules', exact: true }); if (await toggle.isVisible()) await toggle.click();
  const button = s.page.getByRole('navigation', { name: 'Command Center Navigation', exact: true }).getByRole('button', { name: new RegExp(label, 'i') });
  const title = await button.locator('span').first().textContent(); await button.click(); await s.page.getByRole('region', { name: title, exact: true }).waitFor();
}
async function form(scope, title) {
  const summary = scope.locator('summary').filter({ hasText: exact(title) }); assert.equal(await summary.count(), 1, 'Unique form ' + title);
  const detail = summary.locator('..'); if (await detail.getAttribute('open') === null) await summary.click(); return detail.locator('form');
}
async function fill(f, fields) { for (const [name, value] of Object.entries(fields)) { const input = f.locator('[name="' + name + '"]'); if (await input.evaluate(e => e.tagName === 'SELECT')) await input.selectOption(String(value)); else await input.fill(String(value)); } }
async function save(f, expected = 200) {
  const reply = f.page().waitForResponse(r => r.url() === base + '/api/erp-suite' && r.request().method() === 'POST');
  await f.getByRole('button', { name: 'Save', exact: true }).click(); const r = await reply; assert.equal(r.status(), expected, await r.text());
  if (expected === 200) await f.getByRole('status').waitFor(); return r;
}
async function refresh(s) { const reply = s.page.waitForResponse(r => r.url() === base + '/api/erp-suite' && r.request().method() === 'GET'); await s.page.getByRole('button', { name: 'Refresh', exact: true }).click(); assert.equal((await reply).status(), 200); }
async function run(name, fn) { const start = Date.now(); try { const details = await fn(); report.results.push({ name, passed: true, elapsedMs: Date.now() - start, ...details }); console.log(name + ': passed'); } catch (error) { report.results.push({ name, passed: false, error: error.message }); throw error; } }
async function openDetails(scope, title) { const summary = scope.locator('summary').filter({ hasText: exact(title) }); const d = summary.locator('..'); if (await d.getAttribute('open') === null) await summary.click(); return d; }
let projectId, leadId, orderId;
try {
  const admin = await session('admin');
  await good(admin, { action: 'create_project', name: 'Module utility synthetic ' + nonce, location: 'Isolated fixture', nextAction: 'Review synthetic source' });
  projectId = (await find(admin, e => e.kind === 'project' && e.data.name === 'Module utility synthetic ' + nonce)).id;
  const staffId = (await snapshot(admin)).assignees.find(e => e.email === config.accounts.staff.email)?.id; assert.ok(staffId);
  await reload(admin);
  await run('blank-project-gui-preserves-unknowns-and-requires-budget-approval', async () => {
    await nav(admin, 'Projects'); await admin.page.locator('#portal-project-filter').selectOption('');
    let f = await form(admin.page, 'Add a project'); const name = 'Blank project synthetic ' + nonce;
    await fill(f, { name, location: '', clientName: '', budgetUsd: '', budgetSource: '', budgetApprovedOn: '', nextAction: '' }); await save(f);
    const blank = await find(admin, e => e.kind === 'project' && e.data.name === name);
    assert.equal(blank.data.progress, null); assert.equal(blank.data.budgetUsd, null); assert.equal(blank.data.budgetSource, ''); assert.equal(blank.data.budgetApprovedOn, ''); assert.equal(blank.data.nextAction, '');
    assert.equal((await snapshot(admin)).entries.filter(e => e.id !== blank.id && e.projectId === blank.id).length, 0, 'No inherited project records');
    const card = admin.page.locator('article').filter({ has: admin.page.getByRole('heading', { name, exact: true }) });
    await card.getByText('Execution progress not recorded', { exact: true }).waitFor(); assert.equal(await card.getByRole('progressbar').count(), 0);
    f = await form(admin.page, 'Add a project'); await fill(f, { name: 'Budget guard synthetic ' + nonce, budgetUsd: '1', budgetSource: '', budgetApprovedOn: '', nextAction: '' }); await save(f, 422);
    assert.ok((await f.getByRole('alert').textContent()).includes('budget approval source')); assert.equal((await snapshot(admin)).entries.some(e => e.kind === 'project' && e.data.name === 'Budget guard synthetic ' + nonce), false);
    const today = new Date().toISOString().slice(0, 10); await fill(f, { name: 'Approved zero budget synthetic ' + nonce, budgetUsd: '0', budgetSource: 'Written fixture approval ' + nonce, budgetApprovedOn: today }); await save(f);
    const approved = await find(admin, e => e.kind === 'project' && e.data.name === 'Approved zero budget synthetic ' + nonce); assert.equal(approved.data.budgetUsd, 0); assert.equal(approved.data.budgetApprovedOn, today); assert.equal(approved.data.budgetSource, 'Written fixture approval ' + nonce);
    return { blankProjectId: blank.id, inheritedRecords: 0, progressUnknown: true, budgetUnknown: true, noInventedNextAction: true, missingApprovalDenied: 422, approvedZeroBudgetId: approved.id };
  });
  await run('crm-companywide-stage-owner-search-zero-estimate', async () => {
    await admin.page.locator('#portal-project-filter').selectOption(projectId); await nav(admin, 'Requests');
    let f = await form(admin.page, 'Add a request'); await fill(f, { name: 'CRM synthetic ' + nonce, email: 'crm-' + nonce + '@example.test', details: 'Synthetic companywide request ' + nonce, assigneeId: staffId }); await save(f);
    leadId = (await find(admin, e => e.kind === 'lead' && e.data.name === 'CRM synthetic ' + nonce)).id;
    const card = admin.page.locator('[data-request-id="' + leadId + '"]');
    await openDetails(card, 'Edit location and sourced estimate'); f = await form(card, 'Update request details');
    await fill(f, { location: 'Synthetic location ' + nonce, estimatedValueUsd: '0', estimateSource: 'Measured zero scope ' + nonce }); await save(f);
    await openDetails(card, 'Update responsibility and next action'); f = await form(card, 'Update request workflow');
    await fill(f, { status: 'quoted', assigneeId: staffId, nextAction: 'Synthetic follow up ' + nonce }); await save(f);
    await admin.page.getByLabel('Request stage', { exact: true }).first().selectOption('quoted'); await admin.page.getByLabel('Request owner', { exact: true }).selectOption(staffId);
    await admin.page.getByLabel('Find a request', { exact: true }).fill('Synthetic location ' + nonce); await card.waitFor();
    assert.ok((await card.textContent()).includes('$0.00')); assert.ok((await card.textContent()).includes('Measured zero scope ' + nonce));
    await admin.page.getByLabel('Find a request', { exact: true }).fill('absent-' + nonce); assert.equal(await card.count(), 0);
    await admin.page.getByLabel('Find a request', { exact: true }).fill(nonce); await card.waitFor();
    await admin.page.getByLabel('Request stage', { exact: true }).first().selectOption('new'); assert.equal(await card.count(), 0);
    await admin.page.getByLabel('Request stage', { exact: true }).first().selectOption('quoted'); await admin.page.getByLabel('Request owner', { exact: true }).selectOption('unassigned'); assert.equal(await card.count(), 0);
    await reload(admin); await nav(admin, 'Requests'); await card.waitFor(); const lead = await record(admin, leadId);
    assert.equal(lead.data.estimatedValueUsd, 0); assert.equal(lead.data.assigneeId, staffId); assert.equal(lead.data.status, 'quoted');
    assert.equal(await admin.page.locator('#portal-project-filter').count(), 0);
    return { leadId, valueUsd: 0, companywideDespitePreviousProjectSelection: true, filtersExercised: ['location search', 'stage', 'owner', 'no matches'], persisted: true };
  });
  await run('hours-gui-review-iso-week-exact-exports', async () => {
    await nav(admin, 'Team hours'); await admin.page.locator('#portal-project-filter').selectOption(projectId);
    const ids = [];
    for (const [date, hours] of [['2025-12-29', '0.1'], ['2026-01-04', '0.2']]) {
      const f = await form(admin.page, 'Submit work hours'); await fill(f, { projectId, date, hours, trade: 'Synthetic trade ' + nonce }); await save(f);
      ids.push((await find(admin, e => e.kind === 'hours' && e.projectId === projectId && e.data.date === date)).id);
    }
    await good(admin, { action: 'log_hours', projectId, date: '2026-01-05', hours: 1.005, trade: 'Synthetic trade ' + nonce });
    const third = await find(admin, e => e.kind === 'hours' && e.projectId === projectId && e.data.date === '2026-01-05'); ids.push(third.id);
    await refresh(admin);
    const source = await openDetails(admin.page, 'Work-log source records');
    for (const [index, status] of [[0, 'approved'], [1, 'returned']]) {
      const entry = await record(admin, ids[index]); const card = source.locator('article').filter({ has: admin.page.locator('time[datetime="' + entry.data.date + '"]') });
      const fallback = source.locator('article').filter({ hasText: entry.data.date });
      const selected = await card.count() ? card : fallback;
      const f = await form(selected, 'Review time submission'); await fill(f, { status, response: 'Synthetic review ' + nonce }); await save(f);
    }
    const hours = admin.page.getByTestId('hours-report');
    assert.equal((await hours.getByTestId('hours-exact-total').textContent()).replace(/h$/, '').trim(), '1.305');
    assert.ok((await hours.getByTestId('hours-weekly-groups').textContent()).includes('2026-W01'));
    assert.ok((await hours.getByTestId('hours-weekly-groups').textContent()).includes('2026-W02'));
    await hours.getByLabel('Work date from', { exact: true }).fill('2025-12-29'); await hours.getByLabel('Work date through', { exact: true }).fill('2026-01-04');
    assert.equal((await hours.getByTestId('hours-exact-total').textContent()).replace(/h$/, '').trim(), '0.3');
    await hours.getByLabel('Work-log review', { exact: true }).selectOption('approved'); assert.equal((await hours.getByTestId('hours-exact-total').textContent()).replace(/h$/, '').trim(), '0.1');
    await hours.getByLabel('Work-log review', { exact: true }).selectOption('all');
    const jsonUrl = await hours.getByRole('link', { name: 'Download hours JSON', exact: true }).getAttribute('href');
    const csvUrl = await hours.getByRole('link', { name: 'Download hours CSV', exact: true }).getAttribute('href');
    const json = await admin.context.request.get(base + jsonUrl), csv = await admin.context.request.get(base + csvUrl);
    for (const r of [json, csv]) { assert.equal(r.status(), 200); assert.match(r.headers()['cache-control'], /private.*no-store/); assert.match(r.headers()['content-disposition'], /attachment/); }
    const data = (await json.json()).report; assert.equal(data.totals.exactHours, '0.3'); assert.equal(data.groups.length, 2); assert.ok(data.groups.every(g => g.isoWeek === '2026-W01'));
    const csvText = await csv.text(); for (const id of ids.slice(0, 2)) assert.ok(csvText.includes(id)); assert.ok(!csvText.includes(third.id));
    fs.writeFileSync(path.join(out, 'selected-hours.csv'), csvText); fs.writeFileSync(path.join(out, 'selected-hours.json'), JSON.stringify(data, null, 2));
    const malformed = await admin.context.request.get(base + '/api/hours/export?format=json&from=2026-02-30'); assert.equal(malformed.status(), 422);
    return { projectId, sourceIds: ids, exactTotal: '1.305', selectedExactTotal: '0.3', isoBoundary: '2025-12-29 through 2026-01-04 = 2026-W01', reviews: ['approved', 'returned'], privateCsvJson: true };
  });
  await run('purchase-order-numeric-persistence-and-cas', async () => {
    await nav(admin, 'Purchase orders'); await admin.page.locator('#portal-project-filter').selectOption(projectId);
    let f = await form(admin.page, 'Create a purchase order'); const reference = 'PO-UTILITY-' + nonce;
    await fill(f, { projectId, reference, supplierName: 'Synthetic supplier ' + nonce, description: 'Synthetic source scope', amountUsd: '12.34', issuedOn: '2026-01-01', source: 'Synthetic fixture only' }); await save(f);
    orderId = (await find(admin, e => e.kind === 'purchase_order' && e.data.reference === reference)).id;
    const card = admin.page.locator('article').filter({ has: admin.page.getByRole('heading', { name: reference, exact: true }) });
    async function sourcing() { await openDetails(card, 'Quote, drawing and delivery details'); return form(card, 'Record sourcing details'); }
    for (const days of [0, 7]) {
      f = await sourcing(); await fill(f, { quoteDate: '2026-01-02', leadTimeDays: String(days), expectedDeliveryOn: '2026-01-12', sheetRef: 'S-' + nonce, quoteSource: 'Synthetic sourced quote ' + nonce }); await save(f);
      await reload(admin); await nav(admin, 'Purchase orders'); await admin.page.locator('#portal-project-filter').selectOption(projectId); f = await sourcing();
      assert.equal(await f.locator('[name="leadTimeDays"]').inputValue(), String(days)); assert.equal(await f.locator('[name="quoteDate"]').inputValue(), '2026-01-02'); assert.equal(await f.locator('[name="sheetRef"]').inputValue(), 'S-' + nonce);
      await fill(f, { sheetRef: 'S-unrelated-' + nonce }); await save(f); assert.equal((await record(admin, orderId)).data.leadTimeDays, days);
    }
    f = await sourcing(); await fill(f, { sheetRef: 'DRAFT-REFRESH-' + nonce, leadTimeDays: '9' }); let current = await record(admin, orderId);
    const remote = { action: 'update_purchase_order_details', id: orderId, quoteDate: '2026-01-03', leadTimeDays: 12, expectedDeliveryOn: '2026-01-20', sheetRef: 'REMOTE-' + nonce, quoteSource: 'Concurrent fixture evidence ' + nonce };
    await good(admin, { ...remote, version: current.version }); await refresh(admin);
    await f.getByTestId('record-version-conflict').waitFor(); assert.equal(await f.getByTestId('record-version-conflict').getAttribute('role'), 'alert');
    assert.equal(await f.locator('[name="sheetRef"]').inputValue(), 'DRAFT-REFRESH-' + nonce); assert.equal(await f.locator('[name="leadTimeDays"]').inputValue(), '9'); assert.equal(await f.getByRole('button', { name: 'Save', exact: true }).isDisabled(), true);
    await f.getByRole('button', { name: 'Discard draft and load current values', exact: true }).click();
    assert.equal(await f.locator('[name="sheetRef"]').inputValue(), remote.sheetRef); assert.equal(await f.locator('[name="leadTimeDays"]').inputValue(), '12'); assert.equal(await f.getByRole('button', { name: 'Save', exact: true }).isEnabled(), true);
    await fill(f, { sheetRef: 'DRAFT-409-' + nonce, leadTimeDays: '13' }); current = await record(admin, orderId);
    await good(admin, { ...remote, sheetRef: 'REMOTE-409-' + nonce, leadTimeDays: 14, version: current.version });
    await save(f, 409); await f.getByTestId('record-version-conflict').waitFor();
    assert.equal(await f.locator('[name="sheetRef"]').inputValue(), 'DRAFT-409-' + nonce); assert.equal(await f.locator('[name="leadTimeDays"]').inputValue(), '13'); assert.equal(await f.getByRole('button', { name: 'Save', exact: true }).isDisabled(), true);
    assert.ok((await f.getByRole('alert').allTextContents()).some(text => /preserved/i.test(text))); current = await record(admin, orderId); assert.equal(current.data.sheetRef, 'REMOTE-409-' + nonce); assert.equal(current.data.leadTimeDays, 14);
    await admin.page.screenshot({ path: path.join(out, 'purchase-order-conflict.png'), fullPage: true });
    await f.getByRole('button', { name: 'Discard draft and load current values', exact: true }).click(); assert.equal(await f.locator('[name="leadTimeDays"]').inputValue(), '14');
    await fill(f, { sheetRef: 'RESOLVED-' + nonce }); await save(f); current = await record(admin, orderId); assert.equal(current.data.sheetRef, 'RESOLVED-' + nonce); assert.equal(current.data.leadTimeDays, 14);
    return { orderId, persistedLeadTimes: [0, 7], unrelatedEditPreservedNumber: true, refreshPreservesDirtyDraft: true, staleSave409PreservesDraftAndRemoteSource: true, explicitDiscardAndSubsequentSave: true };
  });
  await run('role-privacy-and-private-work-log-exports', async () => {
    const vendor = await session('vendor'), client = await session('client'), other = await session('other'), staff = await session('staff');
    await nav(vendor, 'Team hours');
    const vendorForm = await form(vendor.page, 'Submit work hours');
    await fill(vendorForm, { projectId: config.projects[0], date: '2026-01-06', hours: '0.4', trade: 'Vendor isolated trade ' + nonce }); await save(vendorForm);
    const vendorSource = await find(vendor, e => e.kind === 'hours' && e.data.trade === 'Vendor isolated trade ' + nonce);
    for (const s of [client, other, vendor]) {
      const data = await snapshot(s); assert.ok(!data.entries.some(e => [projectId, leadId, orderId].includes(e.id)));
      assert.equal(await s.page.getByRole('navigation', { name: 'Command Center Navigation', exact: true }).getByRole('button', { name: /^Financial dashboard/ }).count(), 0);
      await s.page.setViewportSize({ width: 390, height: 844 });
      assert.equal(await s.page.getByRole('button', { name: /^Open financial dashboard/ }).count(), 0);
    }
    for (const s of [client, other]) { const r = await s.context.request.get(base + '/api/hours/export?format=json'); assert.equal(r.status(), 403); }
    const anonymous = await browser.newContext(); contexts.push(anonymous); const denied = await anonymous.request.get(base + '/api/hours/export?format=json'); assert.equal(denied.status(), 401);
    const vendorReport = await vendor.context.request.get(base + '/api/hours/export?format=json'); assert.equal(vendorReport.status(), 200); const vendorData = (await vendorReport.json()).report;
    const vendorSnapshot = await snapshot(vendor); assert.ok(vendorData.rows.every(row => row.ownerId === vendorSnapshot.actor.id)); assert.ok(!vendorData.rows.some(row => row.projectId === projectId));
    assert.ok(vendorData.rows.some(row => row.id === vendorSource.id), 'Positive supplier export control');
    const inaccessible = await vendor.context.request.get(base + '/api/hours/export?format=csv&projectId=' + projectId); assert.equal(inaccessible.status(), 404);
    await nav(staff, 'Financial dashboard'); await staff.page.getByTestId('module-financial-dashboard').waitFor();
    return { clientDenied: 403, anonymousDenied: 401, inaccessibleProjectDenied: 404, vendorRowsOwnOnly: true, staffDashboardAccessible: true, sourceRecordsIsolated: true };
  });
  await run('all-module-navigation-six-viewport-sizes', async () => {
    const measurements = [], sizes = [[1920, 1080], [1440, 1000], [1280, 720], [768, 1024], [390, 844], [844, 390]];
    await nav(admin, 'Executive overview'); await admin.page.locator('#portal-project-filter').selectOption(projectId);
    for (const [width, height] of sizes) {
      await admin.page.setViewportSize({ width, height });
      await nav(admin, 'Executive overview');
      const dashboardCta = admin.page.getByRole('button', { name: /^Open financial dashboard/ });
      assert.equal(await dashboardCta.isVisible(), true, 'Internal dashboard quick action remains visible');
      await dashboardCta.click(); await admin.page.getByTestId('module-financial-dashboard').waitFor();
      const toggle = admin.page.getByRole('button', { name: 'Open modules', exact: true }); if (await toggle.isVisible()) await toggle.click();
      const navigation = admin.page.getByRole('navigation', { name: 'Command Center Navigation', exact: true });
      const labels = await navigation.getByRole('button').evaluateAll(nodes => nodes.map(node => node.querySelector('span')?.textContent || node.textContent));
      assert.equal(labels[1], 'Financial dashboard', 'Dashboard is the second internal module');
      for (const label of labels) {
        await nav(admin, '^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const excess = await admin.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert.equal(excess, 0, 'Page overflow ' + width + ' ' + label);
        measurements.push({ width, height, module: label, overflow: excess });
      }
      for (const [label, testId] of [['Requests', 'commercial-requests'], ['Team hours', 'hours-report'], ['Purchase orders', 'module-purchase-orders']]) {
        await nav(admin, label); await admin.page.getByTestId(testId).waitFor();
        if (label === 'Requests') {
          await admin.page.getByLabel('Find a request', { exact: true }).fill(nonce);
          const request = admin.page.locator('[data-request-id="' + leadId + '"]'); await request.waitFor(); assert.ok((await request.textContent()).includes('$0.00'));
          await admin.page.getByLabel('Request stage', { exact: true }).first().selectOption('new'); assert.equal(await request.count(), 0);
          await admin.page.getByLabel('Request stage', { exact: true }).first().selectOption('quoted'); await request.waitFor();
        }
        if (label === 'Team hours') {
          await admin.page.locator('#portal-project-filter').selectOption(projectId);
          const work = admin.page.getByTestId('hours-report'); assert.equal((await work.getByTestId('hours-exact-total').textContent()).replace(/h$/, '').trim(), '1.305');
          await work.getByLabel('Work-log review', { exact: true }).selectOption('approved'); assert.equal((await work.getByTestId('hours-exact-total').textContent()).replace(/h$/, '').trim(), '0.1');
          await work.getByLabel('Work-log review', { exact: true }).selectOption('all');
        }
        if (label === 'Purchase orders') {
          const order = admin.page.locator('article').filter({ has: admin.page.getByRole('heading', { name: 'PO-UTILITY-' + nonce, exact: true }) });
          await openDetails(order, 'Quote, drawing and delivery details'); const sourcing = await form(order, 'Record sourcing details');
          assert.equal(await sourcing.locator('[name="leadTimeDays"]').inputValue(), '14'); assert.equal(await sourcing.locator('[name="sheetRef"]').inputValue(), 'RESOLVED-' + nonce);
        }
        assert.equal(await admin.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0, 'Expanded functional module overflow ' + width + ' ' + label);
        await admin.page.screenshot({ path: path.join(out, label.replaceAll(' ', '-').toLowerCase() + '-' + width + 'x' + height + '.png'), fullPage: true });
      }
    }
    return { measurements, sizes, allInternalModulesExercised: true, strictZeroPageOverflow: true };
  });
  assert.deepEqual(runtimeErrors, [], 'No browser runtime or hydration errors'); report.passed = true;
} catch (error) { report.passed = false; report.failure = { message: error.message, stack: error.stack }; console.error(error.stack); process.exitCode = 1;
  report.failure.domState = []; for (const [role, s] of sessions) report.failure.domState.push({ role, currentModule: await s.page.locator('main[data-current-module]').getAttribute('data-current-module'), moduleIds: await s.page.locator('[data-testid^="module-"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-testid'))) });
  for (const [role, s] of sessions) try { await s.page.screenshot({ path: path.join(out, 'failure-' + role + '.png'), fullPage: true }); } catch { /* retain original failure */ }
} finally {
  report.browserRuntimeErrors = runtimeErrors; report.completedAt = new Date().toISOString(); fs.writeFileSync(path.join(out, 'runtime-report.json'), JSON.stringify(report, null, 2));
  for (const context of contexts) await context.close(); await browser.close(); console.log(JSON.stringify({ passed: report.passed, results: report.results.map(({ name, passed }) => ({ name, passed })), evidence: out }));
}
