# Implementation Plan: Engineering Build — Trustworthy & Beautiful Live Experience (R16)

**Branch**: `main` (push-to-main per Constitution Principle VI; short-lived feature branches allowed)
**Date**: 2026-05-23
**Spec**: [`spec.md`](./spec.md) (GATE 1 approved 2026-05-23; 6 decisions locked)
**Round**: R16 (succeeds R15.5 public release; coexists with R15 Premium Redesign in `praxis-console-premium-redesign/`)

**Input**: Feature specification from `specs/engineering-build-trust/spec.md`. P1
bundle (three coupled stories) ships as one deployable validated slice. URL is
`/app/builds/[session]`. In-flight tile sits at the top of `/app/workspace`.
Live preview iframe renders inline. Visual direction governed by the
`frontend-design` skill.

---

## Summary

A bounded set of in-repo additions that re-architects how the user *sees* an
Engineering build, with three load-bearing changes:

1. **Durable cinema route** — a new dynamic route `src/app/app/builds/[session]/page.tsx` and its `error.tsx` error boundary. The cinema view is a real URL, owned by the App Router, not an in-memory React modal. Refresh, share, deep-link, and browser back all work without losing state.
2. **Resilience layer** — a small set of hooks/components that wrap the existing realtime subscription with explicit channel-status awareness (`useBuildSubscription`), heartbeat-based stuck detection (`useBuildHeartbeat`), and a render-time error-translation function (`translateBuildError`). Each is independently testable and reused across the cinema, the dashboard in-flight tile, the sidebar, and the `/app/builds` index.
3. **Ambient surfaces** — an in-flight strip on `/app/workspace` (top, mirroring the existing `PraxisLiveStrip` voice pattern), a sidebar pulse pip on the Builds entry, and a click-through affordance on the Engineering team-roster card.

The full-screen log dump in `BuildSession.tsx` is retired as the *primary*
surface. The terminal panel survives as a secondary, collapsed-by-default
detail panel inside the new cinema — ops fidelity is preserved without making
it the dominant element.

**Zero schema changes. Zero new dependencies. Zero new API routes** (the
existing `/api/engineering/session/[id]` backfill route + Supabase realtime are
sufficient). One existing component (`BuildSession.tsx`) is recomposed into
smaller, focused parts under `src/components/conduit/builds/cinema/*` and
`src/components/conduit/builds/in-flight/*`. The frontend-design skill governs
the aesthetic direction (Construction-Site cinema; details below).

**Surfaces that change**:
- `src/app/app/builds/[session]/page.tsx` — NEW dynamic route (server component) that backfills session + logs and mounts the cinema client component.
- `src/app/app/builds/[session]/error.tsx` — NEW segment error boundary; uses Next.js 16's `unstable_retry` for the "Reopen" affordance (FR-012).
- `src/app/app/builds/page.tsx` — preserved; preserves `?session=<id>` query-redirect behavior to the new dynamic URL for backward compatibility.
- `src/app/app/workspace/page.tsx` — adds the conditional in-flight strip above `PraxisWelcomeHero`.
- `src/components/conduit/Sidebar.tsx` — adds the build-in-flight pulse pip on the `/app/builds` entry (Praxis pulse system, no new tokens).
- `src/components/conduit/engineering/EngineeringBuildButton.tsx` — on successful build start, **routes** to `/app/builds/<id>` (replaces the in-memory `setActiveSessionId` modal).
- `src/components/conduit/engineering/BuildsTabs.tsx` — preserves the historical list; the row click navigates to `/app/builds/<id>` (replaces the in-memory modal pattern).
- `src/components/conduit/praxis/PraxisTeamRoster.tsx` — the Engineering card's "1 build in flight" copy becomes a click target that routes to the cinema (FR-013).

**Surfaces NOT in this round** (per spec Out of Scope):
- Engineering worker repo. The plan reads worker log conventions; it does not author them.
- New build types beyond the existing four.
- Schema migrations.
- Voice-room integration with builds.
- `/app/team/engineering` page surface beyond the in-flight pulse on Engineering's avatar (P3, last to ship).

---

## Technical Context

**Language/Version**: TypeScript 5; React 19.2.4; Next.js 16.2.2 (App Router).
Per Constitution Principle I, the framework version is load-bearing.

**Primary Dependencies** (already installed; this plan adds NONE):
- `next@16.2.2`, `react@19.2.4`, `react-dom@19.2.4`
- `@supabase/ssr@0.10.2`, `@supabase/supabase-js@2.105.3` (realtime channels)
- `lucide-react` (icons — `Hammer`, `FileCode`, `Loader2`, etc.)
- `tailwindcss@4` via `@tailwindcss/postcss`
- Praxis token system v3 (`src/styles/praxis-tokens.css`) + premium-redesign system (`src/styles/praxis-system.css`, landed by R15)

**Storage**: Supabase Postgres (shared instance `mvuslmfjkkuizixjpkgl` with
Lunaro per Constitution Principle II). **Zero migrations** added. Reads route
through:
- `conduit_engineering_sessions` (`id`, `prompt`, `build_type`, `status`, `deploy_url`, `github_repo`, `total_input_tokens`, `total_output_tokens`, `error_message`, `started_at`, `completed_at`, `parent_session_id`) — migrations 018, 019.
- `conduit_engineering_logs` (`session_id`, `ts`, `level`, `message`) — migration 018.
- Realtime publication on both tables — migration 018 lines 62–65.
- `getCurrentAccount` / `createSupabaseServerClient` / `createSupabaseBrowserClient` — existing.

**Testing**: no automated test suite (Constitution Principle V). Verification
is the Vercel preview deploy + 375/390 mobile sweep + light/dark + reduced-motion
sweep + dated `SESSION_REPORT_2026-05-XX_ENGINEERING_BUILD_TRUST.md` on merge.

**Target Platform**: Vercel (Next.js deploy of `conduitai.io`); Supabase
(Postgres + Realtime + RLS); Railway (the Engineering worker — untouched by
this plan).

**Project Type**: Web — Next.js App Router monolith (Constitution Principle IV).
All deliverables live under `/app/app/*` and `src/components/conduit/*`.

**Performance Goals**:
- First paint of `/app/builds/[session]` ≤ 600 ms on a warm cache, including server-rendered backfill of session + last 200 logs.
- Realtime drop detection ≤ 2 s from channel-state change to UI indicator.
- Realtime reconnect reconciliation ≤ 8 s from reconnect to fully-current UI with no duplicate log entries.
- Stuck detection threshold 90 s (FR-010); user-facing transition is non-blocking — log scroll continues to render if events arrive.
- Live preview iframe load attempt ≤ 3 s from `deploy_url` first becoming visible (FR-006, SC-010).
- All ambient motion runs in the compositor (transform + opacity only).
- Zero JS-driven animation loops for ambient effects (CSS keyframes only — consistent with R15 Assumption 7 and `praxis-system.css`).

**Constraints**:
- Constitution Principle I: read `node_modules/next/dist/docs/01-app/01-getting-started/{03-layouts-and-pages,05-server-and-client-components,10-error-handling}.md` before authoring; cited in research.md. Dynamic-segment `params` is a Promise in Next.js 16 (`await ctx.params`) — already the pattern in `src/app/api/engineering/session/[id]/route.ts`.
- Constitution Principle II: no schema changes, no `lunaro_*` reads. All reads are through `conduit_engineering_*` tables already RLS-policied (migrations 018/019).
- Constitution Principle III: no "Claude" / "Anthropic" / "OpenAI" / "Sonnet" / "Opus" / "Haiku" / "ElevenLabs" / "LiveKit" strings anywhere. Render-time substring redaction applies to the raw-log panel ONLY (FR-030) — the underlying `conduit_engineering_logs` rows are untouched.
- Constitution Principle IV: no marketing imports. All new components live under `src/components/conduit/builds/`. `src/proxy.ts` untouched.
- Constitution Principle V: 375 + 390 mobile sweep; light + dark theme sweep; reduced-motion sweep; preview-URL exercise per `quickstart.md`. Material milestone → produces `SESSION_REPORT_*`.
- Constitution Principle VI: phased rollout per the Phasing section; each phase merges to `main` after preview verification. No long branches.
- Spec Assumption 1 (no schema changes): held — step taxonomy lives in `src/lib/engineering/step-taxonomy.ts`, not as a DB column.
- Spec Assumption 2 (no worker repo changes): held — the worker's log conventions are reverse-engineered at Phase 0 (R-006) and pinned in code.
- Spec Assumption 5 (no new external deps): held — zero npm installs.

**Scale/Scope**:
- 1 new dynamic route (cinema) + 1 new error.tsx boundary.
- ~12 new React components under `src/components/conduit/builds/{cinema,in-flight}/*`.
- 4 new hooks: `useBuildSubscription`, `useBuildHeartbeat`, `useBuildSession`, `usePreviewIframe`.
- 2 new pure-TS modules: `src/lib/engineering/step-taxonomy.ts`, `src/lib/engineering/error-translation.ts`.
- Surface mods: 5 existing files (`workspace/page.tsx`, `Sidebar.tsx`, `EngineeringBuildButton.tsx`, `BuildsTabs.tsx`, `PraxisTeamRoster.tsx`).
- 1 new style sheet: `src/styles/engineering-cinema.css` extending the existing Praxis system tokens — no new tokens introduced.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Gate question | Verdict |
|---|-----------|---------------|---------|
| 0 | Domain Truth & No Hallucination | Does this plan introduce or rely on Praxis/Conduit AI product domain content — employees, capabilities, pricing tiers, customer logos, integration claims, or terminology (Jarvis, Praxis, voice room, build, artifact, round identifier `R<N>.<M>`)? If yes, cite the source for every domain decision in source-authority order. Unsourced items MUST be flagged **NEEDS CLARIFICATION**, not guessed. | **PASS** — Engineering employee identity sourced from `src/lib/conduit/employees.ts`. Build session schema, status enum, error-message column sourced from `supabase/migrations/018_engineering.sql` + `019_engineering_v2.sql`. Worker-URL fix history sourced from `SESSION_REPORT_2026-05-12_PRAXIS_CONSOLE_R2.md` + commit `6931aad`. R15.5 public-release behavior sourced from commit `88f6cf2`. Round identifier `R16` is the next increment in the established `R<N>` cadence (R15 → R15.5 → R16). **Step taxonomy (FR-017)** is reverse-engineered from actual worker emissions during Phase 0 R-006 (not invented). No new employees, capabilities, build types, or tiers introduced. |
| I | Next.js 16 Source-of-Truth | Does this plan touch Next.js APIs, file conventions, framework behavior, caching, routing, server actions, server components, or middleware? If yes, list the specific `node_modules/next/dist/docs/` guides consulted and confirm middleware uses `src/proxy.ts` exporting `proxy(request)`. | **PASS** — guides consulted: `01-app/01-getting-started/03-layouts-and-pages.md` (dynamic segments — `[session]` folder, `params` Promise, `await ctx.params` — already the established pattern in this repo per `src/app/api/engineering/session/[id]/route.ts`); `01-app/01-getting-started/05-server-and-client-components.md` (cinema page is a server component that backfills + mounts a client component; the client component owns realtime, hooks, motion); `01-app/01-getting-started/10-error-handling.md` (segment-level `error.tsx` MUST be a Client Component; Next.js 16's `unstable_retry` prop on `ErrorPage` is the framework-blessed retry path — used by FR-011's "Refresh now" affordance and FR-012's "Reopen" affordance). `src/proxy.ts` is NOT touched. No matcher changes. `experimental.staleTimes` in `next.config.ts` is NOT touched. |
| II | Schema Namespacing & Tenant Boundary | Does this plan add or modify Supabase tables, functions, or views? | **PASS** — zero migrations. Zero new tables. Zero new RLS policies. All reads route through `conduit_engineering_sessions` + `conduit_engineering_logs` (RLS-policied since migration 018). The cinema's server-render backfill uses `createSupabaseServerClient()` → owner-scoped via `auth.uid()`. No `lunaro_*` reads. The dashboard in-flight tile reads from `conduit_engineering_sessions` directly (same RLS scope as the existing `team-activity.ts` `inFlightBuildsQ`); the pre-existing pattern is preserved. |
| III | Brand Integrity & Provider Concealment | Does this plan surface AI-generated content, error messages, debug output, page metadata, or any client-visible UI? | **PASS** — every new surface is `/app/*` (Praxis brand). Zero "Claude" / "Anthropic" / "OpenAI" / "Sonnet" / "Opus" / "Haiku" / "ElevenLabs" / "LiveKit" strings introduced by any new file. **Provider-tell redaction in the raw-log panel (FR-030)**: the worker's `conduit_engineering_logs` rows CAN contain provider names (e.g. `claude-sonnet-4-x` model identifiers in stdout). The cinema's collapsed raw-log panel applies a render-time regex substitution before display; `error-translation.ts` handles error-message redaction. The DB row is untouched (the worker owns the data; redacting at write time would be a worker-repo change, out of scope per Spec Assumption 2). Existing `BuildSession.tsx` already renders raw `log.message` verbatim — this plan **closes** a latent Principle III gap there. PR-time grep verification per `quickstart.md` enforces the rule across the new code. |
| IV | Dual-Brand Single-Deploy | Does this plan add or modify route files or components? | **PASS** — every new file lives under `src/app/app/*`, `src/components/conduit/builds/*`, `src/hooks/`, `src/lib/engineering/*`, or `src/styles/engineering-cinema.css`. Zero marketing-route changes. Zero imports of `src/components/{Hero,Footer,Navbar,Cinematic,Customers,EngineeringProof,FinalCTA,Pricing,ProductTiles,Vision,WaitlistForm}.tsx` or `src/components/marketing/*`. Cinema components are Praxis-brand-specific (dept tinting, dark canvas, Praxis serif display + sans body) — they belong at `src/components/conduit/builds/`, NOT at `src/components/design-system/` (which is reserved for brand-neutral primitives). `src/proxy.ts` untouched. PR-time grep enforces the import boundary. |
| V | Verification by Preview + Mobile Sweep | What is the verification plan? | **PASS** — (a) the merging PR's auto-generated Vercel preview URL exercises `/app/builds/<existing-session-id>` (cinema, all status states across history), `/app/builds` index (preserved), `/app/workspace` (in-flight strip with and without an active build), sidebar pulse, Engineering team-card affordance, and the `/api/engineering/session` → cinema-route end-to-end flow. (b) 375 + 390 mobile sweep per `quickstart.md §3`: cinema reflows single-column, step indicator legible, file panel scrolls horizontally without overflow, raw-log panel collapses cleanly, preview iframe responsive, abort/close affordances ≥ 44 px tap targets, in-flight strip wraps without overflow. (c) Light + dark theme parallel sweep at both widths. (d) Reduced-motion sweep — all CSS animations off or substituted with opacity-only. (e) Material milestone YES — round-numbered (R16), new console treatment, brand-axis premium surface → produces `SESSION_REPORT_2026-05-XX_ENGINEERING_BUILD_TRUST.md` capturing decisions + verification outcomes + follow-ups (step-taxonomy refinements if needed, P2/P3 phase entry criteria). |
| VI | Push-to-Main | Will this feature ship via `git push` to `main` (or a short-lived feature branch merged fast-forward into `main`)? | **PASS** — phased rollout per the Phasing section: **Phase A** (P1 single shippable bundle: cinema + resilience + in-flight ambient + sidebar pulse) merges to `main` after the full quickstart sweep passes on preview; **Phase B** (P2: failure-dignity translation + share-URL polish) merges next; **Phase C** (P3: chat-pulse + cost transparency) merges last. Each phase = one round-of-work commit sequence on a short-lived feature branch (or direct to `main` if the slice is small enough), merged fast-forward. No long branches. No manual `vercel --prod` anticipated. `.specify/feature.json` updates to pin `specs/engineering-build-trust/` for the duration of this work. |

---

## Aesthetic Direction (frontend-design skill applied)

The `frontend-design` skill requires committing to a BOLD aesthetic direction
rather than defaulting to generic dashboard UI. This plan commits to:

### Concept: "The Construction Site"

The user is **watching something being built in real time** — a real site,
their site, materializing from a prompt. The cinema honors that. It is not
a dashboard; it is a viewing stage.

**Differentiation — what makes this unforgettable**: the **moment the live
preview iframe materializes**. When `deploy_url` first becomes available, the
iframe enters with a 480 ms staged reveal — a curtain-rise rather than a
plain fade. The rest of the cinema's in-progress elements transition from a
"building" state to a "shipped" state in the same beat. That single,
orchestrated moment IS the experience.

### Treatment

**Typography**: leans into the existing Praxis system — serif display (already
established via `serif` class) for the step indicator and the shipped headline;
sans for body text; a small-caps treatment for file paths (the craft detail).
We do NOT introduce a new font. The skill's "avoid Inter/Roboto/Arial" rule is
already honored by the Praxis system's choice of a distinctive serif display.

**Color**: the cinema's canvas tints to the Engineering department color
(rust/orange per the R15 redesign token `--color-dept-engineering`). The
existing `PraxisCanvasTintProvider` provides this — the cinema mounts a
`PraxisCanvasTintProvider initialDept="engineering"` boundary so the entire
viewport (chrome, sidebar accents, status pills) shifts into the engineering
palette while the user is in the cinema. Returns to neutral on unmount. Light
+ dark theme parity verified.

**Layout — three vertical stages**:
1. **Stage band** (top, ~96px tall) — step indicator (serif display, large),
   eyebrow text naming the operation in plain English ("Scaffolding the
   Next.js project"), elapsed time + running spend rendered as a refined
   inline strip on the right. This is the dominant element. The user's eye
   lands here first.
2. **Craft strip** (middle, ~140px tall) — a horizontally-scrolling row of
   file chips representing the files Engineering has touched. The most-recent
   chip pulses subtly (CSS keyframe, opacity + transform, 600 ms, respects
   reduced-motion). When a new file is written, a thin vertical "spark" bar
   travels left→right across the strip (CSS keyframe, transform-only, 280 ms)
   and the new chip enters with a 180 ms scale-up. This is the craft moment
   — files emerging like sparks from a forge.
3. **Preview stage** (bottom, fills remaining height) — when `deploy_url` is
   null: a subtle Engineering-tinted gradient mesh background (CSS only, low
   opacity, no JS) with a single line of italic copy ("The site will appear
   here when Engineering finishes the first deploy."). When `deploy_url`
   first becomes non-null: the iframe materializes via the staged reveal
   (curtain rise — clip-path animation top-to-bottom, 480 ms, eased). When
   the iframe loads but X-Frame-Options blocks: graceful fallback to a
   placeholder card with the URL + "Open in new tab" affordance.

**Raw log panel** — secondary, collapsed by default. Lives below the preview
stage as a thin disclosure ("Show technical log"). When expanded, the
monospace terminal treatment is preserved (the ops fidelity that R15.5 shipped
is not lost — it is just no longer dominant). Provider-tell redaction (FR-030)
applies at render time inside this panel only.

**Backgrounds & atmosphere**: the cinema's canvas is the Praxis dark surface
with an Engineering-dept-tinted gradient mesh (CSS radial-gradient with
`color-mix(in srgb, var(--color-dept-engineering) 8%, transparent)`) anchored
top-right, no JS, no images. The mesh is subtle — it gives the surface
*atmosphere* without competing with the stage band. Reduces to a flat tint
under `prefers-reduced-motion`.

**Motion vocabulary** — all CSS keyframes (no JS animation lib):
- Step transition: 280 ms cross-fade with a 12 px vertical translate.
- File chip enter: 180 ms scale-up + opacity.
- Spark bar: 280 ms transform-only horizontal sweep across the craft strip.
- Most-recent chip pulse: 600 ms infinite, opacity-only.
- Iframe curtain rise: 480 ms clip-path reveal + 240 ms opacity overlap.
- Ambient strip pulse (in-flight tile): 2.4 s infinite, opacity 0.6 → 1 → 0.6.
- Celebration (build complete): 1.8 s one-time, scale + opacity, on the step indicator.
- All animations gated through the existing R15 `useReducedMotion` hook.

**In-flight strip (workspace dashboard)** — mirrors `PraxisLiveStrip`
(voice) for visual consistency:
- Full-width band above `PraxisWelcomeHero`.
- Engineering dept tint on the left edge.
- Eyebrow text: `BUILDING · <step>` (e.g. `BUILDING · SCAFFOLDING`).
- Inline elapsed + file count on the right.
- Ambient pulse on the left tint stripe.
- Whole strip is a `<Link>` to `/app/builds/<id>` — clicking opens the cinema.
- Disappears 5 s after build hits a terminal state (FR-016) with a brief celebration interstitial.

**Sidebar pulse** — Praxis's existing pulse-pip system. No new tokens. The
`/app/builds` sidebar entry gets a small dept-tinted pip overlaid on its icon
whenever ≥ 1 in-flight build exists. Removes when no in-flight builds.

**Engineering team-card click affordance** — the existing `PraxisTeamRoster`
already renders `"1 build in flight"` copy for Engineering when
`in_flight_build_id` is set. This plan wraps that copy in a `<Link>` to the
cinema URL (`/app/builds/<in_flight_build_id>`). The card itself still links
to `/app/team/engineering` — the new affordance is a nested link on just the
bottom-line copy. Click-target isolation via `ClickInterceptor` (the existing
pattern in `PraxisTeamRoster.tsx:269`).

### Skill-driven rejections

The frontend-design skill's "NEVER use generic AI-generated aesthetics"
clause rules out:
- A full-screen monospace terminal as the dominant view (the existing
  treatment).
- A "loading bar at the top, log scroll below" template-shop layout.
- Generic gradient buttons with purple-on-white CTAs.
- A modal-over-a-blurred-dashboard treatment.
- Repetitive Inter/Roboto/system-font usage (the Praxis system already
  rejects these).

Each was an option considered in `research.md §R-009`; each was rejected
explicitly.

---

## Project Structure

### Documentation (this feature)

```text
specs/engineering-build-trust/
├── spec.md                          # GATE 1 approved 2026-05-23
├── plan.md                          # This file
├── research.md                      # Phase 0 — 10 decisions (R-001 … R-010)
├── data-model.md                    # Phase 1 — derived entities + step taxonomy + error map
├── quickstart.md                    # Phase 1 — per-story local + preview verification
├── contracts/
│   ├── cinema-route.md              # Phase 1 — cinema URL + props + realtime contract
│   ├── in-flight-tile.md            # Phase 1 — strip contract + tile placement on workspace
│   ├── error-translation.md         # Phase 1 — error-token → human-message map
│   └── step-taxonomy.md             # Phase 1 — worker-log → step label mapping
└── tasks.md                         # Phase 2 — created by /speckit-tasks (NOT this command)
```

### Source Code (repository root)

```text
conduit-nextjs/
├── src/
│   ├── app/
│   │   ├── app/
│   │   │   ├── builds/
│   │   │   │   ├── page.tsx                                   # MODIFY — preserved; add ?session=<id> → /app/builds/<id> redirect for backward compat
│   │   │   │   └── [session]/
│   │   │   │       ├── page.tsx                               # NEW — server component, backfills + mounts BuildCinema
│   │   │   │       └── error.tsx                              # NEW — segment error boundary (FR-012); uses unstable_retry for the "Reopen" affordance
│   │   │   └── workspace/
│   │   │       └── page.tsx                                   # MODIFY (US3) — add EngineeringBuildStrip above PraxisWelcomeHero, conditional on in-flight build
│   │   └── api/
│   │       └── engineering/
│   │           └── session/
│   │               └── [id]/
│   │                   └── route.ts                           # UNTOUCHED — existing backfill GET is sufficient
│   ├── components/
│   │   └── conduit/
│   │       ├── Sidebar.tsx                                    # MODIFY (FR-026) — add build-in-flight pulse pip on /app/builds entry
│   │       ├── engineering/
│   │       │   ├── BuildSession.tsx                           # DEPRECATE — code preserved temporarily for /app/builds modal callers; deleted in Phase A2 once all callers migrated to cinema route
│   │       │   ├── BuildsTabs.tsx                             # MODIFY — row click navigates to /app/builds/<id> (replaces modal mount)
│   │       │   └── EngineeringBuildButton.tsx                 # MODIFY — submit() routes to /app/builds/<id> on success (replaces setActiveSessionId state)
│   │       ├── praxis/
│   │       │   └── PraxisTeamRoster.tsx                       # MODIFY (FR-013) — wrap "1 build in flight" copy in Link to cinema URL
│   │       └── builds/                                        # NEW namespace
│   │           ├── cinema/
│   │           │   ├── BuildCinema.tsx                        # NEW "use client" — top-level cinema orchestrator
│   │           │   ├── BuildStageBand.tsx                     # NEW server-safe — step indicator + elapsed + spend (top stage)
│   │           │   ├── BuildCraftStrip.tsx                    # NEW "use client" — file chip strip with spark animation (middle stage)
│   │           │   ├── BuildPreviewStage.tsx                  # NEW "use client" — iframe + curtain-rise + fallback (bottom stage)
│   │           │   ├── BuildRawLogPanel.tsx                   # NEW "use client" — collapsed-by-default terminal panel + provider-tell redaction
│   │           │   ├── BuildShippedSummary.tsx                # NEW server-safe — terminal-state summary (deploy URL, files-touched count, total elapsed, total tokens, total spend)
│   │           │   ├── BuildHeader.tsx                        # NEW server-safe — title + status pill + abort + minimize + share-URL (FR-027 mobile reflow)
│   │           │   └── ReconnectingPip.tsx                    # NEW "use client" — realtime-drop indicator (FR-008)
│   │           └── in-flight/
│   │               ├── EngineeringBuildStrip.tsx              # NEW "use client" — workspace dashboard in-flight strip (mirrors PraxisLiveStrip pattern)
│   │               ├── SidebarBuildPip.tsx                    # NEW server-safe — sidebar pulse pip on /app/builds entry
│   │               └── useInFlightBuilds.ts                   # NEW — server-data + realtime subscription for active builds (consumed by EngineeringBuildStrip + SidebarBuildPip via server props + client refresh)
│   ├── hooks/
│   │   ├── useBuildSubscription.ts                            # NEW — realtime channel wrapper with explicit status callback (FR-008/009)
│   │   ├── useBuildHeartbeat.ts                               # NEW — stuck-detection timer (FR-010/011)
│   │   ├── useBuildSession.ts                                 # NEW — composed hook: backfill + realtime + heartbeat (consumed by BuildCinema + EngineeringBuildStrip)
│   │   └── usePreviewIframe.ts                                # NEW — iframe load + X-Frame-Options fallback detection (FR-006/007)
│   ├── lib/
│   │   └── engineering/
│   │       ├── step-taxonomy.ts                               # NEW — map worker-log emissions → plain-English step labels (FR-017/018)
│   │       ├── error-translation.ts                           # NEW — error-token → { headline, body, recovery } (FR-020 … FR-024)
│   │       ├── spend-estimate.ts                              # NEW — tier-aware token→USD spend estimate (FR-019; used by both cinema + in-flight strip + cost-transparency P3)
│   │       └── worker.ts                                      # UNTOUCHED — R2 fix preserved; no changes needed
│   └── styles/
│       └── engineering-cinema.css                             # NEW — cinema layout + animations; consumes praxis-tokens + praxis-system; zero new tokens
├── supabase/
│   └── migrations/                                            # UNTOUCHED — zero new migrations
├── docs/
│   └── engineering-build-cinema.md                            # NEW — design rationale + screenshot inventory + step-taxonomy reference (companion to praxis-design-system.md from R15)
├── .specify/
│   └── feature.json                                           # MODIFY — pin specs/engineering-build-trust/ for the duration of this work
├── SESSION_REPORT_2026-05-XX_ENGINEERING_BUILD_TRUST.md       # NEW — material milestone report (Constitution Principle V)
└── CLAUDE.md                                                  # MODIFY — "current plan" pointer line updates to this plan.md
```

**Structure Decision**: Single-project Next.js App Router monolith
(Constitution Principle IV — Dual-Brand Single-Deploy preserved). All
deliverables under `/app/app/*`, `src/components/conduit/`, `src/hooks/`,
`src/lib/engineering/`, and `src/styles/`. No worker repo dependency. No
infrastructure changes.

New components live at `src/components/conduit/builds/` (a new namespace
under the existing `conduit/` Praxis-console family), NOT at
`src/components/design-system/`. The new namespace is Praxis-brand-specific
(dept tint, dark canvas, serif display) — appropriate at `conduit/builds/`,
inappropriate as a brand-neutral shared primitive.

---

## Phasing

Per the user's GATE 1 directive: **P1 ships as one deployable, validated slice
before P2 and P3.** The Phasing below honors that.

### Phase A — P1 single shippable slice (the trust bundle)

Goal: a user can never lose the build, can watch it honestly, and can watch
it ambiently from the dashboard. Everything from US1, US2, US3 lands together.

Sub-units (sequenced for merging discipline, but all under the same Phase A
commit train — preview verification at end of A6 is the merge gate for the
whole slice):

- **A1 — Foundations**. `step-taxonomy.ts`, `error-translation.ts`, `spend-estimate.ts`, `useBuildSubscription`, `useBuildHeartbeat`, `useBuildSession`, `usePreviewIframe`. Pure-TS + hooks. No surface change yet. Validates by direct unit-of-behavior import test inside a dev scratch route.
- **A2 — Cinema route + error boundary**. `src/app/app/builds/[session]/page.tsx` + `error.tsx`. Server-render backfill, mounts `BuildCinema`. Cinema renders all three stages in working order (stage band, craft strip, preview stage) plus the collapsed raw-log panel + header + reconnecting-pip + shipped-summary. Wires `EngineeringBuildButton` and `BuildsTabs` to navigate to the new URL instead of mounting `BuildSession` in-place. `BuildSession.tsx` is preserved temporarily (deprecation comment + redirect import) for any stragglers.
- **A3 — In-flight ambient surfaces**. `EngineeringBuildStrip` + workspace integration; `SidebarBuildPip` + Sidebar integration; `PraxisTeamRoster` link wrap. All three consume the same `useInFlightBuilds` hook (server-render initial state, realtime updates).
- **A4 — Resilience polish**. Stuck-detection visual treatment, reconnecting-pip mounting at the cinema header + the in-flight strip, error-boundary recovery copy + `unstable_retry` wiring, mobile sweep adjustments.
- **A5 — Aesthetic polish + motion**. CSS keyframes for spark-bar, file-chip enter, iframe curtain-rise, ambient strip pulse, celebration moment. Reduced-motion gates. Light + dark theme parity.
- **A6 — Material-milestone session report + cleanup**. Delete deprecated `BuildSession.tsx` once preview confirms all callers migrated. Produce `SESSION_REPORT_2026-05-XX_ENGINEERING_BUILD_TRUST.md`. Update `CLAUDE.md` pointer. Update `.specify/feature.json`.

**Phase A merge gate**: full `quickstart.md` sweep on preview URL (375 + 390 mobile, light + dark, reduced-motion) passes. All US1/US2/US3 acceptance scenarios verifiable in the browser. Material-milestone session report committed.

### Phase B — P2 (failure-dignity + share-URL polish)

Goal: every failure surfaces a human message with a named recovery; the cinema
URL has a copy-to-share affordance. Builds on Phase A's `error-translation.ts`.

- **B1 — Failure-dignity surfaces**. Wire `translateBuildError` into the cinema's `BuildShippedSummary` (for failed terminal state), the `EngineeringBuildStrip` (for failure interstitial), the `BuildsTabs` index row preview, the `PraxisTeamRoster` Engineering card (when in-flight flips to failed). Operator-only env-edit hints gated on `internal_account`.
- **B2 — Historical-row retro-translation**. The same render-time function strips `worker_start_*` prefixes in `BuildsTabs.tsx` so the legacy backlog reads cleanly. DB rows untouched.
- **B3 — Share-URL affordance**. Copy-URL button in `BuildHeader` with confirmation toast. `/app/builds/[session]` 404 for non-owned sessions (RLS returns null → handled in the server-render).
- **B4 — Session report supplement**. Append a "Phase B notes" section to the Phase A session report (no new file required).

**Phase B merge gate**: simulate each failure mode (env unset, worker 502, Claude rate limit class, deploy quota, syntax-error class, user abort) — confirm each renders distinct, plain-English, with the correct recovery affordance.

### Phase C — P3 (chat-pulse + cost transparency)

Goal: the Engineering avatar in chat surfaces pulses when a build is in flight;
the build modal shows a pre-commit cost estimate; the cinema's summary names
the final cost.

- **C1 — Chat-pulse**. Engineering avatar consumes `useInFlightBuilds` in the chat right-rail + route-picker. Pulse cadence + celebration moment via the existing R15 motion vocabulary.
- **C2 — Pre-commit cost estimate**. Modal in `EngineeringBuildButton` shows estimated range based on `prompt.length` + build-type heuristic (tier rate × token estimate). Final cost displayed in `BuildShippedSummary` already (Phase A wiring).
- **C3 — Session report addendum**. Append a "Phase C notes" section.

**Phase C merge gate**: chat-pulse visible during a live build; cost estimate within ±50% of actual on three sample build types.

---

## Phase 0 → Phase 1 re-check

**Status**: COMPLETE — all 7 gates RE-PASS after Phase 0 (`research.md`) and
Phase 1 (`data-model.md`, `contracts/{cinema-route,in-flight-tile,error-translation,step-taxonomy}.md`,
`quickstart.md`) authoring.

| # | Principle | Re-check verdict | Notes from Phase 0/1 |
|---|---|---|---|
| 0 | Domain Truth | **PASS** | `research.md` R-006 + `contracts/step-taxonomy.md` lock the step taxonomy against actual observable worker emissions (`WRITE`/`EDIT` system logs + session-status enum). No invented phases. The `index/total` "step N of M" affordance is deliberately omitted from the pinned defaults because there is no ground-truth signal to count against — Phase A2 may add it back once worker emissions are inspected directly. |
| I | Next.js 16 | **PASS** | Phase 1 names exactly two framework touch-points: the cinema dynamic route (`[session]/page.tsx`) and its error boundary (`error.tsx`). Both follow patterns documented in `node_modules/next/dist/docs/01-app/01-getting-started/{03-layouts-and-pages,10-error-handling}.md`. `params` is awaited as a Promise per the established repo pattern. The error boundary uses `unstable_retry` defensively (codes work without it if absent). `src/proxy.ts` and `next.config.ts` untouched. |
| II | Schema Namespacing | **PASS** | `data-model.md` §1 confirms zero new tables, zero new columns, zero new policies. Realtime publication is already in place from migration 018. The new `account-builds:<accountId>` channel name is a CLIENT-side subscription label, not a DB artifact. |
| III | Brand Integrity | **PASS** | `contracts/error-translation.md` §3 names the provider-tell scrubbing function and where it applies (rawDetails disclosure + raw-log panel). `contracts/cinema-route.md` and `contracts/in-flight-tile.md` introduce no provider strings. The cinema lives entirely in `/app/builds/[session]` under the Praxis brand. PR-time grep enforcement in `quickstart.md §6`. |
| IV | Dual-Brand Single-Deploy | **PASS** | All new files under `/app/app/builds/`, `/components/conduit/builds/`, `/hooks/`, `/lib/engineering/`, `/styles/engineering-cinema.css`. Zero marketing imports. New cinema namespace is Praxis-brand-specific (dept tint, dark canvas) — correctly placed at `components/conduit/builds/`, NOT at `components/design-system/`. |
| V | Verification by Preview + Mobile Sweep | **PASS** | `quickstart.md` enumerates per-story verification recipes plus a cross-cutting Constitution-V matrix (mobile 375 + 390, light + dark theme, reduced-motion, no-provider-strings grep, no-marketing-imports grep, no-proxy-touch, no-migration, no-new-dep). Material milestone session report scheduled per §8. |
| VI | Push-to-Main | **PASS** | Phasing unchanged: Phase A (P1 bundle) → Phase B (P2) → Phase C (P3). Each phase is a fast-merge round-of-work. Phase A's sub-units (A1 foundations → A6 cleanup) all merge under the same preview-verification gate. No long-running branches. |

**Net**: 0/PASS, I/PASS, II/PASS, III/PASS, IV/PASS, V/PASS, VI/PASS.

The plan is deliberately conservative on framework surface area (one new
dynamic route, one new error boundary, one new client-component boundary at
the cinema, one new style sheet, four new hooks, two new pure-TS modules)
precisely so the re-check is robust. Phase 0/1 authoring did not surface any
hidden framework requirement, schema requirement, or brand-axis conflict
that would force a return through GATE 2.

---

## Complexity Tracking

> Fill only if Constitution Check has violations that must be justified.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _(none — all 7 gates PASS)_ | | |

**Notes on residual risk** (NOT waivers — flagged for the implementer):

- **Step taxonomy (FR-017) ground truth**. The plan pins a default taxonomy in `step-taxonomy.ts` based on the worker-log patterns observable in `BuildSession.tsx:144-156` (`WRITE <path>`, `EDIT <path>`) and the session-status enum (`pending|running|deploying|complete|failed|timeout|aborted`). The actual richer phase emissions (Claude API call boundaries, Vercel deploy stages) are only visible from inside the engineering-worker repo, which is out of scope per Spec Assumption 2. During Phase A2, the implementer MUST run a real build on a preview deploy, capture the actual emitted log lines, and refine the taxonomy if the pinned defaults miss a phase the user can see. The refinement is in `step-taxonomy.ts` only — no new spec, no new GATE.
- **Provider-tell redaction scope (FR-030)**. The raw-log panel is the only place provider names can leak from worker output. The redaction regex is conservative (matches `claude`, `anthropic`, `openai`, `sonnet`, `opus`, `haiku`, `gpt`, `elevenlabs`, `livekit`, case-insensitive, word-boundary). If real-world logs introduce a new provider noun, the regex extends in-place — not a constitutional issue, but flagged so the implementer doesn't ship a regex too narrow on first attempt.
- **`BuildSession.tsx` deprecation order**. Phase A2 keeps the old component temporarily and re-routes its callers; A6 deletes it. If any third-party caller exists outside this plan's scope (none identified by grep at planning time, but the implementer MUST re-grep at A6), the delete is gated on a fresh grep sweep.
- **R-011 from R15 (Next.js docs not consultable from authoring checkout)**. This plan was authored with `node_modules/next/dist/docs/` available (already verified in the Technical Context section above) — the R15 follow-up is closed for this work. Confirmed by the grep commands run during research.md authoring.

---

## Worker dependencies (out-of-repo)

None. Unlike voice-room-v1, this plan adds **zero worker repo changes**. The
worker is treated strictly as the producer of `conduit_engineering_sessions`
+ `conduit_engineering_logs` rows. The taxonomy reverse-engineers what the
worker emits today; the cinema, the strip, the resilience layer, and the
error translation are all consumers.

If Phase A2 reveals the worker's emissions are insufficient for honest step
labeling (e.g. no signal between `WRITE` and `deploy_url` populating), the
right response is **not** to retrofit log emissions in this plan — it is to
file a follow-up brief for the engineering-worker repo and ship the cinema
with the best-available taxonomy in the meantime.
