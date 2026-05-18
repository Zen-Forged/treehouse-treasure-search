// components/MallParamReceiver.tsx
// Session 183 F2 Shape B — URL-aware ?mall= intake side-effect, extracted
// from TabsChrome.tsx so the main chrome (HomeHero photo + Profile overlay
// + MallPickerChip) renders OUTSIDE Suspense and paints synchronously on
// warm-nav. This component renders null + runs the ?mall= effect; it's
// wrapped in <Suspense fallback={null}> in (tabs)/layout.tsx.
//
// Behavior preserved verbatim from TabsChrome.tsx's prior ?mall= effect
// (session 109 — receive shared mall scope from URL):
//   - When `?mall=<slug>` arrives, look up the mall id + persist via
//     useSavedMallId + strip the param.
//   - Idempotent — no-ops if scope matches OR slug unknown.
//   - Fires `filter_applied` R3 event with source: "shared_url".
//
// Subscribes to useActiveMalls() so when malls hydrate after fetch, the
// effect re-runs + can complete the lookup.

"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useActiveMalls } from "@/lib/cachedMalls";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { track } from "@/lib/clientEvents";

export default function MallParamReceiver() {
  const pathname     = usePathname();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [mallId, setMallId] = useSavedMallId();
  const malls = useActiveMalls();

  useEffect(() => {
    if (malls.length === 0) return;
    const slugParam = searchParams.get("mall");
    if (!slugParam) return;
    const target = malls.find((m) => m.slug === slugParam);
    if (!target) return;
    if (target.id !== mallId) {
      setMallId(target.id);
      track("filter_applied", {
        filter_type:  "mall",
        filter_value: target.slug,
        page:         pathname,
        source:       "shared_url",
      });
    }
    // Strip the query param. Preserve other params (notably ?q=).
    const params = new URLSearchParams(searchParams.toString());
    params.delete("mall");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // mallId intentionally excluded — re-firing after setMallId would dead-loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [malls, searchParams, pathname]);

  return null;
}
