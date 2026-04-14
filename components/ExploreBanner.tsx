// components/ExploreBanner.tsx
// CTA banner at the bottom of My Booth and Public Shelf pages.
// "Discover more finds" routes back to the home feed — cyclic discovery loop.

"use client";

import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { colors } from "@/lib/tokens";

export default function ExploreBanner() {
  const router = useRouter();

  const btnStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "10px 18px", borderRadius: 24,
    background: "rgba(255,255,255,0.95)", border: "none",
    cursor: "pointer",
    fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700,
    color: colors.bannerFrom,
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
        Keep exploring
      </p>
      <h2 style={{
        margin: "0 0 6px",
        fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700,
        color: "#fff", lineHeight: 1.2,
      }}>
        Explore more booths nearby
      </h2>
      <p style={{
        margin: "0 0 16px",
        fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 12,
        color: "rgba(255,255,255,0.55)",
      }}>
        From local booths. Across Kentucky.
      </p>

      <button onClick={() => router.push("/")} style={btnStyle}>
        <Home size={14} style={{ color: colors.bannerFrom }} />
        Discover more finds
      </button>
    </div>
  );
}
