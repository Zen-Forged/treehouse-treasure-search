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

// Session 175 — module-scope cache for warm-nav sync hydration per
// feedback_module_scope_cache_for_warm_nav_hydration ✅ Promoted
// (5th cumulative firing post-promotion at session 168, where
// cachedAuthUser + cachedRoleState + cachedShopperAuthState +
// cachedVendorBundle established the pattern). On cold mount cache
// is undefined → useEffect reads localStorage + populates cache; on
// warm-nav re-mount (e.g., Saved → Explore tab switch) the useState
// initializer reads the cache + hydrates synchronously, eliminating
// the "All Kentucky locations" → actual-mall-name chip text flicker
// David surfaced on iPhone QA session 175.
//
// `undefined` distinguishes "not yet read" from `null` ("read, no
// mall picked"); both fall back to null in the initializer's return
// value but cache stays undefined until first read.
let cachedMallId: string | null | undefined = undefined;

export function useSavedMallId(): [string | null, (id: string | null) => void] {
  const [id, setId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null; // SSR safe
    return cachedMallId ?? null;
  });

  // Review Board (session 150) — fixture-substitute. Synchronous hydration
  // before paint so the (tabs) layout's PostcardMallCard renders with
  // FIXTURE_MALL scope on first paint rather than flashing all-Kentucky.
  useLayoutEffect(() => {
    if (!isReviewMode()) return;
    setId(FIXTURE_SHOPPER.saved_mall_id);
  }, []);

  useEffect(() => {
    if (isReviewMode()) return; // fixture state populated above
    const stored = safeStorage.getItem(SAVED_MALL_KEY);
    cachedMallId = stored; // populate cache for sibling/future mounts
    setId(stored);

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
      cachedMallId = e.newValue; // cross-tab write also updates this tab's cache
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
    cachedMallId = next; // keep cache fresh for future re-mounts + sibling instances
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
