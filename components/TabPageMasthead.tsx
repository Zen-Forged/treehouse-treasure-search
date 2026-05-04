// components/TabPageMasthead.tsx
// R10 (session 107) — root-level tab masthead. Larger wordmark hero
// (~86px tall) for primary tab pages (Home / Map / Saved). Inline, not
// sticky — scrolls away with content so the postcard mall card + page
// body get the full viewport height after scroll.
//
// Distinct from <StickyMasthead> (40px wordmark, fixed-position, used on
// sub/leaf pages with back-buttons + share affordances). Per
// docs/r10-location-map-design.md D6 + open-question Q5 — sub-pages keep
// StickyMasthead by default; this primitive is root-tab-only.
//
// V2 mockup spec at docs/mockups/r10-location-map-v2.html:
//   padding: 6px 16px 14px; text-align: center; wordmark height 86px.

"use client";

import * as React from "react";

interface TabPageMastheadProps {
  /**
   * Override the wordmark image height (default 86). Reserved for cases
   * where a calling page wants a slightly tighter visual rhythm.
   */
  height?: number;
}

export default function TabPageMasthead({ height = 86 }: TabPageMastheadProps) {
  return (
    <header
      style={{
        flexShrink: 0,
        padding:    "6px 16px 14px",
        textAlign:  "center",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/wordmark.png"
        alt="Treehouse Finds"
        style={{
          height,
          width:   "auto",
          display: "inline-block",
        }}
      />
    </header>
  );
}
