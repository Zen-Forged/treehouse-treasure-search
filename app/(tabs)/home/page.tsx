// app/(tabs)/home/page.tsx
// Home Hub — Arc 3 (docs/home-hub-design.md). The real composition, wired to
// live data. TabsChrome early-returns null on /home (Arc 1) so this page owns
// its chrome (HubMasthead); the (tabs) layout provides the outer wrapper bg +
// maxWidth + BottomNav.
//
// Data:
//   - useActiveMalls()        — cached/reactive active-mall list
//   - getMallStatsByMallId()  — per-mall booth counts (30-day find window)
//   - useUserLocation()       — R17 location (prompts on mount; the hub's pitch
//                               is proximity, so distance is core). Graceful:
//                               denied → no distance, rail keeps default order.
//   - milesFromUser()         — haversine, 1-decimal, null-safe
//
// Card tap commits the mall scope (useSavedMallId) + routes to the Explore feed
// — the canonical "pick a location → browse its finds" path. Save heart is off
// (showSave={false}) until ★ Favorite Mall ships (no favorite-mall backend).

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PiMagnifyingGlassBold, PiSlidersHorizontalBold } from "react-icons/pi";
import { v2, FONT_INTER } from "@/lib/tokens";
import { useActiveMalls } from "@/lib/cachedMalls";
import { getMallStatsByMallId, type MallStats } from "@/lib/posts";
import { useUserLocation } from "@/lib/useUserLocation";
import { milesFromUser } from "@/lib/distance";
import { useSavedMallId } from "@/lib/useSavedMallId";
import HubMasthead from "@/components/home-hub/HubMasthead";
import HeroCard from "@/components/home-hub/HeroCard";
import AdvantageGrid from "@/components/home-hub/AdvantageGrid";
import NearbyLocationsRail from "@/components/home-hub/NearbyLocationsRail";
import VendorCtaCard from "@/components/home-hub/VendorCtaCard";
import type { NearbyLocation } from "@/components/home-hub/NearbyLocationCard";

// "Explore Nearby" shows the closest handful; horizontal scroll handles the
// rest. Cap is a QA dial (Arc 4).
const NEARBY_CAP = 10;

export default function HomeHubPage() {
  const router       = useRouter();
  const malls        = useActiveMalls();
  const userLoc      = useUserLocation();
  const [, setMallId] = useSavedMallId();
  const [stats, setStats] = useState<Record<string, MallStats>>({});

  useEffect(() => {
    let alive = true;
    getMallStatsByMallId().then((s) => { if (alive) setStats(s); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const locations = useMemo<NearbyLocation[]>(() => {
    const list: NearbyLocation[] = malls.map((m) => ({
      id:         m.id,
      name:       m.name,
      photoUrl:   m.hero_image_url ?? null,
      distanceMi: milesFromUser(userLoc, m.latitude ?? null, m.longitude ?? null),
      boothCount: stats[m.id]?.boothCount ?? 0,
    }));
    // Nearest-first when any distance is known; null distances sink to the end.
    if (list.some((l) => l.distanceMi != null)) {
      list.sort((a, b) => {
        if (a.distanceMi == null) return 1;
        if (b.distanceMi == null) return -1;
        return a.distanceMi - b.distanceMi;
      });
    }
    return list.slice(0, NEARBY_CAP);
  }, [malls, userLoc, stats]);

  const goExplore = () => router.push("/");

  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "column",
        flex:          1,
        minHeight:     "100vh",
        paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))",
      }}
    >
      <HubMasthead />

      <div style={{ padding: "4px 18px 0", display: "flex", flexDirection: "column" }}>
        {/* search row — entry point into Explore's search (Arc 4/Tier B: live
            inline search). Whole row taps through to the feed. */}
        <div style={{ display: "flex", gap: 11, alignItems: "center", margin: "6px 0 16px" }}>
          <button
            onClick={goExplore}
            style={{
              flex: 1, display: "flex", alignItems: "center", gap: 10, textAlign: "left",
              background: v2.surface.input, border: `1px solid ${v2.border.medium}`,
              borderRadius: 26, padding: "13px 18px", color: v2.text.muted,
              fontFamily: FONT_INTER, fontSize: 14, cursor: "pointer",
            }}
          >
            <PiMagnifyingGlassBold /> Search antique, vintage &amp; more…
          </button>
          <button
            onClick={goExplore}
            aria-label="Browse the feed"
            style={{
              width: 50, height: 50, borderRadius: "50%", flex: "none", border: "none", cursor: "pointer",
              background: v2.accent.green, color: "#F2EBDB", fontSize: 19,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 7px rgba(20,48,32,0.25)",
            }}
          >
            <PiSlidersHorizontalBold />
          </button>
        </div>

        <HeroCard
          photoUrl="/home-hero.png"
          headline="Discover treasures near you."
          sub="Find what's on the shelves — before you visit."
          ctaLabel="Explore Nearby"
          onCta={goExplore}
        />

        <div style={{ height: 30 }} />
        <AdvantageGrid />

        <div style={{ height: 30 }} />
        <NearbyLocationsRail
          locations={locations}
          showSave={false}
          onViewMap={() => router.push("/map")}
          onTapLocation={(id) => { setMallId(id); router.push("/"); }}
        />

        <div style={{ height: 26 }} />
        <VendorCtaCard />
      </div>
    </div>
  );
}
