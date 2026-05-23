# Contract — Error Translation

**File**: `src/lib/engineering/error-translation.ts`
**Spec FRs**: FR-020, FR-021, FR-022, FR-023, FR-024
**Consumers**: cinema shipped summary, in-flight strip failure state, `/app/builds` index row preview, `PraxisTeamRoster` Engineering card failure state.

---

## 1. Signature

```ts
export interface TranslatedError {
  headline: string;
  body: string;
  rawDetails?: string;       // always populated; UI may show via [Show details] disclosure
  recovery: Recovery;
}

export type Recovery =
  | { kind: 'none' }
  | { kind: 'retry'; label: string; promptSeed?: string }
  | { kind: 'continue-from'; label: string; parentSessionId: string }
  | { kind: 'contact-support'; label: string }
  | { kind: 'edit-env'; label: string; href: string };       // operator-only (internalAccount = true)

export interface TranslateOptions {
  internalAccount: boolean;
}

export function translateBuildError(
  rawError: string | null | undefined,
  opts: TranslateOptions,
): TranslatedError;
```

Pure, synchronous. Recomputed on every render that needs it.

---

## 2. Token-priority matchers

First match wins. All matchers operate on the rawError string after
trimming and case-insensitive comparison where noted.

### M1 — Empty / null

```
rawError = null | '' | whitespace
```

Returns:
```ts
{
  headline: "No error reported.",
  body: "",
  recovery: { kind: 'none' },
}
```

(Only reachable when a terminal status row has no error message — practically
"complete" or "aborted-without-message"; this case is here for completeness.)

### M2 — `worker_url_missing`

```
rawError === 'worker_url_missing'
OR rawError === 'worker_start_worker_url_missing'    (legacy doubly-prefixed)
```

Operator response (internalAccount = true):
```ts
{
  headline: "The build service isn't connected yet.",
  body: "Set ENGINEERING_WORKER_URL in your Vercel project's environment variables, then redeploy. The Railway worker URL (without https://) is what goes in the value — the code prepends the scheme.",
  rawDetails: rawError,
  recovery: {
    kind: 'edit-env',
    label: 'Open Vercel project settings',
    href: 'https://vercel.com/dashboard',     // generic; per-project URL would require a config lookup
  },
}
```

Non-operator response (internalAccount = false):
```ts
{
  headline: "The build service isn't connected yet.",
  body: "Luis is on it — try again in a bit.",
  rawDetails: rawError,
  recovery: { kind: 'none' },
}
```

### M3 — Historical "Failed to parse URL"

```
/^worker_start_(TypeError: )?Failed to parse URL/i.test(rawError)
```

Returns:
```ts
{
  headline: "Earlier build couldn't reach the build service.",
  body: "This was a config issue that's been fixed. Start a fresh build and it should run.",
  rawDetails: rawError,
  recovery: { kind: 'retry', label: 'Start a fresh build' },
}
```

(Covers the legacy rows the user described seeing.)

### M4 — Network / timeout

```
/^worker_start_(fetch_failed|abort|timeout|0)$/i.test(rawError)
OR /timeoutEr|ETIMEDOUT|ECONNREFUSED|ECONNRESET/i.test(rawError)
```

Returns:
```ts
{
  headline: "The build service didn't respond.",
  body: "This is usually transient — give it a minute and try again.",
  rawDetails: rawError,
  recovery: { kind: 'retry', label: 'Try again' },
}
```

### M5 — Worker 5xx

```
/^worker_start_5\d\d/i.test(rawError)
OR /^worker_start_.*\b5\d\d\b/i.test(rawError)
```

Returns:
```ts
{
  headline: "The build service hit an error starting your build.",
  body: "Engineering's worker reported a server-side failure. Try again — if it keeps happening, tell Luis.",
  rawDetails: rawError,
  recovery: { kind: 'retry', label: 'Try again' },
}
```

### M6 — Worker 4xx

```
/^worker_start_4\d\d/i.test(rawError)
OR /signature_invalid|hmac_failed|unauthorized/i.test(rawError)
```

Returns:
```ts
{
  headline: "The build service rejected the start signal.",
  body: "This usually means the HMAC secret or session shape doesn't match. Try again; if it keeps happening, the worker may need a redeploy.",
  rawDetails: rawError,
  recovery: { kind: 'contact-support', label: 'Tell Luis' },
}
```

### M7 — User aborted

```
rawError === 'user_aborted'
```

Returns:
```ts
{
  headline: "You stopped this build.",
  body: "No work was lost — the worker subprocess was killed cleanly.",
  rawDetails: rawError,
  recovery: { kind: 'retry', label: 'Start over with the same prompt', promptSeed: <session.prompt> },
}
```

Note: `promptSeed` is set by the *caller*, not the matcher (the matcher
doesn't have session context). The cinema's shipped-summary wires
`session.prompt` into the seed before passing to the recovery affordance.

### M8 — Daily cap exhausted

```
/^rate_limited|^daily_cap_reached|^spend_cap_reached/i.test(rawError)
```

Returns:
```ts
{
  headline: "You hit today's build limit.",
  body: "Your plan caps daily builds — they reset tomorrow. Upgrade your tier for more headroom.",
  rawDetails: rawError,
  recovery: { kind: 'edit-env', label: 'See plan options', href: '/app/settings/billing' },
}
```

(Reuses `edit-env` Recovery kind because the affordance is the same shape:
labeled link out. Could refactor to a distinct `link-out` kind in P2 if it
sprawls.)

### M9 — Recognized mid-build classes

```
/build_content_error|syntax_error|typescript_error/i.test(rawError)
```

Returns:
```ts
{
  headline: "Engineering's generated code didn't build cleanly.",
  body: "The site was scaffolded but failed at the deploy stage. You can iterate from this build — Engineering will pick up where it left off.",
  rawDetails: rawError,
  recovery: { kind: 'continue-from', label: 'Continue from this build', parentSessionId: <session.id> },
}
```

`parentSessionId` is also caller-wired (matcher doesn't have session id directly).

### M10 — Fallback (unrecognized)

Returns:
```ts
{
  headline: "Engineering hit something unexpected.",
  body: "Not a known failure type. The technical details below may help if you share them with Luis.",
  rawDetails: rawError,
  recovery: { kind: 'retry', label: 'Start over with the same prompt', promptSeed: <session.prompt> },
}
```

---

## 3. Provider-tell scrubbing (FR-030)

`rawDetails` IS shown to the user via a `[Show details]` disclosure. Before
display, the cinema applies the same scrubbing the raw-log panel uses:

```ts
function scrubProviderTells(s: string): string {
  return s.replace(
    /\b(claude|anthropic|openai|sonnet|opus|haiku|gpt[-_]?[\d.]*|elevenlabs|livekit)\b/gi,
    '[provider]',
  );
}
```

Applied in the consumer, not the matcher. The matcher returns the raw token
verbatim; the consumer (cinema, strip, etc.) applies scrubbing at render time.

---

## 4. Caller responsibilities

When the matcher returns Recovery with `promptSeed` or `parentSessionId`
placeholders (M7, M9, M10), the caller (cinema, strip, row preview) is
responsible for substituting the actual values BEFORE rendering. The matcher
signature accepts `rawError + options`, NOT session context — keeping the
matcher dependency-free and easily testable.

```ts
// In BuildShippedSummary.tsx
const translated = translateBuildError(session.error_message, { internalAccount });
const recovery = translated.recovery.kind === 'retry'
  ? { ...translated.recovery, promptSeed: translated.recovery.promptSeed ?? session.prompt }
  : translated.recovery.kind === 'continue-from'
  ? { ...translated.recovery, parentSessionId: session.id }
  : translated.recovery;
```

---

## 5. Verification

For each matcher (M1–M10):
- Construct a synthetic `rawError` string matching the trigger.
- Call `translateBuildError(rawError, { internalAccount: true })` and `{ internalAccount: false }`.
- Assert `headline`, `body`, `recovery.kind` match this contract.
- Verify in the cinema by manually injecting test rows (via Supabase MCP `execute_sql` if needed) and visiting `/app/builds/<id>`.

For provider-tell scrubbing:
- Inject `rawError = "worker_start_claude API call failed"`.
- Verify the cinema's `[Show details]` disclosure shows `worker_start_[provider] API call failed`.
- Verify the DB row in `conduit_engineering_sessions.error_message` retains the original verbatim.
