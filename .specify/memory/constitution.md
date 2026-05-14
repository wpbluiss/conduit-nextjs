<!--
SYNC IMPACT REPORT (Constitution v1.0.0 — initial ratification, DRAFT)
======================================================================

Status: RATIFIED 2026-05-14. The drafting trail (Gates 1–3 of the
initial Spec Kit install + constitution-drafting session) is
preserved in the project's git history.

Version change: (none) → 1.0.0 (initial ratification).

Bump rationale: N/A on initial ratification. This document codifies
norms that already govern Praxis Web by current practice — Next.js 16
read-first discipline (AGENTS.md), `conduit_*` schema namespacing
(STRATEGY.md, shared Supabase project with Lunaro), the
`lib/ai/provider.ts` abstraction and no-provider-leak UI rule
(STRATEGY.md), the marketing-vs-Praxis-console dual-brand structure
(`/` vs `/app/*`), the absent automated test suite, and the
push-to-main deploy model on Vercel.

Added principles (all new, this is v1.0.0):
  0. Domain Truth & No Hallucination (NON-NEGOTIABLE)
  I. Next.js 16 Source-of-Truth (NON-NEGOTIABLE)
  II. Schema Namespacing & Tenant Boundary (NON-NEGOTIABLE)
  III. Brand Integrity & Provider Concealment (NON-NEGOTIABLE)
  IV. Dual-Brand Single-Deploy
  V. Verification by Preview + Mobile Sweep
  VI. Push-to-Main

Modified principles: none (initial document).
Removed principles: none (initial document).

Added sections:
  Core Principles
  Operational Standards
  Development Workflow
  Governance

Removed sections: none.

Templates reviewed (vendored by Spec Kit 0.8.11.dev0):
  ⚠ .specify/templates/plan-template.md — needs a Constitution Check
    table mapped to the seven gates (Principle Zero + I–VI) once
    ratified. Until then, plans should hand-roll the gate list from
    this document.
  ✅ .specify/templates/spec-template.md — technology-agnostic;
    Principle Zero applies at plan and implement time, not at spec
    time, and the existing "NEEDS CLARIFICATION" token already covers
    unresolved product-domain questions.
  ✅ .specify/templates/tasks-template.md — no edit required for v1.0.0.
  ✅ .specify/templates/checklist-template.md — no edit required for v1.0.0.

Follow-up TODOs:
  - Wire the seven principle gates into
    `.specify/templates/plan-template.md` so `/speckit-plan` enforces
    them automatically. Tracked but not blocking this ratification.
  - `STRATEGY.md`, `briefs/CONDUIT_BRIEF_R1_2026-05-06.md`, and the
    `SESSION_REPORT_*.md` series are referenced by Principle Zero as
    product-domain source authorities. They exist on disk today; if
    any are renamed, retired, or superseded, an amendment MUST update
    Principle Zero's source-authority clause in the same PR.
  - README.md is currently the default `create-next-app` boilerplate.
    It should be rewritten to point at STRATEGY.md as the real
    source-of-truth — non-blocking, but flagged so the constitution
    isn't the only place that names the source authorities.

RATIFICATION_DATE = 2026-05-14.
LAST_AMENDED_DATE = 2026-05-14.
-->

# Praxis Web Constitution

## Core Principles

### 0. Domain Truth & No Hallucination (NON-NEGOTIABLE)

Praxis Web is the customer-facing surface for **Conduit AI** (parent
brand) and **Praxis** (the AI-employee product). AI agents working on
this repository never invent, embellish, or extrapolate product
concepts — employees, capabilities, copy claims, pricing tiers,
customer logos, integration partners, or domain terminology — beyond
what is explicitly written in the product source authorities.

Rules:

- Employee roster, capabilities, and routing semantics are specified
  in `STRATEGY.md` and `briefs/CONDUIT_BRIEF_*.md`. Do not invent new
  employees (e.g. "Compliance," "HR") for UI surfaces unless they
  are explicitly enumerated in a brief and locked.
- Marketing copy MUST NOT invent customer names, case-study numbers,
  testimonials, integration partners, or compliance certifications.
  If a claim is not grounded in a brief, a session report, or
  customer-verified content, flag the gap and wait — never
  paraphrase a plausible-sounding placeholder into shippable copy.
- Pricing tiers, feature gates, and entitlement labels MUST match the
  current pricing surface in `STRATEGY.md` and the latest
  `migrations/*billing*` schema. No "Pro" tier on the marketing page
  if no `Pro` row exists in the entitlements table.
- Industry terminology and product nouns ("Jarvis," "Praxis,"
  "Conduit AI," "Round R<N>.<M>," "voice room," "employee," "build,"
  "artifact") have specific meanings in this codebase. Use them
  precisely, or flag the uncertainty.
- When in doubt about product domain, the AI flags the uncertainty
  in the agent output and waits for Luis's confirmation. Never
  guesses.

**Source authority**, in conflict order (most recent wins):

1. The latest `SESSION_REPORT_YYYY-MM-DD_*.md` for the surface being
   touched.
2. The active `briefs/CONDUIT_BRIEF_*.md` for the round in progress.
3. `STRATEGY.md` at the repo root.

If these conflict among themselves, the most recently dated artifact
wins; flag the conflict in the agent output so the older authority
can be retired.

**Rationale**: Praxis Web is the surface where prospects evaluate
Conduit AI directly. A single fabricated employee, invented customer
logo, or plausible-sounding-but-fictional integration claim breaks
prospect trust in a way that's instantly visible to the target
customer and silently invisible to the AI that wrote it. Every
other principle assumes the product domain itself is correct; this
one makes that assumption explicit and enforceable.

### I. Next.js 16 Source-of-Truth (NON-NEGOTIABLE)

This repository runs Next.js **16.2.2** with the App Router and React
**19.2.4**. APIs, file conventions, and breaking changes in this
release diverge from what most LLM training corpora encode for
Next.js. Training-data conventions are **not authoritative** —
`node_modules/next/dist/docs/` for the relevant area is.

Rules:

- Before writing or editing code that touches Next.js APIs, file
  conventions, or framework behavior, read the relevant guide in
  `node_modules/next/dist/docs/` and heed any deprecation notices.
- Concrete current-state examples that AI agents MUST honor (and that
  illustrate why this principle exists — these are not the full list):
  - Middleware lives at **`src/proxy.ts`**, not `src/middleware.ts`.
    The exported function is `proxy(request)`, not `middleware(request)`.
  - `experimental.staleTimes` in `next.config.ts` is load-bearing for
    Praxis console responsiveness (`dynamic: 30`, `static: 180`).
    Do not "clean up" what looks unused.
- When the docs and prior training data disagree, the docs win. When
  the docs and an existing pattern in this repo disagree, flag the
  conflict and ask before "fixing."
- Deprecation notices surfaced by the framework (CLI warnings, build
  warnings, dev-server logs) MUST be addressed in the PR that
  surfaces them or filed as a tracked TODO. They MUST NOT be
  ignored or filtered out of CI logs.

**Rationale**: `AGENTS.md` already captures this rule for a reason:
the cost of an agent writing the "right" Next.js code based on
training data and silently breaking middleware, caching, or routing
is high and rediscoverable only at preview time. Elevating the rule
to a NON-NEGOTIABLE principle makes the read-first habit
constitutional rather than aspirational.

### II. Schema Namespacing & Tenant Boundary (NON-NEGOTIABLE)

The Supabase project `mvuslmfjkkuizixjpkgl` is **shared with Lunaro**
(see `STRATEGY.md`). Every Praxis Web table MUST be prefixed
**`conduit_*`**. Code MUST NOT query, modify, or reference any table
outside the `conduit_*` namespace.

Rules:

- Every new table introduced by a `supabase/migrations/NNN_*.sql`
  file MUST be named `conduit_<name>`. The 21 existing migrations
  (001–021) already encode this. Forward-numbered ordering is
  preserved; do not retroactively renumber.
- Every new `conduit_*` table MUST ship with `ENABLE ROW LEVEL
  SECURITY` and at least one policy in the same migration that
  creates it. If a table truly cannot enforce RLS at creation time,
  a `-- TODO(rls): <reason>` comment MUST land in the same migration
  and the gap MUST be tracked in a session report.
- Cross-tenant reads (querying any `lunaro_*` or sibling-app table
  from Praxis Web code) are forbidden. The Supabase server, admin,
  browser, and middleware clients at `src/lib/supabase/` MUST stay
  scoped through Praxis Web's own schema.
- Test data, seeds, and developer scripts (e.g. `scripts/*.ts`) are
  bound by the same rule: writes go to `conduit_*` tables only.

**Rationale**: Lunaro is a sibling product owned by the same operator
on the same Supabase instance. A stray cross-tenant write from
Praxis Web code corrupts Lunaro production data; a stray
cross-tenant read exposes Lunaro customers. The namespace prefix is
the only structural defense against either failure mode and MUST
NOT be relaxed.

### III. Brand Integrity & Provider Concealment (NON-NEGOTIABLE)

Users of Praxis (in `/app/*`) and visitors to Conduit AI surfaces
(at `/`) MUST NEVER see "Claude," "Anthropic," "OpenAI," or any
underlying model-provider branding in UI strings, network responses
visible to the client, error messages, debug surfaces, page
metadata, or generated content. The product is "Praxis" with
employees named "Jarvis," "Marketing," "Engineering," "Sales,"
etc. — that is the entire visible vocabulary for AI labor.

Rules:

- The only sanctioned reference to the underlying provider in this
  codebase is `src/lib/ai/provider.ts` and its callers under
  `src/lib/ai/`. Outside that boundary, provider names MUST NOT
  appear in component code, server-route responses, or template
  strings.
- LLM-generated content surfaced to users (chat replies, generated
  artifacts, voice transcripts) MUST be scrubbed of provider-tells
  ("As an AI assistant…", "I'm Claude, an AI made by Anthropic…",
  "I cannot…" disclaimers that betray a generic chatbot voice) at
  the prompt layer. If a model self-identifies in output, that is a
  prompt regression, not a UX feature — fix at the prompt, not the
  display.
- Brand surfaces are split: marketing pages at `/`, `/about`,
  `/approach`, `/careers`, `/changelog`, `/customers`,
  `/engineering`, `/pricing`, `/products`, `/trust` use the
  "Conduit AI" wordmark and the parent-brand color tokens. Pages
  under `/app/*` use the "Praxis" wordmark and the in-app
  (purple/indigo) tokens. Cross-contamination — a Praxis logo on a
  marketing page, or a Conduit-AI wordmark inside the console — is
  a defect; fix at the source token, do not paper over downstream.
- Page metadata (`<title>`, OpenGraph, favicon) follows the same
  split: marketing routes render "Conduit AI" metadata, `/app/*`
  routes render "Praxis" metadata.

**Rationale**: Provider concealment is a hard product decision in
`STRATEGY.md` ("Users see 'Jarvis,' 'Marketing,' 'Sales,'
'Engineering.' Users do NOT see 'Claude,' 'Anthropic,' or any
provider branding anywhere in the UI"). Brand split between Conduit
AI (parent) and Praxis (product) has wobbled in recent rebrand
rounds — multiple commits exist explicitly to clean up leakage in
one direction or the other. Both are NON-NEGOTIABLE because
provider leakage cheapens the product and brand bleed confuses what
the buyer is looking at.

### IV. Dual-Brand Single-Deploy

Praxis Web is **one Next.js deploy** that serves two product
surfaces: the public Conduit AI marketing site at `/` and the
authenticated Praxis console at `/app/*`. This boundary is
structural and load-bearing.

Rules:

- Marketing routes (`/`, `/about`, `/approach`, `/careers`,
  `/changelog`, `/customers`, `/engineering`, `/pricing`,
  `/products`, `/trust`) MUST NOT import from `/app` route files
  or from `src/components/conduit/` (the Praxis console UI). The
  marketing surface is independently shippable.
- Praxis console routes (`/app/*`) MUST NOT import from marketing
  landing components (`src/components/Hero.tsx`,
  `src/components/Footer.tsx`, `src/components/Navbar.tsx`,
  etc.). The console has its own chrome (`Sidebar`, `Chat`,
  `EmployeeRightRail`).
- Shared primitives belong in `src/components/design-system/` or
  another explicitly shared namespace. "Shared" means: re-themable
  via tokens, brand-neutral copy, no surface-specific assumptions.
- Auth state from Supabase (`src/lib/supabase/{server,browser,
  middleware,admin}.ts`) is the bridge: marketing pages MAY
  call `getUser()` to show a "Sign in" / "Open Praxis" affordance,
  but MUST NOT render console UI inline.
- `src/proxy.ts` is the request-time enforcer of this split —
  preserve its matcher and the session-refresh contract when
  editing.

**Rationale**: A single deploy keeps preview URLs, environment
variables, and the Vercel build pipeline manageable. The structural
import boundary keeps the two surfaces independently legible — a
marketing-only commit doesn't risk breaking the console, and a
console-only commit doesn't risk breaking SEO surfaces. Without
this discipline a single-deploy strategy degenerates into spaghetti
that has to be split apart later under pressure.

### V. Verification by Preview + Mobile Sweep

This repository currently has **no automated test suite** —
intentionally, given the velocity model. Verification is real, but
it lives in human + platform feedback loops, not in `vitest` or
`playwright test`. The constitution acknowledges that as current
reality and codifies the loops that ARE the gate.

Rules:

- Every shippable PR or push-to-main MUST be verified against the
  Vercel preview deploy before being declared done. "It built" is
  necessary but not sufficient; the affected surface MUST be
  exercised in the browser on the preview URL.
- UI changes (marketing or console) MUST be verified at two mobile
  viewport widths: **375px** (iPhone SE / iPhone mini) and **390px**
  (iPhone 14 / 15). Desktop-only verification is incomplete —
  mobile is load-bearing for the user's own demos of the product.
- Voice changes (`src/components/conduit/voice/`, LiveKit wiring,
  Atlas state machine in `docs/atlas-voice-state-machine.md`) MUST
  be exercised end-to-end against a real LiveKit room before
  shipping — voice regressions are silent in preview unless the
  agent actually joins.
- Material milestones MUST produce a dated
  `SESSION_REPORT_YYYY-MM-DD_<scope>.md` (the established naming
  pattern: see `SESSION_REPORT_2026-05-11_PRAXIS_CONSOLE_R1.md`
  through `..._R3.md`). The report captures decisions, deltas, and
  follow-ups so the next session resumes with context.
- "Material milestone" includes: a new product surface, a new
  marketing page, a schema migration touching ≥3 tables, a brand
  rollout, a voice/realtime change, a billing/entitlement change,
  or any round-numbered (R<N>.<M>) increment.

**Rationale**: Pretending a test-first principle exists when there
is no test runner and no test files is theater. The verification
that actually catches regressions in this repo today is preview
deploys, mobile checks, and round-based session reports — codify
those, not aspirations. If and when a test runner lands, this
principle is amended through the normal governance path.

### VI. Push-to-Main

Production deploys MUST happen via `git push` to `main`. Vercel's
Git integration is the deploy mechanism for `conduitai.io` and is
the only sanctioned production path.

Rules:

- The `main` branch is the trunk. Direct pushes to `main` are
  expected and normal — this is not a long-branch repository.
- Feature branches are allowed for atomic, in-progress work (e.g.
  `feat/conduit-chat-shell-v1`, per `STRATEGY.md` pre-flight), but
  MUST be **short-lived**: branch from `main`, merge back fast-
  forward, and delete. A branch open beyond a single round-of-work
  is a smell.
- Manual `vercel --prod` MUST NOT be the default deploy path and
  SHOULD only be used to recover from a Git-integration incident.
- Hot fixes go to `main`; previews from a recovery branch are
  available on every push.
- Vercel preview deploys cover non-`main` branches automatically;
  use them to verify before merging back, in accordance with
  Principle V.

**Rationale**: Long-running branches drift from `main`, accumulate
merge debt, and silently outdate themselves against shared
infrastructure (schema, env vars, dependency versions). A sibling
Praxis repo has paid the integration cost of long-lived branches as
a cautionary tale; the discipline here is to keep branches short
and trunk-based by default. Push-to-main with preview verification
gives us speed without giving up the audit trail.

## Operational Standards

**Stack**: Next.js 16.2.2 (App Router) + React 19.2.4 + TypeScript 5;
Tailwind v4 via `@tailwindcss/postcss`; ESLint 9 with
`eslint-config-next`. The framework version is load-bearing per
Principle I and MUST NOT be downgraded to recover from an
incompatibility — fix forward.

**Persistence**: Supabase (PostgreSQL + RLS) via `@supabase/ssr`
0.10.2 and `@supabase/supabase-js` 2.105.3. SSR-correct client split
under `src/lib/supabase/`: `server.ts`, `browser.ts`,
`middleware.ts`, `admin.ts` — use the right client for the right
context. Migrations live in `supabase/migrations/NNN_<scope>.sql`,
forward-numbered, namespaced `conduit_*` per Principle II.

**AI / model provider**: `@anthropic-ai/sdk` 0.95.0 today. All
model calls MUST route through `src/lib/ai/provider.ts`. Adding a
new provider is a `provider.ts` change plus an env-var change, not
a sprinkling of new SDK imports across route handlers.

**Voice**: LiveKit (`livekit-client` 2.18.9, `livekit-server-sdk`
2.15.2). The Atlas state machine
(`docs/atlas-voice-state-machine.md`) is the reference for cut-off
handling, AGC posture, and roundtable join/leave semantics.

**Billing**: Stripe ^22. Entitlement and tier state lives in
`conduit_*` tables; the marketing pricing surface MUST reflect the
schema (Principle Zero applies).

**Branding tokens**: `src/app/globals.css` carries the token system
v3 (light-first, indigo accent for Conduit AI marketing; in-app
purple for Praxis). Cross-brand contamination is a token-level fix,
not a per-component override (Principle III applies).

**Middleware**: `src/proxy.ts` (Next.js 16 rename of `middleware.ts`).
Wires Supabase session refresh for every non-static request via the
matcher in that file. Editing the matcher or removing
`updateSession` requires explicit consideration of every
authenticated surface under `/app/*`.

**Doc artifacts**: `STRATEGY.md`, `briefs/CONDUIT_BRIEF_*.md`,
`SESSION_REPORT_*.md`, and `SESSION_HANDOFF_*.md` at the repo root
are not noise — they are the product memory and Principle Zero's
source authorities. Do not gitignore them or sweep them into a
subdirectory without an amendment.

## Development Workflow

**Read-first habit**: Before writing or editing code touching
Next.js framework concerns, read the relevant guide in
`node_modules/next/dist/docs/`. This is Principle I in action and
applies to routing, caching, server components, server actions,
middleware/`proxy`, and config.

**Conventional commits**: Commits follow the existing repo style —
`feat(<scope>): …`, `fix(<scope>): …`, `chore(<scope>): …`,
`docs(<scope>): …`, `perf(<scope>): …`. Round-based work uses
`feat(praxis-console): R<N>.<M> — <summary>`. Keep the scope tight
and the subject under ~72 chars; details go in the body.

**Session reports**: Required for material milestones per
Principle V. Naming pattern: `SESSION_REPORT_YYYY-MM-DD_<SCOPE>.md`
at the repo root. Capture decisions, deltas, follow-ups; this is
what lets the next session — human or AI — resume cold.

**Round-of-work cadence**: Round identifiers (`R1`, `R2`, `R3.1`,
`R3.4`, `R15.5`, etc.) are the natural unit of work — they appear
in commit messages, session reports, and briefs. Honor the
in-flight round when scoping new work; cross-round scope creep
should be split into a new round.

**Mobile sweep**: 375px and 390px viewport widths, per Principle V.
The user demos the site from an iPhone — desktop-only verification
is incomplete.

**Spec-Kit flow**: Non-trivial features SHOULD route through
`/speckit-specify` → `/speckit-clarify` (when scope is ambiguous) →
`/speckit-plan` → `/speckit-tasks` → `/speckit-implement`. Once the
plan template is updated per the Sync Impact Report follow-up,
each `/speckit-plan` run MUST pass the seven Constitution Check
gates (Principle Zero + I–VI) before Phase 0 research begins. Any
gate waiver MUST be entered into the plan's **Complexity Tracking**
table with a concrete justification and an explicitly-rejected
simpler alternative.

**End-of-session habit**: When wrapping a session, leave the repo
in a state where `git status` is clean (or with deliberate
uncommitted scratch noted in a session report). The next session
opens cold; cleanliness is the kindest gift.

## Governance

This constitution supersedes ad-hoc decisions and prior working
norms. When a runtime guidance doc (`AGENTS.md`, `CLAUDE.md`,
`STRATEGY.md`, a session report, or a brief) conflicts with a
principle here, **the constitution governs and the runtime doc MUST
be updated to match in the same PR that surfaces the conflict**.

**Amendment procedure**: Constitutional changes land via a commit
that edits `.specify/memory/constitution.md` and propagates updates
through `.specify/templates/*` per a fresh Sync Impact Report
prepended to this file as an HTML comment. Luis approves all
amendments; co-founder review is solicited where the amendment
touches product domain (Principle Zero source authorities) or
brand (Principle III surfaces).

**Versioning policy** (semver of intent, not of code):

- **MAJOR**: A principle is removed, materially redefined, or
  reordered in a way that invalidates prior plans or session-report
  interpretations.
- **MINOR**: A new principle, a new operational standard, or a new
  workflow rule is added, or guidance is materially expanded.
- **PATCH**: Wording, clarification, typo, or non-semantic
  refinement that leaves every existing gate's pass/fail outcome
  unchanged.

If a bump type is ambiguous, the amending commit MUST argue the
bump in its message before merging.

**Compliance review**: Once the plan template is wired (Sync Impact
Report follow-up), every `/speckit-plan` run MUST surface explicit
**pass / fail / N/A** on each of the seven principle gates
(Principle Zero + Principles I–VI) before proceeding to Phase 0
research.

**Runtime guidance**: Day-to-day agent behavior lives in `AGENTS.md`
and `CLAUDE.md`. They are subordinate to this constitution. When
updating either file, check that no statement contradicts the
principles above; if it does, the runtime doc bends, not the
constitution.

**Version**: 1.0.0 | **Ratified**: 2026-05-14 | **Last Amended**: 2026-05-14
