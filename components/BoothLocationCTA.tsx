// components/BoothLocationCTA.tsx
// Canonical CTA card for the Booth page — design-system.md v0.2.
//
// Structure (per "Card pattern system" → CTA variant):
//   ┌────────────────────────────────────────────┐
//   │  ⌂ Booth 369 · AAM · Louisville            │
//   │    1555 Hurstbourne Pkwy     Directions →  │
//   │                                            │
//   │  ┌──────────────────────────────────────┐  │
//   │  │ ▪ Explore the full mall              │  │
//   │  └──────────────────────────────────────┘  │
//   └────────────────────────────────────────────┘
//
// The Secondary button routes to the mall's Apple Maps URL until the
// dedicated mall profile page ships (Sprint 6+). Label stays future-safe.

"use client";

import { colors, radius, spacing } from "@/lib/tokens";
import { mapsUrl, vendorHueBg } from "@/lib/utils";
import LocationStatement from "./LocationStatement";

interface BoothLocationCTAProps {
  boothNumber: string | null;
  displayName: string;
  mallName:    string;
  mallCity?:   string;
  address?:    string | null;
}

export default function BoothLocationCTA({
  boothNumber, displayName, mallName, mallCity, address,
}: BoothLocationCTAProps) {
  const exploreQuery = [mallName, mallCity].filter(Boolean).join(", ");
  const swatchBg     = vendorHueBg(displayName);

  function handleExplore() {
    window.open(mapsUrl(exploreQuery), "_blank", "noopener,noreferrer");
  }

  return (
    <div style={{
      margin: "20px 10px 0",
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.md,
      padding: spacing.cardPad,
    }}>
      <LocationStatement
        boothNumber={boothNumber}
        mallName={mallName}
        city={mallCity}
        address={address}
        variant="full"
        tone="light"
      />

      {/* Secondary button — full-width */}
      <button
        onClick={handleExplore}
        style={{
          marginTop: 14,
          width: "100%",
          minHeight: 44,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          background: colors.greenLight,
          border: `1px solid ${colors.greenBorder}`,
          borderRadius: radius.md,
          color: colors.green,
          fontSize: 14, fontWeight: 600,
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          padding: "0 16px",
        }}
      >
        <span style={{
          width: 14, height: 14, borderRadius: 4,
          background: swatchBg,
          flexShrink: 0,
        }} />
        <span>Explore the full mall</span>
      </button>
    </div>
  );
}
