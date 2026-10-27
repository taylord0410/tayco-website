import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { isAiBotUserAgent, isManualScraperUserAgent, isLocalhostIp } from "@/lib/site-shield";

const PUBLIC_ROOT = path.resolve(process.cwd(), "public");

const ALLOWED_PREFIXES = ["/curated/", "/work/", "/images/", "/img_v16_web/", "/media/"];
const ALLOWED_EXACT = new Set(["/logo.png"]);

export function scrambleVisualBytes(input: Uint8Array): Uint8Array {
  const out = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const mask = (0xa7 ^ ((i * 31) & 0xff) ^ ((i >> 8) & 0xff)) & 0xff;
    out[i] = input[i] ^ mask;
  }
  return out;
}

function isAllowedAssetPath(assetPath: string): boolean {
  if (!assetPath || !assetPath.startsWith("/") || assetPath.includes("..")) {
    return false;
  }
  const lower = assetPath.toLowerCase();
  if (ALLOWED_EXACT.has(lower)) return true;
  if (!/\.(jpe?g|png|webp|avif)$/i.test(lower)) return false;
  return ALLOWED_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

export async function GET(request: NextRequest) {
  const ua = request.headers.get("user-agent") || "";
  const host = request.headers.get("host") || request.nextUrl.host || "";
  const xff = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const isLocal = isLocalhostIp(xff, host);

  if (isAiBotUserAgent(ua) || (!isLocal && isManualScraperUserAgent(ua))) {
    return new NextResponse("Forbidden.", {
      status: 403,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Tayco-Shield": "blocked-stream-bot",
      },
    });
  }

  const streamToken = request.headers.get("x-tayco-stream");
  const secFetchDest = (request.headers.get("sec-fetch-dest") || "").toLowerCase();
  const secFetchMode = (request.headers.get("sec-fetch-mode") || "").toLowerCase();
  const secFetchSite = (request.headers.get("sec-fetch-site") || "").toLowerCase();

  // Block direct browser tab navigation or missing stream handshake header
  if (
    streamToken !== "v39" ||
    secFetchDest === "document" ||
    secFetchDest === "iframe" ||
    secFetchMode === "navigate" ||
    secFetchSite === "cross-site"
  ) {
    return new NextResponse(
      "Direct visual stream access is forbidden. Assets can only be rendered via TAYCO protected canvas.",
      {
        status: 403,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Tayco-Shield": "blocked-direct-stream",
          "X-Robots-Tag": "noimageindex, noarchive, nosnippet, noai, noimageai",
        },
      }
    );
  }

  const rawPath = (request.nextUrl.searchParams.get("p") || "").trim();
  if (!isAllowedAssetPath(rawPath)) {
    return new NextResponse("Invalid visual stream target.", {
      status: 403,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const resolvedFile = path.resolve(PUBLIC_ROOT, rawPath.replace(/^\/+/, ""));
  if (!resolvedFile.startsWith(PUBLIC_ROOT + path.sep) && resolvedFile !== PUBLIC_ROOT) {
    return new NextResponse("Forbidden path.", { status: 403 });
  }

  try {
    const fileBuffer = await fs.readFile(resolvedFile);
    const scrambled = scrambleVisualBytes(new Uint8Array(fileBuffer));

    return new NextResponse(Buffer.from(scrambled), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=300, no-transform",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Robots-Tag": "noimageindex, noarchive, nosnippet, noai, noimageai",
        "X-Tayco-Shield": "encrypted-canvas-stream",
      },
    });
  } catch {
    return new NextResponse("Asset not found.", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
