import { requireActor } from '@/lib/auth';
import { handleViewerRequest, viewerFailure } from '@/lib/takeoff-viewer-gateway';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function dispatch(request: Request) {
  try { return await handleViewerRequest(request, await requireActor(request)); }
  catch (error) { return viewerFailure(error, request.method === 'HEAD'); }
}
export const GET = dispatch;
export const HEAD = dispatch;
export const POST = dispatch;
export const PUT = dispatch;
export const PATCH = dispatch;
export const DELETE = dispatch;
export const OPTIONS = dispatch;
