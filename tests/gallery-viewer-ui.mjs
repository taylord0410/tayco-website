// Taylor, 8-nov-2026 (WhatsApp, via the HUB): «aún tienen los textos descriptivos. necesitamos que solo
// sea la foto, que no haga tanto visual y que no se vean las demás fotos abajo, solo cuando el cliente
// deslice a la izquierda o derecha.» Randhy's balance, same day: «que haya algo porque si no solo es
// una revista de fotos». Every «View Gallery» viewer keeps only: the photo, ‹ › arrows, swipe, a
// discreet «3 / 3» counter, the X to close, ONE line with the short name of the work and ONE «Request
// Estimate» button. Each photo keeps a descriptive alt for search engines and screen readers (HUB).
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
// Words always allowed on screen: the counter, the close button and the arrows.
const ALLOWED_TEXT = /^(?:\d+\s*\/\s*\d+|close|[‹›←→×✕<>])$/i;
const ESTIMATE = /^request (?:an? )?estimate\b/i;
// The one name line is short and, like the rest of the page (rule 6), does not repeat the division
// or show codes: «Standing-Seam Metal Roof», not the long subtitle.
const MAX_NAME = 40;
const DIVISIONS = {
  'single-family': /\bsingle[\s-]?family\b|\bSFH\b/i,
  multifamily: /\bmulti[\s-]?family\b|\bmulti[\s-]?unit\b|\bmulti[\s-]?stor(?:e?y|ies)\b/i,
  townhomes: /\btown[\s-]?(?:home|house)s?\b|\brow[\s-]?(?:home|house)s?\b|\b(?:row|attached)[\s-]?residen(?:ce|ces|tial)\b/i,
  commercial: /\bcommercial\b/i,
};
const TECHNICAL = /\bCSI\b|\bDIV\s*\d|\b[A-Z]{2,4}-[A-Z]{3,5}\b|\(\s*\d+\s*\)|\bOF\s+\d+\b|\d\s?°|\b\d{4}\s?K\b/;

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
    // Every photo the viewer holds (shown or stacked for the crossfade) needs a real alt, not a file
    // name. Blurred background copies are marked data-audit-ignore and are decorative.
    const noAlt = [...root.querySelectorAll('canvas[data-protected-canvas], img')]
      .filter((el) => el.dataset.auditIgnore !== 'true')
      .map((el) => ({ stem: el.dataset.assetStem || el.getAttribute('src') || '?', alt: (el.getAttribute('aria-label') ?? el.getAttribute('alt') ?? '').trim() }))
      .filter(({ alt }) => alt.length < 3 || /\.(?:jpe?g|png|webp|avif)\b|_/i.test(alt))
      .map(({ stem, alt }) => `${stem} «${alt}»`);
    const estimate = [...root.querySelectorAll('a, button')]
      .filter((el) => shown(el) && /^request (?:an? )?estimate\b/i.test(el.innerText.trim()))
      .map((el) => el.getAttribute('href'));
    return { photos, text, pins, overflow, noAlt, estimate };
  });
}

const current = (state) => state.photos.filter((p) => p.share >= 0.5).map((p) => p.stem).sort().join('|');

// HUB, 8-nov, after the first client pass: one rule for both viewers. Nearly full screen, the WHOLE
// photo (no crop) filling at least 80 % of the frame's width or height, a frame that keeps its size
// from a portrait photo to a landscape one, a footer that never changes shape, and an opaque
// background (the page text must not show through).
const MIN_STAGE = { width: 0.85, height: 0.55 }; // of the screen
const MIN_FILL = 0.8; // of the frame, in width or height
async function frame(dialog) {
  return dialog.evaluate((root) => {
    const stage = root.querySelector('[data-tayco-wheel-stage="true"]');
    const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
    const shown = (el) => {
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false;
      }
      return true;
    };
    // The main photo: the largest visible photo that is not a decorative backdrop.
    const main = [...root.querySelectorAll('canvas[data-protected-canvas], img')]
      .filter((el) => shown(el) && el.dataset.auditIgnore !== 'true')
      .sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0];
    let photo = null;
    if (main) {
      // Where the picture lands inside its box, from its own proportions and its object-fit.
      const iw = main.naturalWidth || main.width, ih = main.naturalHeight || main.height;
      const ew = main.clientWidth, eh = main.clientHeight, fit = getComputedStyle(main).objectFit;
      const scale = fit === 'cover' ? Math.max(ew / iw, eh / ih) : fit === 'none' ? 1 : fit === 'scale-down' ? Math.min(1, ew / iw, eh / ih) : Math.min(ew / iw, eh / ih);
      const cw = fit === 'fill' ? ew : iw * scale, ch = fit === 'fill' ? eh : ih * scale;
      const s = stage?.getBoundingClientRect();
      photo = {
        stem: main.dataset.assetStem || main.getAttribute('src') || '?',
        cropped: cw > ew + 2 || ch > eh + 2,
        distorted: fit === 'fill' && Math.abs(ew / eh - iw / ih) > 0.02 * (iw / ih),
        fill: s ? Math.max(Math.min(cw, ew) / s.width, Math.min(ch, eh) / s.height) : 0,
      };
    }
    const estimate = [...root.querySelectorAll('a, button')].find((el) => shown(el) && /^request (?:an? )?estimate\b/i.test(el.innerText.trim()));
    // Opaque: at each point of a grid over the screen, something opaque of the viewer is hit before
    // anything of the page underneath.
    const seeThrough = [];
    for (let gx = 0.05; gx < 1; gx += 0.1) for (let gy = 0.05; gy < 1; gy += 0.1) {
      const x = innerWidth * gx, y = innerHeight * gy;
      for (const el of document.elementsFromPoint(x, y)) {
        if (!root.contains(el)) { seeThrough.push(`${Math.round(x)},${Math.round(y)}`); break; }
        const cs = getComputedStyle(el);
        // Alpha in any color syntax: rgba(r, g, b, a), oklab(l a b / a), color(srgb r g b / a)...
        const bg = cs.backgroundColor;
        const a = bg.match(/\/\s*([\d.]+)(%?)\s*\)$/) || bg.match(/^rgba\([^)]*,\s*([\d.]+)(%?)\s*\)$/);
        const alpha = bg === 'transparent' ? 0 : a ? Number(a[1]) / (a[2] ? 100 : 1) : 1;
        if (el.matches('canvas, img') || alpha >= 0.97) break;
      }
    }
    // The copy behind the whole photo fills the empty bands; sharp, it reads as three stacked photos
    // (division viewer on a phone, 8-nov: its blur lived in a stylesheet only the home page loads).
    const sharpBackdrops = [...(stage?.querySelectorAll('canvas[data-protected-canvas], img') ?? [])]
      .filter((el) => shown(el) && el.dataset.auditIgnore === 'true')
      .filter((el) => { const m = getComputedStyle(el).filter.match(/blur\(([\d.]+)px\)/); return !m || Number(m[1]) < 8; }).length;
    return { stage: rect(stage), photo, estimate: rect(estimate), seeThrough, sharpBackdrops };
  });
}

async function check(page, label, trigger, division) {
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
  const words = [...new Set(state.text.filter((t) => !ALLOWED_TEXT.test(t) && !ESTIMATE.test(t)))];
  if (words.length > 1) problems.push(`${label}: ${words.length} text lines on screen, only one name line is allowed: ${words.slice(0, 12).map((w) => (w.length > 60 ? `${w.slice(0, 57)}...` : w)).join(' · ')}${words.length > 12 ? ` (+${words.length - 12})` : ''}`);
  else if (words.length === 1) {
    const [name] = words;
    if (name.length > MAX_NAME) problems.push(`${label}: the name line is longer than ${MAX_NAME} characters: ${name}`);
    if ((division && division.test(name)) || TECHNICAL.test(name)) problems.push(`${label}: the name line repeats the division or shows a code: ${name}`);
  }
  if (state.estimate.length !== 1) problems.push(`${label}: ${state.estimate.length} «Request Estimate» buttons, one is expected`);
  else if (state.estimate[0] !== null && !/\/estimate\b/.test(state.estimate[0])) problems.push(`${label}: «Request Estimate» goes to ${state.estimate[0]}, not /estimate`);
  if (state.noAlt.length) problems.push(`${label}: ${state.noAlt.length} photo(s) without a descriptive alt: ${state.noAlt.slice(0, 4).join(' · ')}`);
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

  // Every photo of the gallery, stepping with «next» until the first one comes back (at most 24).
  const viewportBox = page.viewportSize();
  const frames = [];
  for (let i = 0; i < 24; i++) {
    const f = await frame(dialog);
    if (i > 0 && f.photo?.stem === frames[0].photo?.stem) break;
    frames.push(f);
    if (!(await next.count())) break;
    await next.click();
    await page.waitForTimeout(700);
  }
  const [f0] = frames;
  if (!f0?.stage) problems.push(`${label}: no photo frame`);
  else {
    if (f0.stage.w < viewportBox.width * MIN_STAGE.width || f0.stage.h < viewportBox.height * MIN_STAGE.height) {
      problems.push(`${label}: the photo frame is ${f0.stage.w}×${f0.stage.h}, less than ${Math.round(MIN_STAGE.width * 100)} % of the screen width or ${Math.round(MIN_STAGE.height * 100)} % of its height`);
    }
    const moved = frames.filter((f) => !f.stage || Math.abs(f.stage.h - f0.stage.h) > 2 || Math.abs(f.stage.w - f0.stage.w) > 2 || Math.abs(f.stage.y - f0.stage.y) > 2);
    if (moved.length) problems.push(`${label}: the frame changes size from one photo to another (${moved.map((f) => `${f.photo?.stem}: ${f.stage?.w}×${f.stage?.h} at y=${f.stage?.y}`).slice(0, 3).join(', ')} vs ${f0.stage.w}×${f0.stage.h} at y=${f0.stage.y})`);
    const footer = frames.filter((f) => !f.estimate || !f0.estimate || Math.abs(f.estimate.x - f0.estimate.x) > 2 || Math.abs(f.estimate.y - f0.estimate.y) > 2);
    if (footer.length) problems.push(`${label}: «Request Estimate» moves from one photo to another (${footer.map((f) => f.photo?.stem).slice(0, 3).join(', ')})`);
  }
  for (const f of frames) {
    if (!f.photo) continue;
    if (f.photo.cropped) problems.push(`${label}: ${f.photo.stem} is cropped (object-fit cover), the whole photo must show`);
    if (f.photo.distorted) problems.push(`${label}: ${f.photo.stem} is stretched`);
    if (f.photo.fill < MIN_FILL) problems.push(`${label}: ${f.photo.stem} fills only ${Math.round(f.photo.fill * 100)} % of the frame`);
  }
  if (frames.some((f) => f.sharpBackdrops)) problems.push(`${label}: the background copy behind the photo is not blurred (at least 8 px), it looks like extra photos`);
  const holes = [...new Set(frames.flatMap((f) => f.seeThrough))];
  if (holes.length) problems.push(`${label}: the page shows through the viewer at ${holes.length} of 100 points (e.g. ${holes.slice(0, 3).join(' · ')})`);

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
        const problems = await check(page, label, trigger, DIVISIONS[slug]).catch((error) => [`${label}: ${error.message.split('\n')[0]}`]);
        if (problems.length) { failed++; for (const p of problems) console.log(`✖ ${p}`); }
        else console.log(`✔ ${label}: only the photo, arrows, swipe, counter, close, one name line and «Request Estimate»`);
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
