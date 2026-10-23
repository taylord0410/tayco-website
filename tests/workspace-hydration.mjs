/** Authenticated synthetic SSR + hydration regression. No business writes or external transport. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
assert.ok(process.env.TAYCO_TEST_CONFIG, 'A disposable private synthetic fixture is required.');
const configFile = path.resolve(process.env.TAYCO_TEST_CONFIG), config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
const relative = path.relative(path.join(root, '.data'), configFile).split(path.sep);
assert.ok(relative.length >= 2 && /^certification-[\w-]+$/.test(relative[0]) && !relative.includes('..'));
for (const file of [config.authDb, config.erpDb]) {
  const rel = path.relative(path.dirname(configFile), path.resolve(file)); assert.ok(rel && !rel.startsWith('..') && !path.isAbsolute(rel));
}
const base = process.env.TAYCO_HYDRATION_BASE || config.baseUrl;
assert.match(base, /^http:\/\/(?:localhost|127\.0\.0\.1):(?:3010|3014)$/);
for (const role of ['admin', 'client', 'vendor']) assert.ok(config.accounts[role]?.email.endsWith('@example.test') && config.accounts[role].cookie);
const directory = path.resolve(process.env.TAYCO_EVIDENCE_DIR || path.join(root, '.data', 'certification', 'workspace-hydration-' + Date.now()));
const relativeEvidence = path.relative(path.join(root, '.data'), directory); assert.ok(relativeEvidence && !relativeEvidence.startsWith('..') && !path.isAbsolute(relativeEvidence));
fs.mkdirSync(directory, { recursive: true });
const { chromium } = createRequire(import.meta.url)(process.env.TAYCO_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true }), contexts = [];
const report = { startedAt: new Date().toISOString(), base, visualSourceSha256: createHash('sha256').update(fs.readFileSync(path.join(root, 'components/workspace/WorkspaceVisuals.tsx'))).digest('hex'), roles: [], limits: ['Synthetic local accounts only; no business writes.', 'Development validates the current source; production must be exercised again after its build.'] };
try {
  for (const role of ['admin', 'client', 'vendor']) {
    const motion = role === 'admin' ? 'no-preference' : 'reduce';
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: motion }); contexts.push(context);
    await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort('blockedbyclient'));
    await context.addCookies([{ name: 'tayco_session', value: encodeURIComponent(config.accounts[role].cookie), url: base, httpOnly: true, sameSite: 'Lax', secure: true }]);
    const result = { role, motion, ssrTitles: [], pageErrors: [], consoleErrors: [], refreshes: 0 }; report.roles.push(result);
    const response = await context.request.get(base + '/portal'); assert.equal(response.status(), 200);
    const html = await response.text();
    for (const match of html.matchAll(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gi)) {
      const title = match[1].match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
      if (!title) continue;
      const text = title[1].replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '').trim(); result.ssrTitles.push(text);
      assert.ok(text, 'SVG title must contain server-rendered text. Multiple JSX title children previously produced an empty SSR title and hydration failure.');
    }
    assert.ok(result.ssrTitles.some(title => title.includes('Authorized projects by recorded status')), 'The project distribution needs an SSR accessible title.');
    const page = await context.newPage();
    page.on('pageerror', error => result.pageErrors.push({ message: error.message, stack: error.stack }));
    page.on('console', message => { if (message.type() === 'error') result.consoleErrors.push(message.text()); });
    for (let pass = 0; pass < 2; pass++) {
      if (!pass) await page.goto(base + '/portal', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      else await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.getByTestId('executive-console').waitFor();
      await page.locator('body[data-motion="' + (motion === 'reduce' ? 'reduced' : 'full') + '"]').waitFor();
      const controls = page.getByTestId('workspace-display-controls'); await controls.locator('summary').click();
      await controls.getByRole('button', { name: 'Calm', exact: true }).click();
      await page.locator('[data-testid="executive-console"][data-atmosphere="calm"]').waitFor();
      await controls.getByRole('button', { name: 'Deep', exact: true }).click();
      await page.locator('[data-testid="executive-console"][data-atmosphere="deep"]').waitFor();
      await controls.locator('summary').click();
      const refresh = page.waitForResponse(reply => reply.url() === base + '/api/erp-suite' && reply.request().method() === 'GET');
      await page.getByRole('button', { name: 'Refresh', exact: true }).click(); assert.equal((await refresh).status(), 200); result.refreshes++;
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await page.getByRole('img', { name: /^Authorized projects by recorded status:/ }).count(), 1);
      const surface = page.getByTestId('executive-console').locator('section.workspace-surface').first();
      await surface.scrollIntoViewIfNeeded(); const before = await surface.boundingBox(); assert.ok(before);
      await page.mouse.move(before.x + 4, before.y + 4); await page.mouse.down(); await page.mouse.up();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const after = await surface.boundingBox(); assert.ok(after);
      for (const field of ['x', 'y', 'width', 'height']) assert.ok(Math.abs(before[field] - after[field]) <= 0.5, 'Workspace hover/click must not move its hitbox: ' + field);
      assert.equal(await page.locator('.workspace-shell .response-wash').count(), 0, 'Operational cards must not append decorative wash nodes.');
      assert.equal(await surface.evaluate(element => element.getAnimations().filter(animation => animation.effect?.getKeyframes().some(frame => 'scale' in frame || 'transform' in frame)).length), 0, 'Operational cards must not receive transform/scale animations.');
      assert.deepEqual(result.pageErrors, [], 'Hydration/runtime errors must not be filtered or suppressed.');
      assert.deepEqual(result.consoleErrors, [], 'Browser console errors require investigation.');
    }
    result.stableOperationalCards = true; result.passed = true; console.log(role + ': SSR titles + hydration + reload + stable card hitboxes passed'); await context.close();
  }
  report.completedAt = new Date().toISOString();
} catch (error) { report.failed = true; report.error = error.message; process.exitCode = 1; console.error(error.message); }
finally { fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2)); for (const context of contexts) await context.close().catch(() => {}); await browser.close(); console.log('Evidence: ' + directory); }
