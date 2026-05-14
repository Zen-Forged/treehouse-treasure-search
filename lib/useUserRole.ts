// lib/useUserRole.ts
// Reactive role detection — admin / vendor / shopper / none.
//
// Session 160 — extracted as shared hook because TWO chrome consumers
// need role this session: <MastheadProfileButton> (admin → /admin
// instead of /me) and <BottomNav> (vendor sees Booth tab). Without
// the hook, each component would maintain its own auth-change
// subscription + detectUserRole call.
//
// Why not extend useShopperAuth: useShopperAuth queries the shoppers
// table specifically + returns shopper-identity (handle, initials,
// scoutingSince). Role detection adds vendors + admin checks; conflating
// the two would force every useShopperAuth consumer to pay for the
// extra round trip even when only shopper-identity is needed. Keeping
// useUserRole separate preserves the existing hook's responsibility.
//
// Single subscription per consumer (one onAuthChange listener each).
// detectUserRole internally Promise.all's vendors + shoppers queries
// + sync admin email check, so per-update cost is O(1) HTTP round trip.
//
// Review Board (session 150) — when isReviewMode(), returns FIXTURE_SHOPPER
// role ("shopper") synchronously so fixture renders don't hit Supabase.

"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { onAuthChange, detectUserRole, type UserRole } from "./auth";
import { getUser } from "./auth";
import { isReviewMode } from "./reviewMode";

export interface UserRoleState {
  isLoading: boolean;
  role:      UserRole;
}

const INITIAL_STATE: UserRoleState = {
  isLoading: true,
  role:      "none",
};

export function useUserRole(): UserRoleState {
  const [state, setState] = useState<UserRoleState>(INITIAL_STATE);

  // Review Board fixture path — synchronous hydrate, skip Supabase.
  useLayoutEffect(() => {
    if (!isReviewMode()) return;
    setState({ isLoading: false, role: "shopper" });
  }, []);

  useEffect(() => {
    if (isReviewMode()) return;
    let cancelled = false;

    async function refresh(seed?: Awaited<ReturnType<typeof getUser>>) {
      const user = seed !== undefined ? seed : await getUser();
      if (cancelled) return;
      const r = await detectUserRole(user);
      if (cancelled) return;
      setState({ isLoading: false, role: r });
    }

    refresh();

    const unsubscribe = onAuthChange((user) => {
      // onAuthChange's User type matches getUser's; pass through to refresh.
      refresh(user);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return state;
}
