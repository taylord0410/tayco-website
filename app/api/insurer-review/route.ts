import {requireActor,AuthError} from '@/lib/auth';
import {authJson,authFailure} from '@/lib/auth-http';
import {withGuestRequestAudit} from '@/lib/review-request-audit';
import {insurerReviewData} from '@/lib/insurer-review';
import {InsurerReviewError} from '@/lib/insurer-review-policy';
import {TakeoffViewerAccessError} from '@/lib/takeoff-viewer-access';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function handleGET(request:Request){
 try{
  const actor=await requireActor(request);
  if(new URL(request.url).search)throw new AuthError('Choose the configured recipient review.',422);
  return authJson({review:insurerReviewData(actor)});
 }catch(error){return authFailure(error instanceof InsurerReviewError||error instanceof TakeoffViewerAccessError?new AuthError('This recipient review is unavailable.',error.status):error);}
}
export const GET=withGuestRequestAudit('portal',handleGET);
