// Taylor, 8-nov-2026 (WhatsApp, via the HUB): «aún tienen los textos descriptivos. necesitamos que solo
// sea la foto, que no haga tanto visual y que no se vean las demás fotos abajo, solo cuando el cliente
// deslice a la izquierda o derecha.» Every «View Gallery» viewer keeps only: the photo, ‹ › arrows,
// swipe, at most a discreet «3 / 3» counter, and the X to close. Nothing is added.
//
// The viewer is drawn in the browser, so this opens it in a real one:
//   BASE_URL=http://localhost:3100 TAYCO_PLAYWRIGHT_MODULE=<path to playwright> [CHROME_PATH=<chrome.exe>] node tests/gallery-viewer-ui.mjs
// Read-only: it opens public pages and clicks gallery buttons, nothing else. Exit code 1 lists every
// viewer that still shows text, thumbnails or labels, or whose arrows, swipe or close do not work.
import { createRequire } from 'node:module';

const base = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const { chromium } = createRequire(import.meta.url)(process.env.TAYCO_PLAYWRIGHT_MODULE || 'playwright');

// Taylor asked for every gallery: the specialty cards of the four divisions and the «View Gallery»
// buttons of the home page track record, which open a viewer of their own.
const SPECIALTY = '[data-specialty-studio-trigger]';
const PAGES = {
  'single-family': { specialty: SPECIALTY },
  multifamily: { specialty: SPECIALTY },
  townhomes: { specialty: SPECIALTY },
  commercial: { specialty: SPECIALTY },
  '': { 'track record': '#tayco-verified-track-record button:has-text("View Gallery")' },
};
const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  phone: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 },
};
// The only words allowed on screen: the counter and the close button.
const ALLOWED_TEXT = /^(?:\d+\s*\/\s*\d+|close|[‹›←→×✕<>])$/i;

// Everything the viewer shows: visible text lines and visible photos (photo = which file, and its size).
async function inspect(dialog) {
  return dialog.evaluate((root) => {
    const shown = (el) => {
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false;
      }
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
    };
    const box = root.getBoundingClientRect();
    const photos = [...root.querySelectorAll('canvas[data-protected-canvas], img')]
      .filter(shown)
      .map((el) => { const r = el.getBoundingClientRect(); return { stem: el.dataset.assetStem || el.getAttribute('src') || '?', share: r.width / box.width }; });
    const text = root.innerText.split('\n').map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const pins = [...root.querySelectorAll('[data-hotspot-pin], [role="tablist"]')].filter(shown).length;
    const overflow = root.scrollWidth - root.clientWidth > 1 || box.left < -1 || box.right > innerWidth + 1;
    return { photos, text, pins, overflow };
  });
}

const current = (state) => state.photos.filter((p) => p.share >= 0.5).map((p) => p.stem).sort().join('|');

async function check(page, label, trigger) {
  const problems = [];
  const button = page.locator(trigger).first();
  if (!(await button.count())) return [`${label}: no gallery button`];
  await button.scrollIntoViewIfNeeded();
  await button.click();
  // :visible, because the mobile menu keeps an empty dialog root mounted on every page.
  const dialog = page.locator('[data-tayco-modal-root="true"]:visible').last();
  await dialog.waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(1200);

  const state = await inspect(dialog);
  const words = [...new Set(state.text.filter((t) => !ALLOWED_TEXT.test(t)))];
  if (words.length) problems.push(`${label}: text on screen: ${words.slice(0, 12).map((w) => (w.length > 60 ? `${w.slice(0, 57)}...` : w)).join(' · ')}${words.length > 12 ? ` (+${words.length - 12})` : ''}`);
  const thumbs = state.photos.filter((p) => p.share < 0.5);
  if (thumbs.length) problems.push(`${label}: ${thumbs.length} small photo(s) besides the main one (thumbnails)`);
  if (state.pins) problems.push(`${label}: ${state.pins} numbered pin(s) or filmstrip on the photo`);
  if (state.overflow) problems.push(`${label}: the viewer is wider than the screen`);
  const first = current(state);
  if (!first) problems.push(`${label}: no photo fills the viewer`);

  // Arrows: both visible, inside the screen, at least 40 px, and «next» changes the photo.
  const viewport = page.viewportSize();
  for (const name of ['previous', 'next']) {
    const arrow = dialog.getByRole('button', { name: new RegExp(name, 'i') }).first();
    const box = (await arrow.count()) && (await arrow.isVisible()) ? await arrow.boundingBox() : null;
    if (!box) { problems.push(`${label}: no visible «${name}» arrow`); continue; }
    if (box.width < 40 || box.height < 40 || box.x < 0 || box.y < 0 || box.x + box.width > viewport.width || box.y + box.height > viewport.height) {
      problems.push(`${label}: «${name}» arrow is cut off or smaller than 40 px`);
    }
  }
  const next = dialog.getByRole('button', { name: /next/i }).first();
  if (await next.count()) {
    await next.click();
    await page.waitForTimeout(900);
    if (current(await inspect(dialog)) === first) problems.push(`${label}: «next» did not change the photo`);
  }

  // Swipe left on the photo shows another one (pointer drag, as the stage listens to pointer events).
  const stage = dialog.locator('[data-tayco-wheel-stage="true"]').first();
  const before = current(await inspect(dialog));
  const area = (await stage.count()) ? await stage.boundingBox() : null;
  if (!area) problems.push(`${label}: no swipe area`);
  else {
    const y = area.y + area.height / 2;
    await page.mouse.move(area.x + area.width * 0.8, y);
    await page.mouse.down();
    await page.mouse.move(area.x + area.width * 0.2, y, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(900);
    if (current(await inspect(dialog)) === before) problems.push(`${label}: swiping did not change the photo`);
  }

  // The X closes it.
  const close = dialog.getByRole('button', { name: /close/i }).first();
  if (!(await close.count()) || !(await close.isVisible())) problems.push(`${label}: no visible close button`);
  else {
    await close.click();
    if (!(await dialog.waitFor({ state: 'hidden', timeout: 5000 }).then(() => true, () => false))) problems.push(`${label}: the X did not close it`);
  }
  if (await dialog.count()) await page.keyboard.press('Escape');
  return problems;
}

// CHROME_PATH lets it use the installed Chrome when Playwright's own browser is not downloaded.
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined });
let failed = 0;
try {
  for (const [device, options] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ ...options, reducedMotion: 'reduce' });
    const page = await context.newPage();
    for (const [slug, triggers] of Object.entries(PAGES)) {
      await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle', timeout: 60000 });
      const accept = page.getByTestId('cookie-accept-all');
      if (await accept.isVisible().catch(() => false)) await accept.click();
      for (const [kind, trigger] of Object.entries(triggers)) {
        const label = `/${slug} ${kind} gallery (${device})`;
        const problems = await check(page, label, trigger).catch((error) => [`${label}: ${error.message.split('\n')[0]}`]);
        if (problems.length) { failed++; for (const p of problems) console.log(`✖ ${p}`); }
        else console.log(`✔ ${label}: only the photo, arrows, swipe, counter and close`);
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
