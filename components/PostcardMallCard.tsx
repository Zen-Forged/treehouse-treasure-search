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
  // Five wavy quadratic Bézier paths — Q + T smooth-quad chains. Coordinates
  // verbatim from V4 mockup so a side-by-side compare against the locked
  // mockup catches any drift. 84×38 viewBox; positioning + rotation are
  // applied on the wrapper SVG.
  return (
    <svg
      viewBox="0 0 84 38"
      style={{
        position:      "absolute",
        right:         54,    // overlaps stamp's left edge by ~14px (D18)
        top:           "50%",
        transform:     "translateY(-50%) rotate(-6deg)",
        width:         84,
        height:        38,
        pointerEvents: "none",
        zIndex:        2,
        // Session 107 iPhone QA dial — 0.42 → 0.28. Reads as old-postal-ink
        // cancellation rather than a UI element.
        opacity:       0.28,
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

export default function PostcardMallCard({
  mall,
  stampGlyph,
  onTap,
  allKentuckySubtitle,
}: PostcardMallCardProps) {
  const isAllKentucky = mall === "all-kentucky";

  const name = isAllKentucky ? "All Kentucky Locations" : mall.name;
  const subtitle = isAllKentucky
    ? (allKentuckySubtitle ?? ALL_KENTUCKY_DEFAULT)
    : [mall.address, mall.city, mall.state, mall.zip_code]
        .filter(Boolean)
        .join(", ");

  const handleTap = onTap ?? (() => { /* MallSheet wiring lands in Arc 2 */ });

  return (
    <button
      type="button"
      onClick={handleTap}
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
        cursor:          "pointer",
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
          from:
        </div>
        <div
          style={{
            fontFamily:    FONT_LORA,
            fontWeight:    500,
            fontSize:      22,
            color:         v1.inkPrimary,
            // Session 107 dial — name 26 → 22 + lineHeight 1.15 → 1.3 (was
            // clipping Lora descenders/ligatures on iPhone with -webkit-box +
            // WebkitLineClamp:2). 3rd firing of the pattern memorialized at
            // feedback_lora_lineheight_minimum_for_clamp; rule generalizes
            // beyond ≤14px to ANY clamped Lora.
            lineHeight:    1.3,
            letterSpacing: "-0.005em",
            margin:        "0 0 6px",
            display:               "-webkit-box",
            WebkitLineClamp:       2,
            WebkitBoxOrient:       "vertical",
            overflow:              "hidden",
            paddingBottom:         2,    // descender breathing room under the clamp
            // Cancellation ink clearance — only the name row needs this since
            // the ink sits centered vertically in the card and overlaps the
            // mall name's right edge.
            paddingRight:          28,
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

      {/* Square 52×52 stamp — vertically centered as a flex item (D12). */}
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
    </button>
  );
}
