// components/v2/SavedEmptyState.tsx
//
// v2 Arc 1.2 — Saved page empty state per D3 (refined): "No finds collected
// yet — keep exploring" + Open Explore CTA linking to /. Field-guide voice;
// matches v2 typography pairing (Cormorant italic headline + Inter button).
"use client";

import Link from "next/link";
import { FONT_CORMORANT, FONT_INTER, v2 } from "@/lib/tokens";

interface SavedEmptyStateProps {
  exploreHref?: string;
}

export default function SavedEmptyState({
  exploreHref = "/",
}: SavedEmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 32px",
        textAlign: "center",
        gap: 24,
      }}
    >
      <h2
        style={{
          fontFamily: FONT_CORMORANT,
          fontStyle: "italic",
          fontSize: 22,
          fontWeight: 400,
          lineHeight: 1.3,
          color: v2.text.secondary,
          margin: 0,
          maxWidth: 280,
        }}
      >
        No finds collected yet — keep exploring
      </h2>
      <Link
        href={exploreHref}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          background: v2.accent.green,
          color: "#fff",
          fontFamily: FONT_INTER,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "14px 28px",
          borderRadius: 8,
          textDecoration: "none",
          minWidth: 200,
        }}
      >
        Open Explore
      </Link>
    </div>
  );
}
