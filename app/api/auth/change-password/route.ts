import { assertSameOrigin, changePassword, requireActor, sessionCookie } from '@/lib/auth';
import { authFailure, authJson, readAuthBody } from '@/lib/auth-http';
export const runtime = 'nodejs';
export async function POST(request: Request) { try { assertSameOrigin(request); const actor = await requireActor(request); const body = await readAuthBody(request); await changePassword(actor, body.currentPassword, body.newPassword); const response = authJson({ success: true }); response.headers.set('Set-Cookie', sessionCookie('', true)); return response; } catch (error) { return authFailure(error); } }
