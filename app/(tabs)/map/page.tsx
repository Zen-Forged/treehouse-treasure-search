// app/(tabs)/map/page.tsx
// /map page body — TreehouseMap + peek state + MallSheet + contextual pill.
//
// Outer chrome (StickyMasthead + PostcardMallCard + BottomNav) lives in
// app/(tabs)/layout.tsx. This page owns:
//   - <TreehouseMap>             (the map itself + pin/peek state)
//   - <MallSheet>                (mall picker — relocated from layout
//                                 session 110 since the only opener is
//                                 the new contextual pill below)
//   - <MapContextualPill>        (top-right of map; state-aware affordance
//                                 — "Clear" when scope set, "Browse list"
//                                 when all-Kentucky)
//
// Design record: docs/r10-location-map-design.md.

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import nextDynamic from "next/dynamic";
import { X, List } from "lucide-react";
import MallSheet from "@/components/MallSheet";
import { MASTHEAD_HEIGHT } from "@/components/StickyMasthead";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { useShopperSaves } from "@/lib/useShopperSaves";
import { getActiveMalls, getMallStatsByMallId, getPostsByIds, type MallStats } from "@/lib/posts";
import { track } from "@/lib/clientEvents";
import { v1, FONT_SYS } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

// Contextual pill — single state-aware affordance (per David's session-110
// pick). Top-right of the map container. Two states:
//   - scope set     → "Clear" + X-glyph;     tap = setMallId(null) (stays on /map)
//   - all-Kentucky  → "List view" + List;    tap = open MallSheet (stays on /map)
function MapContextualPill({
  scopeSet,
  onClear,
  onOpenList,
}: {
  scopeSet:   boolean;
  onClear:    () => void;
  onOpenList: () => void;
}) {
  const Icon  = scopeSet ? X    : List;
  const label = scopeSet ? "Clear" : "List view";
  const onTap = scopeSet ? onClear : onOpenList;
  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        position:        "absolute",
        top:             12,
        right:           12,
        zIndex:          5,
        display:         "flex",
        alignItems:      "center",
        gap:             6,
        padding:         "8px 14px 8px 12px",
        borderRadius:    999,
        background:      v1.green,
        color:           v1.onGreen,
        border:          "none",
        cursor:          "pointer",
        fontFamily:      FONT_SYS,
        fontSize:        13,
        fontWeight:      600,
        letterSpacing:   "0.01em",
        boxShadow:       v1.shadow.callout,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <Icon size={15} strokeWidth={2.0} />
      {label}
    </button>
  );
}

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
  const router = useRouter();
  const [mallId, setMallId] = useSavedMallId();
  const [malls, setMalls] = React.useState<Mall[]>([]);
  const [mallStats, setMallStats] = React.useState<Record<string, MallStats>>({});
  // D26 — transient peek state. Pin tap sets this; tapping the callout
  // commits the rescope + clears it; tapping empty map clears it.
  const [peekedMallId, setPeekedMallId] = React.useState<string | null>(null);
  // Session 110 — MallSheet state lives here now (relocated from layout).
  // Opened only by the contextual pill; no other surface opens MallSheet
  // after D19 fully reversed.
  const [sheetOpen, setSheetOpen] = React.useState(false);

  // Session 123 — saves grouped by mall_id, fed into PinCallout so the
  // body line reads "X saved finds" when the user has saves at that mall.
  // Falls back to mallStats.findCount when the user has 0 saves there.
  // Re-fetches whenever saves.ids changes (cross-instance toggle, sign-in
  // migration) so the count stays current with the rest of the app.
  const saves = useShopperSaves();
  const [savedByMallId, setSavedByMallId] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    getActiveMalls().then(setMalls);
    getMallStatsByMallId().then(setMallStats);
  }, []);

  React.useEffect(() => {
    if (saves.isLoading) return;
    let cancelled = false;
    const ids = Array.from(saves.ids);
    if (ids.length === 0) {
      setSavedByMallId({});
      return;
    }
    getPostsByIds(ids).then((data) => {
      if (cancelled) return;
      const counts: Record<string, number> = {};
      for (const post of data) {
        if (post.mall_id) counts[post.mall_id] = (counts[post.mall_id] ?? 0) + 1;
      }
      setSavedByMallId(counts);
    });
    return () => { cancelled = true; };
  }, [saves.ids, saves.isLoading]);

  // Session 122 — force scroll-to-top on mount. Next App Router doesn't
  // auto-reset scroll between sibling pages under a shared layout, so
  // without this /map inherits the previous tab's scrollY (e.g. user
  // scrolled Home, tapped Map → map renders behind the fold). /map has
  // no scroll-state worth preserving (the map element fills the
  // viewport), so unconditional reset is correct.
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto-show the PinCallout for the active mall when /map mounts with a
  // scope already set. Two entry paths land here with mallId populated:
  //   (a) tapping the Map BottomNav tab from Home/Saved while scope is set
  //   (b) a shared ?mall=<slug> URL — layout intake sets mallId before
  //       navigation reaches /map
  // In both cases, the user already cares about that mall — the callout
  // saves them a tap (Navigate / Explore are right there). Mount-only:
  // doesn't re-pop on subsequent mallId changes (e.g. Clear pill, list
  // pick) since those originate from /map and a re-pop would feel like a
  // bug, not an affordance.
  React.useEffect(() => {
    if (mallId) setPeekedMallId(mallId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map height fits the visible viewport (100dvh) minus chrome above + nav-
  // clearance margin below. Previous `flex: 1, minHeight: 480` allowed the
  // map to grow past viewport on phones where 480 > available — iPhone 15
  // Pro available is ~445px after chrome, so the 480 floor pushed the map
  // bottom into BottomNav territory.
  //
  // Subtraction:
  //   MASTHEAD_HEIGHT      — calc(safe-area-top + 103px) from StickyMasthead.
  //   144px                — postcard wrapper top padding (12) + slim card
  //                          height (~132px = padding + name + address rows).
  //   marginBottom (below) — max(110, safe-area-bottom + 100) for BottomNav.
  //
  // 100dvh tracks the actual visible viewport on iOS Safari (vs 100vh which
  // on iOS includes the URL-bar area). flex:"0 0 auto" overrides the layout's
  // implicit flex distribution since we have an explicit height.
  const mainHeight =
    `calc(100dvh - ${MASTHEAD_HEIGHT} - 144px - max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px)))`;

  return (
    <main
      style={{
        flex:         "0 0 auto",
        margin:       "0 16px",
        marginTop:    12,
        marginBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))",
        border:       `1px solid ${v1.inkHairline}`,
        borderRadius: 12,
        height:       mainHeight,
        overflow:     "hidden",
        position:     "relative",
      }}
    >
      <TreehouseMap
        malls={malls}
        selectedMallId={mallId}
        peekedMallId={peekedMallId}
        mallStats={mallStats}
        savedByMallId={savedByMallId}
        onPinTap={(id) => setPeekedMallId(id)}
        onMapTap={() => setPeekedMallId(null)}
        onCommit={(id) => {
          setMallId(id);
          setPeekedMallId(null);
          // R3 filter_applied event — pin-tap-then-commit is the canonical
          // scope-change path on /map.
          const slug = malls.find((m) => m.id === id)?.slug ?? null;
          track("filter_applied", {
            filter_type:  "mall",
            filter_value: slug ?? "all",
            page:         "/map",
          });
          // D26 extension (session 110) — after committing the new scope,
          // route to Home so the user immediately sees the feed for the
          // mall they just picked. /map is now an interaction surface
          // (pick a scope, return to feed), not a destination. Per David:
          // "on the second tap it should go to the home screen to view
          // the feed."
          router.push("/");
        }}
      />

      {/* Contextual pill — single state-aware affordance per session-110
          design. Top-right inside the map container so it floats over the
          basemap without affecting the page layout flow. */}
      <MapContextualPill
        scopeSet={mallId !== null}
        onClear={() => {
          setMallId(null);
          // R3 filter_applied event for explicit clear via pill (distinct
          // from MallSheet selection of "All Kentucky").
          track("filter_applied", {
            filter_type:  "mall",
            filter_value: "all",
            page:         "/map",
            source:       "clear_pill",
          });
        }}
        onOpenList={() => setSheetOpen(true)}
      />

      <MallSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        malls={malls}
        activeMallId={mallId}
        onSelect={(id) => {
          setMallId(id);
          setSheetOpen(false);
          // R3 filter_applied event — list-pick is the secondary scope-
          // change path (vs pin commit which auto-routes to Home).
          // Per David: list selection STAYS on /map (no router.push).
          const slug = id ? (malls.find(m => m.id === id)?.slug ?? null) : null;
          track("filter_applied", {
            filter_type:  "mall",
            filter_value: slug ?? "all",
            page:         "/map",
            source:       "list_pick",
          });
        }}
      />
    </main>
  );
}
