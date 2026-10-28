import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { isAiBotUserAgent, isManualScraperUserAgent, isLocalhostIp } from "@/lib/site-shield";

const PUBLIC_ROOT = path.resolve(process.cwd(), "public");

const ALLOWED_PREFIXES = ["/curated/", "/work/", "/images/", "/img_v16_web/", "/media/"];
const ALLOWED_EXACT = new Set(["/logo.png"]);

interface CachedScrambledAsset {
  buffer: Buffer;
  etag: string;
  mtimeMs: number;
}

// Server-side in-memory cache of XOR-scrambled assets so disk I/O + XOR run only once per asset version
const scrambledAssetCache = new Map<string, CachedScrambledAsset>();
const MAX_CACHE_ENTRIES = 260;

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

async function getScrambledAsset(rawPath: string, resolvedFile: string): Promise<CachedScrambledAsset> {
  const stat = await fs.stat(resolvedFile);
  const hit = scrambledAssetCache.get(rawPath);
  if (hit && hit.mtimeMs === stat.mtimeMs) return hit;

  const fileBuffer = await fs.readFile(resolvedFile);
  const scrambled = Buffer.from(scrambleVisualBytes(new Uint8Array(fileBuffer)));
  const etag = `W/"v41-${ Math.round(stat.mtimeMs) }-${ scrambled.byteLength }-${ scrambled[0] ?? 0 }"`;
  const entry: CachedScrambledAsset = { buffer: scrambled, etag, mtimeMs: stat.mtimeMs };

  if (scrambledAssetCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = scrambledAssetCache.keys().next().value;
    if (oldestKey) scrambledAssetCache.delete(oldestKey);
  }
  scrambledAssetCache.set(rawPath, entry);
  return entry;
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
    const asset = await getScrambledAsset(rawPath, resolvedFile);
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch && ifNoneMatch === asset.etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: asset.etag,
          "Cache-Control": "private, max-age=86400, stale-while-revalidate=604800, no-transform",
          "X-Tayco-Shield": "encrypted-canvas-stream-304",
        },
      });
    }

    return new NextResponse(new Uint8Array(asset.buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        ETag: asset.etag,
        "Cache-Control": "private, max-age=86400, stale-while-revalidate=604800, no-transform",
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
