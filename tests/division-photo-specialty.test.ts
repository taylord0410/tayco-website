import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PHOTO_SPECIALTY } from '../lib/photo-specialty';
import { getDivisionExtraSpecialtyFrames } from '../components/PropertyCategoryShowcase';

// HUB, 8-nov-2026, after the service photos moved into the single specialty grid: each photo goes to
// the specialty of what it shows, decided photo by photo in lib/photo-specialty.ts. Deriving it from
// the service name put fire, water and storm photos inside Masonry (Restoration → «Painting» → stone).
const DIVISIONS = ['single-family', 'multifamily', 'townhomes', 'commercial'] as const;

test('every extra photo in a specialty gallery is there because the photo map says so', () => {
  const wrong: string[] = [];
  for (const slug of DIVISIONS) {
    for (const [specialty, frames] of Object.entries(getDivisionExtraSpecialtyFrames(slug))) {
      for (const frame of frames) {
        const mapped = PHOTO_SPECIALTY[frame.src];
        if (mapped !== specialty) wrong.push(`${slug} ${specialty}: ${frame.src} (map says ${mapped ?? 'nothing'})`);
      }
    }
  }
  assert.deepEqual(wrong, [], 'add the photo to lib/photo-specialty.ts with the specialty of what it shows');
});

test('the photos the HUB assigned by hand stay where she put them', () => {
  const decided: Record<string, string> = {
    // Commercial restoration
    '/curated/capabilities/fire-steel-ibeam.jpg': 'framing',
    '/curated/pairs/div04_03_antes.jpg': 'roofing',
    '/curated/commercial/com-water-mitigation-office.jpg': 'drywall',
    // Commercial site preparation
    '/curated/magazine/revista_ex_sp_demo.jpg': 'concrete',
    '/curated/magazine/revista_ex_ex_mass.jpg': 'concrete',
    '/curated/magazine/revista_ex_ex_found.jpg': 'concrete',
    // Commercial property programs
    '/curated/commercial/com-office-park-exterior-program.jpg': 'siding',
    '/curated/commercial/com-retail-strip-envelope-rehab.jpg': 'siding',
    '/curated/commercial/com-office-corridor-turnover.jpg': 'drywall',
    // Single-family restoration
    '/curated/capabilities/fire-wood-framing.jpg': 'framing',
    '/curated/residential/sf-drywall-water-repair-bedroom.jpg': 'drywall',
    '/curated/residential/div04_06_despues.jpg': 'roofing',
    // Single-family renovation
    '/curated/residential/sf-finished-basement-lounge.jpg': 'flooring',
    '/curated/residential/div03_03_despues.jpg': 'flooring',
    '/curated/residential/div01_08_despues.jpg': 'carpentry',
  };
  const moved = Object.entries(decided)
    .filter(([src, specialty]) => PHOTO_SPECIALTY[src] !== specialty)
    .map(([src, specialty]) => `${src}: ${PHOTO_SPECIALTY[src] ?? 'missing'} instead of ${specialty}`);
  assert.deepEqual(moved, []);
});
