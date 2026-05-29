// components/share-shelf/StoryHeroCard.tsx
//
// Session 196 Arc 1.2 — Story sequence card 1 of 5 ("booth hero").
// Session 201 Arc 3 brand-identity pass — see "Arc 3 refinements" below.
//
// Renders at fixed 1080×1920 (canonical IG/FB Story aspect 9:16). No
// position styling consumed externally — the wrapper (Arc 2's refactored
// <ShelfImageShareScreen>) handles off-screen positioning (left: -99999)
// for html2canvas-pro capture. The /share-shelf-test smoke route wraps
// with transform:scale to show in viewport.
//
// Composition per Frame ii balanced co-brand (V2 design D5):
//   - Green→greenDeep gradient bg (real tonal depth; see Arc 3 note)
//   - Large faint leaf backdrop motif filling the composition
//   - Leaf-bubble corner signature (shared <ShelfLeafBubble>, top-right)
//   - Top:    "This week at" Inter small-caps eyebrow
//   - Center: vendor display_name Cormorant italic (large)
//             + Booth N pill + mall city/state (vertically centered)
//   - Bottom: AI-gen hook line Cormorant italic w/ hairline separator
//             + "Treehouse Finds" wordmark footer (shared <ShelfBrandFooter>)
//
// Arc 3 refinements (session 201, Shape B brand-signature system):
//   1. The green/greenMid tokens are both #1F4A31 (session-168 foundation
//      consolidation), so the old green→greenMid gradient was a FLAT fill —
//      the #1 reason the hero read empty. Now green→greenDeep (#143020) for
//      real depth.
//   2. Old standalone 280px @ 18% leaf was a faint centered watermark; it's
//      now a large 620px @ ~7% backdrop motif that fills the dead band and
//      reads as intentional composition.
//   3. Added the leaf-bubble corner mark (matches every other card) + the
//      wordmark footer (wordmark now present on slide 1, not buried at the
//      CTA card). Content vertically centered via flex so the card no longer
//      has a large empty spacer band.
//
// All sizes calibrated to 1080×1920 canvas (≈7.7× the V2 mockup scale).

"use client";

import { PiLeafFill } from "react-icons/pi";
import { FONT_CORMORANT, FONT_INTER, v2 } from "@/lib/tokens";
import { ShelfLeafBubble, ShelfBrandFooter } from "./brandMarks";
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
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        // ─── Arc 3: real tonal depth (green → greenDeep) ───────────────
        background: `linear-gradient(155deg, ${v2.accent.green} 0%, ${v2.accent.green} 42%, ${v2.accent.greenDeep} 100%)`,
        color:      v2.surface.card,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* ─── Backdrop leaf motif — large, faint, fills the composition ── */}
      <div
        style={{
          position:      "absolute",
          left:          "50%",
          top:           "54%",
          transform:     "translate(-50%, -50%) rotate(-12deg)",
          color:         "rgba(255, 252, 245, 0.07)",
          pointerEvents: "none",
        }}
      >
        <PiLeafFill size={620} />
      </div>

      {/* ─── Leaf-bubble corner signature (matches every card) ────────── */}
      <div style={{ position: "absolute", top: 64, right: 64 }}>
        <ShelfLeafBubble size={84} tone="onDark" />
      </div>

      {/* ─── Content layer ────────────────────────────────────────────── */}
      <div
        style={{
          position:       "relative",
          zIndex:         1,
          height:         "100%",
          boxSizing:      "border-box",
          padding:        96,
          display:        "flex",
          flexDirection:  "column",
          textAlign:      "center",
        }}
      >
        {/* Top: eyebrow */}
        <div
          style={{
            fontFamily:    FONT_INTER,
            fontSize:      32,
            fontWeight:    700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color:         "rgba(255, 252, 245, 0.82)",
          }}
        >
          This week at
        </div>

        {/* Center: vendor name + booth pill + mall (vertically centered) */}
        <div
          style={{
            flex:           1,
            display:        "flex",
            flexDirection:  "column",
            justifyContent: "center",
          }}
        >
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
        </div>

        {/* Bottom: AI-gen hook + hairline + wordmark footer */}
        <div>
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

          <div style={{ marginTop: 44 }}>
            <ShelfBrandFooter tone="onDark" />
          </div>
        </div>
      </div>
    </div>
  );
}
