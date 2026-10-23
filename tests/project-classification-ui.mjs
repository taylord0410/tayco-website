/** Isolated GUI certification of explicit project classifications and manual requirements review. */
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
const out = path.resolve(process.env.TAYCO_EVIDENCE_DIR || path.join(root, '.data', 'certification', 'project-classification-' + Date.now()));
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
report.limits = ['Disposable synthetic fixture only; no customer or account-permission changes.', 'Classifications are sourced declarations; project requirements are manually recorded and reviewed, without automatic certification.', 'External GUI checks cover assigned legacy classifications and isolation from these new unassigned synthetic projects; domain tests cover classification redaction for known assigned projects.', 'Browser emulation does not certify physical mobile hardware.'];
report.buildId = fs.readFileSync(path.join(root, '.next', 'BUILD_ID'), 'utf8').trim();
report.buildIdSha256 = createHash('sha256').update(fs.readFileSync(path.join(root, '.next', 'BUILD_ID'))).digest('hex');
const created = {}, today = new Date().toISOString().slice(0, 10);
const projectCard = (s, id) => s.page.locator('[data-project-id="' + id + '"]');
try {
  const admin = await session('admin'); admin.page.setDefaultTimeout(20000); await nav(admin, 'Projects'); await admin.page.locator('#portal-project-filter').selectOption('');
  await run('create-independent-project-classifications-and-legacy-unknown', async () => {
    const baseline = await snapshot(admin), legacy = baseline.entries.find(e => e.kind === 'project' && !e.data.classification);
    if (legacy) { const section = admin.page.getByTestId('project-classification-' + legacy.id); await section.waitFor(); for (const key of ['contract-type', 'funding-type', 'labor-regime']) assert.equal(await section.getByTestId('classification-' + key).textContent(), 'Unknown / not reviewed'); }
    for (const [key, axes] of [
      ['unknown', {}],
      ['private', { contractType: 'private', fundingType: 'private', laborRegime: 'non_union', jurisdiction: 'Synthetic private jurisdiction', classificationSource: 'Private classification evidence ' + nonce }],
      ['federalUnion', { contractType: 'federal', fundingType: 'federal', laborRegime: 'union', jurisdiction: 'Synthetic federal jurisdiction', classificationSource: 'Federal union classification evidence ' + nonce }],
      ['privateFederalFunding', { contractType: 'private', fundingType: 'federal', laborRegime: 'mixed', jurisdiction: 'Synthetic mixed labor scope', classificationSource: 'Private project federal funding evidence ' + nonce }],
    ]) {
      const f = await form(admin.page, 'Add a project'); for (const name of ['contractType', 'fundingType', 'laborRegime']) assert.equal(await f.locator('[name="' + name + '"]').inputValue(), 'unknown');
      const name = 'Classification ' + key + ' synthetic ' + nonce; await fill(f, { name, nextAction: '', ...axes }); await save(f);
      const entry = await find(admin, e => e.kind === 'project' && e.data.name === name); created[key] = entry.id;
      assert.equal(entry.data.status, 'planning'); assert.equal(entry.data.progress, null); assert.equal(entry.data.budgetUsd, null); assert.equal(entry.data.nextAction, '');
      const classification = entry.data.classification;
      for (const axis of ['contractType', 'fundingType', 'laborRegime']) assert.equal(classification[axis], axes[axis] || 'unknown');
      if (key === 'unknown') { assert.equal(classification.reviewedAt, null); assert.equal(classification.reviewedBy, null); assert.deepEqual(classification.history, []); assert.equal(classification.source, ''); }
      else assert.equal(classification.source, axes.classificationSource);
    }
    const privateFunded = admin.page.getByTestId('project-classification-' + created.privateFederalFunding); assert.equal(await privateFunded.getByTestId('classification-contract-type').textContent(), 'Private'); assert.equal(await privateFunded.getByTestId('classification-funding-type').textContent(), 'Federal');
    await reload(admin); await nav(admin, 'Projects'); assert.equal((await record(admin, created.federalUnion)).data.classification.laborRegime, 'union');
    return { created, legacyUnknownObserved: Boolean(legacy), defaultUnknownUnreviewed: true, privateProjectFederalFundingIndependent: true, persistedAfterReload: true };
  });
  await run('classification-edit-preserves-project-state-and-filter-counts-clear-empty', async () => {
    const before = await record(admin, created.private), card = projectCard(admin, created.private), f = await form(card, 'Edit project classification');
    assert.equal(await f.locator('[name="status"]').count(), 0); assert.equal(await f.locator('[name="progress"]').count(), 0);
    await fill(f, { contractType: 'private', fundingType: 'federal', laborRegime: 'union', jurisdiction: 'Synthetic revised jurisdiction', classificationSource: 'Revised private classification evidence ' + nonce }); await save(f);
    const after = await record(admin, created.private); for (const key of ['status', 'progress', 'budgetUsd', 'nextAction', 'name', 'clientName', 'location']) assert.deepEqual(after.data[key], before.data[key], 'Classification must not alter ' + key);
    assert.equal(after.data.classification.fundingType, 'federal'); assert.equal(after.data.classification.laborRegime, 'union'); assert.ok(after.data.classification.history.length >= 2);
    await openDetails(card, 'Classification history · ' + after.data.classification.history.length + ' reviews'); assert.ok((await card.getByTestId('classification-private-history').textContent()).includes('Private classification evidence ' + nonce));
    await admin.page.getByLabel('Filter projects by type', { exact: true }).selectOption('federal'); await admin.page.getByLabel('Filter projects by labor arrangement', { exact: true }).selectOption('union');
    await projectCard(admin, created.federalUnion).waitFor(); assert.equal(await projectCard(admin, created.private).count(), 0); assert.equal(await projectCard(admin, created.privateFederalFunding).count(), 0);
    const all = (await snapshot(admin)).entries.filter(e => e.kind === 'project'), matches = all.filter(e => e.data.classification?.contractType === 'federal' && e.data.classification?.laborRegime === 'union').length;
    assert.equal(await admin.page.getByTestId('project-classification-match-count').textContent(), matches + ' of ' + all.length + ' projects match the type and labor filters.');
    await admin.page.locator('#portal-project-filter').selectOption(created.unknown); await admin.page.getByTestId('project-classification-empty').waitFor(); assert.equal(await admin.page.locator('[data-project-id]').count(), 0);
    await admin.page.getByRole('button', { name: 'Clear classification filters', exact: true }).click(); await projectCard(admin, created.unknown).waitFor();
    assert.equal(await admin.page.getByTestId('project-classification-match-count').textContent(), '1 of 1 projects match the type and labor filters.');
    await admin.page.locator('#portal-project-filter').selectOption(''); await projectCard(admin, created.private).waitFor();
    return { unrelatedProjectFieldsPreserved: true, independentEditAction: true, filterCountsMatchAuthorizedSnapshot: true, emptyAndClearRecovery: true, privateHistoryRetained: true };
  });
  await run('explicit-project-source-handoff-clears-classification-filters', async () => {
    await admin.page.getByLabel('Filter projects by type', { exact: true }).selectOption('federal');
    await admin.page.getByLabel('Filter projects by labor arrangement', { exact: true }).selectOption('union');
    assert.equal(await projectCard(admin, created.privateFederalFunding).count(), 0);
    const reference = 'CLASS-SOURCE-' + nonce;
    await good(admin, { action: 'create_proposal', projectId: created.privateFederalFunding, reference, title: 'Synthetic classification source handoff', clientName: 'Synthetic client', amountUsd: 0, issuedOn: today, validUntil: '2098-12-31', source: 'Synthetic project source ' + nonce }); await refresh(admin);
    const proposal = await find(admin, e => e.kind === 'proposal' && e.data.reference === reference);
    await nav(admin, 'Client proposals'); await admin.page.locator('#portal-project-filter').selectOption(created.privateFederalFunding);
    await admin.page.getByRole('button', { name: /^All proposals/ }).click();
    await admin.page.getByTestId('proposal-record-' + proposal.id).getByRole('button', { name: 'View proposal project', exact: true }).click();
    await projectCard(admin, created.privateFederalFunding).waitFor(); assert.equal(await admin.page.locator('#portal-project-filter').inputValue(), created.privateFederalFunding);
    assert.equal(await admin.page.getByLabel('Filter projects by type', { exact: true }).inputValue(), 'all'); assert.equal(await admin.page.getByLabel('Filter projects by labor arrangement', { exact: true }).inputValue(), 'all');
    await admin.page.getByLabel('Filter projects by type', { exact: true }).selectOption('private'); await nav(admin, 'Documents'); await nav(admin, 'Projects'); assert.equal(await admin.page.getByLabel('Filter projects by type', { exact: true }).inputValue(), 'private', 'Ordinary navigation retains intentional list filters');
    await admin.page.getByRole('button', { name: 'Clear classification filters', exact: true }).click(); await admin.page.locator('#portal-project-filter').selectOption('');
    return { explicitPrivateProjectVisible: true, inheritedTypeAndLaborFiltersCleared: true, ordinaryManualFiltersPreserved: true };
  });
  await run('classification-requirements-handoff-manual-category-authority-review', async () => {
    const federal = await record(admin, created.federalUnion); assert.equal((await snapshot(admin)).entries.filter(e => e.kind === 'compliance' && e.projectId === federal.id).length, 0, 'A classification must not manufacture requirements');
    await projectCard(admin, federal.id).getByRole('button', { name: 'Open project requirements & certifications', exact: true }).click();
    await admin.page.getByRole('region', { name: 'Project requirements & certifications', exact: true }).waitFor(); assert.equal(await admin.page.locator('#portal-project-filter').inputValue(), federal.id);
    let f = await form(admin.page, 'Add a compliance review'); assert.equal(await f.locator('[name="projectId"]').inputValue(), federal.id); assert.equal(await f.locator('[name="category"]').inputValue(), 'general');
    const topic = 'Manual prevailing wage source review ' + nonce; await fill(f, { category: 'prevailing_wage', authority: 'Synthetic awarding authority ' + nonce, jurisdiction: 'Synthetic jurisdiction', topic, dueDate: today, source: 'Synthetic requirement source ' + nonce }); await save(f);
    const requirement = await find(admin, e => e.kind === 'compliance' && e.data.topic === topic); created.requirement = requirement.id; assert.equal(requirement.data.status, 'pending'); assert.equal(requirement.data.category, 'prevailing_wage'); assert.equal(requirement.data.authority, 'Synthetic awarding authority ' + nonce);
    const card = admin.page.locator('[data-requirement-id="' + requirement.id + '"]'); assert.ok((await card.textContent()).includes('Prevailing wage')); assert.ok((await card.textContent()).includes('Synthetic awarding authority ' + nonce));
    f = await form(card, 'Review compliance item'); await fill(f, { status: 'complete', evidence: 'Synthetic manual evidence review ' + nonce, reviewedOn: today }); await save(f);
    assert.equal((await record(admin, requirement.id)).data.status, 'complete'); assert.equal((await record(admin, requirement.id)).data.evidence, 'Synthetic manual evidence review ' + nonce);
    await good(admin, { action: 'create_compliance', projectId: federal.id, jurisdiction: 'Legacy synthetic scope', topic: 'Legacy generic requirement ' + nonce, source: 'Legacy generic API contract' }); await refresh(admin);
    const generic = await find(admin, e => e.kind === 'compliance' && e.data.topic === 'Legacy generic requirement ' + nonce), genericCard = admin.page.locator('[data-requirement-id="' + generic.id + '"]');
    assert.equal(generic.data.category, 'general'); assert.equal(generic.data.authority, ''); assert.ok((await genericCard.textContent()).includes('General'));
    await reload(admin); await nav(admin, 'Project requirements & certifications'); await admin.page.locator('#portal-project-filter').selectOption(federal.id); await card.waitFor(); assert.ok((await card.textContent()).includes('Synthetic manual evidence review ' + nonce));
    return { projectPreserved: federal.id, requirementId: requirement.id, categoryAndAuthorityPersisted: true, initialPending: true, explicitManualReview: true, legacyCreateContractSupported: true, noAutomaticRequirements: true };
  });
  await run('classification-role-guards-private-metadata-and-responsive-ui', async () => {
    for (const role of ['client', 'vendor']) {
      const s = await session(role); await nav(s, 'Projects'); await s.page.locator('#portal-project-filter').selectOption('');
      assert.equal(await s.page.getByRole('navigation', { name: 'Command Center Navigation', exact: true }).getByRole('button', { name: /^Project requirements & certifications/ }).count(), 0);
      assert.equal(await s.page.getByText('Edit project classification', { exact: true }).count(), 0); assert.equal(await s.page.getByTestId('classification-private-source').count(), 0); assert.equal(await s.page.getByTestId('classification-private-history').count(), 0);
      const current = await snapshot(s); assert.ok(!current.entries.some(e => Object.values(created).includes(e.id))); assert.ok(!JSON.stringify(current).includes('classification evidence ' + nonce));
      const denied = await post(s, { action: 'update_project_classification', id: created.private, version: 1, contractType: 'private', fundingType: 'private', laborRegime: 'non_union', classificationSource: 'Forbidden role control' }); assert.equal(denied.status(), 403);
    }
    const measurements = [];
    for (const [width, height] of [[1440, 1000], [390, 844]]) {
      await admin.page.setViewportSize({ width, height }); await nav(admin, 'Projects'); await admin.page.locator('#portal-project-filter').selectOption(created.privateFederalFunding); await projectCard(admin, created.privateFederalFunding).waitFor();
      const f = await form(projectCard(admin, created.privateFederalFunding), 'Edit project classification'); assert.equal(await f.locator('[name="contractType"]').inputValue(), 'private'); assert.equal(await f.locator('[name="fundingType"]').inputValue(), 'federal');
      const projectOverflow = await admin.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert.equal(projectOverflow, 0); measurements.push({ width, height, module: 'Projects', overflow: projectOverflow });
      await admin.page.screenshot({ path: path.join(out, 'classification-' + width + 'x' + height + '.png'), fullPage: true });
      await projectCard(admin, created.privateFederalFunding).getByRole('button', { name: 'Open project requirements & certifications', exact: true }).click(); assert.equal(await admin.page.locator('#portal-project-filter').inputValue(), created.privateFederalFunding);
      await form(admin.page, 'Add a compliance review'); const requirementsOverflow = await admin.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert.equal(requirementsOverflow, 0); measurements.push({ width, height, module: 'Project requirements & certifications', overflow: requirementsOverflow });
      await admin.page.screenshot({ path: path.join(out, 'requirements-' + width + 'x' + height + '.png'), fullPage: true });
    }
    return { roleMutationsDenied: 403, internalSourceHistoryHidden: true, measurements, physicalHardwareTested: false };
  });
  report.effects = (await snapshot(admin)).entries.filter(entry => JSON.stringify(entry.data).includes(nonce)).map(entry => ({ id: entry.id, kind: entry.kind, projectId: entry.projectId, version: entry.version }));
  assert.deepEqual(runtimeErrors, [], 'No browser runtime or hydration errors'); report.passed = true;
} catch (error) { report.passed = false; report.failure = { message: error.message, stack: error.stack }; console.error(error.stack); process.exitCode = 1;
  for (const [role, s] of sessions) try { await s.page.screenshot({ path: path.join(out, 'failure-' + role + '.png'), fullPage: true }); } catch { /* Preserve source failure. */ }
} finally {
  report.browserRuntimeErrors = runtimeErrors; report.completedAt = new Date().toISOString(); fs.writeFileSync(path.join(out, 'runtime-report.json'), JSON.stringify(report, null, 2));
  for (const c of contexts) await c.close(); await browser.close(); console.log(JSON.stringify({ passed: report.passed, results: report.results.map(({ name, passed }) => ({ name, passed })), evidence: out, limits: report.limits }));
}
