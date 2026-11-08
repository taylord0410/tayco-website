/**
 * TAYCO's other public addresses send visitors to the official one (Randhy, 7-nov-2026: taycoturnkey.com).
 * The official origin is NEXT_PUBLIC_SITE_URL; with it unset nothing is redirected.
 *
 * Only page loads move (GET/HEAD outside /api/): logins, forms and the takeoff viewer keep working on
 * whichever address a session was opened on, and a POST is never turned into a GET by a redirect.
 * Hosts not listed here, such as Railway's own *.up.railway.app address, are left alone.
 */
export const ALIAS_HOSTS: readonly string[] = [
  "taycoturnkey.com",
  "www.taycoturnkey.com",
  "tayco.llc",
  "www.tayco.llc",
  "tayroofing.org",
  "www.tayroofing.org",
];

export interface CanonicalRedirectInput {
  method: string;
  host: string;
  pathname: string;
  search: string;
  siteUrl: string | undefined;
}

/** The URL to redirect to, or null when the request should be served where it is. */
export function canonicalRedirect({ method, host, pathname, search, siteUrl }: CanonicalRedirectInput): string | null {
  if (!siteUrl) return null;
  let official: URL;
  try {
    official = new URL(siteUrl);
  } catch {
    return null;
  }
  const verb = method.toUpperCase();
  if (verb !== "GET" && verb !== "HEAD") return null;
  if (pathname === "/api" || pathname.startsWith("/api/")) return null;
  const requested = host.trim().toLowerCase().replace(/:\d+$/, "");
  if (!requested || requested === official.hostname || !ALIAS_HOSTS.includes(requested)) return null;
  return `${official.origin}${pathname}${search}`;
}
