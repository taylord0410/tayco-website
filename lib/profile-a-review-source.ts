import { closeSync, fstatSync, lstatSync, openSync, readSync } from 'node:fs';
import type { Actor } from './auth';
import { viewerScope, TakeoffViewerAccessError } from './takeoff-viewer-access';
import { assertProfileAAdministrator, buildProfileAReview, ProfileAReviewError, type ReviewDocumentLink } from './profile-a-review';

/** Fixed deployment configuration, never a request-supplied path. */
export function profileAReviewSource(actor: Actor) {
  assertProfileAAdministrator(actor);
  const filename = process.env.TAYCO_PROFILE_A_REVIEW_SOURCE;
  const expectedSha256 = process.env.TAYCO_PROFILE_A_REVIEW_SHA256;
  if (!filename || !expectedSha256) throw new ProfileAReviewError(503, 'The review source is not configured.');
  let descriptor: number | undefined;
  let bytes: Buffer;
  try {
    if (lstatSync(filename).isSymbolicLink()) throw new Error('invalid source');
    descriptor = openSync(filename, 'r'); const before = fstatSync(descriptor);
    if (!before.isFile() || before.size < 1 || before.size > 1024 * 1024) throw new Error('invalid size');
    bytes = Buffer.alloc(before.size + 1);
    let offset = 0;
    while (offset < bytes.length) { const count = readSync(descriptor, bytes, offset, bytes.length - offset, offset); if (!count) break; offset += count; }
    if (offset !== before.size || fstatSync(descriptor).size !== before.size) throw new Error('changed source');
    bytes = bytes.subarray(0, offset);
  } catch { throw new ProfileAReviewError(503, 'The review source is not available.'); }
  finally { if (descriptor !== undefined) closeSync(descriptor); }
  const links: ReviewDocumentLink[] = [];
  try {
    const scope = viewerScope(actor);
    // Use the source pins already intersected with current ERP delivery. A second
    // snapshot could mix newly staged rows with a previously authorized scope.
    for (const document of scope.documents)
      links.push({ sha256: document.sourceSha256, contextKey: document.contextKey, viewerDocumentId: document.id });
  } catch (error) { if (!(error instanceof TakeoffViewerAccessError)) throw error; }
  return buildProfileAReview(actor, bytes, expectedSha256, links);
}
