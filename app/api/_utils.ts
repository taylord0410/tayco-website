// ── Rate limiting (per IP) ────────────────────────────────────────────────────
// In-memory, so it only applies within one serverless instance. For a hard limit
// add a Vercel Firewall rate-limit rule on /api/* (see SECURITY.md).
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const WINDOW_MS = 60 * 1000;

export function checkRateLimit(ip: string, bucket = "forms", limit = RATE_LIMIT): boolean {
  const now = Date.now();
  const key = `${bucket}:${ip}`;
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

// ── Email settings ────────────────────────────────────────────────────────────
// onboarding@resend.dev only delivers to the Resend account owner. To send from
// and to general@taycoturnkey.com, verify the domain in Resend and set these env vars.
export const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "tayroofing@gmail.com";
export const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM || "onboarding@resend.dev";

// ── Vendor documents (W9 / COI) ───────────────────────────────────────────────
// Stored as PRIVATE blobs: the client only ever gets the pathname, never a public URL.
export const VENDOR_DOC_TYPES = ["w9", "insurance"] as const;

export function isVendorDocPath(value: unknown): value is string {
  return typeof value === "string" && /^vendor-docs\/(w9|insurance)-[A-Za-z0-9_-]+\.(pdf|jpg|png)$/.test(value);
}

// ── Rate limiting (per email) — same email blocked for 24 hours ──────────────
const emailLimitMap = new Map<string, number>();

export function checkEmailLimit(email: string): boolean {
  const now = Date.now();
  const lastSent = emailLimitMap.get(email.toLowerCase());
  if (lastSent && now - lastSent < 24 * 60 * 60 * 1000) return false;
  emailLimitMap.set(email.toLowerCase(), now);
  return true;
}

// ── Input sanitization ────────────────────────────────────────────────────────
export function sanitize(value: unknown, maxLen = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen).replace(/<[^>]*>/g, "").replace(/[<>'"]/g, "");
}

// ── Origin validation ─────────────────────────────────────────────────────────
// Extra origins (e.g. a Vercel preview URL) can be added with ALLOWED_ORIGINS, comma-separated.
export function validateOrigin(origin: string | null): boolean {
  if (!origin) return true;
  const allowed = [
    "https://tayco.llc", "https://www.tayco.llc",
    "https://taycoturnkey.com", "https://www.taycoturnkey.com",
    "http://localhost:3001", "http://localhost:3000",
    ...(process.env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean),
  ];
  return allowed.includes(origin);
}

// ── Timing check — bots submit in milliseconds, humans take seconds ───────────
export function checkTiming(loadedAt: unknown): boolean {
  if (typeof loadedAt !== "number") return true;
  return Date.now() - loadedAt >= 3000;
}

// ── User-agent check — block known bot/scraper tools ─────────────────────────
export function checkUserAgent(ua: string | null): boolean {
  if (!ua) return false;
  const blocked = ["curl", "wget", "python-requests", "scrapy", "bot", "crawl", "spider", "headless", "libwww", "httpclient", "java/", "go-http"];
  const lower = ua.toLowerCase();
  return !blocked.some((b) => lower.includes(b));
}

// ── Payload size limit — reject oversized requests (max 20 KB) ───────────────
export function checkPayloadSize(body: unknown): boolean {
  try {
    return JSON.stringify(body).length <= 20_000;
  } catch {
    return false;
  }
}

// ── Disposable email domain blocklist ─────────────────────────────────────────
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "tempmail.com", "guerrillamail.com", "10minutemail.com",
  "throwam.com", "yopmail.com", "sharklasers.com", "guerrillamailblock.com",
  "grr.la", "guerrillamail.info", "guerrillamail.biz", "guerrillamail.de",
  "guerrillamail.net", "guerrillamail.org", "spam4.me", "trashmail.com",
  "trashmail.me", "trashmail.net", "dispostable.com", "maildrop.cc",
  "mailnull.com", "spamgourmet.com", "spamgourmet.net", "spamgourmet.org",
  "fakeinbox.com", "mailnesia.com", "spamhereplease.com", "spamherelots.com",
  "spamthisplease.com", "tempr.email", "discard.email", "spamfree24.org",
  "get2mail.fr", "jetable.fr.nf", "nospam.ze.tc", "nomail.xl.cx",
  "mega.zik.dj", "speed.1s.fr", "courriel.fr.nf", "moncourrier.fr.nf",
]);

export function checkEmailDomain(email: string): boolean {
  const domain = email.toLowerCase().split("@")[1] ?? "";
  return !DISPOSABLE_DOMAINS.has(domain);
}

// ── Spam keyword filter ───────────────────────────────────────────────────────
const SPAM_KEYWORDS = [
  "casino", "viagra", "cialis", "crypto", "bitcoin", "lottery", "winner",
  "congratulations", "click here", "free money", "make money fast",
  "weight loss", "diet pill", "seo service", "backlink", "increase traffic",
  "cheap loan", "payday loan", "work from home", "earn $", "100% free",
];

export function checkSpam(text: string): boolean {
  const lower = text.toLowerCase();
  return !SPAM_KEYWORDS.some((kw) => lower.includes(kw));
}
