/**
 * Public identity and intake contracts, with every write intercepted in-browser.
 * Never submits to Airtable, email, blob storage, or the actual intake API.
 * TAYCO_BASE_URL should point to an isolated local server.
 */
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TAYCO_PLAYWRIGHT_MODULE || "playwright");
const base = process.env.TAYCO_BASE_URL || "http://127.0.0.1:3005";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const page = await context.newPage();
page.setDefaultTimeout(12000);
const unexpectedWrites = [];
let activeKind = null;
let attempts = [];
await page.route("**/api/**", async route => {
  const req = route.request();
  if (["GET", "HEAD", "OPTIONS"].includes(req.method())) return route.continue();
  if (activeKind && new URL(req.url()).pathname === `/api/${activeKind}`) {
    attempts.push({ headers: await req.allHeaders(), payload: req.postDataJSON() });
    return route.fulfill({
      status: attempts.length === 1 ? 503 : 200,
      contentType: "application/json",
      body: JSON.stringify(attempts.length === 1
        ? { error: "Temporary test failure; retry safely." }
        : { success: true, referenceId: `test-reference-${activeKind}`, notificationStatus: "pending" }),
    });
  }
  unexpectedWrites.push(req.url());
  return route.abort();
});
const results = [];
const layoutIssues = [];
try {
  for (const [width, height] of [[390, 844], [1440, 960]]) {
  await page.setViewportSize({ width, height });
  for (const url of ["/", "/commercial", "/residential", "/investor", "/estimate", "/vendor-application"]) {
    await page.goto(base + url, { waitUntil: "domcontentloaded" });
    await page.locator("footer").waitFor();
    const text = await page.locator("body").innerText();
    assert.doesNotMatch(text, /:8085|RUST KERNELS|MOD_CRM_BIDS|MOD_INVESTOR_PORTAL|SHA-256|\$5,884,717|\$855,525|INV-TAYCO/i, url + " leaks technical/demo copy");
    assert.equal(await page.locator('a[href*="invite=INV-"]').count(), 0);
    assert.equal(await page.locator('footer a[href="tel:+18572301452"]').innerText(), "857-230-1452");
    assert.ok(await page.locator('footer a[href="mailto:general@taycoturnkey.com"]').isVisible());
    assert.ok(await page.locator('footer a[href="/privacy"]').isVisible());
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 1) layoutIssues.push(`${url} at ${width}px overflows by ${overflow}px`);
    results.push({ path: url, width, height, identity: "passed", horizontalOverflow: overflow });
  }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  if (!process.env.TAYCO_SKIP_QUERY_CONTEXT) {
  await page.goto(base + "/estimate?trade=Roofing&division=residential", { waitUntil: "domcontentloaded" });
  await page.locator("#estimate-projectDetails").fill("Keep my original notes.");
  await page.getByRole("button", { name: "Use selected service in my request", exact: false }).click();
  assert.match(await page.locator("#estimate-projectDetails").inputValue(), /Keep my original notes[\s\S]*Service requested: Roofing/);
  assert.equal(await page.locator("#estimate-projectType").inputValue(), "Residential Renovation");
  } else results.push({ queryContext: "skipped: first fixture predates this change" });
  for (const kind of ["estimate", "investor", "vendor"]) {
    activeKind = kind;
    attempts = [];
    await page.goto(base + (kind === "vendor" ? "/vendor-application" : "/" + kind), { waitUntil: "domcontentloaded" });
    if (kind === "estimate") {
      await page.locator("#estimate-fullName").fill("Test Client");
      await page.locator("#estimate-phone").fill("2025550100");
      await page.locator("#estimate-email").fill("test@example.invalid");
      await page.locator("#estimate-projectType").selectOption({ label: "Residential Renovation" });
      await page.locator("#estimate-projectLocation").fill("Milwaukee, WI");
      const area = page.locator("#calc-input-sqft");
      const applyBudget = page.locator("#btn-preload-estimate-form");
      await area.fill("");
      assert.equal(await area.inputValue(), "", "Empty edit was forcibly replaced");
      assert.equal(await applyBudget.isDisabled(), true);
      for (const invalidArea of ["100", "250001", "-20", "300.5"]) {
        await area.fill(invalidArea);
        assert.equal(await area.inputValue(), invalidArea, "Invalid range edit was forcibly replaced");
        assert.equal(await applyBudget.isDisabled(), true, "Invalid area enabled prefill");
      }
      await area.fill("");
      await area.pressSequentially("2400");
      assert.equal(await area.inputValue(), "2400", "Sequential area typing was clamped mid-edit");
      assert.equal(await applyBudget.isEnabled(), true);
      await page.locator("#estimate-projectDetails").fill("Keep my project instructions.");
      await page.locator("#btn-preload-estimate-form").click();
      await page.locator("#btn-preload-estimate-form").click();
      const details = await page.locator("#estimate-projectDetails").inputValue();
      assert.match(details, /Keep my project instructions/);
      assert.equal(details.split("Budget planning illustration only").length - 1, 1);
      await area.fill("0");
      assert.equal(await applyBudget.isDisabled(), true);
    } else if (kind === "investor") {
      await page.locator("#property-fullName").fill("Test Property Owner");
      await page.locator("#property-email").fill("test@example.invalid");
      await page.locator("#property-phone").fill("2025550100");
      await page.getByRole("button", { name: "Roofing", exact: true }).click();
    } else {
      assert.equal(await page.locator('input[type="file"]').count(), 0, "Public form exposes sensitive uploads");
      await page.locator("#vendor-businessName").fill("Test Trade Company");
      await page.locator("#vendor-contactName").fill("Test Partner");
      await page.locator("#vendor-phone").fill("2025550100");
      await page.locator("#vendor-email").fill("test@example.invalid");
      await page.locator("#vendor-yearsInBusiness").fill("3");
      await page.locator("#vendor-crewSize").fill("4");
      await page.locator("#vendor-insured").selectOption("Yes");
      await page.locator("#vendor-stateServed").selectOption({ label: "Wisconsin (WI)" });
      await page.locator("#vendor-citiesServed").fill("Milwaukee");
      await page.getByRole("button", { name: "Framing", exact: true }).click();
    }
    const missingLabels = await page.locator("form").evaluate(form => [...form.querySelectorAll("input,select,textarea")]
      .filter(el => el.name !== "website" && el.type !== "hidden" && !el.labels?.length && !el.getAttribute("aria-label"))
      .map(el => el.name || el.id));
    assert.deepEqual(missingLabels, [], kind + " controls lack labels");
    await page.locator('form button[type="submit"]').click();
    await page.getByRole("alert").filter({ hasText: "Temporary test failure" }).waitFor();
    assert.equal(attempts.length, 1);
    await page.locator('form button[type="submit"]').click();
    await page.getByText(`test-reference-${kind}`, { exact: false }).waitFor();
    assert.equal(attempts.length, 2);
    if (kind === "estimate") {
      assert.equal(Object.hasOwn(attempts[0].payload, "sqft"), false, "Invalid calculator area was submitted");
      assert.equal(Object.hasOwn(attempts[0].payload, "budgetIllustrationUsd"), false, "Artificial budget was submitted from invalid calculator");
    }
    assert.ok(attempts[0].headers["idempotency-key"]);
    assert.equal(attempts[0].headers["idempotency-key"], attempts[1].headers["idempotency-key"], kind + " retry changed key");
    assert.deepEqual(attempts[0].payload, attempts[1].payload, kind + " retry changed payload");
    assert.ok(await page.getByText(/Team notification is pending/).isVisible());
    results.push({ kind, mockedAttempts: 2, retryKey: "preserved", receipt: "displayed", pendingNotification: "honest" });
    activeKind = null;
  }
  await page.goto(base + "/residential", { waitUntil: "domcontentloaded" });
  await page.getByRole("group", { name: "Choose a trade" }).getByRole("button", { name: /Flooring$/ }).click();
  assert.equal(await page.locator('button img[src*="flooring%2F"], button img[src*="flooring/"]').count(), 30, "Flooring gallery must retain two images per each of fifteen types");
  await page.getByRole("group", { name: "Choose a trade" }).getByRole("button", { name: /Framing$/ }).click();
  const opener = page.locator('button[aria-label^="Zoom "]').first();
  await opener.click();
  await page.locator("dialog[open]").waitFor();
  await page.keyboard.press("Escape");
  await page.locator("dialog").waitFor({ state: "detached" });
  assert.equal(await opener.evaluate(el => el === document.activeElement), true, "Gallery did not restore focus");
  assert.deepEqual(unexpectedWrites, [], "A public page attempted a non-mocked write");
  assert.deepEqual(layoutIssues, [], "Public layout has horizontal overflow");
  const report = {
    capturedAt: new Date().toISOString(),
    testSourceSha256: createHash("sha256").update(readFileSync(fileURLToPath(import.meta.url))).digest("hex"),
    passed: layoutIssues.length === 0 && unexpectedWrites.length === 0,
    actualApiWrites: unexpectedWrites.length,
    results, layoutIssues, galleryEscapeAndFocus: "passed",
  };
  if (process.env.TAYCO_REPORT_PATH) {
    const reportPath = resolve(process.env.TAYCO_REPORT_PATH);
    const relativePath = relative(resolve(".data/certification"), reportPath);
    assert.ok(relativePath && !relativePath.startsWith("..") && !isAbsolute(relativePath), "Report destination must remain inside .data/certification");
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  }
  console.log(JSON.stringify(report, null, 2));
} finally { await context.close(); await browser.close(); }
