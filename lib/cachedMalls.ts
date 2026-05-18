// lib/cachedMalls.ts
// Session 183 C2 — shared module-scope cache + reactive hook for active
// malls list. Extracted from TabsChrome.tsx's local `cachedMalls` (session
// 175 — 5th cumulative firing of feedback_module_scope_cache_for_warm_nav_
// hydration ✅ Promoted at session 168) to enable TabsChrome (Base chrome)
// AND MallParamReceiver (URL-aware ?mall= intake) to share the same
// hydrated malls list without duplicate getActiveMalls() round trips.
//
// Both consumers call useActiveMalls(); the first to mount fires the
// fetch + populates the cache; the second initializes from cache
// synchronously. Both get reactive updates when malls hydrate via
// React state.
//
// Part of F2 Shape B split (Suspense fallback=null root cause on warm-nav
// from /find/[id] → /). TabsChrome (Base) renders OUTSIDE the layout's
// Suspense boundary so the floating chrome stack (HomeHero photo +
// Profile overlay + MallPickerChip) paints synchronously; MallParam-
// Receiver (URL-aware ?mall side-effect) renders INSIDE Suspense.

"use client";

import { useState, useEffect } from "react";
import { getActiveMalls } from "@/lib/posts";
import type { Mall } from "@/types/treehouse";

let cachedMalls: Mall[] | null = null;
let inflightFetch: Promise<Mall[]> | null = null;

/**
 * Reactive accessor for active malls. Multiple consumers in the same
 * page tree dedupe via module-scope cache + inflight promise tracking
 * so only one getActiveMalls() round trip fires regardless of how many
 * consumers mount.
 *
 * On warm-nav re-mount, useState initializer hydrates from cache
 * synchronously (no fetch round trip, no flicker between empty + populated).
 */
export function useActiveMalls(): Mall[] {
  const [malls, setMalls] = useState<Mall[]>(() => cachedMalls ?? []);

  useEffect(() => {
    if (cachedMalls && cachedMalls.length > 0) {
      // Cache already populated — useState initializer caught it; no fetch.
      return;
    }
    // Dedupe concurrent mounts: if a fetch is in flight, await it instead
    // of firing a second one.
    if (!inflightFetch) {
      inflightFetch = getActiveMalls().then((next) => {
        cachedMalls = next;
        inflightFetch = null;
        return next;
      });
    }
    let cancelled = false;
    inflightFetch.then((next) => {
      if (!cancelled) setMalls(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return malls;
}

/**
 * Synchronous read of the cache for non-React consumers (e.g., side-effect
 * useEffect bodies that need to look up a mall by slug without subscribing
 * to reactive updates). Returns null if the cache hasn't been populated.
 */
export function getCachedMalls(): Mall[] | null {
  return cachedMalls;
}
