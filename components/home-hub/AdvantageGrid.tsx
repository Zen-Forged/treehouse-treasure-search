// components/home-hub/AdvantageGrid.tsx
// Home Hub — "The Treehouse Advantage" 3-audience value grid (Arc 2;
// docs/home-hub-design.md D9 + D10). Casts the full 3-sided platform vision:
// Shoppers (green), Vendors (gold), Malls (teal). Informational pitch copy —
// NOT tappable (the actionable CTAs live elsewhere on the hub). Malls carries a
// COMING SOON tag (mall-operator accounts are roadmap R13; D10) — drop it +
// make the column live when R13 ships.

"use client";

import type { ReactNode } from "react";
import { PiShoppingBagBold, PiStorefrontBold, PiBuildingsBold } from "react-icons/pi";
import { v2, FONT_INTER, FONT_LORA } from "@/lib/tokens";
import { HUB_GOLD, HUB_TEAL, HUB_GOLD_TEXT, HUB_TEAL_TEXT } from "./palette";

interface Audience {
  icon: ReactNode;
  accent: string;      // icon-circle fill (bright; passes 3:1 UI bar)
  labelColor: string;  // label TEXT (AA-passing on the hub bg per REC-1/2/3)
  label: string;
  copy: string;
  comingSoon?: boolean;
}

const AUDIENCES: Audience[] = [
  {
    icon: <PiShoppingBagBold />, accent: v2.accent.green, labelColor: v2.accent.green, label: "FOR SHOPPERS",
    copy: "Find unique pieces near you, save your favorites & never miss a great find.",
  },
  {
    icon: <PiStorefrontBold />, accent: HUB_GOLD, labelColor: HUB_GOLD_TEXT, label: "FOR VENDORS",
    copy: "Showcase your finds, reach more shoppers & grow your booth locally.",
  },
  {
    icon: <PiBuildingsBold />, accent: HUB_TEAL, labelColor: HUB_TEAL_TEXT, label: "FOR MALLS",
    copy: "Drive foot traffic, promote your vendors & build a thriving community.",
    comingSoon: true,
  },
];

export default function AdvantageGrid() {
  return (
    <section>
      {/* leaf-ornament eyebrow */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "0 0 20px" }}>
        <span style={{ height: 1, flex: 1, background: v2.border.medium }} />
        <span style={{ color: HUB_GOLD, fontSize: 13 }}>&#10087;</span>
        <span style={{ fontFamily: FONT_INTER, fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", color: v2.text.secondary }}>
          THE TREEHOUSE ADVANTAGE
        </span>
        <span style={{ color: HUB_GOLD, fontSize: 13, transform: "scaleX(-1)", display: "inline-block" }}>&#10087;</span>
        <span style={{ height: 1, flex: 1, background: v2.border.medium }} />
      </div>

      {/* columns */}
      <div style={{ display: "flex", gap: 6 }}>
        {AUDIENCES.map((a, i) => (
          <div
            key={a.label}
            style={{
              flex:          1,
              display:       "flex",
              flexDirection: "column",
              alignItems:    "center",
              textAlign:     "center",
              padding:       "0 4px",
              borderLeft:    i > 0 ? `1px solid ${v2.border.light}` : "none",
            }}
          >
            <div
              style={{
                width: 58, height: 58, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 25, color: "#fff", background: a.accent,
                marginBottom: 11, boxShadow: "0 3px 8px rgba(0,0,0,0.12)",
              }}
            >
              {a.icon}
            </div>
            <h3 style={{ fontFamily: FONT_INTER, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", margin: "0 0 8px", color: a.labelColor }}>
              {a.label}
            </h3>
            <p style={{ fontFamily: FONT_LORA, fontSize: 12.5, lineHeight: 1.45, color: v2.text.secondary, margin: 0 }}>
              {a.copy}
            </p>
            {a.comingSoon && (
              <span
                style={{
                  display: "inline-block", marginTop: 7,
                  fontFamily: FONT_INTER, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.08em",
                  color: HUB_TEAL_TEXT, background: "rgba(91,123,138,0.12)", borderRadius: 8, padding: "2px 7px",
                }}
              >
                COMING SOON
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
