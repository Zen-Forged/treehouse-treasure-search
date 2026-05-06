// components/RichPostcardMallCard.tsx
// Session 120 — Home-only rich variant of <PostcardMallCard>. Folds the mall
// hero photo + search bar primitives INTO the postcard card so the top of
// Home reads as one card-stock unit instead of three stacked rectangles.
//
// Slim <PostcardMallCard> stays alive in app/(tabs)/layout.tsx for Map +
// Saved (option b2 from the design conversation — separate mounts per
// surface). Layout suppresses its slim mount on Home so this rich card is
// the only postcard on the page.
//
// Design intent (V2 mockup at docs/mockups/postcard-rich-card-v2.html,
// Frame α / −4° rotation locked):
//   - Photo banner on top, inset 14px from card sides + bottom with 8px
//     corner radius (NOT bleeding to the card edge).
//   - Mall name in Lora 22px with measure-and-shrink to 16px so any current
//     mall name fits one row at our card width. Mirrors the slim card's
//     fluid pattern.
//   - "select location" stamp label in Dancing Script (FONT_SCRIPT, new
//     addition session 120), rotated −4° so it reads as a casual hand-drawn
//     mark. Used sparingly + intentionally — see lib/tokens.ts comment.
//   - Hand-drawn arrow with arc at the BOTTOM (curve bows down, not up).
//     Tail nuzzles directly under the "s" of "select" so the label + arrow
//     read as one continuous mark, not two components. Arrowhead points
//     into the stamp's left edge.
//   - Cancellation ink (5 wavy lines) at 0.10 opacity overlapping the
//     stamp's left edge — same primitive as the slim card.
//   - Search bar embedded at the bottom of the card. R16 SearchBar
//     primitive untouched; the card just composes it.
//
// Empty state (no photo): when `mall === "all-kentucky"` OR a specific mall
// has no hero_image_url, drop the photo region entirely. Eyebrow + name +
// address + stamp + search bar all stay. The card collapses to ~slim-plus-
// search-bar height instead of the full ~360px when a photo is present.
//
// Tap target: the entire non-search region (top row + photo) is the
// scope-change affordance, routing to /map. Search bar is a sibling, so
// taps on the search input never bubble to the change-location button.
//
// What this REPLACES on Home (app/(tabs)/page.tsx): the standalone
// <FeaturedBanner imageUrl={selectedMall?.hero_image_url}> mall-hero mount
// + the standalone <SearchBar> mount that previously stacked between the
// slim postcard card and the masonry grid. Both come out when this lands.

"use client";

import * as React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { v1, FONT_LORA, FONT_SYS, FONT_SCRIPT } from "@/lib/tokens";
import SearchBar from "./SearchBar";
import type { Mall } from "@/types/treehouse";

type MallScope =
  | Pick<Mall, "id" | "slug" | "name" | "address" | "city" | "state" | "zip_code" | "hero_image_url">
  | "all-kentucky";

interface RichPostcardMallCardProps {
  mall:                 MallScope;
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

function CancellationInk() {
  // 5 wavy quadratic Bézier paths over the stamp's left edge. Same SVG
  // primitive as PostcardMallCard.tsx — 84×38 viewBox, opacity 0.08, rotate
  // −6°. Repeated rather than extracted to keep the slim card a leaf.
  return (
    <svg
      viewBox="0 0 84 38"
      style={{
        position:      "absolute",
        right:         14,
        top:           "50%",
        transform:     "translateY(-50%) rotate(-6deg)",
        width:         84,
        height:        38,
        pointerEvents: "none",
        zIndex:        2,
        opacity:       0.08,
      }}
      aria-hidden="true"
    >
      <g
        fill="none"
        stroke={v1.inkPrimary}
        strokeWidth={1.6}
        strokeLinecap="round"
      >
        <path d="M 4,4 Q 14,0 24,4 T 44,4 T 64,4 T 80,4" />
        <path d="M 2,11 Q 12,7 22,11 T 42,11 T 62,11 T 82,11" />
        <path d="M 4,18 Q 14,14 24,18 T 44,18 T 64,18 T 80,18" />
        <path d="M 2,25 Q 12,21 22,25 T 42,25 T 62,25 T 82,25" />
        <path d="M 4,32 Q 14,28 24,32 T 44,32 T 64,32 T 80,32" />
      </g>
    </svg>
  );
}

function StampArrow() {
  // V2 final — 76×26 viewBox. Tail at (4, 4) under the "s" of "select"
  // (label is right-aligned with the stamp area, so the "s" sits at the
  // left end of the visible label text). Curve bows DOWN (control point
  // 36, 26 below both endpoints) into a deep dip, then sweeps up-right to
  // the arrowhead at (68, 14) just left of the stamp body.
  return (
    <svg
      viewBox="0 0 76 26"
      style={{
        position:      "absolute",
        right:         54,
        top:           -4,
        width:         76,
        height:        26,
        pointerEvents: "none",
        overflow:      "visible",
      }}
      fill="none"
      stroke={v1.inkMuted}
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M 4 4 Q 36 26, 68 14" />
      <path d="M 68 14 L 62 17" />
      <path d="M 68 14 L 63 10" />
    </svg>
  );
}

export default function RichPostcardMallCard({
  mall,
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

  const interactive = typeof onTap === "function";

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
          (text + stamp) and the photo banner are both inside this button
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
        {/* TOP ROW — text-block (left, flex 1) + stamp-area (right) */}
        <div
          style={{
            display:    "flex",
            alignItems: "flex-start",
            padding:    "14px 14px 0",
            gap:        8,
          }}
        >
          {/* Text block */}
          <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
            <div
              style={{
                fontFamily: FONT_LORA,
                fontStyle:  "italic",
                fontSize:   17,
                color:      v1.inkMuted,
                lineHeight: 1,
                margin:     "0 0 6px",
              }}
            >
              Discover finds from:
            </div>
            <div
              ref={nameRef}
              style={{
                fontFamily:    FONT_LORA,
                fontWeight:    500,
                fontSize:      nameFontSize,
                color:         v1.inkPrimary,
                lineHeight:    1.25,
                letterSpacing: "-0.005em",
                // margin-bottom 6 → 0 so name + address read as one grouped
                // component (David's iPhone QA call).
                margin:        0,
                whiteSpace:    "nowrap",
                overflow:      "hidden",
                textOverflow:  "ellipsis",
                paddingBottom: 2,
              }}
            >
              {name}
            </div>
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

          {/* STAMP AREA — script label, arrow, dashed-border stamp */}
          <div
            style={{
              position:      "relative",
              flexShrink:    0,
              display:       "flex",
              flexDirection: "column",
              alignItems:    "flex-end",
              paddingTop:    4,
            }}
          >
            <div
              style={{
                fontFamily:     FONT_SCRIPT,
                fontWeight:     500,
                fontSize:       18,
                color:          v1.inkMuted,
                lineHeight:     1.0,
                transform:      "rotate(-4deg)",
                transformOrigin: "right center",
                margin:         "0 6px 0 0",
                whiteSpace:     "nowrap",
              }}
            >
              select location
            </div>

            <div style={{ position: "relative", display: "flex", justifyContent: "flex-end", width: "100%" }}>
              <StampArrow />

              {/* Dashed-border green stamp */}
              <div
                style={{
                  width:        52,
                  height:       52,
                  flexShrink:   0,
                  padding:      4,
                  background:   v1.paperWarm,
                  border:       `1.5px dashed rgba(30,77,43,0.40)`,
                  borderRadius: 4,
                  display:      "flex",
                  position:     "relative",
                }}
              >
                <CancellationInk />
                <div
                  style={{
                    flex:           1,
                    background:     v1.green,
                    borderRadius:   2,
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    color:          v1.onGreen,
                  }}
                >
                  <MapPin size={26} strokeWidth={2.0} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PHOTO BANNER — only when we have a real mall hero. All-kentucky
            scope and malls without hero_image_url drop this region; the
            card collapses to text + stamp + search. */}
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
