// Randhy, 8-nov-2026: «Pero verificaron todas las secciones y todos los servicios». A full sweep of the
// public site in a real browser: every internal link the pages show, at desktop and phone width.
//   BASE_URL=https://taycoturnkey.com TAYCO_PLAYWRIGHT_MODULE=<path to playwright> [CHROME_PATH=<chrome.exe>] node tests/site-sweep-ui.mjs
// Read-only. Every request that is not GET or HEAD is aborted before it leaves the browser, so forms
// are opened and validated (checkValidity) but nothing is ever sent. For each page it prints the HTTP
// code, broken images (failed /api/visual-stream or image responses, <img> with naturalWidth 0),
// console errors and horizontal scroll. Exit code 1 if any page has one of them.
import { createRequire } from 'node:module';

const base = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const origin = new URL(base).origin;
const { chromium } = createRequire(import.meta.url)(process.env.TAYCO_PLAYWRIGHT_MODULE || 'playwright');
const MAX_PAGES = Number(process.env.MAX_PAGES || 120);
const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  phone: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
};
// Plain HTTP tunnels cannot honour Cross-Origin-Opener-Policy; that warning is about the transport.
const IGNORED_CONSOLE = /Cross-Origin-Opener-Policy/i;
const SKIP = /^\/(?:api|_next)\/|\.(?:pdf|jpe?g|png|webp|avif|svg|ico|xml|txt|zip|json)$/i;

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined });

// 1. Discover: every same-origin link reachable from the home page.
async function discover() {
  const context = await browser.newContext(VIEWPORTS.desktop);
  const page = await context.newPage();
  const queue = ['/'], seen = new Set(['/']), external = new Map();
  while (queue.length && seen.size <= MAX_PAGES) {
    const route = queue.shift();
    const response = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null);
    if (!response || new URL(page.url()).origin !== origin) continue;
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.href));
    for (const href of hrefs) {
      const url = new URL(href, base);
      if (!/^https?:$/.test(url.protocol)) continue;
      if (url.origin !== origin) { external.set(url.origin + url.pathname, route); continue; }
      const path = url.pathname.replace(/\/$/, '') || '/';
      if (SKIP.test(path) || seen.has(path)) continue;
      seen.add(path);
      queue.push(path);
    }
  }
  await context.close();
  return { routes: [...seen].sort(), external };
}

// 2. Visit each route at each width.
async function visit(context, route) {
  // A route that redirects to another site (/connect → connect.tayco.llc) is reported, not audited:
  // that site has its own checks, and its signed-out session probe answers 401 by design.
  const head = await context.request.get(base + route, { maxRedirects: 0 }).catch(() => null);
  const location = head && head.status() >= 300 && head.status() < 400 ? new URL(head.headers().location, base) : null;
  if (location && location.origin !== origin) return { status: head.status(), finalPath: `${location.origin}${location.pathname}`, external: true, imgZero: [], overflow: 0, forms: [], broken: [], errors: [] };
  const page = await context.newPage();
  const errors = [], broken = new Set();
  page.on('console', (m) => { if (m.type() === 'error' && !IGNORED_CONSOLE.test(m.text())) errors.push(m.text().slice(0, 160)); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message.slice(0, 160)}`));
  page.on('response', (r) => {
    const u = new URL(r.url());
    if (u.origin === origin && r.status() >= 400 && (u.pathname === '/api/visual-stream' || r.request().resourceType() === 'image')) broken.add(`${r.status()} ${u.searchParams.get('p') || u.pathname}`);
  });
  page.on('requestfailed', (r) => {
    const u = new URL(r.url());
    if (u.origin === origin && r.failure()?.errorText !== 'net::ERR_ABORTED' && (u.pathname === '/api/visual-stream' || r.resourceType() === 'image')) broken.add(`failed ${u.searchParams.get('p') || u.pathname}`);
  });
  const response = await page.goto(base + route, { waitUntil: 'networkidle', timeout: 90000 }).catch((e) => ({ status: () => `ERR ${e.message.split('\n')[0].slice(0, 60)}` }));
  const status = response.status();
  // Scroll to the bottom in steps so lazy photos load, then back up.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 250)); }
    scrollTo(0, 0);
  }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  const state = await page.evaluate(() => ({
    finalPath: location.pathname,
    imgZero: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map((i) => i.getAttribute('src')),
    overflow: document.documentElement.scrollWidth - innerWidth,
    forms: [...document.querySelectorAll('form')].map((f) => {
      const fields = [...f.elements].filter((e) => e.willValidate);
      return { fields: fields.length, required: fields.filter((e) => e.required).length, validEmpty: f.checkValidity(), invalid: fields.filter((e) => !e.checkValidity()).length };
    }),
  })).catch(() => ({ finalPath: '?', imgZero: [], overflow: 0, forms: [] }));
  for (const src of state.imgZero) broken.add(`naturalWidth 0 ${src}`);
  await page.close();
  return { status, ...state, broken: [...broken], errors: [...new Set(errors)] };
}

let failed = 0;
try {
  const { routes, external } = await discover();
  console.log(`${routes.length} internal routes found from ${base}/ (${external.size} external links, not visited)`);
  console.log('route | device | HTTP | broken images | console errors | horizontal scroll | forms');
  for (const [device, options] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ ...options, reducedMotion: 'reduce' });
    // Nothing leaves the browser except reads.
    await context.route('**/*', (r) => (['GET', 'HEAD'].includes(r.request().method()) ? r.continue() : r.abort('blockedbyclient')));
    for (const route of routes) {
      const v = await visit(context, route);
      if (v.external) { console.log(`↪ ${route} | ${device} | ${v.status} → ${v.finalPath} (another site, not audited here)`); continue; }
      const bad = typeof v.status !== 'number' || v.status >= 400 || v.broken.length || v.errors.length || v.overflow > 1;
      if (bad) failed++;
      const forms = v.forms.length ? v.forms.map((f) => `${f.fields} fields/${f.required} required, empty ${f.validEmpty ? 'ACCEPTED' : 'rejected'} (${f.invalid} invalid)`).join('; ') : '-';
      const moved = v.finalPath !== route ? ` → ${v.finalPath}` : '';
      console.log(`${bad ? '✖' : '✔'} ${route}${moved} | ${device} | ${v.status} | ${v.broken.length} | ${v.errors.length} | ${v.overflow > 1 ? `${v.overflow}px` : 'no'} | ${forms}`);
      for (const b of v.broken.slice(0, 5)) console.log(`    image: ${b}`);
      for (const e of v.errors.slice(0, 5)) console.log(`    console: ${e}`);
    }
    await context.close();
  }
  for (const [link, from] of external) console.log(`  external (not visited): ${link}  (linked from ${from})`);
} finally {
  await browser.close();
}
console.log(failed ? `${failed} page visit(s) with problems` : 'all pages clean');
process.exit(failed ? 1 : 0);
