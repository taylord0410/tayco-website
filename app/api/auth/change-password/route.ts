import {withGuestRequestAudit} from '@/lib/review-request-audit';
import { assertSameOrigin, changePassword, requireActor, sessionCookie } from '@/lib/auth';
import { authFailure, authJson, readAuthBody } from '@/lib/auth-http';
export const runtime = 'nodejs';
async function handlePOST(request: Request) { try { assertSameOrigin(request); const actor = await requireActor(request); const body = await readAuthBody(request); await changePassword(actor, body.currentPassword, body.newPassword); const response = authJson({ success: true }); response.headers.set('Set-Cookie', sessionCookie('', true)); return response; } catch (error) { return authFailure(error); } }

export const POST=withGuestRequestAudit('authentication',handlePOST);
