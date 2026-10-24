import { reviewInteractionReport,ReviewInteractionError } from '@/lib/review-interactions';
import { withGuestRequestAudit } from '@/lib/review-request-audit';
import { AuthError,requireActor,requireRole } from '@/lib/auth';
import { authFailure,authJson } from '@/lib/auth-http';
import { ReviewAuditError,reviewAuditReport } from '@/lib/review-audit';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function handleGET(request:Request){
 try{
  const actor=await requireActor(request);requireRole(actor,['admin']);
  const query=new URL(request.url).searchParams;
  if([...query.keys()].some(k=>k!=='reviewId')||query.getAll('reviewId').length>1)throw new AuthError('Choose a valid audit review.',422);
  const options={...(query.has('reviewId')?{reviewId:query.get('reviewId')!}:{})};
  return authJson({audit:reviewAuditReport(actor,options),interactions:reviewInteractionReport(actor,options)});
 }catch(error){return authFailure(error instanceof ReviewAuditError||error instanceof ReviewInteractionError?new AuthError(error.message,error.status):error);}
}

export const GET=withGuestRequestAudit('activity',handleGET);
