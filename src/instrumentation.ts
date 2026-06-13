import * as Sentry from "@sentry/nextjs";

// Next.js instrumentation hook — called once at server startup.
// Loads the Sentry SDK for the active runtime (Node.js or Edge).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Surface uncaught request errors to Sentry via Next.js 15+ onRequestError hook.
export const onRequestError = Sentry.captureRequestError;
