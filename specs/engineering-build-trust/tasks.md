# Tasks — Engineering Build Trust (R16)

**Input**: Design documents from `specs/engineering-build-trust/`
**Status**: GATE 3 approved 2026-05-23. Phase A targeted now; Phase B + C deferred until Phase A is preview-validated.

**Convention**:
- `[ID]` task identifier
- `[P]` parallel-safe (different files, no dependencies)
- `[US?]` user-story tag where applicable
- File paths are absolute from repo root

**Tests**: No automated tests per Constitution Principle V. Verification is the `quickstart.md` matrix on Vercel preview + Material-Milestone session report.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Directory + feature pin.

- [ ] **T001** Create new directory `src/components/conduit/builds/` with subdirectories `cinema/` and `in-flight/`.
- [ ] **T002** Update `.specify/feature.json` to pin `"feature_directory": "specs/engineering-build-trust"` for the duration of this work.

---

## Phase 2: Foundational (Blocking — A1 in `plan.md`)

**Purpose**: Pure-TS modules + hooks that every Phase 3+ task depends on. **NO** surface changes; nothing user-visible.

**⚠️ BLOCKING — no Phase 3 task starts until all of Phase 2 is complete.**

- [ ] **T003** [P] Write `src/lib/engineering/step-taxonomy.ts` exporting `deriveStep`, `deriveFileTouches`, and the `Step` / `StepKind` / `FileTouch` types per `contracts/step-taxonomy.md`.
- [ ] **T004** [P] Write `src/lib/engineering/error-translation.ts` exporting `translateBuildError`, `scrubProviderTells`, and the `TranslatedError` / `Recovery` types per `contracts/error-translation.md`.
- [ ] **T005** [P] Write `src/lib/engineering/spend-estimate.ts` exporting `estimateSpend(prompt, buildType, tier)` → `{ minCents, maxCents }` and `actualSpend(inputTokens, outputTokens, tier)` → `cents`. Reads tier rates from `src/lib/billing/tiers.ts`. (Heuristic only — Phase C uses it for pre-commit estimate; Phase A uses `actualSpend` only.)
- [ ] **T006** [P] Write `src/lib/engineering/in-flight.ts` exporting `getInFlightBuilds(supabase, accountId)` server helper and the `InFlightBuild` type per `data-model.md §2.1`.
- [ ] **T007** [P] Write `src/hooks/useBuildSubscription.ts` per `data-model.md §2.4`. Wraps Supabase realtime subscription with explicit `SubscriptionStatus` state machine. Accepts `{ sessionId, onLog, onSession }`. Returns `{ status, reconcile }`.
- [ ] **T008** [P] Write `src/hooks/useBuildHeartbeat.ts` per `data-model.md §2.5`. Tracks last-event timestamp; transitions to `investigating` at 90s no-event threshold for non-terminal status.
- [ ] **T009** [P] Write `src/hooks/usePreviewIframe.ts` per `data-model.md §2.6`. Owns iframe lifecycle, 3s load timer, blocked detection.
- [ ] **T010** Write `src/hooks/useBuildSession.ts` — composes T007 + T008 + the GET backfill. Returns `{ session, logs, files, step, heartbeat, subscription, refresh }`. Depends on T003, T004, T007, T008.

**Checkpoint Phase 2**: Foundations compile clean (`npx tsc --noEmit`); no surface change yet.

---

## Phase 3: User Story 1 + 2 + 3 — P1 Bundle (the deployable slice — A2/A3/A4/A5 in plan.md) 🎯 MVP

**Goal**: Cinema at `/app/builds/[session]`; in-flight strip on `/app/workspace`; sidebar pulse; team-card affordance; resilience layer wired across all surfaces. The P1 bundle ships as one.

**Independent Test**: Walk `quickstart.md §1 §2 §3` on the Vercel preview deploy.

### 3.1 — Cinema route + components (A2)

- [ ] **T011** [US1+US2] Write `src/app/app/builds/[session]/page.tsx` (server component) per `contracts/cinema-route.md §2`. Backfills session + last 200 logs, mounts `<BuildCinema>` inside `<PraxisCanvasTintProvider initialDept="engineering">`.
- [ ] **T012** [US1] Write `src/app/app/builds/[session]/error.tsx` ("use client") per `contracts/cinema-route.md §5`. Uses `unstable_retry` defensively.
- [ ] **T013** [P] [US2] Write `src/components/conduit/builds/cinema/BuildHeader.tsx` — status pill + prompt + abort + close + copy-URL (copy-URL deferred to Phase B; rest now).
- [ ] **T014** [P] [US2] Write `src/components/conduit/builds/cinema/BuildStageBand.tsx` — step indicator (serif display, large) + elapsed + spend tally + ambient progress ribbon.
- [ ] **T015** [P] [US2] Write `src/components/conduit/builds/cinema/BuildCraftStrip.tsx` — horizontally-scrolling file chips with spark animation + most-recent pulse.
- [ ] **T016** [P] [US2] Write `src/components/conduit/builds/cinema/BuildPreviewStage.tsx` — iframe + curtain-rise reveal + blocked fallback per `data-model.md §2.6`.
- [ ] **T017** [P] [US2] Write `src/components/conduit/builds/cinema/BuildRawLogPanel.tsx` — collapsed disclosure with terminal-treatment scroll + provider-tell scrubbing at render time.
- [ ] **T018** [P] [US2] Write `src/components/conduit/builds/cinema/BuildShippedSummary.tsx` — terminal-state summary (deploy URL, repo link, file count, elapsed, tokens, spend, "Continue from this build" affordance).
- [ ] **T019** [P] [US1] Write `src/components/conduit/builds/cinema/ReconnectingPip.tsx` — realtime drop indicator + investigating treatment.
- [ ] **T020** [US1+US2] Write `src/components/conduit/builds/cinema/BuildCinema.tsx` — top-level orchestrator. Consumes `useBuildSession`. Composes T013–T019.

### 3.2 — Wire callers to cinema URL (A2 cont.)

- [ ] **T021** [US1] Modify `src/components/conduit/engineering/EngineeringBuildButton.tsx`: on successful `POST /api/engineering/session`, `router.push('/app/builds/${session_id}')` instead of `setActiveSessionId`. Remove the local `<BuildSession>` mount.
- [ ] **T022** [US1] Modify `src/components/conduit/engineering/BuildsTabs.tsx`: row click navigates via Next.js `<Link>` to `/app/builds/<id>` instead of `onOpen(s.id)` modal mount. Remove the local `<BuildSession>` mount.
- [ ] **T023** [US1] Modify `src/app/app/builds/page.tsx`: when `?session=<id>` is present in search params, server-side redirect to `/app/builds/<id>` for backward compat.

### 3.3 — In-flight ambient surfaces (A3)

- [ ] **T024** [P] [US3] Write `src/components/conduit/builds/in-flight/useInFlightBuilds.ts` per `contracts/in-flight-tile.md §2`. Server-render initial via T006; client subscription on `account-builds:<accountId>` channel; 5s celebration buffer.
- [ ] **T025** [P] [US3] Write `src/components/conduit/builds/in-flight/EngineeringBuildStrip.tsx` per `contracts/in-flight-tile.md §3`. Mirrors `PraxisLiveStrip` structure.
- [ ] **T026** [P] [US1+US3] Write `src/components/conduit/builds/in-flight/SidebarBuildPip.tsx` per `contracts/in-flight-tile.md §4`. Small dept-tinted dot.
- [ ] **T027** [US3] Modify `src/app/app/workspace/page.tsx`: import `getInFlightBuilds` + `EngineeringBuildStrip`; render the strip conditionally above the existing `PraxisLiveStrip` (voice strip), which itself remains above `PraxisWelcomeHero`.
- [ ] **T028** [US1+US3] Modify `src/components/conduit/Sidebar.tsx`: mount `SidebarBuildPip` on the `/app/builds` entry; sourced from a server-rendered initial that gets refreshed via the same `useInFlightBuilds` hook (or a thin server-component wrapper that reads from `getInFlightBuilds`).
- [ ] **T029** [US1+US3] Modify `src/components/conduit/praxis/PraxisTeamRoster.tsx:236-237`: replace the static `"1 build in flight"` copy with a `<ClickInterceptor>` wrapping a `<Link>` to `/app/builds/<in_flight_build_id>` displaying `"Building now →"`.

### 3.4 — CSS + motion polish (A5)

- [ ] **T030** Write `src/styles/engineering-cinema.css` with:
  - Cinema layout (stage band, craft strip, preview stage) — mobile reflow at ≤ 640 px.
  - File chip enter (180 ms scale-up + opacity).
  - Spark bar sweep (280 ms transform-only).
  - Most-recent chip pulse (600 ms infinite opacity).
  - Iframe curtain rise (480 ms clip-path + 240 ms opacity overlap).
  - Ambient strip pulse (2.4 s infinite opacity, used by both EngineeringBuildStrip + SidebarBuildPip).
  - Celebration (1.8 s one-time scale + opacity).
  - Stage-band entrance on cinema mount (280 ms translate + opacity).
  - Engineering dept-tint canvas gradient mesh (low-opacity radial).
  - `[data-reduced-motion="true"]` overrides on all of the above (motion off or opacity-only fallback).
- [ ] **T031** Import `engineering-cinema.css` from `src/app/globals.css` (or wherever `praxis-system.css` is already imported, mirroring that pattern).

### 3.5 — Cleanup + verification (A6)

- [ ] **T032** Delete `src/components/conduit/engineering/BuildSession.tsx`. Confirm no remaining imports via grep (`grep -rn "BuildSession" src/ | grep -v "specs/" | grep -v ".md"`).
- [ ] **T033** Run `npx tsc --noEmit` — must be clean.
- [ ] **T034** Run `npm run build` — must produce a successful production build.
- [ ] **T035** Update `CLAUDE.md` line referencing "current plan" to point to `specs/engineering-build-trust/plan.md`.
- [ ] **T036** Write `SESSION_REPORT_2026-05-23_ENGINEERING_BUILD_TRUST.md` at repo root capturing: decisions taken during implementation, deviations from the plan (if any), step-taxonomy refinements (if any from manual log inspection), files added/deleted, verification status (anything caught at type-check time, anything deferred to preview deploy).

**Checkpoint Phase 3 (= Phase A end)**: P1 bundle complete. Stop and validate on Vercel preview per `quickstart.md §1–§3 + §6 + §7`. **DO NOT START PHASE B (P2) OR PHASE C (P3) UNTIL THIS CHECKPOINT IS USER-APPROVED.**

---

## Phase 4: User Story 4 + 5 — P2 (deferred — Phase B in plan.md)

**Status**: DEFERRED. Held until Phase A is preview-validated.

- T037–T045 — failure-dignity wiring across all surfaces, historical retro-translation, share-URL affordance, copy-to-clipboard, 404 handling.

---

## Phase 5: User Story 6 + 7 — P3 (deferred — Phase C in plan.md)

**Status**: DEFERRED. Held until Phase B ships and feedback lands.

- T046–T052 — chat-pulse synchronization, pre-commit cost estimate, final-cost rendering.

---

## Phase 6: Polish & Cross-Cutting (rolled into A5/A6 above for Phase A)

For Phase A: see T030 (CSS polish) + T032–T036 (verification + report).

For Phase B/C: their own polish + report supplements.

---

## Dependencies & Execution Order

**Phase 1 → Phase 2 → Phase 3 → (Phase 4) → (Phase 5)**.

Within Phase 2: T003–T009 are [P] (different files, no inter-dependencies); T010 depends on T003, T004, T007, T008.

Within Phase 3:
- 3.1 (cinema components): T011–T019 are [P] within themselves; T020 depends on all of T013–T019. T011/T012 (route files) depend on T020 existing.
- 3.2 (caller wiring): T021–T023 depend on T011 existing (the route they target).
- 3.3 (in-flight): T024–T026 are [P] within themselves; T027 depends on T024+T025; T028 depends on T024+T026; T029 is independent of in-flight files (just needs cinema URL to exist, i.e. T011).
- 3.4 (CSS): T030 depends on all components existing so the selectors match; T031 depends on T030.
- 3.5 (cleanup): T032 depends on T021+T022 (callers migrated off `BuildSession.tsx`); T033/T034 depend on everything before; T035/T036 last.

**Critical path**: T001 → T002 → (T003 || T004 || T005 || T006 || T007 || T008 || T009) → T010 → T011 → T012, T020 (parallel with T013–T019 building blocks) → T021/T022/T023 → T024/T025/T026 → T027/T028/T029 → T030/T031 → T032/T033/T034 → T035/T036.

---

## Implementation strategy

**Phase A end-to-end is the deployable validated slice.** Within Phase A, the order above sequences for merging discipline but **all of Phase A is one preview-validated gate** — the user verifies the bundle as a whole, then approves Phase B/C entry.

Per the user's GATE 3 directive: stop at the end of Phase A. No Phase B or C until the user has deployed the preview and watched a real build land.
