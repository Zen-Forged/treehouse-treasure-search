// components/share-shelf/StoryCtaCard.tsx
//
// Session 196 Arc 1.4 — Story sequence card 5 of 5 (CTA closing card).
//
// Renders at fixed 1080×1920. Closes the multi-card Story sequence with
// a clean call-to-action: QR to /shelf/<slug> + Cormorant italic invite
// + booth URL preview + Treehouse Finds wordmark.
//
// Composition per Frame ii balanced co-brand (D5) + D12:
//   - postit (#fbf3df) bg + 8px dashed v2.accent.green border
//   - Centered vertical flow with breathing-room padding (96px)
//   - Inter small-caps green "Visit Booth N" header
//   - Large QR (640×640, green-on-postit) via react-qr-code
//   - Cormorant italic "See the shelf before you visit" copy
//   - URL preview Inter mono-style (e.g. treehousefinds.app/shelf/...)
//   - Times New Roman green "Treehouse Finds" wordmark footer
//
// QR uses dark v2.accent.green on light postit bg — matches the cream-on-
// green chrome of the booth hero (Arc 1.2) for visual coherence across
// the 5-card sequence. fgColor + bgColor explicit on react-qr-code to
// override the library defaults (black-on-white doesn't fit Treehouse
// brand chrome).
//
// 8px dashed border (scaled up from V2 mockup's 2px on 140-wide preview)
// — needs visible dash pattern at 1080-wide capture; thinner borders
// look like solid lines at this scale.

"use client";

import QRCode from "react-qr-code";
import { FONT_CORMORANT, FONT_INTER, v1, v2 } from "@/lib/tokens";
import { ShelfLeafBubble, ShelfBrandFooter } from "./brandMarks";
import type { Vendor } from "@/types/treehouse";

export interface StoryCtaCardProps {
  vendor:   Vendor;
  /** Public-facing /shelf/<slug> URL embedded in QR + shown as preview. */
  boothUrl: string;
  /** Forwarded so html2canvas-pro wrapper can target this exact node. */
  domRef?:  React.RefObject<HTMLDivElement>;
}

export function StoryCtaCard({ vendor, boothUrl, domRef }: StoryCtaCardProps) {
  const boothNo = vendor.booth_number;

  // URL preview strips protocol for cleaner visual read at small sizes.
  // Full URL stays in the QR; the preview is the "tell viewers where this
  // leads even without scanning" affordance.
  const urlPreview = boothUrl.replace(/^https?:\/\//, "");

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

      {/* ─── Header: small-caps "Visit Booth N" ────────────────────── */}
      {boothNo && (
        <div
          style={{
            fontFamily:    FONT_INTER,
            fontWeight:    700,
            fontSize:      32,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color:         v2.accent.green,
            marginBottom:  64,
          }}
        >
          Visit Booth {boothNo}
        </div>
      )}

      {/* ─── QR — green on postit ──────────────────────────────────── */}
      <div
        style={{
          background:   v1.postit,
          padding:      32,
          borderRadius: 16,
          marginBottom: 56,
        }}
      >
        <QRCode
          value={boothUrl}
          size={640}
          fgColor={v2.accent.green}
          bgColor={v1.postit}
          level="M"
        />
      </div>

      {/* ─── Invite copy — Cormorant italic ────────────────────────── */}
      <div
        style={{
          fontFamily: FONT_CORMORANT,
          fontStyle:  "italic",
          fontWeight: 500,
          fontSize:   72,
          lineHeight: 1.25,
          color:      v2.text.primary,
          marginBottom: 28,
        }}
      >
        See the shelf
        <br />
        before you visit
      </div>

      {/* ─── URL preview — Inter, ink-secondary ─────────────────────── */}
      <div
        style={{
          fontFamily:    FONT_INTER,
          fontSize:      26,
          color:         v2.text.secondary,
          letterSpacing: "0.04em",
          marginBottom:  64,
        }}
      >
        {urlPreview}
      </div>

      {/* ─── Wordmark footer — shared lockup, matches every card ──────── */}
      <ShelfBrandFooter tone="onLight" />
    </div>
  );
}
