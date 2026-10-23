/** Local synthetic certification only. Never point this suite at customer review or production. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { randomUUID, createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
assert.ok(process.env.TAYCO_TEST_CONFIG, 'A private synthetic fixture configuration is required.');
const configFile = path.resolve(process.env.TAYCO_TEST_CONFIG);
const relativeConfig = path.relative(path.join(root, '.data'), configFile).split(path.sep);
assert.ok(relativeConfig.length >= 2 && /^certification-[\w-]+$/.test(relativeConfig[0]) && !relativeConfig.includes('..'), 'Use a disposable .data/certification-* fixture.');
const config = JSON.parse(fs.readFileSync(configFile, 'utf8')), base = config.baseUrl;
assert.match(base, /^http:\/\/(?:localhost|127\.0\.0\.1):3010$/, 'Only the isolated local :3010 fixture is permitted.');
for (const file of [config.authDb, config.erpDb]) {
  assert.equal(typeof file, 'string');
  const relative = path.relative(path.dirname(configFile), path.resolve(file));
  assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'Fixture databases must remain inside the fixture directory.');
}
for (const [role, account] of Object.entries(config.accounts)) assert.ok(account.email?.endsWith('@example.test') && account.cookie, 'Only synthetic accounts: ' + role);
for (const role of ['admin', 'client', 'vendor']) assert.ok(config.accounts[role], 'Missing synthetic role ' + role);
assert.equal(process.env.TAYCO_ESTIMATE_UI_BUILD_READY, '1', 'Wait for the new isolated build readiness notice before running this suite.');
const { chromium } = createRequire(import.meta.url)(process.env.TAYCO_PLAYWRIGHT_MODULE || 'playwright');
const evidence = path.resolve(process.env.TAYCO_EVIDENCE_DIR || path.join(root, '.data', 'certification', 'estimate-ui-' + Date.now()));
const relativeEvidence = path.relative(path.join(root, '.data'), evidence);
assert.ok(relativeEvidence && !relativeEvidence.startsWith('..') && !path.isAbsolute(relativeEvidence));
fs.mkdirSync(evidence, { recursive: true });
const report = { startedAt: new Date().toISOString(), base, sourceSha256: createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'), results: [], limits: ['Synthetic isolated account/project/source metadata only.', 'Browser touch and reduced-motion emulation do not certify physical mobile hardware.', 'No live Takeoff, customer sources, financial transactions or external services.'] };
const browser = await chromium.launch({ headless: true }), contexts = [], pageErrors = [];
const nonce = randomUUID().replaceAll('-', '').slice(0, 12), name = 'Synthetic estimating UI ' + nonce, slug = 'estimate_ui_' + nonce;
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
async function session(role, viewport = { width: 1440, height: 1000 }, touch = false) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce', hasTouch: touch, isMobile: touch }); contexts.push(context);
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort('blockedbyclient'));
  await context.addCookies([{ name: 'tayco_session', value: encodeURIComponent(config.accounts[role].cookie), url: base, httpOnly: true, sameSite: 'Lax', secure: true }]);
  const page = await context.newPage(); page.on('pageerror', error => pageErrors.push({ role, error: error.message }));
  return { context, page, role };
}
async function snapshot(s) { const response = await s.context.request.get(base + '/api/erp-suite'); assert.equal(response.status(), 200); return response.json(); }
async function command(s, data, expected = 200) {
  const response = await s.context.request.post(base + '/api/erp-suite', { headers: { Origin: base, 'Idempotency-Key': randomUUID() }, data });
  assert.equal(response.status(), expected, await response.text()); return expected === 200 ? (await response.json()).result : null;
}
async function open(s) {
  await s.page.goto(base + '/portal', { waitUntil: 'domcontentloaded' }); await s.page.getByTestId('executive-console').waitFor();
  await s.page.locator('body[data-motion="reduced"]').waitFor();
  const controls = s.page.getByTestId('workspace-display-controls'); await controls.locator('summary').click();
  await controls.getByRole('button', { name: 'Calm', exact: true }).click();
  await s.page.locator('[data-testid="executive-console"][data-atmosphere="calm"]').waitFor();
  await controls.getByRole('button', { name: 'Deep', exact: true }).click();
  await s.page.locator('[data-testid="executive-console"][data-atmosphere="deep"]').waitFor();
  await controls.locator('summary').click();
}
async function nav(s, label) {
  const navigation = s.page.getByRole('navigation', { name: 'Command Center Navigation', exact: true });
  if (!await navigation.isVisible()) await s.page.getByRole('button', { name: 'Open modules', exact: true }).click();
  await navigation.getByRole('button', { name: new RegExp(label, 'i') }).click();
}
async function scope(s, id) { await s.page.locator('#portal-project-filter').selectOption(id); }
async function noOverflow(s) {
  const width = await s.page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
  assert.ok(width.content <= width.viewport + 1, 'Page overflow: ' + JSON.stringify(width)); return width;
}
async function run(label, fn) {
  const started = Date.now();
  try { const details = await fn(); report.results.push({ label, passed: true, elapsedMs: Date.now() - started, ...details }); console.log(label + ': passed'); }
  catch (error) { report.results.push({ label, passed: false, error: error.message }); throw error; }
}
let project, revisions;
try {
  const admin = await session('admin');
  await run('synthetic source recovery', async () => {
    const state = await snapshot(admin); assert.equal(state.actor.role, 'admin'); assert.ok(state.actor.email.endsWith('@example.test'));
    project = await command(admin, { action: 'restore_estimate_project', sourceProjectSlug: slug, name });
    assert.equal(project.data.progress, null); assert.equal(project.data.budgetUsd, null);
    const common = { projectId: project.id, projectName: name, sourceProjectSlug: slug, status: 'estimate', currency: 'USD', estimatedOn: '2026-01-05', dateBasis: 'source_snapshot', capturedAt: new Date().toISOString(), sourceAvailability: 'archived', breakdownBasis: 'direct_cost', costTiers: [], costTiersReconciled: false, rawCostLineCount: 4 };
    revisions = [
      { ...common, id: 'ui-scenario-' + nonce, version: 'Synthetic scenario ' + nonce, amountUsd: 125.25, directCostUsd: 90, sourceName: 'Synthetic scenario source', sourceRef: 'private-estimates/' + slug + '/scenario.json', sourceSha256: createHash('sha256').update(slug + '-scenario').digest('hex'), breakdown: [], breakdownReconciled: false, sourceFacts: ['Synthetic independent estimate revision; no actual payments or measured progress.'] },
      { ...common, id: 'ui-boq-' + nonce, version: 'Synthetic BOQ ' + nonce, amountUsd: 140.75, directCostUsd: 100, sourceName: 'Synthetic BOQ source', sourceRef: 'private-estimates/' + slug + '/report.html', sourceSha256: createHash('sha256').update(slug + '-boq').digest('hex'), breakdown: [{ code: 'CSI 01.01', label: 'Synthetic general scope', amountUsd: 40.05 }, { code: 'CSI 03.01', label: 'Synthetic concrete scope', amountUsd: 59.95 }], breakdownReconciled: true, costTiers: [{ code: 'materials', label: 'Synthetic materials', amountUsd: 50 }, { code: 'labor', label: 'Synthetic labor', amountUsd: 30 }, { code: 'equipment', label: 'Synthetic equipment', amountUsd: 20 }], costTiersReconciled: true, sourceFacts: ['Synthetic BOQ direct costs reconcile to 100 USD; bid is an independent 140.75 USD estimate.'] },
    ];
    for (const estimate of revisions) await command(admin, { action: 'import_project_estimate', projectId: project.id, estimate });
    const after = await snapshot(admin), related = after.entries.filter(entry => entry.projectId === project.id);
    assert.equal(related.filter(entry => entry.kind === 'estimate').length, 2); assert.equal(related.filter(entry => entry.kind === 'invoice').length, 0);
    assert.equal(related.find(entry => entry.kind === 'project').data.budgetUsd, null);
    return { independentRevisions: 2, inferredPayments: 0, progressUnknown: true, budgetUnknown: true };
  });
  await run('revision selection and private source comparison', async () => {
    await open(admin); await scope(admin, project.id);
    const console = admin.page.getByTestId('executive-console'), select = console.getByLabel(/^Estimate revision/);
    await select.waitFor();
    assert.equal(await select.locator('option').count(), 2);
    await select.selectOption(revisions[0].id); await console.locator('.workspace-estimate-headline strong').filter({ hasText: /^\$125\.25$/ }).waitFor();
    await console.getByText('CSI packages are not reconciled in this revision.', { exact: true }).waitFor();
    const firstOption = await select.locator('option').first().getAttribute('value');
    await select.focus(); await admin.page.keyboard.press('Home'); await admin.page.keyboard.press('Enter');
    assert.equal(await select.inputValue(), firstOption);
    await select.selectOption(revisions[1].id);
    await console.locator('.workspace-estimate-headline strong').filter({ hasText: /^\$140\.75$/ }).waitFor();
    const distribution = console.getByTestId('estimate-cost-distribution'); await distribution.getByRole('img').waitFor();
    await distribution.getByRole('button', { name: /Synthetic general scope/ }).click();
    assert.equal(await distribution.getByRole('button', { name: /Synthetic general scope/ }).getAttribute('aria-pressed'), 'true');
    await console.getByRole('button', { name: 'Cost tiers', exact: true }).click();
    await distribution.getByRole('button', { name: /Synthetic materials/ }).waitFor();
    await distribution.getByRole('button', { name: /Synthetic labor/ }).waitFor();
    await distribution.getByRole('button', { name: /Synthetic equipment/ }).waitFor();
    await console.getByRole('button', { name: 'CSI packages', exact: true }).click();
    await console.getByText(/^(Progress not recorded|Progress unknown)$/).waitFor();
    assert.equal(await console.locator('progress').count(), 0);
    await console.getByRole('button', { name: 'Compare source revisions', exact: true }).click();
    const archive = admin.page.getByTestId('estimate-archive'); await archive.waitFor();
    await archive.getByTestId('estimate-revision-difference').waitFor();
    assert.equal(await archive.getByRole('table').first().locator('tbody tr').count(), 2);
    await archive.getByText(money(125.25), { exact: true }).waitFor(); await archive.getByText(money(140.75), { exact: true }).waitFor();
    const detail = archive.locator('details').filter({ hasText: 'Synthetic BOQ source' });
    await detail.locator('summary').click(); await detail.getByText('Reconciled · estimated direct costs · 2 divisions', { exact: true }).waitFor();
    await detail.getByText(money(40.05), { exact: true }).waitFor(); await detail.getByText(money(59.95), { exact: true }).waitFor();
    await detail.getByText(revisions[1].sourceRef, { exact: true }).waitFor();
    await admin.page.screenshot({ path: path.join(evidence, 'desktop-source-costs.png'), fullPage: true });
    return { keyboardRevisionSelection: true, totalsRemainSeparate: true, exactSourceCentsVisible: true, sourceProvenanceVisible: true };
  });
  await run('display persistence and keyboard controls', async () => {
    await nav(admin, 'Executive overview');
    const controls = admin.page.getByTestId('workspace-display-controls'); await controls.locator('summary').click();
    await controls.getByRole('button', { name: 'Calm', exact: true }).click();
    await admin.page.locator('[data-testid="executive-console"][data-atmosphere="calm"]').waitFor();
    await controls.getByRole('button', { name: 'Compact', exact: true }).click();
    await admin.page.locator('[data-testid="executive-console"][data-density="compact"]').waitFor();
    const light = controls.getByRole('slider', { name: /Light direction/ }); await light.focus(); await admin.page.keyboard.press('Home'); await admin.page.keyboard.press('ArrowRight');
    const expectedLight = await light.inputValue(); assert.equal(expectedLight, '20');
    await admin.page.reload({ waitUntil: 'domcontentloaded' }); const console = admin.page.getByTestId('executive-console'); await console.waitFor();
    await admin.page.locator('[data-testid="executive-console"][data-atmosphere="calm"][data-density="compact"]').waitFor();
    assert.equal(await console.getAttribute('data-atmosphere'), 'calm'); assert.equal(await console.getAttribute('data-density'), 'compact');
    assert.ok((await console.getAttribute('style')).includes(expectedLight + 'deg'));
    await admin.page.getByTestId('workspace-display-controls').locator('summary').click();
    await admin.page.getByRole('button', { name: 'Deep', exact: true }).click(); await admin.page.reload({ waitUntil: 'domcontentloaded' });
    await admin.page.locator('[data-testid="executive-console"][data-atmosphere="deep"]').waitFor();
    assert.equal(await admin.page.getByTestId('executive-console').getAttribute('data-atmosphere'), 'deep');
    return { calmAndDeepPersist: true, compactPersists: true, lightKeyboardAndPersistence: true };
  });
  await run('external role protection', async () => {
    const details = [];
    for (const role of ['client', 'vendor']) {
      const s = await session(role); const state = await snapshot(s);
      assert.ok(!state.entries.some(entry => entry.kind === 'estimate'));
      await command(s, { action: 'import_project_estimate', projectId: project.id, estimate: revisions[0] }, 403);
      await open(s); const navigation = s.page.getByRole('navigation', { name: 'Command Center Navigation', exact: true });
      assert.equal(await navigation.getByRole('button', { name: /Estimates & scenarios/ }).count(), 0);
      assert.equal(await s.page.getByLabel(/^Estimate revision/).count(), 0);
      assert.ok(!(await s.page.locator('body').textContent()).includes(name)); details.push({ role, denied: true });
    }
    return { roles: details };
  });
  await run('six responsive sizes with touch and reduced motion', async () => {
    const sizes = [[1920, 1080], [1440, 1000], [1280, 720], [768, 1024], [390, 844], [844, 390]], measured = [];
    for (const [width, height] of sizes) {
      const touch = width < 1024, s = await session('admin', { width, height }, touch); await open(s); await scope(s, project.id);
      assert.equal(await s.page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
      const select = s.page.getByLabel(/^Estimate revision/); await select.selectOption(revisions[1].id);
      await s.page.getByTestId('estimate-cost-distribution').getByRole('img').waitFor();
      if (touch) {
        const controls = s.page.getByTestId('workspace-display-controls'); await controls.locator('summary').tap();
        await controls.getByRole('button', { name: 'Calm', exact: true }).tap();
        await s.page.locator('[data-testid="executive-console"][data-atmosphere="calm"]').waitFor();
        assert.equal(await s.page.getByTestId('executive-console').getAttribute('data-atmosphere'), 'calm');
        await controls.locator('summary').tap();
      }
      const dimensions = await noOverflow(s);
      if (width === 1440 || width === 390) await s.page.screenshot({ path: path.join(evidence, width === 390 ? 'mobile-boq-overview.png' : 'desktop-boq-overview.png'), fullPage: true });
      await nav(s, 'Estimates & scenarios'); await s.page.getByTestId('estimate-archive').waitFor(); await noOverflow(s);
      measured.push({ width, height, touch, reducedMotion: true, ...dimensions });
    }
    return { sizes: measured };
  });
  assert.deepEqual(pageErrors, [], 'Browser runtime errors occurred.'); report.completedAt = new Date().toISOString();
} catch (error) { report.failed = true; report.error = error.message; process.exitCode = 1; console.error(error.message); }
finally { report.pageErrors = pageErrors; fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2)); for (const context of contexts) await context.close(); await browser.close(); console.log('Evidence: ' + evidence); }
