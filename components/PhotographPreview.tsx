// components/PhotographPreview.tsx
// v1.2 primitive — the photo truth rule. Shared by /post/preview and
// /find/[id]/edit. See docs/design-system-v1.2-build-spec.md §6.
//
// THE RULE: whatever the vendor's phone captured, they see it uncropped, with
// paper (paperCream) filling the letterbox on either axis. This is what
// shoppers will see on Find Detail — identical shape, identical post-it,
// identical border. No mystery, no post-publish surprise.
//
// Before v1.2, /post/preview cropped the photo to fit its card and /post's
// preview thumbnail further constrained it — vendors who posted a portrait
// phone shot got a tight crop on preview and then saw the full image uncropped
// on Find Detail after publish. Two different pictures. v1.2 unifies them.
//
// Structure (matches Find Detail's post-it + photo composition):
//   1. Outer wrapper: 18px 22px padding (page margin), position: relative
//   2. Photo frame: 100% width, aspect-ratio: 4/5, 6px radius, 1px inkHairline
//      border, paperCream bg (so letterbox reads as paper, not card chrome),
//      overflow: visible (post-it must overhang), warm drop-shadow
//   3. Photo inner: absolute inset 0, 6px radius, overflow: hidden,
//      paperCream bg, flex center — this is the rectangle that clips the img
//   4. <img>: max-width 100%, max-height 100%, object-fit contain. Natural
//      aspect preserved; paper fills whatever's left.
//   5. Optional `topLeftAction` slot: absolutely positioned top-left at
//      10px 10px, z-index 12. Edit uses this for the Replace-photo pill.
//   6. Post-it (conditional): pinned bottom-right, +6deg, push-pin top-center,
//      "Booth Location" italic eyebrow, auto-sized numeral via
//      boothNumeralSize(). Unaffected by sold state — always full color.
//   7. Sold state: when `sold === true`, the <img> gets
//      filter: grayscale(100%) brightness(0.92); opacity: 0.88. This matches
//      how shoppers see sold finds on Find Detail, so the vendor editing
//      a sold find sees what the shopper sees. Post-it stays untouched
//      because it's a material gesture, not part of the photograph.

"use client";

import type { ReactNode } from "react";
import { v1, FONT_LORA, FONT_NUMERAL } from "@/lib/tokens";
import { boothNumeralSize } from "@/lib/utils";
import { TREEHOUSE_LENS_FILTER } from "@/lib/treehouseLens";

export interface PhotographPreviewProps {
  /** Image source — can be an object URL, data URL, or public URL. */
  imageUrl: string;
  /** Booth number for the post-it. If null, no post-it renders. */
  boothNumber: string | null;
  /**
   * When true, applies the grayscale/opacity sold treatment to the image.
   * Does NOT affect the post-it or frame chrome.
   */
  sold?: boolean;
  /**
   * Optional node rendered top-left over the photograph at 10px inset, z:12.
   * Used by /find/[id]/edit for the Replace-photo pill. Undefined on
   * /post/preview (no action overlay there).
   */
  topLeftAction?: ReactNode;
}

export default function PhotographPreview({
  imageUrl,
  boothNumber,
  sold = false,
  topLeftAction,
}: PhotographPreviewProps) {
  return (
    <div style={{ padding: "18px 22px 0", position: "relative" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 5",
          borderRadius: v1.imageRadius,
          border: `1px solid ${v1.inkHairline}`,
          background: v1.paperCream,
          // post-it must overhang the frame → visible, not hidden
          overflow: "visible",
          boxShadow: "0 2px 10px rgba(42,26,10,0.10)",
        }}
      >
        {/* Inner clipping surface: fills the frame, clips the <img>, and
            provides the paperCream letterbox when the photo doesn't fill. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: v1.imageRadius,
            overflow: "hidden",
            background: v1.paperCream,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={imageUrl}
            alt="Your find"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              display: "block",
              // Treehouse Lens applies to every find-photo render; sold
              // treatment composes on top so a sold listing reads grayscale +
              // dim with the lens still as the base layer. Post-it unaffected.
              filter: sold
                ? `${TREEHOUSE_LENS_FILTER} grayscale(100%) brightness(0.92)`
                : TREEHOUSE_LENS_FILTER,
              opacity: sold ? 0.88 : 1,
              transition: "filter 0.25s ease, opacity 0.25s ease",
            }}
          />
        </div>

        {/* Top-left action slot (optional — Edit's Replace-photo pill) */}
        {topLeftAction && (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              zIndex: 12,
            }}
          >
            {topLeftAction}
          </div>
        )}

        {/* Post-it — bottom-right, +6deg, push-pin on top-center, booth
            numeral. Identical to Find Detail. Unaffected by sold state. */}
        {boothNumber && (
          <div
            style={{
              position: "absolute",
              bottom: -14,
              right: 4,
              width: 92,
              minHeight: 92,
              background: v1.postit,
              transform: "rotate(6deg)",
              transformOrigin: "bottom right",
              boxShadow:
                "0 6px 14px rgba(42,26,10,0.28), 0 0 0 0.5px rgba(42,26,10,0.16)",
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
                boxShadow:
                  "inset 0 0 0 2px rgba(42,26,10,0.55), 0 1px 2px rgba(42,26,10,0.35)",
              }}
            />
            <div
              style={{
                fontFamily: FONT_LORA,
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
                fontFamily: FONT_NUMERAL,
                fontSize: boothNumeralSize(boothNumber),
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
