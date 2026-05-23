// Render-time translation of raw worker / start-API error tokens into
// human-readable cinema copy. Pure, synchronous, recomputed on every render
// that needs it. DB rows are never mutated.
//
// Contract: specs/engineering-build-trust/contracts/error-translation.md

export type Recovery =
  | { kind: "none" }
  | { kind: "retry"; label: string; promptSeed?: string }
  | { kind: "continue-from"; label: string; parentSessionId: string }
  | { kind: "contact-support"; label: string }
  | { kind: "edit-env"; label: string; href: string };

export interface TranslatedError {
  headline: string;
  body: string;
  rawDetails?: string;
  recovery: Recovery;
}

export interface TranslateOptions {
  internalAccount: boolean;
}

export function translateBuildError(
  rawError: string | null | undefined,
  opts: TranslateOptions,
): TranslatedError {
  const raw = (rawError ?? "").trim();

  // M1 — empty / null
  if (!raw) {
    return {
      headline: "No error reported.",
      body: "",
      recovery: { kind: "none" },
    };
  }

  // M2 — worker_url_missing (any of the legacy / direct shapes)
  if (
    raw === "worker_url_missing" ||
    raw === "worker_start_worker_url_missing"
  ) {
    if (opts.internalAccount) {
      return {
        headline: "The build service isn't connected yet.",
        body: "Set ENGINEERING_WORKER_URL in your Vercel project's environment variables, then redeploy. The Railway worker URL (with or without https://) is what goes in the value.",
        rawDetails: raw,
        recovery: {
          kind: "edit-env",
          label: "Open Vercel project settings",
          href: "https://vercel.com/dashboard",
        },
      };
    }
    return {
      headline: "The build service isn't connected yet.",
      body: "Luis is on it — try again in a bit.",
      rawDetails: raw,
      recovery: { kind: "none" },
    };
  }

  // M3 — historical "Failed to parse URL" (pre-R2 fix)
  if (/^worker_start_(TypeError:\s*)?Failed to parse URL/i.test(raw)) {
    return {
      headline: "Earlier build couldn't reach the build service.",
      body: "This was a config issue that's been fixed. Start a fresh build and it should run.",
      rawDetails: raw,
      recovery: { kind: "retry", label: "Start a fresh build" },
    };
  }

  // M4 — network / timeout
  if (
    /^worker_start_(fetch_failed|abort|timeout|0)$/i.test(raw) ||
    /timeoutEr|ETIMEDOUT|ECONNREFUSED|ECONNRESET/i.test(raw)
  ) {
    return {
      headline: "The build service didn't respond.",
      body: "This is usually transient — give it a minute and try again.",
      rawDetails: raw,
      recovery: { kind: "retry", label: "Try again" },
    };
  }

  // M5 — worker 5xx
  if (
    /^worker_start_5\d\d/i.test(raw) ||
    /^worker_start_.*\b5\d\d\b/i.test(raw)
  ) {
    return {
      headline: "The build service hit an error starting your build.",
      body: "Engineering's worker reported a server-side failure. Try again — if it keeps happening, tell Luis.",
      rawDetails: raw,
      recovery: { kind: "retry", label: "Try again" },
    };
  }

  // M6 — worker 4xx
  if (
    /^worker_start_4\d\d/i.test(raw) ||
    /signature_invalid|hmac_failed|unauthorized/i.test(raw)
  ) {
    return {
      headline: "The build service rejected the start signal.",
      body: "This usually means the HMAC secret or session shape doesn't match. Try again; if it keeps happening, the worker may need a redeploy.",
      rawDetails: raw,
      recovery: { kind: "contact-support", label: "Tell Luis" },
    };
  }

  // M7 — user aborted
  if (raw === "user_aborted") {
    return {
      headline: "You stopped this build.",
      body: "No work was lost — the worker subprocess was killed cleanly.",
      rawDetails: raw,
      recovery: { kind: "retry", label: "Start over with the same prompt" },
    };
  }

  // M8 — daily cap exhausted
  if (/^rate_limited|^daily_cap_reached|^spend_cap_reached/i.test(raw)) {
    return {
      headline: "You hit today's build limit.",
      body: "Your plan caps daily builds — they reset tomorrow. Upgrade your tier for more headroom.",
      rawDetails: raw,
      recovery: {
        kind: "edit-env",
        label: "See plan options",
        href: "/app/settings/billing",
      },
    };
  }

  // M9 — recognized mid-build classes
  if (/build_content_error|syntax_error|typescript_error/i.test(raw)) {
    return {
      headline: "Engineering's generated code didn't build cleanly.",
      body: "The site was scaffolded but failed at the deploy stage. You can iterate from this build — Engineering will pick up where it left off.",
      rawDetails: raw,
      recovery: {
        kind: "continue-from",
        label: "Continue from this build",
        // parentSessionId substituted by caller
        parentSessionId: "",
      },
    };
  }

  // M10 — fallback (unrecognized)
  return {
    headline: "Engineering hit something unexpected.",
    body: "Not a known failure type. The technical details below may help if you share them with Luis.",
    rawDetails: raw,
    recovery: { kind: "retry", label: "Start over with the same prompt" },
  };
}

/**
 * Render-time provider-tell scrubbing. Applied to any worker-emitted strings
 * (raw log messages, rawDetails disclosure) before display. The DB row is
 * left untouched. Constitution Principle III.
 */
export function scrubProviderTells(s: string): string {
  return s.replace(
    /\b(claude|anthropic|openai|sonnet|opus|haiku|gpt[-_]?[\d.]*|elevenlabs|livekit)\b/gi,
    "[provider]",
  );
}
