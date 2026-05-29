// components/share-shelf/StoryFindCard.tsx
//
// Session 196 Arc 1.3 — Story sequence cards 2-4 of 5 ("individual find").
//
// Renders at fixed 1080×1920 (canonical IG/FB Story 9:16). One card per
// featured find. Sequence ships 3 of these between the booth hero (1.2)
// and the CTA card (1.4) per D9 (5-card sequence).
//
// Composition per Frame ii balanced co-brand (D5):
//   - Full-bleed photo (post.image_url)
//   - Bottom dark gradient overlay (linear, transparent → black 55%)
//   - Booth tag top-left:    cream-bg pill with green Inter small-caps
//                             "Booth N" — survives screenshot/repost (D16)
//   - Leaf bubble top-right: cream-circle with green PiLeafFill —
//                             Treehouse signature on every find card
//   - Bottom-left meta:      title Cormorant italic (large)
//                          + price Times New Roman in v2.priceGold
//                            (per Arc 1.1 token addition for dark-overlay
//                            price contrast)
//
// crossOrigin="anonymous" on <img> so Supabase storage CDN photos don't
// taint the canvas on iOS Safari during html2canvas-pro capture. Picsum
// fixtures already cooperate; production Supabase URLs cooperate via
// the project's existing CORS policy (verified parked session 152).

"use client";

import { FONT_CORMORANT, FONT_INTER, FONT_NUMERAL, v2 } from "@/lib/tokens";
import { ShelfLeafBubble, ShelfBrandFooter } from "./brandMarks";
import type { Post, Vendor } from "@/types/treehouse";

export interface StoryFindCardProps {
  post:    Post;
  vendor:  Vendor;
  /** Position in sequence (1 of 3 / 2 of 3 / 3 of 3). Kept on contract
   *  for future analytics + Arc 4 caption-gen-per-position; not used in
   *  visual layout today. */
  index:   1 | 2 | 3;
  /** Forwarded so html2canvas-pro wrapper can target this exact node. */
  domRef?: React.RefObject<HTMLDivElement>;
}

export function StoryFindCard({
  post,
  vendor,
  index: _index,
  domRef,
}: StoryFindCardProps) {
  const boothNo = vendor.booth_number;
  const title   = post.title;
  const price   = post.price_asking;

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
        background: v2.text.primary, // dark fallback if photo fails to load
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* ─── Photo full-bleed ──────────────────────────────────────── */}
      {post.image_url && (
        <img
          src={post.image_url}
          crossOrigin="anonymous"
          alt=""
          style={{
            position:       "absolute",
            inset:          0,
            width:          "100%",
            height:         "100%",
            objectFit:      "cover",
            objectPosition: "center",
          }}
        />
      )}

      {/* ─── Bottom dark gradient overlay ──────────────────────────── */}
      {/* Arc 3: darkening starts higher + ends deeper so the meta AND the
          new wordmark footer at the very bottom both read against light
          photo regions. */}
      <div
        style={{
          position: "absolute",
          inset:    0,
          background: "linear-gradient(180deg, transparent 48%, rgba(0,0,0,0.62) 100%)",
        }}
      />

      {/* ─── Booth tag (D16) — upper left, cream pill + green text ───── */}
      {boothNo && (
        <div
          style={{
            position:      "absolute",
            top:           56,
            left:          56,
            background:    v2.surface.card,
            color:         v2.accent.green,
            padding:       "14px 28px",
            borderRadius:  10,
            fontFamily:    FONT_INTER,
            fontWeight:    700,
            fontSize:      30,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Booth {boothNo}
        </div>
      )}

      {/* ─── Leaf bubble — upper right, Treehouse signature ──────────── */}
      <div style={{ position: "absolute", top: 56, right: 56 }}>
        <ShelfLeafBubble size={80} tone="onDark" />
      </div>

      {/* ─── Bottom meta — title + price on darkest gradient stop ──── */}
      <div
        style={{
          position:  "absolute",
          left:      80,
          right:     80,
          bottom:    156,
          color:     v2.surface.card,
        }}
      >
        <div
          style={{
            fontFamily: FONT_CORMORANT,
            fontStyle:  "italic",
            fontWeight: 500,
            fontSize:   92,
            lineHeight: 1.15,
            // Soft text-shadow lifts title against any photo region the
            // gradient doesn't darken sufficiently (defensive contrast).
            textShadow: "0 2px 14px rgba(0, 0, 0, 0.45)",
          }}
        >
          {title}
        </div>

        {price != null && (
          <div
            style={{
              fontFamily: FONT_NUMERAL,
              fontWeight: 700,
              fontSize:   76,
              color:      v2.priceGold,
              marginTop:  20,
              textShadow: "0 2px 12px rgba(0, 0, 0, 0.5)",
            }}
          >
            ${price}
          </div>
        )}
      </div>

      {/* ─── Wordmark footer — brand present on every slide ─────────── */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 64 }}>
        <ShelfBrandFooter tone="onDark" />
      </div>
    </div>
  );
}
