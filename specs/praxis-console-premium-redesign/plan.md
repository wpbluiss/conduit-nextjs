# Implementation Plan: Praxis Console — Premium Visual Redesign (R15)

**Branch**: `main` (push-to-main per Constitution Principle VI; short-lived
feature branches OK if used) | **Date**: 2026-05-22 | **Spec**:
[`spec.md`](./spec.md)

**Input**: Feature specification from
`/specs/praxis-console-premium-redesign/spec.md` (approved at GATE 1
2026-05-22; P1 stories tied; role-typed pulse cadences locked).

---

## Summary

A bounded **visual redesign** of three Praxis console surfaces — the
`/app/workspace` Welcome-back dashboard, the team grid (both the
roster on `/app/workspace` and the header band on
`/app/team/[employee]`), and the `/app` chat shell — that carries the
"cofounder in your pocket" thesis by making the team visibly *present*
on every surface.

**Approach**: small, CSS-first, additive. One new CSS sheet
(`src/styles/praxis-system.css`) extends the existing
`praxis-tokens.css` with a locked token scale (spacing × typography
× radii × elevation × motion × per-dept tint). A new family of
components (`src/components/conduit/praxis/*`) consumes those tokens
and ships alongside the existing `conduit-*` primitives for the
duration of this round (coexistence per Phase 0 R-006). One new
React context provider (`PraxisCanvasTintProvider`) drives canvas
tinting via a single `data-dept` attribute, with CSS doing all the
visual work. One new thin GET route handler
(`/api/conduit/team-activity`) supplies the dashboard's polling
refresh. **Zero schema changes**, **zero new dependencies**, **zero
JS animation library adoption** (CSS keyframes only — consistent
with the existing `/app/*` convention).

**Surfaces that change**:
- `src/app/app/workspace/page.tsx` — recomposed against the new
  primitives.
- `src/app/app/team/[employee]/page.tsx` — header band only; body
  unchanged in this round.
- `src/components/conduit/Chat.tsx` — `EmptyState` + composer +
  handoff card.
- `src/app/app/layout.tsx` — single change to mount the canvas-tint
  provider.
- `src/components/conduit/Sidebar.tsx` — limited per FR-034/FR-035
  (status pip system + active-route indicator only; rest of sidebar
  untouched).

**Surfaces explicitly NOT in this round** (per spec Out of Scope):
voice room, builds, artifacts, analytics, settings, sales workspace,
onboarding/paywall modals, marketing site.

---

## Technical Context

**Language/Version**: TypeScript 5; React 19.2.4; Next.js 16.2.2 (App
Router). Per Constitution Principle I, the framework version is
load-bearing — this plan does NOT introduce any pattern unsupported on
16.2.2.

**Primary Dependencies** (already installed; this plan adds NONE):
- `next@16.2.2`, `react@19.2.4`, `react-dom@19.2.4`
- `@supabase/ssr@0.10.2`, `@supabase/supabase-js@2.105.3`
- `lucide-react@1.14.0` (icons)
- `tailwindcss@4` via `@tailwindcss/postcss`
- `livekit-client@2.18.9` (consumed by the existing voice-active
  detection; redesign reads its output, does not initialize it)

**Storage**: Supabase Postgres (shared instance `mvuslmfjkkuizixjpkgl`
with Lunaro per Constitution Principle II). **Zero migrations** added
by this plan. All reads route through existing `conduit_*` tables
already used by today's dashboard:
- `conduit_conversations`, `conduit_messages`, `conduit_artifacts`,
  `conduit_memory`, `conduit_voice_sessions`, `conduit_builds`,
  `conduit_engineering_sessions`.
- `sales_leads` — see VERIFY note in `data-model.md §5`. This table
  is read by today's dashboard already; if it is a Lunaro table the
  violation pre-dates this plan and must be flagged separately, not
  silently re-emitted.

**Testing**: no automated test suite — by intent per Constitution
Principle V. Verification is the Vercel preview deploy + 375/390px
mobile sweep + dated `SESSION_REPORT_*`. This plan ships a material
milestone (new console surface treatment + brand-axis premium
rollout) and produces
`SESSION_REPORT_2026-05-XX_PRAXIS_CONSOLE_R15_PREMIUM.md`.

**Target Platform**: Vercel (Next.js deploy of `conduitai.io`); Supabase
(Postgres + RLS).

**Project Type**: Web — Next.js App Router monolith serving Conduit AI
marketing at `/` and the Praxis console at `/app/*` (Constitution
Principle IV — dual-brand single-deploy preserved).

**Performance Goals**:
- First-paint of `/app/workspace` MUST NOT regress vs current
  baseline (today's `Promise.all` of 6 queries stays exactly as is).
- Team-activity polling (R-002) at 60s cadence MUST NOT exceed a
  single round-trip per poll; the new `/api/conduit/team-activity`
  endpoint MUST return a single JSON payload (no streaming).
- Ambient CSS animations MUST run in the compositor (transform +
  opacity + box-shadow only — no layout-triggering properties).
- View Transitions API page transition MUST NOT exceed 360ms end-to-
  end (the spec's hard upper bound for the continuity moment).
- No `box-shadow` animations deeper than 2 layers (spec Assumption 6).
- Zero JS-driven animation loops for any ambient effect (CSS only).

**Constraints**:
- Constitution Principle I: Next.js 16 docs in `node_modules/next/dist/
  docs/` MUST be consulted by the implementer before authoring the
  PR. `node_modules/` is absent in the checkout used to author this
  plan — flagged as R-011 in `research.md`; not a Constitution Check
  fail (the framework footprint is minimal and pattern-aligned with
  existing code), but a tracked pre-implementation gate.
- Constitution Principle II: zero schema changes; zero `lunaro_*`
  reads introduced. Existing `sales_leads` read inherited from
  today's dashboard; flagged for separate investigation, not
  perpetuated by net-new code.
- Constitution Principle III: zero "Claude" / "Anthropic" / "OpenAI"
  / "Sonnet" / "Opus" / "Haiku" / "ElevenLabs" / "LiveKit" strings
  on any redesigned surface; verified by grep at PR time.
- Constitution Principle IV: zero imports from marketing components
  (`src/components/Hero.tsx`, `Footer.tsx`, `Navbar.tsx`, etc.) into
  any redesigned file; `src/proxy.ts` untouched.
- Constitution Principle V: 375 + 390px mobile sweep; light-theme
  sweep; reduced-motion sweep; preview-URL exercise before merge;
  material-milestone `SESSION_REPORT_*` produced.
- Constitution Principle VI: push-to-main; phased rollout (tokens →
  primitives → P1 surfaces → P2 surfaces → motion polish) each lands
  as a fast-merge.
- Spec Assumption 7 (locked): NO JS animation libraries adopted on
  redesigned surfaces. Existing `framer-motion` usage in
  `src/components/{Hero,Pricing,Vision,...}.tsx` is marketing-only
  and untouched by this plan; the `/app/*` namespace continues to
  use zero `framer-motion` imports (verified by grep at
  `src/components/conduit/` — currently zero hits).

**Scale/Scope**:
- 9 employees from `EMPLOYEE_ORDER` (`src/lib/conduit/employees.ts`).
- 3 redesigned surfaces (workspace dashboard, team-page header, chat
  shell empty + composer + handoff).
- 1 limited sidebar update (status pip + active-route indicator only).
- ~10 new client/server components under
  `src/components/conduit/praxis/`.
- 1 new CSS sheet (`praxis-system.css`).
- ~45 new derived CSS custom properties (5 derivations × 9 depts).
- 8-step spacing scale, 3 padding presets, 4 radii, 5 type display
  steps + 5 UI text steps, 3 elevation rest + 3 elevation hover
  tokens, 3 easing curves, 9 rhythm tokens.
- 1 new thin GET route handler.
- 1 new shared hook (`useReducedMotion`).
- 1 new copy ladder module (`composeWelcomeCopy` +
  `composeChatEmptyCopy`).

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

For each gate, record **pass / fail / N/A** with a one-line
justification. A **fail** blocks Phase 0 until either the plan is
revised or the violation is recorded in **Complexity Tracking** below
with an explicit waiver and a rejected simpler alternative.

| # | Principle | Gate question | Verdict |
|---|-----------|---------------|---------|
| 0 | Domain Truth & No Hallucination | Does this plan introduce or rely on Praxis/Conduit AI product domain content — employees, capabilities, pricing tiers, customer logos, integration claims, or terminology (Jarvis, Praxis, voice room, build, artifact, round identifier `R<N>.<M>`)? If yes, cite the source for every domain decision in source-authority order (latest applicable `SESSION_REPORT_YYYY-MM-DD_*.md`, then active `briefs/CONDUIT_BRIEF_*.md`, then `STRATEGY.md`). Unsourced items MUST be flagged **NEEDS CLARIFICATION**, not guessed. If no domain content is introduced, mark **N/A**. | **PASS** — every domain reference is sourced. Roster (9 employees, IDs, display names, colors, roles, taglines, canExecute, voiceCategory) sourced from `src/lib/conduit/employees.ts:41–142` (the codebase's locked source-of-truth, ratified by Constitution v1.0.0 commentary). Atlas-as-display-of-`jarvis`-id sourced from `src/lib/conduit/employees.ts:7–9`. Tier allowlist (which employees the locked-state applies to) sourced from `src/lib/billing/tiers.ts` via `tierById()`. The role-typed pulse cadences in `data-model.md §1.8` (Atlas 4s → Engineering 2s → Compliance 6s) are art-direction values that *interpret* the existing role semantics; they were **proposed in spec.md FR-013/FR-054 and explicitly approved by the operator at GATE 1** (recorded in spec response: "Cadences feel right — lock them"). Zero new employees, departments, capabilities, customer claims, integrations, or pricing tiers are invented. Copy ladder (`composeWelcomeCopy`) is deterministic templating against real `conduit_*` row values — no LLM-generated copy at render time (R-009 explicitly rejects that path). |
| I | Next.js 16 Source-of-Truth | Does this plan touch Next.js APIs, file conventions, framework behavior, caching, routing, server actions, server components, or middleware? If yes, list the specific `node_modules/next/dist/docs/` guides consulted before authoring the plan, and confirm any middleware references use `src/proxy.ts` exporting `proxy(request)` — never `src/middleware.ts`. Deprecation notices surfaced during work MUST be addressed in the same PR or filed as tracked TODOs. If no framework concerns are touched, mark **N/A**. | **PASS (with R-011 follow-up)** — Three framework touchpoints: (a) one new GET route handler at `src/app/api/conduit/team-activity/route.ts` (existing pattern, mirrors `src/app/api/voice/token/route.ts` — Node runtime, owner-scoped via `getCurrentAccount()`); (b) one new `"use client"` React context provider mounted in `src/app/app/layout.tsx` as a child of the existing async server layout (existing pattern — `RouteProgress` and `OnboardingModal` already mount this way); (c) optional View Transitions API usage via `document.startViewTransition()` inside a `"use client"` wrapper triggered on team-card click (browser API, not Next.js API — R-001 explicitly rejects enabling `experimental.viewTransition` in `next.config.ts`). `src/proxy.ts` is NOT touched (no matcher changes, no middleware concerns). `experimental.staleTimes` (`next.config.ts:10–13`) is NOT touched. **R-011 follow-up**: `node_modules/` is absent in the authoring checkout; the implementer MUST run `npm install` and reconcile against `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`, `…/05-server-and-client-components.md`, and `…/03-api-reference/05-config/01-next-config-js/` before merge. If docs disagree, docs win per Principle I. |
| II | Schema Namespacing & Tenant Boundary | Does this plan add or modify Supabase tables, functions, or views? If yes, all new tables MUST be named `conduit_<name>` and ship with `ENABLE ROW LEVEL SECURITY` plus at least one policy in the creating migration. Any read/write from non-`conduit_*` schemas (`auth.users`, `storage.*`, or anything `lunaro_*`) MUST be named and justified — cross-tenant `lunaro_*` reads are forbidden. If no schema changes, mark **N/A**. | **PASS** — zero migrations added. Zero new tables. Zero new mutations. The redesign reads only `conduit_*` tables already queried by today's dashboard (`conduit_conversations`, `conduit_messages`, `conduit_artifacts`, `conduit_memory`, `conduit_voice_sessions`, `conduit_builds`, `conduit_engineering_sessions`). The single new GET route handler (`/api/conduit/team-activity`) is RLS-scoped via the standard server-Supabase client (`createSupabaseServerClient()` → `auth.uid()` via session cookie). **Pre-existing concern flagged** (NOT caused by this plan): today's dashboard reads `sales_leads` (`src/app/app/workspace/page.tsx:77–86`) — that table is NOT `conduit_*`-namespaced. This plan does NOT add new `sales_leads` queries; it preserves the existing read pattern as-is. The implementer MUST file a `[FOLLOW-UP]` in the merging PR noting that `sales_leads` either pre-dates the namespacing convention or requires investigation under Principle II — but this redesign neither fixes nor worsens that gap. |
| III | Brand Integrity & Provider Concealment | Does this plan surface AI-generated content, error messages, debug output, page metadata, or any client-visible UI? If yes, confirm: (a) no "Claude"/"Anthropic"/"OpenAI" strings appear outside `src/lib/ai/provider.ts` and its callers; (b) LLM output is scrubbed of provider-tells at the prompt layer, not the display; (c) marketing routes render "Conduit AI" wordmark + parent-brand tokens, `/app/*` routes render "Praxis" wordmark + in-app tokens — no cross-contamination in components, copy, or page metadata. If no client-visible surface is added, mark **N/A**. | **PASS** — entirely a `/app/*` visual change. (a) Every new file lives under `src/components/conduit/praxis/`, `src/app/app/*`, `src/styles/praxis-system.css`, or `src/app/api/conduit/team-activity/route.ts` — none touches `src/lib/ai/*` and none introduces provider-name strings. The copy ladder (`composeWelcomeCopy`) is deterministic templating with employee display names (sourced from `EMPLOYEES`), event labels ("Marketing finished the 3-post draft"), and never an LLM call → no provider-tell risk. (b) No prompt-layer changes; not applicable. (c) The redesign extends `praxis-tokens.css` (already `.praxis-root`-scoped) and adds `praxis-system.css` (also `.praxis-root`-scoped). The Praxis wordmark on `/app/*` is rendered via the existing `PraxisLogo` component, untouched. Marketing pages and tokens are NOT touched (Constitution IV cross-check below). PR-time grep verification per `quickstart.md §7` enforces the rule. |
| IV | Dual-Brand Single-Deploy | Does this plan add or modify route files or components? If yes, confirm: marketing routes (`/`, `/about`, `/approach`, `/careers`, `/changelog`, `/customers`, `/engineering`, `/pricing`, `/products`, `/trust`) do NOT import from `/app/*` or `src/components/conduit/`; `/app/*` routes do NOT import marketing landing components (`Hero.tsx`, `Footer.tsx`, `Navbar.tsx`); shared primitives live in `src/components/design-system/` only when brand-neutral. Edits to the `src/proxy.ts` matcher MUST document the session-refresh impact on every `/app/*` surface. If no route/component changes, mark **N/A**. | **PASS** — every new or modified file is under `/app/app/*`, `/app/api/conduit/*`, `src/components/conduit/`, `src/hooks/`, or `src/styles/praxis-*`. Zero marketing-route changes. Zero imports of `Hero.tsx`, `Footer.tsx`, `Navbar.tsx`, `Cinematic.tsx`, `Customers.tsx`, `EngineeringProof.tsx`, `FinalCTA.tsx`, `Pricing.tsx`, `ProductTiles.tsx`, `Vision.tsx`, `WaitlistForm.tsx`, or anything from `src/components/marketing/`. The new primitives intentionally live at `src/components/conduit/praxis/`, NOT at `src/components/design-system/`, because they are Praxis-brand-specific (dark canvas, dept jewel-tones, brand purple) — not brand-neutral; they would be inappropriate on Conduit AI marketing surfaces (indigo, light-first). `src/proxy.ts` is NOT touched. PR-time grep verification enforces the import boundary. |
| V | Verification by Preview + Mobile Sweep | What is the verification plan? List: (a) the Vercel preview URL that exercises the affected surface in-browser; (b) the 375px and 390px mobile sweep plan for any UI change; (c) for voice/realtime changes, the LiveKit-room end-to-end exercise plan; (d) whether this qualifies as a material milestone (new surface, ≥3-table migration, brand rollout, voice/realtime change, billing/entitlement change, or round-numbered `R<N>.<M>` increment) requiring a dated `SESSION_REPORT_YYYY-MM-DD_<scope>.md`. "It built" is not sufficient. | **PASS** — (a) PR auto-generated Vercel preview URL exercises `/app/workspace`, `/app/team/[employee]` (all 9 employees), and `/app` (cold + with active conversation). (b) Mobile sweep checklist per `quickstart.md §7`: 375px sweep — dashboard hero readable, KPI tile row collapses to 2-up then 1-up cleanly, team grid → 2 columns, no horizontal scroll, tap targets ≥44px, pulse rhythms slowed per `--rhythm-*` mobile multiplier, chat empty hero readable, composer pill not cramped; 390px sweep — same plus team-page header band; light-theme parallel sweep at both widths; reduced-motion sweep at desktop + 375px. (c) No voice/realtime changes — the redesign READS voice-active state (for `PraxisLiveStrip`) via the existing `conduit_voice_sessions` row state but does NOT initialize LiveKit or modify the voice worker. (d) **Material milestone YES** — brand rollout + new console treatment + round-numbered increment (R15, per the existing `SESSION_REPORT_2026-05-11_PRAXIS_CONSOLE_R1.md` … `R3.md` series cadence). Produces `SESSION_REPORT_2026-05-XX_PRAXIS_CONSOLE_R15_PREMIUM.md` capturing token decisions, primitive decisions, surface migrations, R-001/R-002/R-005/R-008 implementation choices, R-011 doc-reconciliation outcomes, follow-ups (sales_leads investigation, remaining-surface migration plan). |
| VI | Push-to-Main | Will this feature ship via `git push` to `main` (or a short-lived feature branch merged fast-forward into `main`)? Confirm no long-running branch is implied by the plan's phasing, and that preview verification runs on Vercel preview deploys per Principle V. Any anticipated manual `vercel --prod` recovery deploy MUST be justified under **Complexity Tracking** below. | **PASS** — five phases sized for fast-merge cadence: **Phase A** (tokens-only — `praxis-system.css` + the derived tint utilities, no consumers yet) ships as one PR; **Phase B** (primitive components under `src/components/conduit/praxis/*`, no surface consumers yet) ships as one PR; **Phase C** (P1 surfaces — dashboard + team grid + team-page header) ships as one PR; **Phase D** (P2 surfaces — chat shell empty + composer + handoff) ships as one PR; **Phase E** (motion + sidebar pip + design-system docs) ships as one PR. Each phase is a single round-of-work commit sequence merged to `main` after preview verification. No long-running branches. No manual `vercel --prod` anticipated. The Spec Kit `.specify/feature.json` pin for the active feature directory (per the voice-room precedent) is updated to point at `specs/praxis-console-premium-redesign/` for the duration. |

---

## Phase 0 → Phase 1 re-check

**Status**: PASS for all 7 gates after Phase 0 (research.md) and Phase 1
(data-model.md, contracts/{tokens,primitives,surfaces}.md, quickstart.md)
were authored. None of the Phase 0/1 decisions introduced new domain
content, new schema, new provider-name surfaces, marketing-import
crossings, or framework patterns not already in use in this codebase.

Re-check verdict per gate: **0/PASS, I/PASS (with R-011 follow-up
unchanged), II/PASS, III/PASS, IV/PASS, V/PASS, VI/PASS.**

---

## Project Structure

### Documentation (this feature)

```text
specs/praxis-console-premium-redesign/
├── spec.md                          # Locked 2026-05-22 (GATE 1 approved)
├── plan.md                          # This file
├── research.md                      # Phase 0 — 11 decisions (R-001 … R-011)
├── data-model.md                    # Phase 1 — token + primitive + component model
├── quickstart.md                    # Phase 1 — per-story local + preview verification
├── contracts/
│   ├── tokens.md                    # Phase 1 — locked token sheet contract
│   ├── primitives.md                # Phase 1 — primitive component contracts
│   └── surfaces.md                  # Phase 1 — surface-to-primitive mapping
└── tasks.md                         # Phase 2 — created by /speckit-tasks (NOT this command)
```

### Source Code (repository root)

```text
conduit-nextjs/
├── src/
│   ├── app/
│   │   ├── app/
│   │   │   ├── layout.tsx                                  # MODIFY (S-004) — wrap children in PraxisCanvasTintProvider; add `.praxis-canvas-tint` class to <main>
│   │   │   ├── page.tsx                                    # MODIFY (S-003 indirect) — Chat shell consumes PraxisComposerPill etc.
│   │   │   ├── workspace/
│   │   │   │   └── page.tsx                                # MODIFY (S-001) — recomposed: PraxisLiveStrip + PraxisWelcomeHero + PraxisCard(kpi) × 4 + PraxisTeamRoster
│   │   │   └── team/
│   │   │       └── [employee]/
│   │   │           └── page.tsx                            # MODIFY (S-002) — header band only: PraxisAvatar(2xl) + PraxisCanvasTintProvider initialDept
│   │   └── api/
│   │       └── conduit/
│   │           └── team-activity/
│   │               └── route.ts                            # NEW — GET route handler for R-002 polling
│   ├── components/
│   │   └── conduit/
│   │       ├── Chat.tsx                                    # MODIFY (S-003) — EmptyState refactor, composer → PraxisComposerPill, handoff → PraxisHandoffBaton
│   │       ├── Sidebar.tsx                                 # MODIFY (S-005) — status pip → PraxisPulsePip; active-route indicator → gradient stripe
│   │       └── praxis/                                     # NEW namespace
│   │           ├── PraxisCanvasTintProvider.tsx            # NEW — "use client" — provider per R-005
│   │           ├── usePraxisTint.ts                        # NEW — client hook
│   │           ├── PraxisAvatar.tsx                        # NEW — server-safe — chip per P-002
│   │           ├── PraxisPulsePip.tsx                      # NEW — server-safe — pip per P-003
│   │           ├── PraxisCard.tsx                          # NEW — server-safe — universal card per P-001
│   │           ├── PraxisWelcomeHero.tsx                   # NEW — server-safe — hero per P-006
│   │           ├── PraxisLiveStrip.tsx                     # NEW — "use client" — live-strip per P-007
│   │           ├── PraxisTeamRoster.tsx                    # NEW — "use client" — roster per P-008
│   │           ├── PraxisHandoffBaton.tsx                  # NEW — "use client" — handoff per P-009
│   │           ├── PraxisComposerPill.tsx                  # NEW — "use client" — composer per P-010
│   │           └── PraxisSuggestionTile.tsx                # NEW — server-safe — chat empty-state suggestion tile
│   ├── hooks/
│   │   └── useReducedMotion.ts                             # NEW — single source for matchMedia('(prefers-reduced-motion: reduce)')
│   ├── lib/
│   │   └── conduit/
│   │       ├── welcome-copy.ts                             # NEW — composeWelcomeCopy() + composeChatEmptyCopy() deterministic templating
│   │       └── team-activity.ts                            # NEW — server-side helper that the new API route + the dashboard server render both consume
│   └── styles/
│       ├── praxis-tokens.css                               # MODIFY — extend with --rhythm-*, --space-*, --space-card-*, --radius-*, --text-*, --tint-*, --elev-*
│       └── praxis-system.css                               # NEW — .praxis-card / .praxis-avatar / .praxis-pulse / .praxis-canvas-tint / etc., all keyframes
├── supabase/
│   └── migrations/                                         # UNTOUCHED — zero new migrations
├── docs/
│   └── praxis-design-system.md                             # NEW — token reference + primitive catalogue + surface map + motion vocabulary (FR-039)
├── .specify/
│   └── feature.json                                        # MODIFY — pin to specs/praxis-console-premium-redesign/ for the duration of this work
├── SESSION_REPORT_2026-05-XX_PRAXIS_CONSOLE_R15_PREMIUM.md # NEW — material milestone report (Principle V)
└── CLAUDE.md                                               # MODIFY — pointer line "current plan" updates to this plan.md
```

**Structure Decision**: Single-project Next.js App Router monolith. The
marketing surface at `/` and the Praxis console at `/app/*` share one
deploy (Constitution Principle IV — Dual-Brand Single-Deploy). All
deliverables for this feature live under `/app/app/*`, `/app/api/conduit/*`,
`src/components/conduit/`, `src/hooks/`, `src/lib/conduit/`, and
`src/styles/`. No worker repo dependency. No infrastructure changes.

The new primitives live at `src/components/conduit/praxis/`, NOT
`src/components/design-system/`, because they are Praxis-brand-specific
(dark canvas + jewel-tones + brand purple). The `design-system/`
directory remains reserved for genuinely brand-neutral primitives
(Constitution Principle IV's "shared primitives belong in
`src/components/design-system/` only when brand-neutral").

---

## Phasing (informational; details belong in `tasks.md`)

Per Constitution Principle VI (push-to-main, short-lived branches),
the work is sliced into 5 fast-merge phases:

- **Phase A — Tokens**. Extend `praxis-tokens.css`; ship `praxis-system.css`
  with the keyframes + utility classes; ship `useReducedMotion`; ship
  `docs/praxis-design-system.md` v1 (tokens section). **Zero
  consumers yet.** Verification: visual diff on a blank scratch page;
  PR shows token additions with example HTML.
- **Phase B — Primitives**. Ship all 11 components under
  `src/components/conduit/praxis/*`, `composeWelcomeCopy()`,
  `composeChatEmptyCopy()`, `team-activity.ts` helper, and the
  `/api/conduit/team-activity` route handler. **Zero surface
  consumers yet.** Verification: components rendered in a dev-only
  scratch route; visual snapshot.
- **Phase C — P1 surfaces** (the user's tied P1: dashboard + team
  grid + team-page header). Modify `src/app/app/workspace/page.tsx`,
  `src/app/app/team/[employee]/page.tsx`, `src/app/app/layout.tsx`.
  Verification: full `quickstart.md §2 + §3` per-story sweep on
  preview deploy + 375/390/light/reduced-motion matrix.
- **Phase D — P2 chat shell**. Modify `src/components/conduit/Chat.tsx`
  EmptyState + composer + handoff. Verification: `quickstart.md §4`.
- **Phase E — Motion polish + sidebar + docs finalisation**. Sidebar
  pip + active-route indicator (FR-034/035). Ship-celebration trigger
  (R-008). `docs/praxis-design-system.md` v2 (full primitive catalogue
  + surface map). Material-milestone session report. Verification:
  `quickstart.md §6 + §7`.

Each phase merges to `main` after preview verification. STOP-and-VALIDATE
checkpoints at the end of Phase C, Phase D, and Phase E per spec-toolkit
flow.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _(none — all 7 gates PASS)_ | | |

**Note on R-011** (Next.js docs not consultable from this checkout):
This is **not** a constitutional waiver. The Constitution Check passes
on the basis that the framework footprint is minimal and pattern-aligned
with existing code in the repo. R-011 is a **pre-implementation gate**
that the implementer MUST clear by running `npm install` and reconciling
against the actual docs before merging Phase A. If reconciliation
surfaces a conflict, the affected research entry (R-001 most likely)
must be revised and the relevant phase re-planned — that re-plan goes
through GATE 2 again, not into Complexity Tracking.

**Note on pre-existing `sales_leads` namespace gap**: flagged in
Principle II verdict above. Not caused by this plan; not fixed by this
plan. Filed as a `[FOLLOW-UP]` in the merging PR for separate
investigation. This is also NOT a waiver — the plan does not add any
new non-`conduit_*` queries.
