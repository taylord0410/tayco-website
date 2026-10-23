import { assertSameOrigin, sessionCookie, signOut } from '@/lib/auth';
import { authFailure, authJson } from '@/lib/auth-http';
export const runtime = 'nodejs';
export async function POST(request: Request) { try { assertSameOrigin(request); await signOut(request); const response = authJson({ success: true }); response.headers.set('Set-Cookie', sessionCookie('', true)); return response; } catch (error) { return authFailure(error); } }
