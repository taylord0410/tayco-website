import catalog from './reference-image-catalog.json';

export type ReferenceImage = { id: string; src: string; title: string };
export const MAX_REFERENCE_IMAGES = 12;
export const REFERENCE_STORAGE_KEY = 'tayco.project-references.v1';
const byId = new Map(catalog.map(image => [image.id, image]));
const bySource = new Map(catalog.map(image => [image.src, image]));

export function referenceForSource(src: string): ReferenceImage | undefined {
  return bySource.get(src.split('?')[0]);
}

/** Resolve only catalog IDs; never accept a client-provided URL or caption. */
export function resolveReferenceImages(value: unknown): ReferenceImage[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_REFERENCE_IMAGES) {
    throw new Error(`Choose up to ${MAX_REFERENCE_IMAGES} reference images.`);
  }
  const unique = new Set<string>();
  const images: ReferenceImage[] = [];
  for (const id of value) {
    if (typeof id !== 'string' || !byId.has(id)) throw new Error('One of your reference images is unavailable. Please review your selection.');
    if (!unique.has(id)) { unique.add(id); images.push(byId.get(id)!); }
  }
  return images;
}

export function referencesFromPayload(payload: Record<string, unknown>): ReferenceImage[] {
  try { return resolveReferenceImages(payload.referenceImageIds); } catch { return []; }
}

export function restoreReferenceDraft(raw: string | null): ReferenceImage[] {
  try {
    const ids: unknown = JSON.parse(raw || '[]');
    if (!Array.isArray(ids)) return [];
    return resolveReferenceImages(ids.filter(id => typeof id === 'string' && byId.has(id)).slice(0, MAX_REFERENCE_IMAGES));
  } catch { return []; }
}
