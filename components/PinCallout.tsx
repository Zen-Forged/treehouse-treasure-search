// components/PinCallout.tsx
// R10 (session 107) — peek-state callout that floats above a tapped map pin.
// Refines D23 via D26 — pin tap shows this callout (peek), tapping the
// callout itself commits the rescope (PostcardMallCard animates to that
// mall + map zooms in). Tapping empty map dismisses callout.
//
// Pure presentation primitive — caller is responsible for:
//   - Computing screen-space `anchor` from `map.project(lngLat)`
//   - Re-rendering on map pan/zoom so anchor stays in sync
//   - Wiring `onCommit` to the scope-state machine
//
// See docs/r10-location-map-design.md D26 + the V5 mockup at
// docs/mockups/r10-location-map-v5.html.

"use client";

import * as React from "react";
import { ChevronRight, MapPin } from "lucide-react";
import { v1, FONT_LORA, FONT_NUMERAL } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

interface PinCalloutProps {
  mall:        Pick<Mall, "id" | "slug" | "name" | "hero_image_url">;
  boothCount:  number;
  findCount:   number;
  anchor:      { x: number; y: number };
  onCommit:    () => void;
}

export default function PinCallout({
  mall,
  boothCount,
  findCount,
  anchor,
  onCommit,
}: PinCalloutProps) {
  return (
    <div
      style={{
        position:  "absolute",
        left:      anchor.x,
        top:       anchor.y,
        transform: "translate(-50%, calc(-100% - 12px))",
        zIndex:    10,
        // The wrapper just positions; the tappable surface is below so the
        // tail points at the pin without intercepting taps outside the card.
        pointerEvents: "none",
      }}
    >
      <button
        type="button"
        onClick={onCommit}
        style={{
          position:        "relative",
          display:         "flex",
          alignItems:      "center",
          gap:             10,
          minWidth:        200,
          padding:         "8px 12px 8px 10px",
          background:      v1.paperWarm,
          border:          `1px solid ${v1.inkHairline}`,
          borderRadius:    10,
          boxShadow:       v1.shadow.callout,
          cursor:          "pointer",
          textAlign:       "left",
          pointerEvents:   "auto",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Hero thumb — 36×36, falls back to paperWarm placeholder. */}
        <div
          style={{
            width:        36,
            height:       36,
            flexShrink:   0,
            borderRadius: 6,
            overflow:     "hidden",
            background:   v1.paperCream,
            border:       `1px solid ${v1.inkHairline}`,
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
          }}
        >
          {mall.hero_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mall.hero_image_url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <MapPin size={16} strokeWidth={1.8} color={v1.inkMuted} aria-hidden="true" />
          )}
        </div>

        {/* Text block */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <div
            style={{
              fontFamily:   FONT_LORA,
              fontWeight:   500,
              fontSize:     13.5,
              color:        v1.inkPrimary,
              lineHeight:   1.2,
              maxWidth:     130,
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
            }}
          >
            {mall.name}
          </div>
          <div
            style={{
              fontFamily: FONT_LORA,
              fontStyle:  "italic",
              fontSize:   11,
              color:      v1.inkMuted,
              lineHeight: 1.2,
            }}
          >
            <span style={{ fontFamily: FONT_NUMERAL, color: v1.green, fontStyle: "normal", fontWeight: 600 }}>
              {boothCount}
            </span>
            {" booths · "}
            <span style={{ fontFamily: FONT_NUMERAL, color: v1.green, fontStyle: "normal", fontWeight: 600 }}>
              {findCount}
            </span>
            {" finds"}
          </div>
        </div>

        <ChevronRight size={14} strokeWidth={2.0} color={v1.green} aria-hidden="true" />

        {/* Triangular tail — pointing down at the pin. CSS borders +
            drop-shadow filter so the shadow follows the triangle silhouette. */}
        <span
          aria-hidden="true"
          style={{
            position:      "absolute",
            left:          "50%",
            bottom:        -7,
            transform:     "translateX(-50%)",
            width:         0,
            height:        0,
            borderLeft:    "7px solid transparent",
            borderRight:   "7px solid transparent",
            borderTop:     `8px solid ${v1.paperWarm}`,
            filter:        "drop-shadow(0 1px 1px rgba(42,26,10,0.18))",
            pointerEvents: "none",
          }}
        />
        {/* Hairline border on the tail — drawn with a slightly larger,
            darker triangle behind the paper one so the bottom border
            matches the card's hairline. */}
        <span
          aria-hidden="true"
          style={{
            position:      "absolute",
            left:          "50%",
            bottom:        -8,
            transform:     "translateX(-50%)",
            width:         0,
            height:        0,
            borderLeft:    "8px solid transparent",
            borderRight:   "8px solid transparent",
            borderTop:     `9px solid ${v1.inkHairline}`,
            zIndex:        -1,
            pointerEvents: "none",
          }}
        />
      </button>
    </div>
  );
}
