# Phase 1 Data Model — Engineering Build Trust

**Feature**: engineering-build-trust
**Date**: 2026-05-23
**Status**: Phase 1 complete

This document describes the entities — both DB-backed and code-derived — that
the cinema, in-flight strip, and resilience layer consume. **Zero schema
changes** are introduced by this feature (Constitution Principle II preserved;
Spec Assumption 1 held).

---

## 1. DB-backed entities (existing, unchanged)

### 1.1 `conduit_engineering_sessions`

Existing table. Migrations: `018_engineering.sql`, `019_engineering_v2.sql`.

Columns this feature reads:
- `id uuid` — session primary key. URL-bearing in the cinema (`/app/builds/<id>`).
- `account_id uuid` — RLS scope.
- `conversation_id uuid | null` — surfaces a "Open the chat" link in the shipped summary when set.
- `prompt text` — rendered in the cinema header.
- `build_type text | null` — eyebrow tag in the cinema header ("LANDING PAGE", "WEB APP", etc.).
- `status text` — enum `{pending, running, deploying, complete, failed, timeout, aborted}`. Drives the step taxonomy and the in-flight derived view.
- `deploy_url text | null` — when set, the preview iframe materializes.
- `github_repo text | null` — surfaced in the shipped summary as a secondary link.
- `total_input_tokens int` + `total_output_tokens int` — rendered as running counts in the cinema stage band; final on shipped.
- `error_message text | null` — input to `translateBuildError()`.
- `started_at timestamptz | null` — elapsed calculation base.
- `completed_at timestamptz | null` — elapsed freeze when terminal.
- `created_at timestamptz` — ordering, "started X ago" in the in-flight strip.
- `parent_session_id uuid | null` — surfaces a "Continuation of <prompt>" affordance in the cinema header.

Columns this feature does NOT touch: `worker_session_id` (worker-internal),
`archived_at` (not present today — would be a separate spec).

### 1.2 `conduit_engineering_logs`

Existing table. Migration `018_engineering.sql`.

Columns this feature reads:
- `id uuid` — dedupe key during realtime reconciliation.
- `session_id uuid` — RLS scope (joined to session).
- `ts timestamptz` — heartbeat input, log-row ordering.
- `level text` — enum `{info, stdout, stderr, system}`. Drives color in the raw-log panel; system logs are parsed for file events.
- `message text` — both the raw-log rendering and the file-event regex match.

### 1.3 Realtime publication

`ALTER PUBLICATION supabase_realtime ADD TABLE conduit_engineering_logs` and
the equivalent for `conduit_engineering_sessions` are in place from migration
018:62-65. The cinema's `useBuildSubscription` consumes:
- `postgres_changes` INSERT on `conduit_engineering_logs` filtered by `session_id=eq.<id>`.
- `postgres_changes` UPDATE on `conduit_engineering_sessions` filtered by `id=eq.<id>`.

The in-flight strip's `useInFlightBuilds` consumes:
- `postgres_changes` UPDATE on `conduit_engineering_sessions` filtered by `account_id=eq.<accountId>` (broad; the hook filters client-side by status to detect transitions in and out of in-flight set).

---

## 2. Code-derived entities (new)

These are NOT in the DB; they exist as TS types / pure functions that
transform DB rows into UI props.

### 2.1 `InFlightBuild`

Source: `src/lib/engineering/in-flight.ts` (new — small helper module).

```ts
type InFlightBuild = {
  id: string;                                 // session.id
  prompt: string;                             // session.prompt
  buildType: string | null;                   // session.build_type
  status: 'pending' | 'running' | 'deploying';
  startedAt: string | null;                   // session.started_at (null if pending)
  createdAt: string;                          // session.created_at
  step: Step;                                 // derived via deriveStep()
  fileCount: number;                          // count of distinct paths in recent system logs
  currentFile: string | null;                 // most-recently-touched path
  inputTokens: number;
  outputTokens: number;
};
```

Sourced by:
- Server render: `getInFlightBuilds(supabase, accountId)` in the same module.
- Client realtime: composed in `useInFlightBuilds` from session UPDATE events + targeted log fetches (when a new session enters the in-flight set, the hook fetches its recent log tail).

The derived `step`, `fileCount`, `currentFile` fields are NOT stored; they are
recomputed on every render from the session + log inputs.

### 2.2 `Step`

Source: `src/lib/engineering/step-taxonomy.ts`.

```ts
type Step = {
  label: string;        // serif display, "Writing" / "Deploying" / "Shipped" / ...
  eyebrow: string;      // small-caps, "BUILDING THE PROJECT" / ...
  kind: StepKind;       // discriminant for visual treatment
  index?: number;       // optional "step N of M"; only set when grounded in worker emissions
  total?: number;
};

type StepKind =
  | 'queued'
  | 'scaffolding'
  | 'writing'
  | 'refining'
  | 'installing'
  | 'deploying'
  | 'shipped'
  | 'failed'
  | 'stopped'
  | 'unknown';
```

The full priority-ordered rules are in `contracts/step-taxonomy.md`.

### 2.3 `TranslatedError`

Source: `src/lib/engineering/error-translation.ts`.

```ts
type TranslatedError = {
  headline: string;                 // serif display, one sentence
  body: string;                     // sans body, may include a [Show details] disclosure
  rawDetails?: string;              // the original error_message (always populated for the disclosure)
  recovery: Recovery;
};

type Recovery =
  | { kind: 'none' }
  | { kind: 'retry'; label: string; promptSeed?: string }
  | { kind: 'continue-from'; label: string; parentSessionId: string }
  | { kind: 'contact-support'; label: string }
  | { kind: 'edit-env'; label: string; href: string };          // operator-only
```

The full priority-ordered token matchers are in `contracts/error-translation.md`.

### 2.4 `SubscriptionStatus`

Source: `src/hooks/useBuildSubscription.ts`.

```ts
type SubscriptionStatus =
  | { kind: 'idle' }
  | { kind: 'subscribing' }
  | { kind: 'live' }                // healthy; events flowing
  | { kind: 'degraded'; since: number }    // CHANNEL_ERROR fired; no events
  | { kind: 'reconnecting'; since: number }    // attempting re-subscribe
  | { kind: 'reconciling'; since: number };    // back live; backfill in flight
```

Both the cinema's `ReconnectingPip` and the in-flight strip use this status
to render the degraded-mode indicator.

### 2.5 `HeartbeatState`

Source: `src/hooks/useBuildHeartbeat.ts`.

```ts
type HeartbeatState =
  | { kind: 'healthy'; lastEventAt: number }
  | { kind: 'investigating'; lastEventAt: number; since: number };
```

`investigating` fires when status is non-terminal AND `now - lastEventAt ≥ 90s`.
Sticky until a new event arrives or the user clicks "Refresh now".

### 2.6 `PreviewState`

Source: `src/hooks/usePreviewIframe.ts`.

```ts
type PreviewState =
  | { kind: 'absent' }              // deploy_url is null
  | { kind: 'loading'; url: string }
  | { kind: 'loaded'; url: string }
  | { kind: 'blocked'; url: string };  // X-Frame-Options / CSP blocked render
```

The cinema's `BuildPreviewStage` renders one of four treatments based on this
state. The `blocked` treatment is the fallback (placeholder card + "Open in
new tab"); the `loaded` treatment is the curtain-rise materialization.

---

## 3. Source-of-truth ownership

| Concern | Owner | Notes |
|---|---|---|
| Persisted state | `conduit_engineering_sessions` + `conduit_engineering_logs` | Worker writes; client never mutates |
| Real-time delivery | Supabase `postgres_changes` channels | `useBuildSubscription` is the only consumer this feature adds |
| Derived `Step` | `step-taxonomy.ts` | Pure function, recomputed every render |
| Derived `TranslatedError` | `error-translation.ts` | Pure function, recomputed every render |
| Derived `InFlightBuild[]` | `in-flight.ts` + `useInFlightBuilds` | Server-render initial + client realtime updates |
| Heartbeat clock | `useBuildHeartbeat` | Client-only; resets on every event arrival |
| Subscription status | `useBuildSubscription` | Client-only; surface authoritative source |
| Preview state | `usePreviewIframe` | Client-only; per-iframe lifecycle |

No two paths converge on the same derived state. Every consumer reads either
DB rows or the pure derivation; nothing caches a step label or a translated
error across renders.

---

## 4. Lifecycle scenarios (end-to-end data flow)

### 4.1 Fresh build kickoff

1. User submits `EngineeringBuildButton` modal.
2. `POST /api/engineering/session` inserts a `conduit_engineering_sessions` row with `status='pending'` and calls `startWorkerSession`.
3. Server returns `{ session_id, status: 'pending', realtime_channel: 'engineering:<id>' }`.
4. Client navigates (replaces modal state pattern) to `/app/builds/<id>` via Next.js router.
5. Cinema page (server component) reads the freshly-inserted row + empty logs, mounts `BuildCinema` with `initialSession` and `initialLogs=[]`.
6. `BuildCinema` mounts `useBuildSession` (which composes `useBuildSubscription` + `useBuildHeartbeat`). Subscription transitions `idle → subscribing → live`.
7. As the worker emits log INSERTs and the session UPDATEs through `pending → running → deploying → complete`, every derived entity recomputes.

### 4.2 Realtime drop + reconcile

1. `useBuildSubscription` `RealtimeChannel.subscribe` callback fires `CHANNEL_ERROR`.
2. Subscription status transitions `live → degraded` (`since` = now).
3. `ReconnectingPip` mounts in the cinema header and the in-flight strip.
4. Supabase JS auto-reconnects; callback eventually fires `SUBSCRIBED` again.
5. Subscription status transitions `degraded → reconnecting → reconciling`.
6. Reconciler calls `GET /api/engineering/session/<id>` for fresh session + recent logs.
7. New logs are deduped by `id` against the existing state.
8. Subscription status transitions `reconciling → live`. Pip unmounts after a 1.2 s "back online" celebration.

### 4.3 Stuck-detection

1. Build has been `running` for 5 minutes; logs have been flowing every ~20 s.
2. Network blip on the worker side; last log lands at `t=300s`.
3. No new event arrives. At `t=300+90=390s`, `useBuildHeartbeat` transitions to `investigating`.
4. Cinema stage band cross-fades to "Investigating…" eyebrow ("STILL THINKING") — distinct from "Building". The spend tally and elapsed clock continue.
5. User clicks "Refresh now". The hook calls `GET /api/engineering/session/<id>`.
6. Server returns session row unchanged (worker truly stuck) → heartbeat stays `investigating` with the new `lastEventAt = now`.
7. OR server returns updated logs (events did arrive but realtime missed them) → heartbeat resets to `healthy`, deduped logs append, step recomputes.

### 4.4 Build completes while user is on the dashboard

1. User is on `/app/workspace`. In-flight strip shows the active build.
2. Worker writes `status='complete'`, `deploy_url='https://…'`, `completed_at=now`.
3. `useInFlightBuilds` receives the UPDATE event. The build leaves the in-flight set (terminal status).
4. The hook holds the just-completed build in a 5 s celebration buffer (`FR-016`).
5. In-flight strip transitions from "BUILDING · Writing" to "JUST SHIPPED · <prompt summary>" with the celebration motion.
6. After 5 s, the strip unmounts. Dashboard reflows.

### 4.5 Cinema mid-build crash (FR-012)

1. User is on the cinema. An unexpected log payload triggers a TypeError inside `BuildCraftStrip`.
2. React unmounts the cinema's component tree.
3. Next.js segment `error.tsx` (this plan's new file) mounts. It receives `{ error, unstable_retry }`.
4. The error page renders: "Something in the live view broke — your build is still running." + a "Reopen" button wired to `unstable_retry()` + a "View deploy" link if `session.deploy_url` was already known via a sessionStorage echo before the crash.
5. User clicks "Reopen". `unstable_retry()` re-mounts the segment; the cinema's server-render re-fetches; the user sees a fresh cinema with all logs backfilled.

---

## 5. State invariants

- **No two surfaces disagree about whether a build is in flight.** Every surface reads from the same `useInFlightBuilds` source. The hook is mounted at the layout level (workspace dashboard layout's children OR the sidebar's root) so the underlying subscription is shared.
- **No cached translation lives in DB.** Every error message rendered to the user is the result of `translateBuildError(rawError, { internalAccount })` at render time. The raw error in `conduit_engineering_sessions.error_message` is never mutated by this feature.
- **No client mutation of build state.** Every state-changing path goes through existing API routes (`POST /api/engineering/session/<id>/abort`). The cinema is a passive consumer.
- **Realtime is best-effort; backfill is the source of truth.** When realtime and a backfill diverge, the backfill wins. The hook recomputes dedupe sets on every reconcile pass.
