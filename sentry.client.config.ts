import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Sample 10% of requests for performance tracing (free-tier safe).
  tracesSampleRate: 0.1,

  // Capture replay on errors for visual debugging.
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.01,

  debug: false,
});
