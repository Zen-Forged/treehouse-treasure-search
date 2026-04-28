// components/FeaturedBanner.tsx
// Admin-editable hero banner — v1.1l (docs/design-system.md §v1.1l (b))
//
// Two variants:
//   - eyebrow: title renders ABOVE the image as a separate text block (Home
//     "Featured Find" treatment). Used where the banner sits inside a content
//     flow and shouldn't carry a page-identifying label on top of the image.
//   - overlay: title renders ON TOP of the image in IM Fell 30px white with
//     a text-shadow for legibility against any photograph (Find Map
//     treatment). Used where the banner IS the page-title surface and
//     replaces a previously-standalone heading.
//
// Composition:
//   - 16px corner radius (matches Booth hero banner token)
//   - Within 10px horizontal padding (also matches Booth hero inset)
//   - Min-height configurable per consumer (Home ~200px, Find Map ~180px)
//   - Overlay variant adds a top-down scrim so white title text reads against
//     any image
//
// If no imageUrl is provided the banner renders a paper-wash placeholder
// block (dashed border + faint glyph area) — this is the admin "no banner
// set yet" state and also the graceful-degradation state for shoppers in the
// brief window between a deploy and the DB setting being populated.
//
// Image is a single admin-uploaded photograph; the /api/admin/featured-image
// route handles upload + persistence via the site_settings keyed-row table.
// See lib/siteSettings.ts for the read API.

"use client";

import { v1, FONT_LORA } from "@/lib/tokens";

export type FeaturedBannerVariant = "eyebrow" | "overlay";

interface FeaturedBannerProps {
  variant:   FeaturedBannerVariant;
  title?:    string;
  imageUrl:  string | null | undefined;
  minHeight?: number;
  /** Additional margin below the banner in px (defaults: 18 eyebrow, 0 overlay). */
  marginBottom?: number;
  /**
   * When true, render a dashed paper-wash placeholder block if imageUrl is
   * empty. Default false — on public consumer pages, an absent banner simply
   * collapses so the page reads past it cleanly. Admin preview UI sets this
   * to true to show the upload target.
   */
  showPlaceholder?: boolean;
}

export default function FeaturedBanner({
  variant,
  title,
  imageUrl,
  minHeight = variant === "overlay" ? 180 : 200,
  marginBottom = variant === "overlay" ? 0 : 18,
  showPlaceholder = false,
}: FeaturedBannerProps) {
  // Graceful collapse — if there's no image and no placeholder requested,
  // render nothing. The page collapses past the banner cleanly (per v1.1l (c)
  // design-system commitment: "no image in the DB = no banner renders").
  if (!imageUrl && !showPlaceholder) return null;

  if (variant === "eyebrow") {
    return (
      <div style={{ padding: "14px 10px 0", marginBottom }}>
        {/* Eyebrow title — IM Fell italic 14px muted, sentence case */}
        {title && (
          <div
            style={{
              paddingLeft: 12,
              marginBottom: 8,
              fontFamily: FONT_LORA,
              fontStyle: "italic",
              fontSize: 14,
              color: v1.inkMuted,
              letterSpacing: "-0.005em",
            }}
          >
            {title}
          </div>
        )}
        <BannerImage imageUrl={imageUrl} minHeight={minHeight} scrim={false} />
      </div>
    );
  }

  // overlay variant
  return (
    <div style={{ padding: "10px 10px 0", marginBottom, position: "relative" }}>
      <BannerImage imageUrl={imageUrl} minHeight={minHeight} scrim={true} />
      {/* Overlay title — IM Fell 30px white with text-shadow for legibility */}
      {title && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 22,
            padding: "0 32px",
            pointerEvents: "none",
            fontFamily: FONT_LORA,
            fontSize: 30,
            color: "#ffffff",
            textShadow: "0 2px 8px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.25)",
            letterSpacing: "-0.005em",
            lineHeight: 1.15,
          }}
        >
          {title}
        </div>
      )}
    </div>
  );
}

// ─── BannerImage ──────────────────────────────────────────────────────────────
// Shared image surface used by both variants. 16px radius, optional top-down
// scrim for overlay readability, dashed placeholder when no image is set AND
// the consumer has requested it (admin preview).

function BannerImage({
  imageUrl,
  minHeight,
  scrim,
}: {
  imageUrl: string | null | undefined;
  minHeight: number;
  scrim: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: v1.bannerRadius,
        minHeight,
        overflow: "hidden",
        background: imageUrl ? v1.postit : "rgba(42,26,10,0.03)",
        border: imageUrl ? "none" : `1px dashed ${v1.inkFaint}`,
      }}
    >
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
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
          {scrim && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom, rgba(18,34,20,0.08) 0%, rgba(18,34,20,0.28) 55%, rgba(18,34,20,0.48) 100%)",
                pointerEvents: "none",
              }}
              aria-hidden="true"
            />
          )}
        </>
      ) : (
        // Placeholder — admin-preview "no banner set" state. Shopper-facing
        // consumers should never reach this branch because the component
        // returns null earlier when imageUrl is absent and showPlaceholder is
        // false.
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 14,
            color: v1.inkFaint,
          }}
        >
          No banner set
        </div>
      )}
    </div>
  );
}
