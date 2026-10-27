import { assertSameOrigin, sessionCookie, signIn } from '@/lib/auth';
import { authFailure, authJson, readAuthBody,publicAuthActor } from '@/lib/auth-http';
import { recordGuestServerEvent } from '@/lib/guest-security-log';
export const runtime = 'nodejs';
export async function POST(request: Request) { try { assertSameOrigin(request); const body = await readAuthBody(request); const result = await signIn(body.email, body.password); if (result.actor.role === 'guest') { recordGuestServerEvent(result.actor, request.headers, { eventType: 'auth.login', surface: 'authentication', targetId: 'login:password', statusCode: 200 }); } const response = authJson({ actor: publicAuthActor(result.actor) }); response.headers.set('Set-Cookie', sessionCookie(result.cookie,false,result.expiresAt)); return response; } catch (error) { return authFailure(error); } }
