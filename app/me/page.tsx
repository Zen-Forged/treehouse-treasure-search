// app/me/page.tsx
// R1 Arc 2 — Shopper profile destination per design record D4 / D9 / D10 /
// D11 / D15 / D17 (docs/r1-shopper-accounts-design.md).
// R1 Arc 4 (this revision) — wired to real auth + DB-backed counts via
// useShopperAuth + useShopperSaves + useShopperBoothBookmarks. Sign-out
// calls supabase.auth.signOut() and returns the user to the feed.
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
// Auth-state branching:
//   - shopper auth still loading → blank surface (no flash)
//   - guest                       → redirect to /login
//   - authed but no shopper row   → redirect to /login/email/handle (claim flow)
//   - authed + shopper row        → render the Frame B layout
//
// /me deliberately lives OUTSIDE app/(tabs)/ per D17 — it's a destination
// behind the masthead profile bubble, not a tab.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import StickyMasthead from "@/components/StickyMasthead";
import BottomNav     from "@/components/BottomNav";
import { v1, FONT_LORA, FONT_SYS, FONT_NUMERAL } from "@/lib/tokens";
import { supabase }  from "@/lib/supabase";
import { useShopperAuth }          from "@/lib/useShopperAuth";
import { useShopperSaves }         from "@/lib/useShopperSaves";
import { useShopperBoothBookmarks } from "@/lib/useShopperBoothBookmarks";
import { getPostsByIds }           from "@/lib/posts";

/**
 * Format ISO timestamp as "MAY 2026" (uppercase month + year). Used for
 * the "SCOUTING SINCE …" eyebrow per D10. Falls back to empty string on
 * unparseable input — the eyebrow then renders without a date suffix
 * rather than throwing.
 */
function formatScoutingSince(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d
    .toLocaleString("en-US", { month: "long", year: "numeric" })
    .toUpperCase();
}

export default function MePage() {
  const router          = useRouter();
  const auth            = useShopperAuth();
  const saves           = useShopperSaves();
  const boothBookmarks  = useShopperBoothBookmarks();

  // Locations stat = distinct mall_ids of saved finds. Booth-bookmark
  // mall_ids could also be unioned in, but the user-visible concept
  // ("Locations where I've been scouting") aligns more cleanly with the
  // saves set. Refine here if user feedback suggests otherwise.
  const [locationCount, setLocationCount] = useState<number>(0);

  useEffect(() => {
    if (saves.isLoading) return;
    let cancelled = false;
    const ids = Array.from(saves.ids);
    if (ids.length === 0) {
      setLocationCount(0);
      return;
    }
    getPostsByIds(ids).then((posts) => {
      if (cancelled) return;
      const malls = new Set<string>();
      for (const p of posts) {
        if (p.mall_id) malls.add(p.mall_id);
      }
      setLocationCount(malls.size);
    });
    return () => { cancelled = true; };
  }, [saves.ids, saves.isLoading]);

  // Auth-state redirects fire after the auth check resolves. While
  // loading we render a blank surface to avoid a flash of the form.
  useEffect(() => {
    if (auth.isLoading) return;
    if (!auth.isAuthed)         router.replace("/login");
    else if (!auth.shopper)     router.replace("/login/email/handle");
  }, [auth.isLoading, auth.isAuthed, auth.shopper, router]);

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("[me] signOut:", e);
    }
    router.push("/");
  }

  // Hold a blank surface during the auth resolution + redirect window.
  // The auth-state useEffect above takes over once the state settles.
  if (auth.isLoading || !auth.isAuthed || !auth.shopper) {
    return (
      <div
        style={{
          minHeight:  "100vh",
          background: v1.paperCream,
        }}
      />
    );
  }

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
            {auth.shopper.initials}
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
          @{auth.shopper.handle}
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
          Scouting since {formatScoutingSince(auth.shopper.scoutingSince)}
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
          <Stat n={saves.ids.size}          label="Finds saved" />
          <Stat n={boothBookmarks.ids.size} label="Booths bookmarked" />
          <Stat n={locationCount}           label="Locations" />
        </div>

        {/* ─── Sign-out — italic Lora link, v1.green (D15) ─────────────── */}
        <button
          type="button"
          onClick={handleSignOut}
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

      <BottomNav active={null} flaggedCount={saves.ids.size} />
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
