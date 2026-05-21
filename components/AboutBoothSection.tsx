// components/AboutBoothSection.tsx
//
// Session 187 — vendor profile enrichment Arc 2.2 per
// docs/vendor-profile-enrichment-design.md D9 + D11 + D13.
//
// Slots between <BoothTitleBlock> and <MallBlock> on /shelf/[slug] (and on
// /my-shelf for vendor self-preview parity per C4 sub-decision). Renders
// the vendor's bio paragraph + Facebook/Instagram outbound bubbles.
//
// Conditional render (D11): returns null when ALL three optional inputs
// (bio, facebookUrl, instagramUrl) are null/empty. Vendors who haven't
// enriched their profile see no extra section — no empty wrapper, no
// extra padding gap. Each social bubble hides individually when its URL
// is null (D9), so a vendor with bio + IG but no FB sees just the IG
// bubble centered.
//
// Bubble styling (D9): 36×36 circular, bg v2.surface.warm + 1px
// v2.border.light + v2.accent.green glyph color. Phosphor PiFacebookLogo
// + PiInstagramLogo at size 20 inside the bubble (~55% bubble fill,
// matches the iconBubble convention used for other engagement-tier
// bubbles like BookmarkBoothBubble + ShareBubble).
//
// Tap behavior (D9): native <a href target="_blank" rel="noopener
// noreferrer"> with onClick firing the `vendor_social_tapped` R3
// analytics event (vendor_slug + platform payload; whitelisted in
// app/api/events/route.ts at session 186 Arc 1 commit 1). Session 192
// F1 swap: was JS-initiated window.open() — iPhone Safari treats those
// tabs as popups without parent reference, so tapping back lands on
// about:blank. User-initiated anchor click creates a proper tab with
// intact history. Same-intent implementation change (D9 secure-link
// goal preserved), NOT a design reversal. URLs are written canonical
// via lib/socialUrls.ts normalizer on the Arc 1 PATCH path, so no
// client-side normalization needed here.

"use client";

import { PiFacebookLogo, PiInstagramLogo } from "react-icons/pi";
import { v2, FONT_CORMORANT } from "@/lib/tokens";
import { track } from "@/lib/clientEvents";

interface AboutBoothSectionProps {
  bio: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  vendorSlug: string;
}

export default function AboutBoothSection({
  bio,
  facebookUrl,
  instagramUrl,
  vendorSlug,
}: AboutBoothSectionProps) {
  const trimmedBio = bio?.trim() || null;
  const hasFb      = !!facebookUrl;
  const hasIg      = !!instagramUrl;

  // D11 — omit entirely when nothing to show. Avoids "blank space where
  // the vendor section would be" for vendors who haven't enriched yet.
  if (!trimmedBio && !hasFb && !hasIg) return null;

  // Analytics-only handler — anchor's native target="_blank" handles tab
  // open (per session 192 F1 swap from window.open).
  function handleSocialTap(platform: "facebook" | "instagram") {
    track("vendor_social_tapped", { vendor_slug: vendorSlug, platform });
  }

  return (
    // 14px top padding + 6px bottom keeps a quiet beat between the
    // BoothTitleBlock display_name above and the MallBlock pin/address
    // below. Section reads as a connected continuation of the identity
    // lockup, not a separate card. Matches the BoothTitleBlock
    // "padding: 16px 22px 4px" cadence on horizontal axis.
    <section style={{ padding: "14px 22px 6px", textAlign: "center" }}>
      {trimmedBio && (
        // D7 display spec — Cormorant italic 15px, v2.text.primary,
        // lineHeight 1.5, max-width 320px centered. white-space:pre-wrap
        // preserves intentional newlines vendors type in the textarea
        // (Arc 1 edit surface). margin-bottom 10 leaves a quiet gap to
        // the social bubble row below (when any bubble renders).
        <p
          style={{
            fontFamily: FONT_CORMORANT,
            fontStyle: "italic",
            fontSize: 15,
            color: v2.text.primary,
            lineHeight: 1.5,
            margin: hasFb || hasIg ? "0 auto 10px" : "0 auto",
            maxWidth: 320,
            whiteSpace: "pre-wrap",
          }}
        >
          {trimmedBio}
        </p>
      )}
      {(hasFb || hasIg) && (
        // D9 inline row — 10px gap, justify center. Individual bubbles
        // hide when their URL is null; a vendor with only IG sees just
        // the IG bubble centered.
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
          }}
        >
          {hasFb && (
            <a
              href={facebookUrl!}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleSocialTap("facebook")}
              aria-label="Open booth on Facebook"
              style={socialBubbleStyle}
            >
              <PiFacebookLogo size={20} color={v2.accent.green} aria-hidden />
            </a>
          )}
          {hasIg && (
            <a
              href={instagramUrl!}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleSocialTap("instagram")}
              aria-label="Open booth on Instagram"
              style={socialBubbleStyle}
            >
              <PiInstagramLogo size={20} color={v2.accent.green} aria-hidden />
            </a>
          )}
        </div>
      )}
    </section>
  );
}

// D9 — 36×36 circular bubble with v2.surface.warm bg + 1px v2.border.light
// border. Reusable across both social platforms; the glyph color +
// inner Phosphor component vary per call site, the bubble chrome stays
// identical. WebkitTapHighlightColor:transparent matches every other
// engagement-tier bubble in the project (BookmarkBoothBubble,
// ShareBubble, StarFavoriteBubble) so taps don't paint the default
// iOS blue square.
const socialBubbleStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  background: v2.surface.warm,
  border: `1px solid ${v2.border.light}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
};
