import { NextResponse } from 'next/server';
import { AuthError, assertSameOrigin, requireActor, requireRole } from '@/lib/auth';
import { readAuthBody } from '@/lib/auth-http';
import { commitTakeoffSourceRegistration, planTakeoffSourceRegistration, takeoffSourceRegistrationControl, TakeoffSourceRegistrationError } from '@/lib/takeoff-source-registration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const privateHeaders = { 'Cache-Control': 'private, no-store', Pragma: 'no-cache', Vary: 'Cookie', 'X-Content-Type-Options': 'nosniff' };
function enabled() { if (process.env.TAYCO_TAKEOFF_REGISTRATION_ENABLED !== 'true') throw new AuthError('Not found.', 404); }
function failure(cause: unknown) {
  const known = cause instanceof AuthError || cause instanceof TakeoffSourceRegistrationError;
  const status = known ? cause.status : 503;
  return NextResponse.json({ success: false, error: known ? cause.message : 'Takeoff source registration is temporarily unavailable.' }, { status, headers: { ...privateHeaders, ...(status === 405 ? { Allow: 'GET, POST, HEAD' } : {}) } });
}
function fixedRequest(request: Request) { if (new URL(request.url).search) throw new AuthError('Registration does not accept query options.', 400); }
function fields(value: Record<string, unknown>, keys: string[]) {
  if (Object.keys(value).length !== keys.length || Object.keys(value).some(key => !keys.includes(key))) throw new AuthError('Check the registration request fields.', 422);
}
export async function GET(request: Request) {
  try {
    enabled(); const actor = await requireActor(request); requireRole(actor, ['admin']); fixedRequest(request);
    return NextResponse.json({ success: true, source: takeoffSourceRegistrationControl(actor) }, { headers: privateHeaders });
  } catch (cause) { return failure(cause); }
}
export async function POST(request: Request) {
  try {
    enabled(); const actor = await requireActor(request); requireRole(actor, ['admin']); assertSameOrigin(request); fixedRequest(request);
    const body = await readAuthBody(request);
    if (body.mode === 'plan') {
      fields(body, ['mode', 'input']);
      return NextResponse.json({ success: true, plan: planTakeoffSourceRegistration(actor, body.input) }, { headers: privateHeaders });
    }
    if (body.mode === 'commit') {
      fields(body, ['mode', 'input', 'key', 'expectedPlanHash']);
      if (typeof body.key !== 'string' || typeof body.expectedPlanHash !== 'string') throw new AuthError('Check the explicit commit key and approved plan hash.', 422);
      return NextResponse.json({ success: true, result: commitTakeoffSourceRegistration(actor, body.key, body.input, body.expectedPlanHash) }, { headers: privateHeaders });
    }
    throw new AuthError('Choose plan or commit for source registration.', 422);
  } catch (cause) { return failure(cause); }
}
export async function HEAD(request: Request) { const response = await GET(request); return new Response(null, { status: response.status, headers: response.headers }); }
async function unsupported(request: Request) {
  try { enabled(); const actor = await requireActor(request); requireRole(actor, ['admin']); throw new AuthError('Use GET or POST for source registration.', 405); }
  catch (cause) { return failure(cause); }
}
export const PUT = unsupported;
export const PATCH = unsupported;
export const DELETE = unsupported;
export const OPTIONS = unsupported;
