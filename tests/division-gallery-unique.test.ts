import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getMarketSpecialtiesByCategory } from '../lib/property-catalog';
import { buildSpecialtyWalkthroughStops } from '../components/PropertyWalkthroughStudio';
import { getDivisionExtraSpecialtyFrames } from '../components/PropertyCategoryShowcase';

// HUB, 8-nov-2026: swiping through a gallery showed the same picture twice in a row. Two different
// file names can hold the same image (single-family Roofing: r4.jpg and res-farmhouse-metal.jpg), so
// this compares what the files contain, not their names. Each image appears once per gallery; none is
// deleted from the site (rule 9 is tests/division-photo-inventory.test.ts).
const publicDir = path.join(__dirname, '..', 'public');
const DIVISIONS = ['single-family', 'multifamily', 'townhomes', 'commercial'] as const;
const hashes = new Map<string, string>();
const contentOf = (src: string) => {
  if (!hashes.has(src)) hashes.set(src, createHash('sha256').update(readFileSync(path.join(publicDir, src))).digest('hex'));
  return hashes.get(src)!;
};

test('no gallery shows the same image twice, even under two file names', () => {
  const repeated: string[] = [];
  for (const slug of DIVISIONS) {
    const extras = getDivisionExtraSpecialtyFrames(slug);
    for (const service of getMarketSpecialtiesByCategory(slug)) {
      const seen = new Map<string, string>();
      for (const stop of buildSpecialtyWalkthroughStops(service, extras[service.specialtyId])) {
        const first = seen.get(contentOf(stop.src));
        if (first) repeated.push(`${slug} ${service.specialtyId}: ${stop.src} is the same image as ${first}`);
        else seen.set(contentOf(stop.src), stop.src);
      }
    }
  }
  assert.deepEqual(repeated, []);
});
