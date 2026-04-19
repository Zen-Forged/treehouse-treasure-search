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
