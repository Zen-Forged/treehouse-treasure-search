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
import { PiCaretLeft, PiCaretRight } from "react-icons/pi";
import { v1, v2, FONT_NUMERAL, FONT_CORMORANT, FONT_INTER } from "@/lib/tokens";
import { navigateUrl } from "@/lib/mapsDeepLink";
import { track } from "@/lib/clientEvents";
import DistancePill from "@/components/DistancePill";
import type { Mall } from "@/types/treehouse";

interface PinCalloutProps {
  mall:        Pick<Mall, "id" | "slug" | "name" | "hero_image_url" | "latitude" | "longitude">;
  findCount:   number;
  /** Session 123 — saves at this mall (post-R1 / R18 find→found thesis).
   *  > 0 → "X saved finds"; 0 or null → fallback to "{findCount} finds". */
  savedCount?: number | null;
  anchor:      { x: number; y: number };
  onCommit:    () => void;
  /** R17 Arc 2 — distance from user to mall in miles. null hides the pill. */
  miles?:      number | null;
  /** Session 158 Arc 3 — neighbor-stepping arrows. When onPrev/onNext defined,
   *  renders 30×30 flanking chevron bubbles. hasPrev/hasNext gate the disabled
   *  visual at first/last position. When both undefined → arrows don't render
   *  at all (defensive fallback to pre-Arc-3 callout shape). */
  onPrev?:     () => void;
  onNext?:     () => void;
  hasPrev?:    boolean;
  hasNext?:    boolean;
}

export default function PinCallout({
  mall,
  findCount,
  savedCount = null,
  anchor,
  onCommit,
  miles = null,
  onPrev,
  onNext,
  hasPrev  = false,
  hasNext  = false,
}: PinCalloutProps) {
  // Session 158 Arc 3 — arrows render only when at least one of the handlers
  // is wired AND we're rendering the R17 Arc-2 callout shape (the no-coords
  // fallback branch below stays arrow-less for defensive coverage).
  const arrowsEnabled = onPrev !== undefined || onNext !== undefined;
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
          fontFamily:   FONT_CORMORANT,
          fontWeight:   600,
          fontSize:     18,
          color:        v2.text.primary,
          lineHeight:   1.3,
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

  // Session 123 — body shifts from discovery vocabulary ("X booths · Y finds")
  // to find→found vocabulary ("X saved finds"). When the user has saves at
  // this mall, the callout names what's WAITING there for them. When they
  // have none, fallback to total finds count preserves discovery affordance
  // for first-time / new-mall scenarios per Q2(b) of the session-123 scope
  // questions.
  const usesSaved = savedCount != null && savedCount > 0;
  const statCount = usesSaved ? savedCount : findCount;
  // Session 158 dial B — non-saved copy "X finds" → "X fresh finds" per QA.
  // Saved-state copy unchanged ("X saved finds") since David didn't flag it
  // and the lattice semantic (saved = user's, fresh = mall inventory) holds.
  // Dial F — stat label color v2.text.muted → v2.accent.green so the entire
  // statline reads in the brand green (number + label visually unified).
  const statLabel = usesSaved ? "saved finds" : "fresh finds";
  const statLine = (
    <div
      style={{
        fontFamily: FONT_CORMORANT,
        fontStyle:  "italic",
        fontSize:   14,
        fontWeight: 700,
        color:      v2.accent.green,
        lineHeight: 1.3,
      }}
    >
      <span style={{ fontFamily: FONT_NUMERAL, color: v2.accent.green, fontStyle: "normal", fontWeight: 700 }}>
        {statCount}
      </span>
      {" "}
      {statLabel}
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
        background:   v2.bg.main,
        border:       `1px solid ${v2.border.light}`,
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
        <MapPin size={16} strokeWidth={1.8} color={v2.text.muted} aria-hidden="true" />
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
            background:      v2.surface.card,
            border:          `1px solid ${v2.border.light}`,
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
          <ChevronRight size={14} strokeWidth={2.0} color={v2.accent.green} aria-hidden="true" />
          <Tail />
        </button>
      </div>
    );
  }

  // ── R17 Arc 2 shape — header + stat + Browse/Go CTA row. ──
  // Session 158 Arc 3 — outer wrapper now hosts a horizontal flex row so the
  // optional prev/next chevron bubbles can flank the callout (D9). Total
  // width centers on the pin via translate(-50%) regardless of arrows.
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
          display:    "flex",
          alignItems: "center",
          gap:        6,
        }}
      >
      {arrowsEnabled && (
        <ArrowBubble direction="prev" disabled={!hasPrev} onTap={onPrev} />
      )}
      <div
        style={{
          position:      "relative",
          display:       "flex",
          flexDirection: "column",
          gap:           6,
          minWidth:      240,
          padding:       "8px 10px 10px",
          background:    v2.surface.card,
          border:        `1px solid ${v2.border.light}`,
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

        {/* Mini CTA row — Directions (outline, native maps deep-link) + Explore
            (filled green, scope-commit). Dial G reversed the original order +
            swapped styles so Explore reads as the primary action (filled +
            rightmost), matching the canonical primary-CTA position. */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={onGo}
            style={{
              flex:           1,
              height:         28,
              borderRadius:   6,
              background:     "transparent",
              border:         `1px solid ${v2.accent.green}`,
              color:          v2.accent.green,
              fontFamily:     FONT_INTER,
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
            Directions
          </button>
          <button
            type="button"
            onClick={onBrowse}
            style={{
              flex:           1,
              height:         28,
              borderRadius:   6,
              background:     v2.accent.green,
              border:         `1px solid ${v2.accent.green}`,
              color:          v2.surface.card,
              fontFamily:     FONT_INTER,
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
        </div>

        <Tail />
      </div>
      {arrowsEnabled && (
        <ArrowBubble direction="next" disabled={!hasNext} onTap={onNext} />
      )}
      </div>
    </div>
  );
}

// Session 158 Arc 3 — flanking chevron bubble for neighbor-stepping.
// 30×30 round bubble; stopPropagation on click so the tap doesn't bubble to
// the map's empty-tap dismiss handler. Disabled state at first/last position
// dims the bubble + removes pointer events while keeping the layout slot
// reserved (no width jump when stepping near the ends).
function ArrowBubble({
  direction,
  disabled,
  onTap,
}: {
  direction: "prev" | "next";
  disabled:  boolean;
  onTap?:    () => void;
}) {
  const Icon = direction === "prev" ? PiCaretLeft : PiCaretRight;
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous location" : "Next location"}
      onClick={(e) => {
        e.stopPropagation();
        if (disabled) return;
        onTap?.();
      }}
      disabled={disabled}
      style={{
        width:           30,
        height:          30,
        borderRadius:    "50%",
        background:      v2.surface.card,
        border:          `1px solid ${v2.border.light}`,
        boxShadow:       v1.shadow.callout,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        color:           v2.text.secondary,
        flexShrink:      0,
        cursor:          disabled ? "default" : "pointer",
        opacity:         disabled ? 0.35 : 1,
        pointerEvents:   disabled ? "none" : "auto",
        padding:         0,
        transition:      "opacity 200ms ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <Icon size={16} aria-hidden="true" />
    </button>
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
          borderTop:     `8px solid ${v2.surface.card}`,
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
          borderTop:     `9px solid ${v2.border.light}`,
          zIndex:        -1,
          pointerEvents: "none",
        }}
      />
    </>
  );
}
