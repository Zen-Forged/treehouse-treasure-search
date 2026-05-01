// components/PolaroidTile.tsx
// Phase 2 Session B (session 95) — primitive extracted from 6 inline callsites.
// See docs/polaroid-tile-design.md for frozen D1-D7 decisions and
// docs/polaroid-tile-build-spec.md for the implementation contract.
//
// Goal: zero visual delta. Every callsite renders identically before and after
// adoption. Wrapper bg + shadow stack live in lib/tokens.ts (Session A).

"use client";

import { useState, type ReactNode } from "react";
import { v1 } from "@/lib/tokens";
import { TREEHOUSE_LENS_FILTER } from "@/lib/treehouseLens";

interface PolaroidTileProps {
  src: string;
  alt: string;

  /**
   * D1 — wrapper bottom padding.
   *  - "inside" (default): padding `7px 7px 8px`. Small mat for short below
   *    content (Home timestamp, /post/preview, /post/tag).
   *  - "outside": padding `7px 7px 0`. No mat; below content provides its own
   *    height (/flagged + /shelf 76px caption block).
   */
  bottomMat?: "inside" | "outside";

  /**
   * D2 — photo inner background. Default `v1.postit`. Pass-through string;
   * /post/preview uses `v1.paperCream`, /post/tag uses `"#cdb88e"`.
   */
  photoBg?: string;

  /**
   * D3 — tap interaction (Home only). When true, primitive owns its own
   * tap-flash overlay + scale animation on touchstart.
   */
  tap?: boolean;

  /**
   * D4 — last-viewed highlight (Home only). Parent times out and unsets;
   * primitive renders the visual state (1.5px green border + halo).
   */
  highlighted?: boolean;

  /**
   * D5 — Treehouse Lens filter. Default true. /post/tag opts out (raw
   * photo on capture).
   */
  lens?: boolean;

  /** Photo aspect ratio. Default "4/5". */
  aspectRatio?: string;

  /** Image objectFit. Default "cover"; /post/preview uses "contain". */
  objectFit?: "cover" | "contain";

  /**
   * Photo inner border-radius. Default 0 (square corners — matches the session-83
   * polaroid pattern on /flagged + /shelf where the photo sits on the polaroid
   * mat with no inner radius). Home masonry passes `v1.imageRadius` (6) because
   * its inner border needs visible rounded corners. /post/preview + /post/tag
   * pass `4` to match their existing rendering.
   */
  photoRadius?: number;

  /** Sold-state dim. Whole polaroid drops to 0.55 opacity when true. */
  dim?: boolean;

  /** Inner photo border (Home masonry only — 1px solid v1.inkHairline). */
  innerBorder?: boolean;

  /** Inner inset shadow (/post/tag only — warm vignette). Mutually exclusive
   * with innerBorder; if both are passed, innerInsetShadow wins. */
  innerInsetShadow?: boolean;

  /** D6 — overlay slot inside the photo slot, abs positioned top:8 right:8 z:3.
   * Used by Home heart bubble and /flagged unsave bubble. */
  topRight?: ReactNode;

  /** D6 — content slot inside the wrapper, sibling after the photo slot.
   * Home timestamp; /flagged + /shelf 76px caption block. /post/tag's italic
   * label is NOT this slot — caller wraps the primitive + label as siblings. */
  below?: ReactNode;

  /** Fallback rendered inside the photo slot when src is falsy or img errors. */
  fallback?: ReactNode;

  /** Image loading attribute. Default undefined (browser default = eager). */
  loading?: "eager" | "lazy";

  /** Optional callback fired when the img onError handler runs. */
  onImageError?: () => void;
}

export default function PolaroidTile({
  src,
  alt,
  bottomMat = "inside",
  photoBg,
  tap = false,
  highlighted = false,
  lens = true,
  aspectRatio = "4/5",
  objectFit = "cover",
  photoRadius = 0,
  dim = false,
  innerBorder = false,
  innerInsetShadow = false,
  topRight,
  below,
  fallback,
  loading,
  onImageError,
}: PolaroidTileProps) {
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

  // Wrapper bottom padding based on bottomMat variant.
  const wrapperPadding = bottomMat === "inside" ? "7px 7px 8px" : "7px 7px 0";

  // Photo slot border + box-shadow — highlighted takes priority, then
  // innerInsetShadow, then innerBorder, else nothing.
  let photoBorder: string | undefined;
  let photoBoxShadow: string | undefined;
  if (highlighted) {
    photoBorder = `1.5px solid ${v1.green}`;
    photoBoxShadow = `0 0 0 3px rgba(30,77,43,0.13), 0 4px 14px rgba(42,26,10,0.11)`;
  } else if (innerInsetShadow) {
    photoBoxShadow = "inset 0 0 30px rgba(42,26,10,0.12)";
  } else if (innerBorder) {
    photoBorder = `1px solid ${v1.inkHairline}`;
    photoBoxShadow = "0 2px 8px rgba(42,26,10,0.08), 0 1px 3px rgba(42,26,10,0.05)";
  }

  return (
    <div
      style={{
        background: v1.paperWarm,
        padding: wrapperPadding,
        borderRadius: 4,
        boxShadow: v1.shadow.polaroid,
        opacity: dim ? 0.55 : 1,
        // width: 100% so the polaroid fills its parent in flex-center contexts
        // (e.g. /post/tag's flex column with alignItems: center). Block-level
        // parents (Home masonry's <Link display: block>, /flagged grid cell)
        // already stretch block children to fill, so this is a no-op there.
        // Without this, flex-center parents shrink the polaroid to its content
        // width — which is 0 because the inner photo slot is width: 100% of
        // nothing.
        width: "100%",
        // /flagged + /shelf wrappers carry overflow:hidden because the caption
        // block sits flush against the bottom edge of the wrapper.
        ...(bottomMat === "outside" ? { overflow: "hidden" } : null),
      }}
    >
      <div
        onPointerDown={tap ? handlePointerDown : undefined}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio,
          // Tap-state scale only when tap is enabled and tapped is active.
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
            borderRadius: photoRadius,
            overflow: "hidden",
            background: photoBg ?? v1.postit,
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
                objectFit,
                display: "block",
                filter: lens ? TREEHOUSE_LENS_FILTER : undefined,
                WebkitFilter: lens ? TREEHOUSE_LENS_FILTER : undefined,
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
                background: "rgba(30,77,43,0.08)",
                opacity: tapped ? 1 : 0,
                transition: tapped ? "opacity 0.08s ease" : "opacity 0.28s ease",
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        {topRight && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 36,
              height: 36,
              zIndex: 3,
            }}
          >
            {topRight}
          </div>
        )}
      </div>

      {below}
    </div>
  );
}
