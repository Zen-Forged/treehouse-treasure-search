// lib/useShopperFindsFound.ts
// v2 Arc 1.3 — hook for ✓ Found Find-tier engagement state.
//
// Returns the same shape regardless of auth state — consumers don't branch.
// localStorage-only persistence per session-138 Q5a (i). Lighter shape than
// useShopperSaves (no DB path, no auth-state branching, no rollback path —
// localStorage writes are sync, either succeed or no-op).
//
// ✓ Found is the digital→physical bridge crossing per session-137 lattice
// (project_layered_engagement_share_hierarchy.md): Save = wishlist intent;
// Found = physical confirmation that the find was seen in the booth. The
// state is intentionally per-device (no cross-device DB sync) for now —
// Find-tier engagement is a personal-collection signal, not a social
// signal. DB-backed shape is a Tier B promotion candidate when scout-trip
// history becomes a product surface.
//
// Cross-instance sync: any toggle dispatches `treehouse:finds_found_change`
// with `{ id, next }`. All other live instances apply the delta locally —
// idempotent (Set semantics make the toggling instance's listener a no-op
// since it already optimistically applied the same delta).
//
// Cross-tab sync (multiple PWA windows): storage event picks up the whole-
// array replacement at FOUNDS_STORAGE_KEY; the listener parses + replaces
// local state. Less granular than useShopperSaves's per-flag-key shape but
// fine at realistic volumes (~50-100 finds/user worst case).
//
// Storage shape: single key `treehouse:finds_found` storing JSON array.
// Greenfield (no legacy migration); diverges from useShopperSaves's
// per-find BOOKMARK_PREFIX flags by design.
"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { isReviewMode }    from "./reviewMode";
import { FIXTURE_SHOPPER } from "./fixtures";

const FOUNDS_STORAGE_KEY = "treehouse:finds_found";
const FOUNDS_CHANGE_EVENT = "treehouse:finds_found_change";

interface FoundsChangeDetail {
  id: string;
  next: boolean;
}

export interface ShopperFindsFoundState {
  ids: Set<string>;
  isLoading: boolean;
  isFound: (id: string) => boolean;
  toggle: (id: string, next: boolean) => void;
}

function readStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(FOUNDS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((x): x is string => typeof x === "string"));
    }
  } catch {}
  return new Set();
}

function writeStorage(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      FOUNDS_STORAGE_KEY,
      JSON.stringify(Array.from(ids)),
    );
  } catch {}
}

export function useShopperFindsFound(): ShopperFindsFoundState {
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Synchronous storage read on first mount, BEFORE the browser paints.
  // Eliminates empty-to-populated flicker on the ✓ Found state — same
  // shape as useShopperSaves's session-134 snapshot pattern, simpler
  // because there's no async DB fetch overlay.
  //
  // Review Board (session 150) — fixture-substitute hydrates here too.
  useLayoutEffect(() => {
    if (isReviewMode()) {
      setIds(new Set(FIXTURE_SHOPPER.found_ids));
      setIsLoading(false);
      return;
    }
    setIds(readStorage());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Cross-instance: another instance toggled. Apply delta locally.
    // Idempotent — toggling instance's listener no-ops because the
    // optimistic setIds in toggle() already applied the delta.
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<FoundsChangeDetail>).detail;
      if (!detail || typeof detail.id !== "string") return;
      setIds((prev) => {
        if (detail.next && prev.has(detail.id)) return prev;
        if (!detail.next && !prev.has(detail.id)) return prev;
        const updated = new Set(prev);
        if (detail.next) updated.add(detail.id);
        else updated.delete(detail.id);
        return updated;
      });
    };
    window.addEventListener(FOUNDS_CHANGE_EVENT, onChange);

    // Cross-tab: storage event fires when another tab writes to
    // FOUNDS_STORAGE_KEY. e.newValue is the full JSON array.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== FOUNDS_STORAGE_KEY) return;
      try {
        if (!e.newValue) {
          setIds(new Set());
          return;
        }
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          setIds(
            new Set(
              parsed.filter((x): x is string => typeof x === "string"),
            ),
          );
        }
      } catch {}
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(FOUNDS_CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const isFound = useCallback((id: string) => ids.has(id), [ids]);

  const toggle = useCallback((id: string, next: boolean): void => {
    let writeIds: Set<string> | null = null;
    setIds((prev) => {
      if (next && prev.has(id)) return prev;
      if (!next && !prev.has(id)) return prev;
      const updated = new Set(prev);
      if (next) updated.add(id);
      else updated.delete(id);
      writeIds = updated;
      return updated;
    });
    if (writeIds) {
      // Review Board (session 150) — skip localStorage write; broadcast
      // still fires so sibling components in the iframe stay in sync.
      if (!isReviewMode()) writeStorage(writeIds);
      window.dispatchEvent(
        new CustomEvent<FoundsChangeDetail>(FOUNDS_CHANGE_EVENT, {
          detail: { id, next },
        }),
      );
    }
  }, []);

  return { ids, isLoading, isFound, toggle };
}
