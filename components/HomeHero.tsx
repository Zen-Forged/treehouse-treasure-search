// components/HomeHero.tsx
// Home (Explore) hero primitive — brand hero + embedded search.
//
// 33vh background-image of /home-hero.png (wordmark baked into the asset) +
// cream-fade overlay + embedded SearchBar anchored 16px from the hero bottom
// (Frame C composition from docs/home-hero-design.md).
//
// Sticky behavior (session 176 scroll-and-compress dial): position: sticky;
// top: -SCROLL_BEFORE_STICKY_PX. At scrollY=0 the hero sits at top:0 (full 33vh
// visible); the user scrolls SCROLL_BEFORE_STICKY_PX px and then the hero pins
// with its top offscreen (compressed, wordmark + SearchBar still visible).
//
// Session 207 — V1 Frame B mall-identity hero (band·photo·strip with mall name
// + open-now badge) was REVERTED per David ("revert to the hero version we had
// prior to implementing the store location information, so it just has the
// search bar"). HomeHero no longer takes a `mall` prop; the Explore hero is the
// plain brand hero + search regardless of scope (the mall picker lives in the
// MallPickerChip below the hero, restored in TabsChrome).
//
// Session 183 F2 Shape B — SearchBar URL state internalized via own Suspense
// boundary (SearchBarSlot). HomeHero accepts showSearch?: boolean; the caller
// signals "show search slot" rather than plumbing URL state through props.

"use client";

import * as React from "react";
import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import { v2 } from "@/lib/tokens";

interface Props {
  // Session 183 — when true, SearchBar slot mounts (Home only; Saved omits).
  showSearch?:        boolean;
  searchPlaceholder?: string;
}

const HERO_HEIGHT_VH = 33;

// Session 176 — scroll distance before the hero pins via negative-top sticky
// (session 177 dial 80 → 40).
const SCROLL_BEFORE_STICKY_PX = 40;

// Hero's VISIBLE bottom edge in viewport coords (consumers MallPickerChip +
// MallMapDrawer pin at/below this edge).
export const HERO_BOTTOM_EDGE =
  `calc(${HERO_HEIGHT_VH}vh - ${SCROLL_BEFORE_STICKY_PX}px)`;
const SEARCH_BOTTOM_OFFSET = 16;
const SEARCH_HORIZ_PADDING = 16;

// Session 183 F2 Shape B — SearchBar slot wraps the URL-aware read/write in
// its own component so the Suspense boundary contains the useSearchParams
// bailout to just this slot.
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
}: Props) {
  const sectionStyle: React.CSSProperties = {
    position: showSearch ? "sticky" : "static",
    ...(showSearch ? { top: -SCROLL_BEFORE_STICKY_PX, zIndex: 10 } : {}),
    width:              "100%",
    height:             `${HERO_HEIGHT_VH}vh`,
    // Layered backgrounds: cream-fade overlay (D9) on top, hero asset (D12)
    // below. Cover-sizing + center anchor keeps the baked-in wordmark visible
    // across iPhone SE → 14 Pro Max widths. Session 166 dial 8 — gradient rgba
    // migrates to (230,222,207) so the fade target matches v2.bg.tabs (#E6DECF)
    // for a continuous seam between hero bottom edge + the (tabs)/ page bg.
    backgroundImage:
      `linear-gradient(180deg,
        rgba(230,222,207,0) 0%,
        rgba(230,222,207,0) 78%,
        rgba(230,222,207,0.30) 90%,
        rgba(230,222,207,0.78) 98%,
        ${v2.bg.tabs} 100%),
       url('/home-hero.png')`,
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
