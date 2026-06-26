// components/StandaloneLaunchGate.tsx
// Session 207 #1 — cold-launch redirect guard.
//
// David iPhone QA: the installed PWA still opens on Explore ("/") instead of
// the Home hub ("/home"), even though manifest.json's start_url is already
// "/home" (set session 205). Root cause: iOS bakes start_url into the
// home-screen icon AT INSTALL TIME — installs that predate session 205 keep
// launching the old "/". A manifest change can't reach an already-installed
// icon without a reinstall.
//
// Fix (David picked the code guard over reinstall-only so EVERY existing
// install is corrected without asking anyone to reinstall): when the app
// COLD-LAUNCHES in standalone display mode and the landing route is "/",
// redirect to "/home".
//
// Why this is safe + race-free:
//   - This gate mounts inside the persistent (tabs)/ layout, which mounts
//     exactly ONCE per cold launch and survives tab-to-tab navigation
//     (Next.js App Router preserves shared layouts). So useEffect([]) fires
//     once, at cold launch, with the LANDING pathname.
//   - Cached install cold launch → lands on "/" → redirect to "/home". ✓
//   - Fresh install cold launch → lands on "/home" → no redirect; the layout
//     never remounts, so a later Explore tab-tap does NOT re-trigger this. ✓
//   - Browser (non-standalone) visit to "/" → stays Explore (deep links +
//     normal web nav untouched). ✓
// The module-scope `launchHandled` flag is belt-and-suspenders against a
// StrictMode double-invoke in dev; production correctness rests on the
// once-per-cold-launch layout mount above.

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

let launchHandled = false;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    // iOS Safari legacy standalone flag (not in the matchMedia query).
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function StandaloneLaunchGate() {
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (launchHandled) return;
    launchHandled = true;
    if (!isStandalone()) return;
    // pathname here is the cold-launch landing route (effect runs once on
    // the persistent layout's first mount). Only the cached-install "/"
    // landing reaches the redirect; fresh "/home" launches no-op.
    if (pathname === "/") {
      router.replace("/home");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
