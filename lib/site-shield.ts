import { COMPANY } from "./company";

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
const PENALTY_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const IMAGE_WINDOW_MS = 20 * 1000; // 20 seconds
const MAX_IMAGES_PER_WINDOW = 130;
const PAGE_WINDOW_MS = 15 * 1000; // 15 seconds
const MAX_PAGES_PER_WINDOW = 45;

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
    lower === "/apple-icon.png"
  ) {
    return false;
  }
  if (isStreamOnlyPortfolioAsset(lower)) {
    return true;
  }
  return /\.(png|jpe?g|webp|avif)$/i.test(lower);
}

export function isLocalhostIp(ip: string, hostHeader: string): boolean {
  const cleanHost = (hostHeader || "").split(":")[0].toLowerCase();
  if (cleanHost === "localhost" || cleanHost === "127.0.0.1") return true;
  return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
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
    "/residential":
      "Residential Construction & Remodeling Division: Whole-home renovations, custom kitchens & baths, architectural roofing, siding/windows/doors, structural additions, concrete & foundations, and 24/7 fire & water damage restoration.",
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
  now?: number;
}

export function evaluateSiteShield(input: EvaluateRequestInput): ShieldDecision {
  const now = input.now ?? Date.now();
  const pathname = input.pathname || "/";
  const method = (input.method || "GET").toUpperCase();
  const ua = input.userAgent || "";
  const isLocal = isLocalhostIp(input.clientIp, input.host);
  const state = getIpState(input.clientIp || "unknown", now);

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
    if (!isLocal && state.invalidPosts >= 3) {
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

  // 7. Page burst rate limit against rapid manual/automated crawlers
  if (!isLocal && !pathname.startsWith("/_next/") && !pathname.startsWith("/api/")) {
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
