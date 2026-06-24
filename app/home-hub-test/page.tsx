// app/home-hub-test/page.tsx
// Home Hub — Arc 2 smoke route (docs/home-hub-design.md §6). Mounts every new
// primitive against fixtures so the full composition can be reviewed before
// Arc 3 wires real data (getActiveMalls + mall stats + useUserLocation) into
// the real /home page. Per feedback_testbed_first_for_ai_unknowns — primitive
// validation in isolation before consumer wiring (postcard-test / search-bar-
// test / geolocation-test / vendors-test / share-shelf-test lineage).
//
// The search row here is a static visual stand-in; Arc 3 wires the real
// <SearchBar> + filter behavior.

"use client";

import { useState } from "react";
import { PiMagnifyingGlassBold, PiSlidersHorizontalBold } from "react-icons/pi";
import { v2, FONT_INTER } from "@/lib/tokens";
import StickyMasthead from "@/components/StickyMasthead";
import MastheadProfileButton from "@/components/MastheadProfileButton";
import HeroCard from "@/components/home-hub/HeroCard";
import AdvantageGrid from "@/components/home-hub/AdvantageGrid";
import NearbyLocationsRail from "@/components/home-hub/NearbyLocationsRail";
import VendorCtaCard from "@/components/home-hub/VendorCtaCard";
import type { NearbyLocation } from "@/components/home-hub/NearbyLocationCard";

const FIXTURE_LOCATIONS: NearbyLocation[] = [
  { id: "1", name: "America's Antique Mall", photoUrl: "/desktop-hero.png", distanceMi: 2.1, boothCount: 18 },
  { id: "2", name: "The Quirky Turkey",      photoUrl: "/home-hero.png",    distanceMi: 3.4, boothCount: 32 },
  { id: "3", name: "Copper Awning Market",   photoUrl: null,               distanceMi: 4.7, boothCount: 24 },
];

export default function HomeHubTestPage() {
  const [saved, setSaved] = useState<Record<string, boolean>>({ "2": true });
  const locations = FIXTURE_LOCATIONS.map((l) => ({ ...l, saved: !!saved[l.id] }));

  return (
    <div
      style={{
        maxWidth:       430,
        margin:         "0 auto",
        minHeight:      "100vh",
        background:     v2.bg.tabs,
        display:        "flex",
        flexDirection:  "column",
        paddingBottom:  60,
      }}
    >
      <StickyMasthead right={<MastheadProfileButton />} />

      <div style={{ padding: "4px 18px 0", display: "flex", flexDirection: "column" }}>
        {/* search row — static stand-in for Arc 2 */}
        <div style={{ display: "flex", gap: 11, alignItems: "center", margin: "6px 0 16px" }}>
          <div
            style={{
              flex: 1, display: "flex", alignItems: "center", gap: 10,
              background: v2.surface.input, border: `1px solid ${v2.border.medium}`,
              borderRadius: 26, padding: "13px 18px", color: v2.text.secondary,
              fontFamily: FONT_INTER, fontSize: 14,
            }}
          >
            <PiMagnifyingGlassBold /> Search antique, vintage &amp; more…
          </div>
          <div
            style={{
              width: 50, height: 50, borderRadius: "50%", flex: "none",
              background: v2.accent.green, color: "#F2EBDB", fontSize: 19,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 7px rgba(20,48,32,0.25)",
            }}
          >
            <PiSlidersHorizontalBold />
          </div>
        </div>

        <HeroCard
          photoUrl="/home-hero.png"
          headline="Discover treasures near you."
          sub="Find what's on the shelves — before you visit."
          ctaLabel="Explore Nearby"
        />

        <div style={{ height: 30 }} />
        <AdvantageGrid />

        <div style={{ height: 30 }} />
        <NearbyLocationsRail
          locations={locations}
          onToggleSave={(id) => setSaved((s) => ({ ...s, [id]: !s[id] }))}
        />

        <div style={{ height: 26 }} />
        <VendorCtaCard photoUrl="/desktop-hero.png" />
      </div>
    </div>
  );
}
