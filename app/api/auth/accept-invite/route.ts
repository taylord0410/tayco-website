import { acceptInvitation, assertSameOrigin, sessionCookie } from '@/lib/auth';
import { authFailure, authJson, readAuthBody } from '@/lib/auth-http';
export const runtime = 'nodejs';
export async function POST(request: Request) { try { assertSameOrigin(request); const body = await readAuthBody(request); const result = await acceptInvitation(body.token, body.email, body.password); const response = authJson({ success: true }); response.headers.set('Set-Cookie', sessionCookie(result.cookie)); return response; } catch (error) { return authFailure(error); } }
