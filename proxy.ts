import { NextResponse, type NextRequest } from "next/server";
import { evaluateSiteShield } from "./lib/site-shield";

function extractClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "127.0.0.1"
  );
}

export function proxy(request: NextRequest) {
  const decision = evaluateSiteShield({
    method: request.method,
    pathname: request.nextUrl.pathname,
    clientIp: extractClientIp(request),
    userAgent: request.headers.get("user-agent") || "",
    host: request.headers.get("host") || request.nextUrl.host || "",
    referer: request.headers.get("referer"),
    secFetchDest: request.headers.get("sec-fetch-dest"),
    secFetchMode: request.headers.get("sec-fetch-mode"),
    secFetchSite: request.headers.get("sec-fetch-site"),
    accept: request.headers.get("accept"),
  });

  if (decision.action === "block") {
    return new NextResponse(decision.body, {
      status: decision.status,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        ...(decision.extraHeaders || {}),
      },
    });
  }

  if (decision.action === "ai_summary") {
    return new NextResponse(decision.body, {
      status: decision.status,
      headers: {
        "Content-Type": decision.contentType,
        ...(decision.extraHeaders || {}),
      },
    });
  }

  const response = NextResponse.next();
  if (decision.extraHeaders) {
    for (const [k, v] of Object.entries(decision.extraHeaders)) {
      response.headers.set(k, v);
    }
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|favicon.ico|icon.png|apple-icon.png).*)",
  ],
};
