import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMarketSpecialtiesByCategory } from '../lib/property-catalog';
import { buildSpecialtyWalkthroughStops } from '../components/PropertyWalkthroughStudio';
import { getDivisionExtraSpecialtyFrames } from '../components/PropertyCategoryShowcase';

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
