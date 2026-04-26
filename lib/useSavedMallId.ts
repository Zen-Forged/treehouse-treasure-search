// lib/useSavedMallId.ts
// Saved-mall-id read/write hook. Single source of truth for the persisted
// "active mall filter" across Home / Booths / Find Map.
//
// Mount-time read only (D9 from docs/mall-filter-persistence-design.md).
// Bottom-nav tab switches in App Router unmount/remount the page, so each
// tab's mount picks up the latest value — no `storage`-event subscription
// or in-app event bus needed.

"use client";

import { useCallback, useEffect, useState } from "react";
import { safeStorage } from "./safeStorage";

const SAVED_MALL_KEY = "treehouse_saved_mall_id";

export function useSavedMallId(): [string | null, (id: string | null) => void] {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    setId(safeStorage.getItem(SAVED_MALL_KEY));
  }, []);

  const update = useCallback((next: string | null) => {
    setId(next);
    if (next == null) safeStorage.removeItem(SAVED_MALL_KEY);
    else              safeStorage.setItem(SAVED_MALL_KEY, next);
  }, []);

  return [id, update];
}

export { SAVED_MALL_KEY };
