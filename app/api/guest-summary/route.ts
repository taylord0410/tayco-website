import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireActor } from "@/lib/auth";
import { guestMonthlyEstimateSummary, MonthlyManagementEstimateError } from "@/lib/monthly-management-estimates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireActor(request);
    const query = request.nextUrl.searchParams;
    if ([...query.keys()].some(key => !["year", "month"].includes(key)) || ["year", "month"].some(key => query.getAll(key).length > 1)) {
      throw new MonthlyManagementEstimateError(422, "Choose a valid completed-month selection.");
    }
    const summary = guestMonthlyEstimateSummary(actor, { year: query.get("year") ?? undefined, month: query.get("month") ?? undefined });
    return NextResponse.json({ success: true, summary }, { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
  } catch (error) {
    const known = error instanceof AuthError || error instanceof MonthlyManagementEstimateError;
    return NextResponse.json({ success: false, error: known ? error.message : "Monthly summaries are temporarily unavailable." }, {
      status: known ? error.status : 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
