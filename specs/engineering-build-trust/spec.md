# Feature Specification: Engineering Build — Trustworthy & Beautiful Live Experience

**Feature Branch**: `feat/engineering-build-trust`
**Created**: 2026-05-23
**Status**: Draft — awaiting GATE 1 approval
**Round**: R16 (succeeds R15.5 public release; R15 Premium Redesign in flight on `/app/workspace` + chat shell)

**Input**: Make Engineering the build experience Luis trusts enough to replace
his direct use of Claude Code. Build-in-flight surfaces must never silently
crash. The full-screen log dump must be replaced with a beautiful live cinema
(step, files, elapsed, preview). The dashboard must surface in-flight builds
ambiently. Diagnose and resolve the recurring `worker_start_Failed to parse
URL …` failures.

---

## Background & Root-Cause Diagnosis

> This section is the user's explicit GATE 0 ask: read the code, name the real
> causes before writing the stories. It is the load-bearing context for the
> priorities below.

### A. Where the build experience lives today

| Surface | Path | Responsibility |
|---|---|---|
| Build kickoff modal | `src/components/conduit/engineering/EngineeringBuildButton.tsx` | Build-type picker + prompt + `POST /api/engineering/session` |
| Start API | `src/app/api/engineering/session/route.ts` | Auth, tier-limit, insert `conduit_engineering_sessions` row, call worker |
| Worker bridge | `src/lib/engineering/worker.ts` | `resolveWorkerBase()` → HMAC-sign → `POST <base>/session` on Railway |
| Live view (the "log dump") | `src/components/conduit/engineering/BuildSession.tsx` | Fixed-overlay 3-column terminal + status badge + X button |
| Builds index | `src/app/app/builds/page.tsx` + `BuildsTabs.tsx` | Historical list, opens `BuildSession` via `?session=<id>` |
| Realtime channel | Supabase `postgres_changes` on `conduit_engineering_logs` (INSERT) + `conduit_engineering_sessions` (UPDATE) | How `BuildSession` updates after mount |
| In-flight signal on dashboard | `src/lib/conduit/team-activity.ts:106-110` populates `employees.engineering.in_flight_build_id`; `PraxisTeamRoster.tsx:236-237` renders text `"1 build in flight"` | One-line copy on the Engineering team card. No click-through to the live view, no progress, no preview. |
| Schema | `conduit_engineering_sessions` (id, prompt, build_type, status enum, deploy_url, github_repo, total_input_tokens, total_output_tokens, error_message, started_at, completed_at, parent_session_id) and `conduit_engineering_logs` (session_id, ts, level, message). Migrations `018_engineering.sql`, `019_engineering_v2.sql`. Both tables joined to the Supabase Realtime publication. |

### B. Root cause of failure (a) — the silent crash

The build keeps running on Railway because it is a separate service; the user's
**window into the build** is what fails. Five compounding causes — none of which
is fixed by a one-line patch:

1. **The live view lives in ephemeral React state.** `EngineeringBuildButton.tsx:44` and `BuildsTabs.tsx:84` both store the open session id in `useState<string|null>`. The view is mounted as a child of whichever component opened it. **Any** of these unmounts it permanently:
   - User clicks the `X` button (`BuildSession.tsx:240-247`) — `setActiveSessionId(null)`.
   - User clicks "Minimize" (`BuildSession.tsx:362-368`) — same `onClose` path.
   - User navigates away (the Engineering page or `/app/builds`) — React unmount.
   - User refreshes the tab — state lost; no URL persistence on the Engineering page (only `/app/builds?session=<id>` persists via `BuildsTabs.tsx:74-95`).
   - Any unhandled exception inside `BuildSession` — Next.js fallback error UI, no per-view error boundary at this level.
2. **Realtime drops are not surfaced.** `BuildSession.tsx:103-135` calls `.subscribe()` but discards the status callback. If the websocket disconnects (network blip, tab backgrounded long enough, Supabase restart), events stop arriving. The UI keeps showing whatever last state it had — there is no "reconnecting…" badge, no force-refresh, no degraded-mode indicator. The user assumes the spinner means "still building"; the server-side row may have already flipped to `complete`.
3. **No heartbeat / stuck detection.** Status flips between `pending` → `running` → `deploying` → `complete|failed|timeout|aborted` only on worker writes. There is no client-side "no log for N seconds, is this still alive?" check. A worker that hangs mid-build (Claude API stall, network partition, OOM) lives on the screen indefinitely as "Building".
4. **Failure messages are raw enum/error strings.** `route.ts:135` writes `error_message: worker_start_${start.error ?? start.status}` directly to the DB. `BuildSession.tsx:316-320` renders it verbatim. The user sees strings like `worker_start_Failed to parse URL from conduit-engineering-worker-production.up.railway.app/session` — a concatenation of an internal token prefix and a Node fetch error. There is no human-readable translation layer.
5. **No persistent breadcrumb of in-flight builds.** The dashboard's `PraxisTeamRoster` Engineering card renders `"1 build in flight"` as flat copy with no link to the live view (`PraxisTeamRoster.tsx:236-237`). The sidebar's `/app/builds` link has no badge or pulse. The Engineering team page badge does not exist. Once the live view is dismissed, the user has no thread back to it short of navigating to `/app/builds` and clicking the row.

**The net effect:** the build is running and writing to `conduit_engineering_sessions` and `conduit_engineering_logs` continuously, but the user's window into it depends on a chain of fragile in-memory state. If any link in that chain breaks (5+ ways above), the user is dropped to a UI that gives them no signal that anything is in flight. The build then completes (or fails) and the user only finds out via the terminal where Vercel CLI is logging deploy events — exactly what the user reported.

### C. Root cause of failure (b) — `worker_start_Failed to parse URL`

This one is mechanical:

1. **Where the error string is constructed.** `route.ts:135` writes `error_message: worker_start_${start.error}`. `start.error` is `err.message` from the `catch` in `worker.ts:64-68`. Node's `fetch()` throws `TypeError: Failed to parse URL from <input>` when given a host without a scheme.
2. **Why operators hit it.** Railway's dashboard displays domains host-only (no `https://`). Operators (Luis, per the R2 session report) set `ENGINEERING_WORKER_URL` on Vercel as `conduit-engineering-worker-production.up.railway.app` instead of `https://conduit-engineering-worker-production.up.railway.app`. Every build then fails at the first `fetch()` call.
3. **Whether it is fixed.** YES — commit `6931aad` (2026-05-12, "R2") added `resolveWorkerBase()` in `worker.ts:13-18`:
   ```ts
   const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
   ```
   New builds in main do not hit this error. The mirror fix landed in `src/lib/marketing/worker.ts` simultaneously.
4. **What the user is still seeing.** The failed rows in `/app/builds` are **historical** — they pre-date the fix. The R3 session report added a "Show failed (N)" toggle (`BuildsTabs.tsx:97-119`) that hides them by default, but they still occupy `conduit_engineering_sessions` and surface when the toggle is on.
5. **Residual gap (this spec WILL address).** If `ENGINEERING_WORKER_URL` is unset, `resolveWorkerBase()` returns `null`, `startWorkerSession` returns `error: "worker_url_missing"`, and the UI surfaces `worker_unavailable / The build worker isn't reachable right now`. That message is correct but uninformative: it does not say *what* the operator should do, and it does not differentiate "env var empty" from "Railway service is down" from "Railway service rejected the HMAC". A human-readable error layer (P2 below) closes this loop.

### D. What this means for the spec

The diagnosis tells us the silent-crash problem is **architectural**, not a
single missing feature. The fix has to do five things at once:

1. Give the build-in-flight state a **durable surface** (URL + dashboard tile + sidebar badge) so it cannot be lost by an unmount, refresh, or navigation.
2. Add **realtime health awareness** — if the channel drops, say so and reconcile.
3. Add **stuck detection** — if no log for N seconds while status ≠ terminal, mark "investigating" and offer a recovery path.
4. **Translate machine errors** into operator-language at render time, not in the DB row.
5. **Wrap the cinema view in a per-surface error boundary** so an unexpected payload shape never blanks the user out.

The worker-URL bug is functionally closed; the residual is the error-translation layer (point 4), which folds into the same P1/P2 work.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — A build in flight is never silently lost (Priority: P1)

Luis types "Build me a landing page for a Brooklyn dog-walker" into the
Engineering build modal, hits **Ship it**, and sees the build start. He then
clicks somewhere else in the console — to /app/workspace, to chat, to the
sidebar, to /app/team/sales — anywhere except the live build view itself.
**At all times** from build-start to terminal status, he can see, with one
glance and one click, that the build is in flight and where it is.

**Why this priority**: This is the failure that made him distrust Engineering.
A build he kicked off vanished from his UI and only resurfaced via a Vercel
CLI deploy event in his terminal. If we ship nothing else, ship this — a build
that the system started must be a build the system surfaces.

**Independent Test**: Start a build. Close the live view. Navigate to
`/app/workspace`. Confirm an in-flight indicator is visible on the dashboard
and the sidebar. Click it. Confirm the live view is restored with no gap in
log history. Refresh the tab. Confirm same. Close the tab and reopen the
console URL. Confirm same.

**Acceptance Scenarios**:

1. **Given** the user has kicked off a build and the worker accepted it (HTTP 202), **When** the user navigates away from the live build view to any `/app/*` surface, **Then** the dashboard (`/app/workspace`) shows an in-flight build tile with current step + elapsed; the sidebar shows a pulse indicator on the Builds entry; the Engineering team card surfaces a clickable "Building: <prompt summary>" affordance with current step.
2. **Given** a build is in flight, **When** the user refreshes the tab on any `/app/*` page, **Then** every in-flight surface re-mounts populated, with logs and status backfilled from the server (no flash of "no build" state).
3. **Given** a build is in flight, **When** the user closes and reopens the tab and returns to `/app/workspace`, **Then** the in-flight tile renders within the dashboard's normal first paint (no extra round-trip blocking the rest of the dashboard).
4. **Given** a build is in flight, **When** the user clicks the in-flight indicator from any surface, **Then** the live cinema (P1 story 2) mounts at a stable URL (`/app/builds?session=<id>` or `/app/builds/<id>`) that survives refresh.
5. **Given** the realtime websocket drops mid-build, **When** events stop arriving for ≥ 8 seconds, **Then** the UI surfaces a "reconnecting…" indicator within 2 seconds of recovery, polls for the missed state, and reconciles without losing user-visible logs.
6. **Given** the build status is still non-terminal but no new log has arrived for ≥ 90 seconds, **When** the user is on any surface showing build state, **Then** the UI marks the build as "investigating" (distinct from "building" and "failed"), names the last-known step, and offers a "Refresh now" affordance that re-fetches from the server.
7. **Given** an unexpected error inside the cinema component, **When** the React tree would normally crash, **Then** a per-cinema error boundary catches it, surfaces a "Something in the live view broke — your build is still running" message with the deploy URL link (if any) and a "Reopen" affordance.

---

### User Story 2 — Honest live progress, not a terminal dump (Priority: P1)

When Luis opens the live build view, he sees a beautiful, legible cinema of
what Engineering is doing — not a raw log scroll. He can read the current step
at a glance, see the file being written *right now*, see elapsed time, see
running token + spend, and the moment the worker writes a deploy URL he sees a
live preview iframe of the site rendering itself into existence.

**Why this priority**: The user's framing — "I want to WATCH it build in
beautiful UI." A trustworthy build experience is a transparent one. The current
view *is* honest (the logs are real) but it is hostile (a wall of text in a
monospace overlay). Ship a UI that respects the magnitude of "an AI is
shipping a real site for me."

**Independent Test**: Start a build. Open the cinema. Without scrolling, can
the user answer: what step is Engineering on, what file was just touched, how
many files so far, how long since start, what is the running spend? Once
deploy succeeds, can the user see the live site in the same view without
opening a new tab?

**Acceptance Scenarios**:

1. **Given** a build is in `running` status, **When** the user views the cinema, **Then** the dominant element is a step indicator (e.g. "Scaffolding Next.js project · step 3 of 7") with eyebrow text naming the operation in plain English; the raw log scroll is a secondary, collapsed-by-default panel.
2. **Given** the worker has just emitted a `WRITE <path>` or `EDIT <path>` system log, **When** the user views the cinema, **Then** the file panel highlights the most-recently-touched file (animated highlight, decays within 600ms) and the count of files written/edited is visible.
3. **Given** elapsed > 0, **When** the user views the cinema, **Then** elapsed time renders monotonically (does not flicker on realtime updates) in a prominent slot alongside running input + output tokens and running spend in USD.
4. **Given** the worker has written `deploy_url` to the session row, **When** the user views the cinema, **Then** an iframe loads the deploy URL inline (sandboxed appropriately) within the cinema view, alongside an "Open in new tab" link. If the iframe blocks (X-Frame-Options, sandbox failure), fall back to a screenshot placeholder + an explicit "Open in new tab" affordance.
5. **Given** the build reaches `complete`, **When** the user views the cinema, **Then** the view transitions from the in-progress treatment to a "shipped" summary: deploy URL, GitHub repo link, files-touched count, total elapsed, total tokens, total spend, and a "Continue from this build" affordance.
6. **Given** the user has reduced-motion preferences enabled, **When** the cinema renders animated elements (file highlights, step transitions), **Then** all motion respects `prefers-reduced-motion: reduce` per the Praxis premium-redesign motion standards.
7. **Given** the cinema renders on a 375px-wide viewport, **When** the user views any state, **Then** the cinema reflows to single-column with step + files + preview stacked, no horizontal scroll, tap targets ≥ 44px.

---

### User Story 3 — Watching from the dashboard, ambient (Priority: P1)

Luis is on `/app/workspace` planning his next move. A build he started 90
seconds ago is still going. He can see — without leaving the dashboard — that
the build is in step 4 of 7, has written 12 files, has been running 1:30,
and is currently writing `app/components/Hero.tsx`. He clicks the tile and
falls into the cinema; he hits browser back and is on the dashboard again with
the tile still live-updating.

**Why this priority**: The user said it explicitly: "I want to WATCH it build
in beautiful UI, on my dashboard." The dashboard is the surface Luis lives on.
A trustworthy build is one he can passively monitor from where he already is.

**Independent Test**: Start a build. Navigate to `/app/workspace`. Confirm an
in-flight build tile is visible in the dashboard's primary content area.
Confirm it live-updates step/elapsed/file-count via realtime (not by polling).
Click it. Confirm the cinema opens at a stable URL. Hit back. Confirm the
dashboard tile is still there and current.

**Acceptance Scenarios**:

1. **Given** at least one Engineering build is in flight, **When** the user lands on `/app/workspace`, **Then** the dashboard renders an in-flight build tile in a slot that survives the existing premium-redesign layout (KPI tile row OR a new "Currently building" cluster above the team roster — placement determined at plan time, but presence is non-negotiable).
2. **Given** the in-flight tile is mounted, **When** the worker emits new logs or status changes, **Then** the tile's step, elapsed, file count, and current-file fields update via the same realtime subscription used by the cinema (no separate polling loop).
3. **Given** the in-flight tile is mounted, **When** the user clicks it, **Then** the cinema opens at `/app/builds?session=<id>` (or equivalent stable URL). The dashboard remains the underlying page so browser back returns to it cleanly.
4. **Given** no build is in flight, **When** the user lands on `/app/workspace`, **Then** the in-flight tile is absent (zero layout shift; nothing renders an empty placeholder). The Engineering team-roster card retains its existing copy ("Active <time>" or last artifact).
5. **Given** multiple builds are in flight simultaneously (rare; valid for internal accounts), **When** the dashboard renders, **Then** the in-flight surface shows the most-recently-started one with a "+N more" affordance.
6. **Given** a build flips to a terminal state while the dashboard is open, **When** the dashboard receives the realtime UPDATE, **Then** the tile transitions to a brief "Just shipped <name>" celebration (≤ 5s) then either disappears (success) or transitions to a clear failure state with a recovery link.

---

### User Story 4 — Failure dignity: human errors and named recovery (Priority: P2)

When a build fails — for any of the half-dozen real reasons (worker URL
misconfig, Claude rate-limit, Vercel deploy quota, syntax error in generated
code, user-side abort) — the user sees an error that names what went wrong
in operator-language and offers a recovery path. The DB still stores the
machine-precise reason; the UI translates.

**Why this priority**: P2 because P1 already requires "shows a clear,
recoverable error" — but that level of fidelity warrants its own story. The
current behavior (raw enum strings like `worker_start_Failed to parse URL …`)
breaks trust even when the underlying failure is benign.

**Independent Test**: Manually simulate each failure mode (env var unset,
worker 502, Claude 429, deploy 4xx, mid-build abort) — confirm each surfaces a
distinct, plain-English message with the correct recovery affordance.

**Acceptance Scenarios**:

1. **Given** `ENGINEERING_WORKER_URL` is unset on the server, **When** a build is attempted, **Then** the error surfaced to the operator (Luis is the operator) reads "The build service isn't connected — set ENGINEERING_WORKER_URL in your Vercel environment" with a link to the Vercel project's env settings. (Non-operator users see the same dignity-preserving message without the env-edit hint.)
2. **Given** the worker returns a non-2xx response (timeout, 5xx, signature rejection), **When** the build fails to start, **Then** the error reads "The build service rejected the start signal — try again in a minute or contact support" and the row's raw `error_message` is still stored for diagnosis.
3. **Given** a build fails mid-run with a recognized error class (Claude rate limit, deploy quota, build-content syntax error), **When** the user views the failure, **Then** the message names the class in plain English and offers a "Continue from last good step" affordance where possible.
4. **Given** a build fails mid-run with an unrecognized error, **When** the user views the failure, **Then** the message reads "Engineering hit something unexpected" with a "Show the technical details" disclosure and a "Start over with the same prompt" affordance.
5. **Given** historical rows in `conduit_engineering_sessions` whose `error_message` still contains the legacy `worker_start_*` prefix, **When** these rows render in `/app/builds`, **Then** the prefix is stripped and the message is translated by the same surface that handles live failures.

---

### User Story 5 — Persistent build URL + deep link (Priority: P2)

Any in-flight or historical build has a permalinkable URL. Luis can copy the
URL from the cinema, paste it into a note or a chat with himself, click it
hours later, and land back in the cinema view for that exact build.

**Why this priority**: P2 because P1 story 1 already requires URL persistence
for in-flight builds — but pinning the contract makes the implementation
concrete and unlocks share-with-team patterns later.

**Independent Test**: Start a build. Copy the URL. Navigate elsewhere. Paste
the URL. Confirm same cinema renders. Close the build. Reopen the URL.
Confirm the historical view renders with deploy URL + summary.

**Acceptance Scenarios**:

1. **Given** any session id `<id>`, **When** the user opens `/app/builds?session=<id>` or `/app/builds/<id>` (URL shape determined at plan time), **Then** the cinema renders with backfilled logs + status + summary.
2. **Given** the user is in the cinema, **When** they look for a share affordance, **Then** a copy-URL button is visible with one-click copy and a confirmation toast.
3. **Given** a session id refers to a build the current user does not own (RLS denies), **When** the URL is opened, **Then** a clean 404 renders, not a blank cinema.

---

### User Story 5b — Live code-stream cinema panel (Priority: P2, Phase B)

When Engineering is writing a file, Luis sees the actual code — line by line,
syntax-highlighted, with a brief rainbow stripe sweeping across each new line
as it lands — appear in the cinema. Not a terminal scroll, not a list of file
names: the literal code being written by Engineering, materialized in front
of him as it streams from the worker.

**Why this priority**: surfaced after Phase A preview-validated (2026-05-23,
Lunaro build `b81aea12`). The cinema delivers durability and step honesty;
the craft strip already shows file names. What's missing for the
"watch-a-craftsman-work" feel is the code itself. This is the unforgettable
moment the user named after seeing the cinema work end-to-end.

**Independent Test**: Trigger a build. Open the cinema. Confirm a new panel
renders, file tabs across the top, code body underneath; as Engineering
streams chunks, the code types in line-by-line, syntax-highlighted, with a
rainbow sweep on each new line.

**Diagnosis + locked approach**: see
[`phase-b-code-stream.md`](./phase-b-code-stream.md). The diagnosis confirms
that today's `conduit_engineering_logs` realtime stream carries file NAMES
(via `WRITE <path>` system logs) but no content — Claude's per-token output
is consumed by the worker but never forwarded. The locked approach is Path C
(worker streams Claude tokens per chunk via stdout logs) + Prism-based
syntax highlighting + a rainbow line-arrival sweep.

**Gate state**: BLOCKED on
(a) Phase A preview validation,
(b) a worker-repo PR that emits per-chunk stdout per Path C,
(c) a full Phase B spec section + plan + tasks before any in-repo code is
authored. Listed here so the priority + framing are anchored in the
canonical spec; the design + FRs land when the gate clears.

---

### User Story 6 — Build-status pulse in the chat surface (Priority: P3)

When a build is in flight, the Engineering employee's avatar in the chat
right-rail and in the route-picker shows a subtle pulse synchronized with
the build's status. When the build ships, the avatar briefly celebrates.

**Why this priority**: P3 — nice-to-have, not load-bearing for trust. Folds
into the Praxis premium-redesign motion vocabulary if that lands first.

**Independent Test**: With a build running, open `/app`. Confirm Engineering's
avatar pulses. Wait for completion. Confirm a brief celebration moment.

**Acceptance Scenarios**:

1. **Given** a build is in flight, **When** the user is in any chat surface, **Then** the Engineering avatar exhibits a "building" pulse cadence distinct from the "ambient" cadence used for idle employees.
2. **Given** a build flips to `complete`, **When** the chat is open, **Then** Engineering's avatar shows a one-time celebration (≤ 2s) consistent with the redesign's celebration token.

---

### User Story 7 — Cost transparency before commit (Priority: P3)

Before the user clicks **Ship it**, the modal shows an estimated build cost
(tokens × tier rate, or a flat-rate estimate). After the build runs, the
final cost is visible in the cinema summary and in the historical row.

**Why this priority**: P3 — the existing usage banner already enforces caps;
this is about transparency, not safety.

**Independent Test**: Open the build modal. Confirm an estimated cost range
appears (e.g. "≈ $0.40–$1.20"). Submit. Confirm final actual cost is visible
on completion.

**Acceptance Scenarios**:

1. **Given** the user opens the build modal, **When** they have typed a prompt ≥ 8 chars, **Then** an estimated cost range renders based on prompt length and build-type heuristic, alongside the existing daily-cap status.
2. **Given** a build completes, **When** the user views the cinema summary, **Then** final actual spend in USD is visible alongside files-touched and elapsed.

---

### Edge Cases

The cases below MUST be covered (acceptance behavior named where load-bearing
for P1):

- **Worker URL env var unset** — covered by FR-021/FR-022. Banner on `/app/builds` and modal: "Build service not connected." Buttons disabled.
- **Worker URL set but unreachable / 5xx / HMAC reject** — distinct human messages per failure class (FR-023).
- **Realtime channel drop mid-build** — reconnect logic + "reconnecting…" pip + reconciling backfill from `/api/engineering/session/<id>` (FR-008, FR-009).
- **Build runs > 30 min without log** — "investigating" state with one-click "refresh now" (FR-010, FR-011).
- **User aborts build** — already supported via `/api/engineering/session/<id>/abort`. Cinema must transition cleanly to "Aborted" without losing log history (FR-012).
- **User closes tab mid-build** — build keeps running on Railway; on next page load any in-flight surface populates from server state (FR-002, FR-003).
- **Two builds in flight simultaneously** (allowed for `internal_account`) — dashboard tile shows most-recent + "+N more"; cinema URL routes by `<id>` (FR-014).
- **Build completes while cinema is open** — cinema transitions to "shipped" summary without remount; deploy URL iframe loads inline (FR-017).
- **`deploy_url` set but iframe blocks** (X-Frame-Options) — fallback to screenshot placeholder + "Open in new tab" (FR-018).
- **`deploy_url` never set** (failed before deploy) — cinema summary clearly states "Did not deploy" with no broken-link affordances.
- **Historical row with `worker_start_*` prefix** — translated at render time, original stored verbatim in DB (FR-023, FR-024).
- **Mobile viewport at 375px / 390px** — Constitution Principle V; FR-027.
- **Light / dark theme parity** — Constitution Principle V; FR-028.
- **Reduced-motion preference** — FR-029, mirrors Praxis premium-redesign Assumption 7.
- **`internal_account` vs paid-tier user** — surfaces are identical except for env-edit hints (FR-021).
- **Free-tier user hits daily cap mid-day** — already handled by usage banner; cinema messaging integrates the cap-reached state (FR-025).
- **Realtime not configured for `conduit_engineering_sessions`** (migration 018 SHOULD have added it; verify at plan time per R-V1) — fall back to polling at the same surfaces, with a visible degraded-mode pip.

---

## Requirements *(mandatory)*

### Functional Requirements

**Live cinema (replaces today's full-screen log dump)**

- **FR-001**: System MUST render the in-flight build's primary state (current step in plain English, elapsed time, file count, current-file name, running spend in USD) above the fold of the live view at viewport widths ≥ 375 px.
- **FR-002**: System MUST mount the cinema at a stable URL (`/app/builds?session=<id>` or `/app/builds/<id>`; URL shape locked at plan time) such that refresh, share, and back-button behavior all return the user to the same view with no data loss visible to the user.
- **FR-003**: System MUST backfill logs and session state from `/api/engineering/session/<id>` on cinema mount when realtime has not yet delivered events, with first paint within 600 ms on a warm cache.
- **FR-004**: System MUST render the raw log scroll as a secondary, collapsible panel — visible on demand, not the dominant element. The terminal monospace treatment is preserved inside that panel for ops fidelity.
- **FR-005**: System MUST highlight the most-recently-touched file in the file panel with a transient animation that respects `prefers-reduced-motion`.
- **FR-006**: System MUST display a live preview iframe of `deploy_url` inline in the cinema the moment the URL is set, with sandboxed `iframe` attributes and an "Open in new tab" affordance.
- **FR-007**: System MUST fall back gracefully to a placeholder + new-tab link when the deploy URL refuses to render inline (X-Frame-Options, sandbox failure), without breaking the cinema layout.

**Resilience (the "never silently crash" contract)**

- **FR-008**: System MUST detect realtime channel disconnections within 2 s of the channel reporting `CHANNEL_ERROR` / `TIMED_OUT` / `CLOSED` and surface a non-blocking "reconnecting…" indicator on every surface showing in-flight state.
- **FR-009**: System MUST automatically re-subscribe to realtime on reconnect and reconcile missed state by re-fetching from `/api/engineering/session/<id>` without user action; visible logs MUST NOT be lost or duplicated.
- **FR-010**: System MUST detect "stuck" builds — defined as `status ∈ {pending, running, deploying}` with no new log entry for ≥ 90 s — and render an "investigating" treatment distinct from "building" and "failed".
- **FR-011**: System MUST offer a "Refresh now" affordance from the "investigating" state that re-fetches session + recent logs and updates the surface without remounting.
- **FR-012**: System MUST wrap the cinema in a React error boundary that, on uncaught render error, displays a recovery message naming "the live view broke — your build is still running" with a link to the deploy URL (if set) and a "Reopen" affordance that resets the cinema state.
- **FR-013**: System MUST persist build-in-flight visibility across navigation: dashboard tile, sidebar pulse, and team-card affordance MUST all reflect current in-flight state on every `/app/*` page load, populated from server state (no client-only state).

**Dashboard ambient surface**

- **FR-014**: System MUST render an in-flight build tile on `/app/workspace` whenever the user has ≥ 1 active build. Placement is determined at plan time (Praxis premium-redesign motion vocabulary applies). Multiple in-flight builds collapse into the most-recently-started + a "+N more" affordance.
- **FR-015**: System MUST update the in-flight tile via the same Supabase realtime subscription pattern used by the cinema — no separate polling loop, no separate API route.
- **FR-016**: System MUST clear the in-flight tile from the dashboard within 5 s of the underlying session reaching a terminal state, with an interstitial "Just shipped: <prompt summary>" celebration on success or a clear failure-with-recovery state on failure.

**Honest progress modeling**

- **FR-017**: System MUST map worker log emissions to a plain-English step taxonomy. The taxonomy MUST cover the actual phases the Railway worker executes (initialization, scaffolding, generation, install, deploy). Taxonomy verbs MUST be sourced from the worker's emitted system-log conventions (`WRITE <path>`, `EDIT <path>`, etc.) and from `conduit_engineering_sessions.status` transitions. [NEEDS CLARIFICATION at plan time: confirm the worker's exact log conventions against the engineering-worker repo / Railway logs; do not invent phases not actually emitted.]
- **FR-018**: System MUST display a step indicator that reflects the most-recently-emitted phase. When no phase has been emitted yet, the indicator displays the literal session `status` (Queued / Building / Deploying), translated.
- **FR-019**: System MUST render running input tokens, output tokens, and a USD spend estimate based on the tier's per-token pricing. Final actual spend MUST be displayed on terminal status.

**Failure dignity**

- **FR-020**: System MUST NOT render `worker_start_*` or other internal prefixes verbatim to the user. A translation function MUST map known error tokens to plain English. Unrecognized errors render as "Engineering hit something unexpected" with a "Show technical details" disclosure that reveals the raw message.
- **FR-021**: System MUST surface a distinct, actionable message when the failure cause is `worker_url_missing`. Operators (identified by `internal_account = true`) see the env-var name and a link to Vercel project env settings; non-operators see "The build service isn't connected yet — Luis is on it."
- **FR-022**: System MUST surface a distinct message when the failure cause is "worker reachable but rejected": HMAC signature rejection, non-2xx response, or timeout — each named separately if distinguishable, falling back to a shared "build service rejected the start signal" message otherwise.
- **FR-023**: System MUST translate `error_message` consistently in the cinema, the dashboard tile, the `/app/builds` index, and the team-card affordance — one shared translation function, one source of truth.
- **FR-024**: System MUST retroactively translate historical `error_message` values containing the `worker_start_*` prefix at render time (no data migration). The original value remains in the DB column for diagnosis.

**Tier + cap integration**

- **FR-025**: System MUST integrate the daily-cap state (`UsageBanner`) into the failure-message surface — when a build attempt fails because the cap is exhausted, the error names "daily build limit reached" and links to billing per existing patterns.

**Sidebar + chat affordances**

- **FR-026**: Sidebar's `/app/builds` entry MUST render a subtle pulse indicator when ≥ 1 build is in flight (consumes the Praxis premium-redesign status-pip system; no new tokens introduced by this spec).

**Mobile + theme + motion**

- **FR-027**: All cinema, dashboard tile, and team-card surfaces MUST be legible and tappable at 375 px and 390 px viewport widths (Constitution Principle V).
- **FR-028**: All new surfaces MUST render correctly in both light and dark themes (Constitution Principle V; integrates with the R3 light-mode palette).
- **FR-029**: All animated elements (file highlights, step transitions, ambient pulses, celebrations) MUST respect `prefers-reduced-motion: reduce` — motion either off or substituted with an opacity-only transition per the Praxis premium-redesign Assumption 7.

**Brand + provider concealment** (Constitution Principle III)

- **FR-030**: No new surface introduced by this spec may surface the strings "Claude", "Anthropic", "OpenAI", "Sonnet", "Opus", "Haiku", "ElevenLabs", "LiveKit", or any provider name. Internal log lines emitted by the worker that contain such strings MUST be filtered at the render layer of the raw-log panel (substring redaction at render time; DB row untouched).

**Domain truth** (Constitution Principle 0)

- **FR-031**: All employee, capability, and tier references on new surfaces MUST source from `src/lib/conduit/employees.ts` and `src/lib/billing/tiers.ts`. No new employee, no new capability, no new tier introduced.

### Key Entities

- **Engineering session** — a row in `conduit_engineering_sessions` representing one user request to build a site. Carries the prompt, build-type, status, deploy URL, GitHub repo URL, token counts, error message, timestamps, and optional `parent_session_id` for "Continue from this build". RLS-scoped by account ownership.
- **Engineering log** — append-only stream of log lines for a session in `conduit_engineering_logs`. Level enum {info, stdout, stderr, system}. System lines carry structured events like `WRITE <path>`, `EDIT <path>`. RLS-scoped via the session.
- **In-flight build** — derived view: any session whose status ∈ {pending, running, deploying}.
- **Step taxonomy** — a closed-set of plain-English phase labels mapped from worker log emissions and session-status transitions. Defined at plan time, NOT invented in the spec.
- **Cinema view** — the full-page or modal surface that presents one session's live state. Always mounted at a stable URL (P1).
- **In-flight tile** — the dashboard's ambient surface for one or more in-flight builds. Auto-clears on terminal status with a celebration interstitial.
- **Error-translation map** — a render-time function `(rawErrorMessage: string) → { headline, body, recovery: Recovery }` shared across all surfaces.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After a build kickoff, the user can identify the build's status from `/app/workspace` within one second of landing, without opening the cinema. Verified on 375 px, 390 px, and desktop, light and dark theme.
- **SC-002**: Zero builds are "silently lost" to the user across a session that includes ≥ 2 navigations and ≥ 1 refresh. (Measurement: manual sweep across the verification matrix in `quickstart.md` at plan time.)
- **SC-003**: When a realtime channel disconnect is forced (DevTools network throttling), the UI surfaces a reconnecting indicator within 2 seconds and reconciles all missed events within 8 seconds of reconnect with no duplicate log lines visible.
- **SC-004**: A "stuck" build (no log for ≥ 90 s while status ≠ terminal) shows an "investigating" treatment with a one-click refresh affordance.
- **SC-005**: Every failure mode in the Edge Cases list renders a distinct, plain-English error message with a named recovery affordance. Verified by simulating each failure class.
- **SC-006**: The full-screen log-dump treatment is gone from the default cinema view; raw logs are accessible only via a secondary panel.
- **SC-007**: All historical `conduit_engineering_sessions` rows render in `/app/builds` with translated error messages (no `worker_start_*` prefix visible to the user) without any DB migration.
- **SC-008**: Zero provider-tell strings ("Claude", "Anthropic", "OpenAI", etc.) appear in any new surface introduced by this feature. Verified by grep at PR time.
- **SC-009**: Mobile sweep at 375 px and 390 px passes for cinema, dashboard tile, sidebar pulse, and team-card affordance (Constitution Principle V).
- **SC-010**: When a build completes successfully and the cinema is open, the live preview iframe loads within 3 seconds of the deploy URL becoming visible, OR a screenshot placeholder + new-tab affordance loads within the same window if the iframe is blocked.

---

## Assumptions

1. **No new schema migrations.** This feature uses `conduit_engineering_sessions` and `conduit_engineering_logs` as they exist after migrations 018/019. Step taxonomy lives in code, not in a new column. If plan-time analysis shows a structured-step column would dramatically simplify the worker integration, that decision goes back through GATE 1 with a new clarification — not silently into the plan.
2. **No worker repo changes are in scope here.** The worker's emitted log conventions are taken as a contract. If FR-017 reveals the contract is insufficient for honest step labeling, that becomes a separate spec ("engineering worker step contract") — NOT scope creep into this one.
3. **The R15 Premium Redesign (`specs/praxis-console-premium-redesign/`) is the dominant brand + motion system.** This spec consumes its tokens, primitives, and motion vocabulary. If the redesign has not landed on `/app/workspace` and the cinema by implementation time, the implementation orders itself to land after the redesign reaches the relevant surfaces (Phase ordering decided in `plan.md`).
4. **`/app/builds` remains the canonical "all my builds" page.** Cinema URL shape locks in plan time. This spec does not rename or move that page.
5. **No new external dependencies.** Zero npm installs. Zero new SDKs. View-transition behaviors and motion live in CSS keyframes consistent with the Praxis redesign's `praxis-system.css` (Constitution Principle I — read `node_modules/next/dist/docs/` before authoring any framework-touching code in the plan).
6. **The Vercel preview iframe will frequently load** (Vercel previews don't typically set X-Frame-Options DENY). Fallback exists for the cases it doesn't.
7. **`internal_account` is the operator identity.** Operator-specific error hints (e.g. "set ENGINEERING_WORKER_URL in Vercel") render only when `internal_account = true`. Non-operator dignity messages are otherwise identical.
8. **Cost estimate (P3, FR-019)** is a tier-based heuristic, not a model-side dry-run. If a precise estimate is required, it becomes a separate clarification at plan time.

---

## Out of Scope

- Engineering worker repo changes — taxonomy of emitted logs, build phases, or worker-side observability.
- New build types beyond the existing four (`landing-page`, `web-app`, `api`, `custom`).
- Changes to the daily-cap logic, tier pricing, or billing surfaces beyond integrating the cap-exhausted state into the new error-translation layer.
- Marketing-page changes (Constitution Principle IV — no marketing imports introduced).
- Voice-room integration (no voice-driven build kickoff in this round).
- Multi-user collaboration on a build (no shared sessions, no commenting).
- Build-artifact archive UI beyond what `/app/builds` already provides.
- The R7 templates surface — that tab in `/app/builds` is preserved as-is.
- Schema migrations.
- Provider abstraction changes (`src/lib/ai/provider.ts` untouched).
- Engineering employee chat surface — Engineering's `/app/team/engineering` page header pulses for in-flight builds via FR-013 but is otherwise unchanged in this round.

---

## Sources & References

Per Constitution Principle 0, every domain reference below is sourced:

| Reference | Source |
|---|---|
| Engineering employee identity, role, tagline, voice category | `src/lib/conduit/employees.ts` (the locked roster) |
| Build-type allowed values | `src/components/conduit/engineering/EngineeringBuildButton.tsx:12-33` |
| Session schema + status enum | `supabase/migrations/018_engineering.sql`, `supabase/migrations/019_engineering_v2.sql` |
| Worker URL fix lineage | `SESSION_REPORT_2026-05-12_PRAXIS_CONSOLE_R2.md`, commit `6931aad` |
| Builds page + Show-failed toggle | `SESSION_REPORT_2026-05-12_PRAXIS_CONSOLE_R3.md` |
| R15.5 public release + abort + spend cap | commit `88f6cf2`, related src under `src/lib/engineering/` |
| In-flight signal on dashboard (current state) | `src/lib/conduit/team-activity.ts:106-110`, `src/components/conduit/praxis/PraxisTeamRoster.tsx:236-237` |
| Premium redesign tokens + motion vocabulary | `specs/praxis-console-premium-redesign/plan.md`, `src/styles/praxis-tokens.css`, `src/styles/praxis-system.css` |
| Tier definitions for spend-cap integration | `src/lib/billing/tiers.ts` |
| Constitution gates applied | `.specify/memory/constitution.md` v1.0.0 (Principles 0, I, II, III, IV, V, VI) |

---

## GATE 1 Status

**APPROVED 2026-05-23** by Luis. Locked decisions:

1. **P1 bundle scope** — three coupled P1 stories (never-silent + honest cinema + dashboard ambient) ship as one deployable slice. No P1A/P1B split.
2. **Cinema URL shape** — `/app/builds/[session]` REST-shaped dynamic route. The existing `?session=<id>` query on `/app/builds/page.tsx` is preserved for backward compatibility but the canonical URL is the dynamic segment.
3. **In-flight tile placement** — **top** of `/app/workspace`, above `PraxisWelcomeHero`, mirroring `PraxisLiveStrip`'s "conditional strip when active" pattern (engineering tint instead of voice tint).
4. **Live preview iframe** — inline iframe approach with graceful fallback (FR-006/007 unchanged).
5. **Step taxonomy (FR-017)** — pin a default taxonomy in code now; verify against actual worker log emissions during Phase 0 research and refine if needed before merge. No hallucinated phases.
6. **P3 stories** — keep both (chat pulse, cost transparency) in the spec; build last, after P1 + P2 are live.

**Additional GATE 1 directive**: the `frontend-design` skill governs all visual/UX choices in this feature. The skill was read into the planning context in this session at `/Users/luis.conduit/.claude/plugins/marketplaces/claude-plugins-official/plugins/frontend-design/skills/frontend-design/SKILL.md` (installed-but-unregistered as of session start; user will enable via `/plugin install frontend-design@claude-plugins-official` for future sessions).
