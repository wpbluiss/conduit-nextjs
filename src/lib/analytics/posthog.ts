"use client";

import posthog from "posthog-js";

let initialized = false;

export function initPostHog(): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || initialized || typeof window === "undefined") return;
  posthog.init(key, {
    api_host: "https://us.i.posthog.com",
    capture_pageview: false,     // manual — fired by PostHogProvider on route change
    capture_pageleave: false,
    autocapture: false,           // opt-in only; prevents accidental PII from click text
    session_recording: { maskAllInputs: true },
    disable_session_recording: true,
    loaded: () => { initialized = true; },
  });
}

export function phCapture(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.capture(event, properties);
}

export function phIdentify(userId: string): void {
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  // Pass the Supabase UUID as the distinct_id — it is opaque and contains no PII.
  posthog.identify(userId);
}

export function phReset(): void {
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.reset();
}
