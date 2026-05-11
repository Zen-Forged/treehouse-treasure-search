// components/PostcardMallCard.tsx
// R10 (session 107) — postcard-style mall card. Persistent header primitive
// shipped to /map (originally Home + Saved + Map; Home + Saved migrated to
// <RichPostcardMallCard> at session 120, leaving slim card on /map only).
//
// Session 123 — postal stamp + wavy ink cancellation retire. The card now
// reads as plain card-stock chrome: eyebrow + mall name + address. Reverses
// session-107 R10 D-rules (stamp identity is part of the card vocabulary)
// and session-116 cancellation-ink David verbatim values (right:14 /
// opacity 0.08 / stroke v1.inkPrimary). Postal-stamp identity was deeply
// iterated through ~6 sessions of refinement; David's call: now that the
// card is on /map only, the chrome no longer needs to carry the postcard
// vocabulary — the map itself IS the postcard. Rich card on Home was
// already without stamp/ink (session 120 V3 retired the cancellation +
// dashed-stamp from rich variant); this commit closes the parallel on
// the slim card.
//
// Side-effects of stamp retire:
//   - StampGlyph type drops (no consumers post-retire).
//   - StampGlyphIcon helper drops (uses retired stamp).
//   - CancellationInk drops.
//   - "Location" tap-affordance eyebrow drops (the stamp was the visual
//     anchor for the eyebrow; without the stamp, the eyebrow has nothing
//     to label).
//   - paddingRight ink-clearance on the name row drops.
//   - Outer wrapper drops flex-row + gap (no stamp = no second child).
//
// See docs/r10-location-map-design.md for the prior stamp design intent.

"use client";

import * as React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { v1, v2, FONT_CORMORANT, FONT_INTER } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

type MallScope =
  | Pick<Mall, "id" | "slug" | "name" | "address" | "city" | "state" | "zip_code">
  | "all-kentucky";

interface PostcardMallCardProps {
  mall:       MallScope;
  onTap?:     () => void;
  /** Override for the all-kentucky subtitle — defaults to the literary copy. */
  allKentuckySubtitle?: string;
}

const ALL_KENTUCKY_DEFAULT = "5 active locations · Louisville to Lexington";

// Fluid font-size bounds for the mall name. Long names step down 1px at
// a time until they fit in one line, locking the card to a constant height.
const NAME_FONT_MAX = 22;
const NAME_FONT_MIN = 16;

export default function PostcardMallCard({
  mall,
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
        width:           "100%",
        padding:         16,
        background:      v2.surface.card,
        border:          `1px solid ${v2.border.light}`,
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

      {/* Text block — full card width post-stamp-retire. */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontFamily: FONT_CORMORANT,
            fontStyle:  "italic",
            fontSize:   18,
            color:      v2.text.muted,
            lineHeight: 1,
            margin:     "0 0 4px",
          }}
        >
          Viewing map of
        </div>
        <div
          ref={nameRef}
          style={{
            fontFamily:    FONT_CORMORANT,
            fontWeight:    500,
            fontSize:      nameFontSize,
            color:         v2.text.primary,
            // Lora/Cormorant descender clearance — clamp + overflow:hidden requires
            // lineHeight 1.3+ per feedback_lora_lineheight_minimum_for_clamp
            // (generalized to Cormorant at session 143; 4th cumulative firing at session 144).
            lineHeight:    1.3,
            letterSpacing: "-0.005em",
            margin:        "0 0 6px",
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
            color:      v2.text.secondary,
            fontFamily: FONT_INTER,
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
    </Wrapper>
  );
}
