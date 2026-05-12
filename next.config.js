const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // /shelves disposition (R10 Arc 4, session 108) — Booths tab retired
  // session 107, cross-mall booth management lives on /admin Vendors tab,
  // /shelves has no callsite. 301 preserves cached bookmarks + vendor
  // onboarding emails + admin deep-links. Destination retargets from /map
  // → / at session 155 because /map itself retires same session (below).
  //
  // /map disposition (session 155, design record D4) — /map page retires.
  // The map drawer is now a Home chrome affordance on <MallStrip>'s chevron
  // toggle, not a destination page. 301 preserves email templates, shared
  // URLs, browser bookmarks. No ?mall=<slug> param preservation (per Q1=a
  // lock) — direct deep-links to /map?mall=... lose the scope (acceptable
  // tradeoff; the strip + drawer let the user pick again in 2 taps).
  async redirects() {
    return [
      { source: "/shelves",        destination: "/", permanent: true },
      { source: "/shelves/:path*", destination: "/", permanent: true },
      { source: "/map",            destination: "/", permanent: true },
      { source: "/map/:path*",     destination: "/", permanent: true },
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
