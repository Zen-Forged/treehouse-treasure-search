// app/(tabs)/map/page.tsx
// /map page body — TreehouseMap + peek state.
//
// Chrome (TabPageMasthead, PostcardMallCard with onTap → MallSheet,
// BottomNav, MallSheet) lives in app/(tabs)/layout.tsx. This page renders
// only the map body, which is what changes between root tab pages.
//
// Design record: docs/r10-location-map-design.md.

"use client";

import * as React from "react";
import nextDynamic from "next/dynamic";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { getActiveMalls, getMallStatsByMallId, type MallStats } from "@/lib/posts";
import { track } from "@/lib/clientEvents";
import { v1 } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

// SSR-safe import — mapbox-gl's UMD bundle accesses `window` at module
// evaluation, which crashes during server render even inside a "use client"
// component (the import statement runs in the SSR pass too). Skipping SSR
// for the map prevents that crash and ensures the map only initializes
// in the browser where WebGL is available.
const TreehouseMap = nextDynamic(() => import("@/components/TreehouseMap"), {
  ssr: false,
});

export const dynamic = "force-dynamic";

export default function MapPage() {
  const [mallId, setMallId] = useSavedMallId();
  const [malls, setMalls] = React.useState<Mall[]>([]);
  const [mallStats, setMallStats] = React.useState<Record<string, MallStats>>({});
  // D26 — transient peek state. Pin tap sets this; tapping the callout
  // commits the rescope + clears it; tapping empty map clears it.
  const [peekedMallId, setPeekedMallId] = React.useState<string | null>(null);

  React.useEffect(() => {
    getActiveMalls().then(setMalls);
    getMallStatsByMallId().then(setMallStats);
  }, []);

  return (
    <main
      style={{
        flex:         1,
        margin:       "0 16px",
        marginTop:    12,
        marginBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))",
        border:       `1px solid ${v1.inkHairline}`,
        borderRadius: 12,
        minHeight:    480,
        overflow:     "hidden",
        position:     "relative",
      }}
    >
      <TreehouseMap
        malls={malls}
        selectedMallId={mallId}
        peekedMallId={peekedMallId}
        mallStats={mallStats}
        onPinTap={(id) => setPeekedMallId(id)}
        onMapTap={() => setPeekedMallId(null)}
        onCommit={(id) => {
          setMallId(id);
          setPeekedMallId(null);
          // R3 filter_applied event — pin-tap-then-commit is the canonical
          // scope-change path on /map. MallSheet on the postcard card
          // (handled in the layout) stays as the secondary path.
          const slug = malls.find((m) => m.id === id)?.slug ?? null;
          track("filter_applied", {
            filter_type:  "mall",
            filter_value: slug ?? "all",
            page:         "/map",
          });
        }}
      />
    </main>
  );
}
