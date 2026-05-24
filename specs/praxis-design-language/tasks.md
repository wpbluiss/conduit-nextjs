# Tasks — Praxis Design Language (R18)

**Input**: Design documents from `specs/praxis-design-language/`
**Status**: GATE 3 approved 2026-05-23. **Slice 0 ONLY** (Foundations) targeted now; Slice 1 (Memory canvas) deferred until Slice 0 is preview-validated.

**Convention**: `[ID]` task; `[P]` parallel-safe; file paths absolute from repo root.
**Tests**: No automated tests per Constitution Principle V. Verification = `quickstart.md §1` matrix on Vercel preview + dated session report.

---

## Phase 1: Setup

- [ ] **T001** Update `.specify/feature.json` to pin `"feature_directory": "specs/praxis-design-language"`.
- [ ] **T002** Create directories: `src/components/conduit/pdl/` and `src/components/conduit/brand-marks/`.

---

## Phase 2: Foundational — S0.A token sheet

- [ ] **T003** Write `src/styles/praxis-design-language.css` per `contracts/foundations.md §1`. Single file, two selector blocks (`.praxis-root` dark default + `html[data-praxis-theme="light"] .praxis-root` light override). Full `--pdl-*` tokens, `.pdl-glass` + `.pdl-canvas-grid` utilities.
- [ ] **T004** Import `praxis-design-language.css` from `src/app/layout.tsx`, AFTER `praxis-system.css` and BEFORE `engineering-cinema.css` + `memory-desk.css`.

---

## Phase 3: S0.B Geist Sans swap

- [ ] **T005** `npm install geist`. Verify package added to `package.json`.
- [ ] **T006** Modify `src/app/layout.tsx`: replace `import { Inter } from "next/font/google"` with `import { GeistSans } from "geist/font/sans"`. Delete the `const inter = Inter({...})` block. In the `<html>` tag, replace `${inter.variable}` with `${GeistSans.variable}`. Keep `JetBrains_Mono` + `Fraunces` unchanged.

---

## Phase 4: S0.C brand-mark library

- [ ] **T007** [P] `BrandMarkGithub` — octocat silhouette (theme-aware: `#181717` dark text on light / `#FFFFFF` on dark).
- [ ] **T008** [P] `BrandMarkGmail` — red envelope with M, full color.
- [ ] **T009** [P] `BrandMarkDrive` — tri-color triangle (blue/yellow/green).
- [ ] **T010** [P] `BrandMarkNotion` — capital N (theme-aware mono).
- [ ] **T011** [P] `BrandMarkSlack` — 4-color hash mark.
- [ ] **T012** [P] `BrandMarkStripe` — stylized S in Stripe purple.
- [ ] **T013** [P] `BrandMarkSupabase` — lightning bolt in Supabase green.
- [ ] **T014** [P] `BrandMarkVercel` — triangle (theme-aware mono).
- [ ] **T015** [P] `BrandMarkTelegram` — paper plane in Telegram blue.
- [ ] **T016** [P] `BrandMarkWhatsapp` — chat bubble + phone in WhatsApp green.
- [ ] **T017** Write `src/components/conduit/brand-marks/index.ts` exporting all 10 components + `BRAND_MARKS: Record<BrandKind, ComponentType>` registry + `BrandKind` type per `data-model.md §3.2`.

---

## Phase 5: S0.D 13 pdl primitives

**All primitives live in `src/components/conduit/pdl/`.** Each file co-locates its TypeScript types and a brief JSDoc naming the spec FR + plan §.

- [ ] **T018** [P] `BrandChip.tsx` per `contracts/foundations.md §2.1`.
- [ ] **T019** [P] `DeptIcon.tsx` per `contracts/foundations.md §2.2`.
- [ ] **T020** [P] `Avatar.tsx` per `contracts/foundations.md §2.3` — composes DeptIcon or BrandChip.
- [ ] **T021** [P] `HoverReveal.tsx` per `contracts/foundations.md §2.4`.
- [ ] **T022** [P] `Tooltip.tsx` per `contracts/foundations.md §2.5`.
- [ ] **T023** [P] `Popover.tsx` per `contracts/foundations.md §2.6`.
- [ ] **T024** [P] `Drawer.tsx` per `contracts/foundations.md §2.7`.
- [ ] **T025** [P] `Modal.tsx` per `contracts/foundations.md §2.8`.
- [ ] **T026** [P] `Canvas.tsx` per `contracts/foundations.md §2.9`.
- [ ] **T027** [P] `Node.tsx` per `contracts/foundations.md §2.10`.
- [ ] **T028** [P] `Edge.tsx` per `contracts/foundations.md §2.11` (SVG component).
- [ ] **T029** [P] `PillTabBar.tsx` per `contracts/foundations.md §2.12`.
- [ ] **T030** [P] `Composer.tsx` per `contracts/foundations.md §2.13`.

---

## Phase 6: S0.E verify

- [ ] **T031** Add a pdl gallery section to the existing `src/app/app/praxis-scratch/page.tsx` (or create one if missing) — renders all 10 brand marks at 48px size + a sampling of pdl primitives (Avatar in both variants, Tooltip + Popover triggers, a Canvas + Node + Edge example). NOTE: this gallery stays as a permanent operator-only surface (it's already in the route table); the user can delete it later if they prefer.
- [ ] **T032** Run `npx tsc --noEmit` — must be clean.
- [ ] **T033** Run `npm run build` — must produce a successful production build.
- [ ] **T034** Manual smoke (user verification step): visit `/app/workspace`, `/app/memory`, `/app/builds`, `/app/team/marketing` on preview deploy. Confirm: existing surfaces look essentially identical except font (Geist body); no console errors. Switch theme between light + dark via Settings → Profile; both render. Visit `/app/praxis-scratch` — pdl gallery + brand marks render correctly in both themes.
- [ ] **T035** Update `CLAUDE.md` "current plan" pointer to `specs/praxis-design-language/plan.md`.
- [ ] **T036** Write `SESSION_REPORT_2026-05-XX_PDL_FOUNDATIONS.md` at repo root. Document: token sheet shape, font swap result (visual notes per surface), brand-mark library inventory, primitive inventory, build status, follow-ups (Slice 1 readiness).

**Slice 0 merge gate (= Phase 6 complete)**: build green; existing surfaces unchanged at the behavior level; new infrastructure in place. **DO NOT START SLICE 1 (MEMORY CANVAS REBUILD) UNTIL THIS CHECKPOINT IS USER-APPROVED.**

---

## Phase 7: Slice 1 (deferred)

**Status**: DEFERRED. Held until Slice 0 is preview-validated.

Slice 1 tasks (T037+) authored at Slice 1 GATE 3 time, after Slice 0 ships.
The plan's §Slice 1 Phasing sketch (S1.A migration → S1.B auto-layout →
S1.C canvas + node + tooltip + composer → S1.D page rewrite + deletions
→ S1.E memory-canvas.css → S1.F verify) is the input; full atomization
happens once Slice 0 is in production.

---

## Dependencies

**Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6.**

Within Phase 4: T007–T016 are [P] (different files, no inter-dependencies); T017 (registry) depends on all 10.

Within Phase 5: T018–T030 are [P] (different files). Avatar (T020) imports DeptIcon (T019) + BrandChip (T018) — but TypeScript module resolution handles this; tasks can be written in any order and compile resolves at build time.

Within Phase 6: T031 depends on T018–T030 (gallery imports primitives) + T017 (gallery imports brand marks). T032 / T033 depend on everything before. T034 is the user verification step (on preview deploy). T035 / T036 last.

Critical path: T001/T002 → T003 → T004 → T005 → T006 → (T007…T016) → T017 → (T018…T030) → T031 → T032 → T033 → user verification (T034) → T035 → T036.

---

## Implementation strategy

Slice 0 is one deployable validated slice per the user's GATE 2 directive.
**Zero surface regression is the bar.** Phase 6's verification confirms
that. After Phase 6 merges + the user signs off, Slice 1 (Memory canvas
rebuild) becomes the next gate.
