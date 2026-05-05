// app/me/page.tsx
// R1 Arc 2 — Shopper profile destination per design record D4 / D9 / D10 /
// D11 / D15 / D17 (docs/r1-shopper-accounts-design.md).
//
// Frame B (Glass-shape reflective destination) ships:
//   - back-button masthead (matches /find/[id] + /shelf/[slug] family)
//   - 84px avatar with 2-char initials in v1.green circle (D11)
//   - handle in Lora 22 / 500 / inkPrimary (D4)
//   - "SCOUTING SINCE [MONTH YYYY]" eyebrow in FONT_SYS small-caps (D10)
//   - 3-stat row — Finds saved · Booths bookmarked · Locations (D9).
//     FONT_NUMERAL numerals + FONT_SYS labels. Stats are PRIVATE per D2.
//   - Sign-out italic-Lora link in v1.green (D15)
//
// Arc 2 mocks the shopper data via constants below; Arc 3 replaces them
// with real auth + DB query (auth.uid() → shoppers row → aggregate counts).
// The sign-out button is wired to a no-op for now; Arc 3 calls
// supabase.auth.signOut() and routes to /.
//
// /me deliberately lives OUTSIDE app/(tabs)/ per D17 — it's not a tab,
// it's a destination behind the masthead profile bubble. BottomNav
// renders normally so the user lands back on a tab via either the
// browser back button or a tab tap.

"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import StickyMasthead from "@/components/StickyMasthead";
import BottomNav     from "@/components/BottomNav";
import { v1, FONT_LORA, FONT_SYS, FONT_NUMERAL } from "@/lib/tokens";

// ── Arc 2 mock data ─────────────────────────────────────────────────────────
// Arc 3 replaces with: auth state lookup → shoppers row fetch → aggregate
// count queries. Arc 4's useShopperSaves() hook supplies the live counts.
const MOCK_HANDLE          = "treehouse-scout";
const MOCK_INITIALS        = "TS";
const MOCK_SCOUTING_SINCE  = "MAY 2026";
const MOCK_FINDS_SAVED     = 12;
const MOCK_BOOTHS          = 4;
const MOCK_LOCATIONS       = 3;

export default function MePage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight:    "100vh",
        background:   v1.paperCream,
        display:      "flex",
        flexDirection:"column",
      }}
    >
      <StickyMasthead
        left={
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            style={{
              width:           44,
              height:          44,
              borderRadius:    "50%",
              background:      v1.iconBubble,
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              border:          "none",
              cursor:          "pointer",
              padding:         0,
              WebkitTapHighlightColor: "transparent",
              transition:      "background 0.18s ease",
            }}
          >
            <ArrowLeft size={22} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
          </button>
        }
        right={null}
      />

      <main
        style={{
          width:        "100%",
          maxWidth:     430,
          margin:       "0 auto",
          padding:      "32px 24px 100px",
          flex:         1,
        }}
      >
        {/* ─── Avatar 84 ───────────────────────────────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            width:           84,
            height:          84,
            borderRadius:    42,
            background:      v1.green,
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            margin:          "0 auto 14px",
            boxShadow:       "0 2px 8px rgba(42,26,10,0.18)",
          }}
        >
          <span
            style={{
              fontFamily:    FONT_SYS,
              fontWeight:    600,
              fontSize:      28,
              letterSpacing: "0.02em",
              color:         v1.onGreen,
              lineHeight:    1,
            }}
          >
            {MOCK_INITIALS}
          </span>
        </div>

        {/* ─── Handle ─────────────────────────────────────────────────── */}
        <h1
          style={{
            textAlign:     "center",
            fontFamily:    FONT_LORA,
            fontWeight:    500,
            fontSize:      22,
            color:         v1.inkPrimary,
            margin:        "0 0 4px",
            letterSpacing: "-0.005em",
            lineHeight:    1.3,
          }}
        >
          @{MOCK_HANDLE}
        </h1>

        {/* ─── Scouting-since eyebrow ─────────────────────────────────── */}
        <div
          style={{
            textAlign:      "center",
            fontFamily:     FONT_SYS,
            fontSize:       10,
            letterSpacing:  "0.16em",
            textTransform:  "uppercase",
            color:          v1.inkFaint,
            margin:         "0 0 22px",
            lineHeight:     1,
          }}
        >
          Scouting since {MOCK_SCOUTING_SINCE}
        </div>

        {/* ─── Stat row (private — D2 + D9) ───────────────────────────── */}
        <div
          style={{
            display:        "flex",
            justifyContent: "center",
            alignItems:     "center",
            gap:            22,
            padding:        "14px 0",
            borderTop:      `1px solid ${v1.inkHairline}`,
            borderBottom:   `1px solid ${v1.inkHairline}`,
            margin:         "0 0 22px",
          }}
        >
          <Stat n={MOCK_FINDS_SAVED} label="Finds saved" />
          <Stat n={MOCK_BOOTHS}      label="Booths bookmarked" />
          <Stat n={MOCK_LOCATIONS}   label="Locations" />
        </div>

        {/* ─── Sign-out — italic Lora link, v1.green (D15) ─────────────── */}
        {/* Arc 3 wires supabase.auth.signOut() + router.push("/"). Arc 2
            renders the visual contract only. */}
        <button
          type="button"
          onClick={() => { /* TODO Arc 3 — supabase.auth.signOut() */ }}
          style={{
            display:    "block",
            margin:     "24px auto 0",
            background: "none",
            border:     "none",
            padding:    "8px 16px",
            fontFamily: FONT_LORA,
            fontStyle:  "italic",
            fontSize:   14,
            color:      v1.green,
            cursor:     "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Sign out
        </button>
      </main>

      <BottomNav active={null} flaggedCount={0} />
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <span
        style={{
          fontFamily: FONT_NUMERAL,
          fontSize:   24,
          color:      v1.inkPrimary,
          display:    "block",
          lineHeight: 1,
        }}
      >
        {n}
      </span>
      <span
        style={{
          fontFamily:     FONT_SYS,
          fontSize:       10,
          letterSpacing:  "0.10em",
          textTransform:  "uppercase",
          color:          v1.inkMuted,
          marginTop:      4,
          display:        "block",
        }}
      >
        {label}
      </span>
    </div>
  );
}
