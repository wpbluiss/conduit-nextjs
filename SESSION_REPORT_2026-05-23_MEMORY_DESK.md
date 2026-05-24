# Memory Desk — R17 Slice 1

**Date:** 2026-05-23
**Branch:** main (Slice 1 complete; build green)
**Spec:** `specs/memory-and-connectors/`
**Round:** R17 Slice 1 — Memory ONLY (Slice 2 GitHub PAT + tool-calling deferred per user GATE 3 directive)

---

## TL;DR

Memory is no longer a buried Settings sub-tab. It lives at `/app/memory` as
a top-level surface — "The Dossier" — with per-department scope, pin, and
lock affordances. The chat route's memory injection is now employee-aware
(Atlas sees all; every other employee sees only `global + their-scope`).
Atlas's `[REMEMBER]` and `[SUPERSEDE]` tags optionally accept a trailing
`| scope: <dept>` segment, backward-compatible with every existing memory.
**No new dependencies, one migration, build green.**

---

## What changed

### New files

| Path | Purpose |
|---|---|
| `supabase/migrations/023_memory_scope_pin_lock.sql` | Adds `pinned`/`locked` columns + `conduit_memory_scope` join table + RLS + indexes + employee-id check constraint. Applied to remote via Supabase MCP. |
| `src/app/app/memory/page.tsx` | New top-level route — server component; loads memories + scope rows in parallel; mounts `<MemoryDesk>`. |
| `src/components/conduit/memory/MemoryDesk.tsx` | Top-level client orchestrator — holds memories in state; renders Global section + 9 dept sections in `EMPLOYEE_ORDER`. |
| `src/components/conduit/memory/MemorySection.tsx` | Per-section wrapper — serif dept-tinted header, count, "+ Add memory", pinned sub-bar, regular card grid, empty-state copy per dept. |
| `src/components/conduit/memory/MemoryCard.tsx` | Single card — serif italic content, dept-tint left rule, hover affordances (pin, lock, edit inline, archive), scope chips, "via Atlas" source link. |
| `src/components/conduit/memory/MemoryAddForm.tsx` | Inline expand form — kind picker + dept-scope picker + serif content textarea + tags input. Optimistic insert via `POST /api/conduit/memory`. |
| `src/components/conduit/memory/MemoryKindPicker.tsx` | 5-chip kind picker (fact/context/preference/decision/goal). |
| `src/components/conduit/memory/MemoryDeptPicker.tsx` | Multi-select dept chips + "Everyone" toggle (clears all = global). |
| `src/styles/memory-desk.css` | "Dossier" aesthetic — sectioned layout, off-surface cards with dept-tint left rule, serif italic body, inline expand animation, reduced-motion gating, mobile reflow. |

### Modified files

| Path | Change |
|---|---|
| `src/lib/ai/memory.ts` | `MemoryRecord` extended with `pinned/locked/scope`. `RememberWrite`/`SupersedeWrite` extended with `scope`. `parseMemoryWrites` extended to parse optional `scope:` segment (4-slot regex, position-agnostic via `classifyTagsOrScope`). `trimMemoriesForPrompt` prioritizes pinned. NEW: `memoriesForEmployee()` pure filter (Atlas sees all; others see `global + their-scope`). `ATLAS_MEMORY_INSTRUCTIONS` documents the new scope syntax. |
| `src/app/api/conduit/memory/route.ts` | GET returns `pinned/locked/scope` attached (parallel scope-table fetch). POST accepts `scope: string[]`, sanitizes against the canonical 9 employees, inserts scope rows after the memory insert. |
| `src/app/api/conduit/memory/[id]/route.ts` | PATCH accepts `pinned`, `locked`, `scope` (atomic replace: DELETE all scope rows + INSERT new). Empty scope = global. |
| `src/app/api/conduit/chat/route.ts` | Memory loader now: load memory rows + scope rows in parallel; build `allMemoriesWithScope` once; expose `memoryBlockFor(employee)` helper. Three system-prompt build sites updated (single-turn employee, round-table participant loop, synthesis turn). Supersede handler skips when target row has `locked = true` (logs to console.warn). Remember/Supersede handlers insert scope rows after the memory insert when Atlas specified scope. |
| `src/app/app/settings/memory/page.tsx` | Replaced with a one-line `redirect("/app/memory")`. Preserves bookmarks. |
| `src/components/conduit/Sidebar.tsx` | Memory NavLink `href` flipped from `/app/settings/memory` to `/app/memory`; active check updated. Settings nav active-check no longer excludes `/app/settings/memory` (since the route is now a redirect). |
| `src/components/conduit/SettingsTabs.tsx` | "memory" removed from `SettingsTabKey`. Memory tab removed from the tab strip. `MemoryTab` + `ManualAddMemory` + `MemoryRow` types + `MEMORY_KIND_LABELS` + `MEMORY_KIND_ORDER` (~380 lines) all deleted. Unused `Brain` + `Plus` imports cleaned. |
| `src/app/layout.tsx` | Imports `memory-desk.css`. |
| `CLAUDE.md` | Pointer flipped to `specs/memory-and-connectors/plan.md`. |
| `.specify/feature.json` | Pinned to the new feature directory. |

### Deleted files

None — `MemoryTab` was a function inside SettingsTabs.tsx; the file itself survives (lost ~380 lines of memory code).

---

## Schema

Migration `023_memory_scope_pin_lock.sql` applied to remote
(`mvuslmfjkkuizixjpkgl`) via Supabase MCP `apply_migration` on 2026-05-23.

```sql
ALTER TABLE conduit_memory
  ADD COLUMN pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN locked boolean NOT NULL DEFAULT false;

CREATE INDEX conduit_memory_pinned_idx
  ON conduit_memory(account_id, pinned DESC, created_at DESC)
  WHERE archived_at IS NULL;

CREATE TABLE conduit_memory_scope (
  memory_id uuid REFERENCES conduit_memory(id) ON DELETE CASCADE,
  employee_id text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (memory_id, employee_id),
  CONSTRAINT … CHECK (employee_id IN (9 canonical employees))
);

CREATE INDEX … ON conduit_memory_scope(memory_id);
CREATE INDEX … ON conduit_memory_scope(employee_id, memory_id);

-- Owner-scoped RLS via memory_id → conduit_memory → conduit_accounts join.
```

**Backward-compatible**: every existing row defaults to
`pinned=false, locked=false, zero scope rows` — i.e., global behavior.
Existing chat sessions function unchanged until the user starts scoping
new (or re-scoping existing) memories.

**Verified**: direct SQL inspection via MCP confirms columns + table exist
with expected defaults.

---

## Aesthetic — "The Dossier"

The Memory Desk is a quiet, curated reading surface — not a dashboard. Each
memory feels like an index card:

- **Section headers**: serif display (Fraunces), dept-tinted name + small-caps eyebrow + count + inline "+ Add memory" link. Empty sections render an italic invitation copy ("Marketing doesn't know anything yet — drop a brand or campaign note") rather than blank space.
- **Memory cards**: off-surface (`var(--color-surface-elevated)`), 3-px dept-tint left rule (neutral for global), kind chip eyebrow, **serif italic body at body-lg size**, tag chips + scope chips at the bottom. Hover surfaces 4 affordances (pin, lock, edit, archive); on touch they're always visible.
- **Pinned memories** float to the top of each section in an "Always known" sub-bar with a dashed divider.
- **Add form**: inline expand (not a modal), 220 ms ease-out animation, focuses the textarea automatically. Kind picker + dept-scope picker + serif content textarea + tags input + Save/Cancel.
- **Edit**: inline; double-tap the content (or use the edit affordance) to replace it with a textarea; save commits via PATCH.
- **All motion** CSS keyframes only, reduced-motion gated.
- **Mobile reflow** at ≤ 640 px: section headers wrap, cards collapse to single-column, affordances become always-visible row at the bottom.

---

## Chat-route filter contract (the load-bearing change)

The memory load no longer applies one block to every employee. The hot path:

```ts
// Load all memories + all scope rows ONCE per turn.
const allMemoriesWithScope = … (scope rows joined client-side)

// Build per-employee block on demand.
const memoryBlockFor = (employeeId) =>
  renderMemoryBlock(
    trimMemoriesForPrompt(
      memoriesForEmployee(allMemoriesWithScope, employeeId)
    )
  );

// At each system-prompt build site:
const systemPrompt = memoryBlockFor(employee) + withTime;
```

`memoriesForEmployee` returns:
- For Atlas (`jarvis`): the full list (chief-of-staff sees everything).
- For any other employee: rows where `scope.length === 0` (global) OR `scope.includes(employeeId)`.

Three sites updated: single-turn employee response (~line 506), round-table participant loop (~line 882), synthesis turn (~line 977).

**Supersede + lock**: the supersede execution path checks the target row's `locked` flag and skips silently (console.warn for diagnosis) when locked. The supersede new-memory insert also writes scope rows when Atlas specified scope.

**Remember + scope**: the remember execution path writes scope rows after the memory insert when Atlas specified scope.

---

## Verification

- `npx tsc --noEmit` — clean.
- `npm run build` — clean; `/app/memory` registered in the route table.
- DB inspection confirms migration applied and columns present.

### Walk-through to verify on preview (per quickstart.md §1)

1. Visit `/app/settings/memory` → confirm server redirect to `/app/memory`.
2. Add a Global memory (don't pick any dept chips). Confirm card appears under "Everyone knows."
3. Add a Marketing-scoped memory (pick the Marketing chip). Confirm card appears under the Marketing section only.
4. Open chat with Marketing — confirm the Marketing-scoped memory is in context (paraphrased or referenced).
5. Open chat with Sales — confirm the Marketing-scoped memory is NOT in context.
6. Pin a memory; confirm it moves to the "Always known" bar.
7. Lock a memory; tell Atlas the fact has changed; confirm Atlas's `[SUPERSEDE]` is skipped (memory stays untouched).
8. Mobile sweep at 375 + 390.
9. Light + dark theme parity.
10. Reduced-motion sweep.

### What to feed Praxis now (per the user's directive)

- A Global memory naming **Conduit AI** (your company), what it does, who the customer is. Visible to everyone.
- A Global memory naming **Lunaro** (sibling product), the insurance-CRM-for-Medicare-agents framing, the AEP-2026 positioning.
- Scoped memories per dept:
  - Marketing-only: brand voice notes, ICP language, naming conventions.
  - Engineering-only: tech-stack details, repo names (`wpbluiss/conduit-nextjs`, `wpbluiss/lunaro`), build conventions.
  - Sales-only: primary ICP, top objections, pricing references.
  - Finance-only: revenue benchmarks, runway, pricing tiers.
- Pin the most load-bearing facts (your name, the company name, Lunaro positioning).
- Lock the ones Atlas should not paraphrase or overwrite.

Then open chats with different employees and confirm scoped recall works.

---

## Constitution gates (re-verified post-implementation)

| # | Verdict |
|---|---|
| 0 | PASS — no invented domain content; 9-employee roster preserved; backward-compatible with existing memories. |
| I | PASS — one new server-rendered route + one redirect; standard App Router patterns. `src/proxy.ts` untouched. |
| II | PASS — one migration; one new `conduit_*` table + RLS in the creating migration; check constraint pins employee_id to the canonical 9. |
| III | PASS — zero provider strings on new surfaces. |
| IV | PASS — all new files under `/app/app/memory/`, `/components/conduit/memory/`, `/styles/memory-desk.css`. Zero marketing imports. |
| V | PASS — material milestone (new top-level surface) → this session report; mobile/theme/reduced-motion sweep deferred to preview deploy (user's verification step). |
| VI | PASS — Slice 1 ships as one merge. |

---

## Deferred — Slice 2 (GitHub PAT + tool-calling architecture)

Per user GATE 3 directive: **Slice 2 does not start until Slice 1 is
preview-validated**. The deferred work is fully scoped in
`specs/memory-and-connectors/plan.md §Slice 2 Phasing` and the contracts
under `contracts/{connectors-api,tool-registry,encryption}.md`. The
tool-calling architecture risk is flagged explicitly in `plan.md
§Tool-Calling Architecture Risk`.

---

## Follow-ups

- **Slice 1 preview validation by user.** Deploy → use the surface → feed Praxis Conduit + Lunaro context → confirm a non-Atlas employee recalls a scoped memory.
- **Atlas-scope-syntax surface validation.** Try a conversation where you reveal a Marketing-specific brand fact and check that Atlas emits `[REMEMBER: ... | scope: marketing]` (or close to it). If Atlas isn't reliably using the new syntax, the prompt may need a stronger example or two.
- **Cap math.** Per-section counters sum to total (a multi-dept memory counts in each dept section but only once toward total). The "X / cap" display uses total. Verify this reads correctly when a user has dozens of multi-dept memories.
- **`source_conversation_id` deep-link.** Slice 1 ships the link; the rich "Where Atlas learned this" panel lands in P3 / US7 later.
- **Bulk import + Atlas extract pass.** P2 / US6 — not in Slice 1.
- **Slice 2 ready-state.** Spec + plan + contracts + tasks (Slice 2 portion) lock at Slice-2 GATE 3 time, after Slice 1 ships.

---

## End of Slice 1.
