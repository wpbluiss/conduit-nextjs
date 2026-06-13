// Allowed event names — kept in sync with /api/conduit/track allowlist.
export type AnalyticsEvent =
  | "page_view"
  | "signup_started"
  | "signup_completed"
  | "first_ai_message_sent"
  | "paywall_viewed"
  | "checkout_clicked"
  | "upgrade_initiated"
  | "upgrade_intent_clicked"
  | "downgrade_clicked"
  | "portal_opened"
  | "onboarding_completed";

export function track(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>,
): void {
  // Internal Supabase store (fire-and-forget)
  fetch("/api/conduit/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      event,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      properties,
    }),
  }).catch(() => {
    // never surfaces errors to the user
  });

  // PostHog client-side capture (only when SDK is initialised via PostHogProvider)
  if (typeof window !== "undefined") {
    import("posthog-js")
      .then(({ default: posthog }) => {
        posthog.capture(event, properties);
      })
      .catch(() => {
        // PostHog absent or uninitialised — silent no-op
      });
  }
}
