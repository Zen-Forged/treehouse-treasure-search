// app/map/page.tsx
// R10 (session 107) Arc 2 — /map skeleton route.
//
// Chrome-only — TabPageMasthead + PostcardMallCard + paperWarm placeholder
// body. Map provider integration (cartographic warm-cream Mapbox per D25,
// leaf-bubble pins per D24, peek-then-commit interaction per D26) ships
// in Arc 3 as its own session.
//
// Per session-107 iPhone QA (David):
//   - SearchBar removed (D20 + D27 reversed) — Map stays purely geographic.
//   - /map is THE place to change mall scope. Home + Saved tap-on-card now
//     routes here instead of opening MallSheet locally. The shared scope
//     persists via the existing `useSavedMallId` hook.
//
// Design record: docs/r10-location-map-design.md.

"use client";

import * as React from "react";
import TabPageMasthead from "@/components/TabPageMasthead";
import PostcardMallCard from "@/components/PostcardMallCard";
import MallSheet from "@/components/MallSheet";
import BottomNav from "@/components/BottomNav";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { getActiveMalls } from "@/lib/posts";
import { track } from "@/lib/clientEvents";
import { v1, FONT_LORA } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

export const dynamic = "force-dynamic";

export default function MapPage() {
  const [mallId, setMallId] = useSavedMallId();
  const [malls, setMalls] = React.useState<Mall[]>([]);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  React.useEffect(() => {
    getActiveMalls().then(setMalls);
  }, []);

  const selectedMall = mallId ? (malls.find((m) => m.id === mallId) ?? null) : null;
  const allKentuckySubtitle = `${malls.length} active locations · Kentucky`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: v1.paperCream,
        maxWidth: 430,
        margin: "0 auto",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TabPageMasthead />

      <div style={{ padding: "0 16px 12px" }}>
        <PostcardMallCard
          mall={selectedMall ?? "all-kentucky"}
          stampGlyph="map"
          allKentuckySubtitle={allKentuckySubtitle}
          // /map is THE scope-change surface (D19 partial reversal — Home +
          // Saved no longer open MallSheet from card tap). Until Arc 3 ships
          // pin-tap-to-rescope, MallSheet is the change UI here.
          onTap={() => setSheetOpen(true)}
        />
      </div>

      {/* Placeholder map body — paperWarm with literary copy. Replaced in
          Arc 3 by the cartographic warm-cream Mapbox basemap (D25) +
          leaf-bubble pins + peek-callout state machine (D26). */}
      <main
        style={{
          flex: 1,
          margin: "0 16px",
          marginBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))",
          background: v1.paperWarm,
          border: `1px solid ${v1.inkHairline}`,
          borderRadius: 12,
          minHeight: 480,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT_LORA,
            fontStyle:  "italic",
            fontSize:   16,
            color:      v1.inkMuted,
            lineHeight: 1.55,
            maxWidth:   280,
          }}
        >
          A cartographic view of every treehouse in Kentucky lands here in
          the next sprint — leaf pins on a warm-cream basemap, tap to peek a
          location, tap again to scout it.
        </div>
      </main>

      <BottomNav active="map" />

      <MallSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        malls={malls}
        activeMallId={mallId}
        onSelect={(id) => {
          setMallId(id);
          setSheetOpen(false);
          // R3 filter_applied event with page='/map' — scope change is now
          // /map's responsibility. Home + /flagged retired their own
          // mirrors of this event when they retired their MallSheets.
          const slug = id ? (malls.find(m => m.id === id)?.slug ?? null) : null;
          track("filter_applied", {
            filter_type:  "mall",
            filter_value: slug ?? "all",
            page:         "/map",
          });
        }}
      />
    </div>
  );
}
