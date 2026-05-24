# Phase 0 Research — Praxis Design Language

**Date**: 2026-05-23
**Status**: Phase 0 complete

Eight locked decisions documented with the reasoning that produced them.
The hard-to-reverse decisions are also enumerated in `plan.md §Hard-to-
reverse decisions`; this document expands the reasoning trail.

---

## R-001 — Slice split (foundations before proof-point)

**Question**: Bundle the design language + Memory canvas in one round, or split?

**Decision**: **Split.** Slice 0 = foundations (deployable base, zero
surface regression). Slice 1 = Memory canvas (the proof-point). **Locked
by user at GATE 2.**

**Investigation**: Foundations land tokens, font, primitives, brand-mark
library — invisible to the user but a structural commitment. Memory
canvas rebuilds an existing surface and consumes the foundations. If
both ship together, a surface bug in Slice 1 could mask a foundation
bug or vice versa; splitting them gives the foundations a clean
verification window.

**Rejected**: Coupled ship. Increases blast radius if anything regresses.

---

## R-002 — Font: Inter → Geist Sans

**Question**: Keep Inter or swap?

**Decision**: **Swap to Geist Sans.** **Locked by user at GATE 1.**

**Investigation**:
- frontend-design skill principles explicitly forbid Inter ("avoid generic AI aesthetics — Inter, Roboto, Arial").
- Geist is Vercel's font; modern, premium, distinctly NOT Inter; ships free via the `geist` npm package which integrates natively with Next.js's `next/font`.
- Considered alternatives: General Sans (paid), Untitled Sans (paid), IBM Plex Sans (free, established, but feels less premium than Geist).
- Geist Sans has slightly different font metrics than Inter — most components will look fine but spacing may shift slightly. Mitigation: ship in Slice 0 BEFORE any rebuild, so rebuilds tune to Geist from day one.

**Rejected**: Keep Inter (violates spec principle); General Sans (paid + adds licensing complexity); IBM Plex Sans (acceptable fallback if Geist fails for any reason).

---

## R-003 — Mono font

**Question**: Pair with Geist Mono or keep JetBrains Mono?

**Decision**: **Keep JetBrains Mono.** **Locked by user at GATE 2.**

**Investigation**: User prefers JetBrains for distinctiveness on code /
IDs / file paths. Geist Mono would pair more cohesively with Geist Sans
but is less distinctive. Trade-off accepted.

---

## R-004 — Theme selector pattern

**Question**: Reuse existing `html[data-praxis-theme]` (current) or introduce a new `[data-theme]` selector per the spec's draft snippet?

**Decision**: **Keep `html[data-praxis-theme]`** (HR-2 in plan.md).
**Locked at plan time.**

**Investigation**:
- `src/components/conduit/ThemeBoot.tsx` already writes `data-praxis-theme` to `<html>` pre-paint.
- `src/styles/praxis-tokens.css:158-212` already targets `html[data-praxis-theme="light"]`.
- Switching to `data-theme` would require: rewriting `ThemeBoot`, migrating every existing rule, and updating the theme-persistence column semantics in `conduit_accounts.theme_preference`.
- Zero benefit; pure cost.

**Action**: The spec's casual draft snippet `.praxis-root[data-theme="dark"]`
is corrected at implementation time to `html[data-praxis-theme="dark"]
.praxis-root`. No spec rewrite required.

---

## R-005 — Color tokens (specific values)

**Question**: What exact oklch / hex values for `--pdl-*` colors?

**Decision**: **Spec values carried forward** (`spec.md §Tokens — Color`).
**Locked at GATE 1.**

**Investigation**:
- Brand purple `oklch(58% 0.22 290)` (dark) / `oklch(42% 0.20 290)` (light) preserves the Praxis purple axis established in R14.
- Dept jewel-tones dark variants carried from existing `praxis-tokens.css:70-87`.
- Dept jewel-tones light variants are NEW: deepened/desaturated for legibility on the bone canvas. Each value chosen for ~4.5:1 contrast against `#F7F4EE` per WCAG AA on text use; AAA where possible.
- Glassmorphic surface opacity values (65% dark / 75% light) are chosen to balance legibility (content readable through the blur) with depth (canvas visible behind).

**Verification at implementation time**: contrast-check every dept-tinted
surface in light theme using browser DevTools or a contrast checker tool.

---

## R-006 — Dot-grid spacing

**Question**: What grid spacing for the dotted-canvas background?

**Decision**: **24 px grid, 1 px dots.** **Locked at GATE 2** (HR-5).

**Investigation**:
- 24 px aligns to the existing spacing scale (`--pdl-space-lg`).
- 1 px dots read as texture on dark canvas (opacity ~5%) and bone canvas (opacity ~6%); not visual noise.
- Memory canvas auto-layout snaps node centers to multiples of 24 px for visual rhythm.
- Considered: 16 px (too dense, reads as graph paper), 32 px (too sparse, dots feel decorative-not-spatial).

**Rejected**: 16 px (overcrowded); 32 px (loses the "spatial" feel).

---

## R-007 — Brand-mark vendoring scope

**Question**: Vendor top-10 brand SVGs upfront or drip as needed?

**Decision**: **Top-10 upfront.** **Locked by user at GATE 1.**

**Investigation**:
- User's framing: "the wall-of-real-logos is the single biggest `$100M` signal — don't drip it."
- Top-10 selected by user: GitHub, Gmail, Drive, Notion, Slack, Stripe, Supabase, Vercel, Telegram, WhatsApp.
- Each mark vendored from canonical brand-guideline source. Inline SVG component per mark. `currentColor`-friendly where the brand allows; brand-specific fills where required.
- Top-10 covers the immediate R17 Slice 2 connector roadmap (GitHub, Gmail at least) PLUS the most likely future connector kinds (Drive, Notion, Slack, Stripe, Supabase, Vercel, Telegram, WhatsApp).

**Rejected**: Drip-as-needed (kills the visual moment of seeing the marketplace populated); top-5 only (misses Slack/Notion/Stripe immediacy).

---

## R-008 — Memory canvas: positions auto-layout vs persisted

**Question**: v1 uses auto-layout. Should the schema gain columns now for v2 drag-to-arrange?

**Decision**: **Auto-layout v1 + add `position_x`/`position_y` columns
now (NULL-able).** **Locked by user at GATE 2** (HR-8).

**Investigation**:
- Auto-layout v1 is simpler to ship and good enough for the proof-point.
- Adding NULL-able columns now is essentially free (no data backfill, no constraint changes).
- Removing columns later requires a migration; adding them later also requires a migration. Net: adding now is cheap forward-bet vs. cheap backward-cost. User wins by avoiding the future migration.
- Auto-layout v1 algorithm: cluster-based radial.
  - Global cluster at viewport center.
  - 9 dept clusters arranged in a ring around center at radius R = min(viewport.width, viewport.height) × 0.32.
  - Within each cluster, up to 8 nodes laid out in a 3-column grid centered on the cluster point.
  - Multi-scope memories position closest to the FIRST scope in `EMPLOYEE_ORDER` (deterministic).
  - `MemoryRecord.position_x !== null && position_y !== null` → use those instead of derived position (forward-compat for v2).

**Rejected**: Persisted positions for v1 (adds drag UX work that's not the proof-point); no columns now (kicks the migration into v2 when it's more expensive to coordinate).
