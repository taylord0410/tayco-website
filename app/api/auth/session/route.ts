import {withGuestRequestAudit} from '@/lib/review-request-audit';
import { requireActor } from '@/lib/auth';
import { authFailure, authJson,publicAuthActor } from '@/lib/auth-http';
export const runtime = 'nodejs';
async function handleGET(request: Request) { try { return authJson({actor:publicAuthActor(await requireActor(request))}); } catch (error) { return authFailure(error); } }

export const GET=withGuestRequestAudit('authentication',handleGET);
