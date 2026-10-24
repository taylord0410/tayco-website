import { withGuestRequestAudit } from '@/lib/review-request-audit';
import { assertSameOrigin, requireActor, requireRole, rateLimit, AuthError } from '@/lib/auth';
import { authFailure, authJson, readAuthBody } from '@/lib/auth-http';
import { guestPrivacy, saveGuestPrivacy, GuestPrivacyError } from '@/lib/guest-privacy';
export const runtime='nodejs';
function failure(error:unknown){return authFailure(error instanceof GuestPrivacyError?new AuthError(error.message,error.status):error);}
async function handleGET(request:Request){
  try { const actor=await requireActor(request);requireRole(actor,['guest']);return authJson({privacy:guestPrivacy(actor)}); }
  catch(error){return failure(error);}
}
async function handlePOST(request:Request){
  try { assertSameOrigin(request);const actor=await requireActor(request);requireRole(actor,['guest']);const body=await readAuthBody(request);if(body.optionalAnalytics!==false)rateLimit('privacy:'+actor.id,30,60_000);const fresh=await requireActor(request);requireRole(fresh,['guest']);return authJson({privacy:saveGuestPrivacy(fresh,body)}); }
  catch(error){return failure(error);}
}

export const GET=withGuestRequestAudit('privacy',handleGET);

export const POST=withGuestRequestAudit('privacy',handlePOST);
