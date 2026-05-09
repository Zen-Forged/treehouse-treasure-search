// lib/useShopperSaves.ts
// R1 Arc 4 — hybrid hook for post-save state.
//
// One source-of-truth for "which finds has this user saved?" across the app.
// Returns the same shape regardless of auth state — consumers don't branch.
//
//   guest user                → reads/writes localStorage (existing behavior)
//   authed + no shopper row   → reads/writes localStorage (pre-claim window)
//   authed + shopper row      → reads/writes shopper_saves table in Supabase
//
// The "authed-but-no-shopper-row" branch matters: a returning vendor who
// signs in via /login but hasn't claimed shopper identity (didn't go
// through the role=shopper triage card) sees their localStorage saves
// preserved rather than vanishing. They graduate to DB-backed when they
// run the claim flow.
//
// Cross-instance sync: any toggle dispatches `treehouse:saves_change` with
// `{ id, next }`. All other live instances apply the delta locally —
// idempotent (Set semantics make the toggling instance's listener a
// no-op since it already optimistically applied the same delta).
//
// Cross-tab sync (multiple PWA windows): storage event picks up changes
// to the localStorage flag keys — guest path only, since DB writes don't
// touch localStorage.
//
// Sign-out behavior: localStorage entries persist when the user signs
// out (we never wipe them). Whatever they had before sign-in comes back.
// Saves made WHILE authed are DB-only and stay there — invisible to the
// signed-out device, visible from the next device that signs in.
//
// Session 134 — authed-path snapshot eliminates the heart-icon flicker on
// logged-in mounts. The bug class: hook's initial state was empty Set;
// authed-path DB fetch resolves async; first paint = unfilled hearts,
// second paint = filled hearts after DB fetch. Resurfaced Tier C carry
// (session 116 → retired session 129 with fingerprint preserved → real
// resurfacing here). Resurfacing-fingerprint canonical repair: mirror DB
// writes to localStorage snapshot + read snapshot synchronously in
// useLayoutEffect on mount. First paint now reads from the snapshot
// (correct for the common case of same-account re-mount). The DB fetch
// continues to run in useEffect and overwrites with authoritative state.
// Cross-device divergence reads as a one-tick correction (snapshot →
// DB-fresh) instead of a full empty-to-populated transition.
//
// Snapshot is keyed under `treehouse_authed_saves_snapshot` separate from
// the per-find BOOKMARK_PREFIX flags used by guest path — the contract
// of "guest localStorage flags persist across sign-out" stays intact;
// the snapshot is a separate authed-cache that clearSnapshot on sign-out
// handles. Cross-account edge: if two accounts share a device, the
// snapshot can briefly leak from account A → first paint of account B's
// session before B's DB fetch resolves. Bounded harm (~200ms);
// acceptable trade for eliminating the every-mount flicker.

"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { supabase }                 from "./supabase";
import { onAuthChange }             from "./auth";
import { safeStorage }              from "./safeStorage";
import { BOOKMARK_PREFIX, flagKey, loadFollowedIds } from "./utils";

const SAVES_CHANGE_EVENT = "treehouse:saves_change";

// Authed-path snapshot — see file-top "Session 134" block for rationale.
const SAVES_SNAPSHOT_KEY = "treehouse_authed_saves_snapshot";

function readSnapshot(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SAVES_SNAPSHOT_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((x): x is string => typeof x === "string"));
    }
  } catch {}
  return new Set();
}

function writeSnapshot(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SAVES_SNAPSHOT_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

function clearSnapshot() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SAVES_SNAPSHOT_KEY);
  } catch {}
}

interface SavesChangeDetail {
  id:   string;
  next: boolean;
}

export interface ShopperSavesState {
  ids:       Set<string>;
  isLoading: boolean;
  isSaved:   (id: string) => boolean;
  toggle:    (id: string, next: boolean) => Promise<void>;
}

/**
 * Resolves the current shopper row id from a user id, or null if no row.
 * Returns null on any error so callers can fall back to the guest path.
 */
async function resolveShopperId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("shoppers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[useShopperSaves] shopper resolve:", error.message);
    return null;
  }
  return data?.id ?? null;
}

export function useShopperSaves(): ShopperSavesState {
  const [ids,       setIds]       = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(true);
  // shopperIdRef so the toggle callback (memoized once) sees the latest
  // resolved shopper id without re-binding. setShopperId still triggers
  // re-render of the load effect; the ref is just for the callback.
  const shopperIdRef = useRef<string | null>(null);

  // Session 134 — synchronous snapshot read on first mount, BEFORE the
  // browser paints. Eliminates the every-mount empty-to-populated flicker
  // on the authed path. useLayoutEffect runs once after DOM commit but
  // before paint; setIds with the snapshot triggers a synchronous
  // re-render inside the layout effect, so the first visible paint already
  // shows the saved state. The async useEffect below still runs the DB
  // fetch and overwrites with authoritative state — cross-device divergence
  // reads as a one-tick correction, not a full empty-to-populated flash.
  useLayoutEffect(() => {
    const snapshot = readSnapshot();
    if (snapshot.size === 0) return;
    setIds(snapshot);
  }, []);

  // Mirror authed-path ids to the snapshot whenever they change. Skips on
  // the guest path (shopperIdRef.current null) so the snapshot stays
  // authed-only — guest path uses BOOKMARK_PREFIX flag keys per find,
  // unchanged. The snapshot-restore useLayoutEffect above triggers this
  // effect on mount, but at that point shopperIdRef.current is null
  // (loadFor hasn't run yet), so the no-op skip handles it cleanly.
  useEffect(() => {
    if (!shopperIdRef.current) return;
    writeSnapshot(ids);
  }, [ids]);

  useEffect(() => {
    let cancelled = false;

    async function loadFor(userId: string | null) {
      if (cancelled) return;
      if (!userId) {
        // Guest path — read localStorage. clearSnapshot to avoid leaking
        // a previous authed account's saves into the next sign-in's
        // first paint.
        shopperIdRef.current = null;
        clearSnapshot();
        setIds(loadFollowedIds());
        setIsLoading(false);
        return;
      }

      const shopperId = await resolveShopperId(userId);
      if (cancelled) return;
      shopperIdRef.current = shopperId;

      if (!shopperId) {
        // Authed but pre-claim — treat as guest. clearSnapshot for the
        // same reason as the no-userId branch above.
        clearSnapshot();
        setIds(loadFollowedIds());
        setIsLoading(false);
        return;
      }

      const { data: rows, error } = await supabase
        .from("shopper_saves")
        .select("post_id")
        .eq("shopper_id", shopperId);
      if (cancelled) return;
      if (error) {
        console.error("[useShopperSaves] saves fetch:", error.message);
        setIds(new Set());
        setIsLoading(false);
        return;
      }
      setIds(new Set((rows ?? []).map((r) => r.post_id)));
      setIsLoading(false);
    }

    // Initial session check.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      loadFor(data.session?.user?.id ?? null);
    });

    // Reactive on auth state — sign-in / sign-out / token refresh.
    const unsubAuth = onAuthChange((user) => {
      loadFor(user?.id ?? null);
    });

    // Cross-instance: another instance toggled. Apply the delta locally.
    const onSavesChange = (e: Event) => {
      const detail = (e as CustomEvent<SavesChangeDetail>).detail;
      if (!detail || typeof detail.id !== "string") return;
      setIds((prev) => {
        if (detail.next && prev.has(detail.id))   return prev;
        if (!detail.next && !prev.has(detail.id)) return prev;
        const updated = new Set(prev);
        if (detail.next) updated.add(detail.id);
        else             updated.delete(detail.id);
        return updated;
      });
    };
    window.addEventListener(SAVES_CHANGE_EVENT, onSavesChange);

    // Cross-tab (multiple PWA windows): storage event for localStorage path.
    // Authed path doesn't touch localStorage so this only fires for guests.
    const onStorage = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith(BOOKMARK_PREFIX)) return;
      if (shopperIdRef.current) return;       // authed — DB is canonical
      const id = e.key.slice(BOOKMARK_PREFIX.length);
      const isSet = e.newValue === "1";
      setIds((prev) => {
        if (isSet && prev.has(id))    return prev;
        if (!isSet && !prev.has(id))  return prev;
        const updated = new Set(prev);
        if (isSet) updated.add(id);
        else       updated.delete(id);
        return updated;
      });
    };
    window.addEventListener("storage", onStorage);

    return () => {
      cancelled = true;
      unsubAuth();
      window.removeEventListener(SAVES_CHANGE_EVENT, onSavesChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const isSaved = useCallback((id: string) => ids.has(id), [ids]);

  const toggle = useCallback(async (id: string, next: boolean): Promise<void> => {
    // Optimistic local update — the cross-instance broadcast is idempotent
    // so the listener no-ops in this instance after this state set.
    setIds((prev) => {
      if (next && prev.has(id))   return prev;
      if (!next && !prev.has(id)) return prev;
      const updated = new Set(prev);
      if (next) updated.add(id);
      else      updated.delete(id);
      return updated;
    });
    window.dispatchEvent(
      new CustomEvent<SavesChangeDetail>(SAVES_CHANGE_EVENT, { detail: { id, next } }),
    );

    const shopperId = shopperIdRef.current;
    if (shopperId) {
      try {
        if (next) {
          // ON CONFLICT DO NOTHING via composite PK — idempotent insert
          // means a double-tap doesn't error.
          const { error } = await supabase
            .from("shopper_saves")
            .upsert({ shopper_id: shopperId, post_id: id }, { onConflict: "shopper_id,post_id" });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("shopper_saves")
            .delete()
            .eq("shopper_id", shopperId)
            .eq("post_id", id);
          if (error) throw error;
        }
      } catch (e) {
        console.error("[useShopperSaves] DB toggle:", e);
        // Roll back optimistic update + broadcast the rollback to
        // sibling instances so they don't drift.
        setIds((prev) => {
          const rolled = new Set(prev);
          if (next) rolled.delete(id);
          else      rolled.add(id);
          return rolled;
        });
        window.dispatchEvent(
          new CustomEvent<SavesChangeDetail>(SAVES_CHANGE_EVENT, {
            detail: { id, next: !next },
          }),
        );
      }
    } else {
      // Guest or pre-claim — localStorage write.
      try {
        if (next) safeStorage.setItem(flagKey(id), "1");
        else      safeStorage.removeItem(flagKey(id));
      } catch {}
    }
  }, []);

  return { ids, isLoading, isSaved, toggle };
}
