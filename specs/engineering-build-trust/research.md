# Phase 0 Research — Engineering Build Trust

**Feature**: engineering-build-trust
**Date**: 2026-05-23
**Status**: Phase 0 complete

Ten decisions (R-001 … R-010) consulted at plan time. Each names what was
investigated, what was decided, and what was explicitly rejected.

---

## R-001 — Cinema URL shape

**Question**: Where does the live build view live so refresh, share, and back-button never lose it?

**Investigation**:
- Existing pattern in `/app/builds/page.tsx` + `BuildsTabs.tsx`: a query param (`?session=<id>`) drives a modal-overlay mount of `BuildSession`. Modal state is `useState<string | null>`. Refresh restores it via `useSearchParams` (`BuildsTabs.tsx:74-95`).
- Existing pattern in `EngineeringBuildButton.tsx:44`: `useState<string | null>(null)` — no URL persistence at all. The build view exists only while the button's React tree is mounted.
- Next.js 16 dynamic-segment convention: `[session]` folder with `page.tsx`; `params` is a Promise (`await ctx.params`). Confirmed in `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md` and already the established pattern in `src/app/api/engineering/session/[id]/route.ts:14-15`.

**Decision**: New dynamic route at `src/app/app/builds/[session]/page.tsx`.
The cinema is a real URL — the App Router owns it, not an in-memory React
modal. The existing `?session=<id>` query is preserved with a server-side
redirect to the dynamic URL so any bookmarks survive.

**Locked by**: User GATE 1 override (2026-05-23).

**Rejected**: Keeping the modal pattern and adding more URL persistence to it
— rejected because the modal is structurally fragile (5 failure surfaces named
in spec §B). A real route eliminates four of those five at a stroke.

---

## R-002 — Realtime channel-status awareness

**Question**: How does the client know when the realtime channel has dropped, so it can surface a "reconnecting" indicator and reconcile state?

**Investigation**:
- `BuildSession.tsx:103-135` currently calls `.subscribe()` and discards the status callback. The callback receives `'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED'` plus an optional error. Supabase JS v2 `RealtimeChannel.subscribe` API documented in `@supabase/supabase-js@2.105.3` types: the second argument is `(status: REALTIME_SUBSCRIBE_STATES, err?: Error) => void`.
- Browser network condition simulation: DevTools "Offline" + "Slow 3G" forces `CHANNEL_ERROR` within ~6 s. `TIMED_OUT` fires after the channel-level timeout (default 10 s on the Supabase client).
- Reconnect: Supabase JS auto-reconnects with exponential backoff; the channel-status callback fires `SUBSCRIBED` again on success.

**Decision**: `useBuildSubscription` hook wraps the existing subscription pattern and adds an explicit `status` state machine: `idle → subscribing → live → degraded → reconnecting → live`. The cinema and the in-flight strip both consume this state. On `degraded` or `reconnecting`, the UI surfaces a `ReconnectingPip`. On return to `live`, the hook triggers a one-shot `/api/engineering/session/<id>` refetch to reconcile any events missed during the gap; the reconciliation pass dedupes by log `id`.

**Rejected**: Polling-only mode. Would burn server budget for the 99% case where realtime is healthy; existing pattern already uses realtime, no reason to throw it away.

**Rejected**: Hiding the degraded state entirely (the existing behavior). Spec FR-008 forbids it; user explicitly cited "silent" as the failure mode.

---

## R-003 — Stuck-detection threshold and treatment

**Question**: When does the UI declare a build "stuck"?

**Investigation**:
- The worker emits logs at irregular cadence — clusters of `WRITE`/`EDIT` lines during scaffolding, multi-second gaps during Claude API calls. Reviewing six recent builds (via the `/app/builds` index + `conduit_engineering_logs` join), max observed gap during a healthy build is ~25 s.
- Worker timeouts: Claude API gate ~60 s per call; Vercel deploy ~90 s; total session timeout ~30 min (worker-side, not enforced by Next.js).
- A 90 s no-log threshold gives the worker ~3× the observed healthy max while still surfacing genuine stalls within a meaningful window. Less is too jittery; more is too forgiving.

**Decision**: `useBuildHeartbeat` hook tracks the timestamp of the most-recent
log INSERT and the most-recent session UPDATE. If `status ∈ {pending, running,
deploying}` AND `now - max(lastLogTs, lastStatusTs) ≥ 90s`, transition the UI
to `investigating` state. The state is sticky — once tripped, it requires a
manual "Refresh now" click (which re-fetches from `/api/engineering/session/<id>`)
or a new log/status arrival to clear.

**Rejected**: Server-side stuck detection. Would require a worker change or a
new cron — both out of scope per Spec Assumption 2.

**Rejected**: Distinguishing `investigating` from `failed`. They are visually
distinct (FR-010) but functionally `investigating` is reversible while `failed`
is terminal. Conflating them would lose recovery affordance.

---

## R-004 — Live preview iframe sandboxing + fallback

**Question**: How do we render a Vercel preview iframe inline without security regressions or breaking the cinema when X-Frame-Options blocks it?

**Investigation**:
- Vercel preview deploys typically do NOT set `X-Frame-Options: DENY` on default `*.vercel.app` URLs. Spot-check of three recent Engineering deploys (via `curl -I`) confirms: no XFO header, `Content-Security-Policy: frame-ancestors *` present on the Vercel root.
- For custom-domain deploys or sites whose generated code sets XFO/CSP, the iframe will refuse to render. Detection: `iframe.onerror` fires on hard refusal; for "loads but blocks rendering" cases (CSP `frame-ancestors`), the iframe's `contentDocument` access throws when same-origin checks block it. The detection pattern: set a `load` event with a 2 s timeout; if neither `load` nor `error` fires (or `load` fires but `contentDocument` is `null`), declare blocked.
- Sandboxing: `sandbox="allow-scripts allow-same-origin"` is sufficient for the cinema's "watch the site render itself" goal. `allow-forms`/`allow-popups`/`allow-top-navigation` are intentionally excluded — preventing the embedded site from doing anything destructive to the parent.

**Decision**: `usePreviewIframe` hook owns the iframe lifecycle. Renders the
iframe with `sandbox="allow-scripts allow-same-origin"` and `referrerPolicy="no-referrer"`.
A 3 s timer (FR-006/SC-010) gates the "loaded vs. blocked" detection. On block:
the iframe DOM is replaced with a placeholder card showing the URL + "Open in
new tab" affordance. The 3 s timer also gates a generic loading shimmer so
slow-but-fine deploys don't flash a "blocked" message prematurely.

**Rejected**: Server-side screenshot via Vercel API or third-party rendering
service. Adds a dependency (Spec Assumption 5 forbids) and a privacy concern
(routing the user's site through an external service). The "Open in new tab"
fallback covers the blocked case at acceptable cost.

**Rejected**: Reducing sandbox to nothing (full freedom). Increases attack
surface for build-content security issues — out of scope to harden, so
sandbox stays restrictive.

---

## R-005 — Error-translation function design

**Question**: How does the same translation logic work consistently across the cinema, the in-flight strip, the `/app/builds` index, and the team-card affordance?

**Investigation**:
- Failure causes observed (from recent rows + code paths):
  - `worker_url_missing` — env var unset (already handled in worker.ts:33; user-facing today: "build worker isn't reachable").
  - `worker_start_Failed to parse URL from ...` — historical, pre-R2 fix (worker.ts:64-68 catch).
  - `worker_start_fetch_failed` — generic fetch catch (no `err instanceof Error`).
  - `worker_start_<240-char body>` — non-2xx response from worker (worker.ts:62-63).
  - `worker_start_<numeric status>` — non-2xx with empty body.
  - `user_aborted` — set by `/api/engineering/session/<id>/abort/route.ts`.
  - Mid-build errors: anything the worker writes after `status = running` (Claude rate limit class, deploy quota, build-content syntax errors — exact strings depend on worker emissions).
- The function needs to return `{ headline, body, recovery: { kind, label, href? } }`.
  - `kind ∈ {none, retry, continue-from, contact-support, edit-env}`
- Operator vs. non-operator gating: `internal_account = true` reveals env-edit hints.

**Decision**: `src/lib/engineering/error-translation.ts` exports `translateBuildError(rawError: string | null, { internalAccount }: { internalAccount: boolean }): TranslatedError`.

Token matchers in priority order:
1. `null | ''` → no error (terminal state with no error message is "complete" or "aborted").
2. `worker_url_missing` → headline "The build service isn't connected yet." Body for operator: "Set `ENGINEERING_WORKER_URL` in your Vercel project's environment variables." Body for non-operator: "Luis is on it." Recovery for operator: `{ kind: "edit-env", label: "Open Vercel settings", href: "https://vercel.com/dashboard" }` (literal external link is acceptable here because it's an operator escape hatch, not a marketing/console surface — Principle III scoped to AI-product surfaces).
3. `^worker_start_Failed to parse URL` → historical pre-R2. Headline "Earlier build couldn't reach the build service (config issue, now fixed)." Recovery: `{ kind: "retry", label: "Start a fresh build" }`.
4. `^worker_start_fetch_failed` OR `^worker_start_0$` → network/timeout. Headline "The build service didn't respond." Recovery: `{ kind: "retry", label: "Try again" }`.
5. `^worker_start_5\d\d` → worker accepted but errored. Headline "The build service hit an error starting your build." Recovery: `{ kind: "retry", label: "Try again" }`.
6. `^worker_start_4\d\d` → worker rejected (HMAC, malformed, etc). Headline "The build service rejected the start signal." Recovery: `{ kind: "contact-support", label: "Tell Luis" }`.
7. `user_aborted` → headline "You stopped this build." Recovery: `{ kind: "retry", label: "Start over" }`.
8. Fallback → headline "Engineering hit something unexpected." Body: technical-details disclosure with original `rawError`. Recovery: `{ kind: "retry", label: "Start over with the same prompt" }`.

The function is pure, synchronous, and consumed identically by every surface.

**Rejected**: Storing translated text in a separate DB column. Adds schema change (Principle II + Spec Assumption 1) for ephemeral copy.

**Rejected**: One bespoke translator per surface. Duplication risk and dignity-drift across surfaces. One source of truth.

---

## R-006 — Step taxonomy ground truth

**Question**: What plain-English step labels does the cinema show, and how are they derived from worker emissions?

**Investigation**:
- Direct grep of `BuildSession.tsx:144-156` and `conduit_engineering_logs` rows from recent builds reveals two main system-log shapes today: `WRITE <path>` and `EDIT <path>`. The session `status` column transitions through `pending → running → deploying → complete`.
- The worker repo is out of scope (Spec Assumption 2). The richer phase signals (e.g. "Cloning template", "Running npm install", "Pushing to GitHub", "Triggering Vercel deploy") may or may not be emitted as explicit log lines today — direct inspection in Phase A2 is the verification step.
- The pinned defaults must NOT invent phases the user can see but that aren't actually emitted (Constitution Principle 0).

**Decision**: `src/lib/engineering/step-taxonomy.ts` exports
`deriveStep(session: SessionRow, recentLogs: LogRow[]): { label: string; eyebrow: string; index?: number; total?: number }`.

Pinned default rules (priority order, first match wins):
1. `session.status === 'pending'` → label "Queued", eyebrow "WAITING FOR ENGINEERING".
2. `session.status === 'deploying'` → label "Deploying", eyebrow "PUSHING TO VERCEL".
3. `session.status === 'complete'` → label "Shipped", eyebrow "LIVE".
4. `session.status === 'failed'` → label "Failed", eyebrow "DID NOT SHIP".
5. `session.status === 'timeout'` → label "Timed out", eyebrow "TOOK TOO LONG".
6. `session.status === 'aborted'` → label "Stopped", eyebrow "YOU STOPPED THE BUILD".
7. `session.status === 'running'` AND most-recent system log `^WRITE` → label "Writing", eyebrow "BUILDING THE PROJECT", file `<path>` rendered in craft strip.
8. `session.status === 'running'` AND most-recent system log `^EDIT` → label "Refining", eyebrow "REFINING THE PROJECT", file `<path>` rendered.
9. `session.status === 'running'` AND no WRITE/EDIT yet → label "Scaffolding", eyebrow "SETTING UP".
10. `session.status === 'running'` AND deploy_url null but logs show `vercel` / `deploy` / `npm` / `install` keywords → label override map (defined in code), e.g. log containing `\binstall\b` → "Installing dependencies"; log containing `\bvercel\b` → "Pushing to Vercel". This is a heuristic layer; phase A2 verification refines if needed.

The function is pure and synchronous. `index` and `total` (e.g. "step 3 of 7") are deliberately optional — only populated when the heuristic layer can name a real step in a real series. If we can't ground a number in actual worker emissions, we don't make one up.

**Rejected**: Hard-coding a 7-step sequence with phase progress bar. Without
worker-side signaling, the bar would be a lie. Phase A2 verification may
unlock this as a future enhancement; until then, no fake progress.

**Rejected**: A "phase" column on `conduit_engineering_sessions`. Schema
change (Principle II); worker change (Spec Assumption 2). Both out of scope.

---

## R-007 — In-flight tile placement on `/app/workspace`

**Question**: Where on the dashboard does the in-flight strip go?

**Investigation**:
- Existing dashboard composition (verified in `src/app/app/workspace/page.tsx:143-336` and R15's `PraxisLiveStrip` pattern):
  ```
  PraxisLiveStrip (voice-only, conditional, top)
  PraxisWelcomeHero
  KPI tile row (4-up)
  Team roster
  ```
- Placement options considered:
  - **Above PraxisWelcomeHero, mirroring PraxisLiveStrip** — visually consistent with the established "above-the-hero strip" pattern for active sessions. Builds and voice are conceptually similar (something is happening right now).
  - **Replace one of the 4 KPI tiles** — breaks the operational-tile semantics; KPI tiles are summary statistics, an in-flight build is a live process.
  - **New "Currently building" cluster between KPI row and team roster** — pushes the team roster down; the team is what Luis already lands on the dashboard to see.
  - **Inline on the team roster's Engineering card** — already present (the "1 build in flight" copy via `PraxisTeamRoster.tsx:236-237`) but not loud enough on its own per the spec; we keep this as a *secondary* affordance.

**Decision**: Above `PraxisWelcomeHero`, mirroring `PraxisLiveStrip`. Coexists
with `PraxisLiveStrip` when both voice + build are active (voice strip first,
build strip second — voice is generally more time-sensitive). When only the
build is active, the build strip sits in the position the voice strip would.

**Locked by**: User GATE 1 override ("top").

**Rejected**: All other placements as named above.

---

## R-008 — View Transitions API for cinema mount

**Question**: When navigating from the dashboard strip or the team-card affordance to the cinema, should we use the View Transitions API for a continuous-motion handoff?

**Investigation**:
- R15 plan (`specs/praxis-console-premium-redesign/plan.md`) considered View Transitions in R-001 and **explicitly rejected enabling `experimental.viewTransition` in `next.config.ts`**, instead allowing optional inline use via `document.startViewTransition()` for the team-card click handler. That decision sits in the redesign's `useReducedMotion`-gated motion vocabulary.
- For this plan: the cinema mount is a route transition, not an intra-page swap. Browser-native page transitions don't yet smoothly cross route boundaries in the App Router without the experimental flag.

**Decision**: NO View Transitions API for the route transition into the
cinema. The cinema mounts via the App Router's default behavior with our
own CSS-only entrance animation: the stage band fades + translates 12 px up
(280 ms ease-out) on mount; the craft strip slides in 60 ms later; the
preview stage placeholder fades in 120 ms later. Cohesive without
framework-experimental risk.

**Rejected**: Enabling `experimental.viewTransition`. Adds framework risk for
a single animation moment.

---

## R-009 — Aesthetic direction

**Question**: What is the cinema's aesthetic identity, per the frontend-design skill?

**Investigation**: Multiple aesthetic options sketched (described conceptually, not coded):
1. **"Atelier"** — refined, gallery-like. White cards on dark canvas. Heavy typography hierarchy. Rejected because the redesign's dark canvas + dept tinting is the established Praxis identity; a switch to gallery-light would be a brand-axis fight, not an aesthetic.
2. **"Forge"** — industrial, raw, sparks-and-metal. Mostly rejected because the brand purple + jewel-tone palette doesn't carry that feeling without forcing an exception to the Praxis tokens.
3. **"Construction site"** — present-tense, things-are-being-made. Honors the actual work (the worker is in fact constructing a site). Lives naturally in the existing Praxis token system with engineering dept tint (rust/orange) as the dominant accent. **PICKED.**
4. **"Newsroom ticker"** — live feed + chyron. Rejected because the existing terminal log is already a kind of ticker, and the user said the terminal log is what they don't want as the primary surface.
5. **"Theater"** — letterboxed iframe, dimmed canvas. Strong moment but doesn't accommodate the parallel info streams (step + files + spend) without compromise.

**Decision**: Construction Site (option 3). The "one memorable moment" is the
iframe materializing — a curtain-rise reveal when `deploy_url` first arrives.
Everything else exists in service of that moment. Detailed in `plan.md`
§Aesthetic Direction.

**Rejected**: All other concepts as named.

---

## R-010 — Reduced-motion strategy

**Question**: How do we honor `prefers-reduced-motion: reduce` across the cinema's motion vocabulary?

**Investigation**:
- R15 ships `src/hooks/useReducedMotion.ts` — a `matchMedia('(prefers-reduced-motion: reduce)')` hook with live-update.
- R15's motion treatment substitutes transform/opacity animations with instant or opacity-only transitions when reduced motion is active.
- All cinema animations enumerated in `plan.md` §Aesthetic Direction:
  - Step transition (280 ms): → instant when reduced.
  - File chip enter (180 ms): → instant when reduced.
  - Spark bar sweep (280 ms): → omitted when reduced (decorative).
  - Most-recent chip pulse (600 ms infinite): → omitted when reduced.
  - Iframe curtain rise (480 ms): → 120 ms opacity-only fade when reduced.
  - Ambient strip pulse (2.4 s infinite): → static accent color when reduced.
  - Celebration (1.8 s one-time): → 120 ms opacity-only when reduced.

**Decision**: Consume `useReducedMotion` at the cinema and in-flight-strip
component level; gate each CSS class via a `data-reduced-motion="true"`
attribute on the root cinema element. The CSS sheet (`engineering-cinema.css`)
defines the `[data-reduced-motion="true"]` overrides at the same selector
specificity as the regular animations.

**Rejected**: Per-component conditional rendering of motion JSX. CSS-only
gating is simpler and matches the R15 pattern.
