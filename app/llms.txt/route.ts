import { NextResponse } from "next/server";
import { buildAiExecutiveSummaryText } from "@/lib/site-shield";

export async function GET() {
  return new NextResponse(buildAiExecutiveSummaryText("/llms.txt"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "noimageindex, noarchive",
    },
  });
}
