# Tasks — Memory + Connectors (R17)

**Input**: Design documents from `specs/memory-and-connectors/`
**Status**: GATE 3 approved 2026-05-23. **Slice 1 ONLY** targeted now; Slice 2 deferred until Slice 1 is preview-validated.

**Convention**: `[ID]` task; `[P]` parallel-safe; file paths absolute from repo root.

**Tests**: No automated tests per Constitution Principle V. Verification = `quickstart.md §1` matrix on Vercel preview + dated session report.

---

## Phase 1: Setup

- [ ] **T001** Update `.specify/feature.json` to pin `"feature_directory": "specs/memory-and-connectors"`.
- [ ] **T002** Create directory `src/components/conduit/memory/`.

---

## Phase 2: Foundational (S1.A — schema + types + API + chat-route filter)

**Purpose**: Schema landed, types extended, API + chat-route honor `scope` / `pinned` / `locked` BEFORE any surface change. Existing `/app/settings/memory` keeps working because every existing row defaults to `pinned=false, locked=false, scope=[]` (global) — backward-compatible.

- [ ] **T003** Apply migration `023_memory_scope_pin_lock.sql` via Supabase MCP `apply_migration` against project `mvuslmfjkkuizixjpkgl`. Body: per `data-model.md §1.1` (adds `pinned`/`locked` columns + `conduit_memory_scope` join table + indexes + RLS + check constraint on `employee_id`).
- [ ] **T004** Extend `src/lib/ai/memory.ts`:
  - `MemoryRecord` adds `pinned: boolean`, `locked: boolean`, `scope: EmployeeId[]` fields.
  - `trimMemoriesForPrompt` prioritizes pinned rows (per data-model.md §2.1).
  - `parseMemoryWrites` extended to optionally capture `scope: <dept|global>` segment in `[REMEMBER]` and `[SUPERSEDE]` tags. Backward-compatible: missing scope = global.
  - `ATLAS_MEMORY_INSTRUCTIONS` extended to document the optional scope syntax.
- [ ] **T005** Extend `src/app/api/conduit/memory/route.ts` GET: include `pinned`, `locked`, and fetch scope rows from `conduit_memory_scope` (single query joined or post-fetch) so each memory carries its `scope: string[]`.
- [ ] **T006** Extend `src/app/api/conduit/memory/route.ts` POST: accept `scope: string[]` in body; after inserting the memory, INSERT scope rows when `scope.length > 0`. Default behavior (empty scope) preserves existing global semantics.
- [ ] **T007** Extend `src/app/api/conduit/memory/[id]/route.ts` PATCH: accept `pinned`, `locked`, `scope`. Scope update is atomic: DELETE all rows in `conduit_memory_scope` for the memory + INSERT new rows.
- [ ] **T008** Modify `src/app/api/conduit/chat/route.ts` memory loader:
  - Active employee = Atlas (`jarvis`) → query unchanged (sees all).
  - Otherwise: filter to `(no scope rows OR scope row matches active employee)`. Two-query merge OR single query with EXISTS — implementer picks; result must include `scope` and `pinned`/`locked` columns for the supersede guard + trim ordering.
- [ ] **T009** Modify the chat-route `[SUPERSEDE]` handler in `src/app/api/conduit/chat/route.ts` (or wherever `parseMemoryWrites` results are consumed) to SKIP supersede when target memory has `locked = true`. Log a console.warn for diagnosis; do NOT surface to user.
- [ ] **T010** Modify the chat-route `[REMEMBER]` handler: when Atlas's parsed remember includes a `scope` field, after inserting the memory, INSERT scope rows.

**Checkpoint Phase 2**: `npx tsc --noEmit` clean; manual smoke test against an existing chat turn — Atlas still works, memory injection still happens, no UI yet. /app/settings/memory still renders the existing tab.

---

## Phase 3: Surface (S1.B — /app/memory top-level)

- [ ] **T011** Write `src/styles/memory-desk.css` — section layout, card aesthetic (off-surface, dept-tint left rule, serif italic content), add-form expand, hover affordances, reduced-motion gating. Mobile reflow at ≤ 640 px.
- [ ] **T012** Import `memory-desk.css` from `src/app/layout.tsx` alongside praxis-system + engineering-cinema.
- [ ] **T013** [P] Write `src/components/conduit/memory/MemoryKindPicker.tsx` — 5 chips (`fact`, `preference`, `decision`, `goal`, `context`).
- [ ] **T014** [P] Write `src/components/conduit/memory/MemoryDeptPicker.tsx` — multi-select dept chips with "Everyone" toggle that clears all dept selections.
- [ ] **T015** [P] Write `src/components/conduit/memory/MemoryAddForm.tsx` — inline add form: kind, optional dept-scope picker (pre-filled per section), content textarea (serif italic), tags input. Submit calls `POST /api/conduit/memory`. Optimistic insert on success.
- [ ] **T016** [P] Write `src/components/conduit/memory/MemoryCard.tsx` — single card with kind chip, serif italic content, tag chips, dept-tint left rule (when scoped), hover affordances (pin, lock, edit, archive). PATCH on each affordance.
- [ ] **T017** [P] Write `src/components/conduit/memory/MemorySection.tsx` — section wrapper: serif header (dept-tinted), count badge, "+ Add memory" affordance, pinned sub-bar, regular card grid, empty-state copy.
- [ ] **T018** Write `src/components/conduit/memory/MemoryDesk.tsx` — top-level client orchestrator: state for all memories, kind filter (optional), sections rendered in order (Global, then `EMPLOYEE_ORDER`).
- [ ] **T019** Write `src/app/app/memory/page.tsx` — server component per `contracts/memory-desk.md §2`. Loads memories + scope rows in parallel, groups into Global + per-dept buckets, mounts `<MemoryDesk initial={…} />`.
- [ ] **T020** Modify `src/app/app/settings/memory/page.tsx` — replace existing render with `redirect("/app/memory")`. Keep the file (or delete; either is fine — redirect file preserves the URL contract from the backward-compat angle).
- [ ] **T021** Modify `src/components/conduit/Sidebar.tsx` — add a "Memory" NavLink entry between Workspace and Voice Room. Icon: `BookMarked` or `Brain` from lucide-react.
- [ ] **T022** Modify `src/components/conduit/SettingsTabs.tsx` — remove "memory" from the Settings tab strip. Remove `MemoryTab` definition (it's superseded by the top-level surface).

**Checkpoint Phase 3**: Surface renders on `/app/memory`. Add/edit/pin/lock/archive all wired. `/app/settings/memory` redirects.

---

## Phase 4: Verification (S1.C)

- [ ] **T023** Run `npx tsc --noEmit` — must be clean.
- [ ] **T024** Run `npm run build` — must produce a successful production build.
- [ ] **T025** Update `CLAUDE.md` line referencing "current plan" to `specs/memory-and-connectors/plan.md`.
- [ ] **T026** Write `SESSION_REPORT_2026-05-XX_MEMORY_DESK.md` at repo root capturing: schema decisions, type extensions, surface composition, deviations from plan (if any), files added/modified, verification status, follow-ups (Slice 2 readiness).

**Slice 1 merge gate (= Phase 4 complete)**: full `quickstart.md §1` sweep on preview deploy. **DO NOT START SLICE 2 (GitHub PAT + tool-calling) UNTIL THIS CHECKPOINT IS USER-APPROVED.**

---

## Phase 5: Slice 2 (deferred)

**Status**: DEFERRED. Held until Slice 1 is preview-validated by the user.

Slice 2 tasks (T027+) authored at Slice 2 GATE 3 time, after Slice 1 ships.
The plan's §Slice 2 Phasing sketch (Phase 2.A architecture + Phase 2.B
GitHub connector) is the input; full task atomization happens once
Slice 1 is in production.

---

## Dependencies

**Phase 1 → Phase 2 → Phase 3 → Phase 4.**

Within Phase 2: T003 (migration) → T004 (types depend on schema) → T005–T010 in any order (different files). T010 depends on T009 sharing the chat-route file.

Within Phase 3: T011 + T012 first (CSS available before components reference classes); T013–T017 are [P] (different files); T018 depends on T013–T017; T019 depends on T018; T020/T021/T022 are independent of each other but can run after T019.

Within Phase 4: T023 → T024 → T025/T026.

Critical path: T001/T002 → T003 → T004 → T005/T006/T007/T008/T009/T010 → T011/T012 → T013/T014/T015/T016/T017 → T018 → T019 → T020/T021/T022 → T023 → T024 → T025/T026.

---

## Implementation strategy

Slice 1 is one deployable validated slice per the user's GATE 2 directive.
Phase 4 is the merge gate; the user explicitly wants to deploy + use the
upgraded memory BEFORE Slice 2 starts. Honor that.
