# Tasks — Praxis Design Language Slice 1 (R18)

**Input**: Design documents from `specs/praxis-design-language/` and
`specs/memory-and-connectors/`.

**Status**: GATE 3 — Slice 1 ONLY (Memory canvas rebuild). Slice 0
(Foundations) shipped + validated 2026-05-23 per `SLICE-0-VALIDATION-PUNCHLIST.md`.

**Scope (locked last night per user directive — do NOT expand)**:
- Migration `024_memory_node_positions.sql` (position_x/y NULL-able, v1 ignores; forward-compat for v2 drag).
- `MemoryCanvas` + `MemoryNode` + `MemoryNodeTooltip` + `MemoryNodeComposer` + `auto-layout.ts`.
- Reuse VALIDATED pdl `Canvas` / `Node` / `Edge` primitives (match `/app/pdl-scratch` feel).
- Auto-layout: Global at center, 9 dept clusters in a ring, within-cluster grid.
- Rewrite `/app/memory/page.tsx` to mount `<MemoryCanvas>`; delete `MemoryDesk` / `MemorySection` / `MemoryCard` / `MemoryAddForm`; keep `MemoryKindPicker` + `MemoryDeptPicker` for composer reuse.
- **VISUAL REBUILD ONLY.** No bulk-import, no source-attribution panel (those are P2/P3, deferred).

**Convention**: `[ID]` task; `[P]` parallel-safe; file paths absolute from repo root.
**Tests**: No automated tests per Constitution Principle V. Verification = manual preview-deploy walk + session report.

---

## ⚠️ Architectural deviation from the contract (flagged for user confirmation)

The R18 memory-canvas contract (`specs/praxis-design-language/contracts/memory-canvas.md §5`) specifies that `MemoryNodeTooltip` mounts via the pdl `<Tooltip>` primitive. **Per `SLICE-0-VALIDATION-PUNCHLIST.md`, the pdl `Tooltip` + `Popover` primitives are BROKEN** ("nothing happens on click; hover state blended/invisible"). Fixing them is parked as a separate FIX item, NOT part of Slice 1.

**Workaround (locked at task-time, NOT a contract change)**: `MemoryNodeTooltip` and `MemoryNodeComposer` render as canvas-local absolutely-positioned children of the Canvas (not via portal), using the `.pdl-glass` utility class directly. This sidesteps the broken Tooltip/Popover primitives entirely while keeping the visual recipe identical (same blur, same border, same shadow). When the pdl Tooltip/Popover fixes ship in a future round, the memory canvas can optionally be refactored to use them — but Slice 1 does not block on that fix.

If you want me to fix the pdl Tooltip/Popover INSIDE Slice 1 instead, say so before approving these tasks.

---

## Phase 1: Setup

- [ ] **T001** Update `.specify/feature.json` to pin `"feature_directory": "specs/praxis-design-language"` (already pinned; no-op if unchanged).
- [ ] **T002** Confirm `src/components/conduit/memory/` exists (it does — from R17 Slice 1) and contains: `MemoryDesk`, `MemorySection`, `MemoryCard`, `MemoryAddForm`, `MemoryKindPicker`, `MemoryDeptPicker`. The first 4 will be deleted in T015; the last 2 will be reused.

---

## Phase 2: Schema + types (S1.A from plan)

- [ ] **T003** Apply migration `024_memory_node_positions.sql` via Supabase MCP `apply_migration` against project `mvuslmfjkkuizixjpkgl`. Body:
  ```sql
  ALTER TABLE conduit_memory
    ADD COLUMN IF NOT EXISTS position_x real,
    ADD COLUMN IF NOT EXISTS position_y real;
  ```
  No index, no default, both NULL-able. RLS inherited from existing `owners_full_access` policy.
- [ ] **T004** Write `supabase/migrations/024_memory_node_positions.sql` on disk (mirrors what was applied via MCP).
- [ ] **T005** Verify migration applied — `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='conduit_memory' AND column_name IN ('position_x','position_y')` returns both rows.
- [ ] **T006** Extend `MemoryRecord` type in `src/lib/ai/memory.ts` to include `position_x: number | null` and `position_y: number | null`. Auto-layout will read these for forward-compat with v2 drag.

---

## Phase 3: Auto-layout pure function (S1.B from plan)

- [ ] **T007** Write `src/components/conduit/memory/auto-layout.ts` per `contracts/memory-canvas.md §7` verbatim:
  - Inputs: `MemoryRecord[]`, `viewport: { width, height }`.
  - Outputs: `LayoutResult { nodes: LayoutedMemory[], edges: LayoutEdge[], clusters: {id, x, y}[] }`.
  - Algorithm: cluster-based radial. Global at viewport center; 9 dept clusters in a ring at radius `min(width,height) * 0.32`. Within each cluster, 3-col grid (cols offset ±64px, rows 56px down). Multi-scope memories → first scope in EMPLOYEE_ORDER. If `position_x` + `position_y` both non-null on a memory, use those directly (forward-compat).
  - Edge generation: each node → its cluster center (intra, subtle); Global center → each dept cluster center (inter, dashed).
- [ ] **T008** Pure function; no React imports; no surface change yet.

---

## Phase 4: CSS sheet (S1.E from plan)

- [ ] **T009** Write `src/styles/memory-canvas.css` — canvas-specific tuning:
  - `.mem-canvas-shell` — full-viewport wrapper, dotted grid background (consumes `.pdl-canvas-grid`).
  - `.mem-canvas-header` — small top-left title + count chip.
  - `.mem-node-content` — inner content of a memory node (kind icon or first letter of kind as glyph — TBD see T012).
  - `.mem-node-locked-overlay` — small lock icon top-right when memory is locked.
  - `.mem-node-pinned` — larger size + brighter glow when pinned.
  - `.mem-tooltip` — canvas-local glassmorphic tooltip (composes `.pdl-glass`); absolute positioning relative to its parent.
  - `.mem-composer-panel` — canvas-local glassmorphic composer (composes `.pdl-glass`); absolute positioning.
  - `.mem-edge-layer` — SVG overlay for all edges, full canvas size.
  - Reduced-motion gates on the node-mount pulse + spark animations.
  - Mobile reflow at ≤ 640 px: tooltip becomes full-width bottom sheet; composer same.
- [ ] **T010** Import `memory-canvas.css` from `src/app/layout.tsx`; REMOVE the `memory-desk.css` import line (the file will be deleted in T016).

---

## Phase 5: Memory-specific components (S1.C from plan)

- [ ] **T011** Write `src/components/conduit/memory/MemoryNodeTooltip.tsx`:
  - Props: `{ memory: MemoryRecord; onPatched: (next) => void; onArchived: (id) => void; onEdit: () => void }`.
  - Canvas-local glassmorphic panel via `.mem-tooltip` + `.pdl-glass`.
  - Content: kind chip eyebrow, memory.content in Fraunces italic body-lg (line-clamp 3), scope chips row (one `<DeptIcon>` per scope; "Everyone" chip for global), 4 affordance icon buttons (pin/unpin, lock/unlock, edit, archive).
  - Affordance handlers PATCH `/api/conduit/memory/[id]` (R17 endpoint, unchanged).
  - Edit affordance triggers `onEdit()` (parent shows composer in edit mode).
  - Pin/lock toggles update locally optimistic + PATCH.
  - Archive triggers DELETE → calls `onArchived(memory.id)`.
- [ ] **T012** Write `src/components/conduit/memory/MemoryNode.tsx`:
  - Props: `{ memory, position, onPatched, onArchived, onEdit }`.
  - Composes the pdl `<Node>` primitive (VALIDATED per punch-list).
  - Size: 56 px default, 72 px when `pinned`.
  - Tone: `memory.scope[0]` → dept color (`EMPLOYEES[scope[0]].color`); global → `var(--pdl-accent)`.
  - Inner glyph: small text label = uppercase first-letter of kind ("F", "P", "D", "G", "C") in 11px JetBrains Mono so the node carries kind identity without an icon library dependency. Center-aligned. (NOT a Lucide icon — keeps the node uncluttered; the tooltip carries full detail.)
  - Wrap in a parent `<div>` with `:hover` state managed via React useState `[hovered, setHovered]`. When `hovered`, render `<MemoryNodeTooltip>` as a SIBLING absolutely positioned next to the node (canvas-local; no portal). Same parent has `pointer-events` rules so moving from node to tooltip doesn't dismiss.
  - Lock icon overlay (Lucide `Lock` 10px) top-right when `memory.locked`.
- [ ] **T013** Write `src/components/conduit/memory/MemoryNodeComposer.tsx`:
  - Props: `{ anchor: { x, y }; onClose; onSubmit; initialScope?: EmployeeId[]; existingMemory?: MemoryRecord }`.
  - `existingMemory` populated = EDIT mode (PATCH on submit); else ADD mode (POST).
  - Canvas-local glassmorphic panel via `.mem-composer-panel` + `.pdl-glass`. Positioned at `anchor` (clamped to canvas bounds).
  - Header: existing `<MemoryKindPicker>` (REUSED from R17 Slice 1) + existing `<MemoryDeptPicker>` (REUSED).
  - Body: Fraunces italic textarea (consume the pdl Composer's textarea CSS or hand-author with the same class).
  - Footer: tags input + Save / Cancel buttons.
  - Submit:
    - ADD: POST `/api/conduit/memory` with `{ kind, content, tags, scope }`. On success, call `onSubmit(memory)`.
    - EDIT: PATCH `/api/conduit/memory/[id]` with the same body. On success, call `onSubmit(updatedMemory)`.
  - Close on Escape, outside-click, or Cancel.
- [ ] **T014** Write `src/components/conduit/memory/MemoryCanvas.tsx`:
  - Props: `{ initial: MemoryRecord[]; cap: number }`.
  - Client component (use "use client").
  - State: `memories[]`, `viewport { width, height }`, `composerOpen`, `composerAnchor`, `editingMemoryId | null`.
  - Effect: measure container with ResizeObserver; recompute layout on resize.
  - Header (top-left, sticky over canvas): "What Praxis knows" + `${memories.length} / ${cap}` chip.
  - `<div className="mem-canvas-shell pdl-canvas-grid">`:
    - SVG overlay for edges (`<svg className="mem-edge-layer">`): render all `LayoutEdge`s via the pdl `<Edge>` primitive.
    - For each `LayoutedMemory`: `<MemoryNode>` positioned via `position={{x, y}}`.
    - When `composerOpen`: `<MemoryNodeComposer anchor={composerAnchor} ...>`.
    - When `editingMemoryId` set: `<MemoryNodeComposer existingMemory={...} ...>` at the editing node's position.
  - Click handlers:
    - Click on empty canvas → set composerAnchor + open composer.
    - Click on existing node → trigger edit via onEdit prop (sets editingMemoryId).
  - Optimistic updates: onPatched merges into state; onArchived removes; new memory from composer inserts.

---

## Phase 6: Page rewrite + deletions (S1.D from plan)

- [ ] **T015** REWRITE `src/app/app/memory/page.tsx`:
  - Same server-fetch as R17 Slice 1 — `conduit_memory` rows + `conduit_memory_scope` join — but ADD `position_x, position_y` to the select.
  - Mount `<MemoryCanvas initial={initial} cap={cap} />` instead of `<MemoryDesk>`.
- [ ] **T016** DELETE the following files:
  - `src/components/conduit/memory/MemoryDesk.tsx`
  - `src/components/conduit/memory/MemorySection.tsx`
  - `src/components/conduit/memory/MemoryCard.tsx`
  - `src/components/conduit/memory/MemoryAddForm.tsx`
  - `src/styles/memory-desk.css`
- [ ] **T017** Confirm no remaining imports of the deleted files: `grep -rn "MemoryDesk\|MemorySection\|MemoryCard\|MemoryAddForm" src/`. Expect zero hits outside the memory namespace.

---

## Phase 7: Verify + report (S1.F from plan)

- [ ] **T018** `npx tsc --noEmit` — must be clean.
- [ ] **T019** `npm run build` — must produce a successful production build. `/app/memory` registered in route table.
- [ ] **T020** Write `SESSION_REPORT_2026-05-XX_MEMORY_CANVAS.md` at repo root. Document: scope honored, files added/deleted, tooltip-workaround flagged (canvas-local positioning, not pdl Tooltip primitive), light/dark validation result, follow-ups (the pdl Tooltip/Popover fix is still queued separately).
- [ ] **T021** Update `CLAUDE.md` "current plan" pointer to `specs/praxis-design-language/plan.md` (already pointed from Slice 0; no-op if unchanged).

**Slice 1 merge gate (= Phase 7 complete)**: build green; canvas renders at `/app/memory` with real data; hover-tooltip works; click-empty-canvas opens composer; PATCH/POST/DELETE round-trip persists; chat-route memory invariants from R17 Slice 1 unchanged.

---

## Phase 8: Deferred (NOT in this slice)

- Tooltip + Popover fix (separate FIX item from punch-list).
- Brand-mark official-SVG swap (separate ASSET SWAP).
- Avatar identity exploration (separate DESIGN session).
- Memory bulk-import (P2 from R17 spec).
- Source-attribution panel (P3 from R17 spec).
- Memory canvas v2 drag-to-arrange (forward-compat columns exist; UI deferred).

---

## Dependencies + critical path

**Phase 1 → 2 → 3 → 4 → 5 → 6 → 7.**

Within Phase 5: T011 (tooltip), T012 (node uses tooltip), T013 (composer), T014 (canvas uses node + composer). Sequential.

Within Phase 6: T015 (page rewrite) before T016 (deletions) so the rewritten page is verified to compile against the new components before the old ones are deleted.

Critical path: T003 → T004 → T005 → T006 → T007 → T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016 → T017 → T018 → T019 → T020 → T021.

(T008 is a no-op trivial; just confirming the pure function.)

---

## Implementation strategy

ONE merge per user directive. Phase 7 is the merge gate. After the user
deploys and validates, the parked items (Tooltip/Popover fix, brand-mark
swap, avatar exploration) become individual follow-up rounds.
