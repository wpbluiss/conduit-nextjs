# Praxis Design Language — R18 Slice 0 (Foundations)

**Date:** 2026-05-23
**Branch:** main (Slice 0 complete; build green)
**Spec:** `specs/praxis-design-language/`
**Round:** R18 Slice 0 — Foundations ONLY (Slice 1 Memory canvas deferred per user GATE 3 directive)

---

## TL;DR

The Praxis Design Language now has its foundation laid: a unified
`--pdl-*` token sheet (light + dark equals), Geist Sans replacing Inter,
a top-10 brand-mark library, and 13 pdl primitives ready for consumption.
**Zero surface regression**: no existing page consumes pdl primitives
yet, so the live app looks identical except for the body-font shift to
Geist. The Memory page, Workspace, Builds cinema, and Chat are untouched.
The new infrastructure is reachable for visual sanity-check at
`/app/pdl-scratch`.

---

## What changed

### New files

| Path | Purpose |
|---|---|
| `src/styles/praxis-design-language.css` | Single source of truth for `--pdl-*` tokens. Dark default on `.praxis-root`; light overrides on `html[data-praxis-theme="light"] .praxis-root` (existing ThemeBoot selector preserved per HR-2). Includes `.pdl-glass`, `.pdl-canvas-grid`, `.pdl-hover-reveal`, `.pdl-scrim`, `.pdl-drawer`, `.pdl-modal`, `.pdl-tooltip`, `.pdl-popover`, `.pdl-node`, `.pdl-pill-tabs`, `.pdl-composer`, `.pdl-brand-chip`, `.pdl-avatar` — all reduced-motion gated and theme-aware. |
| `src/components/conduit/brand-marks/BrandMark{Github,Gmail,Drive,Notion,Slack,Stripe,Supabase,Vercel,Telegram,Whatsapp}.tsx` | 10 simplified geometric brand marks. Each accepts `size` + `className`. Each carries a `// PLACEHOLDER MARK` comment. |
| `src/components/conduit/brand-marks/index.ts` | Exports + `BRAND_MARKS` registry + `BRAND_LABELS` + `BrandKind` type. |
| `src/components/conduit/pdl/BrandChip.tsx` | Circular surface chip containing a brand mark. |
| `src/components/conduit/pdl/DeptIcon.tsx` | Semantic Lucide icon for one of 9 Praxis employees. Reads from `EMPLOYEE_ICON`. Returns null on invalid id (defensive against the deprecated letter-initial path). |
| `src/components/conduit/pdl/Avatar.tsx` | Composes DeptIcon (employee variant) or BrandChip (brand variant). NEVER falls back to text-initials. |
| `src/components/conduit/pdl/HoverReveal.tsx` | Hide-until-hover wrapper. Children are visibility-hidden + opacity 0 by default; parent hover triggers visibility:visible + opacity:1 with 4px translate. Touch devices: always visible. Reduced-motion: opacity-only. |
| `src/components/conduit/pdl/Tooltip.tsx` | Glassmorphic hover-triggered tooltip with 200ms delay, dismiss-on-mouseleave, optional interactive mode for tooltips with internal actions. React Portal. |
| `src/components/conduit/pdl/Popover.tsx` | Glassmorphic click-triggered popover. Outside-click + Escape dismiss. React Portal. |
| `src/components/conduit/pdl/Drawer.tsx` | Right-slide desktop / bottom-sheet mobile. Glassmorphic surface + blurred scrim. Body-scroll lock. |
| `src/components/conduit/pdl/Modal.tsx` | Centered dialog. Reserved for true confirms. |
| `src/components/conduit/pdl/Canvas.tsx` | Wraps `.pdl-canvas-grid`; provides absolute positioning context for Nodes + Edges. |
| `src/components/conduit/pdl/Node.tsx` | Circular graph node, absolutely positioned via translate(-50%, -50%). Hover glow uses tone CSS color or fallback. Ambient pulse on idle (reduced-motion gated). |
| `src/components/conduit/pdl/Edge.tsx` | Quadratic Bezier SVG path between two points. Supports tone + dashed. |
| `src/components/conduit/pdl/PillTabBar.tsx` | 2-3 pill tabs (warns on >3 per the spec rule). Glassmorphic container. |
| `src/components/conduit/pdl/Composer.tsx` | Glassmorphic input shell. Fraunces italic textarea. Optional header (pickers) + footer (actions). cmd/ctrl+Enter submits. |
| `src/app/app/pdl-scratch/page.tsx` | Verification gallery — renders every primitive + all 10 brand marks. Stable URL for sanity-check. |

### Modified files

| Path | Change |
|---|---|
| `package.json` | Added `geist` dependency. |
| `src/app/layout.tsx` | Replaced Inter import with `GeistSans` from `geist/font/sans`. Bound `GeistSans.variable` to `--font-sans`. JetBrains Mono + Fraunces unchanged. Imported `praxis-design-language.css` after `praxis-system.css`. |
| `CLAUDE.md` | Current-plan pointer flipped to `specs/praxis-design-language/plan.md`. |
| `.specify/feature.json` | Pinned to `specs/praxis-design-language`. |

---

## Brand-mark library — important note

The 10 brand marks shipped in Slice 0 are **simplified geometric
placeholders**, not licensed/official brand assets. Each preserves:

- The brand's primary color (or close approximation).
- A simple geometric mnemonic (initial letter, basic shape).
- A clear `// PLACEHOLDER MARK` comment at the top of each file.

This is a deliberate first-pass to ship the wall-of-real-logos signal
internally + on preview deploys without reproducing trademarked artwork.
Swapping each one to the licensed/official mark is per-file with zero
API change — the registry, `BrandChip`, `Avatar`, and any future
consumer remain unchanged.

**Action item before public-facing release**: swap each `BrandMark*.tsx`
to the licensed/official SVG. The structure (component shape, registry,
chip surface) is the load-bearing part — the artwork is the easily-
swappable part.

---

## Hard-to-reverse decisions (locked, per plan §)

All 10 HR items from the plan landed as committed:

- **HR-1** `--pdl-*` prefix — locked.
- **HR-2** `html[data-praxis-theme]` selector (preserved existing ThemeBoot pattern; spec snippet was corrected at implementation time as planned). Light overrides target `html[data-praxis-theme="light"] .praxis-root`. ThemeBoot is untouched.
- **HR-3** Inter → Geist Sans — landed. Visual shift expected on existing surfaces; spacing tuning deferred to per-surface rebuilds.
- **HR-4** JetBrains Mono retained — unchanged.
- **HR-5** Dot-grid 24 px / 1 px — locked in `.pdl-canvas-grid`.
- **HR-6** Color token values (oklch accent + dept jewel-tones for both modes) — landed.
- **HR-7** Glassmorphism recipe (`blur(16px) saturate(180%)`, `0.65 / 0.75` opacities) — single source in `.pdl-glass`.
- **HR-8** `position_x` / `position_y` columns on `conduit_memory` — DEFERRED to Slice 1 (per the plan, this migration is Slice 1's `024_memory_node_positions.sql`).
- **HR-9** `pdl/` namespace — established.
- **HR-10** Top-10 brand-mark roster — vendored as placeholders.

---

## Verification

- `npx tsc --noEmit` — clean.
- `npm run build` — clean. `/app/pdl-scratch` registered in the route table alongside the existing `/app/praxis-scratch` (R15 verification surface). No existing routes changed.
- Existing surfaces unchanged structurally — only the body font has shifted from Inter to Geist. Some surfaces may want minor spacing tuning in a follow-up pass; none should be broken.

### What to do now (per the user's verification ask)

Push to main → Vercel auto-deploys. On the preview:

1. Visit `/app/workspace` — confirm body text reads in Geist Sans (visibly different from Inter; rounder, slightly more refined). Layout unchanged.
2. Visit `/app/memory` — R17 Slice 1 dossier still renders identically. No primitives consumed yet (Slice 1 will replace this surface entirely with the node canvas).
3. Visit `/app/builds` + click a build — cinema renders identically.
4. Switch theme to Light via Settings → Profile → Theme. Confirm both modes render cleanly across the surfaces above.
5. Visit `/app/pdl-scratch` — confirm:
   - All 10 brand marks render in circular chips.
   - All 9 employee avatars render with semantic icons (no letter-initials).
   - Hover-reveal cards: connect-button fades in on hover with glassmorphic surface.
   - Tooltip + Popover: glassmorphic surfaces with backdrop-blur.
   - Drawer + Modal: open/close cleanly, backdrop-blurred scrim.
   - Composer: Fraunces italic textarea.
   - Canvas + Node + Edge: 5-node cluster with dashed edges renders on the dotted grid.
6. Switch theme back and forth on `/app/pdl-scratch` — confirm tokens flip cleanly.

If all six pass, Slice 0 is validated. Slice 1 (Memory canvas) unlocks.

---

## Constitution gates (re-verified post-implementation)

| # | Verdict |
|---|---|
| 0 | PASS — no invented domain content; 9-employee roster preserved; brand-mark library is a documented placeholder roster. |
| I | PASS — `geist` package native to Next 16 / next/font; layout.tsx change is mechanical; `src/proxy.ts` untouched. |
| II | PASS — zero migrations in Slice 0. |
| III | PASS — AI-provider concealment preserved. User-facing external service marks (GitHub/Gmail/etc.) ARE rendered per Principle P1 + the spec's explicit allow. |
| IV | PASS — all new files under `src/components/conduit/pdl/`, `src/components/conduit/brand-marks/`, `src/styles/praxis-design-language.css`, `src/app/app/pdl-scratch/`. Zero marketing imports. |
| V | PASS — material milestone (new design-system infrastructure + new dep + new namespace). This session report serves Principle V's milestone documentation. Mobile/theme sweep deferred to user-driven preview verification. |
| VI | PASS — Slice 0 ships as one merge. |

---

## Deferred — Slice 1 (Memory canvas rebuild)

Per user GATE 3 directive: **Slice 1 does not start until Slice 0 is
preview-validated.** The deferred work is fully scoped in
`specs/praxis-design-language/plan.md §Slice 1 Phasing` and
`contracts/memory-canvas.md`. When Slice 1 starts:

- Migration `024_memory_node_positions.sql` adds `position_x` + `position_y` columns (forward-compat for v2 drag-to-arrange; v1 auto-layouts).
- `auto-layout.ts` cluster-radial algorithm.
- `MemoryCanvas` + `MemoryNode` + `MemoryNodeTooltip` + `MemoryNodeComposer` replace the R17 Slice 1 dossier components.
- R17 components deleted: `MemoryDesk`, `MemorySection`, `MemoryCard`, `MemoryAddForm`. Pickers (Kind, Dept) reused inside the new composer.

---

## Follow-ups

- **Brand-mark licensing pass.** Each `BrandMark*.tsx` is a placeholder. Swap to licensed/official SVGs before any public-facing surface consumes them. Per-file, no API change.
- **Geist Sans spacing tune.** If any existing surface looks visually awkward with Geist vs. Inter (some line-heights may need bumping), file as a per-surface tweak. Not a token change — surface-local CSS.
- **`/app/pdl-scratch` route.** Kept as a stable internal-only verification gallery. Acceptable to leave indefinitely; remove if it ever shows up in user-facing menus (currently only reachable by direct URL).
- **Slice 1 readiness gate.** User signs off on Slice 0 → spec-toolkit GATE 3 reopens for Slice 1 tasks atomization.

---

## End of Slice 0.
