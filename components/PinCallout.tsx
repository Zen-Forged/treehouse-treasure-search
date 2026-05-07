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
//
// R17 Arc 2 (session 119) — D18 + D19 extension:
//   - Optional `miles` prop renders <DistancePill> in the header next to
//     mall name. Hides on null per the primitive's null-passthrough.
//   - Body chevron retires in favor of mini "Browse" + "Go" CTAs (D19).
//     Browse → onCommit (existing scope-change + auto-route to Home per
//     R10 D26 extension); Go → native maps deep-link via navigateUrl().
//   - When neither `miles` nor mall lat/lng exists (no user location OR
//     mall coords missing), the CTA row falls back to the original
//     whole-callout-as-button + chevron behavior so the peek-state
//     interaction still works without R17 wiring.

"use client";

import * as React from "react";
import { ChevronRight, MapPin, Navigation } from "lucide-react";
import { v1, FONT_LORA, FONT_NUMERAL, FONT_SYS } from "@/lib/tokens";
import { navigateUrl } from "@/lib/mapsDeepLink";
import { track } from "@/lib/clientEvents";
import DistancePill from "@/components/DistancePill";
import type { Mall } from "@/types/treehouse";

interface PinCalloutProps {
  mall:        Pick<Mall, "id" | "slug" | "name" | "hero_image_url" | "latitude" | "longitude">;
  boothCount:  number;
  findCount:   number;
  anchor:      { x: number; y: number };
  onCommit:    () => void;
  /** R17 Arc 2 — distance from user to mall in miles. null hides the pill. */
  miles?:      number | null;
}

export default function PinCallout({
  mall,
  boothCount,
  findCount,
  anchor,
  onCommit,
  miles = null,
}: PinCalloutProps) {
  // Show CTA row when we have mall coords. Otherwise fall back to the
  // original whole-callout-as-button + chevron pattern.
  const hasCoords = mall.latitude != null && mall.longitude != null;

  const onBrowse = () => {
    track("find_view_on_map_tapped", {
      surface:   "map_callout",
      mall_slug: mall.slug,
    });
    onCommit();
  };

  const onGo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mall.latitude == null || mall.longitude == null) return;
    track("find_navigate_tapped", {
      surface:   "map_callout",
      mall_slug: mall.slug,
    });
    window.location.href = navigateUrl(Number(mall.latitude), Number(mall.longitude));
  };

  // Pill renders nothing on null miles, but the layout still reserves the
  // header row so the name doesn't shift between the prompting / granted /
  // denied states. The pill is visually optional.
  const headerRow = (
    <div
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        gap:            8,
        minWidth:       0,
      }}
    >
      <div
        style={{
          fontFamily:   FONT_LORA,
          fontWeight:   500,
          fontSize:     13.5,
          color:        v1.inkPrimary,
          lineHeight:   1.2,
          minWidth:     0,
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
          flex:         1,
        }}
      >
        {mall.name}
      </div>
      <DistancePill miles={miles} />
    </div>
  );

  const statLine = (
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
  );

  const heroThumb = (
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
  );

  // ── Original whole-callout-as-button shape (fallback when no coords). ──
  if (!hasCoords) {
    return (
      <div
        style={{
          position:  "absolute",
          left:      anchor.x,
          top:       anchor.y,
          transform: "translate(-50%, calc(-100% - 12px))",
          zIndex:    10,
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
          {heroThumb}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            {headerRow}
            {statLine}
          </div>
          <ChevronRight size={14} strokeWidth={2.0} color={v1.green} aria-hidden="true" />
          <Tail />
        </button>
      </div>
    );
  }

  // ── R17 Arc 2 shape — header + stat + Browse/Go CTA row. ──
  return (
    <div
      style={{
        position:  "absolute",
        left:      anchor.x,
        top:       anchor.y,
        transform: "translate(-50%, calc(-100% - 12px))",
        zIndex:    10,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position:      "relative",
          display:       "flex",
          flexDirection: "column",
          gap:           6,
          minWidth:      240,
          padding:       "8px 10px 10px",
          background:    v1.paperWarm,
          border:        `1px solid ${v1.inkHairline}`,
          borderRadius:  10,
          boxShadow:     v1.shadow.callout,
          textAlign:     "left",
          pointerEvents: "auto",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Top: thumb + (header row + stat) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {heroThumb}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            {headerRow}
            {statLine}
          </div>
        </div>

        {/* Mini CTA row — Browse (outline, scope-change) + Go (filled, native maps). */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={onBrowse}
            style={{
              flex:           1,
              height:         28,
              borderRadius:   6,
              background:     "transparent",
              border:         `1px solid ${v1.green}`,
              color:          v1.green,
              fontFamily:     FONT_SYS,
              fontSize:       11,
              fontWeight:     600,
              letterSpacing:  "0.01em",
              cursor:         "pointer",
              padding:        0,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Explore
          </button>
          <button
            type="button"
            onClick={onGo}
            style={{
              flex:           1,
              height:         28,
              borderRadius:   6,
              background:     v1.green,
              border:         `1px solid ${v1.green}`,
              color:          v1.onGreen,
              fontFamily:     FONT_SYS,
              fontSize:       11,
              fontWeight:     600,
              letterSpacing:  "0.01em",
              display:        "inline-flex",
              alignItems:     "center",
              justifyContent: "center",
              gap:            4,
              cursor:         "pointer",
              padding:        0,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Navigation size={11} strokeWidth={2.2} aria-hidden />
            Navigate
          </button>
        </div>

        <Tail />
      </div>
    </div>
  );
}

// Triangular tail pointing down at the pin. Extracted so both branches share
// the same hairline + drop-shadow primitive.
function Tail() {
  return (
    <>
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
    </>
  );
}
