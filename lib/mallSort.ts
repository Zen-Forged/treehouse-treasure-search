// lib/mallSort.ts
// Session 158 — Map enrichment shared sort helper.
//
// Single source of truth for the order shown in <MapCarousel> AND the order
// stepped through by <PinCallout>'s flanking arrows. Without this shared
// helper, the carousel + arrows could drift if one's sort logic changed
// without the other — arrows would step to "next nearest" but the carousel
// would scroll to a different card.
//
// Pure function — no React, no I/O. Caller passes the locked userLoc
// snapshot; this helper computes once per (malls × selectedMallId × userLoc)
// tuple via useMemo at the consumer.
//
// Sort logic per docs/map-enrichment-design.md D3:
//   granted + all-Kentucky → distance asc from user
//   granted + scoped       → selected mall at index 0; rest sorted asc from
//                            SELECTED MALL's coords (spatial neighbors)
//   denied / unavailable   → alphabetical by mall.name
//   prompting / idle       → alphabetical (transient)
//
// `milesFromMe` on each entry is the user-centric distance, computed once
// per call so consumers don't recompute per-card. null when location denied
// OR when the mall has no coords.

import { milesFromUser } from "./distance";
import type { UserLocation } from "./useUserLocation";
import type { Mall } from "@/types/treehouse";

export interface SortedMallEntry {
  mall:        Mall;
  /** User-centric distance in miles (1 decimal). null when denied or coords missing. */
  milesFromMe: number | null;
  /** 0-indexed position in the sorted order — used for analytics + arrow disabled state. */
  position:    number;
}

export function computeSortedMalls(
  malls:          Mall[],
  selectedMallId: string | null,
  userLoc:        UserLocation,
): SortedMallEntry[] {
  const isGranted =
    userLoc.status === "granted" &&
    userLoc.lat !== null &&
    userLoc.lng !== null;

  // Pre-compute milesFromUser for every mall — used as displayed label
  // AND (when granted + all-Kentucky) as the sort key.
  const annotated = malls.map((mall) => ({
    mall,
    milesFromMe: isGranted
      ? milesFromUser(
          { lat: userLoc.lat, lng: userLoc.lng },
          mall.latitude == null ? null : Number(mall.latitude),
          mall.longitude == null ? null : Number(mall.longitude),
        )
      : null,
  }));

  if (!isGranted) {
    annotated.sort((a, b) => a.mall.name.localeCompare(b.mall.name));
    return annotated.map((entry, position) => ({ ...entry, position }));
  }

  const selectedMall = selectedMallId
    ? malls.find((m) => m.id === selectedMallId) ?? null
    : null;

  if (selectedMall) {
    // Granted + specific-mall scope — anchor selected at index 0; rest sorted
    // by distance FROM SELECTED MALL (spatial neighbors). Displayed distance
    // remains user-centric per the D3 within-session clarification.
    const anchorLat = selectedMall.latitude == null ? null : Number(selectedMall.latitude);
    const anchorLng = selectedMall.longitude == null ? null : Number(selectedMall.longitude);
    const others = annotated.filter((entry) => entry.mall.id !== selectedMall.id);
    others.sort((a, b) => {
      const da = milesFromUser(
        { lat: anchorLat, lng: anchorLng },
        a.mall.latitude == null ? null : Number(a.mall.latitude),
        a.mall.longitude == null ? null : Number(a.mall.longitude),
      );
      const db = milesFromUser(
        { lat: anchorLat, lng: anchorLng },
        b.mall.latitude == null ? null : Number(b.mall.latitude),
        b.mall.longitude == null ? null : Number(b.mall.longitude),
      );
      if (da === null && db === null) return 0;
      if (da === null) return  1;
      if (db === null) return -1;
      return da - db;
    });
    const selectedEntry = annotated.find((entry) => entry.mall.id === selectedMall.id);
    const head = selectedEntry ? [selectedEntry] : [];
    return [...head, ...others].map((entry, position) => ({ ...entry, position }));
  }

  // Granted + all-Kentucky scope — sort distance asc from user.
  annotated.sort((a, b) => {
    if (a.milesFromMe === null && b.milesFromMe === null) return 0;
    if (a.milesFromMe === null) return  1;
    if (b.milesFromMe === null) return -1;
    return a.milesFromMe - b.milesFromMe;
  });
  return annotated.map((entry, position) => ({ ...entry, position }));
}
