# Engineering Build — Trustworthy & Beautiful Live Experience (R16)

**Date:** 2026-05-23
**Branch:** main (Phase A complete; build green)
**Spec:** `specs/engineering-build-trust/`
**Round:** R16 (succeeds R15.5 public release; Phase A only — Phase B/C deferred per user directive)

---

## TL;DR

The Engineering build experience is now a real architecture instead of an
in-memory React modal that could vanish at any time. A new durable URL
(`/app/builds/[session]`) owns the live view; an in-flight strip on
`/app/workspace` and a sidebar pip make the build ambient; explicit channel-
state awareness + heartbeat detection + a per-segment error boundary turn the
five silent-crash failure modes into named, recoverable states.

Phase A of three (P1 bundle) shipped. P2 (failure-dignity rollout to all
surfaces + share-URL) and P3 (chat-pulse + cost transparency) deferred for
the user to preview-validate Phase A before they unlock.

---

## What changed

### New files

| Path | Purpose |
|---|---|
| `src/app/app/builds/[session]/page.tsx` | Cinema route — server-render backfills + mounts the cinema client component. |
| `src/app/app/builds/[session]/error.tsx` | Segment error boundary (Next.js 16 `unstable_retry`). "Reopen the live view" affordance. |
| `src/styles/engineering-cinema.css` | Construction-Site aesthetic: stage band, craft strip with spark sweep, iframe curtain rise, ambient strip pulse, sidebar pip, all reduced-motion gated. Imported from `src/app/layout.tsx`. |
| `src/lib/engineering/step-taxonomy.ts` | Pure `deriveStep`, `deriveFileTouches`, `fileCount`, `currentFile`. Honest by default — no fake "step N of M" until worker emissions can ground a number. |
| `src/lib/engineering/error-translation.ts` | `translateBuildError(raw, { internalAccount })` — 10 priority matchers (M1–M10) + `scrubProviderTells`. |
| `src/lib/engineering/spend-estimate.ts` | `actualSpendCents` + `formatSpendUsd`. Pre-commit `estimateSpendCents` stubbed for Phase C. |
| `src/lib/engineering/in-flight.ts` | Server helper `getInFlightBuilds(supabase, accountId)` + the `InFlightBuild` type. |
| `src/hooks/useBuildSubscription.ts` | Realtime subscription with explicit `SubscriptionStatus` machine (`idle → subscribing → live → degraded → reconnecting → reconciling`). |
| `src/hooks/useBuildHeartbeat.ts` | 90s stuck-detection threshold; transitions to `investigating` for non-terminal builds. |
| `src/hooks/usePreviewIframe.ts` | Iframe lifecycle + 3s load timer + X-Frame-Options fallback detection. |
| `src/hooks/useBuildSession.ts` | Composes subscription + heartbeat + dedupe-by-id realtime reconcile. |
| `src/components/conduit/builds/cinema/BuildCinema.tsx` | Top-level cinema orchestrator. |
| `src/components/conduit/builds/cinema/BuildHeader.tsx` | Status pill + prompt + abort + back-to-builds + reconnecting/investigating pip. |
| `src/components/conduit/builds/cinema/BuildStageBand.tsx` | Step indicator (serif display) + elapsed + spend + soft progress ribbon. |
| `src/components/conduit/builds/cinema/BuildCraftStrip.tsx` | Horizontally-scrolling file chips with spark-sweep animation + most-recent pulse. |
| `src/components/conduit/builds/cinema/BuildPreviewStage.tsx` | Sandboxed iframe with curtain-rise reveal + fallback card on block. |
| `src/components/conduit/builds/cinema/BuildRawLogPanel.tsx` | Collapsed-by-default terminal panel + render-time provider-tell scrubbing. |
| `src/components/conduit/builds/cinema/BuildShippedSummary.tsx` | Terminal-state block: deploy URL + repo + stats + translated failure messaging with recovery affordance. |
| `src/components/conduit/builds/cinema/ReconnectingPip.tsx` | Degraded / reconciling / investigating indicator. |
| `src/components/conduit/builds/in-flight/EngineeringBuildStrip.tsx` | Workspace dashboard above-the-hero strip + 5s celebration / failure interstitial. |
| `src/components/conduit/builds/in-flight/SidebarBuildPip.tsx` | Small dept-tinted dot on the Builds sidebar entry. |
| `src/components/conduit/builds/in-flight/useInFlightBuilds.ts` | Account-scoped realtime subscription + celebration buffer. |

### Modified files

| Path | Change |
|---|---|
| `src/app/layout.tsx` | Imports `engineering-cinema.css`. (Root layout — applies to both marketing and console; CSS selectors are all `.praxis-root`-scoped so marketing is untouched.) |
| `src/app/app/layout.tsx` | Adds `getInFlightBuilds` server fetch in parallel with conversations; passes `accountId` + `inFlightBuildsInitial` to Sidebar. |
| `src/app/app/builds/page.tsx` | Backward-compat redirect: `?session=<id>` → `/app/builds/<id>`. |
| `src/app/app/workspace/page.tsx` | Renders `<EngineeringBuildStrip>` above `<PraxisLiveStrip>` / `<PraxisWelcomeHero>` (conditional on active builds). |
| `src/components/conduit/Sidebar.tsx` | Replaces the generic `<NavLink>` for /app/builds with a custom Link that hosts `<SidebarBuildPip>` overlaid on the icon. Accepts `accountId` + `inFlightBuildsInitial` props. |
| `src/components/conduit/engineering/EngineeringBuildButton.tsx` | On successful POST, `router.push(/app/builds/${id})` — no more in-memory `setActiveSessionId` / `<BuildSession>` mount. |
| `src/components/conduit/engineering/BuildsTabs.tsx` | Row click is now a `<Link href={/app/builds/${s.id}}>`; `?continue=<id>` opens the ContinueModal preloaded. Continuation create-success routes to the cinema URL. |
| `src/components/conduit/praxis/PraxisTeamRoster.tsx` | Engineering card's `href` flips to the cinema URL when in-flight; bottom-line copy reads "Building now →". |
| `CLAUDE.md` | Pointer flipped to `specs/engineering-build-trust/plan.md`. |
| `.specify/feature.json` | Pinned to the new feature directory. |

### Deleted files

| Path | Reason |
|---|---|
| `src/components/conduit/engineering/BuildSession.tsx` | Replaced by the cinema namespace. All callers migrated. |

---

## Root-cause closures

**(a) The "silent crash" was structural.** The old `BuildSession.tsx` lived
only inside a `useState<string | null>` modal mount. Any unmount — X button,
navigation, refresh, React render error — destroyed the only handle the user
had on a running build. The cinema route at `/app/builds/[session]` is the
durable replacement; the per-segment `error.tsx` (FR-012) catches uncaught
renders without dropping the user.

**(b) The "Failed to parse URL" failures were already fixed in commit `6931aad`**
(R2, 2026-05-12). The legacy rows the user saw in `/app/builds` were
historical; the new `translateBuildError` matcher M3 retroactively renders
those rows with a dignified "Earlier build couldn't reach the build service
(config issue, now fixed)" headline and a "Start a fresh build" affordance.
The `worker_url_missing` matcher M2 closes the residual gap (env var unset →
actionable operator hint).

---

## Honest progress, not a terminal dump

Three vertical stages replace the old full-screen monospace overlay:

1. **Stage band** — Step indicator (serif display, large), elapsed + spend +
   tokens on the right, ambient progress ribbon underneath. The step label is
   the dominant element above the fold.
2. **Craft strip** — Horizontally-scrolling file chips. Most-recent chip
   pulses (CSS opacity, 600ms infinite). On each new file event, a vertical
   spark bar sweeps left→right across the strip (CSS transform, 280ms).
3. **Preview stage** — Sandboxed iframe (`allow-scripts allow-same-origin`,
   `referrerPolicy=no-referrer`). When `deploy_url` first arrives, the iframe
   materializes via a 480ms clip-path curtain-rise. When the iframe is blocked
   by X-Frame-Options or CSP, falls back to a placeholder + "Open in new tab"
   affordance via `usePreviewIframe`'s 3s timer.

Raw terminal log lives in a `<details>` panel at the bottom, collapsed by
default. Provider-tell scrubbing (`scrubProviderTells` from
`error-translation.ts`) applies at render time inside the panel — the DB row
is untouched (Constitution Principle III).

---

## Resilience layer

- **`useBuildSubscription`** owns the realtime channel + a 5-state machine
  (`idle → subscribing → live → degraded → reconnecting → reconciling →
  live`). When Supabase JS reports `CHANNEL_ERROR` / `TIMED_OUT` / `CLOSED`,
  the state flips immediately; on `SUBSCRIBED` after a degraded period, it
  triggers a one-shot `GET /api/engineering/session/<id>` refetch and dedupes
  by `id`. A 1200ms "back online" celebration window precedes return to
  steady-state `live`.
- **`useBuildHeartbeat`** tracks the most-recent event timestamp and
  transitions to `investigating` if non-terminal status sees no event for 90s.
  Sticky until a manual "Refresh now" click or a new event arrives.
- **Cinema error boundary** uses Next.js 16's `unstable_retry` (with a `reset`
  fallback) — "Reopen the live view" rewinds the segment cleanly. The
  `deploy_url` is echoed to `sessionStorage` before any crash so the error
  page can still offer "Open last-known preview" if a deploy already shipped.

---

## In-flight ambient surfaces

- **`EngineeringBuildStrip`** sits at the top of `/app/workspace`, above
  `PraxisLiveStrip` (voice strip) and `PraxisWelcomeHero`. Reuses the
  `.praxis-live-strip` CSS shell with `data-dept="engineering"`. Eyebrow
  reads `BUILDING · <step>`; meta shows elapsed + file count. Whole strip is
  a `<Link>` to the cinema URL.
- **`SidebarBuildPip`** is a small dept-tinted dot at the icon's top-right
  corner of the `/app/builds` sidebar entry. Pulses (2.4s opacity) when ≥ 1
  build is in flight; clears within 5s of all builds reaching terminal.
- **`PraxisTeamRoster`** Engineering card now routes to the cinema URL when
  in-flight (overriding the team-page route for the duration of the build).
  Bottom-line copy updated from "1 build in flight" to "Building now →".
- All three surfaces consume the same `useInFlightBuilds` account-scoped
  realtime subscription on `account-builds:<accountId>`.
- Multi-build: strip shows the most-recently-started + "+N more" → routes to
  `/app/builds`.
- Celebration interstitial: 5s "JUST SHIPPED · <prompt>" or "BUILD FAILED ·
  <prompt>" before unmount.

---

## Aesthetic: "The Construction Site"

The frontend-design skill's principles applied inline (per user's GATE 2
directive). The one memorable moment is the iframe materialization (curtain
rise). Engineering dept tint (rust/orange via `--color-dept-engineering` and
the `data-dept` cascade in `praxis-system.css:564-572`) drives a subtle
gradient mesh background. Display type is the Praxis Fraunces serif
(`--font-serif`); file paths use the Praxis JetBrains Mono monospace
(`--font-mono`). All ambient motion is CSS keyframes only — zero JS animation
loops. Reduced-motion preferences honored via `@media not (prefers-reduced-
motion: reduce)` at every keyframe gate.

---

## Verification

- `npx tsc --noEmit` — clean.
- `npm run build` — clean. The dynamic route `/app/builds/[session]` is
  registered in the route table.
- `quickstart.md` recipes §1, §2, §3, §6, §7 are the preview-deploy verification
  matrix. **Phase A is deliberately stopped HERE for user preview validation
  before Phase B/C unlock.**

### What to exercise on preview

1. From `/app/team/engineering`, click **Start a build**. Type any prompt.
   Submit. Confirm browser navigates to `/app/builds/<uuid>` and the cinema
   loads.
2. Watch the stage band, craft strip, preview iframe — does the build feel
   alive without being a terminal dump?
3. Hit Cmd-R mid-build. Cinema repopulates — no data loss visible.
4. Navigate to `/app/workspace`. Confirm the in-flight strip is at the top.
5. Check the sidebar — Builds entry has a dept-tinted pip when in flight.
6. When the build completes, watch the iframe curtain-rise + the strip's
   5-second celebration → disappearance.
7. Visit a historical failed row in `/app/builds`. Confirm the legacy
   `worker_start_*` strings render as human messages (matcher M3).

---

## Deferred (Phase B / Phase C)

Per user GATE 3 directive — held until Phase A preview-validates:

- **Phase B (P2):** failure-dignity rollout to `/app/builds` index + team-card
  failure state; copy-URL affordance in cinema header; 404 polish; share-URL
  toast.
- **Phase C (P3):** chat-pulse synchronization on Engineering's avatar;
  pre-commit cost estimate in the build modal.

---

## Follow-ups

- **Step taxonomy refinement (R-006 / FR-017)** — the pinned default taxonomy
  is grounded in observable `WRITE`/`EDIT` emissions + session-status enum.
  Inspect actual worker logs during preview verification; refine
  `step-taxonomy.ts` rules 5a/5b if richer phase signals exist (install,
  vercel deploy stages). Code-only change inside `step-taxonomy.ts` — no
  spec / plan re-gate needed.
- **`?session=<id>` redirect testing** — verified by build success but worth
  exercising on preview against an actual session ID.
- **Multi-build celebration overlap** — when two builds finish within 5s of
  each other, the strip shows the LATEST celebration. Earlier celebration is
  preempted. Acceptable Phase A behavior; could refine in Phase B if it
  comes up.
- **Provider-tell regex coverage** — current pattern matches `claude`,
  `anthropic`, `openai`, `sonnet`, `opus`, `haiku`, `gpt*`, `elevenlabs`,
  `livekit`. If new provider nouns surface in worker output, extend the
  regex.
- **`.specify/feature.json`** flipped to `specs/engineering-build-trust/`;
  flip back when this round closes if subsequent work touches the redesign
  spec.

---

## Constitution gates (re-verified post-implementation)

| # | Verdict |
|---|---|
| 0 | PASS — no invented domain content; step taxonomy grounded in observable emissions. |
| I | PASS — Next.js 16 dynamic route + error boundary patterns per `node_modules/next/dist/docs/01-app/01-getting-started/{03-layouts-and-pages,10-error-handling}.md`. `src/proxy.ts` untouched. |
| II | PASS — zero migrations, zero new columns. RLS preserved via existing `conduit_engineering_*` policies. |
| III | PASS — provider-tell scrubbing applied at render time in cinema's raw-log panel + error-summary disclosure. The implementation closes a *pre-existing latent gap* in the old `BuildSession.tsx`. |
| IV | PASS — all new files under `/app/app/builds/[session]/`, `/components/conduit/builds/`, `/hooks/`, `/lib/engineering/`. Zero marketing imports. |
| V | PASS — material milestone session report (this document); preview-verification matrix in `quickstart.md`. **375/390 mobile + light/dark + reduced-motion sweep is the user's preview deploy gate.** |
| VI | PASS — phased rollout; Phase A merges to main as one validated slice. No long-running branches anticipated for Phase B/C. |

---

## End of Phase A.
