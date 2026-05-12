// lib/utils.ts
// Shared utility functions for the Treehouse ecosystem layer.

// ── Bookmark helpers ──────────────────────────────────────────────────────────

export const BOOKMARK_PREFIX = "treehouse_bookmark_";

export function flagKey(postId: string): string {
  return `${BOOKMARK_PREFIX}${postId}`;
}

export function loadBookmarkCount(): number {
  let count = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(BOOKMARK_PREFIX) && localStorage.getItem(key) === "1") count++;
    }
  } catch {}
  return count;
}

export function loadFollowedIds(): Set<string> {
  const followed = new Set<string>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(BOOKMARK_PREFIX) && localStorage.getItem(key) === "1") {
        followed.add(key.slice(BOOKMARK_PREFIX.length));
      }
    }
  } catch {}
  return followed;
}

// ── Booth bookmark helpers ────────────────────────────────────────────────────
// Parallel to the find-save helpers above; same value shape ("1") and the same
// raw-localStorage iteration (Safari ITP failure tolerated via try/catch).
// Prefixes are disjoint — `treehouse_booth_bookmark_` does not begin with
// `treehouse_bookmark_`, so cross-iteration is safe.

export const BOOTH_BOOKMARK_PREFIX = "treehouse_booth_bookmark_";

export function boothBookmarkKey(vendorId: string): string {
  return `${BOOTH_BOOKMARK_PREFIX}${vendorId}`;
}

export function loadBookmarkedBoothIds(): Set<string> {
  const ids = new Set<string>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(BOOTH_BOOKMARK_PREFIX) && localStorage.getItem(key) === "1") {
        ids.add(key.slice(BOOTH_BOOKMARK_PREFIX.length));
      }
    }
  } catch {}
  return ids;
}

export function loadBookmarkedBoothCount(): number {
  return loadBookmarkedBoothIds().size;
}

// ── Vendor color ──────────────────────────────────────────────────────────────

/**
 * Deterministic pastel background hue derived from a vendor's display name.
 * Used as a fallback when no hero image is set.
 */
export function vendorHueBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  const hues = [142, 168, 195, 220, 25, 340];
  return `hsl(${hues[h % hues.length]}, 18%, 82%)`;
}

// ── Maps ──────────────────────────────────────────────────────────────────────

export function mapsUrl(query: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

// ── Relative time ─────────────────────────────────────────────────────────────
// Review Board Finding 1B (session 153) — full-word format via
// Intl.RelativeTimeFormat. Sub-hour resolution added (minutes/hour).
// Browser-native i18n primitive; "auto" numeric style yields:
//   "just now" / "5 minutes ago" / "1 hour ago" / "1 day ago" /
//   "1 week ago" / "3 weeks ago" / "2 months ago" / "1 year ago".
// Future-dated input is clamped to "just now" rather than emitting
// "in 5 minutes" since post timestamps should never lead the wall clock.
export function formatTimeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso);
  if (isNaN(then.getTime())) return "";
  const now      = new Date();
  const diffMs   = then.getTime() - now.getTime(); // negative = past
  const diffSec  = Math.round(diffMs / 1000);
  const diffMin  = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay  = Math.round(diffHour / 24);
  const diffWeek = Math.round(diffDay / 7);
  const diffMon  = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);

  // Future or sub-minute → "just now". Avoids the awkward "in N seconds"
  // output and the just-posted edge case where clock skew can flip sign.
  if (diffSec > -60) return "just now";

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "long" });

  if (diffMin > -60)  return rtf.format(diffMin,  "minute");
  if (diffHour > -24) return rtf.format(diffHour, "hour");
  if (diffDay > -7)   return rtf.format(diffDay,  "day");
  if (diffWeek > -5)  return rtf.format(diffWeek, "week");
  if (diffMon > -12)  return rtf.format(diffMon,  "month");
  return rtf.format(diffYear, "year");
}

// ── Booth numeral sizing ──────────────────────────────────────────────────────
// v1.1l — auto-scale the 36px post-it numeral by digit count so long booth
// numbers don't overflow the 92×92px post-it. Ceiling at 6 digits (22px); any
// longer would need the post-it itself to grow, which ripples into the banner
// composition on Find Detail and Booth. Used on the post-it numeral only;
// inline pills on vendor rows use their own committed size (16px) regardless.
export function boothNumeralSize(boothNumber: string | null | undefined): number {
  if (!boothNumber) return 36;
  const len = boothNumber.length;
  if (len <= 4) return 36;
  if (len === 5) return 28;
  return 22; // 6+ digits
}
