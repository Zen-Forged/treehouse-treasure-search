// components/home-hub/NearbyLocationsRail.tsx
// Home Hub — "Explore Nearby" horizontal rail (Arc 2; docs/home-hub-design.md
// D11). Header (pin + EXPLORE NEARBY) + "View Map ›" → /map. Horizontal scroll
// of <NearbyLocationCard>. Arc 3 sorts distance-asc when geolocation granted,
// else by active/featured. Full-bleed via negative margin matching the 18px
// body padding so cards run to the screen edge.

"use client";

import { PiMapPinFill, PiCaretRightBold } from "react-icons/pi";
import { v2, FONT_INTER } from "@/lib/tokens";
import NearbyLocationCard, { type NearbyLocation } from "./NearbyLocationCard";

interface Props {
  locations: NearbyLocation[];
  onViewMap?: () => void;
  onTapLocation?: (id: string) => void;
  onToggleSave?: (id: string) => void;
}

export default function NearbyLocationsRail({ locations, onViewMap, onTapLocation, onToggleSave }: Props) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_INTER, fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: v2.text.primary }}>
          <PiMapPinFill style={{ color: v2.accent.green, fontSize: 15 }} /> EXPLORE NEARBY
        </div>
        <button
          onClick={onViewMap}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontFamily: FONT_INTER, fontSize: 12.5, fontWeight: 600, color: v2.accent.green }}
        >
          View Map <PiCaretRightBold style={{ fontSize: 12 }} />
        </button>
      </div>

      <div
        style={{
          display:    "flex",
          gap:        13,
          overflowX:  "auto",
          margin:     "0 -18px",
          padding:    "0 18px 4px",
          scrollbarWidth: "none",
        }}
      >
        {locations.map((loc) => (
          <NearbyLocationCard
            key={loc.id}
            {...loc}
            onTap={onTapLocation ? () => onTapLocation(loc.id) : undefined}
            onToggleSave={onToggleSave ? () => onToggleSave(loc.id) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
