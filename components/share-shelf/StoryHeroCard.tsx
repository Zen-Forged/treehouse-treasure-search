// components/share-shelf/StoryHeroCard.tsx
//
// Session 196 Arc 1.2 — Story sequence card 1 of 5 ("booth hero").
//
// Renders at fixed 1080×1920 (canonical IG/FB Story aspect 9:16). No
// position styling on the component itself — the wrapper (Arc 2's
// refactored <ShelfImageShareScreen>) handles off-screen positioning
// (left: -99999) for html2canvas-pro capture. The /share-shelf-test
// smoke route (Arc 1.6) wraps with transform:scale to show in viewport.
//
// Composition per Frame ii balanced co-brand (V2 design D5):
//   - Green-gradient bg (v2.accent.green → v2.accent.greenMid, 160°)
//   - Top section:   "This week at" Inter small-caps eyebrow
//                  + leaf glyph at low-opacity centerpiece (Treehouse motif)
//   - Mid section:   Vendor display_name Cormorant italic (large)
//                  + Booth N pill Inter small-caps
//                  + Mall city/state Cormorant italic small
//   - Bottom section: AI-gen hook line Cormorant italic
//                   with hairline top-border separator
//
// Brand chrome ~40% (balanced co-brand per D5). Vendor identity reads
// foreground; Treehouse signature (green palette + leaf motif + wordmark
// recognizable elsewhere in sequence) frames it.
//
// All sizes calibrated to 1080×1920 canvas (≈7.7× the V2 mockup scale).
// Text rendering uses FONT_CORMORANT (canonical italic serif post-session
// 138 v2 migration) + FONT_INTER (small-caps + eyebrow) + FONT_NUMERAL
// (Times New Roman, used in CTA card not here).

"use client";

import { PiLeafFill } from "react-icons/pi";
import { FONT_CORMORANT, FONT_INTER, v2 } from "@/lib/tokens";
import type { Mall, Vendor } from "@/types/treehouse";

export interface StoryHeroCardProps {
  vendor:    Vendor;
  mall:      Mall | null;
  /** Total finds featured in this Story sequence (used in hook copy). */
  findCount: number;
  /** AI-generated hook line per D11 template intro + AI hook pattern.
   *  e.g. "3 new finds on the shelf →" or "Fresh inventory dropped this week →" */
  aiHook:    string;
  /** Forwarded so html2canvas-pro wrapper can target this exact node. */
  domRef?:   React.RefObject<HTMLDivElement>;
}

export function StoryHeroCard({
  vendor,
  mall,
  findCount,
  aiHook,
  domRef,
}: StoryHeroCardProps) {
  const boothName  = vendor.display_name;
  const boothNo    = vendor.booth_number;
  const mallName   = mall?.name ?? vendor.mall?.name ?? "";
  const mallCityState = (() => {
    const city  = mall?.city  ?? vendor.mall?.city  ?? null;
    const state = mall?.state ?? vendor.mall?.state ?? null;
    if (!city && !state) return null;
    return [city, state].filter(Boolean).join(", ");
  })();

  return (
    <div
      ref={domRef}
      style={{
        // ─── Capture-node canvas (fixed 1080×1920) ─────────────────────
        width:    1080,
        height:   1920,
        boxSizing: "border-box",
        padding:  96,
        // ─── Frame ii balanced co-brand chrome ─────────────────────────
        background: `linear-gradient(160deg, ${v2.accent.green} 0%, ${v2.accent.greenMid} 100%)`,
        color:      v2.surface.card,
        // ─── Vertical flow: top → mid (centered) → bottom hook ─────────
        display:        "flex",
        flexDirection:  "column",
        textAlign:      "center",
        // Anti-alias text consistently across capture.
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* ─── Top: eyebrow + leaf-glyph motif ───────────────────────── */}
      <div
        style={{
          fontFamily:    FONT_INTER,
          fontSize:      32,
          fontWeight:    700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color:         "rgba(255, 252, 245, 0.82)",
          marginBottom:  40,
        }}
      >
        This week at
      </div>

      <div
        style={{
          marginBottom: 40,
          color:        "rgba(255, 252, 245, 0.18)",
          display:      "flex",
          justifyContent: "center",
        }}
      >
        <PiLeafFill size={280} />
      </div>

      {/* ─── Mid: vendor name + booth pill + mall ──────────────────── */}
      <div
        style={{
          fontFamily:  FONT_CORMORANT,
          fontStyle:   "italic",
          fontWeight:  500,
          fontSize:    132,
          lineHeight:  1.1,
          color:       v2.surface.card,
          marginBottom: 24,
        }}
      >
        {boothName}
      </div>

      {boothNo && (
        <div
          style={{
            fontFamily:    FONT_INTER,
            fontSize:      32,
            fontWeight:    700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color:         "rgba(255, 252, 245, 0.85)",
            marginBottom:  20,
          }}
        >
          Booth {boothNo}
        </div>
      )}

      {(mallName || mallCityState) && (
        <div
          style={{
            fontFamily: FONT_CORMORANT,
            fontStyle:  "italic",
            fontWeight: 400,
            fontSize:   44,
            lineHeight: 1.3,
            color:      "rgba(255, 252, 245, 0.78)",
          }}
        >
          {mallName}
          {mallCityState && (
            <>
              <br />
              {mallCityState}
            </>
          )}
        </div>
      )}

      {/* ─── Spacer pushes hook to bottom ──────────────────────────── */}
      <div style={{ flex: 1 }} />

      {/* ─── Bottom: AI-gen hook with hairline top-border ──────────── */}
      <div
        style={{
          fontFamily: FONT_CORMORANT,
          fontStyle:  "italic",
          fontWeight: 500,
          fontSize:   56,
          lineHeight: 1.25,
          color:      v2.surface.card,
          borderTop:  "1px solid rgba(255, 252, 245, 0.28)",
          paddingTop: 40,
        }}
      >
        {aiHook || `${findCount} new finds on the shelf →`}
      </div>
    </div>
  );
}
