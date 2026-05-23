---
description: "Implementation tasks — Praxis Console Premium Redesign (R15)"
---

# Tasks: Praxis Console — Premium Visual Redesign (R15)

**Input**: Design documents from `/specs/praxis-console-premium-redesign/`

**Prerequisites**: spec.md (GATE 1 ✓), plan.md (GATE 2 ✓ — all 7 gates
PASS, zero waivers), research.md, data-model.md, contracts/

**Tests**: NO automated tests added — by intent per Constitution Principle V
("no automated test suite — by intent given the velocity model").
Verification is preview deploy + mobile sweep + light/reduced-motion
sweep per `quickstart.md`.

**Organization**: Tasks grouped by phase per plan.md §Phasing. Within
each user-story phase, tasks are independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]** — can run in parallel with other [P]-tagged tasks in the same
  phase (different files, no dependencies)
- **[US1]/[US2]/[US3]/[US4]/[US5]** — story scope from spec.md
- Includes exact file paths

---

## Phase 1: Setup (Pre-Phase A — shared prep)

**Purpose**: prepare the working environment so all subsequent phases can
proceed without infrastructure friction.

- [ ] T001 Run `npm install` to populate `node_modules/` (Principle I
      pre-requisite per research R-011).
- [ ] T002 Confirm `node_modules/next/dist/docs/` exists and read the
      three guides flagged in R-011: `01-app/01-getting-started/15-route-handlers.md`,
      `01-app/01-getting-started/05-server-and-client-components.md`,
      `01-app/03-api-reference/05-config/01-next-config-js/`. If any
      guide disagrees with the plan, STOP and revise the affected
      research entry before continuing (Constitution Principle I — docs
      win over training data).
- [ ] T003 Update `.specify/feature.json` to pin the active feature
      directory to `specs/praxis-console-premium-redesign/` (mirror the
      voice-room precedent so Spec Kit tooling targets the right
      directory).
- [ ] T004 Update `CLAUDE.md` line `current plan` pointer to
      `specs/praxis-console-premium-redesign/plan.md`.

---

## Phase 2: Foundational (Blocking Prerequisites — Phase A in plan)

**Purpose**: extend the token sheet and ship the CSS system + the
shared reduced-motion hook + the design-system doc skeleton. **NO
component or surface work begins until this phase completes.**

⚠️ **CRITICAL**: every Phase 3+ task depends on at least one token or
class defined here.

- [ ] T005 [P] Extend `src/styles/praxis-tokens.css` with the 9
      `--rhythm-{dept}` tokens (per data-model.md §1.8) under
      `.praxis-root`, plus a `@media (max-width: 640px)` block applying
      the 1.2× mobile multiplier. Locked values per FR-054.
- [ ] T006 [P] Extend `src/styles/praxis-tokens.css` with the 8-step
      `--space-{1..10}` scale and 3 `--space-card-{sm,md,lg}` presets
      under `.praxis-root` (data-model.md §1.3, §1.4).
- [ ] T007 [P] Extend `src/styles/praxis-tokens.css` with the 4
      `--radius-*` tokens under `.praxis-root` (data-model.md §1.5).
- [ ] T008 [P] Extend `src/styles/praxis-tokens.css` with the
      `--text-display-*`, `--text-eyebrow`, `--text-microlabel`,
      `--text-body-*`, `--text-numeric-*` tokens under `.praxis-root`
      (data-model.md §1.6).
- [ ] T009 [P] Extend `src/styles/praxis-tokens.css` with the 6
      `--elev-{rest,hover}-{1,2,3}` tokens, dark theme defaults +
      light-theme overrides under `html[data-praxis-theme="light"]
      .praxis-root` (data-model.md §1.7).
- [ ] T010 [P] Extend `src/styles/praxis-tokens.css` with the 5
      `--tint-{dept}-*` derivations (wash, wash-strong, glow, edge,
      radial) for each of 9 depts — 45 declarations total — using
      `color-mix()` per data-model.md §1.2. Include the Atlas exception
      for `--tint-jarvis-wash` and `--tint-jarvis-wash-strong`
      (neutral warm fallback).
- [ ] T011 [P] Extend `src/styles/praxis-tokens.css` with motion
      tokens: `--praxis-ease-out-quart`, `--praxis-ease-in-out-quart`,
      `--praxis-ease-baton`, `--lift-card` (data-model.md §1.8).
- [ ] T012 Create `src/styles/praxis-system.css`. Import (or instruct
      `globals.css` to import) this sheet so it lands in the bundle.
      Add the file-level header comment naming this sheet's scope and
      its companion relationship to `praxis-tokens.css`.
- [ ] T013 In `src/styles/praxis-system.css`, author `@keyframes
      praxis-pulse`, `praxis-pulse-streaming`, `praxis-pulse-celebration`,
      `praxis-breath`, `praxis-baton`, `praxis-wash-in`, `praxis-wash-out`,
      `praxis-time-fade` per FR-055. Wrap each in
      `@media not (prefers-reduced-motion: reduce)` per FR-057 / R-010.
- [ ] T014 In `src/styles/praxis-system.css`, author `.praxis-card`
      base + variant modifiers (`.praxis-card-kpi`,
      `.praxis-card-team`, `.praxis-card-stat`, `.praxis-card-activity`)
      per contracts/primitives.md P-001 and data-model.md §2.1. Each
      consumes `--space-card-*`, `--radius-card`, `--elev-*`, and
      `--tint-{dept}-*` via the `--dept` custom property.
- [ ] T015 In `src/styles/praxis-system.css`, author `.praxis-avatar`
      base + `.praxis-avatar-atlas` + `.praxis-avatar-ghosted` per
      P-002. Includes inset highlight ring, inner gradient gloss, lock
      glyph slot, ghosted filter.
- [ ] T016 In `src/styles/praxis-system.css`, author `.praxis-pulse`
      (with `data-state` modifiers) per P-003 and `.praxis-pulse-pip`
      utility class per P-004. Conflict-resolution precedence
      (streaming > celebration > ambient) implemented via selector
      specificity per FR-060.
- [ ] T017 In `src/styles/praxis-system.css`, author
      `.praxis-canvas-tint` with 9 `[data-dept="{dept}"]` rules and
      9 `[data-tint-strength="strong"][data-dept="{dept}"]` rules per
      P-005 / data-model.md §2.7. `transition: background 240ms
      var(--praxis-ease-out-quart);` on the base class.
- [ ] T018 In `src/styles/praxis-system.css`, author
      `.praxis-eyebrow`, `.praxis-microlabel`, `.praxis-tag-locked`
      per data-model.md §2.5.
- [ ] T019 In `src/styles/praxis-system.css`, author
      `.praxis-composer-pill` (rest / focus / streaming states) per
      data-model.md §2.6 / P-010.
- [ ] T020 In `src/styles/praxis-system.css`, author
      `.praxis-handoff-baton` per data-model.md §2.8 / P-009 — `from →
      to` left-edge color transition.
- [ ] T021 In `src/styles/praxis-system.css`, author
      `.praxis-live-strip` per data-model.md §2.9 / P-007 — waveform
      pulse using staggered `wave1/2/3`-style keyframes from
      `globals.css` as the pattern.
- [ ] T022 In `src/styles/praxis-system.css`, author
      `.praxis-welcome-hero` per data-model.md §2.10 / P-006 — applies
      `praxis-breath` keyed to `data-activity-bucket` attribute.
- [ ] T023 [P] Create `src/hooks/useReducedMotion.ts` per P-005 —
      SSR-safe wrapper around `matchMedia('(prefers-reduced-motion:
      reduce)')` with change subscription. Single source for all JS-
      side motion gating per FR-059.
- [ ] T024 Create `docs/praxis-design-system.md` v1 — at minimum,
      §1 Tokens (every token from contracts/tokens.md with example
      values in both themes) and §4 Motion vocabulary (the
      reduced-motion policy table per FR-057). §2 Primitives and §3
      Surface map remain placeholders to be filled at Phase E.
- [ ] T025 Verify Phase 2 visually with a temporary scratch route at
      `src/app/app/_scratch/page.tsx` (gitignored after verification)
      rendering one of each primitive against the token sheet.
      Confirms tokens load, keyframes fire, hover-glow consumes the
      right `--dept`, reduced-motion suppresses correctly. **Delete
      the scratch route before the Phase 2 PR merges.**

**Checkpoint — End of Phase 2**: tokens + keyframes + utility classes
land in the bundle; no consumers yet. The visual scratch route confirms
the system *exists and renders*. **PR opens against `main`; preview
verification per quickstart.md §7; merge fast-forward; STOP-and-VALIDATE
checkpoint.**

---

## Phase 3: Foundational Components (Plan Phase B)

**Purpose**: Ship the 11 components + 2 copy modules + 1 server helper +
1 GET route handler. **NO surface work begins until this phase
completes.**

- [ ] T026 [P] Create `src/components/conduit/praxis/usePraxisTint.ts`
      — the client hook returning the canvas-tint state machine API per
      data-model.md §3 / P-004.
- [ ] T027 Create
      `src/components/conduit/praxis/PraxisCanvasTintProvider.tsx` —
      `"use client"` provider per P-004 / R-005. Subscribes to
      `conduit:stream` window event; uses `usePathname()` for per-
      route defaults; writes `data-dept` + `data-tint-strength` to the
      nearest `.praxis-canvas-tint` ancestor. Consumes
      `useReducedMotion()` to collapse the transition duration to 0
      when reduced. Depends on T023, T026.
- [ ] T028 [P] Create `src/components/conduit/praxis/PraxisAvatar.tsx`
      — server-safe per P-002. Reads `EMPLOYEES` and `EMPLOYEE_ICON`
      from `src/lib/conduit/employees.ts` and
      `src/components/conduit/EmployeeBadge.tsx` respectively (re-
      exports stay where they are; do not duplicate).
- [ ] T029 [P] Create `src/components/conduit/praxis/PraxisPulsePip.tsx`
      — server-safe per P-003.
- [ ] T030 [P] Create `src/components/conduit/praxis/PraxisCard.tsx`
      — server-safe per P-001. Variants `kpi | team | stat | activity`;
      `locked` flag; `href` toggles `<Link>` vs `<div>`. Forwards
      `--dept` style property to the wrapper when `dept` prop is set.
- [ ] T031 Create `src/lib/conduit/welcome-copy.ts` per R-009 — exports
      `composeWelcomeCopy({ firstName, hoursSinceLastVisit, timeOfDay,
      primaryEvent }): WelcomeCopy` and `composeChatEmptyCopy({
      firstName, timeOfDay, allowedEmployees }): { eyebrow, headline,
      subline }`. Deterministic templating only — no LLM calls. ~32
      variants per copy ladder, all statically auditable in this file.
      Principle Zero applies: every placeholder must map to a real row
      value.
- [ ] T032 Create `src/lib/conduit/team-activity.ts` — server-side
      helper that the new GET route and the dashboard server render
      both consume. Returns the per-employee activity bundle shape
      from data-model.md §6: `{ employees: { [id]: { last_active_at,
      last_artifact_title, last_artifact_created_at, in_flight_build_id,
      top_lead_score, top_lead_name } }, voice_live: {...} | null }`.
      Reads existing `conduit_*` tables only — no schema changes.
- [ ] T033 Create `src/app/api/conduit/team-activity/route.ts` — GET
      handler per data-model.md §6 / contracts/surfaces.md. Auth via
      `getCurrentAccount()` (returns 401 if no session); RLS-scoped
      Supabase server client. Returns JSON from `team-activity.ts`
      helper. **Pre-merge: confirm pattern matches the Next 16 docs
      read in T002.**
- [ ] T034 [P] Create
      `src/components/conduit/praxis/PraxisWelcomeHero.tsx` — server-
      safe per P-006. Consumes `WelcomeCopy` from T031; renders
      `data-activity-bucket` attribute computed from
      `hoursSinceLastVisit` and the team-activity payload.
- [ ] T035 [P] Create
      `src/components/conduit/praxis/PraxisLiveStrip.tsx` —
      `"use client"` per P-007. Waveform pulse + rejoin CTA in the
      live-employee's color.
- [ ] T036 [P] Create
      `src/components/conduit/praxis/PraxisSuggestionTile.tsx` —
      server-safe — chat empty-state tile (dept avatar +
      attribution + prompt text). Replaces the inline
      `.conduit-suggestion` rendering inside the redesigned EmptyState.
- [ ] T037 Create
      `src/components/conduit/praxis/PraxisTeamRoster.tsx` —
      `"use client"` per P-008. Renders 9 `PraxisCard variant="team"`
      in opinionated order from FR-004; subscribes to the
      team-activity poll (60s, visibility-gated per R-002); detects
      newly-shipped artifacts per R-008's session-mounted-at
      comparison; fires `praxis-pulse-celebration` once per genuine
      ship event during the session window. Calls
      `useDeptTint().setHoverDept` on hover. Initiates View Transitions
      API page-transition on card click per R-001 (with fallback when
      `document.startViewTransition` is unavailable or `useReduced
      Motion()` is true). Depends on T026, T030, T032, T033.
- [ ] T038 [P] Create
      `src/components/conduit/praxis/PraxisHandoffBaton.tsx` —
      `"use client"` per P-009. Animates left-edge `from → to`
      colors over 480ms with `--praxis-ease-baton`.
- [ ] T039 Create
      `src/components/conduit/praxis/PraxisComposerPill.tsx` —
      `"use client"` per P-010. Refactor of the current composer markup
      from `Chat.tsx:743–880`. Calls `useDeptTint().setPinDept(pin)` on
      every pin change. Streaming state pulses only the avatar slot.
      Depends on T026.
- [ ] T040 Verify Phase 3 visually by extending the scratch route from
      T025 to mount each new component with mock data. Confirm:
      provider context flows; the page-transition wrapper falls back
      cleanly when `document.startViewTransition` is unavailable; the
      team-activity poll fires and pauses on tab-hide; reduced-motion
      suppresses the baton + celebration + pulses. **Delete scratch
      mounts before the Phase 3 PR merges.**

**Checkpoint — End of Phase 3**: every component exists and renders in
isolation; no surface consumes them yet. PR opens, preview verified,
merged fast-forward.

---

## Phase 4: User Story 1 — Dashboard Living Command Center (P1 — TIED with US2)

**Goal**: `/app/workspace` becomes a returning-user landing surface that
carries the "living workforce" thesis at first paint.

**Independent Test**: per spec.md Story 1 ACs 1–5; verification recipe
per quickstart.md §2.

**Dependencies**: Phase 2 ✓ (tokens + system CSS), Phase 3 ✓
(components). US1 and US2 ship together per GATE 1 decision (P1 tied);
implementation order within this phase is interleaved.

- [ ] T041 [US1] Modify `src/app/app/layout.tsx` per contracts/
      surfaces.md S-004: wrap `{children}` inside
      `PraxisCanvasTintProvider`; add `.praxis-canvas-tint` class to the
      `<main className="conduit-canvas ...">` element. Keep the
      existing dynamic + auth + Sidebar wiring intact. This is the
      single layout change.
- [ ] T042 [US1] Refactor `src/app/app/workspace/page.tsx` to
      consume the team-activity helper (T032) as part of its existing
      `Promise.all` block (the new helper bundles the per-dept activity
      reads more efficiently than the current 6-query fan-out). Return
      the bundle to client components via props. Preserve existing
      ordering of the four KPI inputs.
- [ ] T043 [US1] Recompose `src/app/app/workspace/page.tsx` body to
      render (in order): `PraxisLiveStrip` (when `voice_live` is
      non-null) → `PraxisWelcomeHero` (with `composeWelcomeCopy()`
      result) → row of 4 `PraxisCard variant="kpi"` → eyebrow "Your
      team" → `PraxisTeamRoster`. Remove all references to
      `.conduit-card`, `.conduit-suggestion`, `.live-dot`,
      `.employee-pulse`, `border-l-[3px]`, and any inline
      `text-[Npx]/min-h-[Npx]/px-[Np]` utilities on this file.
- [ ] T044 [US1] Wire the dashboard's `initialDept` for
      `PraxisCanvasTintProvider` to the most-recently-active employee
      computed by T032. (Note: the provider is mounted in the layout;
      this task surfaces the initial value through layout props or a
      page-level helper — pick the simpler path at implementation time
      and document the choice in T024's design-system doc.)
- [ ] T045 [US2] Confirm `PraxisTeamRoster` (T037) renders all 9
      employees from `EMPLOYEE_ORDER`, with `allowed` resolved against
      the current account's `tierById(account.tier_id).allowedEmployees`
      (existing helper in `src/lib/billing/tiers.ts`). Locked
      employees render with `locked={true}` on `PraxisCard`; click
      routes to `/app/settings/billing`.
- [ ] T046 [US2] Confirm the roster's hover-tint flow: hovering a card
      calls `useDeptTint().setHoverDept(employeeId)`; leaving clears
      it. The canvas wash transitions per the locked 240ms-in/480ms-
      out cadence (FR-011) via the CSS `transition` on
      `.praxis-canvas-tint`.
- [ ] T047 [US2] Confirm the page-transition continuity from a roster
      card → `/app/team/[employee]` works per R-001 + S-002: the
      destination header band picks up the source card's tint within
      360ms. Verified by recording the transition and frame-stepping.
- [ ] T048 [US1+US2] Mobile sweep at 375px and 390px per quickstart.md
      §7. Confirm: dashboard hero readable; KPI row collapses
      gracefully; team grid → 2 columns; tap targets ≥44px;
      `--rhythm-*` mobile multiplier in effect; no horizontal scroll.
- [ ] T049 [US1+US2] Light-theme sweep at desktop + 375 + 390. Confirm:
      both themes hold; no per-component overrides needed; KPI tile
      "elevated material" reads as elevated in light theme too.
- [ ] T050 [US1+US2] Reduced-motion sweep at desktop. Confirm: no
      ambient pulses; no canvas-tint transition (hard swap); no breath
      on hero; no celebration animation (one-frame static flash only);
      surface remains fully legible and identity-preserving.
- [ ] T051 [US1+US2] Grep verification on `src/app/app/workspace/page.tsx`
      and `src/app/app/layout.tsx` for arbitrary Tailwind utilities and
      hex literals per quickstart.md §5. Expected: zero hits.

**Checkpoint — End of Phase 4 (P1 TIED)**: `/app/workspace` is fully
rebuilt on the new system. Dashboard + team grid carry the thesis.
**STOP-and-VALIDATE per spec-toolkit flow.** Open PR; preview verify
end-to-end; show to user; await go/no-go before Phase 5.

---

## Phase 5: User Story 1 + 2 follow-on — Team Page Header (still P1)

**Purpose**: complete the P1 surface by updating the team-page header
band so the click-through from the dashboard lands on a redesigned
surface (not on a still-old header that breaks visual continuity).

- [ ] T052 [US2] Modify `src/app/app/team/[employee]/page.tsx` header
      band per contracts/surfaces.md S-002: replace the current
      `linear-gradient(135deg, colorSoft, transparent)` header block
      with a `PraxisCanvasTintProvider` (NOT a nested provider — the
      layout already provides one; this is just `setRouteDept` via the
      hook on mount, page-side), `PraxisAvatar size="2xl"`, eyebrow,
      `--text-display-1` headline, body-lg tagline, action cluster
      (existing `VoiceModeButton`, optional `EngineeringBuildButton`,
      "Talk to X" CTA wrapped in the new layout grid but keeping their
      current visuals for this round).
- [ ] T053 [US2] Add `view-transition-name` on the header avatar so it
      matches the source card's avatar transition name (per R-001).
      Name pattern: `vt-employee-{employeeId}`.
- [ ] T054 [US2] Keep the body of `team/[employee]/page.tsx`
      untouched: Quick start, Stats, Recent activity, V2 workspaces
      (Marketing/Ops/Compliance/HR/Legal), and `EmployeeRightRail` all
      keep current composition. This is a *header-only* update in this
      round — out-of-scope per Out-of-Scope list.
- [ ] T055 [US2] Grep verification on
      `src/app/app/team/[employee]/page.tsx` header region for
      arbitrary utilities + hex literals. Expected: zero hits in the
      header region (the body keeps its current style for this round
      and is intentionally exempt from the lint).
- [ ] T056 [US2] Full page-transition verification: from `/app/workspace`
      hover a card → click → confirm shared-color continuity on entry;
      hit browser back; confirm reverse transition. Repeat for all 9
      employees.

**Checkpoint — End of Phase 5**: P1 SURFACE COMPLETE. The dashboard +
team grid + team-page header carry the thesis end-to-end. **STOP-and-
VALIDATE.** This is the MVP from spec.md.

---

## Phase 6: User Story 3 — Chat Becomes a Room (P2)

**Goal**: the chat shell stops reading as a ChatGPT clone and starts
reading as a room where Atlas is at the table.

**Independent Test**: per spec.md Story 3 ACs 1–5; quickstart.md §4.

**Dependencies**: Phase 2 ✓, Phase 3 ✓.

- [ ] T057 [US3] Refactor the `EmptyState` sub-component in
      `src/components/conduit/Chat.tsx` (currently
      `Chat.tsx:930–980`). Replace with: `PraxisAvatar
      employee="jarvis" size="lg" pulse="ambient"` adjacent to a
      `--text-display-1` headline from
      `composeChatEmptyCopy()` (T031). Subline + 4
      `PraxisSuggestionTile` (T036) tiles. Per S-003.
- [ ] T058 [US3] Replace the composer block in
      `src/components/conduit/Chat.tsx` (`Chat.tsx:743–880`) with
      `<PraxisComposerPill {...allProps} />` (T039). Wire all existing
      handlers (`onSubmit`, `onChange`, pin dropdown, mic toggle).
      The streaming-presence line under the composer
      (`Chat.tsx:881–894`) keeps its current shape; only the composer
      surface upgrades.
- [ ] T059 [US3] Replace the handoff-card rendering inside
      `MessageBubble` (the `if (message.role === "system" &&
      message.handoffTo)` branch around `Chat.tsx:1005+`) with
      `<PraxisHandoffBaton from={inferredFrom} to={message.handoffTo}
      />` (T038). Infer `from` from the previous assistant message's
      employee, falling back to `"jarvis"` if no prior assistant turn.
- [ ] T060 [US3] Confirm streaming wash: on stream start the
      `PraxisComposerPill`'s pin/stream side-effect already calls
      `setStreamDept(employee)` via the canvas-tint provider; visually
      verify that `/app` canvas takes a 4–6% wash of the streaming
      dept and fades out on stream end.
- [ ] T061 [US3] Confirm pinned wash: pin Sales (or any dept) →
      canvas takes 8–10% Sales wash → unpin → wash clears. Per FR-029
      / Story 3 AC-4.
- [ ] T062 [US3] Confirm TTS-sync avatar pulse per FR-032. The TTS
      pipeline already streams audio in `Chat.tsx`; tap into the
      amplitude (or a smoothed proxy via `setInterval` on the audio
      element's `currentTime` for a deterministic stand-in if real
      amplitude is too coarse) to drive the avatar's `data-pulse-amp`
      attribute, which the CSS reads via custom property animation.
- [ ] T063 [US3] Recolor the "Stop voice" floating button
      (`Chat.tsx:912–925`) per FR-033 — pick up the speaking
      employee's dept color instead of generic `--color-accent`.
- [ ] T064 [US3] Mobile sweep at 375/390 for chat empty + during a
      conversation + with composer pinned + during a handoff. Confirm
      no surface breaks.
- [ ] T065 [US3] Light-theme + reduced-motion sweep for chat surfaces.
- [ ] T066 [US3] Grep verification on `src/components/conduit/Chat.tsx`
      for arbitrary utilities + hex literals on the redesigned regions
      (EmptyState + composer + handoff). Zero hits. (Other Chat.tsx
      regions — message bubbles for non-handoff system messages,
      artifact drawer, paywall — are intentionally exempt this round
      per S-003.)

**Checkpoint — End of Phase 6**: chat shell carries the thesis in
motion. **STOP-and-VALIDATE.**

---

## Phase 7: User Story 4 — Locked Design System Documentation (P2, runs in parallel with Phase 8 motion polish)

**Goal**: the design system is documented and grep-verifiable.

**Dependencies**: Phase 2 ✓, Phase 3 ✓, Phases 4–6 ✓ (the consumer
surfaces have to exist before their adoption can be documented).

- [ ] T067 [US4] Extend `docs/praxis-design-system.md` v2 with §2
      Primitives (every class from contracts/primitives.md, with HTML
      example per primitive in both themes) and §3 Surface-to-primitive
      map (per contracts/surfaces.md, one section per redesigned
      surface).
- [ ] T068 [US4] Extend `docs/praxis-design-system.md` with §5
      Don'ts: hex literals in JSX, arbitrary Tailwind utilities,
      framer-motion in `/app/*`, JS-driven color animation, nested
      `PraxisCanvasTintProvider`, multiple competing `pulse` states
      on the same element.
- [ ] T069 [US4] Final grep sweep across ALL redesigned surface files
      per quickstart.md §5. Permitted exception: the
      `src/styles/praxis-system.css` authoring file (exempt as the
      values are *defined* here, not *used* arbitrarily).
- [ ] T070 [US4] Token-trace audit: pick 5 random visual values across
      the redesigned surfaces and trace each to a named token in
      `docs/praxis-design-system.md`. Zero un-traced values is the
      acceptance bar (FR-037).

**Checkpoint — End of Phase 7**: the system is locked and documented.

---

## Phase 8: User Story 5 + sidebar — Motion polish (P3) + sidebar limited update

**Goal**: the motion vocabulary lands across redesigned surfaces; the
sidebar status pip system + active-route indicator catches up to FR-034
+ FR-035 so streaming-pulse continuity reads end-to-end.

**Dependencies**: Phase 2 ✓, Phase 3 ✓, Phase 4 ✓ (the team grid is
where most of the motion lives).

- [ ] T071 [US5] Verify ambient pulse cadences are visually
      distinguishable between Atlas (4s calm) and Engineering (2s
      burst) per SC-009. Adjust the locked `--rhythm-*` values ONLY
      IF the visual delta is imperceptible — this is the one place
      cadence values can change post-GATE-1 lock, and the change must
      be approved at a STOP-and-VALIDATE before merging.
- [ ] T072 [US5] Verify ship-celebration trigger per Story 5 AC-2 /
      R-008. Insert a `conduit_builds` row with `status='live'` while
      the dashboard is mounted; confirm the celebration fires once on
      the Engineering card; reload the page and confirm it does NOT
      re-fire (no faked retroactive aliveness — Principle Zero).
- [ ] T073 [US5] Verify the dashboard's overall-team ambient breath
      cadence varies with team-activity bucket (no activity 4s, low
      3s, high 2s) per FR-012. Manually set the
      `data-activity-bucket` attribute in DevTools to confirm each
      bucket renders differently.
- [ ] T074 [Sidebar] Modify `src/components/conduit/Sidebar.tsx` per
      contracts/surfaces.md S-005:
      (a) replace the inline `<span>` status pip rendering at
      `Sidebar.tsx:201–215` with `<PraxisPulsePip employee={emp}
      state={isStreaming ? "streaming" : "ambient"} />`;
      (b) replace the active-route 0.5px solid stripe (NavLink line
      `Sidebar.tsx:440–446` and Team-row line `:174–180` and recent-
      conv line `:316–323`) with a 1.5px gradient stripe consuming
      `--tint-{dept}-edge` for team rows and `--color-accent` for
      non-team rows. Everything else in sidebar STAYS as-is.
- [ ] T075 [Sidebar] Light + 375 + 390 + reduced-motion sweep on
      sidebar updates only.
- [ ] T076 [US5] Final reduced-motion audit: walk through every
      animation primitive on every redesigned surface with reduced-
      motion ON; confirm the FR-057 policy holds for each
      (`praxis-pulse*` → suppressed, washes/baton → 1-frame end state,
      breath → suppressed, ship-celebration → static one-frame flash,
      time-fade → hard swap).

**Checkpoint — End of Phase 8**: motion + sidebar polish complete.
**STOP-and-VALIDATE.**

---

## Phase 9: Polish, Cross-Cutting, Material-Milestone Report

**Purpose**: ship the verification trail required by Constitution
Principle V; close the round.

- [ ] T077 [P] Provider-name blocklist grep per quickstart.md §7 on
      ALL files touched by this round: `Claude`, `Anthropic`, `OpenAI`,
      `Sonnet`, `Opus`, `Haiku`, `ElevenLabs`. Zero hits required
      (Principle III).
- [ ] T078 [P] Marketing-import boundary grep on all files touched:
      no imports of `Hero.tsx`, `Footer.tsx`, `Navbar.tsx`,
      `Cinematic.tsx`, `Customers.tsx`, `EngineeringProof.tsx`,
      `FinalCTA.tsx`, `Pricing.tsx`, `ProductTiles.tsx`, `Vision.tsx`,
      `WaitlistForm.tsx`, or anything from `src/components/marketing/`
      (Principle IV).
- [ ] T079 [P] `src/proxy.ts` diff verification — confirm zero
      changes to the matcher or `updateSession` contract (Principle I).
- [ ] T080 File `[FOLLOW-UP]` issue/PR-comment for the pre-existing
      `sales_leads` namespace gap (per plan.md Principle II verdict).
      Do NOT fix it in this PR; do NOT silently re-emit new queries
      against it. The redesign reads it via the same single query the
      current dashboard already issues.
- [ ] T081 Performance smoke: open `/app/workspace` on a mid-range
      device; record 10s in DevTools Performance with the dashboard
      idle; confirm no JS-driven animation loop, no layout/paint
      thrashing, no `box-shadow` animation deeper than 2 layers (spec
      Assumption 6).
- [ ] T082 Write `SESSION_REPORT_2026-05-XX_PRAXIS_CONSOLE_R15_PREMIUM.md`
      at repo root per Constitution Principle V. Required sections:
      Decisions (R-001 … R-011 with outcomes), Token sheet delta (the
      45+ new tokens), Primitive catalogue (the 11 new components),
      Surface migrations (the 4 modified files), Verification matrix
      (preview URL + 375/390/light/reduced-motion grid filled in),
      Follow-ups (the `sales_leads` flag, remaining-surface migration
      plan for sidebar body, voice, settings, etc.).
- [ ] T083 Final design-system doc pass — confirm
      `docs/praxis-design-system.md` is current, complete, and
      reflects exactly what shipped (not what was planned).
- [ ] T084 Update `CLAUDE.md`'s "current plan" pointer to whatever the
      next plan is, or clear it if no plan is queued. (Housekeeping —
      so the next session doesn't open against a stale pointer.)

**Final checkpoint — End of Phase 9**: round R15 complete. Push to
`main`; preview verified one final time end-to-end; session report
committed.

---

## Parallel-execution legend

Within a phase, `[P]`-tagged tasks may be executed concurrently — they
touch different files and have no inter-task dependencies. Tasks
without `[P]` either depend on a prior task in the same phase or share
a file with another task in the same phase.

Across phases: phases are sequential (no Phase 4 task starts before
Phase 3 completes, etc.). The dependency reason for each phase is
named in the phase header.

---

## Task → spec/plan/contracts traceability

Every task references its source artifact(s) in the description. For
audit purposes, the cross-reference at a glance:

- **Phase 1 (Setup)** — research.md R-011 (T001–T002), repo
  housekeeping (T003–T004).
- **Phase 2 (Foundational tokens + CSS)** — data-model.md §1
  (T005–T011), §2 (T013–T022), §3 (T023), `contracts/tokens.md`
  (T024).
- **Phase 3 (Components)** — data-model.md §3 (T026–T039),
  `contracts/primitives.md` P-001 … P-010.
- **Phase 4 (US1+US2 dashboard)** — spec.md Story 1 + Story 2,
  `contracts/surfaces.md` S-001 + S-004, quickstart.md §2 + §3.
- **Phase 5 (US1+US2 team page header)** — spec.md Story 2 AC-4,
  `contracts/surfaces.md` S-002, research.md R-001.
- **Phase 6 (US3 chat)** — spec.md Story 3, `contracts/surfaces.md`
  S-003.
- **Phase 7 (US4 design system docs)** — spec.md Story 4,
  `contracts/tokens.md` §J, FR-039.
- **Phase 8 (US5 motion + sidebar)** — spec.md Story 5,
  `contracts/surfaces.md` S-005, research.md R-008.
- **Phase 9 (Polish + material-milestone report)** — Constitution
  Principle V verification clause.
