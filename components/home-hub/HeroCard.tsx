// components/home-hub/HeroCard.tsx
// Home Hub — proximity-led photographic hero card (Arc 2; docs/home-hub-design.md
// D5 + D6). Rounded card, full-bleed photo, left→right dark scrim so the serif
// headline + italic sub + green pill CTA read against any photo region.
// Defensive: warm gradient fallback when photoUrl is null.

"use client";

import { v2, FONT_CORMORANT, FONT_INTER } from "@/lib/tokens";

interface HeroCardProps {
  photoUrl?: string | null;
  headline: string;
  sub: string;
  ctaLabel: string;
  onCta?: () => void;
}

export default function HeroCard({ photoUrl, headline, sub, ctaLabel, onCta }: HeroCardProps) {
  return (
    <div
      style={{
        position:     "relative",
        borderRadius: 20,
        overflow:     "hidden",
        height:       248,
        boxShadow:    "0 8px 22px rgba(40,30,15,0.18)",
        background:   "linear-gradient(160deg,#d8cbb0,#bfae8c)",
      }}
    >
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      {/* left→right dark scrim */}
      <div
        style={{
          position:   "absolute",
          inset:      0,
          background: "linear-gradient(90deg, rgba(15,22,16,0.86) 0%, rgba(15,22,16,0.66) 38%, rgba(15,22,16,0.12) 70%, rgba(15,22,16,0) 100%)",
        }}
      />
      <div
        style={{
          position:       "absolute",
          inset:          0,
          padding:        "26px 24px",
          display:        "flex",
          flexDirection:  "column",
          justifyContent: "center",
        }}
      >
        <h2
          style={{
            fontFamily:    FONT_CORMORANT,
            fontWeight:    600,
            fontSize:      38,
            lineHeight:    1.02,
            letterSpacing: "0.3px",
            color:         "#FBF7EE",
            maxWidth:      240,
            margin:        0,
          }}
        >
          {headline}
        </h2>
        <div
          style={{
            fontFamily: FONT_CORMORANT,
            fontStyle:  "italic",
            fontSize:   18,
            lineHeight: 1.3,
            color:      "#EAE2D2",
            maxWidth:   215,
            marginTop:  12,
          }}
        >
          {sub}
        </div>
        <button
          onClick={onCta}
          style={{
            marginTop:    18,
            alignSelf:    "flex-start",
            display:      "inline-flex",
            alignItems:   "center",
            gap:          8,
            background:   v2.accent.green,
            color:        "#F5EFE2",
            fontFamily:   FONT_INTER,
            fontWeight:   600,
            fontSize:     14.5,
            padding:      "12px 22px",
            borderRadius: 24,
            border:       "none",
            cursor:       "pointer",
            boxShadow:    "0 3px 10px rgba(0,0,0,0.28)",
          }}
        >
          {ctaLabel} <span style={{ fontSize: 16 }}>→</span>
        </button>
      </div>
    </div>
  );
}
