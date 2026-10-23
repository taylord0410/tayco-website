/** Real commit, lost browser response, unmount and exact retained-intent replay. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
assert.ok(process.env.TAYCO_TEST_CONFIG, 'Disposable synthetic fixture config required.');
const configPath = fs.realpathSync(path.resolve(process.env.TAYCO_TEST_CONFIG));
const relative = path.relative(path.join(root, '.data'), configPath).split(path.sep);
assert.ok(relative.length === 2 && /^certification-modules-[\w-]+$/.test(relative[0]) && !relative.includes('..'));
const config = JSON.parse(fs.readFileSync(configPath, 'utf8')), base = config.baseUrl;
assert.match(base, /^http:\/\/(?:localhost|127\.0\.0\.1):3010$/);
for (const database of [config.authDb, config.erpDb]) {
  const rel = path.relative(path.dirname(configPath), fs.realpathSync(database));
  assert.ok(rel && !rel.startsWith('..') && !path.isAbsolute(rel));
}
assert.ok(config.accounts.admin.email.endsWith('@example.test') && config.accounts.admin.cookie);
assert.equal(process.env.TAYCO_COMMAND_RETRY_BUILD_READY, '1', 'Explicit isolated build readiness required.');
const evidence = path.resolve(process.env.TAYCO_EVIDENCE_DIR || path.join(root, '.data', 'certification', 'command-retry-' + Date.now()));
const evidenceRelative = path.relative(path.join(root, '.data'), evidence);
assert.ok(evidenceRelative && !evidenceRelative.startsWith('..') && !path.isAbsolute(evidenceRelative)); fs.mkdirSync(evidence, { recursive: true });
const { chromium } = createRequire(import.meta.url)(process.env.TAYCO_PLAYWRIGHT_MODULE || 'playwright');
const nonce = randomUUID().slice(0, 12), errors = [];
const report = { startedAt: new Date().toISOString(), base, sourceSha256: createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'), results: [], limits: ['Disposable synthetic records; no customer data, ACL/session changes, external provider or payment execution.', 'Journal survives module/project changes within the mounted workspace; browser reload/close remains outside this guarantee.'] };
const browser = await chromium.launch({ headless: true }), context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort('blockedbyclient'));
await context.addCookies([{ name: 'tayco_session', value: encodeURIComponent(config.accounts.admin.cookie), url: base, httpOnly: true, sameSite: 'Lax', secure: true }]);
const page = await context.newPage(); page.setDefaultTimeout(15000);
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error' && /React|hydration|server rendered HTML|uncaught|unhandled/i.test(message.text())) errors.push(message.text()); });
const apiUrl = base + '/api/erp-suite';
const exact = text => new RegExp('^' + text.replace(/[.*+?^{}()|[\]\\$]/g, '\\$&') + '$');
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
async function deadline(promise) { let timer; try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Expected intercepted server commit within 15 seconds.')), 15000); })]); } finally { clearTimeout(timer); } }
async function snapshot() { const response = await context.request.get(apiUrl); assert.equal(response.status(), 200); return response.json(); }
async function record(id) { const result = (await snapshot()).entries.find(item => item.id === id); assert.ok(result); return result; }
async function post(body) {
  const response = await context.request.post(apiUrl, { headers: { Origin: base, 'Idempotency-Key': randomUUID() }, data: body });
  assert.equal(response.status(), 200, await response.text()); return (await response.json()).result;
}
async function nav(label) {
  const navigation = page.getByRole('navigation', { name: 'Command Center Navigation', exact: true });
  if (!await navigation.isVisible()) await page.getByRole('button', { name: 'Open modules', exact: true }).click();
  await navigation.getByRole('button', { name: label === 'Projects' ? /^Projects(?:\s+\d+)?$/ : label, exact: true }).click();
}
async function form(scope, title) {
  const summary = scope.locator('summary').filter({ hasText: exact(title) });
  assert.equal(await summary.count(), 1, 'Unique form: ' + title);
  const details = summary.locator('..'); if (await details.getAttribute('open') === null) await summary.click();
  return details.locator('form');
}
async function fill(target, values) {
  for (const [key, value] of Object.entries(values)) {
    const control = target.locator('[name="' + key + '"]');
    if (await control.evaluate(element => element.tagName === 'SELECT')) await control.selectOption(String(value)); else await control.fill(String(value));
  }
}
async function planning(projectId) {
  await nav('Financial dashboard'); await page.getByTestId('financial-dashboard').waitFor(); await page.locator('#portal-project-filter').selectOption(projectId);
  const summary = page.locator('.fd-planning-controls > .fd-panel-content > details > summary');
  if (await summary.locator('..').getAttribute('open') === null) await summary.click();
  return form(page.getByTestId('financial-dashboard'), 'Add a dated project forecast');
}
async function noJournal() { await page.getByTestId('pending-command-recovery').waitFor({ state: 'detached' }); }
async function loss(title, hold) {
  const reached = deferred(), release = deferred(), attempts = []; let receipt;
  const handler = async route => {
    const request = route.request(); if (request.method() !== 'POST') return route.fallback();
    const body = request.postDataJSON(); if (body.action !== 'record_project_forecast' || body.title !== title) return route.fallback();
    attempts.push({ key: request.headers()['idempotency-key'], body: request.postData() });
    if (attempts.length > 1) return route.continue();
    const response = await route.fetch(); assert.equal(response.status(), 200, await response.text());
    receipt = (await response.json()).result; reached.resolve(); if (hold) await release.promise;
    await route.abort('failed');
  };
  await page.route(apiUrl, handler);
  return { reached, release, attempts, receipt: () => receipt, close: () => page.unroute(apiUrl, handler) };
}
const today = new Date().toISOString().slice(0, 10), date = new Date(today + 'T12:00:00Z');
date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + 1); const dueOn = date.toISOString().slice(0, 7) + '-15';
try {
  const project = await post({ action: 'create_project', name: 'Synthetic retry project ' + nonce, nextAction: 'Retained request test' });
  const otherProject = await post({ action: 'create_project', name: 'Synthetic retry second project ' + nonce, nextAction: 'Unrelated draft target' });
  await page.goto(base + '/portal', { waitUntil: 'domcontentloaded' }); await page.getByTestId('executive-console').waitFor();
  const firstTitle = 'Synthetic retained plan ' + nonce, first = await loss(firstTitle, true);
  let target = await planning(project.id);
  await fill(target, { title: firstTitle, direction: 'client_collection', amountUsd: '17.23', dueOn, source: 'Synthetic retained-intent evidence' });
  await target.getByRole('button', { name: 'Save', exact: true }).click(); await deadline(first.reached.promise);
  assert.equal((await record(project.id)).data.forecastPlans.filter(item => item.title === firstTitle).length, 1);
  await page.getByTestId('pending-command-recovery').filter({ hasText: 'Saving request' }).waitFor();
  await nav('Projects'); await page.locator('#portal-project-filter').selectOption(otherProject.id);
  const newProjectForm = await form(page.getByTestId('module-project'), 'Add a project');
  assert.equal(await newProjectForm.getByRole('button', { name: 'Save', exact: true }).isDisabled(), true, 'Other writes disabled while busy.');
  first.release.resolve(); await page.getByRole('button', { name: 'Retry retained request', exact: true }).waitFor();
  assert.equal(await newProjectForm.getByRole('button', { name: 'Save', exact: true }).isDisabled(), true, 'Other writes disabled while uncertain.');
  assert.equal(first.attempts.length, 1);
  let current = await record(project.id); const latestMarker = 'Synthetic concurrent source ' + nonce;
  await post({ action: 'update_project', id: project.id, version: current.version, status: 'active', progress: null, nextAction: latestMarker });
  const replayResponse = page.waitForResponse(response => response.url() === apiUrl && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Retry retained request', exact: true }).click();
  const replay = await replayResponse; assert.equal(replay.status(), 200); assert.equal((await replay.json()).result.version, first.receipt().version);
  await noJournal(); assert.equal(first.attempts.length, 2); assert.deepEqual(first.attempts[1], first.attempts[0]);
  current = await record(project.id); assert.equal(current.data.forecastPlans.filter(item => item.title === firstTitle).length, 1); assert.ok(current.version > first.receipt().version);
  await page.locator('#portal-project-filter').selectOption(project.id); await page.locator('p').filter({ hasText: exact(latestMarker) }).waitFor();
  const stored = await page.evaluate(() => [...Object.values(localStorage), ...Object.values(sessionStorage)].join('\n'));
  assert.equal(stored.includes(firstTitle), false, 'Private payload never enters browser storage.'); await first.close();
  report.results.push({ group: 'lost-response-unmount-global-replay', passed: true, attempts: 2, sameBodyAndKey: true, savedPlans: 1, originalReceiptVersion: first.receipt().version, currentVersion: current.version, busyAndUncertainBlockOtherWrites: true });
  await page.screenshot({ path: path.join(evidence, 'recovered-after-unmount.png'), fullPage: true });

  const secondTitle = 'Synthetic local retained plan ' + nonce, second = await loss(secondTitle, false);
  target = await planning(project.id);
  await fill(target, { title: secondTitle, direction: 'internal_cost', amountUsd: '9.51', dueOn, source: 'Synthetic local-retry evidence' });
  await target.getByRole('button', { name: 'Save', exact: true }).click(); await deadline(second.reached.promise);
  await target.getByRole('button', { name: 'Retry this request', exact: true }).waitFor(); await target.getByRole('button', { name: 'Retry this request', exact: true }).click();
  await noJournal(); await target.getByRole('status').filter({ hasText: 'Saved.' }).waitFor();
  assert.equal(await target.locator('[name="title"]').isEnabled(), true); assert.equal(await target.getByRole('button', { name: 'Retry this request', exact: true }).count(), 0);
  assert.equal((await record(project.id)).data.forecastPlans.filter(item => item.title === secondTitle).length, 1); assert.equal(second.attempts.length, 2); assert.deepEqual(second.attempts[1], second.attempts[0]); await second.close();
  report.results.push({ group: 'mounted-form-local-retry-notification', passed: true, savedPlans: 1, sameBodyAndKey: true });

  await nav('Projects'); await page.locator('#portal-project-filter').selectOption(project.id);
  const article = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Synthetic retry project ' + nonce, exact: true }) });
  const update = await form(article, 'Update project'); await fill(update, { nextAction: 'Synthetic losing draft ' + nonce });
  const winner = 'Synthetic known-conflict winner ' + nonce; let conflictStatus = null, conflictTriggered = false;
  const conflictHandler = async route => {
    const request = route.request();
    if (conflictTriggered || request.method() !== 'POST' || request.postDataJSON().action !== 'update_project' || request.postDataJSON().id !== project.id) return route.fallback();
    conflictTriggered = true;
    const latest = await record(project.id); await post({ action: 'update_project', id: project.id, version: latest.version, status: 'active', progress: null, nextAction: winner });
    const response = await route.fetch(); conflictStatus = response.status(); await route.fulfill({ response });
  };
  await page.route(apiUrl, conflictHandler); await update.getByRole('button', { name: 'Save', exact: true }).click();
  await update.getByTestId('record-version-conflict').waitFor(); await noJournal(); assert.equal(conflictStatus, 409); await page.unroute(apiUrl, conflictHandler);
  assert.equal(await update.locator('[name="nextAction"]').inputValue(), 'Synthetic losing draft ' + nonce);
  await update.getByRole('button', { name: 'Discard draft and load current values', exact: true }).click();
  assert.equal(await update.locator('[name="nextAction"]').inputValue(), winner); assert.equal(await update.getByRole('button', { name: 'Save', exact: true }).isEnabled(), true);
  report.results.push({ group: 'definitive-409-releases-journal', passed: true, status: conflictStatus, draftPreservedUntilExplicitDiscard: true });
  assert.deepEqual(errors, []); report.passed = true; report.completedAt = new Date().toISOString();
} catch (error) {
  report.passed = false; report.failure = error.stack || String(error);
  await page.screenshot({ path: path.join(evidence, 'failure.png'), fullPage: true }).catch(() => {}); throw error;
} finally {
  report.runtimeErrors = errors; fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2));
  await context.close(); await browser.close(); console.log(JSON.stringify({ passed: report.passed, groups: report.results.length, evidence }));
}
