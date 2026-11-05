import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { isStreamOnlyPortfolioAsset } from '../lib/site-shield';

// The site shield blocks /_next/image (the Next.js optimizer) with 403, so any <Image> that uses the optimizer
// renders as a broken image. Every <Image> must opt out with `unoptimized` and load the file directly.
function walk(dir: string, out: string[] = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out); else if (/\.tsx$/.test(entry.name)) out.push(full);
  }
  return out;
}

test('the shield blocks the Next image optimizer, so every next/image tag must be unoptimized', () => {
  assert.equal(isStreamOnlyPortfolioAsset('/_next/image'), true);
  const root = path.join(__dirname, '..');
  const offenders: string[] = [];
  for (const dir of ['app', 'components']) for (const file of walk(path.join(root, dir))) {
    const text = readFileSync(file, 'utf8');
    if (!/from\s+["']next\/image["']/.test(text)) continue;
    for (const match of text.matchAll(/<Image\b[^>]*?(?:\/>|>)/g)) if (!/\bunoptimized\b/.test(match[0])) offenders.push(path.relative(root, file));
  }
  assert.deepEqual(offenders, []);
});
