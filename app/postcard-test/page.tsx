// app/postcard-test/page.tsx
// R10 (session 107) Arc 1 — primitive smoke-test page.
//
// Renders <TabPageMasthead>, <PostcardMallCard> (every stamp glyph + the
// all-kentucky variant), and <PinCallout> against the real paperCream
// background so each can be tap-tested on Vercel preview before they ship
// into Home / Saved / Map.
//
// No data layer, no router push, no map provider integration — just
// presentation primitives wired with synthetic mall + count data. Per
// `feedback_testbed_first_for_ai_unknowns.md` — same shape of risk: the
// postcard card composes across 3 consumer surfaces, so primitive-isolated
// validation lands first.
//
// Delete or repurpose once Arc 2 wires the card into Home / Saved + Arc 3
// ships /map.

"use client";

import * as React from "react";
import TabPageMasthead from "@/components/TabPageMasthead";
import PostcardMallCard, { type StampGlyph } from "@/components/PostcardMallCard";
import PinCallout from "@/components/PinCallout";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";

type StampOption = StampGlyph;

const STAMP_OPTIONS: { value: StampOption; label: string }[] = [
  { value: "home",    label: "Home"    },
  { value: "map",     label: "Map"     },
  { value: "profile", label: "Profile" },
  { value: "saved",   label: "Saved"   },
];

const SAMPLE_MALL = {
  id:       "00000000-0000-0000-0000-000000000001",
  slug:     "americas-antique-mall",
  name:     "America's Antique Mall",
  address:  "11420 Bluegrass Pkwy",
  city:     "Louisville",
  state:    "KY",
  zip_code: "40299",
};

const LONG_NAME_MALL = {
  ...SAMPLE_MALL,
  id:   "00000000-0000-0000-0000-000000000002",
  slug: "long-name-test",
  name: "Bardstown Road Vintage & Antique Collective Marketplace",
};

const SAMPLE_PIN_MALL = {
  id:             SAMPLE_MALL.id,
  slug:           SAMPLE_MALL.slug,
  name:           SAMPLE_MALL.name,
  hero_image_url: null,
  latitude:       null,
  longitude:      null,
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontFamily:    FONT_SYS,
      fontSize:      11,
      fontWeight:    600,
      letterSpacing: "0.10em",
      textTransform: "uppercase",
      color:         v1.inkMuted,
      marginTop:     32,
      marginBottom:  10,
    }}
  >
    {children}
  </div>
);

const Note = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontFamily: FONT_LORA,
      fontStyle:  "italic",
      fontSize:   12,
      color:      v1.inkMuted,
      lineHeight: 1.5,
      marginBottom: 12,
    }}
  >
    {children}
  </div>
);

export default function PostcardTestPage() {
  const [stamp, setStamp] = React.useState<StampOption>("home");
  const [tapLog, setTapLog] = React.useState<string>("(no taps yet)");

  return (
    <main
      style={{
        minHeight:  "100vh",
        background: v1.paperCream,
        paddingBottom: 60,
        fontFamily: FONT_SYS,
      }}
    >
      <TabPageMasthead />

      <div style={{ padding: "0 16px" }}>
        <h1
          style={{
            fontFamily:    FONT_LORA,
            fontSize:      22,
            fontWeight:    500,
            color:         v1.inkPrimary,
            margin:        "8px 0 4px",
            letterSpacing: "-0.005em",
          }}
        >
          R10 primitive smoke-test
        </h1>
        <Note>
          TabPageMasthead above. Three consumer surfaces below, each with sample data. Card tap fires {`onTap`}; callout tap fires {`onCommit`}. No data layer, no map provider.
        </Note>

        {/* Stamp glyph picker */}
        <SectionTitle>Stamp glyph</SectionTitle>
        <div
          style={{
            display: "flex",
            gap:     6,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {STAMP_OPTIONS.map(opt => {
            const selected = stamp === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStamp(opt.value)}
                style={{
                  padding:      "6px 12px",
                  fontFamily:   FONT_SYS,
                  fontSize:     12,
                  fontWeight:   selected ? 600 : 400,
                  background:   selected ? v1.green : v1.paperWarm,
                  color:        selected ? v1.onGreen : v1.inkMid,
                  border:       `1px solid ${selected ? v1.green : v1.inkHairline}`,
                  borderRadius: 999,
                  cursor:       "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* PostcardMallCard — sample mall */}
        <SectionTitle>PostcardMallCard — sample mall</SectionTitle>
        <PostcardMallCard
          mall={SAMPLE_MALL}
          stampGlyph={stamp}
          onTap={() => setTapLog(`card tap @ ${new Date().toLocaleTimeString()} — sample mall`)}
        />

        {/* Long name to stress-test 2-line clamp */}
        <SectionTitle>PostcardMallCard — long name (2-line clamp)</SectionTitle>
        <PostcardMallCard
          mall={LONG_NAME_MALL}
          stampGlyph={stamp}
          onTap={() => setTapLog(`card tap @ ${new Date().toLocaleTimeString()} — long name`)}
        />

        {/* All-Kentucky variant */}
        <SectionTitle>PostcardMallCard — all-kentucky scope</SectionTitle>
        <PostcardMallCard
          mall="all-kentucky"
          stampGlyph={stamp}
          onTap={() => setTapLog(`card tap @ ${new Date().toLocaleTimeString()} — all-kentucky`)}
        />

        {/* PinCallout — synthetic anchor inside a placeholder map area */}
        <SectionTitle>PinCallout — peek-then-commit</SectionTitle>
        <Note>
          The callout positions itself absolutely above its anchor coordinate. Below is a 240px-tall paperWarm placeholder simulating the map body; a synthetic anchor at (140, 180) shows the callout floating above a fake pin marker at the same x.
        </Note>
        <div
          style={{
            position:     "relative",
            height:       240,
            background:   v1.paperWarm,
            border:       `1px solid ${v1.inkHairline}`,
            borderRadius: 10,
            overflow:     "hidden",
          }}
        >
          {/* Fake pin marker so the callout has something to "point at" */}
          <div
            style={{
              position:        "absolute",
              left:            140,
              top:             180,
              transform:       "translate(-50%, -100%)",
              width:           20,
              height:          26,
              background:      v1.green,
              borderRadius:    "50% 50% 50% 50% / 60% 60% 40% 40%",
              boxShadow:       "0 2px 4px rgba(42,26,10,0.30)",
            }}
            aria-hidden="true"
          />
          <PinCallout
            mall={SAMPLE_PIN_MALL}
            boothCount={14}
            findCount={86}
            anchor={{ x: 140, y: 180 }}
            onCommit={() => setTapLog(`callout commit @ ${new Date().toLocaleTimeString()}`)}
          />
        </div>

        {/* Tap log */}
        <SectionTitle>Tap log</SectionTitle>
        <div
          style={{
            padding:      "10px 12px",
            background:   v1.postit,
            border:       `1px solid ${v1.inkHairline}`,
            borderRadius: 10,
            fontFamily:   FONT_LORA,
            fontStyle:    "italic",
            fontSize:     13,
            color:        v1.inkPrimary,
          }}
        >
          {tapLog}
        </div>
      </div>
    </main>
  );
}
