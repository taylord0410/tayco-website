/**
 * Requires an isolated certification server and private fixture config.
 * Never run against client or production accounts.
 * Set TAYCO_TEST_CONFIG to {baseUrl, accounts:{role:{cookie}}, projects:[id...]}.
 * Only the disposable fixture database is modified. No email or blob requests.
 */
import assert from "node:assert/strict";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TAYCO_PLAYWRIGHT_MODULE || "playwright");
if (!process.env.TAYCO_TEST_CONFIG) throw new Error("An isolated TAYCO_TEST_CONFIG file is required.");
const config = JSON.parse(readFileSync(process.env.TAYCO_TEST_CONFIG, "utf8"));
const base = config.baseUrl;
if (!/^http:\/\/(localhost|127\.0\.0\.1):(?:3006|3008)$/.test(base)) throw new Error("This test only accepts the isolated local certification server on an approved certification port (3006 or 3008).");
const evidence = process.env.TAYCO_EVIDENCE_DIR;
if (evidence) mkdirSync(evidence, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = { viewports: [], roles: [], uncertainRetry: false, conflictRecovery: false, unauthenticated: false };
const contexts = [];
const sessions = new Map();
async function session(role) {
  const context = await browser.newContext();
  contexts.push(context);
  await context.addCookies([{ name: "tayco_session", value: encodeURIComponent(config.accounts[role].cookie), url: base, httpOnly: true, sameSite: "Lax", secure: true }]);
  const page = await context.newPage();
  await page.goto(base + "/portal", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Your projects/ }).waitFor();
  const active = { page, context };
  sessions.set(role, active);
  return active;
}
async function dashboard(context) {
  const response = await context.request.get(base + "/api/erp-suite");
  assert.equal(response.status(), 200);
  return response.json();
}
async function openForm(page, title) {
  const summary = page.locator("summary").filter({ hasText: new RegExp("^" + title + "$") });
  const details = summary.locator("..");
  if (await details.getAttribute("open") === null) await summary.click();
  return details.locator("form");
}
try {
  const { page, context } = await session("admin");
  for (const [width, height] of [[360,740],[390,844],[768,1024],[1024,768],[1200,800],[1440,900],[844,390],[720,450]]) {
    await page.setViewportSize({ width, height });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, "Portal horizontal overflow at " + width);
    assert.equal(await page.getByRole("button", { name: "Projects", exact: true }).isVisible(), true);
    results.viewports.push({ width, height, overflow, passed: true });
    if (evidence && [390,1440,844].includes(width)) await page.screenshot({ path: path.join(evidence, "portal-" + width + "x" + height + ".png"), fullPage: true });
  }
  await page.setViewportSize({ width: 1024, height: 768 });
  const name = "Certification retry " + Date.now();
  const createForm = await openForm(page, "Add a project");
  await createForm.getByLabel(/Project name/).fill(name);
  await createForm.getByLabel(/Approved budget/).fill("0");
  const keys = [];
  let loseFirstResponse = true;
  await page.route("**/api/erp-suite", async (route) => {
    const request = route.request();
    const body = request.method() === "POST" ? request.postDataJSON() : null;
    if (body?.action === "create_project" && body.name === name) {
      keys.push(request.headers()["idempotency-key"]);
      if (loseFirstResponse) {
        loseFirstResponse = false;
        const applied = await route.fetch();
        assert.equal(applied.status(), 200);
        await route.abort("failed");
        return;
      }
    }
    await route.continue();
  });
  await createForm.getByRole("button", { name: "Save", exact: true }).click();
  await createForm.getByRole("button", { name: "Retry this request" }).waitFor();
  assert.equal(await createForm.getByLabel(/Project name/).isDisabled(), true);
  await createForm.getByRole("button", { name: "Retry this request" }).click();
  await createForm.getByRole("status").waitFor();
  assert.equal(keys.length, 2);
  assert.equal(keys[0], keys[1], "An uncertain retry changed its request reference");
  let state = await dashboard(context);
  const created = state.entries.filter((entry) => entry.kind === "project" && entry.data.name === name);
  assert.equal(created.length, 1, "Retry created a duplicate project");
  assert.equal(created[0].data.budgetUsd, 0, "Zero budget was changed");
  results.uncertainRetry = true;
  await page.unroute("**/api/erp-suite");

  const item = created[0];
  const article = page.locator("article").filter({ has: page.getByRole("heading", { name, exact: true }) });
  await article.locator("summary").filter({ hasText: /^Update project$/ }).click();
  const update = article.locator("summary").filter({ hasText: /^Update project$/ }).locator("..").locator("form");
  await update.getByLabel(/Progress/).fill("33");
  await update.getByLabel(/Next action/).fill("Preserved unsaved action");
  const concurrent = await context.request.post(base + "/api/erp-suite", {
    headers: { Origin: base, "Idempotency-Key": randomUUID() },
    data: { action: "update_project", id: item.id, version: item.version, status: "active", progress: 17, nextAction: "Concurrent coordinator update" },
  });
  assert.equal(concurrent.status(), 200);
  await update.getByRole("button", { name: "Save", exact: true }).click();
  await update.getByRole("alert").waitFor();
  assert.match(await update.getByRole("alert").textContent(), /changed|latest|refresh/i);
  assert.equal(await update.getByLabel(/Progress/).inputValue(), "33");
  assert.equal(await update.getByLabel(/Next action/).inputValue(), "Preserved unsaved action");
  await update.getByRole("button", { name: "Save", exact: true }).click();
  await update.getByRole("status").waitFor();
  state = await dashboard(context);
  const saved = state.entries.find((entry) => entry.id === item.id);
  assert.equal(saved.data.progress, 33);
  assert.equal(saved.data.nextAction, "Preserved unsaved action");
  results.conflictRecovery = true;

  for (const role of ["staff", "client", "other", "vendor"]) {
    const target = await session(role);
    const targetData = await dashboard(target.context);
    assert.equal(targetData.actor.role, role === "other" ? "client" : role);
    const internal = role === "staff";
    assert.equal(await target.page.getByRole("button", { name: "Activity", exact: true }).count(), internal ? 1 : 0);
    assert.equal(await target.page.getByRole("button", { name: "Requests", exact: true }).count(), internal ? 1 : 0);
    assert.equal(await target.page.getByRole("button", { name: "Team hours", exact: true }).count(), ["staff","vendor"].includes(role) ? 1 : 0);
    assert.equal(await target.page.getByRole("button", { name: "Changes", exact: true }).count(), role === "vendor" ? 0 : 1);
    if (!internal) assert.equal(await target.page.locator("summary").filter({ hasText: /^Add a project$/ }).count(), 0);
    if (role === "vendor") assert.equal(await target.page.locator("summary").filter({ hasText: /^Request a scope change$/ }).count(), 0);
    const unauthorized = targetData.entries.filter((entry) => entry.kind === "project" && !config.accounts[role].projects.includes(entry.id));
    if (!internal) assert.equal(unauthorized.length, 0, "Server returned an unassigned project");
    await target.page.getByRole("button", { name: "Documents", exact: true }).click();
    assert.equal(await target.page.locator("summary").filter({ hasText: /^Upload a document$/ }).count(), ["staff","vendor"].includes(role) ? 1 : 0);
    results.roles.push({ role, passed: true });
  }
  // Exercise the real role-specific command forms against the disposable database.
  const suffix = Date.now().toString();
  const sharedProject = config.projects[0];
  const current = await dashboard(context);
  const sharedName = current.entries.find((entry) => entry.id === sharedProject).data.name;
  await page.getByRole("button", { name: "Requests", exact: true }).click();
  const lead = await openForm(page, "Add a request");
  await lead.getByLabel(/Contact name/).fill("Certification request " + suffix);
  await lead.getByLabel(/Email address/).fill("certification@example.test");
  await lead.getByLabel(/Project details/).fill("Synthetic request for workflow verification.");
  await lead.getByRole("button", { name: "Save", exact: true }).click();
  await lead.getByRole("status").waitFor();
  const leadArticle = page.locator("article").filter({ has: page.getByRole("heading", { name: "Certification request " + suffix, exact: true }) });
  await leadArticle.locator("summary").filter({ hasText: /^Review request$/ }).click();
  const leadReview = leadArticle.locator("form");
  await leadReview.getByLabel(/Status/).selectOption("quoted");
  await leadReview.getByLabel(/Next action/).fill("Review synthetic scope");
  await leadReview.getByRole("button", { name: "Save", exact: true }).click();
  await leadReview.getByRole("status").waitFor();

  await page.getByRole("button", { name: "Projects", exact: true }).click();
  const sharedArticle = page.locator("article").filter({ has: page.getByRole("heading", { name: sharedName, exact: true }) });
  await sharedArticle.locator("summary").filter({ hasText: /^Post a project update$/ }).click();
  const note = sharedArticle.locator("summary").filter({ hasText: /^Post a project update$/ }).locator("..").locator("form");
  await note.getByLabel(/Update title/).fill("Certification update " + suffix);
  await note.getByLabel(/What changed/).fill("Shared synthetic project update.");
  await note.getByLabel(/Share with/).selectOption("client");
  await note.getByRole("button", { name: "Save", exact: true }).click();
  await note.getByRole("status").waitFor();
  await sharedArticle.locator("summary").filter({ hasText: /^Request a scope change$/ }).click();
  const change = sharedArticle.locator("summary").filter({ hasText: /^Request a scope change$/ }).locator("..").locator("form");
  const changeTitle = "Certification change " + suffix;
  await change.getByLabel(/Change title/).fill(changeTitle);
  await change.getByLabel(/Describe the requested change/).fill("Synthetic finish change, no funds or external actions.");
  await change.getByRole("button", { name: "Save", exact: true }).click();
  await change.getByRole("status").waitFor();
  await page.getByRole("button", { name: "Changes", exact: true }).click();
  const changeArticle = page.locator("article").filter({ has: page.getByRole("heading", { name: changeTitle, exact: true }) });
  await changeArticle.locator("summary").filter({ hasText: /^Review scope change$/ }).click();
  const reviewChange = changeArticle.locator("form");
  await reviewChange.getByLabel(/Status/).selectOption("proposed");
  await reviewChange.getByLabel(/Review note/).fill("Synthetic proposal for client review.");
  await reviewChange.getByRole("button", { name: "Save", exact: true }).click();
  await reviewChange.getByRole("status").waitFor();

  const client = sessions.get("client");
  await client.page.getByRole("button", { name: "Refresh", exact: true }).click();
  await client.page.getByRole("button", { name: "Changes", exact: true }).click();
  const clientChange = client.page.locator("article").filter({ has: client.page.getByRole("heading", { name: changeTitle, exact: true }) });
  await clientChange.locator("summary").filter({ hasText: /^Record your decision$/ }).click();
  const decision = clientChange.locator("form");
  await decision.getByLabel(/Status/).selectOption("accepted");
  await decision.getByRole("button", { name: "Save", exact: true }).click();
  await clientChange.getByText("accepted", { exact: true }).waitFor();
  await client.page.getByRole("button", { name: "Updates", exact: true }).click();
  assert.equal(await client.page.getByRole("heading", { name: "Certification update " + suffix, exact: true }).isVisible(), true);
  const accepted = (await dashboard(context)).entries.find((entry) => entry.data.title === changeTitle);
  assert.equal(accepted.data.status, "accepted");

  const provider = sessions.get("vendor");
  await provider.page.getByRole("button", { name: "Team hours", exact: true }).click();
  const hours = await openForm(provider.page, "Submit work hours");
  await hours.getByLabel(/Project/).selectOption(sharedProject);
  await hours.getByLabel(/Work date/).fill("2026-10-23");
  await hours.getByLabel(/^Hours/).fill("1.5");
  const trade = "Certification work " + suffix;
  await hours.getByLabel(/Work performed/).fill(trade);
  await hours.getByRole("button", { name: "Save", exact: true }).click();
  await hours.getByRole("status").waitFor();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.getByRole("button", { name: "Team hours", exact: true }).click();
  const submittedHours = page.locator("article").filter({ has: page.getByRole("heading", { name: trade, exact: true }) });
  await submittedHours.locator("summary").filter({ hasText: /^Review time submission$/ }).click();
  const hoursReview = submittedHours.locator("form");
  await hoursReview.getByLabel(/Status/).selectOption("approved");
  await hoursReview.getByLabel(/Review note/).fill("Synthetic time reviewed.");
  await hoursReview.getByRole("button", { name: "Save", exact: true }).click();
  await hoursReview.getByRole("status").waitFor();

  await provider.page.getByRole("button", { name: "Invoices", exact: true }).click();
  const invoice = await openForm(provider.page, "Record an invoice");
  await invoice.getByLabel(/Project/).selectOption(sharedProject);
  const invoiceRef = "CERT-" + suffix;
  await invoice.getByLabel(/Invoice reference/).fill(invoiceRef);
  await invoice.getByLabel(/Amount/).fill("12.50");
  await invoice.getByRole("button", { name: "Save", exact: true }).click();
  await invoice.getByRole("status").waitFor();
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.getByRole("button", { name: "Invoices", exact: true }).click();
  const submittedInvoice = page.locator("article").filter({ has: page.getByRole("heading", { name: invoiceRef, exact: true }) });
  await submittedInvoice.locator("summary").filter({ hasText: /^Record invoice decision$/ }).click();
  const invoiceReview = submittedInvoice.locator("form");
  await invoiceReview.getByLabel(/Status/).selectOption("paid");
  await invoiceReview.getByRole("button", { name: "Save", exact: true }).click();
  await invoiceReview.getByRole("status").waitFor();
  const finalState = await dashboard(context);
  assert.equal(finalState.entries.find((entry) => entry.data.trade === trade).data.status, "approved");
  assert.equal(finalState.entries.find((entry) => entry.data.reference === invoiceRef).data.status, "paid");
  results.crmReview = true;
  results.sharedProjectUpdate = true;
  results.changeClientDecision = true;
  results.vendorHoursReviewed = true;
  results.invoiceRecorded = true;

  await provider.page.getByRole("button", { name: "Documents", exact: true }).click();
  const upload = await openForm(provider.page, "Upload a document");
  await upload.locator('input[type="file"]').setInputFiles({ name: "synthetic.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nSynthetic test document\n%%EOF") });
  await upload.getByRole("button", { name: "Submit for review" }).click();
  await upload.getByRole("alert").waitFor();
  assert.match(await upload.getByRole("alert").textContent(), /storage.*not configured|not.*confirmed|unavailable/i);
  results.uploadUnavailableHonest = true;

  await page.getByRole("button", { name: "Activity", exact: true }).click();
  const notificationResult = page.waitForResponse((response) => response.url().endsWith("/api/notifications") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Send queued notifications", exact: true }).click();
  assert.equal((await notificationResult).status(), 503, "Isolated fixture must not have a live email provider");
  await page.getByRole("status").filter({ hasText: /Notification delivery is not configured/ }).waitFor();
  results.notificationUnavailableHonest = true;

  const anon = await browser.newContext();
  contexts.push(anon);
  const anonPage = await anon.newPage();
  await anonPage.goto(base + "/portal", { waitUntil: "domcontentloaded" });
  assert.ok(new URL(anonPage.url()).pathname === "/login");
  results.unauthenticated = true;
  // A fresh GUI-created session is signed out; fixture baseline sessions remain untouched.
  await anonPage.getByLabel("Email address", { exact: true }).fill(config.accounts.admin.email);
  await anonPage.getByLabel("Password", { exact: true }).fill(config.password);
  await anonPage.getByRole("button", { name: "Sign in", exact: true }).click();
  await anonPage.waitForURL(base + "/portal");
  await anonPage.getByRole("heading", { name: /Your projects/ }).waitFor();
  await anonPage.getByRole("link", { name: "Account & access", exact: true }).click();
  await anonPage.getByRole("heading", { name: "Your account.", exact: true }).waitFor();
  await anonPage.getByRole("button", { name: "Sign out", exact: true }).click();
  await anonPage.waitForURL(base + "/login");
  assert.equal((await anon.request.get(base + "/api/erp-suite")).status(), 401);
  assert.equal((await context.request.get(base + "/api/erp-suite")).status(), 200, "Signing out one session revoked the baseline session");
  results.guiLoginLogout = true;
  console.log(JSON.stringify({ passed: true, ...results }, null, 2));
} finally {
  for (const context of contexts) await context.close();
  await browser.close();
}
