"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      // Route through our own domain to avoid ad-blocker drops.
      ui_host: "https://us.posthog.com",
      // We fire page_view through our own track() so conduit_analytics_events
      // and PostHog stay in sync.
      capture_pageview: false,
      capture_pageleave: false,
      // Autocapture off to prevent accidental PII capture from button text / inputs.
      autocapture: false,
      // Session replay off for v1 — enable later with explicit mask configuration.
      disable_session_recording: true,
      persistence: "localStorage+cookie",
    });
  }, []);

  return <>{children}</>;
}
