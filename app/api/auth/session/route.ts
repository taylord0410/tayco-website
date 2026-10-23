import { requireActor } from '@/lib/auth';
import { authFailure, authJson } from '@/lib/auth-http';
export const runtime = 'nodejs';
export async function GET(request: Request) { try { return authJson({ actor: await requireActor(request) }); } catch (error) { return authFailure(error); } }
