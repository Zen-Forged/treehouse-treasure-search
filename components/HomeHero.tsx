// components/HomeHero.tsx
// Home hero primitive — Frame C composition from docs/home-hero-design.md.
//
// Composition: 33vh background-image hero (wordmark baked into asset) +
// cream-fade overlay gradient at the bottom + embedded SearchBar anchored
// 16px from hero bottom (Home only; Saved omits SearchBar per R18 lock).
//
// Sticky behavior (session 176 scroll-and-compress dial — BOUNDED revision
// of session 175 Option α; session 175 reversed session 164 D16-D19):
//   - Home (showSearch=true):  position: sticky; top: -SCROLL_BEFORE_STICKY_PX
//     At scrollY=0 hero sits at top:0 (full 33vh visible, chrome bubbles
//     overlay photograph as designed). User scrolls — hero scrolls UP with
//     content for SCROLL_BEFORE_STICKY_PX pixels. Once user has scrolled
//     past that threshold, sticky activates pinning hero with the top
//     SCROLL_BEFORE_STICKY_PX of hero offscreen. Visible pinned hero =
//     33vh - SCROLL_BEFORE_STICKY_PX (compressed but wordmark + SearchBar
//     still visible).
//   - Saved (showSearch=false): position: static; height: 33vh
//     Hero renders in document flow at top of page as identity beat;
//     scrolls away with content when user scrolls down. (Unchanged from
//     session 175 Option α — David's reference image for session 176.)
//
// Session 183 F2 Shape B — SearchBar URL state internalized via own
// Suspense boundary. David's session 182 iPhone QA finding 2 root cause:
// (tabs)/layout.tsx wrapped TabsChrome in <Suspense fallback={null}>;
// useSearchParams in TabsChrome forced Next.js 14 Suspense bailout. On
// warm-nav back to /, TabsChrome suspended → null fallback → entire
// floating chrome (HomeHero photo + Profile overlay + MallPickerChip)
// invisible until URL hydrated. Fix shape: split TabsChrome so non-URL
// chrome renders outside Suspense + URL-dependent code (SearchBar reads
// ?q / writes ?q) moves INSIDE HomeHero wrapped in its own Suspense.
// Now: hero photo + cream-fade paint synchronously regardless of URL
// hydration; only the SearchBar slot suspends briefly (contained to its
// own bottom-anchored 16px slot inside the hero — visually negligible).
//
// API change: HomeHero accepts showSearch?: boolean (was: searchQuery +
// onSearchChange optional). Caller no longer plumbs URL state through
// HomeHero's props — HomeHero owns the URL state for its own SearchBar
// slot.

"use client";

import * as React from "react";
import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import { v2 } from "@/lib/tokens";

interface Props {
  // Session 183 — simplified prop. When true, SearchBar slot mounts inside
  // hero's bottom-anchored position (Home only). When false/omitted, hero
  // renders as photo + cream-fade only (Saved per session 121 R18 D-lock).
  showSearch?:        boolean;
  searchPlaceholder?: string;
  // Session 207 #3 — David iPhone QA: on Explore, load the selected mall's
  // location image instead of the standard Treehouse hero; the Treehouse
  // hero (with baked-in wordmark) loads only when "All Kentucky locations"
  // is the scope (heroImageUrl null/omitted). Mall photos carry no wordmark
  // — that's intentional per the literal ask ("the mall location image loads
  // instead").
  heroImageUrl?:      string | null;
}

const HERO_HEIGHT_VH = 33;

// Session 176 — scroll distance allowed before hero pins via negative-top
// sticky. See session 177 dial — 80 → 40 (iPhone QA on v0.176.0 cut wordmark
// flush against URL bar at 80; 40 halves compression so wordmark breathes).
const SCROLL_BEFORE_STICKY_PX = 40;

// Session 176 — hero's VISIBLE bottom edge in viewport coordinates when the
// hero is sticky-pinned (Home, scrollY > SCROLL_BEFORE_STICKY_PX) OR when
// it sits at the top of document flow. Consumers (MallPickerChip + MallMap-
// Drawer, both Home-only) pin themselves at or below this edge.
export const HERO_BOTTOM_EDGE =
  `calc(${HERO_HEIGHT_VH}vh - ${SCROLL_BEFORE_STICKY_PX}px)`;
const SEARCH_BOTTOM_OFFSET = 16;
const SEARCH_HORIZ_PADDING = 16;

// Session 183 F2 Shape B — SearchBar slot wraps the URL-aware read/write
// in its own component so Suspense boundary contains the useSearchParams
// bailout to JUST this slot (visually a 16px-from-bottom inset bar that's
// briefly empty on warm-nav, surrounded by fully-painted hero photograph).
function SearchBarSlot({ placeholder }: { placeholder?: string }) {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const q            = searchParams.get("q") ?? "";

  const handleChange = useCallback((next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.trim().length > 0) params.set("q", next);
    else                        params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }, [router, searchParams]);

  return (
    <SearchBar
      initialQuery={q}
      placeholder={placeholder}
      onChange={handleChange}
    />
  );
}

export default function HomeHero({
  showSearch,
  searchPlaceholder,
  heroImageUrl,
}: Props) {
  // Session 207 #3 — scoped mall photo when present, else the brand hero.
  const heroSrc = heroImageUrl || "/home-hero.png";
  // Sticky on Home (showSearch=true), static on Saved (showSearch=false).
  // See file-top — preserved verbatim from session 175 Option α + session
  // 176 scroll-and-compress dial.
  const sectionStyle: React.CSSProperties = {
    position: showSearch ? "sticky" : "static",
    ...(showSearch ? { top: -SCROLL_BEFORE_STICKY_PX, zIndex: 10 } : {}),
    width:              "100%",
    height:             `${HERO_HEIGHT_VH}vh`,
    // Layered backgrounds: cream-fade overlay (D9) on top, hero asset
    // (D12) below. Cover-sizing + center anchor keeps the baked-in
    // wordmark visible across iPhone SE → 14 Pro Max widths.
    //
    // Session 166 dial 8 — gradient rgba migrates from (247,243,235) to
    // (230,222,207) so the fade target matches v2.bg.tabs (#E6DECF) for
    // continuous seam between hero bottom edge + (tabs)/ page bg.
    backgroundImage:
      `linear-gradient(180deg,
        rgba(230,222,207,0) 0%,
        rgba(230,222,207,0) 78%,
        rgba(230,222,207,0.30) 90%,
        rgba(230,222,207,0.78) 98%,
        ${v2.bg.tabs} 100%),
       url('${heroSrc}')`,
    backgroundSize:     "auto, cover",
    backgroundPosition: "center, center",
    backgroundRepeat:   "no-repeat",
    overflow:           "hidden",
  };

  const searchWrapStyle: React.CSSProperties = {
    position: "absolute",
    left:     SEARCH_HORIZ_PADDING,
    right:    SEARCH_HORIZ_PADDING,
    bottom:   SEARCH_BOTTOM_OFFSET,
    zIndex:   2,
  };

  return (
    <section style={sectionStyle} aria-label="Treehouse Finds">
      {showSearch && (
        <div style={searchWrapStyle}>
          {/* Suspense boundary CONTAINS useSearchParams bailout. Only this
              16px-anchored slot suspends on warm-nav URL hydration; hero
              photograph + cream-fade + wordmark all paint synchronously
              around it. */}
          <Suspense fallback={null}>
            <SearchBarSlot placeholder={searchPlaceholder} />
          </Suspense>
        </div>
      )}
    </section>
  );
}
