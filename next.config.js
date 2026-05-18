const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Session 183 C3 — Next/Image remotePatterns for BoothHero photos
  // (F3 round 3 escalation per session 182 C2 commit body pre-scope).
  //
  // David's session 182 iPhone QA finding 3 on production v0.182.0:
  // "Takes about a second sometimes more to load the image, more than
  // just the flicker experienced on the explore page with the hero
  // image." C2 (useLayoutEffect + <link rel="preload"> document.head
  // .appendChild) got the preload into the high-priority slot but
  // doesn't reduce physical network time for Supabase-hosted images
  // (~500ms-1s cold fetch). Shape B round 3: Next/Image + Vercel Image
  // API + edge cache is the canonical fix per
  // feedback_kill_bug_class_after_3_patches ✅ Promoted (round 1 session
  // 171 `new Image().src` useEffect; round 2 session 182 useLayoutEffect
  // + W3C-canonical preload primitive; round 3 here = framework-native
  // primitive that auto-emits preload AND optimizes the asset itself).
  //
  // Vercel Image API at runtime:
  //   - Fetches origin (Supabase Storage public URL)
  //   - Re-encodes to AVIF/WebP (typically 50-80% smaller payload)
  //   - Resizes to device-appropriate width (per `sizes` prop hint)
  //   - Caches at Vercel edge (subsequent requests served instantly)
  //   - Emits <link rel="preload" imagesrcset="..."> in head for any
  //     <Image priority> in React tree (retires session 182 C2's
  //     manual useLayoutEffect preload primitive as dead code per
  //     feedback_dead_code_cleanup_as_byproduct ✅ Promoted).
  //
  // remotePatterns scope:
  //   - `*.supabase.co/storage/v1/object/public/**` — production
  //     vendor hero photos uploaded via /api/vendor-hero, served as
  //     public Supabase Storage URLs.
  //   - `picsum.photos/**` — fixture data for /shelf-v2-test +
  //     /home-hero-test + other smoke routes. Without this, Image
  //     renders throw runtime errors on smoke routes.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
  },

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
