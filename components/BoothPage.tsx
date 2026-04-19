// components/BoothPage.tsx
// Shared primitives for the Booth page (/my-shelf and /shelf/[slug]) — v1.1j
//
// Primitives exported:
//   - <BoothHero>            — vendor banner + booth post-it + edit/share bubbles
//   - <BoothTitleBlock>      — "a curated shelf from" eyebrow + vendor name (32px)
//   - <MallBlock>            — small pin + mall name + dotted-underline address
//   - <DiamondDivider>       — plain hairline (diamond retired v1.1j; name kept for export stability)
//   - <ViewToggle>           — "Window View · Shelf View" text-link pair
//   - <WindowView>           — 3-col 4:5 grid; 9-cell placeholder composition when showPlaceholders=true
//   - <PlaceholderTile>      — dashed empty 4:5 cell (owner-only, completes the 9-pane window)
//   - <ShelfView>            — horizontal scroll; first tile is <AddFindTile> when showAddTile=true
//   - <AddFindTile>          — dashed 4:5 CTA that links to /post
//   - <BoothCloser>          — hairline rule + quiet IM Fell italic closing line
//
// v1.1j changes (docs/design-system.md §v1.1j):
//   - Diamond ornament retired from <DiamondDivider> and <BoothCloser>; plain hairline now
//   - Post-it 36px numeral: FONT_IM_FELL → FONT_SYS ("1 vs I" disambiguation rule)
//   - <WindowView> gains `showPlaceholders` prop; <ShelfView> gains `showAddTile` prop (owner parity)
//   - <PlaceholderTile> new primitive, rendered only when owner has < 9 items
//
// v1.1h tokens (v1, FONT_IM_FELL, FONT_SYS) are imported from lib/tokens.ts —
// canonical since session 19A. They are re-exported here so existing imports
// from "@/components/BoothPage" in app/my-shelf and app/shelf/[slug] continue
// to resolve without touching those files.
//
// See docs/design-system.md §Booth page (v1.1h) for the committed spec.

"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Pencil, Check, Loader, ImagePlus } from "lucide-react";
import { vendorHueBg, mapsUrl } from "@/lib/utils";
import { v1, FONT_IM_FELL, FONT_SYS } from "@/lib/tokens";
import type { Post } from "@/types/treehouse";

// Re-export canonical v1.1h tokens so consumers of BoothPage primitives
// (app/my-shelf, app/shelf/[slug]) keep their existing imports working.
export { v1, FONT_IM_FELL, FONT_SYS };

const EASE = [0.25, 0.1, 0.25, 1] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Booth hero — banner + booth post-it + edit/share bubbles
// ─────────────────────────────────────────────────────────────────────────────

export function BoothHero({
  displayName,
  boothNumber,
  heroImageUrl,
  heroKey,
  onShare,
  hasCopied,
  canEdit,
  heroUploading,
  onHeroImageChange,
}: {
  displayName: string;
  boothNumber: string | null;
  heroImageUrl: string | null | undefined;
  heroKey: number;
  onShare: () => void;
  hasCopied: boolean;
  canEdit: boolean;
  heroUploading?: boolean;
  onHeroImageChange?: (file: File) => void;
}) {
  return (
    <div style={{ padding: "0 10px", position: "relative" }}>
      {/* Hidden file input for banner edit */}
      {canEdit && onHeroImageChange && (
        <input
          id="booth-banner-file"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onHeroImageChange(f);
            e.target.value = "";
          }}
        />
      )}

      <div
        style={{
          position: "relative",
          borderRadius: v1.bannerRadius,
          minHeight: 260,
          overflow: "visible", // post-it must overhang
          background: heroImageUrl ? undefined : vendorHueBg(displayName),
        }}
      >
        {/* Photograph (inner-clipped at banner radius) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: v1.bannerRadius,
            overflow: "hidden",
            background: heroImageUrl ? undefined : vendorHueBg(displayName),
          }}
        >
          {heroImageUrl && (
            <img
              key={heroKey}
              src={heroImageUrl}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
          )}
          {/* Subtle top scrim so edit/share bubbles read against light or dark photos */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "40%",
              background: "linear-gradient(to bottom, rgba(18,34,20,0.32) 0%, transparent 100%)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Edit banner (owner only) — top-left, dark translucent */}
        {canEdit && (
          <button
            onClick={() => document.getElementById("booth-banner-file")?.click()}
            disabled={heroUploading}
            aria-label="Edit banner"
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "rgba(20,18,12,0.52)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: heroUploading ? "default" : "pointer",
              WebkitTapHighlightColor: "transparent",
              zIndex: 10,
              padding: 0,
            }}
          >
            {heroUploading ? (
              <Loader size={13} style={{ color: "rgba(255,255,255,0.80)", animation: "spin 0.9s linear infinite" }} />
            ) : (
              <Pencil size={13} style={{ color: "rgba(255,255,255,0.88)" }} strokeWidth={1.8} />
            )}
          </button>
        )}

        {/* Share bubble — top-right, frosted paperCream (matches Find Detail save+share) */}
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
          {hasCopied ? (
            <motion.div
              key="copied"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ duration: 0.14 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 11px",
                borderRadius: 18,
                background: "rgba(30,77,43,0.85)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              <Check size={11} style={{ color: "#fff" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>Copied!</span>
            </motion.div>
          ) : (
            <motion.button
              onClick={onShare}
              aria-label="Share this shelf"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.14 }}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "rgba(232,221,199,0.78)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "0.5px solid rgba(42,26,10,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                padding: 0,
              }}
            >
              <Send size={17} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
            </motion.button>
          )}
        </div>

        {/* Booth post-it — bottom-right, pinned; same primitive as Find Detail */}
        {boothNumber && (
          <div
            style={{
              position: "absolute",
              bottom: -16,
              right: 14,
              width: 96,
              minHeight: 96,
              background: v1.postit,
              transform: "rotate(6deg)",
              transformOrigin: "bottom right",
              boxShadow: `0 6px 14px rgba(42,26,10,0.32), 0 0 0 0.5px rgba(42,26,10,0.16)`,
              padding: "14px 8px 10px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 12,
            }}
          >
            {/* Push pin — matte ink, no shine */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: -4,
                left: "50%",
                transform: "translateX(-50%)",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "rgba(42,26,10,0.72)",
                boxShadow: `inset 0 0 0 2px rgba(42,26,10,0.55), 0 1px 2px rgba(42,26,10,0.35)`,
              }}
            />
            <div
              style={{
                fontFamily: FONT_IM_FELL,
                fontStyle: "italic",
                fontSize: 14,
                color: v1.inkMuted,
                lineHeight: 1.1,
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              Booth<br />Location
            </div>
            <div
              style={{
                fontFamily: FONT_SYS,
                fontSize: 36,
                fontWeight: 500,
                color: v1.inkPrimary,
                letterSpacing: "-0.01em",
                lineHeight: 1,
              }}
            >
              {boothNumber}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Title block — "a curated shelf from" eyebrow + vendor name (32px)
// ─────────────────────────────────────────────────────────────────────────────

export function BoothTitleBlock({ displayName }: { displayName: string }) {
  return (
    <div style={{ padding: "36px 22px 6px" }}>
      <div
        style={{
          fontFamily: FONT_IM_FELL,
          fontStyle: "italic",
          fontSize: 13,
          color: v1.inkMuted,
          lineHeight: 1.3,
          margin: "0 0 4px",
        }}
      >
        a curated shelf from
      </div>
      <h1
        style={{
          fontFamily: FONT_IM_FELL,
          fontSize: 32,
          fontWeight: 400,
          color: v1.inkPrimary,
          lineHeight: 1.1,
          letterSpacing: "-0.005em",
          margin: 0,
        }}
      >
        {displayName}
      </h1>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mall block — small pin + mall name + dotted-underline address
// ─────────────────────────────────────────────────────────────────────────────

function PinGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size * (22 / 18)} viewBox="0 0 18 22" fill="none" aria-hidden="true">
      <path
        d="M9 1.2c-3.98 0-7.2 3.12-7.2 6.98 0 5.22 7.2 12.62 7.2 12.62s7.2-7.4 7.2-12.62C16.2 4.32 12.98 1.2 9 1.2z"
        stroke={v1.inkPrimary}
        strokeWidth="1.3"
        fill="none"
      />
      <circle cx="9" cy="8.3" r="2" fill={v1.inkPrimary} />
    </svg>
  );
}

export function MallBlock({
  mallName,
  mallCity,
  address,
}: {
  mallName: string;
  mallCity?: string;
  address?: string | null;
}) {
  const mapQuery = address
    ? address
    : [mallName, mallCity].filter(Boolean).join(", ");
  const href = mapsUrl(mapQuery);

  return (
    <div
      style={{
        padding: "16px 22px 4px",
        display: "grid",
        gridTemplateColumns: "22px 1fr",
        columnGap: 12,
        alignItems: "start",
      }}
    >
      <div style={{ paddingTop: 2 }}>
        <PinGlyph size={18} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FONT_IM_FELL,
            fontSize: 18,
            color: v1.inkPrimary,
            lineHeight: 1.3,
            letterSpacing: "-0.005em",
          }}
        >
          {mallName}
        </div>
        {address && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: FONT_SYS,
              fontSize: 14,
              color: v1.inkMuted,
              lineHeight: 1.55,
              textDecoration: "underline",
              textDecorationStyle: "dotted",
              textDecorationColor: v1.inkFaint,
              textUnderlineOffset: 3,
              alignSelf: "flex-start",
            }}
          >
            {address}
          </a>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Diamond divider — ◆ flanked by hairline rules
// ─────────────────────────────────────────────────────────────────────────────

export function DiamondDivider({
  topPad = 22,
  bottomPad = 12,
  horizontalPad = 44,
}: {
  topPad?: number;
  bottomPad?: number;
  horizontalPad?: number;
} = {}) {
  // v1.1j — diamond ornament retired; renders as a plain full-width hairline.
  // Name kept as `DiamondDivider` for export stability across consumers.
  return (
    <div
      style={{
        padding: `${topPad}px ${horizontalPad}px ${bottomPad}px`,
      }}
    >
      <div style={{ width: "100%", height: 1, background: v1.inkHairline }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// View toggle — "Window View · Shelf View" text-link pair
// ─────────────────────────────────────────────────────────────────────────────

export type BoothView = "window" | "shelf";

export function ViewToggle({
  view,
  onChange,
}: {
  view: BoothView;
  onChange: (v: BoothView) => void;
}) {
  function linkStyle(active: boolean): React.CSSProperties {
    return {
      fontFamily: FONT_IM_FELL,
      fontStyle: "italic",
      fontSize: 16,
      color: active ? v1.inkPrimary : v1.inkMuted,
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "4px 2px 6px",
      position: "relative",
      WebkitTapHighlightColor: "transparent",
      borderBottom: active ? `1px solid ${v1.inkPrimary}` : "1px solid transparent",
      lineHeight: 1.2,
    };
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        padding: "4px 22px 18px",
      }}
    >
      <button
        onClick={() => onChange("window")}
        style={linkStyle(view === "window")}
        aria-pressed={view === "window"}
      >
        Window View
      </button>
      <span
        aria-hidden="true"
        style={{
          fontFamily: FONT_IM_FELL,
          fontSize: 16,
          color: v1.inkFaint,
          lineHeight: 1,
        }}
      >
        ·
      </span>
      <button
        onClick={() => onChange("shelf")}
        style={linkStyle(view === "shelf")}
        aria-pressed={view === "shelf"}
      >
        Shelf View
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Window View — 3-col 4:5 portrait grid with titles + prices
// ─────────────────────────────────────────────────────────────────────────────

export function AddFindTile({ vendorId, index }: { vendorId?: string; index: number }) {
  const href = vendorId ? `/post?vendor=${vendorId}` : "/post";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: EASE }}
      style={{ width: "100%", display: "flex", flexDirection: "column", minWidth: 0 }}
    >
      <Link
        href={href}
        style={{
          width: "100%",
          aspectRatio: "4/5",
          borderRadius: v1.imageRadius,
          border: `1px dashed ${v1.inkFaint}`,
          background: "transparent",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          textDecoration: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <ImagePlus size={22} strokeWidth={1.5} style={{ color: v1.inkMuted }} />
        <span
          style={{
            fontFamily: FONT_IM_FELL,
            fontStyle: "italic",
            fontSize: 13,
            color: v1.inkMuted,
            lineHeight: 1,
          }}
        >
          Add a find
        </span>
      </Link>
      {/* Placeholder under the add tile so adjacent cells' titles+prices don't visually orphan it */}
      <div style={{ height: 22 }} aria-hidden="true" />
    </motion.div>
  );
}

export function PlaceholderTile({ index }: { index: number }) {
  // v1.1j — owner-only 4:5 empty cell used to complete the 9-pane window
  // composition when inventory is sparse. Same silhouette as <AddFindTile>
  // without the action affordance so the grid reads as "nine panels filling
  // from the top-left" rather than "a few tiles and a gap."
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: EASE }}
      style={{ width: "100%", display: "flex", flexDirection: "column", minWidth: 0 }}
      aria-hidden="true"
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "4/5",
          borderRadius: v1.imageRadius,
          border: `1px dashed ${v1.inkFaint}`,
          background: "transparent",
        }}
      />
      {/* Match AddFindTile's 22px title-slot placeholder so row heights align */}
      <div style={{ height: 22 }} aria-hidden="true" />
    </motion.div>
  );
}

function WindowTile({ post, index }: { post: Post; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const hasPrice = typeof post.price_asking === "number" && post.price_asking > 0;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: EASE }}
      style={{ width: "100%", display: "flex", flexDirection: "column", minWidth: 0 }}
    >
      <Link
        href={`/find/${post.id}`}
        style={{ display: "block", textDecoration: "none", color: "inherit", minWidth: 0 }}
      >
        <div
          style={{
            width: "100%",
            aspectRatio: "4/5",
            borderRadius: v1.imageRadius,
            border: `1px solid ${v1.inkHairline}`,
            overflow: "hidden",
            background: v1.postit,
            boxShadow: "0 2px 8px rgba(42,26,10,0.08), 0 1px 3px rgba(42,26,10,0.05)",
          }}
        >
          {post.image_url && !imgErr ? (
            <img
              src={post.image_url}
              alt={post.title}
              onError={() => setImgErr(true)}
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                padding: "12px 10px",
                display: "flex",
                alignItems: "flex-end",
                fontFamily: FONT_IM_FELL,
                fontSize: 12,
                color: v1.inkFaint,
              }}
            >
              no photograph
            </div>
          )}
        </div>
        <div
          style={{
            fontFamily: FONT_IM_FELL,
            fontStyle: "italic",
            fontSize: 13,
            color: v1.inkMid,
            lineHeight: 1.35,
            marginTop: 6,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
          }}
        >
          {post.title}
        </div>
        {hasPrice && (
          <div
            style={{
              fontFamily: FONT_SYS,
              fontSize: 12,
              color: v1.priceInk,
              lineHeight: 1.4,
              marginTop: 2,
              letterSpacing: "-0.005em",
            }}
          >
            ${Math.round(post.price_asking as number)}
          </div>
        )}
      </Link>
    </motion.div>
  );
}

export function WindowView({
  posts,
  vendorId,
  showAddTile,
  showPlaceholders = false,
}: {
  posts: Post[];
  vendorId?: string;
  showAddTile: boolean;
  showPlaceholders?: boolean;
}) {
  // v1.1j — owner 9-cell window composition. When showPlaceholders is true,
  // the grid always renders exactly 9 cells: [AddFindTile if shown] + real posts
  // + PlaceholderTiles to fill the remainder. Public shelf omits placeholders
  // entirely (showPlaceholders stays false) so visitors see only real inventory.
  const addTileCount     = showAddTile ? 1 : 0;
  const usedCells        = addTileCount + posts.length;
  const placeholderCount = showPlaceholders ? Math.max(0, 9 - usedCells) : 0;

  return (
    <div
      style={{
        padding: "0 10px 18px",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        columnGap: 10,
        rowGap: 18,
      }}
    >
      {showAddTile && <AddFindTile vendorId={vendorId} index={0} />}
      {posts.map((post, i) => (
        <WindowTile key={post.id} post={post} index={showAddTile ? i + 1 : i} />
      ))}
      {Array.from({ length: placeholderCount }).map((_, i) => (
        <PlaceholderTile key={`ph-${i}`} index={usedCells + i} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shelf View — horizontal scroll, larger 4:5 tiles
// ─────────────────────────────────────────────────────────────────────────────

function ShelfTile({ post, index, isFirst }: { post: Post; index: number; isFirst: boolean }) {
  const [imgErr, setImgErr] = useState(false);
  const hasPrice = typeof post.price_asking === "number" && post.price_asking > 0;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: EASE }}
      style={{
        flexShrink: 0,
        width: "52vw",
        maxWidth: 210,
        scrollSnapAlign: "start",
        marginLeft: isFirst ? 22 : 0,
      }}
    >
      <Link
        href={`/find/${post.id}`}
        style={{ display: "block", textDecoration: "none", color: "inherit" }}
      >
        <div
          style={{
            width: "100%",
            aspectRatio: "4/5",
            borderRadius: v1.imageRadius,
            border: `1px solid ${v1.inkHairline}`,
            overflow: "hidden",
            background: v1.postit,
            boxShadow: "0 2px 8px rgba(42,26,10,0.08), 0 1px 3px rgba(42,26,10,0.05)",
          }}
        >
          {post.image_url && !imgErr ? (
            <img
              src={post.image_url}
              alt={post.title}
              onError={() => setImgErr(true)}
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                padding: "12px 10px",
                display: "flex",
                alignItems: "flex-end",
                fontFamily: FONT_IM_FELL,
                fontSize: 13,
                color: v1.inkFaint,
              }}
            >
              no photograph
            </div>
          )}
        </div>
        <div
          style={{
            fontFamily: FONT_IM_FELL,
            fontStyle: "italic",
            fontSize: 14,
            color: v1.inkMid,
            lineHeight: 1.35,
            marginTop: 6,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
          }}
        >
          {post.title}
        </div>
        {hasPrice && (
          <div
            style={{
              fontFamily: FONT_SYS,
              fontSize: 13,
              color: v1.priceInk,
              lineHeight: 1.4,
              marginTop: 2,
              letterSpacing: "-0.005em",
            }}
          >
            ${Math.round(post.price_asking as number)}
          </div>
        )}
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Shelf variant of AddFindTile — same dimensions as ShelfTile (v1.1j)
// ─────────────────────────────────────────────────────────────────────────

function ShelfAddFindTile({ vendorId, isFirst }: { vendorId?: string; isFirst: boolean }) {
  const href = vendorId ? `/post?vendor=${vendorId}` : "/post";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, ease: EASE }}
      style={{
        flexShrink: 0,
        width: "52vw",
        maxWidth: 210,
        scrollSnapAlign: "start",
        marginLeft: isFirst ? 22 : 0,
      }}
    >
      <Link
        href={href}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          aspectRatio: "4/5",
          borderRadius: v1.imageRadius,
          border: `1px dashed ${v1.inkFaint}`,
          background: "transparent",
          textDecoration: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <ImagePlus size={24} strokeWidth={1.5} style={{ color: v1.inkMuted }} />
        <span
          style={{
            fontFamily: FONT_IM_FELL,
            fontStyle: "italic",
            fontSize: 14,
            color: v1.inkMuted,
            lineHeight: 1,
          }}
        >
          Add a find
        </span>
      </Link>
      {/* Match ShelfTile's title + price vertical rhythm so the AddFindTile
          doesn't visually orphan against neighboring items. */}
      <div style={{ height: 42 }} aria-hidden="true" />
    </motion.div>
  );
}

export function ShelfView({
  posts,
  vendorId,
  showAddTile = false,
}: {
  posts: Post[];
  vendorId?: string;
  showAddTile?: boolean;
}) {
  // v1.1j — owner parity with Window View: when showAddTile is true, the
  // first tile in the horizontal scroll is an AddFindTile (same silhouette
  // as the Window View AddFindTile, sized to match ShelfTile). Reverses the
  // session-18 rule that held AddFindTile exclusive to Window View.
  return (
    <div
      className="hide-scrollbar"
      style={{
        display: "flex",
        gap: 14,
        overflowX: "auto",
        overflowY: "hidden",
        paddingBottom: 10,
        paddingRight: 14,
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {showAddTile && <ShelfAddFindTile vendorId={vendorId} isFirst={true} />}
      {posts.map((post, i) => (
        <ShelfTile
          key={post.id}
          post={post}
          index={i}
          isFirst={i === 0 && !showAddTile}
        />
      ))}
      <div style={{ flexShrink: 0, width: 8 }} aria-hidden="true" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Booth closer — diamond divider + quiet IM Fell italic line
// ─────────────────────────────────────────────────────────────────────────────

export function BoothCloser() {
  // v1.1j — hairline rule replaces diamond-flanked divider (diamond retired)
  return (
    <>
      <div style={{ padding: "28px 22px 20px" }}>
        <div style={{ width: "100%", height: 1, background: v1.inkHairline }} />
      </div>
      <div
        style={{
          fontFamily: FONT_IM_FELL,
          fontStyle: "italic",
          fontSize: 16,
          color: v1.inkMid,
          lineHeight: 1.5,
          padding: "0 28px",
          textAlign: "center",
        }}
      >
        The shelf ends here. More booths await you.
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles helper — inject once per Booth page (hide-scrollbar, spin keyframe)
// ─────────────────────────────────────────────────────────────────────────────

export function BoothPageStyles() {
  return (
    <style>{`
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .hide-scrollbar::-webkit-scrollbar { display: none; }
      .hide-scrollbar { scrollbar-width: none; }
      .hidden { display: none; }
    `}</style>
  );
}
