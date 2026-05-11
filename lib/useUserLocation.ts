// lib/useUserLocation.ts
// R17 Arc 1 — single-source-of-truth user-location hook.
//
// Silent first-mount prompt + 30-min TTL cache + cross-instance sync.
// Whichever surface mounts first triggers the prompt; siblings read from
// cache via storage events + custom in-page events (D3 + D20).
//
// Status state machine:
//
//   idle         — initial server-render value (SSR-safe)
//   prompting    — getCurrentPosition called, awaiting result
//   granted      — fix obtained, lat/lng + capturedAt populated
//   denied       — user denied OR position unavailable OR timeout (D4 single
//                  bucket; consumer hides affordance, no error sub-codes)
//   unavailable  — geolocation API not present (very old browsers, certain
//                  privacy modes); same downstream behavior as denied
//
// Cache shape in localStorage["geo_user_loc"]:
//   {
//     "lat": 38.245,
//     "lng": -85.628,
//     "capturedAt": 1746547200000,
//     "status": "granted" | "denied"
//   }
//
// "denied" is cached too — short-lived (30 min same TTL), but we don't
// want to re-prompt the user 14 times during a single session because
// they tapped Map → /shelf/[slug] → /find/[id]. After TTL expiry, we
// silently retry on next surface mount.
//
// Module-scope `inFlight` flag coalesces concurrent first-mounts:
// /find/[id] mounts the cartographic card AND LocationActions, both of
// which call useUserLocation. Without coalescing, two prompts would fire
// on the same render frame.
//
// Cross-tab sync: storage events propagate cache writes to other PWA
// windows. Cross-instance same-tab sync: custom 'treehouse:user_location'
// event broadcasts every state transition. Both listeners apply the
// delta locally; the toggling instance no-ops by virtue of the comparison
// (status + capturedAt are stable across the broadcast→receive cycle).

"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { safeStorage } from "./safeStorage";
import { track }       from "./clientEvents";
import { isReviewMode } from "./reviewMode";
import { FIXTURE_MALL } from "./fixtures";

const CACHE_KEY            = "geo_user_loc";
const TTL_MS               = 30 * 60 * 1000; // 30 min (D14)
const PROMPT_TIMEOUT_MS    = 10_000;
const MAXIMUM_AGE_MS       = 60_000;
const LOCATION_EVENT       = "treehouse:user_location";

export type LocationStatus = "idle" | "prompting" | "granted" | "denied" | "unavailable";

export interface UserLocation {
  status:     LocationStatus;
  lat:        number | null;
  lng:        number | null;
  /** Unix ms timestamp of the last successful or denied result. */
  capturedAt: number | null;
}

interface CachedLocation {
  lat:        number | null;
  lng:        number | null;
  capturedAt: number;
  status:     "granted" | "denied";
}

const INITIAL: UserLocation = { status: "idle", lat: null, lng: null, capturedAt: null };

// Module-scope coalescing flag — prevents concurrent first-mounts from
// firing two getCurrentPosition calls on the same render frame.
let inFlight = false;

function readCache(): CachedLocation | null {
  try {
    const raw = safeStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedLocation;
    if (typeof parsed.capturedAt !== "number") return null;
    if (parsed.status !== "granted" && parsed.status !== "denied") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(loc: CachedLocation): void {
  try {
    safeStorage.setItem(CACHE_KEY, JSON.stringify(loc));
  } catch { /* private-mode etc. — silent */ }
}

function isFresh(cached: CachedLocation): boolean {
  return Date.now() - cached.capturedAt < TTL_MS;
}

function broadcast(next: UserLocation): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<UserLocation>(LOCATION_EVENT, { detail: next }));
}

function cachedToState(cached: CachedLocation): UserLocation {
  return {
    status:     cached.status,
    lat:        cached.lat,
    lng:        cached.lng,
    capturedAt: cached.capturedAt,
  };
}

export function useUserLocation(): UserLocation {
  const [state, setState] = useState<UserLocation>(INITIAL);

  // Review Board (session 150) — fixture-substitute. Hydrate "granted"
  // state with FIXTURE_MALL coords so DistancePill renders ~0 MI on
  // fixture surfaces; skip the real geolocation prompt entirely (no
  // permission dialog during audit).
  useLayoutEffect(() => {
    if (!isReviewMode()) return;
    setState({
      status:     "granted",
      lat:        FIXTURE_MALL.latitude ?? null,
      lng:        FIXTURE_MALL.longitude ?? null,
      capturedAt: Date.now(),
    });
  }, []);

  useEffect(() => {
    if (isReviewMode()) return; // fixture state populated above
    let cancelled = false;

    // (1) Read cache. If fresh, hydrate state from it without re-prompting.
    const cached = readCache();
    if (cached && isFresh(cached)) {
      setState(cachedToState(cached));
    }

    // (2) Listen for cross-instance broadcasts (same tab + cross-tab).
    const onLocationEvent = (e: Event) => {
      if (cancelled) return;
      const detail = (e as CustomEvent<UserLocation>).detail;
      if (!detail) return;
      setState(detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (cancelled) return;
      if (e.key !== CACHE_KEY) return;
      const fresh = readCache();
      if (fresh) setState(cachedToState(fresh));
    };
    window.addEventListener(LOCATION_EVENT, onLocationEvent);
    window.addEventListener("storage", onStorage);

    // (3) If cache is stale or missing AND no other instance is currently
    // prompting, fire the geolocation request. Module-scope `inFlight`
    // coalesces concurrent first-mounts.
    const needsPrompt = !cached || !isFresh(cached);

    if (needsPrompt && !inFlight) {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        const next: UserLocation = {
          status: "unavailable", lat: null, lng: null, capturedAt: Date.now(),
        };
        if (!cancelled) setState(next);
        broadcast(next);
        return cleanup;
      }

      inFlight = true;
      const next: UserLocation = { status: "prompting", lat: null, lng: null, capturedAt: null };
      if (!cancelled) setState(next);
      broadcast(next);
      track("location_prompted");

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          inFlight = false;
          const granted: CachedLocation = {
            lat:        pos.coords.latitude,
            lng:        pos.coords.longitude,
            capturedAt: Date.now(),
            status:     "granted",
          };
          writeCache(granted);
          const stateValue = cachedToState(granted);
          if (!cancelled) setState(stateValue);
          broadcast(stateValue);
          track("location_granted");
        },
        (err) => {
          inFlight = false;
          const denied: CachedLocation = {
            lat:        null,
            lng:        null,
            capturedAt: Date.now(),
            status:     "denied",
          };
          writeCache(denied);
          const stateValue = cachedToState(denied);
          if (!cancelled) setState(stateValue);
          broadcast(stateValue);
          track("location_denied", { code: err?.code });
        },
        {
          enableHighAccuracy: false,
          timeout:            PROMPT_TIMEOUT_MS,
          maximumAge:         MAXIMUM_AGE_MS,
        },
      );
    }

    function cleanup() {
      cancelled = true;
      window.removeEventListener(LOCATION_EVENT, onLocationEvent);
      window.removeEventListener("storage", onStorage);
    }
    return cleanup;
  }, []);

  return state;
}
