// components/SearchBarRow.tsx
// Session 157 — fixed SearchBar row sitting between masthead and MallStrip
// in the (tabs) layout's sticky chrome stack. Extracted from layout.tsx
// because useSearchParams() at the layout level forces every child page
// (including /flagged) into dynamic rendering, which then trips Next.js
// 14's "useSearchParams() should be wrapped in a suspense boundary"
// build-time bailout. Isolating the useSearchParams call to this small
// component lets the layout itself stay statically prerenderable; only
// THIS component is dynamic, and only on Home where it's actually
// rendered (consumer wraps in <Suspense> + a pathname === "/" gate).
//
// Variant A + T3 spec (session 157 V1 mockup pick):
//   - bg: v2.bg.main (#F7F3EB — matches masthead + strip continuity)
//   - SearchBar primitive bg: v2.surface.input #F0EBE0 (set inside the
//     primitive itself, session-153 canonical for inputs)
//   - wrap padding: 6/6 (T1 trim from baseline 8/8)
//   - Total wrap height: 56px (exposed as SEARCH_BAR_WRAP_HEIGHT in
//     components/MallStrip.tsx for downstream consumers to compute
//     their top: position against the masthead + search stack)

"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MASTHEAD_HEIGHT } from "@/components/StickyMasthead";
import SearchBar from "@/components/SearchBar";
import { v2 } from "@/lib/tokens";

export default function SearchBarRow() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";

  const handleSearchChange = useCallback((next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.trim().length > 0) params.set("q", next);
    else                        params.delete("q");
    const qs = params.toString();
    // Always replace to "/" — SearchBarRow only renders on pathname === "/",
    // so URL stays on the same route.
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }, [router, searchParams]);

  return (
    <div
      style={{
        position:    "fixed",
        top:         MASTHEAD_HEIGHT,
        left:        "50%",
        transform:   "translateX(-50%)",
        width:       "100%",
        maxWidth:    430,
        background:  v2.bg.main,
        padding:     "6px 16px",
        // z-index 39 — same tier as MallStrip (just below masthead z-40
        // so the wordmark stays on top during any pixel overlap at the
        // seam). Strip is below this in DOM but they don't overlap.
        zIndex:      39,
      }}
    >
      <SearchBar
        initialQuery={q}
        onChange={handleSearchChange}
      />
    </div>
  );
}
