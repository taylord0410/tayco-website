import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { PROPERTY_LISTINGS } from '../lib/property-catalog';
import { resolveNightImageSrc } from '../components/PropertyWalkthroughStudio';

// Taylord, 7-nov-2026, rule 9 of the division redesign: no project or photo is removed, they are
// only reorganized. The fixture is the baseline taken from main a6efbc1; a photo counts as kept when
// some file the division pages import still references it (night photos follow their day photo).
const root = path.join(__dirname, '..');
const inventory = JSON.parse(readFileSync(path.join(__dirname, 'fixtures', 'division-photo-inventory.json'), 'utf8')) as {
  photos: string[];
  projects: { id: string; code: string; category: string }[];
};
const DIVISIONS = ['single-family', 'multifamily', 'townhomes', 'commercial'];
const IMPORT = /(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g;
const IMG = /["'`](\/[A-Za-z0-9_./-]+\.(?:jpe?g|png|webp|avif))["'`]/g;

function resolveImport(spec: string, fromFile: string): string | undefined {
  let base: string;
  if (spec.startsWith('@/')) base = path.join(root, spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec);
  else return undefined;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return undefined;
}

function photosReachableFrom(entries: string[]): Set<string> {
  const seen = new Set<string>();
  const photos = new Set<string>();
  const queue = [...entries];
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = readFileSync(file, 'utf8');
    for (const m of source.matchAll(IMG)) photos.add(m[1]);
    for (const m of source.matchAll(IMPORT)) {
      const next = resolveImport(m[1], file);
      if (next && /\.(ts|tsx)$/.test(next)) queue.push(next);
    }
  }
  for (const photo of [...photos]) if (/\.jpe?g$/i.test(photo)) photos.add(resolveNightImageSrc(photo));
  return photos;
}

const reachable = photosReachableFrom(DIVISIONS.map((slug) => path.join(root, 'app', slug, 'page.tsx')));

test('every photo the division pages showed before the redesign is still on them and still on disk', () => {
  const lost = inventory.photos.filter((photo) => !reachable.has(photo));
  const deleted = inventory.photos.filter((photo) => !existsSync(path.join(root, 'public', photo)));
  assert.deepEqual(lost, [], 'photos no longer referenced by any division page (move them, do not drop them)');
  assert.deepEqual(deleted, [], 'photos deleted from public/');
});

// A reference is not the same as a photo on screen: an array kept "for the inventory" whose filtered
// copy nobody renders still names its photos (8-nov: 36 photos left that way). On main the division
// components had no unused variables, so any unused one now is a hidden section, not noise.
test('the division components render what they compute (no unused variables hiding photos)', async () => {
  const { ESLint } = await import('eslint');
  const eslint = new ESLint({ cwd: root });
  const results = await eslint.lintFiles(['components/division/*.tsx']);
  const unused = results.flatMap((result) =>
    result.messages
      .filter((message) => message.ruleId === '@typescript-eslint/no-unused-vars')
      .map((message) => `${path.relative(root, result.filePath).split(path.sep).join('/')}:${message.line} ${message.message}`),
  );
  assert.deepEqual(unused, [], 'render it or move its photos where they are rendered; do not keep it only for the inventory');
});

test('every project in the catalog keeps its id and its division', () => {
  const current = new Map(PROPERTY_LISTINGS.map((listing) => [listing.id, listing.category as string]));
  const lost = inventory.projects.filter((project) => current.get(project.id) !== project.category);
  assert.deepEqual(lost, [], 'projects removed from the catalog or moved to another division');
});
