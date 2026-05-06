// components/RichPostcardMallCard.tsx
// Session 120 — Home-only rich variant of <PostcardMallCard>. Folds the mall
// hero photo + search bar primitives INTO the postcard card so the top of
// Home reads as one card-stock unit instead of three stacked rectangles.
//
// Slim <PostcardMallCard> stays alive in app/(tabs)/layout.tsx for Map +
// Saved (option b2 — separate mounts per surface). Layout suppresses its
// slim mount on Home so this rich card is the only postcard on the page.
//
// Design intent (final state):
//   - V1 mockup (docs/mockups/postcard-rich-card-v1.html) locked the
//     structural shape: photo banner above text+affordance row, search bar
//     pill at the bottom. Photo inset 14px from card sides + bottom with
//     8px corner radius (NOT bleeding to the card edge).
//   - V2 mockup (docs/mockups/postcard-rich-card-v2.html) explored a
//     "select location" Dancing Script label + hand-drawn arrow + dashed-
//     border green stamp as the change-location affordance. iPhone QA call:
//     "just isn't landing." Retired in V3.
//   - V3 mockup (docs/mockups/postcard-rich-card-v3.html, Frame β picked):
//     replaces the script + arrow + stamp constellation with a single
//     compact pill in the upper-right of the top row. Pill borrows the
//     DistancePill (R17) visual vocabulary verbatim — paper-warm bg,
//     1px ink-hairline border, 999px radius, FONT_SYS 10/700/0.12em
//     letter-spacing/uppercase, ink-muted color — with a chevron after
//     the count to read as button-not-info.
//   - Mall name in Lora 22px with measure-and-shrink to 16px (same primitive
//     as slim card) so any current mall name fits one row.
//   - Pill copy: "X Locations ›" (count + chevron). Same copy whether a
//     specific mall is picked or all-Kentucky scope is active — the action
//     is the same (tap → /map to change scope).
//   - Search bar embedded at the bottom of the card. R16 SearchBar
//     primitive untouched; the card just composes it.
//
// Empty state: when `mall === "all-kentucky"` OR a specific mall has no
// hero_image_url, drop the photo region entirely. Eyebrow + name + address
// + pill + search bar all stay.
//
// Tap target: the entire non-search region (top row + photo) is wrapped in
// a single <button> routing to /map. The pill is a child <span> inside the
// button — its visual treatment communicates affordance, not its own click
// handler. Search bar is a sibling of the button so input clicks don't
// bubble to the change-location handler.

"use client";

import * as React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";
import SearchBar from "./SearchBar";
import type { Mall } from "@/types/treehouse";

type MallScope =
  | Pick<Mall, "id" | "slug" | "name" | "address" | "city" | "state" | "zip_code" | "hero_image_url">
  | "all-kentucky";

interface RichPostcardMallCardProps {
  mall:                 MallScope;
  /** Total active locations — drives the pill copy "X Locations ›". */
  locationCount:        number;
  /** Override for the all-kentucky subtitle. Defaults to a generic count. */
  allKentuckySubtitle?: string;
  /** Routes to /map on tap (entire non-search region). */
  onTap?:               () => void;
  /** Search bar passthrough — wired by Home to its R16 ?q= URL state. */
  searchInitialQuery?:  string;
  onSearchChange:       (q: string) => void;
  searchPlaceholder?:   string;
}

const ALL_KENTUCKY_DEFAULT = "Kentucky";

// Fluid font-size bounds for the mall name — same primitive as the slim card.
// Long names step down 1px at a time until they fit on a single line.
const NAME_FONT_MAX = 22;
const NAME_FONT_MIN = 16;

export default function RichPostcardMallCard({
  mall,
  locationCount,
  allKentuckySubtitle,
  onTap,
  searchInitialQuery,
  onSearchChange,
  searchPlaceholder,
}: RichPostcardMallCardProps) {
  const isAllKentucky = mall === "all-kentucky";
  const name      = isAllKentucky ? "All Kentucky Locations" : mall.name;
  const photoUrl  = isAllKentucky ? null : (mall.hero_image_url ?? null);
  const showPhoto = photoUrl !== null;

  // Subtitle: full street + city + state + zip from mall.address (the seed
  // pipeline pre-composes these). Falls back to component join only if a
  // mall row was created before that pipeline. All-kentucky uses caller-
  // provided subtitle (typically "X active locations · Kentucky") or a
  // minimal default.
  const subtitle = isAllKentucky
    ? (allKentuckySubtitle ?? ALL_KENTUCKY_DEFAULT)
    : (mall.address ?? [mall.city, mall.state, mall.zip_code].filter(Boolean).join(", "));

  // Mall name fluid font-size — measure-and-shrink. Same pattern as the
  // slim PostcardMallCard.tsx; locks the name to a single line for any
  // current mall in the active set.
  const nameRef = useRef<HTMLDivElement>(null);
  const [nameFontSize, setNameFontSize] = useState(NAME_FONT_MAX);
  useLayoutEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    let size = NAME_FONT_MAX;
    el.style.fontSize = `${size}px`;
    while (el.scrollWidth > el.clientWidth && size > NAME_FONT_MIN) {
      size -= 1;
      el.style.fontSize = `${size}px`;
    }
    setNameFontSize(size);
  }, [name]);

  const interactive   = typeof onTap === "function";
  const pillLabel     = `${locationCount} ${locationCount === 1 ? "Location" : "Locations"}`;

  return (
    <div
      style={{
        position:        "relative",
        background:      v1.postcardBg,
        border:          `1px solid ${v1.postcardBorder}`,
        borderRadius:    12,
        boxShadow:       v1.shadow.postcard,
        overflow:        "hidden",
      }}
    >
      {/* Subtle paper texture overlay — composed of two radial gradients.
          Mirrors the slim card's texture so the visual vocabulary stays
          consistent across surfaces. */}
      <div
        aria-hidden="true"
        style={{
          position:      "absolute",
          inset:         0,
          pointerEvents: "none",
          background: [
            "radial-gradient(ellipse at 18% 25%, rgba(255,255,255,0.18) 0%, transparent 40%)",
            "radial-gradient(ellipse at 82% 75%, rgba(42,26,10,0.05) 0%, transparent 50%)",
          ].join(", "),
          borderRadius: 12,
        }}
      />

      {/* Tap target — covers everything ABOVE the search bar. Top row
          (text + pill) and the photo banner are both inside this button
          so taps anywhere except on the search input route to /map. */}
      <button
        type="button"
        onClick={onTap}
        disabled={!interactive}
        style={{
          display:                  "block",
          width:                    "100%",
          padding:                  0,
          margin:                   0,
          border:                   "none",
          background:               "transparent",
          cursor:                   interactive ? "pointer" : "default",
          textAlign:                "left",
          WebkitTapHighlightColor:  "transparent",
          position:                 "relative",
          zIndex:                   1,
        }}
      >
        {/* TOP BLOCK — V3.1 dial. Layout was a single flex row [text-block |
            pill] which let the pill constrain the text-block's column width
            for ALL three rows (eyebrow + name + address). Mall names like
            "Copper Awning Flea Market" lost ~20% of available width to the
            pill column and the fluid font shrunk 22 → 16 just to fit.
            Now the pill sits ONLY in the eyebrow row (flex space-between);
            the mall name + address are siblings BELOW that row and span
            the full card content width. Mall names that fit at 22px stay
            at 22px; only genuinely-long names hit measure-and-shrink. */}
        <div style={{ padding: "14px 14px 0" }}>
          {/* Eyebrow row — short eyebrow text on the left, change-location
              pill on the right. Eyebrow trimmed to "from:" per David's
              call ("just too much text competing"); matches the slim card
              vocabulary verbatim. */}
          <div
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              gap:            10,
              marginBottom:   4,
            }}
          >
            <div
              style={{
                fontFamily: FONT_LORA,
                fontStyle:  "italic",
                fontSize:   17,
                color:      v1.inkMuted,
                lineHeight: 1,
              }}
            >
              from:
            </div>

            {/* CHANGE-LOCATION PILL — DistancePill (R17) vocabulary as a
                tap affordance. Renders as a <span> inside the parent
                <button>; nested buttons invalid HTML. */}
            <span
              style={{
                flexShrink:     0,
                display:        "inline-flex",
                alignItems:     "center",
                gap:            5,
                background:     "#ede6d5",
                border:         `1px solid ${v1.inkHairline}`,
                borderRadius:   999,
                padding:        "5px 10px 5px 12px",
                fontFamily:     FONT_SYS,
                fontSize:       10,
                fontWeight:     700,
                letterSpacing:  "0.12em",
                textTransform:  "uppercase",
                color:          v1.inkMuted,
                whiteSpace:     "nowrap",
                lineHeight:     1.2,
              }}
            >
              {pillLabel}
              <svg
                width={9}
                height={9}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </div>

          {/* Mall name — full card content width. Fluid font measure-and-
              shrink stays as the safety net for unusually-long names. */}
          <div
            ref={nameRef}
            style={{
              fontFamily:    FONT_LORA,
              fontWeight:    500,
              fontSize:      nameFontSize,
              color:         v1.inkPrimary,
              lineHeight:    1.25,
              letterSpacing: "-0.005em",
              margin:        0,
              whiteSpace:    "nowrap",
              overflow:      "hidden",
              textOverflow:  "ellipsis",
              paddingBottom: 2,
            }}
          >
            {name}
          </div>

          {/* Address — full card content width. Pin icon + truncate. */}
          <div
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        6,
              color:      v1.inkMid,
              fontFamily: FONT_SYS,
              fontSize:   12,
              lineHeight: 1.3,
              minWidth:   0,
            }}
          >
            <MapPin size={12} strokeWidth={2.0} style={{ flexShrink: 0 }} />
            <span
              style={{
                overflow:     "hidden",
                textOverflow: "ellipsis",
                whiteSpace:   "nowrap",
                minWidth:     0,
              }}
            >
              {subtitle}
            </span>
          </div>
        </div>

        {/* PHOTO BANNER — only when we have a real mall hero. All-kentucky
            scope and malls without hero_image_url drop this region; the
            card collapses to text + pill + search. */}
        {showPhoto && (
          <div
            style={{
              position:     "relative",
              height:       180,
              margin:       "14px 14px 0",
              borderRadius: 8,
              overflow:     "hidden",
              background:   v1.postit,
              boxShadow:    "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <img
              src={photoUrl}
              alt=""
              style={{
                position:       "absolute",
                inset:          0,
                width:          "100%",
                height:         "100%",
                objectFit:      "cover",
                objectPosition: "center",
              }}
            />
          </div>
        )}
      </button>

      {/* SEARCH BAR — sibling of the tap-target button so input clicks
          don't bubble to the change-location handler. R16 primitive
          (R16 D-locked behavior preserved: debounced 200ms onChange,
          custom green caret on empty+focused, etc.) is fully untouched
          here. */}
      <div style={{ padding: "12px 14px 14px", position: "relative", zIndex: 1 }}>
        <SearchBar
          initialQuery={searchInitialQuery}
          placeholder={searchPlaceholder}
          onChange={onSearchChange}
        />
      </div>
    </div>
  );
}
