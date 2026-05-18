const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // /shelves disposition (R10 Arc 4, session 108) — Booths tab retired
  // session 107, cross-mall booth management lives on /admin Vendors tab,
  // /shelves has no callsite. Permanent redirect preserves cached
  // bookmarks + vendor onboarding emails + admin deep-links.
  //
  // Destination history:
  //   - Session 108 (original): /shelves → /map (booth-cluster destination)
  //   - Session 155: /shelves → / (because /map itself was retiring same
  //     session — drawer-overlay pattern replaced /map as a page)
  //   - Session 179: /shelves → /map RESTORED (session 178 brought /map
  //     back as dedicated route + this commit retires the /map redirect
  //     blocker; original disposition becomes correct again).
  //
  // /map disposition history:
  //   - Session 109: /map retired the first time (3-tab nav redesign);
  //     no redirect carried because /map was new at that point.
  //   - Session 121: /map restored (R18 — Map nav back at slot 3).
  //   - Session 155: /map retired the second time. Permanent redirect
  //     to / added to preserve email templates / shared URLs / browser
  //     bookmarks while the drawer-overlay pattern took over.
  //   - Session 178 F2: /map RESTORED as dedicated route at
  //     app/(tabs)/map/page.tsx (Frame A bordered window + MallSheet
  //     picker + slide-up enter). The next.config redirect was NOT
  //     removed in session 178's ship — load-bearing operational miss
  //     that surfaced session 179 via David iPhone QA ("chip is not
  //     selectable"): chip onClick fires router.push("/map") → 308 →
  //     bounce to / → URL stays /.
  //   - Session 179 (this commit): /map + /map/:path* redirects RETIRED
  //     so router.push("/map") actually resolves the new app/(tabs)/map/
  //     page.tsx route. Surfaces explicit reversal of session 155's
  //     redirect-add per feedback_surface_locked_design_reversals ✅
  //     Promoted at the SUBSTRATE LAYER (config files / operational
  //     substrate, not visual chrome) — design reversals must reverse
  //     ALL the substrate the original retirement put in place,
  //     including next.config + middleware + redirect entries.
  //
  // NEW Tech Rule candidate (single firing; promotes on 2nd firing per
  // feedback_tech_rule_promotion_destination ✅ Promoted): "Cross-session
  // feature restoration must retire prior-session retirement redirects
  // in same commit as feature ship — grep next.config + middleware
  // before declaring an R-session implementation arc complete." Generalizes
  // beyond Treehouse to any project with HTTP-level redirect/rewrite
  // config that mirrors application routing.
  //
  // PWA cache consideration: 308 redirects ARE browser-cached aggressively;
  // post-deploy users who hit /map between session 155 and session 179
  // (window was small — chip was the only path + chip was broken since
  // session 178 ship) likely have minimal cached redirect responses. Next.js
  // App Router client-side router.push does RSC fetch (not full navigation),
  // so server-side redirect retire takes effect on next deploy without
  // browser-cache invalidation. If iPhone QA after this ship still shows
  // chip → / bounce, full PWA reset (delete from home screen, re-add via
  // Safari) clears any service-worker-cached redirect responses.
  async redirects() {
    return [
      { source: "/shelves",        destination: "/map", permanent: true },
      { source: "/shelves/:path*", destination: "/map", permanent: true },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: "zen-forged",
  project: "javascript-nextjs",

  // Only print logs for source-map upload in CI
  silent: !process.env.CI,

  // Wider source-map upload for prettier stack traces (slightly slower builds)
  widenClientFileUpload: true,

  // Route browser → Sentry through /monitoring to bypass ad-blockers
  tunnelRoute: "/monitoring",

  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
