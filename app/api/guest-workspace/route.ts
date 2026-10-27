import { withGuestRequestAudit,noteReviewAuditFailure,noteReviewAuditResource } from '@/lib/review-request-audit';
import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireActor } from "@/lib/auth";
import { ErpError } from "@/lib/erp";
import { guestConsoleSnapshot } from "@/lib/guest-workspace";
import { MonthlyManagementEstimateError } from "@/lib/monthly-management-estimates";
import { isGuestSection } from "@/lib/guest-sections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff" };
async function handleGET(request: NextRequest) {
  try {
    const actor = await requireActor(request);
    const query = request.nextUrl.searchParams;
    if ([...query.keys()].some(key => !["period", "section"].includes(key)) || ["period", "section"].some(key => query.getAll(key).length > 1))
      throw new ErpError(422, "Choose a valid review period and section.");
    const section = query.get("section") ?? undefined;
    if (section !== undefined && !isGuestSection(section))
      throw new ErpError(422, "Choose a valid review section.");
    const workspace = guestConsoleSnapshot(actor, { period: query.get("period") ?? undefined, section: isGuestSection(section) ? section : undefined });
    const secName = isGuestSection(section) ? section : "summary";
    noteReviewAuditResource("module", `${secName}_${workspace.period}`, {
      eventType: "workspace.section",
      targetId: `section:${secName}:${workspace.period}`,
      detail: `${secName} (${workspace.period})`,
    });
    return NextResponse.json({ workspace }, { headers: privateHeaders });
  } catch (error) {
    noteReviewAuditFailure(error, error instanceof AuthError || error instanceof ErpError || error instanceof MonthlyManagementEstimateError ? error.status : 503);
    const known = error instanceof AuthError || error instanceof ErpError || error instanceof MonthlyManagementEstimateError;
    return NextResponse.json({ error: known ? error.message : "The review workspace is temporarily unavailable.", ...(error instanceof AuthError&&error.reasonCode?{reasonCode:error.reasonCode}:{}) }, { status: known ? error.status : 503, headers: privateHeaders });
  }
}

export const GET=withGuestRequestAudit('workspace',handleGET);
