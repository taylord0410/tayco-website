import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getMarketSpecialtiesByCategory, type MarketSpecialtyId } from '../lib/property-catalog';
import { buildSpecialtyWalkthroughStops } from '../components/PropertyWalkthroughStudio';
import { getDivisionExtraSpecialtyFrames } from '../components/PropertyCategoryShowcase';

// Randhy, 8-nov-2026: every service gallery shows work in progress, not only finished jobs, with no
// people, text or brands. 39 new photos (≥2 in-progress photos per service and division) were made with
// Vertex and reviewed one by one by ARTEMIS, the HUB and PRAXIS-MAAT. The fixture says where each one
// goes; this test checks that the gallery the viewer builds actually holds it, with its short title.
const mapa = JSON.parse(readFileSync(path.join(__dirname, 'fixtures', 'obra-fotos-mapa.json'), 'utf8')) as {
  nuevas: { division: 'single-family' | 'multifamily' | 'townhomes' | 'commercial'; specialtyId: MarketSpecialtyId; ruta: string; titulo: string }[];
};

test('every new work-in-progress photo is in the gallery of its division and service', () => {
  const missing: string[] = [];
  for (const foto of mapa.nuevas) {
    const service = getMarketSpecialtiesByCategory(foto.division).find((s) => s.specialtyId === foto.specialtyId);
    if (!service) { missing.push(`${foto.division} ${foto.specialtyId}: no such service`); continue; }
    const extras = getDivisionExtraSpecialtyFrames(foto.division)[foto.specialtyId];
    const stop = buildSpecialtyWalkthroughStops(service, extras).find((s) => s.src === foto.ruta);
    if (!stop) missing.push(`${foto.division} ${foto.specialtyId}: ${foto.ruta}`);
  }
  assert.deepEqual(missing, [], 'add the photo to that service gallery (and to lib/photo-specialty.ts)');
});

test('each new photo keeps the short title it was approved with', () => {
  const wrong: string[] = [];
  for (const foto of mapa.nuevas) {
    const service = getMarketSpecialtiesByCategory(foto.division).find((s) => s.specialtyId === foto.specialtyId);
    if (!service) continue;
    const extras = getDivisionExtraSpecialtyFrames(foto.division)[foto.specialtyId];
    const stop = buildSpecialtyWalkthroughStops(service, extras).find((s) => s.src === foto.ruta);
    if (stop && !`${stop.title} ${stop.shortRoomName}`.includes(foto.titulo)) wrong.push(`${foto.ruta}: «${stop.title}» should read «${foto.titulo}»`);
  }
  assert.deepEqual(wrong, []);
});
