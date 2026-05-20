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

export function sanitize(value: unknown, maxLen = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen).replace(/<[^>]*>/g, "").replace(/[<>'"]/g, "");
}

export function validateOrigin(origin: string | null): boolean {
  if (!origin) return true;
  const allowed = ["https://taycoturnkey.com", "https://www.taycoturnkey.com", "http://localhost:3001", "http://localhost:3000"];
  return allowed.some((o) => origin.startsWith(o));
}

// Bots submit forms in milliseconds — humans take at least 3 seconds
export function checkTiming(loadedAt: unknown): boolean {
  if (typeof loadedAt !== "number") return true;
  return Date.now() - loadedAt >= 3000;
}

// Block requests with no user-agent or known bot signatures
export function checkUserAgent(ua: string | null): boolean {
  if (!ua) return false;
  const blocked = ["curl", "wget", "python-requests", "scrapy", "bot", "crawl", "spider", "headless"];
  const lower = ua.toLowerCase();
  return !blocked.some((b) => lower.includes(b));
}

// Reject oversized payloads (max 20 KB)
export function checkPayloadSize(body: unknown): boolean {
  try {
    return JSON.stringify(body).length <= 20_000;
  } catch {
    return false;
  }
}
