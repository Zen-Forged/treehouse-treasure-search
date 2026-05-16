// components/DestinationHero.tsx
// Session 170 Shape B — re-architects /find/[id]'s inline cartographic
// stack (eyebrow + mall/booth card + standalone map snapshot) into one
// surface that reads as a secondary hero. Frame C from V1 mockup —
// map-led composition: the geography IS the place; mall + booth read
// as the address overlay beneath.
//
// Design record: docs/find-destination-hero-design.md (D1–D23 frozen
// session 170).
//
// Purely informational — NO CTAs inside. Page's primary CTA is the
// PiLeaf save bubble in the photograph's top-right corner (lattice
// canonical 44×44, already present since session 97). David's session-170
// Q1: "since it's a /find page the main CTA of the whole page is to
// Flag the Find. The map really acts as a clear signal to know where
// it's located and that they can find it."
//
// Three independent tap targets per D15 (David's session-170 Q5 pick):
//   1. Map snapshot   → /map?mall=<slug>          (spatial wayfinding)
//   2. Mall subtitle  → Apple Maps via mapLink    (native directions)
//   3. Vendor + booth → /shelf/[vendorSlug]       (booth navigation)
//
// stopPropagation on inner taps so the 3 targets don't bubble into each
// other (D16). Existing pattern preserved from /find/[id]'s mall
// subtitle anchor.
//
// Defensive fallbacks (D17–D20):
//   - Missing mallLat OR mallLng OR mallSlug → map snapshot omits
//     entirely. Card collapses to just the info strip.
//   - Missing vendorSlug → vendor/booth strip renders without Link.
//   - Missing mapLink → mall subtitle renders as plain text.
//   - Map snapshot onError → <img> hides; Link wrapper stays.
//     Mapbox token URL allowlist excludes *.vercel.app per session 156
//     carry — silent fail on preview deployments; production-PWA is
//     authoritative QA surface.

"use client";

import * as React from "react";
import Link from "next/link";
import { PiStorefront } from "react-icons/pi";
import { v1, v2, FONT_CORMORANT, FONT_INTER, FONT_NUMERAL } from "@/lib/tokens";
import { mallSnapshotUrl } from "@/lib/mapStaticImage";

export interface DestinationHeroProps {
  /** Mall display name (e.g., "America's Antique Mall"). Required for the
   *  card to render anything meaningful; null = component renders nothing. */
  mallName: string | null;
  /** Optional city for the postal-shape subtitle. */
  mallCity?: string | null;
  /** Optional state abbreviation. */
  mallState?: string | null;
  /** Mall latitude — required for map snapshot to render. */
  mallLat: number | null;
  /** Mall longitude — required for map snapshot to render. */
  mallLng: number | null;
  /** Mall slug — required for /map?mall= route on map snapshot tap. */
  mallSlug: string | null;
  /** Vendor display name (e.g., "Treasures & Trinkets"). */
  vendorName: string | null;
  /** Vendor slug — required for /shelf/[slug] route on info strip tap. */
  vendorSlug: string | null;
  /** Booth identifier (e.g., "14B"). Falsy = no booth badge rendered. */
  boothNumber: string | null;
  /** Apple Maps deep-link URL for the mall subtitle tap. */
  mapLink: string | null;
}

export default function DestinationHero({
  mallName,
  mallCity,
  mallState,
  mallLat,
  mallLng,
  mallSlug,
  vendorName,
  vendorSlug,
  boothNumber,
  mapLink,
}: DestinationHeroProps) {
  // Defensive: nothing to render if we have no place + no booth identity.
  if (!vendorName && !boothNumber && !mallName) return null;

  // Postal-shape subtitle. Mall name → city → state. mallCity null = just
  // the mall name; mallState null = mall + city only.
  const mallSubtitle = mallName
    ? `${mallName}${mallCity ? ` · ${mallCity}${mallState ? `, ${mallState}` : ""}` : ""}`
    : null;

  // Map snapshot URL — D7 16:9 at 600×338 (2x retina for 300×169 render
  // slot on iPhone). mallSnapshotUrl returns "" when MAPBOX_TOKEN missing
  // (defensive per lib/mapStaticImage.ts session 169 contract).
  const mapAvailable = mallLat !== null && mallLng !== null && mallSlug;
  const mapUrl = mapAvailable ? mallSnapshotUrl(mallLng, mallLat, 600, 338) : "";

  // Info strip (mall subtitle + vendor name + booth badge) — D8–D10. The
  // mall subtitle anchor stays SEPARATE from the strip's outer Link
  // wrapper per D15 (3 independent tap targets); subtitle calls
  // stopPropagation so its tap doesn't bubble to /shelf nav.
  const infoStripInner = (
    <div
      style={{
        padding:             "14px 16px 16px",
        display:             "grid",
        gridTemplateColumns: "1fr auto",
        columnGap:           14,
        alignItems:          "end",
      }}
    >
      <div style={{ minWidth: 0 }}>
        {mallSubtitle && (
          mapLink ? (
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display:              "inline-block",
                fontFamily:           FONT_INTER,
                fontSize:             11.5,
                color:                v2.text.muted,
                textDecoration:       "underline",
                textDecorationStyle:  "dotted",
                textDecorationColor:  v1.inkFaint,
                textUnderlineOffset:  3,
                lineHeight:           1.4,
              }}
            >
              {mallSubtitle}
            </a>
          ) : (
            <div
              style={{
                fontFamily: FONT_INTER,
                fontSize:   11.5,
                color:      v2.text.muted,
                lineHeight: 1.4,
              }}
            >
              {mallSubtitle}
            </div>
          )
        )}
        {vendorName && (
          <div
            style={{
              fontFamily:    FONT_CORMORANT,
              fontSize:      20,
              color:         v2.text.primary,
              lineHeight:    1.3,
              letterSpacing: "-0.005em",
              overflow:      "hidden",
              textOverflow:  "ellipsis",
              whiteSpace:    "nowrap",
              marginTop:     3,
            }}
          >
            {vendorName}
          </div>
        )}
      </div>
      {boothNumber && (
        <div
          style={{
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "flex-end",
            lineHeight:     1,
          }}
        >
          <div
            style={{
              fontFamily:     FONT_INTER,
              fontSize:       9,
              fontWeight:     700,
              color:          v2.accent.green,
              letterSpacing:  "0.12em",
              textTransform:  "uppercase",
              lineHeight:     1,
              marginBottom:   4,
            }}
          >
            Booth
          </div>
          <div
            style={{
              fontFamily:    FONT_NUMERAL,
              fontSize:      28,
              fontWeight:    500,
              color:         v2.accent.green,
              lineHeight:    1,
              letterSpacing: "-0.01em",
            }}
          >
            {boothNumber}
          </div>
        </div>
      )}
    </div>
  );

  // Info strip wraps in Link → /shelf/[slug] when vendorSlug exists;
  // otherwise renders as a plain div (D18 defensive). Map snapshot's
  // own Link wrapper (below) is a sibling — taps on the map don't
  // bubble to /shelf.
  const infoStrip = vendorSlug ? (
    <Link
      href={`/shelf/${vendorSlug}`}
      style={{
        display:                 "block",
        textDecoration:          "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {infoStripInner}
    </Link>
  ) : (
    infoStripInner
  );

  // Outer horizontal padding 22px matches /find/[id] page convention
  // (title block, prior CTA pair, prior cartographic block sibling all
  // on 22px). Bottom 28px gives clear separation from whatever renders
  // below.
  return (
    <div style={{ padding: "0 22px 28px" }}>
      {/* Eyebrow — D11: outside the card, above. Italic Cormorant 18 +
          PiStorefront icon. Padding 0 4px 10px (small horizontal indent
          for typographic alignment with card; bottom gap to card). */}
      <div
        style={{
          display:     "inline-flex",
          alignItems:  "center",
          gap:         6,
          paddingLeft: 4,
          paddingBottom: 10,
          fontFamily:  FONT_CORMORANT,
          fontStyle:   "italic",
          fontSize:    18,
          fontWeight:  600,
          color:       v2.text.secondary,
          lineHeight:  1.3,
        }}
      >
        <PiStorefront size={18} aria-hidden style={{ flexShrink: 0 }} />
        Purchase this item at
      </div>

      {/* Card — D13 + D14. v2.surface.card bg, 1px v2.border.light, radius
          12, subtle shadow. Overflow hidden so map's top corners clip to
          the card radius. */}
      <div
        style={{
          background:   v2.surface.card,
          border:       `1px solid ${v2.border.light}`,
          borderRadius: 12,
          overflow:     "hidden",
          boxShadow:    "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
        }}
      >
        {/* Map snapshot — D7 16:9. Tappable → /map?mall=<slug> via Link
            wrapper. Omits entirely when mallLat/mallLng/mallSlug missing
            (D17) or mapUrl resolves empty (token missing). onError hides
            the <img> per D20 (Mapbox preview-deployment silent fail);
            Link wrapper stays so the tap target still routes. */}
        {mapAvailable && mapUrl && (
          <Link
            href={`/map?mall=${mallSlug}`}
            aria-label={`View ${mallName ?? "this mall"} on the map`}
            style={{
              display:                 "block",
              width:                   "100%",
              aspectRatio:             "16 / 9",
              background:              v2.surface.warm,
              textDecoration:          "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <img
              src={mapUrl}
              alt=""
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
              style={{
                width:     "100%",
                height:    "100%",
                objectFit: "cover",
                display:   "block",
              }}
            />
          </Link>
        )}
        {infoStrip}
      </div>
    </div>
  );
}
