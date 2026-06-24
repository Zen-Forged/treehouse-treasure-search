// components/home-hub/HubMasthead.tsx
// Home Hub masthead (Arc 2; docs/home-hub-design.md D14). Centered Treehouse
// Finds wordmark + "LOCAL FINDS · REAL TREASURES" sub-brand + the established
// profile bubble (right). No hamburger (no drawer in the app), no bell
// (notifications = R9, unbuilt). Replaces the Arc-1 inline placeholder header.

"use client";

import MastheadProfileButton from "@/components/MastheadProfileButton";
import { FONT_INTER } from "@/lib/tokens";
import { HUB_GOLD_TEXT } from "./palette";

const TOP = "calc(env(safe-area-inset-top, 0px) + 16px)";

export default function HubMasthead() {
  return (
    <header
      style={{
        position:       "relative",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        paddingTop:     TOP,
        paddingBottom:  10,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/wordmark.png" alt="Treehouse Finds" style={{ height: 40, width: "auto" }} />
      <div
        style={{
          fontFamily:    FONT_INTER,
          fontSize:      9.5,
          fontWeight:    700,
          letterSpacing: "0.22em",
          color:         HUB_GOLD_TEXT,
          marginTop:     5,
        }}
      >
        LOCAL FINDS · REAL TREASURES
      </div>
      <div style={{ position: "absolute", right: 18, top: TOP }}>
        <MastheadProfileButton />
      </div>
    </header>
  );
}
