// components/VendorCTACard.tsx
//
// Editorial banner card that lives at the bottom of the discovery feed and
// also fronts the empty-state when a mall has no posts (the existing footer
// renders below <EmptyFeed /> in app/page.tsx, so one placement covers both).
//
// Design: docs/mockups/vendor-cta-v2.html (γ editorial banner, button
// Treatment 1 — sans semibold). Replaces the centered hairline + italic line
// + IM Fell pill button that lived inline in app/page.tsx through session 62.

"use client";

import Link from "next/link";
import { Store, ChevronRight } from "lucide-react";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";

export default function VendorCTACard() {
  return (
    <div
      style={{
        margin: "0 4px",
        position: "relative",
        overflow: "hidden",
        background: "#ede6d5",
        border: `1px solid ${v1.inkHairline}`,
        borderRadius: 20,
        padding: "22px 18px 20px",
      }}
    >
      {/* Storefront watermark — faded, rotated, behind copy */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -10,
          right: -14,
          color: v1.green,
          opacity: 0.12,
          transform: "rotate(-8deg)",
          pointerEvents: "none",
        }}
      >
        <Store size={130} strokeWidth={1.2} />
      </div>

      <p
        style={{
          fontFamily: FONT_SYS,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: v1.green,
          margin: "0 0 6px",
          fontWeight: 600,
          position: "relative",
        }}
      >
        For vendors
      </p>

      <p
        style={{
          fontFamily: FONT_LORA,
          fontStyle: "italic",
          fontSize: 26,
          color: v1.inkPrimary,
          margin: "0 0 4px",
          lineHeight: 1.1,
          letterSpacing: "-0.01em",
          position: "relative",
        }}
      >
        Share your booth
        <br />
        on Treehouse Finds.
      </p>

      <p
        style={{
          fontFamily: FONT_SYS,
          fontSize: 13,
          color: v1.inkMuted,
          margin: "0 0 14px",
          lineHeight: 1.5,
          maxWidth: 240,
          position: "relative",
        }}
      >
        Photo your finds, share your shelf, reach buyers between mall visits.
      </p>

      <Link
        href="/vendor-request"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          background: v1.green,
          color: "#f5ecd8",
          borderRadius: 999,
          padding: "11px 18px",
          fontFamily: FONT_SYS,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "-0.005em",
          textDecoration: "none",
          WebkitTapHighlightColor: "transparent",
          position: "relative",
        }}
      >
        Request Digital Booth
        <ChevronRight size={13} strokeWidth={2.5} />
      </Link>
    </div>
  );
}
