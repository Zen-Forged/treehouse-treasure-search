const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
