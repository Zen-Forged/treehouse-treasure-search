// lib/useSavedMallId.ts
// Saved-mall-id read/write hook. Single source of truth for the persisted
// "active mall filter" across Home / Map / Saved.
//
// Originally (D9 from docs/mall-filter-persistence-design.md): mount-time
// read only — relied on the assumption that bottom-nav tab switches in
// App Router unmount/remount the page so each tab's mount picks up the
// latest value. **That assumption broke at session 109** when the
// `app/(tabs)/layout.tsx` shared layout went in: the layout persists
// across tab switches, so its useSavedMallId instance never re-reads
// localStorage after initial mount.
//
// Session 110 fix: in-tab custom-event broadcast. When any instance of
// the hook calls the setter, every other live instance receives the
// update via a `treehouse:saved_mall_change` window event. State stays
// in sync across the layout's instance, the /map page's instance, the
// /flagged page's instance, etc., regardless of mount lifecycle.
//
// Cross-tab sync (multiple browser tabs of the same PWA) is also covered
// by the storage event listener — that one fires only for OTHER tabs,
// so combined with the in-tab custom event, every instance everywhere
// sees the same value.

"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { safeStorage } from "./safeStorage";
import { isReviewMode }    from "./reviewMode";
import { FIXTURE_SHOPPER } from "./fixtures";

const SAVED_MALL_KEY   = "treehouse_saved_mall_id";
const SAVED_MALL_EVENT = "treehouse:saved_mall_change";

export function useSavedMallId(): [string | null, (id: string | null) => void] {
  const [id, setId] = useState<string | null>(null);

  // Review Board (session 150) — fixture-substitute. Synchronous hydration
  // before paint so the (tabs) layout's PostcardMallCard renders with
  // FIXTURE_MALL scope on first paint rather than flashing all-Kentucky.
  useLayoutEffect(() => {
    if (!isReviewMode()) return;
    setId(FIXTURE_SHOPPER.saved_mall_id);
  }, []);

  useEffect(() => {
    if (isReviewMode()) return; // fixture state populated above
    setId(safeStorage.getItem(SAVED_MALL_KEY));

    // Same-tab sync: any instance of this hook that calls the setter
    // dispatches this custom event. We pick it up + update local state.
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<string | null>).detail;
      setId(detail);
    };
    window.addEventListener(SAVED_MALL_EVENT, onCustom);

    // Cross-tab sync: storage events fire in OTHER tabs when this tab
    // writes to localStorage. Bonus coverage for users with multiple PWA
    // windows of the same app.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== SAVED_MALL_KEY) return;
      setId(e.newValue);
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(SAVED_MALL_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const update = useCallback((next: string | null) => {
    setId(next);
    // Review Board (session 150) — skip localStorage write; broadcast
    // still fires so sibling instances in the iframe stay in sync.
    if (!isReviewMode()) {
      if (next == null) safeStorage.removeItem(SAVED_MALL_KEY);
      else              safeStorage.setItem(SAVED_MALL_KEY, next);
    }
    // Broadcast in-tab so sibling instances stay in sync.
    window.dispatchEvent(new CustomEvent<string | null>(SAVED_MALL_EVENT, { detail: next }));
  }, []);

  return [id, update];
}

export { SAVED_MALL_KEY };
