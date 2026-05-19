// lib/socialUrls.ts
// Vendor profile enrichment Arc 1 (session 186) — URL normalization for
// vendor social fields (D8 in docs/vendor-profile-enrichment-design.md).
//
// Consumed by both:
//   - Client: EditBoothSheet field validation + pre-PATCH canonicalization
//   - Server: /api/vendor/profile defensive normalization against admin
//     tools / direct API callers / future ingest paths
//
// Per David's session-186 ask: vendors should be able to paste any shape
// they think of (bare handle, @handle, host+path, full URL with or without
// www, share/profile URLs, mobile/short variants) and the system stores
// one canonical shape.
//
// Canonical forms:
//   Instagram:  https://instagram.com/<path>   (no www, no trailing slash)
//   Facebook:   https://facebook.com/<path>[?query]   (preserves query for
//                 profile.php?id=... and share/X links; no www, no slash)
//
// Returns null when input cannot be parsed as a recognized Instagram /
// Facebook URL or handle. Callers (client + server) should treat null as a
// validation failure and surface to the user.

const IG_HANDLE_RE = /^[a-zA-Z0-9._]{1,30}$/;
const FB_HANDLE_RE = /^[a-zA-Z0-9._-]{1,50}$/;
const IG_HOSTS     = new Set(["instagram.com", "instagr.am"]);
const FB_HOSTS     = new Set(["facebook.com", "fb.com", "fb.me", "m.facebook.com"]);

// Heuristic for distinguishing "user typed a handle" vs "user typed a URL or
// domain." A slash anywhere = URL. A `.com|.net|.org|.am|.co|.io|.me|.us`
// TLD-like suffix = URL/domain candidate. Otherwise treat as bare handle so
// IG handles containing dots (e.g. `treehouse.finds`) parse correctly.
const TLD_HINT_RE = /\.(com|net|org|am|co|io|me|us)(\/|$)/i;

function looksLikeUrl(s: string): boolean {
  return s.includes("/") || TLD_HINT_RE.test(s);
}

function ensureScheme(s: string): string {
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function tryParseUrl(s: string): URL | null {
  try { return new URL(s); } catch { return null; }
}

/**
 * Normalize an Instagram handle/URL to canonical form:
 *   https://instagram.com/<handle-or-path>
 *
 * Accepts:
 *   - `@treehousefinds`
 *   - `treehousefinds`
 *   - `treehouse_finds` / `treehouse.finds` (dots + underscores in handles)
 *   - `instagram.com/treehousefinds`
 *   - `https://www.instagram.com/treehousefinds/`
 *   - `instagr.am/treehousefinds`
 *
 * Rejects:
 *   - Empty input
 *   - URLs to other domains (`twitter.com/foo`, etc.)
 *   - Bare handles that don't match IG handle shape (1-30 chars, [a-zA-Z0-9._])
 *   - IG root URL with no profile path (`https://instagram.com/`)
 *
 * Trailing slash stripped, hash fragment dropped, URL path preserved (so
 * post URLs like `instagram.com/p/abc123` also normalize cleanly).
 */
export function normalizeInstagramUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const stripped = trimmed.replace(/^@/, "");
  if (!stripped) return null;

  if (looksLikeUrl(stripped)) {
    const url = tryParseUrl(ensureScheme(stripped));
    if (!url) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!IG_HOSTS.has(host)) return null;
    const path = url.pathname.replace(/\/+$/, "");
    if (!path) return null;  // root URL has no profile context
    return `https://instagram.com${path}`;
  }

  // Bare handle path
  if (!IG_HANDLE_RE.test(stripped)) return null;
  return `https://instagram.com/${stripped}`;
}

/**
 * Normalize a Facebook URL/handle to canonical form:
 *   https://facebook.com/<path>[?query]
 *
 * Accepts:
 *   - `treehousefinds` / `@treehousefinds`
 *   - `facebook.com/treehousefinds`
 *   - `https://www.facebook.com/treehousefinds`
 *   - `facebook.com/profile.php?id=123456789`
 *   - `https://www.facebook.com/share/abc123`
 *   - `fb.me/treehousefinds`
 *   - `m.facebook.com/treehousefinds`
 *
 * Rejects:
 *   - Empty input
 *   - URLs to other domains
 *   - Bare handles that don't match FB page handle shape
 *     (1-50 chars, [a-zA-Z0-9._-])
 *   - FB root URL with no path
 *
 * Trailing slash stripped, hash fragment dropped, query string PRESERVED
 * (load-bearing for `profile.php?id=...` and `share/X` URLs).
 */
export function normalizeFacebookUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const stripped = trimmed.replace(/^@/, "");
  if (!stripped) return null;

  if (looksLikeUrl(stripped)) {
    const url = tryParseUrl(ensureScheme(stripped));
    if (!url) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!FB_HOSTS.has(host)) return null;
    const path = url.pathname.replace(/\/+$/, "");
    if (!path) return null;
    return `https://facebook.com${path}${url.search}`;
  }

  // Bare handle path — FB handles allow hyphens in addition to IG's set
  if (!FB_HANDLE_RE.test(stripped)) return null;
  return `https://facebook.com/${stripped}`;
}
