/**
 * Local, read-only public-shell checks. Does not submit forms or call ERP writes.
 * Run with a local TAYCO_BASE_URL and Playwright available as a package, or set
 * TAYCO_PLAYWRIGHT_MODULE to its installed module path.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TAYCO_PLAYWRIGHT_MODULE || "playwright");
const base = process.env.TAYCO_BASE_URL || "http://127.0.0.1:3005";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const mutations = [];
await page.route("**/api/**", async (route) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(route.request().method())) {
    mutations.push(route.request().url());
    await route.abort();
  } else await route.continue();
});
const results = [];
try {
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.locator(".tayco-menu-toggle").waitFor({ state: "attached" });
  for (const [width, height] of [[360, 740], [390, 844], [768, 1024], [1024, 768], [1200, 800], [1440, 900], [844, 390], [720, 450]]) {
    await page.setViewportSize({ width, height });
    const header = page.locator(".tayco-site-header");
    const dims = await header.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.x,
        right: rect.right,
        viewport: document.documentElement.clientWidth,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        controls: [...el.querySelectorAll(".tayco-nav-bar a, .tayco-nav-bar button")]
          .map((control) => control.getBoundingClientRect())
          .filter((rect) => rect.width > 0)
          .map((rect) => ({ x: rect.x, right: rect.right, height: rect.height })),
      };
    });
    assert.equal(dims.x, 0);
    assert.ok(dims.right <= dims.viewport + 1, "Header exceeds viewport");
    if (dims.horizontalOverflow > 1) {
      const protruding = await page.evaluate(() => [...document.querySelectorAll("body *")].filter((el) => {
        const r = el.getBoundingClientRect(); return r.right > document.documentElement.clientWidth + 1 && getComputedStyle(el).position !== "fixed";
      }).slice(-12).map((el) => ({tag:el.tagName,classes:typeof el.className === "string" ? el.className : "",right:el.getBoundingClientRect().right})));
      throw new Error(JSON.stringify({problem:"Page horizontal overflow",width,height,overflow:dims.horizontalOverflow,protruding}));
    }
    assert.ok(dims.controls.every((control) => control.height >= 44 && control.x >= 0 && control.right <= dims.viewport + 1), "Control is clipped or below 44px");
    if (width < 1200) {
      const toggle = page.locator(".tayco-menu-toggle");
      if (await toggle.getAttribute("aria-expanded") === "true") await toggle.click();
      await toggle.click();
      assert.equal(await toggle.getAttribute("aria-expanded"), "true");
      const panel = page.locator("#tayco-mobile-navigation");
      assert.equal(await panel.isVisible(), true);
      const panelDims = await panel.boundingBox();
      assert.ok(panelDims.y + panelDims.height <= height + 1, "Menu exceeds visual viewport");
      await page.keyboard.press("Tab");
      assert.equal(await page.locator(":focus").textContent(), "Commercial");
      await page.keyboard.press("Escape");
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      assert.equal(await toggle.evaluate((el) => el === document.activeElement), true, "Escape did not restore focus");
      await toggle.click();
      await page.mouse.click(width / 2, Math.min(height - 2, 600));
      if (height > 600) assert.equal(await toggle.getAttribute("aria-expanded"), "false", "Outside click did not dismiss menu");
      if (await toggle.getAttribute("aria-expanded") === "true") await page.keyboard.press("Escape");
    }
    results.push({ width, height, horizontalOverflow: dims.horizontalOverflow, minimumControlHeight: Math.min(...dims.controls.map((control) => control.height)), passed: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => document.body.dataset.motion === "reduced");
  assert.equal(await page.locator(".tayco-motion-control").last().getAttribute("aria-pressed"), "true");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForFunction(() => document.body.dataset.motion !== "reduced");
  await page.locator(".tayco-menu-toggle").click();
  await page.locator("#tayco-mobile-navigation .tayco-motion-control").click();
  await page.waitForFunction(() => document.body.dataset.motion === "reduced");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.body.dataset.motion === "reduced");
  assert.equal(await page.locator("#tayco-quick-login-modal").count(), 0);
  assert.equal(await page.locator('.tayco-site-header a[href*="invite="]').count(), 0);
  assert.equal(await page.locator('.tayco-site-header a[href="/login"]').count(), 2);
  assert.equal(await page.locator("#main-content").count(), 1, "Skip link target is missing");
  await page.locator(".tayco-skip-link").focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.activeElement?.id === "main-content");
  assert.deepEqual(mutations, [], "Public shell attempted to mutate API state");
  console.log(JSON.stringify({ passed: true, viewportCases: results, reducedMotion: true, motionPreferencePersisted: true, skipLink: true, apiMutations: mutations.length }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
