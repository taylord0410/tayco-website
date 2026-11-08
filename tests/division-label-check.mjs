// Taylord, 7-nov-2026, rule 6 of the division redesign: once a category is selected, its name does
// not appear again in any title, service, card or photo of that page.
//
// Reads the HTML the server actually sends, so it does not depend on how the components are built:
//   BASE_URL=http://localhost:3000 node tests/division-label-check.mjs
// Allowed: the page's own <h1>, the first link to the page itself (its pill in the category selector),
// <head>, <header>, <nav> and <footer>. Any other card or link naming the page's own division counts:
// the selector is the only navigation the page needs (HUB, 8-nov). Everything else in the body is
// checked as visible text; the alt, aria-label and title attributes fail only when they repeat the
// name. Exit code 1 lists every place the name still appears.
const base = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

// Synonyms count too: swapping the name for another word for it hides the repetition, it does not
// remove it (HUB, 8-nov: «Multi-Story» in place of «Multifamily»).
const DIVISIONS = {
  'single-family': /\bsingle[\s-]?family\b|\bSFH\b/i,
  multifamily: /\bmulti[\s-]?family\b|\bmulti[\s-]?unit\b|\bmulti[\s-]?stor(?:e?y|ies)\b/i,
  townhomes: /\btown[\s-]?(?:home|house)s?\b|\brow[\s-]?(?:home|house)s?\b|\b(?:row|attached)[\s-]?residen(?:ce|ces|tial)\b/i,
  commercial: /\bcommercial\b/i,
};

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');

function stripAllowed(html, slug) {
  let body = html.replace(/<head[\s\S]*?<\/head>/i, '');
  for (const tag of ['script', 'style', 'noscript', 'template', 'svg', 'header', 'nav', 'footer']) {
    body = body.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, 'gi'), ' ');
  }
  body = body.replace(/<h1\b[\s\S]*?<\/h1>/gi, ' ');
  // Only the first link to the page itself (not global: replace() then drops just one match).
  const selfLink = new RegExp(`<a\\b[^>]*href="(?:${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})?\\/${slug}(?:[?#][^"]*)?"[^>]*>[\\s\\S]*?<\\/a>`, 'i');
  return body.replace(selfLink, ' ');
}

function findings(html, slug, pattern) {
  const body = stripAllowed(html, slug);
  const out = [];
  // alt, aria-label and title are not seen; they describe the photo for search engines and screen
  // readers, so naming the category once is fine. Repeating it is the noise Taylord asked to remove.
  const global = new RegExp(pattern.source, 'gi');
  for (const m of body.matchAll(/\b(alt|aria-label|title)="([^"]*)"/gi)) {
    const value = decode(m[2]);
    if ((value.match(global) || []).length >= 2) out.push(`${m[1]} (repeats it): ${value}`);
  }
  const text = decode(body.replace(/<[^>]+>/g, '\n')).split('\n').map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
  for (const line of text) if (pattern.test(line)) out.push(`text: ${line.length > 140 ? `${line.slice(0, 137)}...` : line}`);
  return out;
}

let failed = 0;
for (const [slug, pattern] of Object.entries(DIVISIONS)) {
  const response = await fetch(`${base}/${slug}`, { headers: { Accept: 'text/html', 'User-Agent': 'Mozilla/5.0 (division-label-check)' } });
  if (response.status !== 200) {
    console.log(`✖ /${slug}: HTTP ${response.status}`);
    failed++;
    continue;
  }
  const hits = findings(await response.text(), slug, pattern);
  if (hits.length === 0) {
    console.log(`✔ /${slug}: the division name only appears in the page title and the category selector`);
    continue;
  }
  failed++;
  console.log(`✖ /${slug}: the division name appears ${hits.length} more time(s)`);
  const counts = new Map();
  for (const hit of hits) counts.set(hit, (counts.get(hit) || 0) + 1);
  for (const [hit, n] of counts) console.log(`    ${n > 1 ? `${n}× ` : ''}${hit}`);
}
process.exit(failed ? 1 : 0);
