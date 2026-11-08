import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { PROPERTY_LISTINGS, getMarketSpecialtiesByCategory } from '../lib/property-catalog';
import { getMarqueeTracksForSiteDivision, getTransformationPairsForSiteDivision } from '../components/LandingLivingShowcase';
import { WALKTHROUGH_ROOMS_BY_PROJECT_ID } from '../components/PropertyWalkthroughStudio';
import { getDivisionExtraSpecialtyFrames } from '../components/PropertyCategoryShowcase';

// HUB, 8-nov-2026: a division page shows only photos of its own division. The Trade Gallery put a
// four-story apartment building and commercial steel studs on /single-family.
const root = path.join(__dirname, '..');
const DIVISIONS = ['single-family', 'multifamily', 'townhomes', 'commercial'] as const;

function reachableFiles(entry: string): Set<string> {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const m of readFileSync(file, 'utf8').matchAll(/(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g)) {
      const spec = m[1];
      const base = spec.startsWith('@/') ? path.join(root, spec.slice(2)) : spec.startsWith('.') ? path.resolve(path.dirname(file), spec) : undefined;
      if (!base) continue;
      const hit = [`${base}.tsx`, `${base}.ts`, base].find((c) => existsSync(c) && statSync(c).isFile() && /\.tsx?$/.test(c));
      if (hit) queue.push(hit);
    }
  }
  return seen;
}

test('the division pages do not include the all-divisions Trade Gallery', () => {
  const gallery = path.join(root, 'components', 'TradeGallery.tsx');
  const offenders = DIVISIONS.filter((slug) => reachableFiles(path.join(root, 'app', slug, 'page.tsx')).has(gallery));
  assert.deepEqual(offenders, [], 'its trades are already in the specialty grid, and it mixes photos of every division');
});

test('no division page draws a photo that belongs to another division', () => {
  // A photo belongs to the divisions whose projects or specialties use it.
  const owners = new Map<string, Set<string>>();
  const own = (src: string, slug: string) => owners.set(src, (owners.get(src) ?? new Set()).add(slug));
  for (const listing of PROPERTY_LISTINGS) {
    for (const frame of listing.triptych) own(frame.src, listing.category);
    for (const room of Object.values(WALKTHROUGH_ROOMS_BY_PROJECT_ID[listing.id] ?? {})) if (room?.src) own(room.src, listing.category);
  }
  for (const slug of DIVISIONS) for (const service of getMarketSpecialtiesByCategory(slug)) for (const frame of service.triptych) own(frame.src, slug);

  const foreign: string[] = [];
  for (const slug of DIVISIONS) {
    const drawn: [string, string][] = [];
    for (const service of getMarketSpecialtiesByCategory(slug)) for (const frame of service.triptych) drawn.push([frame.src, `specialty ${service.specialtyId}`]);
    for (const [specialty, frames] of Object.entries(getDivisionExtraSpecialtyFrames(slug))) for (const frame of frames) drawn.push([frame.src, `${specialty} gallery`]);
    for (const pair of getTransformationPairsForSiteDivision(slug)) drawn.push([pair.beforeImg, `before/after ${pair.id}`], [pair.afterImg, `before/after ${pair.id}`]);
    for (const shot of getMarqueeTracksForSiteDivision(slug).allShots) drawn.push([shot.image, `field gallery ${shot.id}`]);
    for (const [src, where] of drawn) {
      const of = owners.get(src);
      if (of && !of.has(slug)) foreign.push(`${slug} ${where}: ${src} is ${[...of].join(', ')}`);
    }
  }
  assert.deepEqual(foreign, []);
});
