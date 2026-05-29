// components/share-shelf/StoryCtaCard.tsx
//
// Session 196 Arc 1.4 — Story sequence card 5 of 5 (CTA closing card).
// Session 201 Arc 3 QA — map-led redesign (see below).
//
// Renders at fixed 1080×1920. Closes the multi-card Story sequence.
//
// Arc 3 QA redesign (David, session 201): the old QR was dead weight — a
// Story is viewed ON a phone, and you can't scan a QR on the same screen
// you're holding (it only worked if the viewer happened to be on desktop).
// Replaced with a pinned map snapshot of the real location + a layered CTA:
//   - Headline drives the in-person visit ("Come find us at {mall}")
//   - Sub-line drives the in-app action ("Bookmark the booth in the app")
// The map IS the digital→physical bridge — more useful + more on-thesis than
// an unscannable QR.
//
// Composition per Frame ii balanced co-brand (D5):
//   - postit (#fbf3df) bg + 8px dashed v2.accent.green border
//   - Leaf-bubble corner signature (shared <ShelfLeafBubble>, onLight)
//   - "Booth N" small-caps green eyebrow
//   - Pinned map snapshot (Mapbox Static Images, cream brand style) framed
//     in a rounded card; graceful fallback to a pin-glyph box if the map
//     URL is unavailable (no token / no coords)
//   - "Come find us at {mall}" Cormorant italic headline + city/state line
//   - "Bookmark the booth in the app" Inter sub-line
//   - "Treehouse Finds" wordmark footer (shared <ShelfBrandFooter>, onLight)
//
// The map <img> uses crossOrigin="anonymous" for html2canvas-pro capture
// (same CORS pattern as the find-card photos). At production the Mapbox
// token is referer-allowlisted to app.kentuckytreehouse.com, so the capture
// request from that origin is authorized.

"use client";

import { useEffect, useState } from "react";
import { PiMapPinFill } from "react-icons/pi";
import { FONT_CORMORANT, FONT_INTER, v1, v2 } from "@/lib/tokens";
import { mallSnapshotUrl } from "@/lib/mapStaticImage";
import { ShelfLeafBubble, ShelfBrandFooter } from "./brandMarks";
import type { Mall, Vendor } from "@/types/treehouse";

const MAP_W = 840;
const MAP_H = 540;

export interface StoryCtaCardProps {
  vendor:   Vendor;
  mall:     Mall | null;
  /** Public-facing /shelf/<slug> URL. Reserved on the contract (was the QR
   *  target + URL preview, both retired in the Arc 3 QA map-led redesign);
   *  kept for a future "scan to open" affordance. */
  boothUrl: string;
  /** Forwarded so html2canvas-pro wrapper can target this exact node. */
  domRef?:  React.RefObject<HTMLDivElement>;
}

export function StoryCtaCard({
  vendor,
  mall,
  boothUrl: _boothUrl,
  domRef,
}: StoryCtaCardProps) {
  const boothNo  = vendor.booth_number;
  const mallName = mall?.name ?? vendor.mall?.name ?? "";
  const cityState = (() => {
    const city  = mall?.city  ?? vendor.mall?.city  ?? null;
    const state = mall?.state ?? vendor.mall?.state ?? null;
    if (!city && !state) return null;
    return [city, state].filter(Boolean).join(", ");
  })();

  const lat = Number(mall?.latitude  ?? vendor.mall?.latitude);
  const lng = Number(mall?.longitude ?? vendor.mall?.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const mapUrl = hasCoords ? mallSnapshotUrl(lng, lat, MAP_W, MAP_H, 13) : "";

  // Graceful degradation: no token (mapUrl "") OR the snapshot fails to
  // load (e.g. a preview origin the Mapbox token doesn't allowlist — 403)
  // falls back to a pin glyph so the card never shows an empty box.
  // Production (app.kentuckytreehouse.com is referer-allowlisted) loads the
  // snapshot. A probe Image is the reliable detector — the rendered <img>'s
  // onError can miss an instantly-cached error that settles before React
  // attaches the listener.
  const [mapFailed, setMapFailed] = useState(false);
  useEffect(() => {
    if (!mapUrl) return;
    setMapFailed(false);
    const probe = new Image();
    probe.onload = () => { if (probe.naturalWidth === 0) setMapFailed(true); };
    probe.onerror = () => setMapFailed(true);
    probe.src = mapUrl;
    return () => { probe.onload = null; probe.onerror = null; };
  }, [mapUrl]);
  const showMap = !!mapUrl && !mapFailed;

  return (
    <div
      ref={domRef}
      style={{
        // ─── Capture-node canvas (fixed 1080×1920) ─────────────────────
        width:    1080,
        height:   1920,
        boxSizing: "border-box",
        padding:  96,
        position:   "relative",
        // ─── Frame ii dashed-pill CTA chrome ───────────────────────────
        background: v1.postit,
        border:     `8px dashed ${v2.accent.green}`,
        // ─── Centered vertical composition ─────────────────────────────
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        textAlign:      "center",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* ─── Leaf-bubble corner signature (matches every card) ────────── */}
      <div style={{ position: "absolute", top: 56, right: 56 }}>
        <ShelfLeafBubble size={80} tone="onLight" />
      </div>

      {/* ─── Eyebrow: small-caps "Booth N" ─────────────────────────────── */}
      {boothNo && (
        <div
          style={{
            fontFamily:    FONT_INTER,
            fontWeight:    700,
            fontSize:      32,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color:         v2.accent.green,
            marginBottom:  56,
          }}
        >
          Booth {boothNo}
        </div>
      )}

      {/* ─── Pinned map snapshot (cream brand style) ───────────────────── */}
      <div
        style={{
          width:        MAP_W,
          height:       MAP_H,
          borderRadius: 24,
          overflow:     "hidden",
          marginBottom: 56,
          border:       `2px solid rgba(31, 74, 49, 0.20)`,
          boxShadow:    "0 8px 28px rgba(31, 74, 49, 0.18)",
          background:   v2.surface.card,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
        }}
      >
        {showMap ? (
          <img
            src={mapUrl}
            crossOrigin="anonymous"
            alt=""
            onError={() => setMapFailed(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          // Fallback — no token / no coords / snapshot failed: pin glyph
          // keeps the layout intact.
          <PiMapPinFill size={120} color={v2.accent.green} />
        )}
      </div>

      {/* ─── Headline — Cormorant italic, drives the in-person visit ───── */}
      <div
        style={{
          fontFamily: FONT_CORMORANT,
          fontStyle:  "italic",
          fontWeight: 500,
          fontSize:   60,
          lineHeight: 1.2,
          color:      v2.text.primary,
          marginBottom: cityState ? 12 : 36,
        }}
      >
        Come find us at
        <br />
        {mallName}
      </div>

      {cityState && (
        <div
          style={{
            fontFamily: FONT_CORMORANT,
            fontStyle:  "italic",
            fontWeight: 400,
            fontSize:   40,
            lineHeight: 1.3,
            color:      v2.accent.green,
            marginBottom: 44,
          }}
        >
          {cityState}
        </div>
      )}

      {/* ─── Sub-line — Inter, drives the in-app action ────────────────── */}
      <div
        style={{
          fontFamily:    FONT_INTER,
          fontSize:      30,
          fontWeight:    600,
          letterSpacing: "0.02em",
          color:         v2.text.secondary,
          marginBottom:  64,
        }}
      >
        Bookmark the booth in the app
      </div>

      {/* ─── Wordmark footer — shared lockup, matches every card ──────── */}
      <ShelfBrandFooter tone="onLight" />
    </div>
  );
}
