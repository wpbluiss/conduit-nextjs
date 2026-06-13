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
  | "portal_opened";

export function track(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>,
): void {
  const path =
    typeof window !== "undefined" ? window.location.pathname : undefined;

  // Internal analytics — always fires (Supabase storage, no external dependency).
  fetch("/api/conduit/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event, path, properties }),
  }).catch(() => {
    // fire-and-forget — never surfaces errors to the user
  });

  // PostHog — additive, no-op when not initialised or key absent.
  if (typeof window !== "undefined") {
    try {
      // posthog-js exports a lazy singleton: capture() is safe to call before
      // init() (events are queued) and when the key is absent (events are dropped).
      import("posthog-js").then(({ default: posthog }) => {
        posthog.capture(event, { path, ...properties });
      }).catch(() => {
        // ignore — PostHog unavailable is not a hard failure
      });
    } catch {
      // ignore
    }
  }
}
