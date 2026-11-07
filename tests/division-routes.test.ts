import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import nextConfig from '../next.config';
import { PROPERTY_CATEGORIES } from '../lib/property-catalog';

// One canonical URL per division. Older URLs only survive as redirects in next.config.ts.
const root = path.join(__dirname, '..');
const DIVISIONS = ['single-family', 'multifamily', 'townhomes', 'commercial'];
const OLD_ROUTE = /["'`]\/(?:residential(?:[#?"'`]|$)|properties\/(?:single-family|multifamily|multi-family|duplexes|townhomes|townhouses|commercial|\$\{))/;

function walk(dir: string, out: string[] = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out); else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

test('each division has its own page and the catalog uses the canonical slugs', () => {
  assert.deepEqual(PROPERTY_CATEGORIES.map((c) => c.slug), DIVISIONS);
  for (const slug of DIVISIONS) assert.ok(existsSync(path.join(root, 'app', slug, 'page.tsx')), `missing app/${slug}/page.tsx`);
  assert.equal(existsSync(path.join(root, 'app', 'residential', 'page.tsx')), false, '/residential must only be a redirect');
});

test('no internal link points to a pre-division route', () => {
  const offenders: string[] = [];
  for (const dir of ['app', 'components', 'lib']) {
    for (const file of walk(path.join(root, dir))) {
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (OLD_ROUTE.test(line)) offenders.push(`${path.relative(root, file)}:${i + 1}`);
      });
    }
  }
  assert.deepEqual(offenders, []);
});

test('old URLs permanently redirect to the canonical division URL', async () => {
  assert.ok(nextConfig.redirects, 'next.config.ts must declare redirects');
  const rules = await nextConfig.redirects();
  const target = (source: string) => {
    for (const rule of rules) {
      const pattern = new RegExp('^' + rule.source.replace(/:slug\(([^)]+)\)/, '($1)') + '$');
      if (pattern.test(source)) { assert.equal(rule.permanent, true, `${source} must be a permanent redirect`); return rule.destination; }
    }
    return undefined;
  };
  assert.equal(target('/residential'), '/single-family');
  assert.equal(target('/properties/single-family'), '/single-family');
  assert.equal(target('/properties/duplexes'), '/multifamily');
  assert.equal(target('/properties/multifamily'), '/multifamily');
  assert.equal(target('/properties/townhouses'), '/townhomes');
  assert.equal(target('/properties/townhomes'), '/townhomes');
  assert.equal(target('/properties/commercial'), '/commercial');
  for (const slug of DIVISIONS) assert.equal(target(`/${slug}`), undefined, `/${slug} is canonical and must not redirect`);
  assert.equal(target('/properties'), undefined, 'the all-markets index stays');
});

test('the trade gallery has a photo for every trade in every division, each in the reference catalog', () => {
  const gallery = readFileSync(path.join(root, 'components', 'TradeGallery.tsx'), 'utf8');
  const sectors = [...gallery.matchAll(/\{ key: "([a-z-]+)", label:/g)].map((m) => m[1]);
  assert.deepEqual(sectors, ['residential', 'multifamily', 'townhomes', 'commercial']);
  const trades = [...gallery.matchAll(/slug: "([a-z]+)",\r?\n\s+name:/g)].map((m) => m[1]);
  assert.equal(trades.length, 8);
  const catalog: { src: string }[] = JSON.parse(readFileSync(path.join(root, 'lib', 'reference-image-catalog.json'), 'utf8'));
  for (const trade of trades) {
    for (const sector of sectors) {
      const src = `/work/${trade}_${sector}.jpg`;
      assert.ok(existsSync(path.join(root, 'public', src)), `missing ${src}`);
      assert.ok(catalog.some((image) => image.src === src), `${src} not in reference catalog`);
    }
  }
});
