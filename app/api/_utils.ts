const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
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
