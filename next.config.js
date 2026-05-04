const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // R10 Arc 4 (session 108) — /shelves disposition. The Booths tab retired
  // session 107 + cross-mall booth management lives on /admin Vendors tab
  // already; /shelves no longer has a callsite. 301 redirects preserve any
  // cached browser bookmarks, vendor onboarding emails, or admin deep-links
  // that were minted before the tab retired. Reversible — removing the
  // redirect block restores /shelves wholesale.
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
