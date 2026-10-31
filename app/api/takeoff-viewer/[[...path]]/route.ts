import { withGuestRequestAudit, noteReviewAuditResource } from '@/lib/review-request-audit';
import { requireActor } from '@/lib/auth';
import { handleViewerRequest, viewerFailure } from '@/lib/takeoff-viewer-gateway';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function dispatch(request: Request) {
  try {
    const reqUrl = new URL(request.url);
    const proj = reqUrl.searchParams.get('project');
    const doc = reqUrl.searchParams.get('document');
    if (proj || doc) {
      noteReviewAuditResource(doc ? 'document' : 'project', doc ? `${proj ?? 'proj'}_${doc}` : String(proj), {
        eventType: doc ? 'viewer.document' : 'viewer.open',
        targetId: doc ? `${proj ?? 'project'}/${doc}` : String(proj),
        detail: reqUrl.pathname,
      });
    } else if (/^\/(?:api\/)?takeoff-viewer\/?$/i.test(reqUrl.pathname)) {
      noteReviewAuditResource('module', 'takeoff_viewer_index', {
        eventType: 'viewer.open',
        targetId: 'viewer:index',
      });
    }
    return await handleViewerRequest(request, await requireActor(request),()=>requireActor(request));
  }
  catch (error) { return viewerFailure(error, request.method === 'HEAD'); }
}
export const GET = withGuestRequestAudit('viewer',dispatch);
export const HEAD = withGuestRequestAudit('viewer',dispatch);
export const POST = withGuestRequestAudit('viewer',dispatch);
export const PUT = withGuestRequestAudit('viewer',dispatch);
export const PATCH = withGuestRequestAudit('viewer',dispatch);
export const DELETE = withGuestRequestAudit('viewer',dispatch);
export const OPTIONS = withGuestRequestAudit('viewer',dispatch);
