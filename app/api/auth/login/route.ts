import { assertSameOrigin, sessionCookie, signIn } from '@/lib/auth';
import { authFailure, authJson, readAuthBody,publicAuthActor } from '@/lib/auth-http';
export const runtime = 'nodejs';
export async function POST(request: Request) { try { assertSameOrigin(request); const body = await readAuthBody(request); const result = await signIn(body.email, body.password); const response = authJson({ actor: publicAuthActor(result.actor) }); response.headers.set('Set-Cookie', sessionCookie(result.cookie,false,result.expiresAt)); return response; } catch (error) { return authFailure(error); } }
