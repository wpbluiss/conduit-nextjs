# Implementation Plan: Praxis Design Language (R18)

**Branch**: `main` (push-to-main per Constitution Principle VI; short-lived feature branches allowed)
**Date**: 2026-05-23
**Spec**: [`spec.md`](./spec.md) (GATE 1 approved 2026-05-23; 10 decisions locked)
**Round**: R18 (parallel to R17 connector Slice 2; the design language is the language R17 Slice 2 ships in)

**Input**: Per the user's GATE 2 directive, the design language ships in two
**independent deployable slices**. Slice 0 is the foundations (tokens, Geist
Sans swap, pdl primitives, top-10 brand-mark library) — a deployable base
that every later surface depends on. Slice 1 is the Memory canvas rebuild —
the proof-point that validates the language end-to-end. Slice 1 starts only
after Slice 0 is preview-validated.

---

## Summary

### Slice 0 — Foundations (deployable base, no surface rebuild yet)

The token sheet, the font swap, the primitive components, and the top-10
brand-mark SVG library. **Nothing user-visible changes** at the surface level
during Slice 0 — existing surfaces continue to render with the existing
tokens. The new `--pdl-*` tokens, `pdl/` primitives, and `brand-marks/`
library sit alongside the existing system, ready for consumption.

This slice is deliberately invisible. The user can deploy and use the app
without noticing. What they get is the **infrastructure that makes the
rest of the design language possible** — and they get a build that's
still green, with all existing surfaces unchanged.

**~12-15 new files, 2 modified files (`layout.tsx` for the font swap,
`package.json` for the geist dep). Zero schema changes. Zero existing
surface touched.**

### Slice 1 — Memory canvas rebuild (the proof-point)

Replace the dossier (R17 Slice 1, just shipped) with a node-graph on a
dotted-grid canvas. The unforgettable moment per the spec: glowing nodes
in clusters by scope, glassmorphic hover tooltip with affordances, single
canvas-click NodeComposer for adds, auto-layout v1.

**~6 new components, ~3 component replacements, 1 new style sheet, 1
migration (forward-compat `position_x`/`position_y` columns even though
v1 uses auto-layout). The R17 Slice 1 components (MemoryDesk, MemorySection,
MemoryCard, MemoryAddForm) are deleted; the kind/dept pickers are
reused inside the new NodeComposer.**

After Slice 1 ships and the user validates the language end-to-end on
the Memory canvas, the rest of the rebuild order from the spec
(Sidebar → Settings → Workspace → Chat → Connectors-S2-native → modals
→ voice review) unlocks.

---

## Hard-to-reverse decisions (called out per user directive)

These commitments are expensive to undo once Slice 0 ships. **Lock with
intent**; do not change later without a deliberate amendment.

| # | Decision | Why hard to reverse | Status |
|---|---|---|---|
| **HR-1** | **`--pdl-*` CSS token prefix** | Every primitive component CSS in `pdl/*` will reference `--pdl-canvas`, `--pdl-surface`, etc. Renaming after consumers exist = sweep of every component + every consumer's surface CSS. | **LOCKED at GATE 1.** Carrying forward. |
| **HR-2** | **`html[data-praxis-theme]` theme selector** (existing pattern, **not** the spec's draft `.praxis-root[data-theme]`) | `ThemeBoot.tsx` already writes `data-praxis-theme` to `<html>` pre-paint. Switching the selector would require rewriting `ThemeBoot`, the theme-persistence column semantics, and migrating every existing `[data-praxis-theme]` rule. NOT worth it. | **LOCKED at plan time** — extend existing pattern; do NOT introduce `data-theme`. Spec's mention of `[data-theme="dark"]` is corrected here to `[data-praxis-theme="dark"]`. |
| **HR-3** | **Inter → Geist Sans** | Geist has slightly different font metrics than Inter. Components tuned for Inter line-heights / spacing may shift. Once spacing is re-tuned to Geist, swapping back = re-tuning every surface. | **LOCKED at GATE 1.** Carrying forward. Mitigation: ship in Slice 0 BEFORE any surface rebuilds, so the rebuilds tune to Geist from day one. |
| **HR-4** | **JetBrains Mono retained** | Mono is used in build cinema raw-log panel, code blocks, file paths. Already in `layout.tsx`. Geist Mono was alternative; locked OUT in favor of JetBrains. | **LOCKED at GATE 1.** No change required. |
| **HR-5** | **Dot-grid spacing 24 px / 1 px dots** | Auto-layout for the Memory canvas (Slice 1) and any future canvas surface will tune node positions to multiples of 24 px. Changing dot spacing later = re-tuning every layout to the new grid. | **LOCKED at plan time.** Spec value carried forward. |
| **HR-6** | **Color token values** (specific oklch coordinates for `--pdl-accent`, dept-light variants) | Once components/marks/glow-effects are calibrated to these specific values, contrast + visual rhythm shifts on any change. Re-tune cost = sweep of every dept-tinted surface for contrast. | **LOCKED at GATE 1.** Carrying forward. |
| **HR-7** | **Glassmorphism recipe** (`blur(16px) saturate(180%)`, `rgba(..., 0.65)` dark / `rgba(..., 0.75)` light) | Once popovers/tooltips/drawers/modals all use the same recipe, changing the blur radius or saturation is a one-line CSS change BUT changing the rgba opacity values requires QA on every glass surface to confirm legibility. | **LOCKED at GATE 1.** Single source of truth in CSS = the only safe lock. |
| **HR-8** | **`position_x` + `position_y` columns on `conduit_memory`** | Forward migration to add (cheap, NULL-able). Reverse migration to drop = trivial in a vacuum, but if any code path has come to depend on the columns, dropping requires that code path to be ripped first. We're adding the columns in Slice 1 even though v1 uses auto-layout — explicit forward bet per the user's directive. | **LOCKED at GATE 2** (this plan). Columns ship NULL-able; auto-layout v1 ignores them; v2 drag-to-arrange populates them. |
| **HR-9** | **`pdl/` component namespace** | Every primitive lives under `src/components/conduit/pdl/`. Renaming the namespace = sweep of every consumer import. | **LOCKED at GATE 1.** Carrying forward. |
| **HR-10** | **The top-10 brand-mark roster** (GitHub, Gmail, Drive, Notion, Slack, Stripe, Supabase, Vercel, Telegram, WhatsApp) | These 10 SVGs are vendored into `brand-marks/`. Adding more later = cheap. Removing one after a connector / surface depends on it = each consumer has to fall back to a generic chip OR be deleted. | **LOCKED at GATE 1** (user explicitly chose top-10 upfront). |

**Cheap-to-reverse** (NOT flagged; safe to iterate later):
- Spacing scale values, radii, elevation shadow values, motion duration values, motion easing curves.
- Individual primitive component shape (signature can evolve; CSS class names can be aliased).
- Auto-layout algorithm for the Memory canvas v1 (cluster-based radial; can swap to force-directed later if the look is wrong).
- The Slice 1 visual treatment of any specific node (glow intensity, hover-tooltip exact placement).
- The number of Settings tabs (3 vs 4 vs 2 — design tuning, not a token).

---

## Technical Context

**Language/Version**: TypeScript 5; React 19.2.4; Next.js 16.2.2 (App Router).
Per Constitution Principle I, the framework version is load-bearing.

**Primary Dependencies** (already installed except as noted):
- `next@16.2.2`, `react@19.2.4`, `react-dom@19.2.4`
- `@supabase/ssr@0.10.2`, `@supabase/supabase-js@2.105.3`
- `@anthropic-ai/sdk@0.95.0`
- `lucide-react`
- `tailwindcss@4` via `@tailwindcss/postcss`
- **Slice 0 NEW dep**: `geist` (Vercel's Geist font package — ships GeistSans + GeistMono via `next/font`-compatible exports). We use GeistSans only (per HR-4 we keep JetBrains Mono via the existing `next/font/google` import).

**Storage**: Supabase Postgres (shared instance `mvuslmfjkkuizixjpkgl` with Lunaro per Constitution Principle II).
- **Slice 0**: zero migrations.
- **Slice 1**: ONE migration (`024_memory_node_positions.sql`):
  - `ALTER TABLE conduit_memory ADD COLUMN position_x real, ADD COLUMN position_y real` — nullable, no default. Auto-layout v1 ignores; future drag-to-arrange populates.

**Testing**: no automated test suite (Constitution Principle V). Verification per slice = preview deploy + manual exercise + dated session report.

**Target Platform**: Vercel (Next.js deploy of `conduitai.io`); Supabase (Postgres + RLS).

**Project Type**: Web — Next.js App Router monolith (Constitution Principle IV).

**Performance Goals**:
- Slice 0 has zero surface change; no user-facing performance impact.
- Slice 1 Memory canvas first paint ≤ 800 ms on a warm cache for an account with ≤ 50 memories. Auto-layout v1 runs synchronously during render; for 50 nodes, the calculation is bounded (~5 ms).
- Hover-reveal animation runs in the compositor (transform + opacity only).
- Glassmorphic surfaces use CSS `backdrop-filter`; native browser support handles the blur — no JS animation loops.

**Constraints**:
- Constitution Principle I: re-confirm Next.js 16 patterns for the `next/font` setup with `geist`. Verified at plan time: `geist` package exports `GeistSans` compatible with `next/font` v15+; works with Next 16.
- Constitution Principle II: Slice 1's migration is `conduit_*`-namespaced (extending an existing table). RLS inherited from existing policy.
- Constitution Principle III: AI-provider concealment preserved (no Claude/Anthropic/OpenAI/etc. strings). The brand-mark library renders REAL third-party logos (GitHub, Gmail, Drive, Notion, Slack, Stripe, Supabase, Vercel, Telegram, WhatsApp) — these are user-facing external services, NOT concealed AI providers. The distinction is documented in `spec.md §Principles P1`.
- Constitution Principle IV: zero marketing imports introduced. `src/proxy.ts` untouched.
- Constitution Principle V: each slice = preview-deploy verification per `quickstart.md`; material milestones produce session reports.
- Constitution Principle VI: each slice = one fast-merge cycle. No long branches.

**Scale/Scope**:
- Slice 0: ~12-15 new files, 2 modified, 1 new dep. ~400-600 LoC of primitives + tokens + brand SVGs.
- Slice 1: ~6 new components, ~5 deletions (R17 Slice 1 components), 1 migration, 1 new style sheet. ~400-500 LoC delta.

---

## Constitution Check

### Slice 0 (foundations)

| # | Principle | Verdict | Justification |
|---|---|---|---|
| 0 | Domain Truth | **PASS** | No invented domain content. Top-10 brand-mark roster is sourced from spec.md (Luis's explicit choice); SVGs vendored from canonical brand guideline pages. Geist Sans is Vercel's font (real, in production). |
| I | Next.js 16 | **PASS** | Font swap via `geist` package which exports `next/font`-compatible bindings. Verified compatibility with Next 16. No middleware / proxy / config changes. |
| II | Schema Namespacing | **PASS** | Zero migrations. |
| III | Brand Integrity & Provider Concealment | **PASS** | AI providers (Claude/Anthropic/OpenAI/ElevenLabs/LiveKit) remain concealed. User-facing external service marks (GitHub, Gmail, Drive, Notion, Slack, Stripe, Supabase, Vercel, Telegram, WhatsApp) are vendored as real SVG marks per the spec's explicit P1 rule and user's GATE 1 directive. The Praxis wordmark + Conduit AI wordmark brand split is preserved. |
| IV | Dual-Brand Single-Deploy | **PASS** | All new files under `src/components/conduit/pdl/*`, `src/components/conduit/brand-marks/*`, `src/styles/praxis-design-language.css`. Zero marketing imports. The `.praxis-root` scope ensures the new CSS never reaches the Conduit AI marketing site. `src/proxy.ts` untouched. |
| V | Verification by Preview + Mobile Sweep | **PASS** | Slice 0 has zero surface change; verification is "the app still builds and existing surfaces look identical." Material milestone YES (new design-system infrastructure + new dep + new namespace) → produces `SESSION_REPORT_2026-05-XX_PDL_FOUNDATIONS.md`. |
| VI | Push-to-Main | **PASS** | One merge. No long branches. |

### Slice 1 (Memory canvas rebuild)

| # | Principle | Verdict | Justification |
|---|---|---|---|
| 0 | Domain Truth | **PASS** | The Memory canvas operates on existing `conduit_memory` rows + the new design language. No invented domain content. The 9-employee `EMPLOYEE_ORDER` roster (still the source of truth for dept identification) carries forward. |
| I | Next.js 16 | **PASS** | One existing route is rewritten (`src/app/app/memory/page.tsx`). Standard server-render + client-component pattern. New canvas/node primitives are pure React (no framework experiments). `src/proxy.ts` untouched. |
| II | Schema Namespacing | **PASS** | Migration `024_memory_node_positions.sql` adds two NULL-able columns (`position_x`, `position_y`) to existing `conduit_memory`. RLS inherited from existing `owners_full_access` policy. No new tables. |
| III | Brand Integrity & Provider Concealment | **PASS** | Memory canvas surface is `/app/*` (Praxis brand). Zero AI-provider strings. Employee identification uses `DeptIcon` (semantic Lucide icons from `EMPLOYEE_ICON` registry); zero text-initials, zero dept-colored text headers. |
| IV | Dual-Brand Single-Deploy | **PASS** | All new files under `src/app/app/memory/`, `src/components/conduit/memory/`, `src/styles/memory-canvas.css`. Zero marketing imports. |
| V | Verification by Preview + Mobile Sweep | **PASS** | Material milestone YES (first surface rebuilt in the new design language). Preview-URL exercise per `quickstart.md §2`. Mobile sweep at 375 + 390 px — canvas adapts to narrow viewports via auto-layout density reduction. Light + dark theme + reduced-motion sweep. Produces `SESSION_REPORT_2026-05-XX_MEMORY_CANVAS.md`. |
| VI | Push-to-Main | **PASS** | One merge. Slice 1 = one cohesive surface rebuild. |

**Both slices net**: 7/7 PASS each. No waivers. The pgcrypto / encryption-at-rest precedent from R17 Slice 2 is unrelated to R18.

---

## Project Structure

### Documentation (this feature)

```text
specs/praxis-design-language/
├── spec.md                           # GATE 1 approved 2026-05-23
├── plan.md                           # This file (GATE 2)
├── research.md                       # Phase 0 — decisions on locked items + reasoning
├── data-model.md                     # Phase 1 — token surface + brand-mark library + node-graph entities
├── quickstart.md                     # Phase 1 — per-slice verification recipes
├── contracts/
│   ├── foundations.md                # Slice 0 — pdl/* primitives + CSS token contracts
│   └── memory-canvas.md              # Slice 1 — canvas/node/edge + auto-layout contract
└── tasks.md                          # Phase 2 — created by GATE 3 (NOT this command)
```

### Source code — Slice 0 (foundations)

```text
src/
├── app/
│   └── layout.tsx                                            # MODIFY — replace Inter import with GeistSans; keep JetBrains Mono; keep Fraunces. Import praxis-design-language.css.
├── components/
│   └── conduit/
│       ├── brand-marks/                                      # NEW namespace
│       │   ├── index.ts                                      # re-exports + a kind→component map
│       │   ├── BrandMarkGithub.tsx
│       │   ├── BrandMarkGmail.tsx
│       │   ├── BrandMarkDrive.tsx
│       │   ├── BrandMarkNotion.tsx
│       │   ├── BrandMarkSlack.tsx
│       │   ├── BrandMarkStripe.tsx
│       │   ├── BrandMarkSupabase.tsx
│       │   ├── BrandMarkVercel.tsx
│       │   ├── BrandMarkTelegram.tsx
│       │   └── BrandMarkWhatsapp.tsx
│       └── pdl/                                              # NEW namespace
│           ├── BrandChip.tsx                                 # composes brand-marks/* into a theme-aware chip
│           ├── DeptIcon.tsx                                  # semantic Lucide icon for 9 Praxis employees
│           ├── Avatar.tsx                                    # circular surface containing DeptIcon or BrandChip
│           ├── HoverReveal.tsx                               # hide-until-hover utility wrapper
│           ├── Tooltip.tsx                                   # glassmorphic, hover-triggered, max-width 280px
│           ├── Popover.tsx                                   # glassmorphic, click-triggered, absolute positioning
│           ├── Drawer.tsx                                    # glassmorphic, right-slide (desktop) / bottom-sheet (mobile)
│           ├── Modal.tsx                                     # glassmorphic, centered, reserved for true confirms
│           ├── Canvas.tsx                                    # wraps .pdl-canvas-grid; positioning context for Nodes
│           ├── Node.tsx                                      # graph node with glow + hover-reveal + tone
│           ├── Edge.tsx                                      # curved SVG path between two nodes
│           ├── PillTabBar.tsx                                # 2-3 pill tabs max per surface
│           └── Composer.tsx                                  # glassmorphic chat-style input shell
├── styles/
│   └── praxis-design-language.css                            # NEW — single source of truth for --pdl-* tokens (both themes), .pdl-glass recipe, .pdl-canvas-grid, motion vocabulary
└── (CSS imported in src/app/layout.tsx alongside existing sheets)
```

**Notable absences in Slice 0**:
- No new top-level routes.
- No rebuild of the Sidebar, Settings, Workspace, or Chat surfaces.
- No deletion of any existing component.
- No schema changes.
- Geist Mono — explicitly LOCKED OUT in favor of JetBrains Mono (HR-4).

### Source code — Slice 1 (Memory canvas rebuild)

```text
src/
├── app/
│   └── app/
│       └── memory/
│           └── page.tsx                                      # REWRITE — server fetch carries forward; mounts <MemoryCanvas> instead of <MemoryDesk>
├── components/
│   └── conduit/
│       └── memory/
│           ├── MemoryDesk.tsx                                # DELETE (replaced by MemoryCanvas)
│           ├── MemorySection.tsx                             # DELETE (no sections on canvas)
│           ├── MemoryCard.tsx                                # DELETE (replaced by MemoryNode)
│           ├── MemoryAddForm.tsx                             # DELETE (replaced by MemoryNodeComposer)
│           ├── MemoryKindPicker.tsx                          # KEEP — reused by MemoryNodeComposer
│           ├── MemoryDeptPicker.tsx                          # KEEP — reused by MemoryNodeComposer
│           ├── MemoryCanvas.tsx                              # NEW — top-level orchestrator; consumes auto-layout; renders <Canvas> + <Node>s + <Edge>s
│           ├── MemoryNode.tsx                                # NEW — wraps <Node> with memory-specific tone (scope-derived) + hover tooltip mount
│           ├── MemoryNodeTooltip.tsx                         # NEW — glassmorphic content + affordances (pin, lock, edit, archive); uses <Tooltip>
│           ├── MemoryNodeComposer.tsx                        # NEW — glassmorphic composer panel (uses <Composer>); positioned at click point
│           └── auto-layout.ts                                # NEW — pure function: (memories[]) → Record<id, {x, y}>. Cluster-radial algorithm (Global at center, dept clusters in a ring).
├── styles/
│   ├── memory-desk.css                                       # DELETE (replaced by memory-canvas.css)
│   └── memory-canvas.css                                     # NEW — canvas-specific styles built on --pdl-* tokens
└── (CSS imported in src/app/layout.tsx — delete memory-desk.css line, add memory-canvas.css line)

supabase/
└── migrations/
    └── 024_memory_node_positions.sql                         # NEW — ALTER TABLE conduit_memory ADD COLUMN position_x real, ADD COLUMN position_y real
```

**Structure Decision**: Single-project Next.js App Router monolith. The new
`pdl/` namespace lives at `src/components/conduit/pdl/` (sibling to `praxis/`,
`builds/`, `engineering/`, `memory/`). This explicitly separates the
design-language primitives from feature-specific components. Future surface
rebuilds CONSUME pdl primitives instead of inventing their own.

---

## Slice 0 Phasing

Goal: deployable foundations with zero surface regression.

### S0.A — Token sheet + theme selector confirmation
- Write `src/styles/praxis-design-language.css` with full `--pdl-*` token sheet (both themes via `html[data-praxis-theme="dark|light"] .praxis-root` per HR-2). Glassmorphism `.pdl-glass` utility class. Dot-grid `.pdl-canvas-grid` utility class. Motion duration/easing CSS vars.
- Import from `src/app/layout.tsx` (after existing praxis sheets).
- No surface change.

### S0.B — Font swap (Inter → Geist Sans)
- `npm install geist`
- Modify `src/app/layout.tsx`: replace `Inter` import with `GeistSans` (the package's `next/font`-compatible export). Keep JetBrains Mono. Keep Fraunces. Bind `GeistSans.variable` to `--font-sans`.
- Visual smoke: existing surfaces render with Geist Sans body. Expect *some* visual shift due to font metrics; spec-time accepts this. If a specific surface regresses badly, tune per-surface line-height in a follow-up Slice 0 patch — not a re-design.

### S0.C — Brand-mark library
- Vendor 10 canonical SVG marks under `src/components/conduit/brand-marks/`:
  - GitHub (octocat), Gmail (envelope), Google Drive (triangle), Notion (N), Slack (hash), Stripe (S), Supabase (lightning), Vercel (triangle), Telegram (paper plane), WhatsApp (chat bubble).
- Each component accepts `size` + optional `className`. Returns inline SVG that respects `currentColor` where appropriate; brand-specific colors otherwise locked per brand guidelines.
- `index.ts` exports a `BRAND_MARKS: Record<BrandKind, ComponentType>` map for dynamic lookup.

### S0.D — pdl primitives (the foundation library)
- Write the 12 primitives listed in §Project Structure: BrandChip, DeptIcon, Avatar, HoverReveal, Tooltip, Popover, Drawer, Modal, Canvas, Node, Edge, PillTabBar, Composer.
- Each primitive lives in a single file with co-located TypeScript types.
- Each primitive consumes `--pdl-*` tokens via inline `style` OR via shared CSS classes in `praxis-design-language.css`.
- Each primitive includes a brief JSDoc comment naming the spec FR it implements.

### S0.E — Verify + report
- `npx tsc --noEmit` clean. `npm run build` clean.
- Visit `/app/workspace`, `/app/memory`, `/app/builds`, `/app/team/marketing` on preview deploy. Confirm:
  - Existing surfaces look essentially identical (slight font shift acceptable).
  - No console errors.
  - Both light and dark themes render.
- Produce `SESSION_REPORT_2026-05-XX_PDL_FOUNDATIONS.md`.

**Slice 0 merge gate**: build green; existing surfaces unchanged at the
behavior level; new infrastructure in place. **STOP. Get user sign-off
before starting Slice 1.**

---

## Slice 1 Phasing

Goal: Memory canvas v1 ships as the proof-point of the new language.

### S1.A — Migration
- `024_memory_node_positions.sql` — adds `position_x real` + `position_y real` columns to `conduit_memory`. Both NULL-able. No default. RLS inherited.
- Apply via Supabase MCP (`apply_migration`).
- Verify by direct SQL inspection.

### S1.B — Auto-layout algorithm (pure TS)
- Write `src/components/conduit/memory/auto-layout.ts`:
  - Input: `MemoryRecord[]`, viewport dimensions.
  - Output: `Record<memoryId, { x: number; y: number }>`.
  - Algorithm: cluster-based radial. Global cluster at center. 9 dept clusters arranged in a circle around center at radius R (proportional to viewport). Within each cluster, nodes laid out in a small grid (offset by cluster center). Nodes scoped to multiple depts position closest to the LAST dept in their scope (deterministic ordering).
  - Bonus: if `memory.position_x` AND `memory.position_y` are non-null, USE those (forward-compat for v2 drag-to-arrange).
- No surface consumer yet.

### S1.C — Canvas + Node + Tooltip + Composer (memory-specific)
- `MemoryCanvas.tsx` — top-level surface. Server-fetches via existing query; runs auto-layout; mounts `<Canvas>` + `<MemoryNode>` for each row + `<Edge>` for inter-cluster links. Listens for empty-canvas click to open the composer.
- `MemoryNode.tsx` — wraps `<Node>`; reads memory.scope for tone (first scope = primary tint; global = neutral); mounts `<MemoryNodeTooltip>` via `<HoverReveal>`.
- `MemoryNodeTooltip.tsx` — glassmorphic via `<Tooltip>`. Shows memory.content (Fraunces italic), kind chip, scope chips (`<DeptIcon>` per scope), 4 affordances (pin, lock, edit, archive). Affordances are full-opacity buttons within the tooltip.
- `MemoryNodeComposer.tsx` — glassmorphic panel via `<Composer>`. Includes the existing `MemoryKindPicker` + `MemoryDeptPicker` + textarea + tags input + save. Positioned at the click point.

### S1.D — Page mount + deprecations
- Rewrite `src/app/app/memory/page.tsx`: same server fetch + scope join, but mount `<MemoryCanvas>` instead of `<MemoryDesk>`.
- Delete `MemoryDesk.tsx`, `MemorySection.tsx`, `MemoryCard.tsx`, `MemoryAddForm.tsx`.
- Delete `src/styles/memory-desk.css`. Remove its import from `layout.tsx`.
- Add `src/styles/memory-canvas.css` import to `layout.tsx`.

### S1.E — Style sheet
- `src/styles/memory-canvas.css` — canvas-specific tuning: node sizing per kind, glow intensity, edge curvature, tooltip max-width, composer panel sizing, mobile canvas reflow (≤ 640 px: simplified cluster layout, larger nodes, fewer edges).

### S1.F — Verify + report
- `npx tsc --noEmit` clean. `npm run build` clean.
- Apply migration to remote. Verify columns exist (SC-style).
- Walk `quickstart.md §2` recipes on preview:
  - Open `/app/memory` — confirm dotted-grid canvas with clustered glowing nodes.
  - Hover a node — confirm glassmorphic tooltip appears with content + affordances.
  - Click empty canvas — confirm composer opens at click point.
  - Add a memory — confirm a new node materializes with a brief pulse.
  - Pin / lock / edit / archive — confirm round-trip persistence.
  - Open chat with Marketing — confirm scoped memories still work in prompts (R17 Slice 1 invariant preserved).
- Mobile sweep at 375 + 390. Light + dark theme. Reduced-motion sweep.
- Produce `SESSION_REPORT_2026-05-XX_MEMORY_CANVAS.md`.

**Slice 1 merge gate**: canvas renders, hover-reveal works, composer adds
nodes, chat-route memory invariants preserved. The user uses the surface
to feed Praxis context and validates the new design language. **STOP. No
Sidebar / Settings / Workspace / Chat rebuild until this checkpoint is
user-approved.**

---

## Phase 0 → Phase 1 re-check

**Status**: COMPLETE — `research.md` (Phase 0 — 8 decisions documenting
the locked items + irreversibility analysis), `data-model.md` (token
surface + brand-mark library + node-graph entities + migration shape),
`contracts/{foundations,memory-canvas}.md` (per-slice contracts), and
`quickstart.md` (per-slice verification) all authored alongside this plan.

**Re-check verdict per slice**:

| Slice | 0 | I | II | III | IV | V | VI |
|---|---|---|---|---|---|---|---|
| **Slice 0 (foundations)** | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| **Slice 1 (Memory canvas)** | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

Nothing in Phase 0/1 authoring surfaced a hidden framework requirement,
schema requirement, or brand-axis conflict that would force a return
through GATE 2.

---

## Complexity Tracking

> Fill only if Constitution Check has violations that must be justified.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _(none — all 7 gates PASS in both slices)_ | | |

**Notes on residual risk + new precedents** (NOT waivers — forward-pointers):

- **Geist Sans font swap (Slice 0)** is a NEW dependency for this repo. Re-evaluates Spec Assumption "zero new deps" from R16 and (briefly) R17. Justified: Geist is the cleanest path to the spec's anti-Inter principle. Mitigation: ships in Slice 0 BEFORE any surface rebuild so all rebuilds tune to Geist from day one.
- **Brand-mark vendoring (Slice 0)** introduces a new operational precedent: SVG marks of real third-party services are checked into the repo. Brand guidelines for each mark are honored at vendoring time; if a brand changes its guideline post-vendor, the marks may drift. Acceptable for v1; future polish includes a periodic refresh check.
- **`position_x` / `position_y` columns (Slice 1)** are a forward bet — auto-layout v1 ignores them; v2 drag-to-arrange consumes them. Adding them now is cheap; removing them later requires a follow-up migration. Locked at HR-8.
- **The `data-praxis-theme` theme selector (HR-2)** is INTENTIONALLY divergent from the spec's casual draft of `data-theme`. The plan locks `data-praxis-theme` to preserve `ThemeBoot` + existing light-theme rules. The spec's CSS snippet is corrected at implementation time; no spec rewrite required.

---

## Worker dependencies (out-of-repo)

None. Both slices are pure in-repo work.

---

## What this plan does NOT do (deferred to later rounds)

Per the spec's adoption plan and the user's GATE 2 directive that Slice 1
is the ONLY surface rebuild in this round:

- Sidebar rebuild (deferred to a future round; mandated by the language but not part of R18).
- Settings tab consolidation (6 → 3) — deferred.
- Workspace dashboard rebuild — deferred.
- Chat composer rebuild — deferred.
- Connectors-S2 rebuild in the new language — happens natively when R17 Slice 2 implements; will use `pdl/*` primitives from day one.
- Modal/drawer retrofit (Onboarding, Paywall, Continue) — deferred.
- Voice room — stays "intentionally dark in both themes" per P7; documented as a deliberate exception, not flagged for rebuild.
- Build cinema — per user directive P6, KEEP time-sequenced shape; just retoken + hover-reveal Abort/Close in a future polish pass (NOT this round).

Each deferred surface unlocks once Slice 1 is preview-validated. The order
will be re-confirmed at that point; today's spec proposes Sidebar →
Settings → Workspace → Chat → modal retrofit, but that ordering is
non-binding until the user validates the language proof-point.
