/** Isolated GUI certification of durable corporate meetings and priority follow-ups. */
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
const out = path.resolve(process.env.TAYCO_EVIDENCE_DIR || path.join(root, '.data', 'certification', 'corporate-agenda-' + Date.now()));
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
const created = {};
try {
  const admin = await session('admin'), staffId = (await snapshot(admin)).assignees.find(member => member.email === config.accounts.staff.email)?.id;
  assert.ok(staffId); const today = new Date().toISOString().slice(0, 10);
  await run('corporate-meeting-create-update-state-reload', async () => {
    await nav(admin, 'Corporate meetings'); let f = await form(admin.page, 'Schedule a corporate meeting'); const title = 'Corporate meeting synthetic ' + nonce;
    await fill(f, { title, date: today, time: '14:30', location: 'Synthetic planning room', assigneeId: staffId, notes: 'Internal meeting notes ' + nonce, priority: 'high' }); await save(f);
    const entry = await find(admin, e => e.kind === 'corporate_meeting' && e.data.title === title); created.meeting = entry.id;
    let card = admin.page.locator('[data-agenda-id="' + entry.id + '"]'); await card.waitFor(); assert.ok((await card.textContent()).includes('14:30 (as recorded)')); assert.ok((await card.textContent()).includes(config.accounts.staff.email));
    f = await form(card, 'Edit meeting details'); await fill(f, { notes: 'Revised internal meeting notes ' + nonce, priority: 'urgent', location: 'Revised synthetic room' }); await save(f);
    f = await form(card, 'Change meeting state'); await fill(f, { status: 'completed', stateReason: 'Synthetic meeting review complete' }); await save(f);
    await reload(admin); await nav(admin, 'Corporate meetings'); card = admin.page.locator('[data-agenda-id="' + entry.id + '"]'); await card.waitFor();
    const stored = await record(admin, entry.id); assert.equal(stored.data.status, 'completed'); assert.equal(stored.data.priority, 'urgent'); assert.equal(stored.data.notes, 'Revised internal meeting notes ' + nonce); assert.equal(stored.data.assigneeId, staffId); assert.equal(stored.data.time, '14:30'); assert.equal('timezone' in stored.data, false);
    await admin.page.getByLabel('Agenda state', { exact: true }).selectOption('scheduled'); assert.equal(await card.count(), 0); await admin.page.getByLabel('Agenda state', { exact: true }).selectOption('completed'); await card.waitFor();
    await admin.page.getByLabel('Agenda priority', { exact: true }).selectOption('normal'); assert.equal(await card.count(), 0); await admin.page.getByLabel('Agenda priority', { exact: true }).selectOption('urgent'); await card.waitFor();
    await admin.page.getByLabel('Agenda responsible account', { exact: true }).selectOption(staffId); await card.waitFor(); await admin.page.getByLabel('Agenda month', { exact: true }).fill('2099-12'); await admin.page.getByLabel('Agenda month', { exact: true }).fill(today.slice(0, 7)); await card.waitFor(); assert.equal(await admin.page.getByLabel('Agenda date selection', { exact: true }).inputValue(), 'month');
    return { id: entry.id, persisted: ['date', 'time', 'location', 'responsible', 'priority', 'notes', 'state'], filters: ['state', 'priority', 'responsible', 'month'], noTimezoneInvented: true };
  });
  await run('followup-priority-dates-notes-state-and-filters', async () => {
    await nav(admin, 'Follow-ups & priorities');
    for (const [suffix, dueDate, priority] of [['past', '2026-01-15', 'urgent'], ['future', '2098-04-12', 'normal']]) {
      const title = 'Follow-up ' + suffix + ' synthetic ' + nonce, f = await form(admin.page, 'Create a priority follow-up');
      await fill(f, { title, dueDate, assigneeId: staffId, notes: 'Synthetic follow-up notes ' + nonce, priority }); await save(f); created[suffix] = (await find(admin, e => e.kind === 'followup' && e.data.title === title)).id;
    }
    const past = admin.page.locator('[data-agenda-id="' + created.past + '"]'), future = admin.page.locator('[data-agenda-id="' + created.future + '"]');
    await admin.page.getByLabel('Agenda date selection', { exact: true }).selectOption('overdue'); await past.waitFor(); assert.equal(await future.count(), 0);
    await admin.page.getByLabel('Agenda date selection', { exact: true }).selectOption('upcoming'); await future.waitFor(); assert.equal(await past.count(), 0);
    await admin.page.getByLabel('Agenda month', { exact: true }).fill('2098-04'); await future.waitFor(); assert.equal(await past.count(), 0); await admin.page.getByLabel('Agenda date selection', { exact: true }).selectOption('all'); await past.waitFor();
    let f = await form(past, 'Edit follow-up details'); await fill(f, { notes: 'Retained follow-up correction ' + nonce, priority: 'high' }); await save(f);
    for (const status of ['in_progress', 'completed']) { f = await form(past, 'Change follow-up state'); await fill(f, { status, stateReason: 'Synthetic work ' + status }); await save(f); }
    await admin.page.getByLabel('Agenda date selection', { exact: true }).selectOption('overdue'); assert.equal(await past.count(), 0, 'Completed work is no longer overdue');
    await reload(admin); await nav(admin, 'Follow-ups & priorities'); await past.waitFor(); const stored = await record(admin, created.past);
    assert.equal(stored.data.status, 'completed'); assert.equal(stored.data.priority, 'high'); assert.equal(stored.data.notes, 'Retained follow-up correction ' + nonce); assert.equal(stored.data.dueDate, '2026-01-15'); assert.equal(stored.data.assigneeId, staffId);
    await admin.page.getByLabel('Agenda priority', { exact: true }).selectOption('low'); assert.equal(await past.count(), 0); assert.equal(await future.count(), 0); await admin.page.getByLabel('Agenda priority', { exact: true }).selectOption('all');
    return { ids: [created.past, created.future], upcomingAndOverdueFilter: true, completedExcludedFromOverdue: true, persistedNotesPriorityResponsible: true };
  });
  await run('corporate-agenda-clears-inherited-project-scope', async () => {
    const unrelatedProject = config.projects[1]; assert.ok(unrelatedProject && unrelatedProject !== config.projects[0]);
    await good(admin, { action: 'create_corporate_meeting', projectId: unrelatedProject, title: 'Other-project meeting synthetic ' + nonce, date: today, time: '', location: '', notes: 'Company-wide coordination across projects', assigneeId: staffId, priority: 'normal' });
    const linkedMeeting = await find(admin, e => e.kind === 'corporate_meeting' && e.data.title === 'Other-project meeting synthetic ' + nonce);
    await good(admin, { action: 'create_followup', projectId: unrelatedProject, title: 'Other-project follow-up synthetic ' + nonce, dueDate: '2098-04-12', notes: 'Company-wide follow-up across projects', assigneeId: staffId, priority: 'normal' });
    const linkedFollowup = await find(admin, e => e.kind === 'followup' && e.data.title === 'Other-project follow-up synthetic ' + nonce);
    await refresh(admin);
    created.linkedMeeting = linkedMeeting.id; created.linkedFollowup = linkedFollowup.id;
    for (const [label, ownId, linkedId] of [['Corporate meetings', created.meeting, linkedMeeting.id], ['Follow-ups & priorities', created.future, linkedFollowup.id]]) {
      await nav(admin, 'Projects'); await admin.page.locator('#portal-project-filter').selectOption(config.projects[0]);
      assert.equal(await admin.page.locator('#portal-project-filter').inputValue(), config.projects[0]);
      await nav(admin, label); assert.equal(await admin.page.locator('#portal-project-filter').count(), 0);
      await admin.page.getByText('Company workspace · no project filter', { exact: true }).waitFor();
      await admin.page.locator('[data-agenda-id="' + ownId + '"]').waitFor(); await admin.page.locator('[data-agenda-id="' + linkedId + '"]').waitFor();
      assert.equal((await record(admin, linkedId)).projectId, unrelatedProject);
      await nav(admin, 'Projects'); assert.equal(await admin.page.locator('#portal-project-filter').inputValue(), '', 'Company-wide navigation clears the inherited project state');
    }
    return { inheritedProject: config.projects[0], otherProject: unrelatedProject, linkedRecords: [linkedMeeting.id, linkedFollowup.id], companywideAndOtherProjectRecordsAvailable: true, projectSelectorAbsent: true, inheritedProjectStateCleared: true };
  });
  await run('corporate-agenda-internal-only-and-responsive', async () => {
    for (const role of ['client', 'other', 'vendor']) {
      const s = await session(role); await s.page.setViewportSize({ width: 390, height: 844 }); const navigation = s.page.getByRole('navigation', { name: 'Command Center Navigation', exact: true });
      assert.equal(await navigation.getByRole('button', { name: /^Corporate meetings/ }).count(), 0); assert.equal(await navigation.getByRole('button', { name: /^Follow-ups & priorities/ }).count(), 0); assert.ok(!(await snapshot(s)).entries.some(e => Object.values(created).includes(e.id)));
    }
    const staff = await session('staff'); await nav(staff, 'Corporate meetings'); await staff.page.locator('[data-agenda-id="' + created.meeting + '"]').waitFor(); const measurements = [];
    for (const [width, height] of [[1920, 1080], [1440, 1000], [1280, 720], [768, 1024], [390, 844], [844, 390]]) {
      await admin.page.setViewportSize({ width, height });
      for (const [label, id, testId] of [['Corporate meetings', created.meeting, 'corporate-meetings'], ['Follow-ups & priorities', created.future, 'corporate-followups']]) {
        await nav(admin, label); const agenda = admin.page.getByTestId(testId); await agenda.waitFor(); const card = agenda.locator('[data-agenda-id="' + id + '"]'); await card.waitFor();
        await form(card, label === 'Corporate meetings' ? 'Edit meeting details' : 'Edit follow-up details'); const priority = agenda.getByLabel('Agenda priority', { exact: true }); await priority.selectOption('low'); assert.equal(await card.count(), 0); await priority.selectOption('all'); await card.waitFor();
        await openDetails(card, 'Record history · ' + (await record(admin, id)).data.history.length + ' changes');
        const overflow = await admin.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert.equal(overflow, 0, label + ' ' + width + ' page overflow'); measurements.push({ width, height, module: label, overflow });
        await admin.page.screenshot({ path: path.join(out, testId + '-' + width + 'x' + height + '.png'), fullPage: true });
      }
    }
    return { externalSnapshotAndNavigationHidden: true, staffCanRead: true, measurements };
  });
  await run('unauthorized-state-action-control', async () => {
    const vendor = await session('vendor'), r = await post(vendor, { action: 'set_followup_state', id: created.future, version: 1, status: 'completed', stateReason: 'Forbidden fixture control' }); assert.equal(r.status(), 403);
    await good(admin, { action: 'set_followup_state', id: created.future, version: (await record(admin, created.future)).version, status: 'in_progress', stateReason: 'Authorized fixture control' }); await refresh(admin);
    return { externalMutationDenied: 403, internalMutationControlPassed: true };
  });
  assert.deepEqual(runtimeErrors, [], 'No browser runtime or hydration errors'); report.passed = true;
} catch (error) {
  report.passed = false; report.failure = { message: error.message, stack: error.stack }; console.error(error.stack); process.exitCode = 1;
  for (const [role, s] of sessions) try { await s.page.screenshot({ path: path.join(out, 'failure-' + role + '.png'), fullPage: true }); } catch { /* Preserve original failure. */ }
} finally {
  report.browserRuntimeErrors = runtimeErrors; report.completedAt = new Date().toISOString(); fs.writeFileSync(path.join(out, 'runtime-report.json'), JSON.stringify(report, null, 2));
  for (const context of contexts) await context.close(); await browser.close(); console.log(JSON.stringify({ passed: report.passed, results: report.results.map(({ name, passed }) => ({ name, passed })), evidence: out }));
}
