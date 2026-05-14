---
description: "Implementation tasks for Voice Room v1 completion"
---

# Tasks: Voice Room for AI Employees — v1 completion

**Input**: Design documents from `/specs/voice-room-for-ai-employees/`

**Prerequisites**: [`plan.md`](./plan.md), [`spec.md`](./spec.md), [`research.md`](./research.md), [`data-model.md`](./data-model.md), [`contracts/voice-token-extension.md`](./contracts/voice-token-extension.md), [`quickstart.md`](./quickstart.md)

**Tests**: Not generated — Praxis Web has no automated test suite by intent (Constitution Principle V). Verification lives in the `quickstart.md` flows + 375/390px mobile sweep + the dated `SESSION_REPORT`.

**Organization**: Tasks are grouped by user story. Three of the five stories (US1, US3, US4) are **verification-only in-repo** — the worker (`conduit-voice-worker` on Railway) does the work; this repo confirms via telemetry/inspection. US2 and US5 carry the in-repo code work.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: Maps to user story phase (US1–US5); Setup / Foundational / Polish have no story label
- All paths are repo-relative from `/Users/luisdaniel/conduit-nextjs/`

## Path Conventions

Single-project Next.js 16 App Router monolith. In-scope locations:

- `supabase/migrations/` — schema
- `src/app/api/voice/` — route handlers (server)
- `src/app/app/` — Praxis console pages (server components, `/app/*` namespace per Constitution Principle IV)
- `src/components/conduit/voice/` — Praxis voice UI (client components)
- Repo root — `SESSION_HANDOFF_*.md`, `SESSION_REPORT_*.md`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish worker-readiness preconditions before any in-repo work begins.

- [ ] T001 Create `SESSION_HANDOFF_2026-05-XX_VOICE_ROOM_V1.md` at repo root. Capture: worker PR SHA in `conduit-voice-worker`, Railway deploy timestamp, W1–W6 readiness checklist (each dependency in plan.md's Worker Dependencies table marked verified-live or pending), and the worker `gate_open_fallback` test signal that confirms W1 + W2 are flowing into `conduit_voice_sessions.end_reason`. *(Anchors: plan.md "Worker Dependencies"; Principle V material milestone handoff.)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Confirm the Railway worker is live and behaving correctly **before** any in-repo edits land. The in-repo work in this plan adds no value if the worker is not ready, so this gate blocks every user-story phase.

**⚠️ CRITICAL**: No user-story work begins until T002 reports green.

- [ ] T002 Run quickstart Flow 5 (SC-002 query) against current production: open one long-form solo Atlas (`jarvis`) voice session of ≥20s response length. Confirm (a) final word is audible (manual ear-test, SC-001), (b) gate opens within ~1s of agent speech-end (SC-002 happy path), (c) `end_reason` column receives a non-`gate_open_fallback` value for the session. If any of (a/b/c) fails, **STOP** and return to the worker PR — do not proceed to Phase 3+. *(Anchors: SC-001, SC-002; quickstart.md Flow 5; FR-009; plan.md W1, W2.)*

**Checkpoint**: Worker is live and correct. User-story phases may now proceed.

---

## Phase 3: User Story 1 — Continuous conversation lands in full, no cutoff (Priority: P1) 🎯 MVP-baseline

**Goal**: Confirm the round-2 TTS-end-flush fix is durable in production. (All implementation is worker-side; this phase is in-repo verification.)

**Independent Test**: Per quickstart Flow 5 — query `conduit_voice_sessions` over a 24h window, compute the fraction of sessions where `end_reason = 'gate_open_fallback'`, confirm < 5%.

### Implementation for User Story 1

- [ ] T003 [US1] **(Post-merge verification — runs after T015 lands and a 24-hour usage window has accrued.)** Run the SC-002 query from `quickstart.md` Flow 5 against `conduit_voice_sessions` filtered to the last 24h. Confirm fallback rate < 0.05. Capture the query result + a count of total sessions in the window. Record in `SESSION_REPORT_2026-05-XX_VOICE_ROOM_V1.md` (T019). *(Anchors: SC-001, SC-002; FR-009; data-model.md "Reserved value: end_reason = 'gate_open_fallback'"; quickstart.md Flow 5. Principle V verification.)*

**Checkpoint**: SC-001 + SC-002 baseline durable in prod.

---

## Phase 4: User Story 2 — Switch the active employee mid-conversation in solo mode (Priority: P1)

**Goal**: User can swap the active employee mid-solo-call via voice command or a UI "Team" pill that opens a bottom-sheet picker (mobile) / popover (desktop). New employee speaks one short audible acknowledgement before answering.

**Independent Test**: Per quickstart Flow 1 — open a solo room with Atlas, trigger a switch to Sales via the Team pill, confirm Sales voice + acknowledgement on the next turn, confirm `conduit_voice_sessions.participants` records both employees on session end.

### Implementation for User Story 2

- [ ] T004 [P] [US2] Create `src/components/conduit/voice/TeamSwitchSheet.tsx` as a `"use client"` component. Props: `allowedEmployees: EmployeeId[]`, `lockedEmployees: EmployeeId[]`, `activeEmployeeId: EmployeeId`, `onSelect: (id: EmployeeId) => void`, `onDismiss: () => void`, `mode: "sheet" | "popover"`. Render the allowed employees as tap targets ≥44px (Principle V), show a lock icon on `lockedEmployees` and disable selection for those, dim the `activeEmployeeId` row. Use employee display names + colors from `src/lib/conduit/employees.ts` only (Principle 0 — never invent employees). No provider-name strings (Principle III). Implementation references: Next.js 16 docs `01-app/01-getting-started/05-server-and-client-components.md` ("use Client Components when you need state and event handlers, useEffect, browser APIs"). *(Anchors: FR-001 trigger (b); Q2 default; D2; D12; quickstart.md Flow 1 + Mobile sweep checklist.)*

- [ ] T005 [US2] Extend `src/components/conduit/voice/VoiceRoom.tsx`: (i) when `tokenResponse.mode === "solo"`, render a "Team" pill in the bottom toolbar (next to the existing mute and end buttons) that opens `TeamSwitchSheet` from T004 on tap; pill hidden when `mode === "roundtable"` per D12; (ii) on user select inside the sheet, publish a LiveKit data event via `room.localParticipant.publishData(encoder.encode(JSON.stringify({ type: "request_switch", target_employee_id: id })), { reliable: true })` per `contracts/voice-token-extension.md` "LiveKit data event"; (iii) extend the existing `onData` parser to recognize `{ type: "switch_refused", target_employee_id, reason }` and surface a non-blocking toast that includes the tier-aware upgrade hint when `reason === "tier_locked"`; (iv) the prior active employee continues unaffected on refusal (FR-003). Depends on T004. Touch targets ≥44px (Principle V). *(Anchors: FR-001, FR-003; D2, D4; quickstart.md Flow 1 + negative case; W5 worker dep already covered by T002.)*

- [ ] T006 [US2] **(Post-merge verification.)** Run quickstart Flow 1 against the merged + deployed branch on the Vercel preview: open a solo session with Atlas, tap the Team pill, swap to Sales, confirm acknowledgement + new voice + uninterrupted session timer. Run the negative case (attempt to swap to a tier-locked employee on a free or downgraded test account) and confirm the toast appears + prior active employee continues. Capture `conduit_voice_sessions.participants` for the demo session and confirm both employees are recorded in first-spoke order (FR-002). Record outcomes in `SESSION_REPORT_2026-05-XX_VOICE_ROOM_V1.md` (T019). *(Anchors: SC-003; FR-001, FR-002, FR-003; quickstart.md Flow 1.)*

**Checkpoint**: SC-003 verified; US2 ships green.

---

## Phase 5: User Story 3 — Memory written from voice sessions is recalled in the next session (Priority: P2)

**Goal**: Confirm that Atlas in voice context emits `[REMEMBER]`/`[SUPERSEDE]` tags, the worker strips and persists them, and the resulting `conduit_memory` rows surface in the next session's prompt. (All implementation is worker-side; this phase is in-repo verification.)

**Independent Test**: Per quickstart Flow 3 — state a durable fact during a voice session, inspect `conduit_memory` for a new row tagged `voice_session:<session_id>` with `written_by='jarvis'`, then start a new session and confirm recall.

### Implementation for User Story 3

- [ ] T007 [US3] **(Post-merge verification.)** Run quickstart Flow 3 against the merged worker. Stage 5 sessions (one per employee that hosts voice, prioritising Atlas + Sales + Marketing + Engineering + Finance). In each, state a durable fact/preference/decision/goal that should clear the R10 "good moment" bar. End the session. Inspect `conduit_memory` for each — confirm: (a) new row exists, (b) `written_by='jarvis'`, (c) `tags` contains `voice_session:<session_id>`, (d) `kind` is one of the 5 valid kinds. Then open a new chat or voice session for the same account and confirm the memory appears in the recall block by asking a question that should leverage it (the employee should act as if they already know). Verify SC-004 baseline (≥80% of qualifying sessions produce ≥1 row). Record in `SESSION_REPORT_2026-05-XX_VOICE_ROOM_V1.md` (T019). *(Anchors: SC-004; FR-005, FR-013; D5, D6; quickstart.md Flow 3; W3.)*

**Checkpoint**: SC-004 verified; memory parity between voice and chat is durable in prod.

---

## Phase 6: User Story 4 — User explicitly addresses one employee in round-table (Priority: P2)

**Goal**: Confirm that prefixing a round-table turn with an employee's display name ("Sales, …") routes the response exclusively to that employee, with an audible Atlas fallback when the addressee is unavailable. (All implementation is worker-side; this phase is in-repo verification.)

**Independent Test**: Per quickstart Flow 4 — in a round-table with ≥3 employees, address one by name, confirm only that employee responds; then address an unavailable employee, confirm Atlas's one-sentence fallback.

### Implementation for User Story 4

- [ ] T008 [US4] **(Post-merge verification.)** Stage 5 round-tables on a tier ≥ pro account: 3 happy-path addressee tests (each addressing a different specialist) + 1 tier-locked negative case (downgrade test account to free, attempt to address a locked employee) + 1 not-in-room negative case (address an employee who's on the tier but not in this round-table's participant set). For each, verify: (a) for happy-path, only the addressed employee's `active_speaker` event fires + their voice is heard; (b) for negative cases, Atlas's one-sentence fallback is audible and the upgrade hint appears only on tier-lock; (c) the transcript records the routing decision. Confirm SC-005 baseline (100% compliance when present). Record in `SESSION_REPORT_2026-05-XX_VOICE_ROOM_V1.md` (T019). *(Anchors: SC-005; FR-006; D7, D8; quickstart.md Flow 4; W4.)*

**Checkpoint**: SC-005 verified; explicit addressee routing is durable in prod.

---

## Phase 7: User Story 5 — Resume context from a prior voice session (Priority: P3)

**Goal**: User can pick a prior voice session (≤14 days old, non-empty `transcript_summary`) from `/app/settings/voice-history` and "continue" it; the new room's agent first-turn is aware of the prior thread; the new session row links back to its parent.

**Independent Test**: Per quickstart Flow 2 — pick an eligible prior session, tap Continue, confirm `ContinuationBadge` renders, confirm agent first-turn awareness, end the session, inspect `parent_session_id`.

### Implementation for User Story 5

- [ ] T009 [US5] Create `supabase/migrations/022_voice_session_continuation.sql` per `data-model.md` "Schema delta": `ALTER TABLE conduit_voice_sessions ADD COLUMN parent_session_id uuid REFERENCES conduit_voice_sessions(id) ON DELETE SET NULL;` followed by `CREATE INDEX conduit_voice_sessions_parent_idx ON conduit_voice_sessions(parent_session_id) WHERE parent_session_id IS NOT NULL;`. Migration is single-file, two statements, forward-numbered after `021_theme_pref.sql`. RLS is already enabled on `conduit_voice_sessions`; existing owner-scoped policy covers the new column (research.md R4) — no additional policy DDL required. All identifiers prefixed `conduit_*` per Principle II. *(Anchors: FR-008, FR-011; D11; data-model.md "Migration ordering"; Constitution Principle II.)*

- [ ] T010 [US5] Apply migration 022 to Supabase via the Supabase MCP `apply_migration` tool (project ref `mvuslmfjkkuizixjpkgl`). Confirm the column appears on `conduit_voice_sessions` via `list_tables` or `execute_sql`, and confirm a `SELECT parent_session_id FROM conduit_voice_sessions LIMIT 1;` succeeds (no permission error, no missing column). Depends on T009. *(Anchors: FR-008, FR-011; Principle II; plan.md "Migration ordering".)*

- [ ] T011 [US5] Extend `src/app/api/voice/token/route.ts` per `contracts/voice-token-extension.md`: (i) add optional `parent_session_id?: string` to the `TokenBody` interface; (ii) when present, run the 4 validations from the contract's "Delta — Validation" table — uuid shape (400 `parent_session_invalid`), `account_id` match against requester (403 `parent_session_forbidden`), `transcript_summary` non-empty (400 `parent_session_unavailable`), `created_at >= now() - interval '14 days'` (400 `parent_session_too_old`); (iii) on success, fetch `started_at` from the parent row; (iv) add `parent_session_id` to the `AccessToken.metadata` JSON so the worker (W6) can read it on join; (v) echo `parent_session_id` and `parent_session_started_at` in the response per the contract's "Delta — Response body". Existing `runtime = "nodejs"` directive preserved (Next.js 16 docs: `runtime.md` confirms `'nodejs'` default and that the option cannot be used in Proxy; we are not touching Proxy). POST handlers remain uncached per `15-route-handlers.md` ("non-GET methods not cached"). Depends on T010. *(Anchors: FR-007, FR-008, FR-015; contracts/voice-token-extension.md; Principle I docs cited; quickstart.md Flow 2 negative cases.)*

- [ ] T012 [P] [US5] Create `src/components/conduit/voice/ContinuationBadge.tsx` as a `"use client"` component. Props: `parentSessionStartedAt: string` (ISO 8601). Render a small header chip with the copy "Continuing your conversation from <relative time>" computed from `parentSessionStartedAt` (use the same `relativeTime` shape as `src/app/app/voice/page.tsx`). Uses no provider-name strings (Principle III). No imports from marketing components (Principle IV). *(Anchors: FR-016; D12; quickstart.md Flow 2 step 3.)*

- [ ] T013 [US5] Extend `src/app/app/settings/voice-history/page.tsx` to add a Continue affordance on each session row. The affordance is gated server-side on `(created_at >= now() - interval '14 days') AND (transcript_summary IS NOT NULL AND length(trim(transcript_summary)) > 0)` — non-eligible rows render the same row shape without the button (FR-007). The button is a small `"use client"` child component (kept inline or in a new `VoiceHistoryRow.tsx` if too noisy) that POSTs to `/api/voice/token` with `{ employee_id: <prior_session.employee_id>, mode: "solo", parent_session_id: <prior_session.id> }` and, on success, navigates the user into a VoiceRoom mount (same shape as the existing `EnterTheRoomCard` / solo entry flows). Honors all token-route error shapes from `contracts/voice-token-extension.md` "Delta — Validation" by surfacing the `message` field verbatim. Depends on T011. *(Anchors: FR-007; D9; contracts/voice-token-extension.md; quickstart.md Flow 2.)*

- [ ] T014 [US5] Extend `src/components/conduit/voice/VoiceRoom.tsx` to mount `ContinuationBadge` (from T012) in the header area when `tokenResponse.parent_session_id` is non-null. Pass `parentSessionStartedAt={tokenResponse.parent_session_started_at!}`. Mount order: above the active-speaker avatar block, below the "Praxis Voice · …" eyebrow strip, so the badge is the first thing the user sees on room load. Depends on T012 and on T005 having merged first (both edit the same file; sequence US2 before US5's VoiceRoom edit to avoid a same-file merge conflict). *(Anchors: FR-016; quickstart.md Flow 2 step 3.)*

- [ ] T015 [US5] **(Post-merge verification.)** Run quickstart Flow 2 against the merged + deployed branch: (a) seed an eligible prior session, (b) verify Continue button visibility on the eligible row + absence on an ineligible row, (c) tap Continue, confirm a new VoiceRoom mounts with `ContinuationBadge` and the agent's first turn references the prior thread, (d) end the session, inspect `conduit_voice_sessions.parent_session_id` on the new row. Run the 3 negative cases from quickstart Flow 2 (not-yours / >14d / empty summary) — confirm 403/400 with the contract's documented error shapes. Verify SC-006 (100% recognition on summary-present continuations). Record in `SESSION_REPORT_2026-05-XX_VOICE_ROOM_V1.md` (T019). *(Anchors: SC-006; FR-007, FR-008, FR-015, FR-016; quickstart.md Flow 2.)*

**Checkpoint**: SC-006 verified; US5 ships green; the durable continuation path is live.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Constitution Principle V (mobile sweep + preview) and Principle III (no provider names) verification across all in-repo deliverables, plus the material-milestone `SESSION_REPORT`.

- [ ] T016 [P] Run the full 375px and 390px mobile sweep checklist from `quickstart.md` "Mobile sweep checklist" against the Vercel preview URL of the merging PR (or the merged main if landed). For each item in the checklist (Team pill visible/tappable, bottom sheet open/close, employee rows readable, lock icons render, ContinuationBadge fits header, Continue button doesn't cramp the row, active-speaker visible behind sheet backdrop, end-call still reachable), capture pass/fail. Any fail blocks merge or triggers a follow-up PR. *(Anchors: SC-007; Constitution Principle V; quickstart.md Mobile sweep checklist.)*

- [ ] T017 [P] Run the pre-merge Principle III grep from `quickstart.md` "Pre-merge grep": `git diff main --name-only | xargs grep -EI 'Claude|Anthropic|OpenAI|ElevenLabs|LiveKit' 2>/dev/null`. Inspect each hit — comments and non-user-visible technical references are acceptable; JSX text content, page metadata, error messages surfaced to the user, and any user-facing string are NOT. Zero user-visible hits required. *(Anchors: SC-008; FR-010; Constitution Principle III; quickstart.md Pre-merge grep.)*

- [ ] T018 [P] Run `pnpm build` against the merging branch. Confirm green. Capture any Next.js 16 deprecation notices in the build output — each MUST be either resolved in the same PR or filed as a tracked TODO with a follow-up plan, per Constitution Principle I. Zero unaddressed deprecations on merge. *(Anchors: Constitution Principle I; AGENTS.md read-first habit.)*

- [ ] T019 Write `SESSION_REPORT_2026-05-XX_VOICE_ROOM_V1.md` at repo root. Capture: (a) decisions made + deltas from spec (any clarifications discovered during implementation), (b) SC-001/002/003/004/005/006/007/008 verification outcomes from T002, T003, T006, T007, T008, T015, T016, T017, (c) build outcome from T018, (d) follow-ups (worker-side or in-repo) that didn't make this round. Follow the naming pattern `SESSION_REPORT_YYYY-MM-DD_<SCOPE>.md` per Constitution Principle V "material milestone." Depends on all verification tasks (T002, T003, T006, T007, T008, T015, T016, T017, T018). *(Anchors: Constitution Principle V material milestone; plan.md Gate V Verdict.)*

**Checkpoint**: All SCs verified; mobile sweep passed; build green; provider-name blocklist clean; session report committed. Feature is fully shipped.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup, T001)**: No dependencies; can start as soon as the worker PR opens or merges.
- **Phase 2 (Foundational, T002)**: Depends on T001 + worker live. **BLOCKS Phase 3 onward**.
- **Phase 3 (US1, T003)**: Verification only — gated on T015 having landed and 24 hours of usage accruing.
- **Phase 4 (US2)**: T004 [P] can start immediately after T002. T005 depends on T004. T006 depends on T005 having merged and Vercel preview being live.
- **Phase 5 (US3, T007)**: Verification only — can run as soon as T002 is green; independent of in-repo PR sequence (it tests worker behavior on existing endpoint).
- **Phase 6 (US4, T008)**: Verification only — same as US3.
- **Phase 7 (US5)**: T009 → T010 → T011 → T013 (server-side chain); T012 [P] in parallel with T009–T011; T014 depends on T012 **and on T005 having merged first** (same-file sequencing); T015 depends on T011, T013, T014.
- **Phase 8 (Polish)**: T016 / T017 / T018 [P] can run in parallel after all code lands (after T013, T014, T005). T019 depends on every verification task in Phases 2–8.

### Within-Story Dependencies

- US2: T004 (component) → T005 (integration) → T006 (verification).
- US5: T009 (migration file) → T010 (apply) → T011 (route extension) → T013 (voice-history Continue); T012 (badge) parallel; T014 (VoiceRoom mount badge) depends on T012 + T005-merged; T015 verification depends on T011 + T013 + T014.

### Same-file Sequencing

`src/components/conduit/voice/VoiceRoom.tsx` is edited by both T005 (US2) and T014 (US5). T005 ships first as part of US2's PR sequence; T014 lands in US5's PR sequence and rebases cleanly on top. **No simultaneous parallel edits to VoiceRoom.tsx.**

### Worker Dependency Satisfaction Checkpoints

Worker dependencies (W1–W6 per plan.md "Worker Dependencies") are gated, not tasked. They satisfy at these in-repo checkpoints:

| Worker dep | In-repo verification task | Story | Gate |
|---|---|---|---|
| W1 (TTS end-flush fix) | T002 (foundational smoke) + T003 (24h SC-002 query) | US1 | Blocks Phase 3+ |
| W2 (`gate_open_fallback` emission) | T002 + T003 | US1 | Blocks Phase 3+ |
| W3 (voice-side `[REMEMBER]` parsing) | T007 | US3 | Blocks US3 verification |
| W4 (addressee detection + audible fallback) | T008 | US4 | Blocks US4 verification |
| W5 (switch context payload + acknowledgement) | T006 | US2 | Blocks US2 verification |
| W6 (continuation context payload) | T015 | US5 | Blocks US5 verification |

If T002 fails on the foundational smoke, **all** subsequent phases are blocked until the worker PR is revised.

### Parallel Opportunities

- T004 [P] (TeamSwitchSheet) and T012 [P] (ContinuationBadge) — different new files, no cross-deps, can be written in parallel.
- T016 [P], T017 [P], T018 [P] — different verification surfaces (mobile sweep, grep, build), can run concurrently in Polish.
- US3 (T007) and US4 (T008) verifications — independent of the in-repo PR sequence; can run as soon as T002 is green, in parallel with US2/US5 in-repo work.

---

## Parallel Example — within US5

```bash
# Once T010 (migration applied) is green, these two new-component
# tasks can run in parallel; they touch different files:
Task: "Create TeamSwitchSheet at src/components/conduit/voice/TeamSwitchSheet.tsx"  # T004 (US2)
Task: "Create ContinuationBadge at src/components/conduit/voice/ContinuationBadge.tsx"  # T012 (US5)

# After both components exist and T011 (token route) is green,
# T005 + T013 + T014 sequence through (T014 last per same-file rule).
```

---

## Implementation Strategy

### MVP-baseline first (US1 verification only — proves the worker is correct)

1. T001 → T002. If T002 is red, **stop**: the worker is not ready, no in-repo work is meaningful yet.

### MVP-shippable next (US2 in-repo work + US1 24h verification)

1. T004 → T005 → push to main → Vercel preview → T006 mobile sweep on US2 surface → main deploy.
2. After 24h of production usage on the merged worker, T003 confirms the SC-002 fallback rate.

### Round-up (US5 — most in-repo work)

1. T009 → T010 (migration applied to Supabase).
2. T011 (token route extension) + T012 (badge component) in parallel.
3. T013 (voice-history Continue) sequence after T011.
4. T014 (VoiceRoom mount badge) after T012 and after T005 has merged (same-file).
5. T015 verification.

### Verification-only stories

1. T007 (US3) and T008 (US4) can run as soon as T002 is green — these confirm worker behavior on existing in-repo endpoints; nothing in this plan changes those code paths.

### Closeout

1. T016 / T017 / T018 in parallel.
2. T019 SESSION_REPORT after everything else.

---

## Notes

- **No automated tests**: Praxis Web has no test suite by intent (Constitution Principle V). Verification lives entirely in the quickstart flows + mobile sweep + SC queries + the dated SESSION_REPORT. Tasks reflect this — no contract / unit / integration test tasks generated.
- **Push-to-main per task (Constitution Principle VI)**: each task is sized to be a single bounded PR or direct push to main. No long-running feature branches implied.
- **Worker boundary preserved**: every worker dep (W1–W6) is a gate, not a task. They live in `conduit-voice-worker` (Railway) and ship in a separate PR ~24–48h ahead of this plan's first in-repo PR.
- **Plan amendments discovered during decomposition**: **none**. The plan is complete relative to the task list; no NEEDS CLARIFICATION emerged.
- **Same-file sequencing**: only one same-file conflict pair (T005 ↔ T014 on `VoiceRoom.tsx`), resolved by ordering US2 before US5's VoiceRoom edit.
- Commit after each task or each logical group; stop at any checkpoint to validate before continuing.
