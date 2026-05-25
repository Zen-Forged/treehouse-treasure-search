// components/share-shelf/FeedCard.tsx
//
// Session 196 Arc 1.5 — Feed format (1080×1350, 4:5 aspect).
//
// Per D6 (Feed↔Story relationship lock): Feed format = strongest
// individual find card from Story sequence repurposed as standalone
// Feed post. Per V2 mockup .beta-feed: adds a top green hero strip
// with vendor identity since Feed stands alone (no sibling Story
// cards to reinforce booth association).
//
// Composition:
//   - Top ~12% green hero strip ("This week at {vendor_name}"
//     Cormorant italic centered, single line)
//   - Bottom ~88% full-width photo + bottom dark gradient overlay
//     + booth tag upper-left + leaf bubble upper-right + meta
//     bottom-left (title + price priceGold)
//
// Visual coherence with StoryFindCard maintained (D6 "find card from
// sequence" reading) — same photo + overlay + tags + meta pattern; only
// difference is the added top hero strip (Feed-only) + 4:5 aspect.
//
// crossOrigin="anonymous" on <img> for Supabase CORS safety.

"use client";

import { PiLeafFill } from "react-icons/pi";
import { FONT_CORMORANT, FONT_INTER, FONT_NUMERAL, v2 } from "@/lib/tokens";
import type { Post, Vendor } from "@/types/treehouse";

export interface FeedCardProps {
  post:     Post;
  vendor:   Vendor;
  /** Public-facing /shelf/<slug> URL. Reserved for future Tier B per-find
   *  QR overlay variant; not rendered in V1 single-card-repurposed pattern.
   *  Kept on contract per design record §3.5 component contract. */
  boothUrl: string;
  /** Forwarded so html2canvas-pro wrapper can target this exact node. */
  domRef?:  React.RefObject<HTMLDivElement>;
}

export function FeedCard({
  post,
  vendor,
  boothUrl: _boothUrl,
  domRef,
}: FeedCardProps) {
  const boothName = vendor.display_name;
  const boothNo   = vendor.booth_number;
  const title     = post.title;
  const price     = post.price_asking;

  return (
    <div
      ref={domRef}
      style={{
        // ─── Capture-node canvas (fixed 1080×1350, 4:5) ────────────────
        width:    1080,
        height:   1350,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        background: v2.text.primary, // dark fallback if photo fails
        display:        "flex",
        flexDirection:  "column",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* ─── Top green hero strip (~12% of canvas) ──────────────────── */}
      <div
        style={{
          height:         168,
          background:     `linear-gradient(160deg, ${v2.accent.green} 0%, ${v2.accent.greenMid} 100%)`,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          textAlign:      "center",
          padding:        "0 48px",
          flexShrink:     0,
        }}
      >
        <div
          style={{
            fontFamily: FONT_CORMORANT,
            fontStyle:  "italic",
            fontWeight: 500,
            fontSize:   56,
            lineHeight: 1.2,
            color:      v2.surface.card,
          }}
        >
          This week at <span style={{ fontWeight: 600 }}>{boothName}</span>
        </div>
      </div>

      {/* ─── Photo region (88%) — full-width below strip ────────────── */}
      <div
        style={{
          position: "relative",
          flex:     1,
          overflow: "hidden",
        }}
      >
        {/* Photo full-bleed */}
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

        {/* Bottom dark gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset:    0,
            background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        {/* Booth tag — upper left (D16 survives repost) */}
        {boothNo && (
          <div
            style={{
              position:      "absolute",
              top:           48,
              left:          48,
              background:    v2.surface.card,
              color:         v2.accent.green,
              padding:       "12px 24px",
              borderRadius:  8,
              fontFamily:    FONT_INTER,
              fontWeight:    700,
              fontSize:      26,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Booth {boothNo}
          </div>
        )}

        {/* Leaf bubble — upper right, Treehouse signature */}
        <div
          style={{
            position:        "absolute",
            top:             48,
            right:           48,
            width:           68,
            height:          68,
            borderRadius:    34,
            background:      v2.surface.card,
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
          }}
        >
          <PiLeafFill size={40} color={v2.accent.green} />
        </div>

        {/* Bottom meta — title + price on darkest gradient stop */}
        <div
          style={{
            position:  "absolute",
            left:      72,
            right:     72,
            bottom:    80,
            color:     v2.surface.card,
          }}
        >
          <div
            style={{
              fontFamily: FONT_CORMORANT,
              fontStyle:  "italic",
              fontWeight: 500,
              fontSize:   84,
              lineHeight: 1.15,
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
                fontSize:   68,
                color:      v2.priceGold,
                marginTop:  16,
                textShadow: "0 2px 12px rgba(0, 0, 0, 0.5)",
              }}
            >
              ${price}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
