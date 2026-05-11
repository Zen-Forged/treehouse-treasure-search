// components/ShelfImageTemplate.tsx
// Session 152 — Share My Shelf social image template.
//
// Fixed 1080×1350 portrait (Facebook feed + Instagram square cross-compat),
// data-driven from Vendor + Mall + Post[]. Renders a hidden DOM node that
// html2canvas-pro captures into a downloadable PNG via the wrapper screen
// (<ShelfImageShareScreen>).
//
// Rendered OFF-SCREEN (position:absolute, left:-9999px) so vendors don't see
// the raw template at 1080px wide; html2canvas captures the pixel-perfect
// node regardless of where it sits in the DOM.
//
// Layout (1080×1350):
//   - 64px page padding (top/bottom/left/right)
//   - Eyebrow row: "FROM TREEHOUSE FINDS" small-caps Inter + leaf glyph
//   - Booth name: FONT_CORMORANT italic ~52px (lineHeight 1.3 per
//     feedback_lora_lineheight_minimum_for_clamp ✅ Promoted at session 107 —
//     generalizes to all clamped serif including Cormorant)
//   - Mall-row: PiMapPin + mall name + booth pill (FONT_INTER)
//   - Hairline divider
//   - 3×2 photo grid: 6 posts max, 308×308 squares with 12px gaps. Each tile
//     v2.surface.card bg + v2.border.light hairline + inline shadow canonical
//     (matches PolaroidTile / SavedMallCardV2 vocabulary across the app).
//   - Empty slots (when fewer than 6 posts): warm placeholder with leaf glyph
//   - CTA bar: green pill "See the shelf before you visit"
//   - Footer row: wordmark left + QR code right (booth URL)
//
// Cross-origin handling: all <img> tags set crossOrigin="anonymous" so
// Supabase storage CDN images don't taint the canvas on iOS Safari. The
// Supabase public-bucket policy + CORS headers cooperate with anonymous CORS.
//
// Post image cropping: object-fit:cover with center anchor. Captures the
// dominant subject of vendor's photo even when source aspect isn't square.

"use client";

import QRCode from "react-qr-code";
// react-icons/pi exposes weight variants as separate imports (PiLeafFill,
// PiLeafDuotone) rather than a `weight` prop — IconBaseProps doesn't expose
// weight. Match project convention from FlagGlyph.tsx.
import { PiLeafFill, PiLeafDuotone, PiMapPin } from "react-icons/pi";
import { FONT_CORMORANT, FONT_INTER, v2 } from "@/lib/tokens";
import type { Mall, Post, Vendor } from "@/types/treehouse";

export interface ShelfImageTemplateProps {
  vendor: Vendor;
  mall:   Mall | null;
  posts:  Post[];   // up to 6; rendered in order
  /** Public-facing booth URL embedded in QR code. */
  boothUrl: string;
  /** Forwarded to outer wrapper so html2canvas can target this exact node. */
  domRef?:  React.RefObject<HTMLDivElement>;
}

export function ShelfImageTemplate({
  vendor,
  mall,
  posts,
  boothUrl,
  domRef,
}: ShelfImageTemplateProps) {
  // Cap at 6; if fewer, remaining grid slots render placeholders.
  const visiblePosts = posts.slice(0, 6);
  const placeholderCount = Math.max(0, 6 - visiblePosts.length);

  const boothName = vendor.display_name;
  const boothNo   = vendor.booth_number;
  const mallName  = mall?.name ?? vendor.mall?.name ?? "";

  return (
    <div
      ref={domRef}
      style={{
        // Fixed pixel-exact dimensions. html2canvas honors these.
        width:       1080,
        height:      1350,
        background:  v2.bg.main,
        color:       v2.text.primary,
        padding:     64,
        display:     "flex",
        flexDirection: "column",
        boxSizing:   "border-box",
        // Off-screen positioning so vendor never sees the raw 1080px node.
        // Wrapper screen mounts this; html2canvas captures regardless of
        // visibility. Keep visible=hidden OFF (html2canvas can't capture
        // display:none nodes), but position fully off-page.
        position:    "absolute",
        left:        -99999,
        top:         0,
        // Disable any pointer interactions on the off-screen capture node.
        pointerEvents: "none",
        // Anti-alias text consistently across capture.
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* ─── Eyebrow row ─────────────────────────────────────────────── */}
      <div
        style={{
          display:    "flex",
          alignItems: "center",
          gap:        10,
          marginBottom: 18,
        }}
      >
        <PiLeafFill size={20} color={v2.accent.green} />
        <span
          style={{
            fontFamily:    FONT_INTER,
            fontWeight:    600,
            fontSize:      14,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color:         v2.text.muted,
          }}
        >
          From Treehouse Finds
        </span>
      </div>

      {/* ─── Booth name ──────────────────────────────────────────────── */}
      <h1
        style={{
          fontFamily:   FONT_CORMORANT,
          fontStyle:    "italic",
          fontWeight:   500,
          fontSize:     64,
          lineHeight:   1.3,
          color:        v2.text.primary,
          margin:       "0 0 14px 0",
          // Allow up to 2 lines; very long names will wrap naturally.
          // Per feedback_lora_lineheight_minimum_for_clamp ✅ Promoted —
          // serif descenders need 1.3+ even uncamped to keep g/j/p/y clean.
        }}
      >
        {boothName}
      </h1>

      {/* ─── Mall row (PiMapPin + mall name + booth pill) ───────────── */}
      <div
        style={{
          display:    "flex",
          alignItems: "center",
          gap:        12,
          marginBottom: 32,
        }}
      >
        <PiMapPin size={22} color={v2.text.secondary} />
        <span
          style={{
            fontFamily:    FONT_INTER,
            fontSize:      22,
            fontWeight:    500,
            color:         v2.text.secondary,
            letterSpacing: "0.01em",
          }}
        >
          {mallName}
        </span>
        {boothNo && (
          <span
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              padding:        "4px 12px",
              fontFamily:     FONT_INTER,
              fontSize:       14,
              fontWeight:     600,
              letterSpacing:  "0.06em",
              textTransform:  "uppercase",
              color:          v2.text.secondary,
              background:     v2.surface.warm,
              border:         `1px solid ${v2.border.light}`,
              borderRadius:   999,
              marginLeft:     2,
            }}
          >
            Booth {boothNo}
          </span>
        )}
      </div>

      {/* ─── Hairline divider ───────────────────────────────────────── */}
      <div
        style={{
          height:       1,
          background:   v2.border.light,
          marginBottom: 26,
        }}
      />

      {/* ─── 3×2 photo grid ─────────────────────────────────────────── */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows:    "repeat(2, 1fr)",
          gap:                 12,
          flex:                "0 0 auto",
          width:               "100%",
          height:              628, // 308 + 12 + 308
        }}
      >
        {visiblePosts.map(post => (
          <PostTile key={post.id} post={post} />
        ))}
        {Array.from({ length: placeholderCount }).map((_, i) => (
          <PlaceholderTile key={`placeholder-${i}`} />
        ))}
      </div>

      {/* ─── CTA bar ────────────────────────────────────────────────── */}
      <div
        style={{
          background:    v2.accent.green,
          borderRadius:  14,
          padding:       "22px 28px",
          marginTop:     36,
          display:       "flex",
          alignItems:    "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily:    FONT_CORMORANT,
            fontStyle:     "italic",
            fontWeight:    500,
            fontSize:      32,
            color:         "#FBF6EA", // cream — explicit hex; matches v2.surface.warm,
                                       // but html2canvas resolves better with literal colors
                                       // than CSS vars in some Safari versions.
            letterSpacing: "0.01em",
          }}
        >
          See the shelf before you visit
        </span>
      </div>

      {/* ─── Footer row (wordmark left + QR right) ─────────────────── */}
      <div
        style={{
          marginTop:      "auto",
          paddingTop:     28,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
        }}
      >
        {/* Wordmark — uses /wordmark.png at canonical 72px height per
            session 95. crossOrigin not strictly needed for same-origin
            assets but set for parity with post images. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/wordmark.png"
          alt="Treehouse Finds"
          height={72}
          style={{ height: 72, width: "auto" }}
          crossOrigin="anonymous"
        />
        {/* QR code — booth URL. Vendors can print this image and put it
            in their physical booth window; QR scans straight to /shelf/<slug>. */}
        <div
          style={{
            background:    "#FFFFFF",
            padding:       10,
            borderRadius:  8,
            border:        `1px solid ${v2.border.light}`,
            boxShadow:     "0 1px 2px rgba(43,33,26,0.04)",
          }}
        >
          <QRCode
            value={boothUrl}
            size={96}
            bgColor="#FFFFFF"
            fgColor="#2A1A0A"
            level="M"
          />
        </div>
      </div>
    </div>
  );
}

// ─── PostTile ──────────────────────────────────────────────────────────────
function PostTile({ post }: { post: Post }) {
  const imageUrl = post.image_url;
  return (
    <div
      style={{
        background:    v2.surface.card,
        border:        `1px solid ${v2.border.light}`,
        borderRadius:  10,
        boxShadow:     "0 1px 2px rgba(43,33,26,0.04)",
        overflow:      "hidden",
        position:      "relative",
        // 1:1 aspect — 308×308 in fixed grid.
      }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={post.title ?? "Find"}
          crossOrigin="anonymous"
          style={{
            width:     "100%",
            height:    "100%",
            objectFit: "cover",
            objectPosition: "center",
            display:   "block",
          }}
        />
      ) : (
        <PlaceholderInner />
      )}
    </div>
  );
}

// ─── PlaceholderTile ───────────────────────────────────────────────────────
// Renders when vendor has fewer than 6 posts. Subtle warm fill + leaf glyph;
// no copy (would compete with the surrounding photos visually).
function PlaceholderTile() {
  return (
    <div
      style={{
        background:    v2.surface.warm,
        border:        `1px dashed ${v2.border.medium}`,
        borderRadius:  10,
        display:       "flex",
        alignItems:    "center",
        justifyContent: "center",
      }}
    >
      <PlaceholderInner />
    </div>
  );
}

function PlaceholderInner() {
  return <PiLeafDuotone size={40} color={v2.text.muted} />;
}
