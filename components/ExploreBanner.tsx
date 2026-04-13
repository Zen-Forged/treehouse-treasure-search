// components/ExploreBanner.tsx
// CTA banner prompting users to explore more vendor booths.
// Used at the bottom of My Shelf and Public Shelf pages.

"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { colors } from "@/lib/tokens";

interface ExploreBannerProps {
  onPress?: () => void; // optional — if provided, uses a button instead of Link
}

export default function ExploreBanner({ onPress }: ExploreBannerProps) {
  const btnStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "10px 18px", borderRadius: 24,
    background: "rgba(255,255,255,0.95)", border: "none",
    cursor: "pointer",
    fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700,
    color: colors.bannerFrom, textDecoration: "none",
    WebkitTapHighlightColor: "transparent",
  };

  return (
    <div style={{
      margin: "14px 10px 0", borderRadius: 16,
      background: `linear-gradient(110deg, ${colors.bannerFrom} 0%, ${colors.bannerTo} 100%)`,
      padding: "20px 18px",
    }}>
      <p style={{
        margin: "0 0 4px",
        fontFamily: "Georgia, serif", fontSize: 9, fontWeight: 600,
        color: "rgba(255,255,255,0.50)", letterSpacing: "2px", textTransform: "uppercase",
      }}>
        {"There's more to discover"}
      </p>
      <h2 style={{
        margin: "0 0 6px",
        fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700,
        color: "#fff", lineHeight: 1.2,
      }}>
        Explore more shelves nearby
      </h2>
      <p style={{
        margin: "0 0 16px",
        fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 12,
        color: "rgba(255,255,255,0.55)",
      }}>
        From local booths. Across Kentucky.
      </p>

      {onPress ? (
        <button onClick={onPress} style={btnStyle}>
          <LayoutGrid size={14} style={{ color: colors.bannerFrom }} />
          View more booths
        </button>
      ) : (
        <Link href="/shelves" style={btnStyle}>
          <LayoutGrid size={14} style={{ color: colors.bannerFrom }} />
          View more booths
        </Link>
      )}
    </div>
  );
}
