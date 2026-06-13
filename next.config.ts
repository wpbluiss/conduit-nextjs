import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  experimental: {
    // Console pages are `force-dynamic` (auth + per-account data), so the
    // client router cache is off by default in Next.js 15+. Setting a small
    // staleTimes.dynamic window restores the snappy "tab I just visited a
    // few seconds ago opens instantly" feel without making data stale enough
    // to mislead.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  sourcemaps: {
    filesToDeleteAfterUpload: [".next/static/**/*.map"],
  },
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: false,
  },
});
