"use client";
// components/VisitorTrackerMount.tsx
// Session 194 Ask #2 — Mount point for lib/visitorTracker.ts.
//
// Tiny "use client" wrapper that calls initVisitorTracker() once on app boot.
// Mounts via app/layout.tsx body (sibling to <FindSessionProvider>) so the
// tracker fires across every surface in the app (shopper tabs + vendor
// flows + admin + /find/[id] + /shelf/[slug] etc.).
//
// initVisitorTracker is idempotent — safe to call on every re-mount; module-
// scope guard inside the tracker no-ops second calls (SPA navigation does
// not restart the dwell timer).

import { useEffect } from "react";
import { initVisitorTracker } from "@/lib/visitorTracker";

export default function VisitorTrackerMount() {
  useEffect(() => initVisitorTracker(), []);
  return null;
}
