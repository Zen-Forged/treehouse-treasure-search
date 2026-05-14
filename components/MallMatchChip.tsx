// components/MallMatchChip.tsx
// Session 165 — Finding 5 (Shape A): when the SearchBar query matches an
// active mall's name OR city, surface a "Switch to {Mall} →" chip so the
// shopper can scope to that mall in one tap.
//
// David's iPhone QA on session 161 map enrichment refinement bundle:
// "Search functionality does not search within the expanded map (ie.
// typed crestwood user would expect the search to find location."
//
// The mall search was previously absent from the search domain — R16
// (session 105) wired tsvector + GIN index against posts (title + tags +
// caption). This chip extends search discoverability to mall locations
// without restructuring the search results UI: a single chip surfaces
// above the feed when the query contains-matches any active mall's name
// or city. Multiple matches show the first match per sort order (active
// malls are loaded alphabetical via getActiveMalls).
//
// Pure presentation primitive — owner passes the malls + query + current
// scope + onPick callback; the chip handles the in-memory match logic +
// renders the single best match. Returns null when no match — owner can
// always render <MallMatchChip /> and let it handle visibility.
//
// Rendered in two slots per Shape A spec:
//   1. Top of feed body (Home page) — visible when MallMapDrawer closed
//   2. Top of drawer content (MallMapDrawer) — visible when drawer open
//
// Both render the same primitive against the same query state read from
// useSearchParams. Mutually visible based on drawer state — user sees
// one at a time depending on what's on screen.

"use client";

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import PinGlyph from "@/components/PinGlyph";
import type { Mall } from "@/types/treehouse";
import { v2, FONT_LORA } from "@/lib/tokens";

interface MallMatchChipProps {
  /** Full active malls list (already loaded in parent state). */
  malls:         Mall[];
  /** Current SearchBar query string (raw, may be empty). */
  query:         string;
  /** Currently scoped mall id (null = all-Kentucky). Excluded from matches. */
  currentMallId: string | null;
  /** Tap handler — receives the matched mall. Parent handles scope-change +
   *  query-clear + drawer-close + analytics fire. */
  onPick:        (mall: Mall) => void;
}

/**
 * Contains-match a query against a mall's name OR city, case-insensitive.
 * Returns true if either field contains the query as a substring. Pure
 * function; safe to call in useMemo.
 */
function mallMatchesQuery(mall: Mall, q: string): boolean {
  const needle = q.toLowerCase();
  if (mall.name.toLowerCase().includes(needle)) return true;
  if (mall.city && mall.city.toLowerCase().includes(needle)) return true;
  return false;
}

export default function MallMatchChip({
  malls,
  query,
  currentMallId,
  onPick,
}: MallMatchChipProps) {
  const match = useMemo(() => {
    const q = query.trim();
    // Require 2+ chars to avoid surfacing chip on every single-keystroke (the
    // chip is the LOUD discoverability signal; 1-char matches would surface
    // it constantly for common letters across all 29 active malls).
    if (q.length < 2) return null;
    return malls.find((m) =>
      m.id !== currentMallId && mallMatchesQuery(m, q)
    ) ?? null;
  }, [malls, query, currentMallId]);

  if (!match) return null;

  return (
    <button
      type="button"
      onClick={() => onPick(match)}
      style={{
        display:         "inline-flex",
        alignItems:      "center",
        gap:             8,
        padding:         "8px 14px",
        borderRadius:    999,
        background:      v2.surface.card,
        border:          `1px solid ${v2.accent.green}`,
        // Subtle drop shadow lifts the chip off the basemap / feed bg so it
        // reads as an interactive affordance, not chrome.
        boxShadow:       "0 2px 6px rgba(42,26,10,0.12)",
        cursor:          "pointer",
        WebkitTapHighlightColor: "transparent",
        // Reset native button styles that would otherwise stack with our own.
        font:            "inherit",
        color:           v2.text.primary,
      }}
      aria-label={`Switch to ${match.name}`}
    >
      <PinGlyph size={16} color={v2.accent.green} />
      <span
        style={{
          // Cormorant italic matches the project's "elegant identity"
          // vocabulary used on cartographic eyebrows + post-it stamps.
          // The chip is a place-identity affordance; italic Cormorant
          // signals "this is a real place" rather than a utility chip.
          fontFamily: FONT_LORA,
          fontStyle:  "italic",
          fontSize:   16,
          fontWeight: 500,
          color:      v2.text.primary,
        }}
      >
        Switch to {match.name}
      </span>
      <ArrowRight
        size={16}
        strokeWidth={1.8}
        aria-hidden="true"
        style={{ color: v2.accent.green, flexShrink: 0 }}
      />
    </button>
  );
}
