// ── Rate limiting (per IP) ────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const WINDOW_MS = 60 * 1000;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ── Rate limiting (per email) — same email blocked for 1 hour ─────────────────
const emailLimitMap = new Map<string, number>();

export function checkEmailLimit(email: string): boolean {
  const now = Date.now();
  const lastSent = emailLimitMap.get(email.toLowerCase());
  if (lastSent && now - lastSent < 60 * 60 * 1000) return false;
  emailLimitMap.set(email.toLowerCase(), now);
  return true;
}

// ── Input sanitization ────────────────────────────────────────────────────────
export function sanitize(value: unknown, maxLen = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen).replace(/<[^>]*>/g, "").replace(/[<>'"]/g, "");
}

// ── Origin validation ─────────────────────────────────────────────────────────
export function validateOrigin(origin: string | null): boolean {
  if (!origin) return true;
  const allowed = ["https://taycoturnkey.com", "https://www.taycoturnkey.com", "http://localhost:3001", "http://localhost:3000"];
  return allowed.some((o) => origin.startsWith(o));
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
