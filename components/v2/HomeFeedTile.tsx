// components/v2/HomeFeedTile.tsx
//
// v2 Arc 2.1 — Home discovery-feed tile primitive (replaces session-95
// PolaroidTile consumer wiring on Home masonry only; PolaroidTile preserved
// for /post/preview, /post/tag, find/[id] carousel until Arcs 3-4).
//
// Frame C lighter polaroid per docs/home-v2-redesign-design.md:
//   wrapper: v2.surface.warm bg + 4px radius + 5/5/6 padding + soft shadow
//   photo:   4:5 aspect + 4px radius + NO inner border (D5b retired) +
//            Treehouse Lens preserved (Q5a)
//   heart:   36×36 v2.surface.warm + 1px v2.border.light + leaf SVG at
//            top:8 right:8 (closes session-132 frosted-glass-retire holdout)
//   below:   consumer slot — Home passes Inter italic 11.5 timestamp
//
// Photograph-only contract preserved (Q1a). ♥-only — no ✓ Found composes
// onto Home (Q2b — Find-tier ✓ stays Saved-only).
//
// Tap-flash + scale animation values carry verbatim from PolaroidTile per
// feedback_design_record_as_execution_spec — established home-feed motion
// vocabulary; only token-color values migrate (v1.green-tinted overlay →
// v2.accent.green-tinted).
"use client";

import { useState, type ReactNode } from "react";
import { PiLeaf, PiLeafFill } from "react-icons/pi";
import { v2 } from "@/lib/tokens";
import { TREEHOUSE_LENS_FILTER } from "@/lib/treehouseLens";

interface HomeFeedTileProps {
  /** Find image URL (photograph-only contract; falsy renders fallback per session-83 graceful-degrade rule). */
  src: string;
  alt: string;
  /** Rendered inside the photo slot when src is falsy or img onError fires. */
  fallback?: ReactNode;
  /** Save-state for heart bubble (filled green leaf vs outline ink leaf). */
  isFollowed: boolean;
  /** Heart bubble tap handler. e.stopPropagation() owned by tile to prevent Link nav. */
  onToggleFollow: () => void;
  /** Last-viewed highlight — Home parent times out + unsets; primitive renders 1.5px green border + halo. */
  highlighted?: boolean;
  /** Tap-flash overlay + scale animation on touchstart (Home masonry-only behavior). */
  tap?: boolean;
  /** Below-photo content slot — Home passes the relative timestamp render. */
  below?: ReactNode;
  /** Image loading attribute. Default undefined (browser default = eager). */
  loading?: "eager" | "lazy";
  /** Optional callback fired when img onError handler runs. */
  onImageError?: () => void;
  /** Sold-state dim — opacity 0.62 + grayscale on photo. Mirrors v2 SavedFindRow.dim. */
  dim?: boolean;
}

export default function HomeFeedTile({
  src,
  alt,
  fallback,
  isFollowed,
  onToggleFollow,
  highlighted = false,
  tap = false,
  below,
  loading,
  onImageError,
  dim = false,
}: HomeFeedTileProps) {
  const [imgErr, setImgErr] = useState(false);
  const [tapped, setTapped] = useState(false);
  const hasImg = !!src && !imgErr;

  function handleImgError() {
    setImgErr(true);
    onImageError?.();
  }

  function handlePointerDown() {
    if (!tap) return;
    setTapped(true);
    setTimeout(() => setTapped(false), 320);
  }

  // Highlighted state takes priority on the photo container's border + shadow.
  let photoBorder: string | undefined;
  let photoBoxShadow: string | undefined;
  if (highlighted) {
    photoBorder = `1.5px solid ${v2.accent.green}`;
    photoBoxShadow = `0 0 0 3px rgba(40,92,60,0.13), 0 4px 14px rgba(43,33,26,0.11)`;
  }

  return (
    <div
      style={{
        background: v2.surface.warm,
        padding: "5px 5px 6px",
        borderRadius: 4,
        // Session 140 dial — D3b mid shadow → v1 verbatim weight per
        // David's iPhone QA: "let's go more aggressive on the drop
        // shadow similar to what we had on v1." Restores the v1
        // shadow.polaroid value (0 6px 14px / 0 1.5px 3px) David has
        // muscle memory of from session-83 polaroid pattern.
        boxShadow: "0 6px 14px rgba(42,26,10,0.20), 0 1.5px 3px rgba(42,26,10,0.10)",
        width: "100%",
      }}
    >
      <div
        onPointerDown={tap ? handlePointerDown : undefined}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4/5",
          transform: tap && tapped ? "scale(1.028)" : "scale(1)",
          transition:
            tap && tapped
              ? "transform 0.14s cubic-bezier(0.34,1.56,0.64,1)"
              : "transform 0.32s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 4,
            overflow: "hidden",
            background: v2.surface.warm,
            border: photoBorder,
            boxShadow: photoBoxShadow,
            transition: highlighted
              ? "box-shadow 0.30s ease, border-color 0.60s ease"
              : undefined,
          }}
        >
          {hasImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt}
              loading={loading}
              onError={handleImgError}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                opacity: dim ? 0.62 : 1,
                filter: dim
                  ? `${TREEHOUSE_LENS_FILTER} grayscale(0.5) brightness(0.88)`
                  : TREEHOUSE_LENS_FILTER,
                WebkitFilter: dim
                  ? `${TREEHOUSE_LENS_FILTER} grayscale(0.5) brightness(0.88)`
                  : TREEHOUSE_LENS_FILTER,
                transition: "opacity 0.2s",
              }}
            />
          ) : (
            fallback
          )}

          {tap && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(40,92,60,0.08)",
                opacity: tapped ? 1 : 0,
                transition: tapped ? "opacity 0.08s ease" : "opacity 0.28s ease",
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            // Both preventDefault + stopPropagation owned by the primitive.
            // When wrapped in <Link> (Home masonry), stopPropagation alone
            // doesn't block default <a> navigation — Link's internal onClick
            // never fires (so it never calls preventDefault), and the
            // browser falls through to anchor navigation. preventDefault
            // here is a no-op when the parent isn't navigable, but blocks
            // the bug class when it is.
            e.preventDefault();
            e.stopPropagation();
            onToggleFollow();
          }}
          aria-pressed={isFollowed}
          aria-label={isFollowed ? "Unsave" : "Save"}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 36,
            height: 36,
            borderRadius: 18,
            background: v2.surface.warm,
            border: `1px solid ${v2.border.light}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: v2.accent.green,
            padding: 0,
            cursor: "pointer",
            zIndex: 3,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {isFollowed ? (
            <PiLeafFill size={17} aria-hidden />
          ) : (
            <PiLeaf size={17} aria-hidden />
          )}
        </button>
      </div>

      {below}
    </div>
  );
}
