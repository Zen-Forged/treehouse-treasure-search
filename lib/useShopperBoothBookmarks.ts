// lib/useShopperBoothBookmarks.ts
// R1 Arc 4 — hybrid hook for booth-bookmark state. Mirrors the
// useShopperSaves shape exactly, just keyed by vendor_id instead of
// post_id and writing to shopper_booth_bookmarks instead of shopper_saves.
//
// See lib/useShopperSaves.ts for the architectural rationale (auth-state
// branching, cross-instance + cross-tab sync, sign-out behavior). The two
// hooks are deliberately separate (rather than one merged hook) so consumer
// pages opt into only the data they need — Saved tab doesn't load booth
// bookmarks; /shelves doesn't load find saves.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase }                        from "./supabase";
import { onAuthChange }                    from "./auth";
import { BOOTH_BOOKMARK_PREFIX, boothBookmarkKey, loadBookmarkedBoothIds } from "./utils";

const BOOKMARKS_CHANGE_EVENT = "treehouse:booth_bookmarks_change";

interface BookmarksChangeDetail {
  vendorId: string;
  next:     boolean;
}

export interface ShopperBoothBookmarksState {
  ids:          Set<string>;
  isLoading:    boolean;
  isBookmarked: (vendorId: string) => boolean;
  toggle:       (vendorId: string, next: boolean) => Promise<void>;
}

async function resolveShopperId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("shoppers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[useShopperBoothBookmarks] shopper resolve:", error.message);
    return null;
  }
  return data?.id ?? null;
}

export function useShopperBoothBookmarks(): ShopperBoothBookmarksState {
  const [ids,       setIds]       = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(true);
  const shopperIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFor(userId: string | null) {
      if (cancelled) return;
      if (!userId) {
        shopperIdRef.current = null;
        setIds(loadBookmarkedBoothIds());
        setIsLoading(false);
        return;
      }

      const shopperId = await resolveShopperId(userId);
      if (cancelled) return;
      shopperIdRef.current = shopperId;

      if (!shopperId) {
        setIds(loadBookmarkedBoothIds());
        setIsLoading(false);
        return;
      }

      const { data: rows, error } = await supabase
        .from("shopper_booth_bookmarks")
        .select("vendor_id")
        .eq("shopper_id", shopperId);
      if (cancelled) return;
      if (error) {
        console.error("[useShopperBoothBookmarks] bookmarks fetch:", error.message);
        setIds(new Set());
        setIsLoading(false);
        return;
      }
      setIds(new Set((rows ?? []).map((r) => r.vendor_id)));
      setIsLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      loadFor(data.session?.user?.id ?? null);
    });

    const unsubAuth = onAuthChange((user) => {
      loadFor(user?.id ?? null);
    });

    const onBookmarksChange = (e: Event) => {
      const detail = (e as CustomEvent<BookmarksChangeDetail>).detail;
      if (!detail || typeof detail.vendorId !== "string") return;
      setIds((prev) => {
        if (detail.next && prev.has(detail.vendorId))   return prev;
        if (!detail.next && !prev.has(detail.vendorId)) return prev;
        const updated = new Set(prev);
        if (detail.next) updated.add(detail.vendorId);
        else             updated.delete(detail.vendorId);
        return updated;
      });
    };
    window.addEventListener(BOOKMARKS_CHANGE_EVENT, onBookmarksChange);

    const onStorage = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith(BOOTH_BOOKMARK_PREFIX)) return;
      if (shopperIdRef.current) return;
      const vendorId = e.key.slice(BOOTH_BOOKMARK_PREFIX.length);
      const isSet = e.newValue === "1";
      setIds((prev) => {
        if (isSet && prev.has(vendorId))    return prev;
        if (!isSet && !prev.has(vendorId))  return prev;
        const updated = new Set(prev);
        if (isSet) updated.add(vendorId);
        else       updated.delete(vendorId);
        return updated;
      });
    };
    window.addEventListener("storage", onStorage);

    return () => {
      cancelled = true;
      unsubAuth();
      window.removeEventListener(BOOKMARKS_CHANGE_EVENT, onBookmarksChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const isBookmarked = useCallback((vendorId: string) => ids.has(vendorId), [ids]);

  const toggle = useCallback(async (vendorId: string, next: boolean): Promise<void> => {
    setIds((prev) => {
      if (next && prev.has(vendorId))   return prev;
      if (!next && !prev.has(vendorId)) return prev;
      const updated = new Set(prev);
      if (next) updated.add(vendorId);
      else      updated.delete(vendorId);
      return updated;
    });
    window.dispatchEvent(
      new CustomEvent<BookmarksChangeDetail>(BOOKMARKS_CHANGE_EVENT, {
        detail: { vendorId, next },
      }),
    );

    const shopperId = shopperIdRef.current;
    if (shopperId) {
      try {
        if (next) {
          const { error } = await supabase
            .from("shopper_booth_bookmarks")
            .upsert(
              { shopper_id: shopperId, vendor_id: vendorId },
              { onConflict: "shopper_id,vendor_id" },
            );
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("shopper_booth_bookmarks")
            .delete()
            .eq("shopper_id", shopperId)
            .eq("vendor_id", vendorId);
          if (error) throw error;
        }
      } catch (e) {
        console.error("[useShopperBoothBookmarks] DB toggle:", e);
        setIds((prev) => {
          const rolled = new Set(prev);
          if (next) rolled.delete(vendorId);
          else      rolled.add(vendorId);
          return rolled;
        });
        window.dispatchEvent(
          new CustomEvent<BookmarksChangeDetail>(BOOKMARKS_CHANGE_EVENT, {
            detail: { vendorId, next: !next },
          }),
        );
      }
    } else {
      try {
        if (next) localStorage.setItem(boothBookmarkKey(vendorId), "1");
        else      localStorage.removeItem(boothBookmarkKey(vendorId));
      } catch {}
    }
  }, []);

  return { ids, isLoading, isBookmarked, toggle };
}
