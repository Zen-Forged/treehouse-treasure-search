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
//
// Session 188 (D1-D20) — vertical-stacked symmetric composition reshape
// (Frame β picked at design pass). See docs/map-pincallout-refinement-design.md.
// Composition top→bottom: 56px circle thumb · DistancePill · mall name ·
// PiLeaf + "X fresh finds" split-treatment line · CTA row. Everything
// horizontally centered. Two bounded reversals surfaced in commit body:
// R-1 reverses session-107 R10 D26 horizontal composition; R-2 reverses
// session-158 D-bundle "fresh finds" Cormorant italic 14 → split treatment
// (FONT_NUMERAL number + FONT_INTER label) per session-75 canonical
// reaffirmed at 2026-05 ui-tokenization-audit. No-coords fallback branch
// adopts same reshape minus DistancePill minus CTA row (D18).

"use client";

import * as React from "react";
import { MapPin, Navigation } from "lucide-react";
import { PiCaretLeft, PiCaretRight, PiLeaf } from "react-icons/pi";
import { v1, v2, FONT_NUMERAL, FONT_CORMORANT, FONT_INTER } from "@/lib/tokens";
import { openNavigation, googleListingUrl } from "@/lib/mapsDeepLink";
import { track } from "@/lib/clientEvents";
import DistancePill from "@/components/DistancePill";
import MallHoursBadge from "@/components/MallHoursBadge";
import type { Mall } from "@/types/treehouse";

interface PinCalloutProps {
  mall:        Pick<Mall, "id" | "slug" | "name" | "hero_image_url" | "latitude" | "longitude" | "address" | "hours_json" | "hours_timezone" | "business_status">;
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
    openNavigation(Number(mall.latitude), Number(mall.longitude));
  };

  // Session 123 — body shifts from discovery vocabulary ("X booths · Y finds")
  // to find→found vocabulary ("X saved finds"). When the user has saves at
  // this mall, the callout names what's WAITING there for them. When they
  // have none, fallback to total finds count preserves discovery affordance
  // for first-time / new-mall scenarios per Q2(b) of the session-123 scope
  // questions.
  //
  // Session 188 (D11) — non-saved findCount semantic is now "available finds
  // posted in last 30 days at mall" (data-layer filter in getMallStatsByMallId
  // per Arc 1.1). Lattice semantic preserved: saved = user's, fresh = mall
  // inventory in the freshness window.
  const usesSaved = savedCount != null && savedCount > 0;
  const statCount = usesSaved ? savedCount : findCount;
  const statLabel = usesSaved ? "saved finds" : "fresh finds";

  // Session 188 (D9 + D10) — vertical-stacked split-treatment stat line.
  // PiLeaf outline prefix · FONT_NUMERAL count number (session-75 canonical
  // for numeric stamps, reaffirmed at 2026-05 ui-tokenization-audit) ·
  // FONT_INTER sans label (David's verbatim "sans serif font we already use").
  // Both v2.accent.green. Reuses MallScopeHeader split-treatment pattern per
  // session 75 D5. BOUNDED REVERSAL of session-158 Cormorant italic 14 line.
  const statLine = (
    <div
      style={{
        display:     "inline-flex",
        alignItems:  "center",
        gap:         6,
        color:       v2.accent.green,
        lineHeight:  1.3,
      }}
    >
      <PiLeaf size={15} color={v2.accent.green} aria-hidden="true" />
      <span style={{ fontFamily: FONT_NUMERAL, fontWeight: 700, fontSize: 14 }}>
        {statCount}
      </span>
      <span style={{ fontFamily: FONT_INTER, fontWeight: 600, fontSize: 14, letterSpacing: "0.01em" }}>
        {statLabel}
      </span>
    </div>
  );

  // Session 188 (D8) — centered mall name. Right-aligned ellipsis truncation
  // retires; centered allows 2-line wrap naturally when long names exceed
  // callout width.
  const mallNameRow = (
    <div
      style={{
        fontFamily: FONT_CORMORANT,
        fontWeight: 600,
        fontSize:   20,
        color:      v2.text.primary,
        lineHeight: 1.3,
        textAlign:  "center",
        maxWidth:   "100%",
      }}
    >
      {mall.name}
    </div>
  );

  // Session 188 (D4 + D5 + D6) — 56px circle thumb. Hero image fills via
  // objectFit cover; MapPin glyph fallback at 18px when null. 1.5px outline
  // + soft shadow for lift against v2.surface.card callout body.
  const heroThumb = (
    <div
      style={{
        width:        56,
        height:       56,
        flexShrink:   0,
        borderRadius: "50%",
        overflow:     "hidden",
        background:   v2.bg.main,
        border:       `1.5px solid ${v2.surface.card}`,
        boxShadow:    "0 2px 6px rgba(42,26,10,0.15)",
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
        <MapPin size={18} strokeWidth={1.8} color={v2.text.secondary} aria-hidden="true" />
      )}
    </div>
  );

  // ── No-coords fallback (D18) — same vertical-stacked reshape minus
  // DistancePill minus CTA row. Whole-card-as-button preserves the
  // commit affordance. Defensive coverage for future-malls / transient
  // race conditions; all production malls have coords today. ──
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
            flexDirection:   "column",
            alignItems:      "center",
            gap:             10,
            minWidth:        200,
            padding:         "14px 18px 14px",
            background:      v2.surface.card,
            border:          `1px solid ${v2.border.light}`,
            borderRadius:    12,
            boxShadow:       v1.shadow.callout,
            cursor:          "pointer",
            textAlign:       "center",
            pointerEvents:   "auto",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {heroThumb}
          {mallNameRow}
          {statLine}
          <Tail />
        </button>
      </div>
    );
  }

  // ── R17 Arc 2 shape — vertical-stacked symmetric (session 188 D1-D17). ──
  // Composition top→bottom: thumb · DistancePill · mall name · stat line · CTA row.
  // Session 158 Arc 3 — outer wrapper hosts a horizontal flex row so the
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
          alignItems:    "center",
          gap:           7,
          minWidth:      230,
          padding:       "14px 18px",
          background:    v2.surface.card,
          border:        `1px solid ${v2.border.light}`,
          borderRadius:  12,
          boxShadow:     v1.shadow.callout,
          textAlign:     "center",
          pointerEvents: "auto",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* D2 vertical stack: thumb · pill · name · stat · CTA */}
        {heroThumb}
        <DistancePill miles={miles} />
        {mallNameRow}
        <div style={{ marginTop: 2 }}>{statLine}</div>

        {/* Session 203 — Shape B open-now badge; self-hides when no hours data. */}
        <MallHoursBadge
          hoursJson={mall.hours_json}
          timezone={mall.hours_timezone}
          businessStatus={mall.business_status}
          href={googleListingUrl([mall.name, mall.address].filter(Boolean).join(", "))}
          mallSlug={mall.slug}
          surface="map"
        />

        {/* Mini CTA row — Directions (outline, native maps deep-link) + Explore
            (filled green, scope-commit). Dial G reversed the original order +
            swapped styles so Explore reads as the primary action (filled +
            rightmost), matching the canonical primary-CTA position. */}
        <div style={{ display: "flex", gap: 6, width: "100%", marginTop: 5 }}>
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
