// components/PostcardMallCard.tsx
// R10 (session 107) — postcard-style mall card. Persistent header primitive
// shipped to Home / Saved / Map. Reads as physical card stock with a
// postal stamp + wavy ink cancellation. The stamp glyph is contextual to
// the active BottomNav tab so the same card composes across surfaces.
//
// See docs/r10-location-map-design.md decisions D5–D19, D21 + the V4 mockup
// at docs/mockups/r10-location-map-v4.html. Provider-independent — no map
// SDK touched here.
//
// Two `mall` variants:
//   - A `Mall` row (Pick) → renders postal address.
//   - The literal "all-kentucky" → renders literary subtitle scope variant.
//
// Default `onTap` is a no-op for Arc 1; MallSheet wiring lands in Arc 2
// when the card replaces today's MallScopeHeader on Home + /flagged.

"use client";

import * as React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { Home as HomeIcon, MapPin, CircleUser } from "lucide-react";
import FlagGlyph from "./FlagGlyph";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

export type StampGlyph = "home" | "map" | "profile" | "saved";

type MallScope =
  | Pick<Mall, "id" | "slug" | "name" | "address" | "city" | "state" | "zip_code">
  | "all-kentucky";

interface PostcardMallCardProps {
  mall:       MallScope;
  stampGlyph: StampGlyph;
  onTap?:     () => void;
  /** Override for the all-kentucky subtitle — defaults to the literary copy. */
  allKentuckySubtitle?: string;
}

const ALL_KENTUCKY_DEFAULT = "5 active locations · Louisville to Lexington";

function StampGlyphIcon({ glyph }: { glyph: StampGlyph }) {
  // 26px / strokeWidth 2.0 to match BottomNav (D13).
  const sz = 26;
  switch (glyph) {
    case "home":    return <HomeIcon size={sz} strokeWidth={2.0} />;
    case "map":     return <MapPin   size={sz} strokeWidth={2.0} />;
    case "profile": return <CircleUser size={sz} strokeWidth={1.8} />;
    case "saved":   return <FlagGlyph size={sz} style={{ fill: v1.onGreen, color: v1.onGreen }} />;
  }
}

function CancellationInk() {
  // Five wavy quadratic Bézier paths — Q + T smooth-quad chains. Session 116
  // iPhone-QA dial: David's verbatim values. Width restored to 84
  // (paths back to original spans), shifted right (`right: 54` → 14) so
  // the cancellation overlaps the stamp body more heavily, opacity dialed
  // 0.28 → 0.08 so the heavy overlap reads as a watermark texture rather
  // than a competing element. Stroke color back to v1.inkPrimary —
  // opacity does the lightening work; the warm-mid color was redundant.
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

// Fluid font-size bounds for the mall name. Long names step down 1px at
// a time until they fit in one line, locking the card to a constant height.
const NAME_FONT_MAX = 22;
const NAME_FONT_MIN = 16;

export default function PostcardMallCard({
  mall,
  stampGlyph,
  onTap,
  allKentuckySubtitle,
}: PostcardMallCardProps) {
  const isAllKentucky = mall === "all-kentucky";

  const name = isAllKentucky ? "Kentucky locations" : mall.name;

  // Measure-and-shrink: render at NAME_FONT_MAX, step down by 1px until the
  // text fits on one line within the available width. Falls back to ellipsis
  // at NAME_FONT_MIN if even the smallest size overflows. Recomputes when
  // `name` changes (mall scope swap).
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
  // Session 110 fix — mall.address in the seed/add-mall.ts pipeline already
  // contains the full street + city + state + zip ("6541 KY-22, Crestwood,
  // KY 40014"). The previous join over [address, city, state, zip] then
  // duplicated everything after the street, producing
  // "6541 KY-22, Crestwood, KY 40014, Crestwood, KY, 40014" which got
  // ellipsis-clipped on the card. Use mall.address directly; fall back to
  // composed-from-parts only if address is missing.
  const subtitle = isAllKentucky
    ? (allKentuckySubtitle ?? ALL_KENTUCKY_DEFAULT)
    : (mall.address ?? [mall.city, mall.state, mall.zip_code].filter(Boolean).join(", "));

  // Session 110 — when no onTap is provided, render as a non-interactive
  // <div> instead of a tappable <button>. The /map surface omits onTap
  // because the card is informational there; affordances live on the new
  // contextual pill on the map. Without this, the card looked tappable
  // but did nothing — silently broken UX.
  const interactive = typeof onTap === "function";
  const Wrapper: React.ElementType = interactive ? "button" : "div";
  const wrapperProps = interactive
    ? { type: "button" as const, onClick: onTap }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      style={{
        position:        "relative",
        display:         "flex",
        alignItems:      "center",
        gap:             14,
        width:           "100%",
        padding:         16,
        background:      v1.postcardBg,
        border:          `1px solid ${v1.postcardBorder}`,
        borderRadius:    12,
        boxShadow:       v1.shadow.postcard,
        textAlign:       "left",
        cursor:          interactive ? "pointer" : "default",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* Subtle paper texture — composed of two radial gradients. */}
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

      {/* Text block — flex 1. Cancellation-ink clearance is applied per-row
          rather than on the whole block: only the NAME row sits in the ink's
          vertical band; "from:" is above the ink, address is below it, so
          both can extend full-width. Session 107 iPhone-QA refinement. */}
      <div
        style={{
          flex:           1,
          minWidth:       0,
          position:       "relative",
          zIndex:         1,
          display:        "flex",
          flexDirection:  "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT_LORA,
            fontStyle:  "italic",
            fontSize:   18,
            color:      v1.inkMuted,
            lineHeight: 1,
            margin:     "0 0 4px",
          }}
        >
          Viewing map of
        </div>
        <div
          ref={nameRef}
          style={{
            fontFamily:    FONT_LORA,
            fontWeight:    500,
            fontSize:      nameFontSize,
            color:         v1.inkPrimary,
            // Session 116 — fluid font-size + 1-line clamp locks card to a
            // constant height; long names step down NAME_FONT_MAX → MIN
            // until they fit. lineHeight 1.3 still required for Lora
            // descender clearance per feedback_lora_lineheight_minimum_for_clamp.
            lineHeight:    1.3,
            letterSpacing: "-0.005em",
            margin:        "0 0 6px",
            whiteSpace:    "nowrap",
            overflow:      "hidden",
            textOverflow:  "ellipsis",
            paddingBottom: 2,
            // Cancellation ink clearance — only the name row needs this since
            // the ink sits centered vertically in the card and overlaps the
            // mall name's right edge. Session 116 dial 28 → 14 to match the
            // halved cancellation width.
            paddingRight:  14,
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
          <span style={{
            overflow:     "hidden",
            textOverflow: "ellipsis",
            whiteSpace:   "nowrap",
            minWidth:     0,
          }}>
            {subtitle}
          </span>
        </div>
      </div>

      {/* Cancellation ink — overlaps the stamp's left edge per D18. */}
      <CancellationInk />

      {/* Square 52×52 stamp — vertically centered as a flex item (D12).
          Session 116 — interactive cards render a "SELECT LOCATION" eyebrow
          above the stamp so users discover the tap affordance. Absolutely
          positioned so the stamp's vertical placement (and the cancellation
          overlap with its left edge per D18) doesn't shift. */}
      <div
        style={{
          width:         52,
          height:        52,
          flexShrink:    0,
          alignSelf:     "center",
          padding:       4,
          background:    v1.paperWarm,
          border:        `1.5px dashed rgba(30,77,43,0.40)`,  // green-border per D14
          borderRadius:  4,
          display:       "flex",
          zIndex:        1,
          position:      "relative",
        }}
      >
        {interactive && (
          <div
            aria-hidden
            style={{
              position:       "absolute",
              bottom:         "calc(100% + 4px)",
              right:          0,
              fontFamily:     FONT_LORA,
              fontStyle:      "italic",
              fontSize:       11,
              color:          v1.inkMuted,
              lineHeight:     1,
              whiteSpace:     "nowrap",
              pointerEvents:  "none",
            }}
          >
            Location
          </div>
        )}
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
          <StampGlyphIcon glyph={stampGlyph} />
        </div>
      </div>
    </Wrapper>
  );
}
