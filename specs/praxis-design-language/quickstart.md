# Phase 1 Quickstart — Praxis Design Language

**Date**: 2026-05-23
**Status**: Phase 1 complete — per-slice verification recipes

Verification matrix per Constitution Principle V. Run on Vercel preview
deploys before merging to `main`.

---

## §0. Preflight

- Confirm the preview deploy is live (Vercel auto-deploys the branch).
- Sign in as the internal_account operator (Luis).
- DevTools → Network → "No throttling" by default.
- Slice 0 only: confirm `geist` package is installed (`grep geist package.json`).
- Slice 1 only: confirm migration `024_memory_node_positions.sql` applied via Supabase MCP.

---

## §1. Slice 0 — Foundations (deployable base; zero surface regression)

### §1.1 Font swap (Inter → Geist)

1. Visit `/app/workspace`. Confirm body text renders with Geist Sans (visibly distinct from Inter; check the "What Praxis knows" / KPI tile text shapes).
2. Visit `/app/memory` (R17 dossier — still present in Slice 0). Confirm text renders with Geist Sans.
3. Visit `/app/builds/[session]` (R16 cinema). Confirm stage band serif still Fraunces; raw-log panel still JetBrains Mono; body text Geist Sans.
4. Confirm no console errors.

**Acceptance**: the font shift is visible but NOT regressed. Spacing may
need minor tuning per surface in a follow-up Slice 0 patch — that's
acceptable and expected.

### §1.2 Token sheet loaded

1. DevTools → Elements → inspect any `.praxis-root` element.
2. Confirm `--pdl-canvas`, `--pdl-surface`, `--pdl-accent`, `--pdl-dept-marketing` etc. are defined.
3. Switch theme to light via Settings → Profile → Theme → Light.
4. Re-inspect. Confirm light-theme overrides applied (`--pdl-canvas: #F7F4EE`).
5. Switch back to dark.

### §1.3 Existing surfaces unchanged

Slice 0 must NOT modify any existing surface. Walk:
1. `/app/workspace` — KPI tiles, team roster, live strip. Visually identical to before Slice 0 (modulo font shift).
2. `/app/memory` — R17 dossier sections (Global + 9 dept). Identical except Geist body.
3. `/app/builds` — index + cinema route. Identical.
4. `/app/team/marketing` (or any dept). Identical.
5. Sidebar. Identical.

If ANY surface looks visually different beyond the font, investigate
before merging.

### §1.4 Brand-mark library smoke test

(No surface consumes the marks yet in Slice 0. Verify via a one-off
inspection.)

1. In dev: create a temporary scratch page (`src/app/app/praxis-scratch/page.tsx`) that imports + renders all 10 brand marks side-by-side at `size=48`.
2. Visit `/app/praxis-scratch`. Confirm all 10 marks render:
   - GitHub octocat (black on light / white on dark via theme handling).
   - Gmail envelope (full color).
   - Drive triangle (full color).
   - Notion N (mono).
   - Slack hash (4 colors).
   - Stripe S (purple).
   - Supabase lightning (green).
   - Vercel triangle (mono).
   - Telegram plane (blue).
   - WhatsApp bubble (green).
3. Switch theme to light. Confirm theme-aware marks (GitHub, Notion, Stripe, Vercel) flip to their light variants.
4. Delete the scratch page before merge.

### §1.5 Constitution V matrix (Slice 0)

| Dimension | Pass |
|---|---|
| Vercel preview URL | All §1.1-§1.4 recipes pass |
| 375 px viewport | Existing surfaces unchanged at mobile (sweep workspace + memory + builds) |
| 390 px viewport | Same |
| Light theme | §1.2 |
| Dark theme | (default — confirmed throughout) |
| Reduced motion | Existing motion vocabulary unchanged; reduced-motion still gates |
| No provider strings | `grep -r "Claude\|Anthropic\|OpenAI\|Sonnet\|Opus\|Haiku" src/components/conduit/pdl/ src/components/conduit/brand-marks/ src/styles/praxis-design-language.css` returns 0 hits |
| `src/proxy.ts` untouched | `git diff --stat src/proxy.ts` returns 0 |
| No schema changes | `git diff --stat supabase/migrations/` returns 0 |

### §1.6 Session report

`SESSION_REPORT_2026-05-XX_PDL_FOUNDATIONS.md` at repo root.

---

## §2. Slice 1 — Memory canvas rebuild (the proof-point)

### §2.1 Migration applied

1. Query: `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='conduit_memory' AND column_name IN ('position_x', 'position_y');`
2. Confirm both columns exist, type `real`, nullable.

### §2.2 Surface renders

1. Visit `/app/memory`.
2. Confirm dotted-grid canvas (24 px spacing, faint dots).
3. Confirm clusters of glowing nodes — Global at center, 9 dept clusters in a ring around.
4. Confirm subtle curved edges from cluster centers to nodes; dashed edges from Global center to each dept cluster center.
5. Confirm no "+ Add memory" buttons anywhere on the surface (composer is summoned by canvas click).

### §2.3 Node hover

1. Hover over any node.
2. Within ~200 ms, a glassmorphic tooltip appears with:
   - Kind chip (top, eyebrow style).
   - Memory content (Fraunces italic, body-lg, max 3 lines).
   - Scope chips (DeptIcon per scope; "Everyone" chip for global).
   - 4 affordances in a row: pin, lock, edit, archive.
3. Move mouse off the node → tooltip dismisses (after a short hover-delay to allow moving into the tooltip).
4. Move mouse onto the tooltip itself → tooltip stays open.

### §2.4 Composer (canvas click)

1. Click any empty area of the canvas.
2. A glassmorphic composer panel slides in near the click point.
3. Panel contains: kind picker (5 chips), dept picker (Everyone + 9 chips), Fraunces italic textarea, tags input, Save / Cancel.
4. Type "User runs a fictional bookstore in Brooklyn" + select "fact" kind + leave scope empty (Everyone).
5. Click Save.
6. Composer dismisses; a new glowing node materializes in the Global cluster with a 600 ms pulse.

### §2.5 Pin / lock / edit / archive

1. Hover an existing node → tooltip.
2. Click pin → node becomes larger (56 → 72 px) and glows brighter. Refresh → still pinned.
3. Click lock → small lock icon appears on the node. Tell Atlas in chat to update that fact; confirm Atlas's `[SUPERSEDE]` is skipped (the locked memory stays).
4. Click edit → tooltip transforms into an inline edit composer with the same content pre-filled.
5. Click archive → node fades out; canvas re-layouts the remaining nodes.

### §2.6 Per-employee chat invariant preserved

(R17 Slice 1 invariant — re-verify after the Slice 1 rebuild.)

1. Add a Marketing-scoped memory via the canvas composer ("User's brand voice is warm and direct" scoped to Marketing only).
2. Open chat with Marketing — confirm the memory is in context.
3. Open chat with Sales — confirm the memory is NOT in context.
4. Open chat with Atlas — confirm Atlas sees both global and Marketing-scoped (Atlas sees all).

### §2.7 Mobile sweep

1. DevTools → device emulation: iPhone SE (375 px).
2. Visit `/app/memory`. Confirm:
   - Canvas fills viewport.
   - Cluster radius scaled down to fit.
   - Some clusters may overlap if many nodes — acceptable for v1.
   - Tap a node → tooltip appears as bottom sheet.
   - Tap empty canvas → composer opens as bottom sheet.
3. Repeat at 390 px.

### §2.8 Theme parity

1. Switch to light. Confirm:
   - Canvas is bone (#F7F4EE).
   - Dots subtle and dark (~6% opacity).
   - Node fills white; glow uses deepened accent.
   - Tooltip glass-surface (75% opacity white + blur).
   - Dept tones deepened — Marketing reads as warm rust, not bright orange.
   - Text contrast acceptable everywhere.
2. Switch back to dark; confirm full parity in reverse.

### §2.9 Reduced motion

1. DevTools → Rendering → emulate `prefers-reduced-motion: reduce`.
2. Hover a node → tooltip appears with opacity fade (no translate, no pulse).
3. Click empty canvas → composer appears without slide animation.
4. Add a memory → new node appears with opacity fade (no scale-pulse).

### §2.10 Constitution V matrix (Slice 1)

| Dimension | Pass |
|---|---|
| Vercel preview URL | All §2.1-§2.9 recipes pass |
| 375 + 390 mobile | §2.7 |
| Light + dark | §2.8 |
| Reduced motion | §2.9 |
| No provider strings | `grep -r "Claude\|Anthropic\|OpenAI" src/components/conduit/memory/ src/styles/memory-canvas.css` returns 0 hits |
| No marketing imports | grep new code |
| Memory chat invariant | §2.6 |
| Migration applied | §2.1 |
| `src/proxy.ts` untouched | git diff |

### §2.11 Deletion check

After Slice 1 merge:
- `git status` confirms `MemoryDesk.tsx`, `MemorySection.tsx`, `MemoryCard.tsx`, `MemoryAddForm.tsx`, `memory-desk.css` deleted.
- `npx tsc --noEmit` clean (no orphan imports).
- `npm run build` clean.

### §2.12 Session report

`SESSION_REPORT_2026-05-XX_MEMORY_CANVAS.md` at repo root.

---

## §3. End-to-end user-validation walk

(After Slice 1 merges + the user deploys.)

1. **Open `/app/memory`** for the first time. Confirm the first impression matches the spec's "unforgettable moment" framing: spatial canvas with glowing nodes, no chrome, immediate sense of "what Praxis knows."
2. **Add 5-10 memories across scopes**: 2 global (Conduit, Lunaro identity), 2 Marketing (brand voice, ICP), 1 Engineering (repo name), 1 Sales (top ICP).
3. **Pin the 2 globals**. Confirm they enlarge + glow brighter.
4. **Lock one global**. Tell Atlas in chat to update it. Confirm Atlas's supersede is silently ignored.
5. **Open chat with each dept** (Marketing, Sales, Engineering, Atlas). Confirm the scoped memories surface in the right contexts.
6. **Refresh canvas**. Confirm layout is deterministic (same node positions every time).
7. **Mobile**: open `/app/memory` on phone. Confirm canvas reflows; tap interactions work; tooltips become bottom sheets.

If all 7 pass, the design-language proof-point is validated. The user
signs off, and the rest of the rebuild order (Sidebar → Settings → etc.)
unlocks for future rounds.
