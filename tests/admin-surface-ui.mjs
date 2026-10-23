/** Read-only marketing/private layout regression; does not certify business mutations. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
assert.ok(process.env.TAYCO_TEST_CONFIG, 'A disposable fixture is required.');
const configPath = fs.realpathSync(path.resolve(process.env.TAYCO_TEST_CONFIG));
assert.ok(configPath.startsWith(path.join(root, '.data', 'certification-modules-')));
const config = JSON.parse(fs.readFileSync(configPath, 'utf8')), base = config.baseUrl;
assert.match(base, /^http:\/\/(?:localhost|127\.0\.0\.1):3010$/);
for (const file of [config.authDb, config.erpDb]) { const relative = path.relative(path.dirname(configPath), fs.realpathSync(file)); assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative)); }
for (const actor of Object.values(config.accounts)) assert.ok(actor.email.endsWith('@example.test'));
const out = path.resolve(process.env.TAYCO_EVIDENCE_DIR || path.join(root, '.data', 'certification', 'admin-surface-' + Date.now()));
assert.ok(out.startsWith(path.join(root, '.data') + path.sep)); fs.mkdirSync(out, { recursive: true });
const { chromium } = createRequire(import.meta.url)(process.env.TAYCO_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true }), contexts = [], runtimeErrors = [], mutationAttempts = [], requests = [];
const buildIdBytes = fs.readFileSync(path.join(root, '.next', 'BUILD_ID'));
const report = { startedAt: new Date().toISOString(), base, buildId: buildIdBytes.toString('utf8').trim(), buildIdSha256: createHash('sha256').update(buildIdBytes).digest('hex'), sourceSha256: createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'), results: [], limits: ['Targeted layout and read-only navigation regression on disposable synthetic accounts; does not recertify business mutations.', 'No submissions, invitation/access/password changes, sign-outs or customer writes.', 'Browser viewport emulation is not physical mobile hardware.'] };
const publicPaths = ['/', '/commercial', '/residential', '/investor', '/estimate', '/privacy', '/vendor-application'];
const marketingPaths = ['/commercial', '/residential', '/investor', '/estimate', '/vendor-application'];
const sizes = [[1920, 1080], [1440, 1000], [1280, 720], [768, 1024], [390, 844], [844, 390]];
async function context(role, javaScriptEnabled = true) {
  const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', javaScriptEnabled }); contexts.push(c);
  await c.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== base) return route.abort();
    requests.push({ method: request.method(), pathname: url.pathname });
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) { mutationAttempts.push({ method: request.method(), pathname: url.pathname }); return route.abort(); }
    return route.continue();
  });
  if (role) await c.addCookies([{ name: 'tayco_session', value: encodeURIComponent(config.accounts[role].cookie), url: base, httpOnly: true, sameSite: 'Lax', secure: true }]);
  const page = await c.newPage(); page.setDefaultTimeout(15000);
  page.on('pageerror', error => runtimeErrors.push({ role, message: error.message }));
  page.on('console', message => { if (message.type() === 'error' && /hydration|Minified React error|server rendered HTML/i.test(message.text())) runtimeErrors.push({ role, message: message.text() }); });
  return { context: c, page };
}
async function goto(s, pathname) { const start = Date.now(), r = await s.page.goto(base + pathname, { waitUntil: 'domcontentloaded' }); report.lastNavigation = { pathname, actualUrl: s.page.url(), status: r.status() }; return { pathname, status: r.status(), elapsedMs: Date.now() - start }; }
async function privateChrome(s, unmatched = false) {
  if (!unmatched) await s.page.locator('[data-site-surface="workspace"]').waitFor(); assert.equal(await s.page.locator('.tayco-site-header').count(), 0); assert.equal(await s.page.locator('[data-site-surface] > footer').count(), 0);
  for (const href of marketingPaths) assert.equal(await s.page.locator('a[href="' + href + '"]').count(), 0, 'No public marketing link on private surface: ' + href);
  if (!unmatched) { const skip = s.page.getByRole('link', { name: /^Skip to (?:workspace )?content$/ }); await skip.waitFor({ state: 'attached' }); assert.equal(await skip.getAttribute('href'), '#main-content'); }
}
async function publicChrome(s) { await s.page.locator('[data-site-surface="public"]').waitFor(); assert.equal(await s.page.locator('.tayco-site-header').count(), 1); assert.equal(await s.page.locator('[data-site-surface] > footer').count(), 1); assert.equal(await s.page.getByRole('navigation', { name: 'Main navigation', exact: true }).count(), 1); }
async function hydratedPortal(s) {
  await s.page.getByTestId('executive-console').waitFor(); await s.page.locator('body[data-motion="reduced"]').waitFor();
  const controls = s.page.getByTestId('workspace-display-controls'); if (await controls.getAttribute('open') === null) await controls.locator('summary').click();
  await controls.getByRole('button', { name: 'Calm', exact: true }).click(); await s.page.locator('[data-testid="executive-console"][data-atmosphere="calm"]').waitFor();
  await controls.getByRole('button', { name: 'Deep', exact: true }).click(); await s.page.locator('[data-testid="executive-console"][data-atmosphere="deep"]').waitFor(); await controls.locator('summary').click();
}
async function nav(s, label) {
  const start = Date.now(), toggle = s.page.getByRole('button', { name: 'Open modules', exact: true }); if (await toggle.isVisible()) await toggle.click();
  const button = s.page.getByRole('navigation', { name: 'Command Center Navigation', exact: true }).getByRole('button', { name: new RegExp('^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) });
  await button.click(); const region = s.page.getByRole('region', { name: label, exact: true }); await region.waitFor();
  await s.page.waitForFunction(title => { const active = document.activeElement; return active?.getAttribute('role') === 'region' && active.getAttribute('aria-label') === title; }, label);
  return Date.now() - start;
}
async function overflow(s, label) { const excess = await s.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert.equal(excess, 0, label + ': horizontal page overflow'); return excess; }
async function run(name, fn) { const start = Date.now(); try { const details = await fn(); report.results.push({ name, passed: true, elapsedMs: Date.now() - start, ...details }); console.log(name + ': passed'); } catch (error) { report.results.push({ name, passed: false, error: error.message, stack: error.stack, elapsedMs: Date.now() - start }); console.error(name + ': ' + error.message); for (let i = 0; i < contexts.length; i++) for (const page of contexts[i].pages()) try { await page.screenshot({ path: path.join(out, name + '-failure-' + i + '.png'), fullPage: true }); } catch { /* Continue independent read-only groups. */ } } }
try {
  await run('private-ssr-with-javascript-disabled-and-nested-paths', async () => {
    const s = await context('admin', false), measurements = [];
    report.ssrMeasurements = measurements;
    for (const pathname of ['/portal', '/account', '/login', '/portal/__surface_probe__', '/account/__surface_probe__', '/login/__surface_probe__']) {
      const measurement = await goto(s, pathname); measurement.publicHeaderCount = await s.page.locator('.tayco-site-header').count(); measurement.publicFooterCount = await s.page.locator('[data-site-surface] > footer').count(); measurements.push(measurement);
      assert.ok([200, 404].includes(measurement.status)); await privateChrome(s, measurement.status === 404);
    }
    await s.context.close(); return { javaScriptEnabled: false, measurements, initialDomPublicHeaderCount: 0, initialDomPublicFooterCount: 0 };
  });
  await run('public-pages-retain-marketing-chrome-and-mobile-keyboard-menu', async () => {
    const s = await context('admin'), measurements = [];
    for (const pathname of publicPaths) { const measurement = await goto(s, pathname); assert.equal(measurement.status, 200); await publicChrome(s); measurement.overflow = await overflow(s, pathname); measurements.push(measurement); }
    for (const [width, height] of [[390, 844], [844, 390]]) {
      await s.page.setViewportSize({ width, height }); await goto(s, '/'); await s.page.locator('body[data-motion="reduced"]').waitFor();
      const toggle = s.page.getByRole('button', { name: 'Open navigation', exact: true }); await toggle.focus(); await s.page.keyboard.press('Enter');
      await s.page.getByRole('button', { name: 'Close navigation', exact: true }).waitFor(); const mobile = s.page.getByRole('navigation', { name: 'Mobile navigation', exact: true }); await mobile.waitFor();
      const first = mobile.getByRole('link', { name: 'Commercial', exact: true }); await first.focus(); await s.page.keyboard.press('Escape');
      await toggle.waitFor(); assert.equal(await toggle.evaluate(e => e === document.activeElement), true); assert.equal(await mobile.isVisible(), false); assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      measurements.push({ width, height, keyboardOpenEscapeFocusRestored: true, overflow: await overflow(s, 'public menu') });
    }
    await s.context.close(); return { measurements, publicPages: publicPaths.length };
  });
  await run('client-navigation-updates-chrome-both-directions-without-document-reload', async () => {
    const s = await context('admin'); await goto(s, '/'); await publicChrome(s); const witness = randomUUID(); await s.page.evaluate(value => { window.__taycoSurfaceWitness = value; }, witness);
    const transitions = [];
    async function click(locator, pathname, surface) {
      const start = Date.now(); await locator.click(); await s.page.waitForURL(url => url.pathname === pathname); if (surface === 'workspace') await privateChrome(s); else await publicChrome(s);
      assert.equal(await s.page.evaluate(() => window.__taycoSurfaceWitness), witness, 'Next Link navigation should retain the document'); transitions.push({ pathname, surface, elapsedMs: Date.now() - start });
    }
    await click(s.page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Workspace', exact: true }), '/portal', 'workspace'); await hydratedPortal(s);
    await click(s.page.getByRole('link', { name: 'Account & access', exact: true }), '/account', 'workspace');
    await s.page.getByRole('link', { name: 'Open project workspace', exact: true }).waitFor(); assert.equal(await s.page.getByRole('button', { name: 'Update password', exact: true }).isEnabled(), true);
    await click(s.page.getByRole('link', { name: 'Open project workspace', exact: true }), '/portal', 'workspace'); await hydratedPortal(s);
    await click(s.page.getByRole('link', { name: 'Account & access', exact: true }), '/account', 'workspace');
    await click(s.page.getByRole('link', { name: 'TAYCO TURNKEY', exact: true }), '/', 'public');
    await click(s.page.getByRole('link', { name: 'Team, client & supplier sign in', exact: true }), '/login', 'workspace');
    const help = s.page.getByRole('button', { name: 'Need help signing in?', exact: true }); await help.focus(); await s.page.keyboard.press('Enter'); await s.page.getByText(/password recovery requires identity verification/).waitFor(); assert.equal(await help.getAttribute('aria-expanded'), 'true');
    assert.equal(await s.page.getByLabel('Email address', { exact: true }).isEnabled(), true); assert.equal(await s.page.getByLabel('Password', { exact: true }).isEnabled(), true);
    await click(s.page.getByRole('link', { name: 'Return to TAYCO', exact: true }), '/', 'public'); await s.context.close(); return { transitions, sameDocument: true, formControlsRenderedOnly: true };
  });
  await run('private-navigation-six-sizes-focus-zero-gap-refresh', async () => {
    const s = await context('admin'); await goto(s, '/portal'); await hydratedPortal(s); const measurements = [];
    for (const [width, height] of sizes) {
      await s.page.setViewportSize({ width, height }); await s.page.evaluate(() => scrollTo(0, 0)); await privateChrome(s);
      const shell = await s.page.locator('main[data-current-module]').evaluate(e => ({ top: e.getBoundingClientRect().top, paddingTop: getComputedStyle(e).paddingTop })); assert.equal(shell.top, 0); assert.equal(shell.paddingTop, '0px');
      const toggle = s.page.getByRole('button', { name: 'Open modules', exact: true });
      if (await toggle.isVisible()) { await toggle.focus(); await s.page.keyboard.press('Enter'); await s.page.getByRole('button', { name: 'Close modules', exact: true }).waitFor(); await s.page.keyboard.press('Escape'); await toggle.waitFor(); assert.equal(await toggle.evaluate(e => e === document.activeElement), true); await toggle.click(); }
      const navigation = s.page.getByRole('navigation', { name: 'Command Center Navigation', exact: true });
      const labels = await navigation.getByRole('button').evaluateAll(nodes => nodes.map(node => node.querySelector('span').textContent)); assert.equal(labels.length, 22);
      if (width >= 1024) { const aside = await s.page.locator('#tayco-command-sidebar').evaluate(e => ({ top: getComputedStyle(e).top, position: getComputedStyle(e).position })); assert.equal(aside.top, '0px'); assert.equal(aside.position, 'sticky'); }
      for (const label of labels) { const elapsedMs = await nav(s, label); await privateChrome(s); measurements.push({ width, height, module: label, elapsedMs, overflow: await overflow(s, width + ' ' + label), focusedModule: true }); }
      const response = s.page.waitForResponse(r => r.url() === base + '/api/erp-suite' && r.request().method() === 'GET'); await s.page.getByRole('button', { name: 'Refresh', exact: true }).click(); assert.equal((await response).status(), 200);
      await nav(s, 'Executive overview'); await s.page.evaluate(() => scrollTo(0, 0)); await s.page.screenshot({ path: path.join(out, 'private-' + width + 'x' + height + '.png'), fullPage: true });
    }
    await s.context.close(); return { measurements, viewportCount: sizes.length, refreshGetReceipts: sizes.length, shellPaddingTop: 0, desktopStickyTop: 0 };
  });
  await run('account-login-top-origin-and-role-guards-remain', async () => {
    const measurements = [];
    for (const role of ['admin', 'client', 'vendor']) {
      const s = await context(role); await goto(s, '/portal'); await hydratedPortal(s); await privateChrome(s);
      const navs = s.page.getByRole('navigation', { name: 'Command Center Navigation', exact: true }); const labels = await navs.getByRole('button').evaluateAll(nodes => nodes.map(node => node.querySelector('span').textContent));
      if (role !== 'admin') for (const label of ['Financial dashboard', 'Corporate meetings', 'Follow-ups & priorities', 'Requests', 'Activity']) assert.ok(!labels.includes(label), role + ': internal-only navigation');
      for (const label of labels) await nav(s, label);
      for (const pathname of ['/account', '/login']) {
        await goto(s, pathname); await privateChrome(s); if (pathname === '/account') await s.page.getByRole('link', { name: 'Open project workspace', exact: true }).waitFor();
        for (const [width, height] of sizes) { await s.page.setViewportSize({ width, height }); await s.page.evaluate(() => scrollTo(0, 0)); const top = await s.page.locator('main').evaluate(e => e.getBoundingClientRect().top); assert.equal(top, 0); measurements.push({ role, pathname, width, height, top, overflow: await overflow(s, role + pathname) }); }
      }
      await s.context.close();
    }
    const anonymous = await context(null); await goto(anonymous, '/portal'); await anonymous.page.waitForURL(url => url.pathname === '/login'); await privateChrome(anonymous); assert.equal(await anonymous.page.locator('[data-current-module]').count(), 0);
    await goto(anonymous, '/account'); await anonymous.page.waitForURL(url => url.pathname === '/login'); await privateChrome(anonymous); await anonymous.context.close();
    return { measurements, clientVendorNavigationValid: true, anonymousPortalAndAccountRequireLogin: true, noCredentialSubmission: true };
  });
  assert.deepEqual(runtimeErrors, []); assert.deepEqual(mutationAttempts, []); report.passed = report.results.every(result => result.passed); if (!report.passed) process.exitCode = 1;
} catch (error) { report.passed = false; report.failure = { message: error.message, stack: error.stack }; console.error(error.stack); process.exitCode = 1;
  for (let i = 0; i < contexts.length; i++) for (const page of contexts[i].pages()) try { await page.screenshot({ path: path.join(out, 'failure-' + i + '.png'), fullPage: true }); } catch { /* Preserve original failure. */ }
} finally {
  report.runtimeErrors = runtimeErrors; report.mutationAttempts = mutationAttempts; report.requestSummary = Object.fromEntries(['GET', 'HEAD', 'OPTIONS'].map(method => [method, requests.filter(r => r.method === method).length])); report.completedAt = new Date().toISOString();
  fs.writeFileSync(path.join(out, 'runtime-report.json'), JSON.stringify(report, null, 2)); for (const c of contexts) await c.close().catch(() => {}); await browser.close(); console.log(JSON.stringify({ passed: report.passed, results: report.results.map(({ name, passed }) => ({ name, passed })), evidence: out, limits: report.limits }));
}
