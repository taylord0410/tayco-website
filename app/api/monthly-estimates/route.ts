import {withGuestRequestAudit} from '@/lib/review-request-audit';
import { NextResponse } from "next/server";
import { AuthError, assertSameOrigin, requireActor, requireRole } from "@/lib/auth";
import { readAuthBody } from "@/lib/auth-http";
import { listMonthlyManagementEstimates, saveMonthlyManagementEstimate, MonthlyManagementEstimateError } from "@/lib/monthly-management-estimates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
function failure(error: unknown) {
  const known = error instanceof AuthError || error instanceof MonthlyManagementEstimateError;
  return NextResponse.json({ success: false, error: known ? error.message : "Management estimates are temporarily unavailable." }, { status: known ? error.status : 503, headers });
}
async function handleGET(request: Request) {
  try {
    const actor = await requireActor(request); requireRole(actor, ["admin", "staff"]);
    return NextResponse.json({ success: true, estimates: listMonthlyManagementEstimates(actor) }, { headers });
  } catch (error) { return failure(error); }
}
async function handlePOST(request: Request) {
  try {
    const actor = await requireActor(request); requireRole(actor, ["admin", "staff"]); assertSameOrigin(request);
    const input = await readAuthBody(request);
    const result = saveMonthlyManagementEstimate(actor, request.headers.get("Idempotency-Key") || "", input);
    return NextResponse.json({ success: true, result }, { headers });
  } catch (error) { return failure(error); }
}

export const GET=withGuestRequestAudit('workspace',handleGET);

export const POST=withGuestRequestAudit('workspace',handlePOST);
