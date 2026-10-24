import { withGuestRequestAudit } from '@/lib/review-request-audit';
import { requireActor } from '@/lib/auth';
import { handleViewerRequest, viewerFailure } from '@/lib/takeoff-viewer-gateway';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function dispatch(request: Request) {
  try { return await handleViewerRequest(request, await requireActor(request),()=>requireActor(request)); }
  catch (error) { return viewerFailure(error, request.method === 'HEAD'); }
}
export const GET = withGuestRequestAudit('viewer',dispatch);
export const HEAD = withGuestRequestAudit('viewer',dispatch);
export const POST = withGuestRequestAudit('viewer',dispatch);
export const PUT = withGuestRequestAudit('viewer',dispatch);
export const PATCH = withGuestRequestAudit('viewer',dispatch);
export const DELETE = withGuestRequestAudit('viewer',dispatch);
export const OPTIONS = withGuestRequestAudit('viewer',dispatch);
