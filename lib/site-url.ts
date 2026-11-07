/**
 * Public origin of the site (e.g. https://tayco.llc), set at build time with NEXT_PUBLIC_SITE_URL.
 * Canonical links and the share card (og:image) are absolute URLs: without a known origin Next
 * would resolve them against localhost, so they are only emitted once this is set.
 */
function readSiteUrl(): URL | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url : undefined;
  } catch {
    return undefined;
  }
}

export const SITE_URL = readSiteUrl();

/** Share card served from /public; the site shield lets link-preview crawlers fetch this one file. */
export const OG_IMAGE = { url: "/og-image.jpg", width: 1200, height: 630 } as const;
