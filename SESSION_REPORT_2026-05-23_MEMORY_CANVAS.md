# Memory Canvas — R18 Slice 1

**Date:** 2026-05-23
**Branch:** main (Slice 1 complete; build green; NOT deployed — user walks before deploy)
**Spec:** `specs/praxis-design-language/`
**Round:** R18 Slice 1 — Memory canvas rebuild ONLY (per user GATE 3 directive)

---

## TL;DR

The R17 dossier (vertical card list per dept) is gone. `/app/memory`
now renders the validated `/app/pdl-scratch` canvas aesthetic against
real `conduit_memory` rows: glowing nodes clustered around a Global
center, dept clusters in a ring, glassmorphic hover tooltips with
full affordances, glassmorphic click-to-add composer. R17 server-fetch
pattern + chat-route memory invariants preserved unchanged. Build green;
NOT deployed — user will walk it before the push.

---

## What changed

### Schema

- `supabase/migrations/024_memory_node_positions.sql` — adds `position_x real` + `position_y real` columns to `conduit_memory`. Both NULL-able; auto-layout v1 ignores; v2 drag-to-arrange will populate. Applied to remote via Supabase MCP `apply_migration`. Columns verified via `information_schema` query.

### New files

| Path | Purpose |
|---|---|
| `src/components/conduit/memory/auto-layout.ts` | Pure cluster-radial algorithm per contract §7. Global at viewport center, 9 dept clusters in a ring (radius `min(w,h) * 0.32`), within-cluster 3-col grid (64×56 px spacing). Multi-scope memories → first scope in `EMPLOYEE_ORDER`. Forward-compat: persisted `position_x`/`position_y` override derived position when both non-null. |
| `src/components/conduit/memory/MemoryCanvas.tsx` | Top-level orchestrator. Client component. Holds memories[] + composer state + freshId for mount pulse. ResizeObserver-measured viewport drives auto-layout each render. Click on empty canvas → composer at click point. SVG edge layer overlays dotted-grid canvas. |
| `src/components/conduit/memory/MemoryNode.tsx` | Wraps the validated pdl `<Node>`. Kind glyph = Lucide icon per `MemoryKind`: fact→Diamond, preference→Heart, decision→Flag, goal→Target, context→Layers. Size 52 px default / 64 px when pinned. Tone = first-scope dept color or null (global). Lock icon overlay top-right when locked. Hover state mounts MemoryNodeTooltip as canvas-local sibling. |
| `src/components/conduit/memory/MemoryNodeTooltip.tsx` | Canvas-local glassmorphic tooltip (NOT the broken pdl `<Tooltip>`). Inlines the .pdl-glass recipe in `.mem-tooltip`. Content: kind eyebrow, Fraunces italic body (line-clamp 4), scope chips with DeptIcon glyphs, 4-action row (pin/lock/edit/archive). All actions PATCH `/api/conduit/memory/[id]` or DELETE — R17 endpoints unchanged. |
| `src/components/conduit/memory/MemoryNodeComposer.tsx` | Canvas-local glassmorphic composer panel. ADD mode (POST) by default; EDIT mode (PATCH) when `existingMemory` set. Reuses R17 `MemoryKindPicker` + `MemoryDeptPicker` as the header pickers. Position clamped to viewport bounds; Escape closes; outside-click handled at canvas level via target check. |
| `src/styles/memory-canvas.css` | Canvas-specific tuning. `.mem-canvas-page` + `.mem-canvas-header` + `.mem-canvas-shell` + `.mem-edge-layer` + `.mem-node-wrap` + `.mem-node-glyph` + `.mem-node-lock` + `.mem-tooltip` + `.mem-composer` + actions/chips. Reduced-motion gates on node-mount pulse, tooltip slide-in, composer pop. Mobile reflow at ≤ 640 px: tooltip + composer become fixed bottom sheets. |

### Modified files

| Path | Change |
|---|---|
| `supabase/migrations/024_memory_node_positions.sql` | New file on disk mirroring what was applied via MCP. |
| `src/lib/ai/memory.ts` | `MemoryRecord` interface extended with `position_x: number | null` and `position_y: number | null`. |
| `src/app/api/conduit/chat/route.ts` | Memory-loader SELECT now includes `position_x, position_y` for type-cast consistency. |
| `src/app/app/memory/page.tsx` | REWRITE. Same R17 server-fetch + scope-join pattern; adds `position_x, position_y` to the SELECT; mounts `<MemoryCanvas>` instead of `<MemoryDesk>`. |
| `src/app/layout.tsx` | Removed `import "@/styles/memory-desk.css"`; added `import "@/styles/memory-canvas.css"`. |

### Deleted files (R17 dossier — replaced by canvas)

- `src/components/conduit/memory/MemoryDesk.tsx`
- `src/components/conduit/memory/MemorySection.tsx`
- `src/components/conduit/memory/MemoryCard.tsx`
- `src/components/conduit/memory/MemoryAddForm.tsx`
- `src/styles/memory-desk.css`

Reused (kept):
- `src/components/conduit/memory/MemoryKindPicker.tsx` — header chip group in composer.
- `src/components/conduit/memory/MemoryDeptPicker.tsx` — multi-select dept chips in composer.

---

## Architectural deviation from contract (locked at task-time, user-approved)

The R18 memory-canvas contract §5 specifies that `MemoryNodeTooltip` mounts
via the pdl `<Tooltip>` primitive. Per `SLICE-0-VALIDATION-PUNCHLIST.md`,
that primitive is broken ("nothing happens on click; hover state
blended/invisible"). User explicitly approved the workaround:
**`MemoryNodeTooltip` + `MemoryNodeComposer` render as canvas-local
absolutely-positioned children of the Canvas, not via portal**. The same
glass recipe is inlined (`.mem-tooltip` + `.mem-composer` each compose
`backdrop-filter: blur(...) saturate(180%)` + `var(--pdl-surface-glass)`
+ hairline border + `var(--pdl-elev-3)` shadow).

When the pdl Tooltip/Popover fixes ship in a future round, the memory
canvas can optionally refactor to use them — but that work is parked,
not part of this slice.

---

## Node glyph: Lucide icons per kind (P1-compliant, user override)

User overrode my initial proposal of letter-initials in the node ("violates
P1 — never letter-initials"). Locked Lucide picks:

| Kind | Icon | Semantic |
|---|---|---|
| fact | `Diamond` | precious truth |
| preference | `Heart` | what user likes |
| decision | `Flag` | planted choice |
| goal | `Target` | aim point |
| context | `Layers` | layered frame |

18 px stroke 1.75 at 52 px nodes; 22 px at pinned 64 px nodes. Color
inherits from node's `currentColor` (text color, not dept tint — the
glow + border carry tint identity).

---

## Verification

- `npx tsc --noEmit` — clean.
- `npm run build` — clean. `/app/memory` registered in route table.
- Migration applied + columns verified via direct SQL inspection.
- Zero orphan imports of deleted R17 components (grep confirms only doc-comment references in the new files' own headers).

### NOT verified by me (held as user-validation gate per directive)

- **Visual walk on `/app/memory`.** Not deployed. User runs `npm run dev` or pushes to preview themself.
- **Light + dark theme parity** (Constitution Principle V + design-language P4). Both themes hold the gate; user verifies both render cleanly before sign-off.
- **Real-data canvas render.** Server-fetch + scope-join pattern is the same as R17 Slice 1 (which is working in production); reasonable confidence it renders against your existing memories. Confirm on first walk.
- **Hover-tooltip behavior.** Built canvas-local to sidestep the broken pdl Tooltip; expected to work, but the hover-area edge (moving from node into tooltip) is the kind of thing that needs a real cursor.
- **Composer click-target accuracy.** Canvas click → composer at click point. Position is clamped to viewport. Real cursor will tell.
- **Mobile sweep at 375 + 390.** Tooltip + composer reflow to fixed bottom sheet at ≤ 640 px; user walks on phone before declaring victory.

### What to walk on `/app/memory`

1. Page loads. Title "What Praxis knows" top-left + count chip. Dotted-grid canvas fills viewport.
2. Existing memories from R17 Slice 1 appear as glowing nodes clustered around the Global center. Dept-scoped memories are in their respective ring positions. Each node shows the kind glyph (Diamond/Heart/Flag/Target/Layers).
3. Hover a node → glassmorphic tooltip appears to the right of the node with content, scope chips, and 4-action row (pin / lock / edit / archive). Move mouse onto the tooltip → it stays open.
4. Click pin → node grows to 64 px + brighter glow. PATCH persists.
5. Click lock → tiny lock icon overlay appears on the node. PATCH persists.
6. Click edit on tooltip → composer opens in EDIT mode pre-filled with current values. Save → node updates inline.
7. Click empty canvas → composer opens at click point in ADD mode. Add a memory scoped to "Marketing only." Save → new node appears in Marketing cluster with mount pulse.
8. Open chat with Marketing in another tab → confirm the new memory appears in context (R17 chat-route invariant still holds).
9. Switch theme to Light. Walk the canvas again. Confirm dot grid, node glow, tooltip glass all render legibly on the bone canvas. Switch back to Dark.
10. Mobile at 375 px → confirm tooltip + composer become bottom sheets, tap targets workable.

---

## Constitution gates (re-verified post-implementation)

| # | Verdict |
|---|---|
| 0 | PASS — no invented domain content; `EMPLOYEE_ORDER` is still the source of truth for clusters; existing memories carry forward unchanged. |
| I | PASS — standard server-render + client-component pattern; `src/proxy.ts` untouched. |
| II | PASS — one additive NULL-able migration; RLS inherited. |
| III | PASS — no AI-provider strings; DeptIcon (Lucide) carries dept identity through shape; Lucide kind icons per node; no letter-initials. |
| IV | PASS — all new files under `src/app/app/memory/`, `src/components/conduit/memory/`, `src/styles/memory-canvas.css`. Zero marketing imports. |
| V | PASS at the gate I control (tsc + build clean). Light+dark parity + mobile sweep held as user-validation gate per directive. Material milestone — this session report serves Principle V's documentation. |
| VI | PASS — Slice 1 ships as one merge. |

---

## Held back per directive

- **Not deployed.** User walks `/app/memory` first.
- **Light+dark parity** is a release gate; both must render cleanly before user signs off.
- **pdl Tooltip/Popover fix** stays parked as a separate FIX item.
- **Brand-mark licensing pass** stays parked as a separate ASSET SWAP.
- **Avatar identity exploration** stays parked as a separate DESIGN session.
- **Memory canvas v2 drag-to-arrange** — schema columns exist; UI is v2 territory.
- **Bulk import (P2) + source-attribution (P3)** — explicitly excluded from this slice's visual rebuild.

---

## Follow-ups after Slice 1 lands

- Sidebar rebuild (collapse to icon-default per design-language P3).
- Settings 6→3 tab consolidation.
- Workspace dashboard rebuild against pdl primitives.
- Connectors surface (R17 Slice 2) built natively in pdl.
- pdl Tooltip/Popover fix round (parked).
- Memory canvas v2: drag-to-arrange (consume the columns already shipped).
- Memory canvas v2: bulk import + source-attribution panel.

---

## End of Slice 1.
