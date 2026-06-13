// Allowed event names — kept in sync with /api/conduit/track allowlist.
export type AnalyticsEvent =
  | "page_view"
  | "signup_started"
  | "signup_completed"
  | "paywall_viewed"
  | "checkout_clicked"
  | "upgrade_initiated"
  | "upgrade_intent_clicked"
  | "downgrade_clicked"
  | "portal_opened"
  | "first_ai_message_sent"
  | "onboarding_completed";

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
}
