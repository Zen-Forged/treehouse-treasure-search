// app/(tabs)/home/page.tsx
// Home Hub — docs/home-hub-design.md. The real composition, wired to live data.
// Chrome: TabsChrome renders <StickyMasthead> for /home (session-205 QA dial —
// matches /flagged's wordmark); the (tabs) layout provides the outer wrapper bg
// + maxWidth + BottomNav. This page renders only the body.
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
import { useActiveMalls } from "@/lib/cachedMalls";
import { getMallStatsByMallId, type MallStats } from "@/lib/posts";
import { useUserLocation } from "@/lib/useUserLocation";
import { milesFromUser } from "@/lib/distance";
import { useSavedMallId } from "@/lib/useSavedMallId";
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
      {/* Masthead is rendered by TabsChrome (<StickyMasthead>) for /home —
          matches /flagged exactly (David QA dial). */}
      <div style={{ padding: "12px 18px 0", display: "flex", flexDirection: "column" }}>
        {/* Search + filter row retired session 206 — it only deep-linked to
            Explore and served no real function on the hub. The hero is the
            top-of-page anchor now. (Tier B: live inline search may revive it.) */}
        <HeroCard
          // desktop-hero.png is the clean editorial flatlay (no baked-in
          // wordmark, unlike home-hero.png which bled through the scrim).
          // Arc 4 dial — swap to a dedicated hero asset if David has one.
          photoUrl="/desktop-hero.png"
          headline="Discover treasures near you."
          sub="Find what's on the shelves — before you visit."
          ctaLabel="Explore Nearby"
          // David QA dial — "Explore Nearby" routes to the Map tab/page.
          onCta={() => router.push("/map")}
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
