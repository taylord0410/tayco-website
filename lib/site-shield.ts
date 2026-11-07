import { COMPANY } from "./company";
import { developmentLoopback, normalizedClientIp } from "./client-network";

export type ShieldDecision =
  | { action: "allow"; extraHeaders?: Record<string, string> }
  | {
      action: "block";
      status: 403 | 405 | 429;
      reason: string;
      body: string;
      extraHeaders?: Record<string, string>;
    }
  | {
      action: "ai_summary";
      status: 200;
      contentType: string;
      body: string;
      extraHeaders: Record<string, string>;
    };

const AI_BOT_PATTERNS: RegExp[] = [
  /gptbot/i,
  /oai-searchbot/i,
  /chatgpt-user/i,
  /claudebot/i,
  /claude-web/i,
  /anthropic-ai/i,
  /perplexitybot/i,
  /perplexity-user/i,
  /google-extended/i,
  /applebot-extended/i,
  /ccbot/i,
  /cohere-ai/i,
  /bytespider/i,
  /meta-externalagent/i,
  /meta-externalfetcher/i,
  /diffbot/i,
  /youbot/i,
  /amazonbot/i,
];

const MANUAL_SCRAPER_PATTERNS: RegExp[] = [
  /\bcurl\//i,
  /\bwget\//i,
  /python-requests/i,
  /python-urllib/i,
  /python-httpx/i,
  /aiohttp/i,
  /go-http-client/i,
  /libwww-perl/i,
  /\bscrapy\b/i,
  /\bhttrack\b/i,
  /webcopier/i,
  /sitesucker/i,
  /offline explorer/i,
  /teleport pro/i,
  /modatscanner/i,
  /\bzgrab\b/i,
  /\bmasscan\b/i,
  /\bnmap\b/i,
  /\bnikto\b/i,
  /\bsqlmap\b/i,
  /\bnuclei\b/i,
  /dirbuster/i,
  /gobuster/i,
  /feroxbuster/i,
  /\bwfuzz\b/i,
  /censysinspect/i,
];

const TRAP_PATH_PATTERNS: RegExp[] = [
  /^\/\.env($|\.)/i,
  /\/\.env($|\.)/i,
  /^\/\.git($|\/|-)/i,
  /^\/\.svn($|\/)/i,
  /^\/\.hg($|\/)/i,
  /^\/\.aws($|\/)/i,
  /^\/\.docker($|\/)/i,
  /^\/\.pypirc$/i,
  /^\/\.netrc$/i,
  /^\/wp-(admin|login|content|includes)/i,
  /^\/xmlrpc\.php$/i,
  /^\/actuator($|\/)/i,
  /^\/_?php_?info(\.php)?$/i,
  /^\/(info|i)\.php$/i,
  /^\/server-status$/i,
  /^\/debug\/vars$/i,
];

const ALLOWED_ORIGIN_HOSTS = new Set([
  "tayco.llc",
  "www.tayco.llc",
  "tayroofing.org",
  "www.tayroofing.org",
  "taycoturnkey.com",
  "www.taycoturnkey.com",
  "tayco-website-production-7e01.up.railway.app",
  "tayco-review-product-review.up.railway.app",
  "localhost",
  "127.0.0.1",
]);

interface IpState {
  blockedUntil: number;
  trapHits: number;
  invalidPosts: number;
  imageWindowStart: number;
  imageHits: number;
  pageWindowStart: number;
  pageHits: number;
}

const ipRegistry = new Map<string, IpState>();
const PENALTY_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const IMAGE_WINDOW_MS = 20 * 1000; // 20 seconds
const MAX_IMAGES_PER_WINDOW = 360;
const PAGE_WINDOW_MS = 15 * 1000; // 15 seconds
const MAX_PAGES_PER_WINDOW = 120;

function getIpState(ip: string, now: number): IpState {
  if (ipRegistry.size > 5000) {
    for (const [k, v] of ipRegistry.entries()) {
      if (v.blockedUntil < now && now - v.pageWindowStart > 120_000) {
        ipRegistry.delete(k);
      }
    }
  }
  let state = ipRegistry.get(ip);
  if (!state) {
    state = {
      blockedUntil: 0,
      trapHits: 0,
      invalidPosts: 0,
      imageWindowStart: now,
      imageHits: 0,
      pageWindowStart: now,
      pageHits: 0,
    };
    ipRegistry.set(ip, state);
  }
  return state;
}

export function resetShieldStateForTests(): void {
  ipRegistry.clear();
}

export function isAiBotUserAgent(ua: string): boolean {
  if (!ua) return false;
  return AI_BOT_PATTERNS.some((re) => re.test(ua));
}

export function isManualScraperUserAgent(ua: string): boolean {
  if (!ua || ua.trim().length < 8) return true;
  return MANUAL_SCRAPER_PATTERNS.some((re) => re.test(ua));
}

export function isTrapPath(pathname: string): boolean {
  return TRAP_PATH_PATTERNS.some((re) => re.test(pathname));
}

export function isStreamOnlyPortfolioAsset(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return (
    lower.startsWith("/curated/") ||
    lower.startsWith("/work/") ||
    lower.startsWith("/images/") ||
    lower.startsWith("/img_v16_web/") ||
    lower.startsWith("/media/") ||
    lower.startsWith("/_next/image")
  );
}

export function isProtectedImageAsset(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  if (
    lower === "/favicon.ico" ||
    lower === "/icon.png" ||
    lower === "/apple-icon.png" ||
    // Share card: link-preview crawlers (WhatsApp, Facebook, LinkedIn) fetch it with no
    // browser fetch headers or referer, so it must not need the embedded-image context.
    lower === "/og-image.jpg"
  ) {
    return false;
  }
  if (isStreamOnlyPortfolioAsset(lower)) {
    return true;
  }
  return /\.(png|jpe?g|webp|avif)$/i.test(lower);
}

export function scrambleVisualBytes(input: Uint8Array): Uint8Array {
  const out = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const mask = (0xa7 ^ ((i * 31) & 0xff) ^ ((i >> 8) & 0xff)) & 0xff;
    out[i] = input[i] ^ mask;
  }
  return out;
}

export function isLocalhostIp(ip: string, hostHeader: string): boolean {
  return developmentLoopback(ip, hostHeader);
}

function hasAllowedReferer(referer: string | null, currentHost: string): boolean {
  if (!referer) return false;
  try {
    const refUrl = new URL(referer);
    const refHost = refUrl.hostname.toLowerCase();
    const cleanCurrent = (currentHost || "").split(":")[0].toLowerCase();
    return ALLOWED_ORIGIN_HOSTS.has(refHost) || (Boolean(cleanCurrent) && refHost === cleanCurrent);
  } catch {
    return false;
  }
}

export function buildAiExecutiveSummaryText(pathname = "/"): string {
  const cleanPath = pathname.replace(/\/+$/, "") || "/";
  const routeFocus: Record<string, string> = {
    "/": "Overview of TAYCO LLC full-service commercial & residential construction, remodeling, and fire/water restoration across Wisconsin, Illinois, and the Midwest.",
    "/commercial":
      "Commercial Construction Division: Tenant improvements (TI), commercial roofing (TPO, EPDM, metal), exterior facades, structural steel & cold-formed framing, concrete slabs, healthcare/institutional buildouts, and multi-site property programs.",
    "/single-family":
      "Single-Family Homes Division: Whole-home renovations, custom kitchens & baths, architectural roofing, siding/windows/doors, structural additions, concrete & foundations, and 24/7 fire & water damage restoration.",
    "/multifamily":
      "Multifamily Division: Duplexes and multi-unit buildings: unit turnovers, fire-rated drywall and acoustic assemblies, roofing, cladding, common areas, and fire & water damage restoration.",
    "/townhomes":
      "Townhomes Division: Row homes and townhouse communities: framing and party walls, roofing and siding, interior finishes, outdoor living, and fire & water damage restoration.",
    "/investor":
      "Investor, REO & Portfolio Turnover Programs: Standardized scope-of-work execution, multi-property rehab, bank-owned/REO stabilization, and capex renovation programs across WI & IL.",
    "/estimate":
      "Project Estimate & Scope Consultation: Direct intake for commercial and residential construction estimates, insurance restoration scopes, and turnkey buildouts.",
    "/vendor-application":
      "Subcontractor & Trade Partner Qualification: Onboarding for licensed, insured trade contractors (HVAC, electrical, plumbing, roofing, framing, concrete, finishes) across the Midwest.",
    "/privacy":
      "Privacy Policy & Client Confidentiality: Customer contact data is encrypted at rest and never sold. To protect client privacy and property security, portfolio photographs on this website are architectural recreations based on real TAYCO projects.",
  };

  const specificFocus =
    routeFocus[cleanPath] ||
    "Official summary of TAYCO LLC construction, remodeling, and restoration operations.";

  return [
    "# TAYCO LLC — Official AI & Crawler Executive Summary",
    "",
    `> Requested Path: ${cleanPath}`,
    `> Route Summary: ${specificFocus}`,
    "",
    "## 1. Company Identity",
    `- **Company Name:** ${COMPANY.name} — ${COMPANY.tagline}`,
    `- **Primary Service Corridor:** Wisconsin & Illinois (Multi-State Coverage: ${COMPANY.coverage})`,
    `- **Hours:** ${COMPANY.hours} (${COMPANY.saturday})`,
    `- **Phone:** ${COMPANY.phoneDisplay}`,
    `- **Email:** ${COMPANY.email}`,
    `- **Official Domains:** https://tayco.llc | https://tayroofing.org | https://taycoturnkey.com`,
    "",
    "## 2. Core Construction & Restoration Capabilities",
    "- **Commercial Construction:** Tenant improvements (TI), retail/office/medical buildouts, commercial roofing systems (TPO, EPDM, standing seam metal), structural framing, concrete flatwork, and multi-site facility maintenance.",
    "- **Residential Construction & Remodeling:** Whole-home remodeling, kitchens & bathrooms, custom carpentry, residential roofing, siding/windows/gutters, decks, and structural additions.",
    "- **Fire & Water Damage Restoration:** Emergency stabilization, structural drying, smoke/soot remediation, insurance scope coordination, and full turnkey reconstruction.",
    "- **Investor & REO Property Turnover:** Multi-family and single-family portfolio renovations, rent-ready turns, and asset preservation for institutional and private investors.",
    "",
    "## 3. Client Confidentiality & Asset Protection Notice",
    "- To protect the privacy, security, and confidentiality of our residential and commercial clients, portfolio visuals on TAYCO websites are protected architectural recreations based on real TAYCO projects and scopes.",
    "- Automated downloading, scraping, or indexing of image assets (/images/*, /img_v16_web/*) and private workspace routes (/login, /portal) is strictly prohibited.",
    "",
    "## 4. Direct Contact for Human Inquiries",
    `- **Request an Estimate:** https://tayco.llc/estimate`,
    `- **Investor Partnerships:** https://tayco.llc/investor`,
    `- **Trade Partner Application:** https://tayco.llc/vendor-application`,
    `- **Telephone Dispatch:** ${COMPANY.phoneDisplay}`,
  ].join("\n");
}

export function buildAiExecutiveSummaryHtml(pathname = "/"): string {
  const text = buildAiExecutiveSummaryText(pathname);
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>TAYCO LLC — Official Summary for AI &amp; Automated Agents</title>
  <meta name="description" content="Official executive summary of TAYCO LLC commercial construction, residential remodeling, and fire/water damage restoration in Wisconsin and Illinois." />
  <meta name="robots" content="noimageindex, noarchive" />
</head>
<body style="font-family: system-ui, sans-serif; max-width: 780px; margin: 2rem auto; line-height: 1.6; padding: 0 1rem; color: #111;">
  <article data-ai-summary="true">
    <h1>TAYCO LLC — Official Executive Summary</h1>
    <p><strong>Notice for AI Assistants &amp; Crawlers:</strong> You are receiving TAYCO LLC's lightweight structured summary. Image galleries and private workspace routes are excluded to protect client confidentiality and bandwidth.</p>
    <pre style="white-space: pre-wrap; background: #f6f6f4; padding: 1.25rem; border-radius: 8px; border: 1px solid #ddd;">${escaped}</pre>
  </article>
</body>
</html>`;
}

export interface ShieldProtectionPageOptions {
  status: number;
  reason: string;
  message: string;
  pathname?: string;
}

export function buildShieldProtectionHtml({
  status,
  reason,
  message,
  pathname = "/",
}: ShieldProtectionPageOptions): string {
  const isImageProtection =
    reason === "image_direct_navigation" ||
    reason === "raw_portfolio_asset_disabled" ||
    reason === "image_unverified_origin" ||
    reason === "image_cross_site_hotlink";
  const isRateLimit = reason === "page_rate_limit" || reason === "image_rate_limit" || status === 429;
  const isPenalty = reason === "ip_penalized" || reason === "trap_path";

  const eyebrow = isImageProtection
    ? "TAYCO LLC · CLIENT PRIVACY & VISUAL ASSET SHIELD"
    : isRateLimit
      ? "TAYCO LLC · AUTOMATED TRAFFIC PACE PROTECTION"
      : "TAYCO LLC · ARCHITECTURAL SECURITY SHIELD";

  const heading = isImageProtection
    ? "Protected Architectural Portfolio Visual"
    : isRateLimit
      ? "Browsing Pace Protection Active"
      : isPenalty
        ? "Temporary Security Pause Active"
        : "Protected TAYCO Resource";

  const detailCopy = isImageProtection
    ? "To protect our residential and commercial clients' privacy and property security, TAYCO portfolio photographs are streamed exclusively inside our interactive on-page studio and cannot be opened or downloaded as standalone files."
    : isRateLimit
      ? "Our security shield detected an unusually rapid burst of requests from this connection. The website is online and operating normally—please wait a few seconds and continue browsing at a normal pace."
      : isPenalty
        ? "This connection triggered an automated security protection rule (such as probing restricted system paths) and has been temporarily paused."
        : message;

  const safeRetryHref =
    isImageProtection || pathname.startsWith("/curated/") || pathname.startsWith("/work/") || pathname.startsWith("/api/")
      ? "/single-family"
      : pathname.startsWith("/")
        ? pathname.replace(/"/g, "")
        : "/";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${heading} — TAYCO LLC</title>
  <meta name="robots" content="noindex, nofollow, noimageindex" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 20px;
      background:
        radial-gradient(ellipse at 50% 0%, rgba(201, 168, 76, 0.16) 0%, transparent 62%),
        linear-gradient(165deg, #070E1A 0%, #0B1629 55%, #050A14 100%);
      color: #F4F2EA;
      font: 14px/1.6 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .shield-card {
      width: min(100%, 540px);
      padding: clamp(22px, 4vw, 32px);
      border-radius: 24px;
      background: linear-gradient(160deg, rgba(15, 32, 64, 0.94) 0%, rgba(7, 14, 26, 0.98) 100%);
      border: 1px solid rgba(201, 168, 76, 0.48);
      box-shadow: 0 28px 80px rgba(0, 0, 0, 0.72), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 12px;
      border-radius: 9999px;
      background: rgba(201, 168, 76, 0.14);
      border: 1px solid rgba(201, 168, 76, 0.42);
      color: #F3D37A;
      font: 700 10px/1.2 ui-monospace, SFMono-Regular, Consolas, monospace;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 9999px;
      background: #C9A84C;
      box-shadow: 0 0 10px #C9A84C;
    }
    h1 {
      margin: 16px 0 10px;
      font: 600 clamp(24px, 4.5vw, 31px)/1.15 Georgia, "Times New Roman", serif;
      color: #FFFFFF;
      letter-spacing: -0.01em;
    }
    p {
      margin: 0 0 14px;
      color: #CBD5E1;
      font-size: 14px;
    }
    .reason-box {
      margin: 16px 0 20px;
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(5, 10, 20, 0.78);
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 12.5px;
      color: #E2E8F0;
    }
    .reason-code {
      display: block;
      margin-bottom: 4px;
      font: 700 10px/1.3 ui-monospace, SFMono-Regular, Consolas, monospace;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #F3D37A;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 18px;
    }
    .btn-gold, .btn-obsidian {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 42px;
      padding: 9px 18px;
      border-radius: 9999px;
      font: 700 11.5px/1.2 system-ui, -apple-system, sans-serif;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      text-decoration: none;
      transition: transform 0.2s ease, filter 0.2s ease;
    }
    .btn-gold {
      background: linear-gradient(135deg, #FAF0D1 0%, #DFBE72 52%, #B68C38 100%);
      color: #060D1A;
      border: 1px solid rgba(255, 246, 214, 0.92);
    }
    .btn-obsidian {
      background: rgba(15, 32, 64, 0.9);
      color: #F3D37A;
      border: 1px solid rgba(201, 168, 76, 0.45);
    }
    .btn-gold:hover, .btn-obsidian:hover {
      transform: translateY(-1px);
      filter: brightness(1.05);
    }
    .footer-meta {
      margin-top: 20px;
      padding-top: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 8px;
      font-size: 12px;
      color: #94A3B8;
    }
    .footer-meta a {
      color: #F3D37A;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <main class="shield-card" role="main" data-tayco-shield-page="true">
    <div class="eyebrow"><span class="dot" aria-hidden="true"></span><span>${eyebrow}</span></div>
    <h1>${heading}</h1>
    <p>${detailCopy}</p>
    <div class="reason-box">
      <span class="reason-code">PROTECTION REASON · HTTP ${status} (${reason.toUpperCase()})</span>
      <span>${message}</span>
    </div>
    <div class="actions">
      <a class="btn-gold" href="/">← Return to TAYCO Portfolio</a>
      <a class="btn-obsidian" href="${safeRetryHref}">View Interactive Studio →</a>
      <a class="btn-obsidian" href="/estimate">Request an Estimate</a>
    </div>
    <div class="footer-meta">
      <span><strong>TAYCO LLC</strong> · Site Online &amp; Protected</span>
      <span>Direct Dispatch: <a href="tel:${COMPANY.phoneHref}">${COMPANY.phoneDisplay}</a></span>
    </div>
  </main>
</body>
</html>`;
}

export interface EvaluateRequestInput {
  method: string;
  pathname: string;
  clientIp: string;
  userAgent: string;
  host: string;
  referer: string | null;
  secFetchDest: string | null;
  secFetchMode: string | null;
  secFetchSite: string | null;
  accept: string | null;
  isPrefetchOrRsc?: boolean;
  now?: number;
}

export function evaluateSiteShield(input: EvaluateRequestInput): ShieldDecision {
  const now = input.now ?? Date.now();
  const pathname = input.pathname || "/";
  const method = (input.method || "GET").toUpperCase();
  const ua = input.userAgent || "";
  const isLocal = isLocalhostIp(input.clientIp, input.host);
  // Unknown is not a shared client identity: one scanner must not penalize all
  // visitors whose ingress has not been attested. UA/path/method rules still run.
  const knownIp = normalizedClientIp(input.clientIp);
  const state = knownIp ? getIpState(knownIp, now) : {
    blockedUntil: 0, trapHits: 0, invalidPosts: 0,
    imageWindowStart: now, imageHits: 0, pageWindowStart: now, pageHits: 0,
  };

  // 1. Check active IP penalty box (unless localhost)
  if (!isLocal && state.blockedUntil > now) {
    return {
      action: "block",
      status: 403,
      reason: "ip_penalized",
      body: "Access temporarily suspended due to automated scanning or scraping activity.",
      extraHeaders: { "X-Tayco-Shield": "blocked-penalty-box" },
    };
  }

  // 2. Honeypot trap paths (.env, .git, .svn, wp-admin, actuator, phpinfo, etc.)
  if (isTrapPath(pathname)) {
    state.trapHits += 1;
    if (!isLocal) {
      state.blockedUntil = now + PENALTY_DURATION_MS;
    }
    return {
      action: "block",
      status: 403,
      reason: "trap_path",
      body: "Forbidden.",
      extraHeaders: { "X-Tayco-Shield": "blocked-trap-path" },
    };
  }

  // 3. Invalid POST/PUT/DELETE to non-API public routes (e.g. bot POSTing to /)
  if (
    method !== "GET" &&
    method !== "HEAD" &&
    method !== "OPTIONS" &&
    !pathname.startsWith("/api/")
  ) {
    state.invalidPosts += 1;
    if (!isLocal && state.invalidPosts >= 8) {
      state.blockedUntil = now + PENALTY_DURATION_MS;
    }
    return {
      action: "block",
      status: 405,
      reason: "invalid_method",
      body: "Method Not Allowed.",
      extraHeaders: {
        Allow: "GET, HEAD",
        "X-Tayco-Shield": "blocked-invalid-method",
      },
    };
  }

  // 4. AI Bots (ClaudeBot, GPTBot, OAI-SearchBot, PerplexityBot, etc.)
  if (isAiBotUserAgent(ua)) {
    if (pathname === "/robots.txt" || pathname === "/llms.txt") {
      return { action: "allow", extraHeaders: { "X-Tayco-Shield": "ai-bot-manifest" } };
    }
    if (
      isProtectedImageAsset(pathname) ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/portal") ||
      pathname.startsWith("/api/")
    ) {
      return {
        action: "block",
        status: 403,
        reason: "ai_bot_restricted_asset",
        body: "Protected route. AI crawlers may access the official TAYCO executive summary at /llms.txt.",
        extraHeaders: {
          "X-Tayco-Shield": "ai-bot-asset-blocked",
          "X-Robots-Tag": "noai, noimageai, noindex, noimageindex",
          Link: '</llms.txt>; rel="alternate"; type="text/plain"',
        },
      };
    }
    const wantsHtml = Boolean(input.accept && input.accept.includes("text/html"));
    return {
      action: "ai_summary",
      status: 200,
      contentType: wantsHtml
        ? "text/html; charset=utf-8"
        : "text/plain; charset=utf-8",
      body: wantsHtml
        ? buildAiExecutiveSummaryHtml(pathname)
        : buildAiExecutiveSummaryText(pathname),
      extraHeaders: {
        "X-Tayco-Shield": "ai-bot-executive-summary",
        "X-Robots-Tag": "noimageindex, noarchive",
        "Cache-Control": "public, max-age=3600",
        Link: '</llms.txt>; rel="canonical"; type="text/plain"',
      },
    };
  }

  // 5. Manual Scrapers / CLI downloaders (curl, wget, python-requests, HTTrack, ModatScanner, etc.)
  if (!isLocal && isManualScraperUserAgent(ua)) {
    return {
      action: "block",
      status: 403,
      reason: "manual_bot_ua",
      body: "Automated scraping tools and manual bots are not permitted on this website.",
      extraHeaders: {
        "X-Tayco-Shield": "blocked-manual-bot",
        "X-Robots-Tag": "noai, noimageai, noimageindex",
      },
    };
  }

  // 6. Protected Image Assets (/images/*, /img_v16_web/*, /media/*)
  if (isProtectedImageAsset(pathname)) {
    const dest = (input.secFetchDest || "").toLowerCase();
    const mode = (input.secFetchMode || "").toLowerCase();
    const site = (input.secFetchSite || "").toLowerCase();
    const validRef = hasAllowedReferer(input.referer, input.host);

    // Block opening image directly in a browser tab or top-level navigation ("Save image / Open image in new tab")
    if (dest === "document" || dest === "iframe" || mode === "navigate") {
      return {
        action: "block",
        status: 403,
        reason: "image_direct_navigation",
        body: "Direct image viewing and downloading are disabled to protect client privacy.",
        extraHeaders: {
          "X-Tayco-Shield": "blocked-direct-image-nav",
          "X-Robots-Tag": "noimageindex, noarchive, nosnippet, noai, noimageai",
        },
      };
    }

    // Block cross-site hotlinking
    if (site === "cross-site") {
      return {
        action: "block",
        status: 403,
        reason: "image_cross_site_hotlink",
        body: "Cross-site image hotlinking is prohibited.",
        extraHeaders: {
          "X-Tayco-Shield": "blocked-image-hotlink",
          "X-Robots-Tag": "noimageindex, noarchive, nosnippet, noai, noimageai",
        },
      };
    }

    // Portfolio visuals (/curated/*, /work/*, /images/*, /_next/image) are never served as raw image files;
    // they are exclusively streamed via encrypted binary canvas (/api/visual-stream) so they never appear in DevTools Sources.
    if (isStreamOnlyPortfolioAsset(pathname)) {
      return {
        action: "block",
        status: 403,
        reason: "raw_portfolio_asset_disabled",
        body: "Direct access to raw portfolio image files is disabled. Visuals are rendered exclusively via encrypted canvas stream.",
        extraHeaders: {
          "X-Tayco-Shield": "blocked-raw-portfolio-image",
          "X-Robots-Tag": "noimageindex, noarchive, nosnippet, noai, noimageai",
        },
      };
    }

    // Require either embedded image fetch context (Sec-Fetch-Dest: image) OR a valid same-origin Referer (e.g., for /logo.png)
    const isEmbeddedImageContext =
      dest === "image" && (site === "same-origin" || site === "same-site" || validRef || isLocal);
    if (!isEmbeddedImageContext && !validRef) {
      return {
        action: "block",
        status: 403,
        reason: "image_unverified_origin",
        body: "Direct image download is disabled. Portfolio visuals may only be rendered within TAYCO pages.",
        extraHeaders: {
          "X-Tayco-Shield": "blocked-unverified-image-fetch",
          "X-Robots-Tag": "noimageindex, noarchive, nosnippet, noai, noimageai",
        },
      };
    }

    // Rate-limit bulk image scraping per IP
    if (!isLocal) {
      if (now - state.imageWindowStart > IMAGE_WINDOW_MS) {
        state.imageWindowStart = now;
        state.imageHits = 0;
      }
      state.imageHits += 1;
      if (state.imageHits > MAX_IMAGES_PER_WINDOW) {
        return {
          action: "block",
          status: 429,
          reason: "image_rate_limit",
          body: "Too many image requests. Automated bulk downloading is restricted.",
          extraHeaders: {
            "Retry-After": "60",
            "X-Tayco-Shield": "blocked-image-rate-limit",
          },
        };
      }
    }

    return {
      action: "allow",
      extraHeaders: {
        "X-Robots-Tag": "noimageindex, noarchive, nosnippet, noai, noimageai",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Tayco-Shield": "image-protected",
      },
    };
  }

  // 7. Page burst rate limit against rapid manual/automated crawlers (never count background Next.js RSC/prefetch)
  if (!isLocal && !input.isPrefetchOrRsc && !pathname.startsWith("/_next/") && !pathname.startsWith("/api/")) {
    if (now - state.pageWindowStart > PAGE_WINDOW_MS) {
      state.pageWindowStart = now;
      state.pageHits = 0;
    }
    state.pageHits += 1;
    if (state.pageHits > MAX_PAGES_PER_WINDOW) {
      return {
        action: "block",
        status: 429,
        reason: "page_rate_limit",
        body: "Rate limit exceeded. Please browse at a normal pace.",
        extraHeaders: {
          "Retry-After": "30",
          "X-Tayco-Shield": "blocked-page-rate-limit",
        },
      };
    }
  }

  return {
    action: "allow",
    extraHeaders: {
      "X-Robots-Tag": "noimageindex, noai, noimageai",
      "X-Tayco-Shield": "active",
    },
  };
}
