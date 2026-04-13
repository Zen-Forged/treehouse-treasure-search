// components/BoothFinderCard.tsx
// Navigation card linking to Apple Maps for a booth's physical location.
// Used on My Shelf and Public Shelf pages.

"use client";

import { MapPin, ChevronRight } from "lucide-react";
import { colors } from "@/lib/tokens";
import { mapsUrl } from "@/lib/utils";

interface BoothFinderCardProps {
  boothNumber:  string | null;
  displayName:  string;
  mallName:     string;
  mallCity?:    string;
}

export default function BoothFinderCard({ boothNumber, displayName, mallName, mallCity }: BoothFinderCardProps) {
  const query = [mallName, mallCity].filter(Boolean).join(", ");

  return (
    <a
      href={mapsUrl(query)}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex", alignItems: "stretch",
        margin: "20px 10px 0", borderRadius: 16, overflow: "hidden",
        border: `1px solid ${colors.border}`, background: "#fff", textDecoration: "none",
      }}
    >
      {/* Green map thumbnail */}
      <div style={{
        width: 100, flexShrink: 0,
        background: `linear-gradient(135deg, ${colors.bannerFrom}, ${colors.bannerTo})`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <MapPin size={22} style={{ color: "rgba(255,255,255,0.40)" }} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, padding: "14px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
          <MapPin size={11} style={{ color: colors.textMuted, flexShrink: 0 }} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>
            Find it here in person
          </span>
        </div>
        <p style={{ margin: "0 0 3px", fontFamily: "Georgia, serif", fontSize: 12, color: colors.textMid }}>
          {displayName}{boothNumber ? ` · Booth ${boothNumber}` : ""}
        </p>
        <p style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 12, color: colors.textMuted }}>
          {mallName}{mallCity ? `, ${mallCity}` : ""}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", paddingRight: 14 }}>
        <ChevronRight size={16} style={{ color: colors.textFaint }} />
      </div>
    </a>
  );
}
