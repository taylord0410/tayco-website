import { NextResponse, type NextRequest } from "next/server";
import { evaluateSiteShield } from "./lib/site-shield";
import { inspectAutomationRequest, GUARD_PATH } from "./lib/automation-guard-http";
import { guardMode } from "./lib/automation-guard";
import { trustedClientIp } from "./lib/client-network";

function extractClientIp(request: NextRequest): string {
  return trustedClientIp(request.headers);
}

export function proxy(request: NextRequest) {
  try {
    const probe = inspectAutomationRequest(request);
    const response = probe.response || (guardMode() !== 'off' && request.nextUrl.pathname === GUARD_PATH ? NextResponse.next() : siteProxy(request));
    if (probe.cookie) response.headers.append('Set-Cookie', probe.cookie);
    return response;
  } catch {
    return NextResponse.json({error: 'Security verification is temporarily unavailable.'}, {status: 503, headers: {'Cache-Control': 'private, no-store'}});
  }
}

function siteProxy(request: NextRequest) {
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
