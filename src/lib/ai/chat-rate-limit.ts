// Per-account request-rate limiter for the chat API (issue #19).
//
// Distinct from the round-table cooldown in ./roundtable.ts: that one throttles
// the *team* feature (1 round-table/min); this one caps overall request volume
// to /api/conduit/chat to prevent a single account from hammering the model and
// spiking cost/load.
//
// Sliding window, in-memory Map — fine for single-region prod. Tighten to a
// Supabase/Redis-backed window if we go multi-region (the same trade-off noted
// for the round-table limiter).

/** Max chat requests allowed per account inside the rolling window. */
export const CHAT_RATE_LIMIT = 20;
/** Rolling window length in milliseconds. */
export const CHAT_RATE_WINDOW_MS = 60_000;

// accountId -> ascending timestamps (ms) of requests still inside the window.
const hits = new Map<string, number[]>();

export type RateLimitResult = {
  ok: boolean;
  /** Requests remaining in the current window (0 when blocked). */
  remaining: number;
  /** Seconds until the next slot frees up (0 when allowed). */
  retryInSeconds: number;
  /** Limit + window, echoed for response headers. */
  limit: number;
  windowSeconds: number;
};

/**
 * Record a request for `accountId` and report whether it's allowed.
 *
 * Sliding window: drops timestamps older than the window, then admits the
 * request only if fewer than CHAT_RATE_LIMIT remain. Internal accounts are
 * exempt — callers should skip this check for them (see the chat route).
 *
 * `now` is injectable for testing; defaults to the current time.
 */
export function checkChatRateLimit(
  accountId: string,
  now: number = Date.now(),
): RateLimitResult {
  const windowStart = now - CHAT_RATE_WINDOW_MS;
  const recent = (hits.get(accountId) ?? []).filter((t) => t > windowStart);

  if (recent.length >= CHAT_RATE_LIMIT) {
    // Oldest in-window hit determines when a slot frees up.
    const oldest = recent[0];
    hits.set(accountId, recent);
    return {
      ok: false,
      remaining: 0,
      retryInSeconds: Math.max(
        1,
        Math.ceil((oldest + CHAT_RATE_WINDOW_MS - now) / 1000),
      ),
      limit: CHAT_RATE_LIMIT,
      windowSeconds: CHAT_RATE_WINDOW_MS / 1000,
    };
  }

  recent.push(now);
  hits.set(accountId, recent);

  // Best-effort cleanup so the Map doesn't grow unbounded under churn.
  if (hits.size > 1000) {
    for (const [k, v] of hits.entries()) {
      const live = v.filter((t) => t > windowStart);
      if (live.length === 0) hits.delete(k);
      else hits.set(k, live);
    }
  }

  return {
    ok: true,
    remaining: CHAT_RATE_LIMIT - recent.length,
    retryInSeconds: 0,
    limit: CHAT_RATE_LIMIT,
    windowSeconds: CHAT_RATE_WINDOW_MS / 1000,
  };
}

/** Test/maintenance helper — clears all tracked accounts. */
export function _resetChatRateLimit(): void {
  hits.clear();
}
