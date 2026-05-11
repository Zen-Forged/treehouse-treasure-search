// lib/reviewMode.ts
//
// Internal Review Board substrate (session 150 Shape S, /review-board).
//
// When the active page is loaded with `?reviewMode=1`, data-layer reads
// short-circuit to canonical fixtures (lib/fixtures.ts) and client-side
// hooks return fixture state instead of localStorage/DB. Auth-gate
// page-level useEffect redirects also skip.
//
// Activation is per-iframe (each review-board tile carries the flag in
// its src URL). SSR returns false so server renders never accidentally
// fixture-substitute on the public Vercel preview — fixtures only ever
// surface in the client runtime inside an iframe whose URL carries the
// explicit ?reviewMode=1 flag.
//
// No NODE_ENV gating — devs need the review board on localhost AND on
// production deployments. Security posture is "unlinked URL + obscure
// flag," per frozen plan from session 149 close. The flag never reads
// or writes real shopper data (every short-circuit is read-only).

export function isReviewMode(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("reviewMode") === "1";
}
