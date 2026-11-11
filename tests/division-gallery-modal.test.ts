import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMarketSpecialtiesByCategory } from '../lib/property-catalog';
import { buildSpecialtyWalkthroughStops } from '../components/PropertyWalkthroughStudio';
import { getDivisionExtraSpecialtyFrames } from '../components/PropertyCategoryShowcase';
import {
  buildOrderedSpecialtyFrames,
  resolvePhotoConstructionStage,
  resolveSpecialtyNightPair,
  selectSpecialtyCardPreviews,
  STAGE_BADGE_LABELS,
  type SpecialtyConstructionStage,
} from '../lib/photo-specialty';

// Randhy, 8-nov-2026: each specialty card shows one row of 3 thumbnails; the rest of its photos live
// only in the «View Gallery» modal. The modal is drawn in the browser, so the HTML checks never see
// it: this test reads the stops the modal is built from.
const DIVISIONS = {
  'single-family': /\bsingle[\s-]?family\b|\bSFH\b/i,
  multifamily: /\bmulti[\s-]?family\b|\bmulti[\s-]?unit\b|\bmulti[\s-]?stor(?:e?y|ies)\b/i,
  townhomes: /\btown[\s-]?(?:home|house)s?\b|\brow[\s-]?(?:home|house)s?\b|\b(?:row|attached)[\s-]?residen(?:ce|ces|tial)\b/i,
  commercial: /\bcommercial\b/i,
} as const;
// Rule 4: no codes or counts — «CSI DIV 07», «SFH-ROOF», «(02)», «OF 05».
const TECHNICAL = /\bCSI\b|\bDIV\s*\d|\b[A-Z]{2,4}-[A-Z]{3,5}\b|\(\s*\d+\s*\)|\bOF\s+\d+\b/;

const STAGE_WEIGHT: Record<SpecialtyConstructionStage, number> = {
  preparation: 0,
  installation: 1,
  finished: 2,
};

test('the gallery modal of every specialty card holds all of its photos', () => {
  const missing: string[] = [];
  for (const slug of Object.keys(DIVISIONS)) {
    const extras = getDivisionExtraSpecialtyFrames(slug as keyof typeof DIVISIONS);
    for (const service of getMarketSpecialtiesByCategory(slug)) {
      const shown = new Set(buildSpecialtyWalkthroughStops(service, extras[service.specialtyId]).map((stop) => stop.src));
      for (const frame of [...service.triptych, ...(extras[service.specialtyId] ?? [])]) {
        if (!shown.has(frame.src)) missing.push(`${slug} ${service.specialtyId}: ${frame.src}`);
      }
    }
  }
  assert.deepEqual(missing, [], 'a photo taken off the card must still be in its «View Gallery»');
});

test('the gallery modal text has no division name, codes or counts', () => {
  const noisy: string[] = [];
  for (const [slug, division] of Object.entries(DIVISIONS)) {
    const extras = getDivisionExtraSpecialtyFrames(slug as keyof typeof DIVISIONS);
    for (const service of getMarketSpecialtiesByCategory(slug)) {
      for (const stop of buildSpecialtyWalkthroughStops(service, extras[service.specialtyId])) {
        const fields = { zoneLabel: stop.zoneLabel, floorLevel: stop.floorLevel, title: stop.title, shortRoomName: stop.shortRoomName, portalButtonLabel: stop.portalButtonLabel, spatialNarrative: stop.spatialNarrative };
        for (const [field, value] of Object.entries(fields)) {
          if (division.test(value) || TECHNICAL.test(value)) noisy.push(`${slug} ${service.specialtyId} ${field}: ${value}`);
        }
      }
    }
  }
  // One line per distinct text, so the list reads as a to-do list.
  assert.deepEqual([...new Set(noisy)], []);
});

test('every specialty gallery progresses monotonically by stage without backwards regression and maps card previews to global modal index', () => {
  const regressions: string[] = [];
  for (const slug of Object.keys(DIVISIONS)) {
    const extras = getDivisionExtraSpecialtyFrames(slug as keyof typeof DIVISIONS);
    for (const service of getMarketSpecialtiesByCategory(slug)) {
      const ordered = buildOrderedSpecialtyFrames(service.triptych, extras[service.specialtyId]);
      for (let i = 1; i < ordered.length; i++) {
        const prev = STAGE_WEIGHT[ordered[i - 1].stage];
        const curr = STAGE_WEIGHT[ordered[i].stage];
        if (curr < prev) {
          regressions.push(
            `${slug} ${service.specialtyId}: stage regressed at index ${i} (${ordered[i - 1].stage} -> ${ordered[i].stage})`
          );
        }
      }
      const previews = selectSpecialtyCardPreviews(ordered);
      assert.equal(previews.length, 3, `${slug} ${service.specialtyId} should have 3 card preview frames`);
      assert.deepEqual(
        previews.map((p) => p.stage),
        ['preparation', 'installation', 'finished'],
        `${slug} ${service.specialtyId} card previews must represent [preparation, installation, finished]`
      );
      for (const p of previews) {
        const globalIdx = ordered.findIndex((f) => f.src === p.src);
        assert.ok(globalIdx >= 0, `${slug} ${service.specialtyId} preview ${p.src} must exist in global modal list`);
      }
    }
  }
  assert.deepEqual(regressions, []);

  // Explicit 2-preparation counterexample check (Atlas12 review):
  const sample = buildOrderedSpecialtyFrames(
    [
      { src: '/curated/residential/s1.jpg', label: 'Finished Siding' },
    ],
    [
      { src: '/curated/obra/single-family/sf-roofing-tearoff.jpg', label: 'Prep 1' },
      { src: '/curated/capabilities/reo-siding-wrap.jpg', label: 'Prep 2' },
      { src: '/curated/obra/single-family/sf-siding-installation.jpg', label: 'Install 1' },
    ]
  );
  assert.deepEqual(
    sample.map((f) => f.stage),
    ['preparation', 'preparation', 'installation', 'finished']
  );
  const samplePreviews = selectSpecialtyCardPreviews(sample);
  assert.deepEqual(
    samplePreviews.map((f) => f.stage),
    ['preparation', 'installation', 'finished']
  );
});

test('full-path night registry resolves approved pairs, rejects cross-folder basename collisions and withholds unapproved filter pairs', () => {
  // 1. Valid registered full-path pair (including extraFrames com_02_2 / com_04_2)
  const extraCom02 = resolveSpecialtyNightPair('/curated/commercial/com_02_2.jpg');
  assert.equal(extraCom02.hasNightVariant, true);
  assert.equal(extraCom02.nightSrc, '/curated/properties/com_02_2-night.jpg');
  assert.equal(extraCom02.nightReview, 'approved');

  const extraCom04 = resolveSpecialtyNightPair('/curated/commercial/com_04_2.jpg');
  assert.equal(extraCom04.hasNightVariant, true);
  assert.equal(extraCom04.nightSrc, '/curated/properties/com_04_2-night.jpg');

  // 2. Same basename from a different folder never borrows a night variant
  const collisionAttempt = resolveSpecialtyNightPair('/curated/obra/single-family/s1.jpg');
  assert.equal(collisionAttempt.hasNightVariant, false);
  assert.equal(collisionAttempt.nightSrc, '/curated/obra/single-family/s1.jpg');
  assert.equal(collisionAttempt.nightReview, 'unavailable');

  // 3. Missing pair returns honest day-only state
  const missingPair = resolveSpecialtyNightPair('/curated/obra/single-family/sf-roofing-tearoff.jpg');
  assert.equal(missingPair.hasNightVariant, false);
  assert.equal(missingPair.nightSrc, '/curated/obra/single-family/sf-roofing-tearoff.jpg');
  assert.equal(missingPair.nightReview, 'unavailable');

  // 4. Filter-darkened review-queued assets are withheld from Night mode until replaced
  const reviewHouse = resolveSpecialtyNightPair('/curated/residential/r1.jpg');
  assert.equal(reviewHouse.hasNightVariant, false);
  assert.equal(reviewHouse.nightReview, 'review');

  const approvedKitchen = resolveSpecialtyNightPair('/curated/hero/res-navy-kitchen.jpg');
  assert.equal(approvedKitchen.hasNightVariant, true);
  assert.equal(approvedKitchen.nightReview, 'approved');

  const approvedRoof = resolveSpecialtyNightPair('/curated/hero/res-estate-roofing.jpg');
  assert.equal(approvedRoof.hasNightVariant, true);
  assert.equal(approvedRoof.nightReview, 'approved');

  // 5. All 32 Single-Family, Multifamily, Townhomes & Commercial specialties select 3 coherent same-building stages (identical sequenceId) with approved night variants
  for (const completedSlug of ['single-family', 'multifamily', 'townhomes', 'commercial'] as const) {
    const divExtras = getDivisionExtraSpecialtyFrames(completedSlug);
    const divSpecs = getMarketSpecialtiesByCategory(completedSlug);
    assert.equal(divSpecs.length, 8);
    for (const spec of divSpecs) {
      const previews = selectSpecialtyCardPreviews(
        buildOrderedSpecialtyFrames(spec.triptych, divExtras[spec.specialtyId])
      );
      assert.equal(previews.length, 3, `${completedSlug} ${spec.specialtyId} must have 3 previews`);
      assert.ok(previews[0].sequenceId, `${completedSlug} ${spec.specialtyId} Stage 1 must have a sequenceId`);
      assert.deepEqual(
        previews.map((p) => p.sequenceId),
        [previews[0].sequenceId, previews[0].sequenceId, previews[0].sequenceId],
        `${completedSlug} ${spec.specialtyId} previews must share one sequenceId`
      );
      assert.deepEqual(
        previews.map((p) => p.stage),
        ['preparation', 'installation', 'finished'],
        `${completedSlug} ${spec.specialtyId} previews must cover all 3 stages`
      );
      assert.deepEqual(
        previews.map((p) => p.hasNightVariant),
        [true, true, true],
        `${completedSlug} ${spec.specialtyId} previews must all have approved night variants`
      );
    }
  }

  // 6. Every modal stop carries its stage enum and stageBadge
  for (const slug of Object.keys(DIVISIONS)) {
    const extras = getDivisionExtraSpecialtyFrames(slug as keyof typeof DIVISIONS);
    for (const service of getMarketSpecialtiesByCategory(slug)) {
      const stops = buildSpecialtyWalkthroughStops(service, extras[service.specialtyId]);
      for (const stop of stops) {
        assert.ok(stop.stage, `${slug} ${service.specialtyId} ${stop.src} missing stage`);
        assert.equal(stop.stageBadge, STAGE_BADGE_LABELS[stop.stage]);
      }
    }
  }
});

