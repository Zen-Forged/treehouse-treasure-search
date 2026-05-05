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

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase }                 from "./supabase";
import { onAuthChange }             from "./auth";
import { safeStorage }              from "./safeStorage";
import { BOOKMARK_PREFIX, flagKey, loadFollowedIds } from "./utils";

const SAVES_CHANGE_EVENT = "treehouse:saves_change";

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

  useEffect(() => {
    let cancelled = false;

    async function loadFor(userId: string | null) {
      if (cancelled) return;
      if (!userId) {
        // Guest path — read localStorage.
        shopperIdRef.current = null;
        setIds(loadFollowedIds());
        setIsLoading(false);
        return;
      }

      const shopperId = await resolveShopperId(userId);
      if (cancelled) return;
      shopperIdRef.current = shopperId;

      if (!shopperId) {
        // Authed but pre-claim — treat as guest.
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
