import { withGuestRequestAudit } from '@/lib/review-request-audit';
import { requireActor } from '@/lib/auth';
import { handleViewerRequest, viewerFailure, VIEWER_BRIDGE_HEADER, viewerBridgeSignature } from '@/lib/takeoff-viewer-gateway';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function dispatch(request: Request) {
  try {
    const bridgeSig = request.headers.get(VIEWER_BRIDGE_HEADER);
    const localUpstream = process.env.TAYCO_TAKEOFF_VIEWER_INTERNAL_URL || process.env.TAKEOFF_VIEWER_UPSTREAM || (!process.env.RAILWAY_ENVIRONMENT ? 'http://127.0.0.1:3023' : undefined);
    if (bridgeSig && localUpstream && /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\/?$/i.test(localUpstream)) {
      const url = new URL(request.url);
      if (bridgeSig === viewerBridgeSignature(url.pathname, url.search)) {
        const fwdHeaders = new Headers({ 'Accept-Encoding': 'identity' });
        for (const name of ['Range', 'If-Range', 'If-None-Match', 'If-Modified-Since']) {
          const val = request.headers.get(name);
          if (val) fwdHeaders.set(name, val);
        }
        const upstreamRes = await fetch(new URL(localUpstream).origin + url.pathname + url.search, {
          method: request.method,
          headers: fwdHeaders,
          redirect: 'manual',
          cache: 'no-store',
        });
        return new Response(request.method === 'HEAD' ? null : upstreamRes.body, {
          status: upstreamRes.status,
          headers: upstreamRes.headers,
        });
      }
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
