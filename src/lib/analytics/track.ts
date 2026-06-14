// Allowed event names — kept in sync with /api/conduit/track allowlist.
export type AnalyticsEvent =
  | "page_view"
  | "signup_started"
  | "signup_completed"
  | "onboarding_completed"
  | "first_ai_message_sent"
  | "paywall_viewed"
  | "checkout_clicked"
  | "upgrade_initiated"
  | "downgrade_clicked"
  | "portal_opened"
  | "upgrade_intent_clicked";

export function track(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>,
): void {
  fetch("/api/conduit/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      event,
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      properties,
    }),
  }).catch(() => {
    // fire-and-forget — never surfaces errors to the user
  });

  // Mirror to PostHog if configured — import is dynamic to keep server bundles clean.
  if (typeof window !== "undefined") {
    import("@/lib/analytics/posthog")
      .then(({ phCapture }) => phCapture(event, properties))
      .catch(() => {});
  }
}
