// components/StickyMasthead.tsx
// Shared masthead chrome — session 167 chrome-unification arc (design record at
// docs/chrome-unification-design.md).
//
// Visual identity: universal "hero photo IS the masthead bg" strip pattern.
// BG.png cropped to strip height with bottom-fade gradient to surface bg +
// treehouse_transparent.png centered as the wordmark.
//
// Replaces the session 140 cream `v2.bg.main` chrome aesthetic with the new
// photographic identity. The 1fr auto 1fr inner grid + safe-area-aware
// padding pattern is preserved verbatim from session 70 lock — only the bg
// + the wordmark asset + the strip height changed.
//
// Geometry constants live in lib/chromeTokens.ts as single source of truth.
// MASTHEAD_HEIGHT bumped from `safe-area + 84` to `safe-area + 116` to give
// chip-overlay room on Home (which uses HomeHero, not StickyMasthead — but
// the constant is shared so consumers' body-content spacers stay aligned
// across surfaces). Per D2.
//
// Session 77 — `position: fixed` + layout spacer is preserved (iOS PWA
// standalone bfcache paint bug).
//
// Usage:
//
//   <StickyMasthead />                          // empty left + right (Saved)
//   <StickyMasthead left={<BackButton />} />    // detail/leaf pages
//   <StickyMasthead
//     left={<BackButton />}
//     right={<><FlagBubble /><ShareBubble /></>}
//   />
//
// Consumers that sit on (tabs)/-tinted surfaces (Saved) pass
// `fadeTarget={v2.bg.tabs}` so the masthead's bottom-edge gradient lands on
// the correct surface tier. Defaults to v2.bg.main for the majority of
// consumers (/find /shelf /me /vendor-request /post/* /contact /my-shelf).

"use client";

import { type ReactNode } from "react";
import { v2 } from "@/lib/tokens";
import {
  MASTHEAD_HEIGHT as MASTHEAD_HEIGHT_TOKEN,
  MASTHEAD_CONTENT_HEIGHT_PX,
  LOGO_WIDTH_DEFAULT_PX,
  LOGO_WIDTH_WITH_SLOTS_PX,
  WORDMARK_URL,
  stripBackgroundImage,
} from "@/lib/chromeTokens";

interface StickyMastheadProps {
  /**
   * Left-slot content. Typically a back button on detail/leaf pages
   * (`/find/[id]`, `/shelf/[slug]`, `/post/preview`, `/post/edit/*`).
   * Empty on Saved.
   */
  left?: ReactNode;
  /**
   * Center-slot content. Defaults to the Treehouse Finds wordmark
   * (`treehouse_transparent.png` per session 167 chrome-unification arc).
   * Override only for surfaces that carry a different center identity —
   * extremely rare; the masthead lock spec keeps this single.
   */
  wordmark?: ReactNode;
  /**
   * Right-slot content. Variable: bookmark, custom share bubbles, etc.
   * Renders right-aligned within the locked `min-width: 80px` column.
   *
   * Session 137 — defaults to null when omitted. Previously (session 90)
   * defaulted to a generic share button; the 3-tier engagement+share lattice
   * (project_layered_engagement_share_hierarchy) replaced that with entity-
   * specific Share Mall / Share Booth / Share Find via <ShareSheet>. Pages
   * with no share entity (e.g. /vendor-request, /me, /contact) pass
   * `right={null}` to be explicit.
   */
  right?: ReactNode;
  /**
   * Bg color the masthead's bottom-fade gradient targets. The fade gradient
   * lets the photo bleed into the surface bg below the masthead. Per surface:
   *   - (tabs)/ surfaces (Saved):     v2.bg.tabs  (#E6DECF)
   *   - Non-(tabs)/ surfaces:         v2.bg.main  (#F7F3EB) — default
   * Per D2 + design record's "Bottom-fade target color varies per surface."
   */
  fadeTarget?: string;
}

/**
 * Canonical masthead height — re-exported from lib/chromeTokens.ts so
 * existing consumers that import from StickyMasthead don't break. New code
 * should import from chromeTokens directly.
 */
export const MASTHEAD_HEIGHT = MASTHEAD_HEIGHT_TOKEN;

export default function StickyMasthead({
  left,
  wordmark,
  right,
  fadeTarget = v2.bg.main,
}: StickyMastheadProps) {
  // Logo width adapts to slot state — when slots are filled (back button + share
  // bubble) the wordmark renders tighter so the slots don't crowd it. Per D4.
  const hasSlotContent = left != null || right != null;
  const logoWidth      = hasSlotContent ? LOGO_WIDTH_WITH_SLOTS_PX : LOGO_WIDTH_DEFAULT_PX;

  const defaultWordmark = (
    <img
      src={WORDMARK_URL}
      alt="Treehouse Finds"
      style={{
        width:   logoWidth,
        height:  "auto",
        display: "block",
      }}
    />
  );

  // Inner grid minHeight = MASTHEAD_CONTENT_HEIGHT_PX - paddingBottom (12) =
  // 104. The wordmark img at ~73px height (LOGO_WIDTH_DEFAULT_PX × 815/399
  // aspect) centers vertically with ~15px breathing room above + below.
  const innerGridMinHeight = MASTHEAD_CONTENT_HEIGHT_PX - 12;

  return (
    <>
      {/* Layout spacer — reserves the same vertical space the fixed masthead
          uses so content below is positioned identically. */}
      <div
        aria-hidden="true"
        style={{
          height:     MASTHEAD_HEIGHT,
          flexShrink: 0,
        }}
      />

      {/* Fixed-position masthead — pinned to viewport top. Centered + capped at
          maxWidth: 430 to match the page wrapper's content column.
          Background is the chrome-unification strip: BG.png cropped to bottom
          slice (center 92%) with a fade-to-surface-bg gradient at the bottom
          edge. */}
      <div
        style={{
          position:           "fixed",
          top:                0,
          left:               "50%",
          transform:          "translateX(-50%)",
          width:              "100%",
          maxWidth:           430,
          zIndex:             40,
          backgroundImage:    stripBackgroundImage(fadeTarget),
          backgroundSize:     "auto, cover",
          backgroundPosition: "center, center 92%",
          backgroundRepeat:   "no-repeat",
          paddingTop:         "max(14px, env(safe-area-inset-top, 14px))",
          paddingBottom:      12,
          paddingLeft:        18,
          paddingRight:       18,
        }}
      >
        <div
          style={{
            display:            "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems:         "center",
            minHeight:          innerGridMinHeight,
            gap:                8,
          }}
        >
          <div
            style={{
              justifySelf: "start",
              display:     "flex",
              alignItems:  "center",
              gap:         6,
              minWidth:    80,
            }}
          >
            {left}
          </div>
          <div style={{ textAlign: "center" }}>
            {wordmark ?? defaultWordmark}
          </div>
          <div
            style={{
              justifySelf:    "end",
              display:        "flex",
              alignItems:     "center",
              gap:            6,
              justifyContent: "flex-end",
              minWidth:       80,
            }}
          >
            {right ?? null}
          </div>
        </div>
      </div>
    </>
  );
}
