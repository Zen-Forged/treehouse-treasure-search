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
