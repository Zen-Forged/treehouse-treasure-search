// components/home-hub/NearbyLocationCard.tsx
// Home Hub — a single location card for the Explore Nearby rail (Arc 2;
// docs/home-hub-design.md D11). Per-location hero photo + name overlay +
// proximity + booth count + save heart. "booths" vocabulary (not "vendors").
// Defensive: warm gradient fallback when photoUrl is null (B7 — real photos
// depend on malls.hero_image_url being populated).

"use client";

import { PiHeartBold, PiHeartFill } from "react-icons/pi";
import { v2, FONT_CORMORANT, FONT_INTER, FONT_NUMERAL } from "@/lib/tokens";

export interface NearbyLocation {
  id: string;
  name: string;
  photoUrl?: string | null;
  distanceMi?: number | null;
  boothCount: number;
  saved?: boolean;
}

interface Props extends NearbyLocation {
  onToggleSave?: () => void;
  onTap?: () => void;
  // showSave defaults true (testbed). The real hub passes false until the
  // ★ Favorite Mall backend exists (lattice Mall-tier engagement; no
  // favorite-malls hook today) — avoids a dead heart that writes nowhere.
  showSave?: boolean;
}

export default function NearbyLocationCard({
  name, photoUrl, distanceMi, boothCount, saved, onToggleSave, onTap, showSave = true,
}: Props) {
  return (
    <div
      onClick={onTap}
      style={{
        width:        208,
        flex:         "none",
        background:   v2.surface.card,
        border:       `1px solid ${v2.border.light}`,
        borderRadius: 15,
        overflow:     "hidden",
        boxShadow:    "0 3px 9px rgba(42,30,15,0.08)",
        cursor:       onTap ? "pointer" : "default",
      }}
    >
      {/* photo banner */}
      <div style={{ height: 124, position: "relative", background: "linear-gradient(150deg,#9a8b6f,#7d6f53)", overflow: "hidden" }}>
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        {/* Bottom scrim (design-reviewer REC-6) — guarantees the name's dark
            substrate independent of the photo; a light mall exterior would
            otherwise drop #fff text to ~1.3:1. Mirrors the HeroCard pattern. */}
        <div
          style={{
            position: "absolute", left: 0, right: 0, bottom: 0, height: 56,
            background: "linear-gradient(to top, rgba(15,16,12,0.72), rgba(15,16,12,0))",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position:     "absolute", left: 10, right: 10, bottom: 9,
            fontFamily:   FONT_CORMORANT, fontStyle: "italic", fontWeight: 600, fontSize: 17,
            color:        "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.6)",
            whiteSpace:   "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>
      </div>

      {/* meta row */}
      <div style={{ padding: "11px 13px 13px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: FONT_INTER, fontSize: 11.5, fontWeight: 600, color: v2.text.secondary }}>
          {distanceMi != null && (
            <span style={{ color: v2.accent.green, fontFamily: FONT_NUMERAL }}>{distanceMi} mi</span>
          )}
          {distanceMi != null ? " · " : ""}
          {boothCount} booths
        </div>
        {showSave && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave?.(); }}
            aria-label={saved ? "Remove from saved" : "Save location"}
            style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              display: "flex", color: saved ? v2.accent.green : v2.text.muted, fontSize: 18,
            }}
          >
            {saved ? <PiHeartFill /> : <PiHeartBold />}
          </button>
        )}
      </div>
    </div>
  );
}
