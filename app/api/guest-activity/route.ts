import { recordReviewInteraction,ReviewInteractionError } from '@/lib/review-interactions';
import { withGuestRequestAudit } from '@/lib/review-request-audit';
import { AuthError, assertSameOrigin, requireActor, requireRole } from '@/lib/auth';
import { authFailure, authJson, readAuthBody } from '@/lib/auth-http';
import { GuestActivityError, guestActivityReport, recordGuestActivity } from '@/lib/guest-activity';

import { GuestPrivacyError } from '@/lib/guest-privacy';

export const runtime = 'nodejs';
function failure(error: unknown) { return authFailure(error instanceof GuestActivityError || error instanceof GuestPrivacyError || error instanceof ReviewInteractionError ? new AuthError(error.message, error.status) : error); }

async function handlePOST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireActor(request);
    requireRole(actor, ['guest']);
    const body = await readAuthBody(request);
    const fresh=await requireActor(request);requireRole(fresh,['guest']);
    if(fresh.id!==actor.id||fresh.tenantId!==actor.tenantId||fresh.review?.id!==actor.review?.id)throw new AuthError('Review access changed.',403);
    return authJson({ success: true, ...(Object.hasOwn(body,'taxonomyVersion')?recordReviewInteraction(fresh,body):recordGuestActivity(fresh, body)) });
  } catch (error) { return failure(error); }
}

async function handleGET(request: Request) {
  try {
    const actor = await requireActor(request);
    requireRole(actor, ['admin']);
    return authJson({ success: true, ...guestActivityReport(actor) });
  } catch (error) { return failure(error); }
}

export const GET=withGuestRequestAudit('activity',handleGET);

export const POST=withGuestRequestAudit('activity',handlePOST);
