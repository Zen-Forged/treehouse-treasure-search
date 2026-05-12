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
//   - <BoothCloser>          — hairline rule + quiet Lora italic closing line
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
import { Pencil, ImagePlus } from "lucide-react";
import { vendorHueBg, mapsUrl, boothNumeralSize } from "@/lib/utils";
import {
  v1,
  v2,
  FONT_LORA,
  FONT_SYS,
  FONT_NUMERAL,
  FONT_CORMORANT,
  FONT_INTER,
  MOTION_SHARED_ELEMENT_EASE,
  MOTION_SHARED_ELEMENT_FORWARD,
} from "@/lib/tokens";
import PhotoLightbox from "@/components/PhotoLightbox";
import BookmarkBoothBubble from "@/components/BookmarkBoothBubble";
import HomeFeedTile from "@/components/v2/HomeFeedTile";
import { writeFindContext, type FindRef } from "@/lib/findContext";
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
  layoutId,
  saved,
  onToggleBookmark,
}: {
  displayName: string;
  boothNumber: string | null;
  heroImageUrl: string | null | undefined;
  heroKey: number;
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

        {/* Hero edit affordances (replace photo + remove photo) live inside
            EditBoothSheet now — entered via the title-block Pencil. The old
            on-photo Pencil + Trash bubbles + their hidden file input were
            retired so the photograph reads as a clean image, with all booth
            edit chrome consolidated on the single title affordance. */}

        {/* Bookmark bubble (session 80 D2: SIBLING of photograph motion.div,
            D4: no own layoutId). Session 128 (refinement design D1): position
            REVERSES session 89's bottom-left placement and returns to session
            80's top-right slot for system-wide save/bookmark consistency
            (David: 'keeps saved/bookmarked icon location consistent'). The
            session-89 diagonal-balance-with-post-it framing is overridden by
            the consistency rule — Home heart, /flagged unsave, /find/[id]
            flag, and /shelf/[slug] tile saves all live in top-right slots.
            z-index 11 sits between lightbox overlay (z 5) and post-it (z 12)
            so the bookmark stays interactive without obstructing post-it tap
            target. Only mounts when caller passes both saved + onToggleBookmark. */}
        {saved !== undefined && onToggleBookmark && (
          <div style={{ position: "absolute", top: 12, right: 12, zIndex: 11 }}>
            <BookmarkBoothBubble
              saved={saved}
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark();
              }}
            />
          </div>
        )}

        {/* Booth post-it — bottom-right, pinned; same primitive as Find Detail.
            v2 Arc 4.5 — bg + label + numeral colors migrate to v2:
              v1.postit (#fbf3df) → v2.surface.card (#FFFCF5; brighter card stock)
              FONT_SYS "Booth" label → FONT_INTER (matches v2 small-caps voice)
              v1.green label/numeral → v2.accent.green (canonical v2 brand green)
            FONT_NUMERAL preserved per project canonical (session 75 rule:
            letters → editorial serif or sans; numbers → FONT_NUMERAL).
            Pin shadow + push-pin rgba textures preserved — physical-stamp
            character is intentionally outside the v2 palette migration. */}
        {boothNumber && (
          <div
            style={{
              position: "absolute",
              bottom: -16,
              right: 14,
              width: 96,
              minHeight: 96,
              background: v2.surface.card,
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
                fontFamily: FONT_INTER,
                fontSize: 9,
                fontWeight: 700,
                color: v2.accent.green,
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
                color: v2.accent.green,
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
  onEditName,
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
  /**
   * Wave 1 Task 4 (session 91) — vendor self-edit affordance. When supplied,
   * renders a small Pencil bubble inline at the right of the title block.
   * Only `/my-shelf` passes this when the actor is the booth's owner (not
   * admin impersonating); shopper Shelf and admin /shelves omit it.
   */
  onEditName?: () => void;
}) {
  const hasPicker = !!onPickerOpen;
  const hasEdit   = !!onEditName;
  return (
    // Session 128 (refinement design D6): outer wrapper textAlign:"center"
    // + flex row justifyContent:"center" centers the eyebrow, h1, picker
    // chevron, and edit pencil as a group. Was left-aligned in prod; David
    // flagged during V1 review. Affects both /shelf/[slug] and /my-shelf
    // via this shared primitive.
    // v2 Arc 4.4 — typography + colors migrate. Eyebrow + vendor name +
    // picker chevron all become FONT_CORMORANT (single editorial serif
    // family per system-level Q1 (a) lock). Edit Pencil bubble adopts
    // v2 chrome vocabulary (v2.surface.warm + v2.border.light + green
    // glyph; mirrors HomeFeedTile/StarFavoriteBubble/BookmarkBoothBubble
    // affordance-bubble shape at the smaller 32×32 self-edit size).
    <div style={{ padding: "36px 22px 4px", textAlign: "center" }}>
      <div
        style={{
          fontFamily: FONT_CORMORANT,
          fontStyle: "italic",
          fontSize: 16,
          color: v2.text.secondary,
          lineHeight: 1.3,
          margin: "0 0 4px",
        }}
      >
        A curated booth by
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 10 }}>
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
              textAlign: "center",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <h1
              style={{
                fontFamily: FONT_CORMORANT,
                fontSize: 32,
                // Review Board Finding 8A (session 153) — fontWeight 400 → 600.
                fontWeight: 600,
                color: v2.text.primary,
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
                fontFamily: FONT_CORMORANT,
                fontSize: 20,
                color: v2.text.muted,
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
              fontFamily: FONT_CORMORANT,
              fontSize: 32,
              // Review Board Finding 8A (session 153) — fontWeight 400 → 600.
              fontWeight: 600,
              color: v2.text.primary,
              lineHeight: 1.1,
              letterSpacing: "-0.005em",
              margin: 0,
            }}
          >
            {displayName}
          </h1>
        )}

        {hasEdit && (
          <button
            onClick={onEditName}
            aria-label="Edit booth name"
            style={{
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: v2.surface.warm,
              border: `1px solid ${v2.border.light}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              marginTop: 4,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Pencil size={13} style={{ color: v2.accent.green }} strokeWidth={1.8} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mall block — small pin + mall name + dotted-underline address
// ─────────────────────────────────────────────────────────────────────────────

function PinGlyph({ size = 18 }: { size?: number }) {
  // v2 Arc 4.3 — stroke + fill migrate v1.inkPrimary → v2.text.primary.
  // Path geometry preserved as-is; Phosphor PiMapPin migration is a
  // separate icon-vocabulary decision outside Q1 (a) token-swap scope.
  return (
    <svg width={size} height={size * (22 / 18)} viewBox="0 0 18 22" fill="none" aria-hidden="true">
      <path
        d="M9 1.2c-3.98 0-7.2 3.12-7.2 6.98 0 5.22 7.2 12.62 7.2 12.62s7.2-7.4 7.2-12.62C16.2 4.32 12.98 1.2 9 1.2z"
        stroke={v2.text.primary}
        strokeWidth="1.3"
        fill="none"
      />
      <circle cx="9" cy="8.3" r="2" fill={v2.text.primary} />
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
    // Session 128 (refinement design D6): grid layout retired in favor of
    // centered composition. PinGlyph renders inline before mall name (size
    // 16 to match Lora 18 baseline). Address centers below as separate
    // block. Affects both /shelf/[slug] and /my-shelf via shared primitive.
    // Implementation-time call: kept PinGlyph inline-before-name (vs retire)
    // to preserve place-marker semantic; flip to retire if iPhone QA reads
    // cluttered.
    // v2 Arc 4.3 — typography + colors migrate per Q1 (a) "stay centered
    // text shape, token-swap only" (NOT SavedMallCardV2 chrome adoption):
    //   FONT_LORA name → FONT_CORMORANT (matches BoothTitleBlock 4.4 voice)
    //   FONT_SYS address → FONT_INTER (matches Saved address 11.5/0.02em)
    //   v1.inkPrimary → v2.text.primary (name)
    //   v1.inkMuted → v2.text.secondary (address; matches SavedMallCardV2)
    //   v1.inkFaint → v2.text.muted (decorative dotted underline stroke)
    // Review Board Finding 10A (session 153) — wrapper padding bottom
    // 4 → 0 so the mall + address read as one lockup. Tightening
    // continues on the address marginTop below (4 → 0).
    <div style={{ padding: "8px 22px 0", textAlign: "center" }}>
      <div
        style={{
          fontFamily: FONT_CORMORANT,
          fontSize: 18,
          color: v2.text.primary,
          lineHeight: 1.3,
          letterSpacing: "-0.005em",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <PinGlyph size={16} />
        <span>{mallName}</span>
      </div>
      {address && (
        // Review Board Finding 10A (session 153) — marginTop 4 → 0 so
        // the address sits flush below the mall name as one lockup.
        // Combined with the wrapper-padding-bottom 4 → 0 above, the
        // composition tightens noticeably without losing scan order.
        <div style={{ marginTop: 0 }}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: FONT_INTER,
              // Review Board Finding 9A (session 153) — fontSize 14 → 13
              // for visual hierarchy. Address de-emphasizes against mall
              // name (18px Cormorant) without losing legibility.
              fontSize: 13,
              color: v2.text.secondary,
              lineHeight: 1.55,
              textDecoration: "underline",
              textDecorationStyle: "dotted",
              textDecorationColor: v2.text.muted,
              textUnderlineOffset: 3,
            }}
          >
            {address}
          </a>
        </div>
      )}
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
  // v2 Arc 4.6b — sibling grid cell tokens migrate alongside WindowTile
  // retire so the dashed Add/Placeholder cells read cohesively with the
  // HomeFeedTile photographs in the same 3-col grid.
  //   borderRadius: 6 → 4 (matches HomeFeedTile photo radius)
  //   border dashed: v1.inkFaint → v2.border.medium (canonical v2 dashed)
  //   ImagePlus icon: v1.inkMuted → v2.text.muted
  //   "Add a find" label: FONT_LORA italic → FONT_CORMORANT italic,
  //     v1.inkMuted → v2.text.muted
  const href = vendorId ? `/post?vendor=${vendorId}` : "/post";
  const tileStyle: React.CSSProperties = {
    width: "100%",
    aspectRatio: "4/5",
    borderRadius: 4,
    border: `1px dashed ${v2.border.medium}`,
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
      <ImagePlus size={22} strokeWidth={1.5} style={{ color: v2.text.muted }} />
      <span
        style={{
          fontFamily: FONT_CORMORANT,
          fontStyle: "italic",
          fontSize: 13,
          color: v2.text.muted,
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
          borderRadius: 4,
          border: `1px dashed ${v2.border.medium}`,
          background: "transparent",
        }}
      />
      {/* Match AddFindTile's 22px title-slot placeholder so row heights align */}
      <div style={{ height: 22 }} aria-hidden="true" />
    </motion.div>
  );
}

// v2 Arc 4.6b — WindowTile retires its PolaroidTile + FlagGlyph wiring and
// renders via the v2 HomeFeedTile primitive. Mirrors session 141 Arc 3.4b
// /find/[id] "More from this booth" carousel migration shape; cohesion
// compounds across Home masonry + Find carousel + /shelf grid (all share
// the HomeFeedTile primitive). Caption zone height-locked at 76 (worst
// case: 2-line title + price); session-83 row-consistency rule still in
// force. Caption typography lifts session-141 standard: FONT_CORMORANT
// title + FONT_INTER price + v2.accent.green price (matches Saved page).
// Sold-state dim via HomeFeedTile.dim. Heart bubble wires to useShopperSaves
// when consumer passes saved+onToggleSave; /my-shelf omits → bubble hidden
// via Arc 4.6a primitive opt-in shape.
function WindowTile({
  post,
  index,
  findRefs,
  swipeOriginPath,
  saved,
  onToggleSave,
}: {
  post: Post;
  index: number;
  // Phase C — when both are provided, tap writes the swipe-nav context
  // (lib/findContext) so /find/[id] can drag-swipe between adjacent finds.
  findRefs?: FindRef[];
  swipeOriginPath?: string;
  // Session 128 (refinement design D4) — when both passed, render a save
  // bubble inside HomeFeedTile (canonical Home heart + /find/[id] carousel
  // pattern). /shelf/[slug] passes both via useShopperSaves; /my-shelf
  // omits (vendor-self surface, no save UX).
  saved?: boolean;
  onToggleSave?: () => void;
}) {
  const hasPrice = typeof post.price_asking === "number" && post.price_asking > 0;
  const isSold = post.status === "sold";

  function handleTap() {
    if (post.image_url) {
      try {
        sessionStorage.setItem(
          `treehouse_find_preview:${post.id}`,
          JSON.stringify({ image_url: post.image_url, title: post.title }),
        );
      } catch {}
    }
    if (findRefs && swipeOriginPath) {
      const cursor = findRefs.findIndex((r) => r.id === post.id);
      writeFindContext({
        originPath:  swipeOriginPath,
        findRefs,
        cursorIndex: cursor >= 0 ? cursor : 0,
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: EASE }}
      style={{ width: "100%", display: "flex", flexDirection: "column", minWidth: 0 }}
    >
      <Link
        href={`/find/${post.id}`}
        onClick={handleTap}
        style={{ display: "block", textDecoration: "none", color: "inherit", minWidth: 0 }}
      >
        <HomeFeedTile
          src={post.image_url ?? ""}
          alt={post.title}
          loading="lazy"
          isFollowed={saved}
          onToggleFollow={onToggleSave}
          dim={isSold}
          fallback={
            <div
              style={{
                width: "100%",
                height: "100%",
                padding: "12px 10px",
                display: "flex",
                alignItems: "flex-end",
                fontFamily: FONT_CORMORANT,
                fontSize: 12,
                color: v2.text.muted,
              }}
            >
              no photograph
            </div>
          }
          below={
            <div
              style={{
                padding: "9px 3px 4px",
                height: 76,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: FONT_CORMORANT,
                  fontSize: 14,
                  color: v2.text.primary,
                  lineHeight: 1.4,
                  width: "100%",
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
                    fontFamily: FONT_INTER,
                    fontSize: 14,
                    color: v2.accent.green,
                    lineHeight: 1.4,
                    marginTop: 4,
                    letterSpacing: "-0.005em",
                  }}
                >
                  ${Math.round(post.price_asking as number)}
                </div>
              )}
            </div>
          }
        />
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
  swipeOriginPath,
  savedIds,
  onToggleSave,
}: {
  posts: Post[];
  vendorId?: string;
  showAddTile: boolean;
  showPlaceholders?: boolean;
  onAddClick?: () => void;
  // Phase C — when set, tile taps write the swipe-nav context
  // (lib/findContext) so /find/[id] can drag-swipe between adjacent posts.
  // Caller is /shelf/[slug] (originPath = `/shelf/${slug}`); /my-shelf
  // omits this for now (vendor-self surfaces don't need swipe-nav).
  swipeOriginPath?: string;
  // Session 128 (refinement design D4) — when both passed, each tile
  // renders a save bubble in PolaroidTile.topRight (canonical pattern
  // from Home + /flagged). /shelf/[slug] passes both via useShopperSaves;
  // /my-shelf omits (vendor-self surface).
  savedIds?: Set<string>;
  onToggleSave?: (postId: string) => void;
}) {
  const findRefs: FindRef[] = swipeOriginPath
    ? posts.map((p) => ({ id: p.id, image_url: p.image_url ?? null, title: p.title ?? null }))
    : [];
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
      {posts.map((post, i) => {
        const hasSaveBubble = !!savedIds && !!onToggleSave;
        return (
          <WindowTile
            key={post.id}
            post={post}
            index={i}
            findRefs={swipeOriginPath ? findRefs : undefined}
            swipeOriginPath={swipeOriginPath}
            saved={hasSaveBubble ? savedIds!.has(post.id) : undefined}
            onToggleSave={hasSaveBubble ? () => onToggleSave!(post.id) : undefined}
          />
        );
      })}
      {showAddTile && <AddFindTile vendorId={vendorId} index={posts.length} onAddClick={onAddClick} />}
      {Array.from({ length: placeholderCount }).map((_, i) => (
        <PlaceholderTile key={`ph-${i}`} index={usedCells + i} />
      ))}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Booth closer — diamond divider + quiet Lora italic line
// ─────────────────────────────────────────────────────────────────────────────

export function BoothCloser() {
  // v1.1j — hairline rule replaces diamond-flanked divider (diamond retired)
  // v2 Arc 4.2 — typography + colors migrate: FONT_LORA → FONT_CORMORANT,
  // v1.inkMid → v2.text.secondary, v1.inkHairline → v2.border.light. Copy
  // preserved verbatim per session 130 D7 ("make a purchase" closer).
  return (
    <>
      <div style={{ padding: "28px 22px 20px" }}>
        <div style={{ width: "100%", height: 1, background: v2.border.light }} />
      </div>
      <div
        style={{
          fontFamily: FONT_CORMORANT,
          fontStyle: "italic",
          fontSize: 16,
          color: v2.text.secondary,
          lineHeight: 1.5,
          padding: "0 28px",
          textAlign: "center",
        }}
      >
        Save this booth to stay updated, or visit in person to make a purchase.
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
