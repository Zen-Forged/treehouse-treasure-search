// components/HomeHero.tsx
// Home (Explore) hero primitive.
//
// Two modes (session 207 — V1 Frame B, docs/mockups/explore-mall-hero-v1.html):
//   - Mall scoped (mall != null): the V1 Frame B mall-identity composition —
//     a cream band (Treehouse wordmark) · the mall's photo · a solid bottom
//     strip carrying the mall name (the scope dropdown → /map), the open-now
//     MallHoursBadge, and the search bar baked in as the strip's bottom row.
//     Address / phone / website are intentionally OUT of this first build.
//   - All-Kentucky (mall == null): the plain brand hero — 33vh background-image
//     of /home-hero.png (wordmark baked into the asset) + cream-fade overlay +
//     embedded SearchBar (Frame C composition from docs/home-hero-design.md).
//
// Frame B sticky behavior: position: sticky; top: 0 (full pin, no collapse) so
// the wordmark band never clips and the scope + search stay reachable on scroll.
// The all-Kentucky brand hero keeps the session-176 scroll-and-compress
// (top: -SCROLL_BEFORE_STICKY_PX) behavior unchanged.
//
// Session 183 F2 Shape B — SearchBar URL state internalized via own Suspense
// boundary (SearchBarSlot). HomeHero accepts showSearch?: boolean; the caller
// signals "show search slot" rather than plumbing URL state through props.

"use client";

import * as React from "react";
import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import MallHoursBadge from "@/components/MallHoursBadge";
import { googleListingUrl } from "@/lib/mapsDeepLink";
import { v2, FONT_CORMORANT } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

interface Props {
  // Session 183 — when true, SearchBar slot mounts (Home only; Saved omits).
  showSearch?:        boolean;
  searchPlaceholder?: string;
  // Session 207 — when a specific mall is the Explore scope, render the V1
  // Frame B mall-identity composition. null (all-Kentucky scope) → brand hero.
  mall?:              Mall | null;
}

const HERO_HEIGHT_VH = 33;

// Session 176 — scroll distance before the all-Kentucky brand hero pins via
// negative-top sticky (session 177 dial 80 → 40).
const SCROLL_BEFORE_STICKY_PX = 40;

// Hero's VISIBLE bottom edge in viewport coords for the all-Kentucky brand
// hero (consumers MallPickerChip + MallMapDrawer pin at/below this edge).
export const HERO_BOTTOM_EDGE =
  `calc(${HERO_HEIGHT_VH}vh - ${SCROLL_BEFORE_STICKY_PX}px)`;
const SEARCH_BOTTOM_OFFSET = 16;
const SEARCH_HORIZ_PADDING = 16;

// Frame B chrome (session 207).
const STRIP_CREAM = v2.surface.warm;
const HAIRLINE    = "1px solid rgba(42,26,10,0.10)";

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
  mall,
}: Props) {
  const router = useRouter();

  // ── Frame B — mall-scoped mall-identity hero ────────────────────────────
  if (showSearch && mall) {
    const photoSrc  = mall.hero_image_url || null;
    const hoursHref = googleListingUrl(
      [mall.name, mall.address, mall.city].filter(Boolean).join(", ")
    );

    const sectionStyle: React.CSSProperties = {
      position:      "sticky",
      top:           0,
      zIndex:        10,
      width:         "100%",
      height:        `${HERO_HEIGHT_VH}vh`,
      overflow:      "hidden",
      display:       "flex",
      flexDirection: "column",
      background:    STRIP_CREAM,
    };

    return (
      <section style={sectionStyle} aria-label="Treehouse Finds">
        {/* Band — wordmark embedded at top (David's session-207 ask). */}
        <div style={{
          flex: "none", background: STRIP_CREAM, borderBottom: HAIRLINE,
          textAlign: "center", padding: "8px 14px",
        }}>
          <img
            src="/wordmark.png"
            alt="Treehouse Finds"
            style={{ height: 40, width: "auto", display: "inline-block" }}
          />
        </div>

        {/* Photo — the selected mall's image; warm fallback if absent. */}
        <div style={{
          flex: 1, minHeight: 0, backgroundColor: "#5b4a36",
          ...(photoSrc ? {
            backgroundImage:    `url('${photoSrc}')`,
            backgroundSize:     "cover",
            backgroundPosition: "center",
          } : {}),
        }} />

        {/* Strip — scope dropdown + open-now + search baked in. */}
        <div style={{
          flex: "none", background: STRIP_CREAM, borderTop: HAIRLINE,
          padding: "11px 14px 13px", display: "flex", flexDirection: "column", gap: 8,
        }}>
          {/* Mall name + caret = the scope dropdown → /map (replaces the
              separate MallPickerChip in mall-scoped mode). */}
          <button
            onClick={() => router.push("/map")}
            aria-label={`Change location — currently ${mall.name}`}
            style={{
              background: "none", border: "none", padding: 0, margin: 0,
              textAlign: "left", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5, maxWidth: "100%",
              fontFamily: FONT_CORMORANT, fontStyle: "italic", fontWeight: 500,
              fontSize: 22, lineHeight: 1.1, color: v2.text.primary,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {mall.name}
            </span>
            <span style={{ flex: "none", fontSize: 13, color: v2.text.muted, fontStyle: "normal" }}>▾</span>
          </button>

          {/* Open-now badge — falls back to the Hours-on-Google link internally
              (returns null only when there is no hours data at all). */}
          <MallHoursBadge
            hoursJson={mall.hours_json}
            timezone={mall.hours_timezone}
            businessStatus={mall.business_status}
            href={hoursHref}
            mallSlug={mall.slug}
            surface="explore_hero"
          />

          {/* Search baked into the strip as its bottom row. */}
          <Suspense fallback={null}>
            <SearchBarSlot placeholder={searchPlaceholder} />
          </Suspense>
        </div>
      </section>
    );
  }

  // ── All-Kentucky brand hero (unchanged Frame C composition) ─────────────
  const brandSectionStyle: React.CSSProperties = {
    position: showSearch ? "sticky" : "static",
    ...(showSearch ? { top: -SCROLL_BEFORE_STICKY_PX, zIndex: 10 } : {}),
    width:              "100%",
    height:             `${HERO_HEIGHT_VH}vh`,
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
    <section style={brandSectionStyle} aria-label="Treehouse Finds">
      {showSearch && (
        <div style={searchWrapStyle}>
          <Suspense fallback={null}>
            <SearchBarSlot placeholder={searchPlaceholder} />
          </Suspense>
        </div>
      )}
    </section>
  );
}
