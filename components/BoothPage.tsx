// components/BoothPage.tsx
// Shared primitives for the Booth page (/my-shelf and /shelf/[slug]) — v1.1j
//
// Primitives exported:
//   - <BoothHero>            — vendor banner + booth post-it + edit bubble
//   - <BoothTitleBlock>      — "A curated booth from" eyebrow + vendor name (32px)
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
//   - Post-it 36px numeral: FONT_LORA → FONT_SYS ("1 vs I" disambiguation rule)
//   - <WindowView> gains `showPlaceholders` prop; <ShelfView> gains `showAddTile` prop (owner parity)
//   - <PlaceholderTile> new primitive, rendered only when owner has < 9 items
//
// Session 46 (2026-04-22) — small-type legibility sweep:
//   WindowTile caption: FONT_LORA italic 13px → FONT_SYS 14px (400 wt).
//   ShelfTile caption:  FONT_LORA italic 14px → FONT_SYS 14px (400 wt,
//                        same size, font swap only).
//   Rationale lives on app/find/[id]/page.tsx's header (the Find Detail
//   ShelfCard got the same treatment in this commit). In short: italic
//   serif at small sizes loses stroke contrast on paperCream and failed
//   the 40–65 demographic. FONT_SYS already carries the cartographic /
//   wayfinding voice on these pages (address, prices). Decorative serif
//   voice preserved on 32px vendor name, mall name, BoothTitleBlock
//   eyebrow, ViewToggle, and BoothCloser. Only the tile captions move.
//
// Session 45 (2026-04-22) — BoothHero URL link-share retired:
//   The top-right frosted airplane bubble (navigator.share / clipboard URL
//   fallback) was removed to resolve confusion with the masthead paper-
//   airplane (Window email via /api/share-booth). Two airplanes on one
//   page, both labeled "Share this ___," both rendering similar glyphs,
//   was a recurring "which one does what?" friction point for admin + QA.
//
//   The masthead airplane is now the sole share affordance on Booth pages.
//   It opens <ShareBoothSheet> which sends a curated 6-find Window email
//   via Resend — a richer outcome than the URL copy the hero bubble used
//   to produce. Users who want to share the plain URL can still use the
//   browser's native share menu or address bar copy.
//
//   Consumers that used to pass `onShare` and `hasCopied` no longer need
//   to — the props were removed from <BoothHero>'s interface. The local
//   `copied` state and `handleShare` functions in /my-shelf and
//   /shelf/[slug] were also removed at the same commit. The `Send` and
//   `Check` imports (only used by the bubble) were removed from this file.
//
//   The top scrim gradient over the hero photo is preserved — the edit
//   bubble (top-left, owner-only) still needs contrast against bright
//   photography in that region.
//
// v1.1h tokens (v1, FONT_LORA, FONT_SYS) are imported from lib/tokens.ts —
// canonical since session 19A. They are re-exported here so existing imports
// from "@/components/BoothPage" in app/my-shelf and app/shelf/[slug] continue
// to resolve without touching those files.
//
// See docs/design-system.md §Booth page (v1.1h) for the committed spec.

"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Loader, ImagePlus } from "lucide-react";
import { vendorHueBg, mapsUrl, boothNumeralSize } from "@/lib/utils";
import {
  v1,
  FONT_LORA,
  FONT_SYS,
  FONT_NUMERAL,
  MOTION_SHARED_ELEMENT_EASE,
  MOTION_SHARED_ELEMENT_FORWARD,
} from "@/lib/tokens";
import { TREEHOUSE_LENS_FILTER } from "@/lib/treehouseLens";
import PhotoLightbox from "@/components/PhotoLightbox";
import BookmarkBoothBubble from "@/components/BookmarkBoothBubble";
import type { Post } from "@/types/treehouse";

// Re-export canonical v1.1h tokens so consumers of BoothPage primitives
// (app/my-shelf, app/shelf/[slug]) keep their existing imports working.
// FONT_NUMERAL renamed from FONT_POSTIT_NUMERAL in session 75 (broader scope).
export { v1, FONT_LORA, FONT_SYS, FONT_NUMERAL };

const EASE = [0.25, 0.1, 0.25, 1] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Booth hero — banner + booth post-it + edit bubble + (session 80) bookmark
// Session 45 (2026-04-22) — top-right frosted share bubble removed; see
// file-header note. Masthead airplane is now the sole share affordance.
// Session 80 (2026-04-28) — bookmark relocated FROM /shelf/[slug] masthead
// TO BoothHero photo top-right corner per docs/bookmark-relocation-design.md.
// Mirrors session 78 /find/[id] flag-on-photo pattern. Bubble is a sibling
// of the photograph motion.div (D2), no own layoutId (D4) — static fade-in.
// ─────────────────────────────────────────────────────────────────────────────

export function BoothHero({
  displayName,
  boothNumber,
  heroImageUrl,
  heroKey,
  canEdit,
  heroUploading,
  onHeroImageChange,
  layoutId,
  saved,
  onToggleBookmark,
}: {
  displayName: string;
  boothNumber: string | null;
  heroImageUrl: string | null | undefined;
  heroKey: number;
  canEdit: boolean;
  heroUploading?: boolean;
  onHeroImageChange?: (file: File) => void;
  /**
   * Track D phase 5 (docs/marketplace-transitions-design.md) — when set,
   * the photograph container becomes a `<motion.div layoutId>` so the
   * shared-element transition from /shelves morphs the booth tile into
   * the hero. Public /shelf/[slug] passes `booth-${vendor.id}`; /my-shelf
   * and admin /my-shelf views omit the prop (no source surface points at
   * those routes via this transition).
   */
  layoutId?: string;
  /**
   * Session 80 — bookmark on photo corner (docs/bookmark-relocation-design.md).
   * When both `saved` and `onToggleBookmark` are passed, the BoothHero renders
   * a 36×36 bookmark bubble at top:8 right:8 of the photograph. /shelf/[slug]
   * passes both for non-owners; /my-shelf and owners omit them (D6 — owners
   * can't bookmark their own booth).
   */
  saved?: boolean;
  onToggleBookmark?: () => void;
}) {
  // Session 75 — tap hero photo to open lightbox (matches /find/[id] pattern).
  // Only mounts when heroImageUrl is present; the vendorHueBg fallback has
  // nothing to enlarge.
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
        {/* Photograph (inner-clipped at banner radius). Track D phase 5 —
            when `layoutId` is set, this is the shared-element target that
            morphs from a /shelves tile via framer-motion. */}
        <motion.div
          layoutId={layoutId}
          transition={{ duration: MOTION_SHARED_ELEMENT_FORWARD, ease: MOTION_SHARED_ELEMENT_EASE }}
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
          {/* Subtle top scrim so the edit bubble reads against light or dark photos.
              (Session 45: share bubble removed; scrim preserved for the edit bubble.) */}
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
        </motion.div>

        {/* Tap-to-open lightbox overlay. Sits above the photo container but
            below the edit pencil (z 10) and post-it (z 12) so those keep
            their existing tap targets. Only mounted when there's a real
            photo to enlarge. */}
        {heroImageUrl && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="View booth photo"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: v1.bannerRadius,
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              zIndex: 5,
            }}
          />
        )}

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

        {/* Session 45 — share bubble retired here. Share affordance lives on
            the page masthead (top-right airplane → <ShareBoothSheet>). */}

        {/* Session 80 — bookmark bubble (D2: SIBLING of photograph motion.div,
            D4: no own layoutId). Position + dimensions mirror the /find/[id]
            flag bubble (top:8 right:8, 36×36 frosted). z-index 11 sits between
            the lightbox overlay (z 5) and the post-it (z 12) so the bookmark
            stays interactive without obstructing the post-it tap target. Only
            mounts when caller passes both saved + onToggleBookmark (D6). */}
        {saved !== undefined && onToggleBookmark && (
          <div style={{ position: "absolute", top: 8, right: 8, zIndex: 11 }}>
            <BookmarkBoothBubble
              saved={saved}
              size="hero"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark();
              }}
            />
          </div>
        )}

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
                fontFamily: FONT_SYS,
                fontSize: 9,
                fontWeight: 700,
                color: v1.green,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                lineHeight: 1,
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              Booth
            </div>
            <div
              style={{
                fontFamily: FONT_NUMERAL,
                fontSize: boothNumeralSize(boothNumber),
                fontWeight: 500,
                color: v1.green,
                letterSpacing: "-0.01em",
                lineHeight: 1,
              }}
            >
              {boothNumber}
            </div>
          </div>
        )}
      </div>

      <PhotoLightbox
        open={lightboxOpen}
        src={heroImageUrl ?? null}
        alt={`${displayName} booth photo`}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Title block — "A curated booth from" eyebrow + vendor name (32px)
// ─────────────────────────────────────────────────────────────────────────────

export function BoothTitleBlock({
  displayName,
  onPickerOpen,
}: {
  displayName: string;
  /**
   * Q-002 (session 57) — when the consumer is `/my-shelf` for a vendor with
   * more than one claimed booth, passing this callback turns the 32px
   * display name into a tap target with an inline chevron. Opens the booth
   * switcher sheet. Non-multi-booth consumers (Public Shelf, single-booth
   * /my-shelf) omit the prop; the chevron is invisible and the H1 renders
   * unchanged.
   */
  onPickerOpen?: () => void;
}) {
  const hasPicker = !!onPickerOpen;
  return (
    <div style={{ padding: "36px 22px 6px" }}>
      <div
        style={{
          fontFamily: FONT_LORA,
          fontStyle: "italic",
          fontSize: 13,
          color: v1.inkMuted,
          lineHeight: 1.3,
          margin: "0 0 4px",
        }}
      >
        A curated booth from
      </div>
      {hasPicker ? (
        <button
          onClick={onPickerOpen}
          aria-label={`Switch booth — viewing ${displayName}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            margin: 0,
            padding: 0,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            WebkitTapHighlightColor: "transparent",
            maxWidth: "100%",
          }}
        >
          <h1
            style={{
              fontFamily: FONT_LORA,
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
          <span
            aria-hidden="true"
            style={{
              fontFamily: FONT_LORA,
              fontSize: 20,
              color: v1.inkMuted,
              lineHeight: 1,
              marginTop: 4,
            }}
          >
            ▾
          </span>
        </button>
      ) : (
        <h1
          style={{
            fontFamily: FONT_LORA,
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
      )}
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
            fontFamily: FONT_LORA,
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
      fontFamily: FONT_LORA,
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
          fontFamily: FONT_LORA,
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

export function AddFindTile({
  vendorId,
  index,
  onAddClick,
}: {
  vendorId?: string;
  index: number;
  onAddClick?: () => void;
}) {
  // v1.2 — /my-shelf now handles adds via <AddFindSheet> and passes
  // onAddClick. If no handler is passed (public /shelf/[slug] has no add
  // context), we fall back to the v1.1 /post link. When /post is fully
  // retired post-beta, that fallback can be removed.
  const href = vendorId ? `/post?vendor=${vendorId}` : "/post";
  const tileStyle: React.CSSProperties = {
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
    cursor: "pointer",
  };
  const inner = (
    <>
      <ImagePlus size={22} strokeWidth={1.5} style={{ color: v1.inkMuted }} />
      <span
        style={{
          fontFamily: FONT_LORA,
          fontStyle: "italic",
          fontSize: 13,
          color: v1.inkMuted,
          lineHeight: 1,
        }}
      >
        Add a find
      </span>
    </>
  );
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: EASE }}
      style={{ width: "100%", display: "flex", flexDirection: "column", minWidth: 0 }}
    >
      {onAddClick ? (
        <button
          type="button"
          onClick={onAddClick}
          aria-label="Add a find"
          style={{ ...tileStyle, padding: 0 }}
        >
          {inner}
        </button>
      ) : (
        <Link href={href} style={tileStyle}>
          {inner}
        </Link>
      )}
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
            background: "#faf2e0",
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: "0 6px 14px rgba(42,26,10,0.20), 0 1.5px 3px rgba(42,26,10,0.10)",
            padding: "7px 7px 0",
          }}
        >
          <div
            style={{
              width: "100%",
              aspectRatio: "4/5",
              background: v1.postit,
            }}
          >
            {post.image_url && !imgErr ? (
              <img
                src={post.image_url}
                alt={post.title}
                onError={() => setImgErr(true)}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  filter:       TREEHOUSE_LENS_FILTER,
                  WebkitFilter: TREEHOUSE_LENS_FILTER,
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  padding: "12px 10px",
                  display: "flex",
                  alignItems: "flex-end",
                  fontFamily: FONT_LORA,
                  fontSize: 12,
                  color: v1.inkFaint,
                }}
              >
                no photograph
              </div>
            )}
          </div>
          <div style={{ padding: "9px 3px 11px", minHeight: 76 }}>
            <div
              style={{
                fontFamily: FONT_LORA,
                fontSize: 14,
                color: v1.inkPrimary,
                lineHeight: 1.2,
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
                  marginTop: 3,
                  letterSpacing: "-0.005em",
                }}
              >
                ${Math.round(post.price_asking as number)}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function WindowView({
  posts,
  vendorId,
  showAddTile,
  showPlaceholders = false,
  onAddClick,
}: {
  posts: Post[];
  vendorId?: string;
  showAddTile: boolean;
  showPlaceholders?: boolean;
  onAddClick?: () => void;
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
      {posts.map((post, i) => (
        <WindowTile key={post.id} post={post} index={i} />
      ))}
      {showAddTile && <AddFindTile vendorId={vendorId} index={posts.length} onAddClick={onAddClick} />}
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
            background: "#faf2e0",
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: "0 6px 14px rgba(42,26,10,0.20), 0 1.5px 3px rgba(42,26,10,0.10)",
            padding: "7px 7px 0",
          }}
        >
          <div
            style={{
              width: "100%",
              aspectRatio: "4/5",
              background: v1.postit,
            }}
          >
            {post.image_url && !imgErr ? (
              <img
                src={post.image_url}
                alt={post.title}
                onError={() => setImgErr(true)}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  filter:       TREEHOUSE_LENS_FILTER,
                  WebkitFilter: TREEHOUSE_LENS_FILTER,
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  padding: "12px 10px",
                  display: "flex",
                  alignItems: "flex-end",
                  fontFamily: FONT_LORA,
                  fontSize: 13,
                  color: v1.inkFaint,
                }}
              >
                no photograph
              </div>
            )}
          </div>
          <div style={{ padding: "9px 3px 11px", minHeight: 76 }}>
            <div
              style={{
                fontFamily: FONT_LORA,
                fontSize: 14,
                color: v1.inkPrimary,
                lineHeight: 1.2,
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
                  marginTop: 3,
                  letterSpacing: "-0.005em",
                }}
              >
                ${Math.round(post.price_asking as number)}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Shelf variant of AddFindTile — same dimensions as ShelfTile (v1.1j)
// ─────────────────────────────────────────────────────────────────────────

function ShelfAddFindTile({
  vendorId,
  isFirst,
  onAddClick,
}: {
  vendorId?: string;
  isFirst: boolean;
  onAddClick?: () => void;
}) {
  const href = vendorId ? `/post?vendor=${vendorId}` : "/post";
  const tileStyle: React.CSSProperties = {
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
    cursor: "pointer",
  };
  const inner = (
    <>
      <ImagePlus size={24} strokeWidth={1.5} style={{ color: v1.inkMuted }} />
      <span
        style={{
          fontFamily: FONT_LORA,
          fontStyle: "italic",
          fontSize: 14,
          color: v1.inkMuted,
          lineHeight: 1,
        }}
      >
        Add a find
      </span>
    </>
  );
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
      {onAddClick ? (
        <button
          type="button"
          onClick={onAddClick}
          aria-label="Add a find"
          style={{ ...tileStyle, padding: 0 }}
        >
          {inner}
        </button>
      ) : (
        <Link href={href} style={tileStyle}>
          {inner}
        </Link>
      )}
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
  onAddClick,
}: {
  posts: Post[];
  vendorId?: string;
  showAddTile?: boolean;
  onAddClick?: () => void;
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
      {posts.map((post, i) => (
        <ShelfTile
          key={post.id}
          post={post}
          index={i}
          isFirst={i === 0}
        />
      ))}
      {showAddTile && <ShelfAddFindTile vendorId={vendorId} isFirst={posts.length === 0} onAddClick={onAddClick} />}
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
          fontFamily: FONT_LORA,
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
