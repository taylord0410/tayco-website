import { AuthError, assertSameOrigin, requireActor, requireRole } from '@/lib/auth';
import { authFailure, authJson, readAuthBody } from '@/lib/auth-http';
import { GuestActivityError, guestActivityReport, recordGuestActivity } from '@/lib/guest-activity';

import { GuestPrivacyError } from '@/lib/guest-privacy';

export const runtime = 'nodejs';
function failure(error: unknown) { return authFailure(error instanceof GuestActivityError || error instanceof GuestPrivacyError ? new AuthError(error.message, error.status) : error); }

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireActor(request);
    requireRole(actor, ['guest']);
    const body = await readAuthBody(request);
    return authJson({ success: true, ...recordGuestActivity(actor, body) });
  } catch (error) { return failure(error); }
}

export async function GET(request: Request) {
  try {
    const actor = await requireActor(request);
    requireRole(actor, ['admin']);
    return authJson({ success: true, ...guestActivityReport(actor) });
  } catch (error) { return failure(error); }
}
