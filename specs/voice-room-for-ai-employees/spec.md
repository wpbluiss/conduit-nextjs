# Feature Specification: Voice Room for AI Employees — v1 completion

**Feature Branch**: `001-voice-room-for-ai-employees`

**Created**: 2026-05-14

**Status**: Locked 2026-05-14 (clarify.md defaults accepted in full)

**Input**: User description: "AI employee voice room — user can speak to their
AI employees, have continuous conversation, employees remember context across
sessions."

## Starting state — this is v1.x, not v0

Praxis already ships a Voice Room. The Next.js app provides the surface
(`/app/voice`, `VoiceRoom` component, settings pages), the LiveKit JWT
mint (`POST /api/voice/token`), session list (`GET /api/voice/sessions`),
worker-only memory write (`POST /api/voice/memory-write`), and a
`conduit_voice_sessions` table with durable `raw_transcript` +
`transcript_summary`. Cross-session memory exists as `conduit_memory`,
written by Atlas (employee id `jarvis`) and read by every employee at the
top of their system prompt.

The voice **agent itself** — the LiveKit room participant that ingests
mic audio, runs OpenAI Realtime + ElevenLabs streaming TTS, and publishes
audio + transcript data back to the room — lives in a **separate
repository** (`conduit-voice-worker`, deployed on Railway) and is out of
scope for direct edit from this repo.

This spec covers the Next.js + Supabase boundary only. Worker-side work
is named as a **dependency** where applicable, not as a deliverable.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Continuous conversation lands in full, no cutoff (Priority: P1)

A user opens a solo voice room with Atlas (`jarvis`) and asks an
open-ended question: "walk me through how I should grow my pipeline
over the next quarter." Atlas responds for 20–40 seconds. The user
hears the response **in full**, including the last sentence and final
word. After Atlas finishes, the user can speak again within ~1 second
— never locked out for 5 seconds.

**Why this priority**: every other Voice Room story depends on the
conversational loop being trustworthy. Today, sessions exhibit
intermittent end-of-response cutoff and a ~5s post-response lockout —
documented in `docs/atlas-voice-state-machine.md` as the
`closing-but-not-yet-done` hidden state. The architectural fix is
specified in that document but lives in the worker. v1 is not
shippable until this fix is deployed end-to-end and verified.

**Independent Test**: open a solo room with each employee, ask a
question requiring a long-form response, and confirm: (a) the final
sentence is audible; (b) the user can interrupt or follow up within
~1 second of Atlas finishing; (c) worker telemetry shows the gate
opening via the `done`-driven path (not the 5-second
`POST_TEXT_DONE_FALLBACK_MS` fallback) on the normal happy path.

**Acceptance Scenarios**:

1. **Given** a solo voice room with `jarvis` (Atlas), **When** the
   user asks a question that triggers ≥10s of TTS, **Then** the user
   hears the response to its final word, no clipping.
2. **Given** Atlas has just finished a long response, **When** the
   user starts speaking ~1 second later, **Then** the user's audio
   reaches the agent and a new response cycle starts.
3. **Given** a long response is in progress, **When** the user
   interrupts at conversational volume, **Then** the agent stops
   speaking within the existing interrupt envelope (no regression to
   the round-1 false-interrupt class).

---

### User Story 2 — Switch the active employee mid-conversation in solo mode (Priority: P1)

A user is in a solo voice room with Atlas (`jarvis`) discussing
pipeline strategy. The user decides to hear from `sales` directly. The
user issues a switch — either by speaking the request naturally ("get
me Sales", "switch to Engineering") or by tapping an in-room "Team"
pill that opens a bottom-sheet picker. The next agent turn is spoken
by `sales` with a short audible acknowledgement ("Sales here — picking
this up"); the active speaker transitions without dropping the LiveKit
session, losing the conversational thread, or restarting
timing/billing.

**Why this priority**: today, a solo session opens with one employee
and remains pinned until session end. The only way to hear from
another employee is to end the call and start a new one — which loses
context, restarts the session timer, and breaks the
"continuous-conversation" promise. The `VoiceRoom` component has no
swap affordance.

**Independent Test**: open a solo voice room with one employee, trigger
a switch, and verify: (a) the new employee's voice is heard within the
same LiveKit room; (b) the prior conversation context (last few user
turns) is available to the new employee's system prompt; (c) the
session timer continues uninterrupted; (d) the session row in
`conduit_voice_sessions` reflects all participants who spoke during
the session (the existing `participants jsonb` column already supports
this shape).

**Acceptance Scenarios**:

1. **Given** a solo voice room with `jarvis`, **When** the user
   triggers a switch to `sales`, **Then** the next agent turn is
   spoken in the `sales` voice with the `sales` system prompt
   active.
2. **Given** a switch has happened mid-session, **When** the session
   ends, **Then** `conduit_voice_sessions.participants` lists every
   employee that spoke at least one turn, in the order they first
   spoke.
3. **Given** a switch is requested for an employee the user's tier
   does not allow, **When** the swap is attempted, **Then** the
   switch is refused with a user-visible reason and the prior active
   employee continues without disruption.

---

### User Story 3 — Memory written from voice sessions is recalled in the next session (Priority: P2)

A user tells Atlas during a voice session: "I just decided to focus on
Pro-tier customers for the next two quarters." A new session starts
the next day — voice or text. Atlas (and every other employee, via
shared memory) acts as if they already know this fact. The user does
not have to repeat it.

**Why this priority**: cross-session memory is the headline of "have
the employees remember context." The receiving endpoint
(`/api/voice/memory-write`) exists and forces `written_by='jarvis'`
in compliance with the R10 invariant. The Next.js side is wired. What
needs verification — and may need a fix in the worker — is whether
Atlas in voice context actually emits memory writes (parity with the
chat route's `parseMemoryWrites` flow at
`src/app/api/conduit/chat/route.ts:597`). Without that, voice sessions
contribute nothing to durable memory.

**Independent Test**: in a voice session, state a memorable fact that
should clear the R10 "good moment" bar (a goal, a decision, a durable
preference). End the session. Inspect `conduit_memory` for a new row
sourced via the worker endpoint (tagged
`voice_session:<session_id>`). Start a fresh chat or voice session
and confirm the recall block reflects the new memory.

**Acceptance Scenarios**:

1. **Given** Atlas in a voice session, **When** the user states a
   durable fact, decision, goal, or preference, **Then** at session
   end a `conduit_memory` row is inserted via
   `/api/voice/memory-write`, tagged with the voice session id, and
   attributed `written_by='jarvis'`.
2. **Given** a voice-written memory exists, **When** the same user
   starts any new chat or voice session, **Then** the memory appears
   in the `WHAT YOU KNOW ABOUT THIS USER AND BUSINESS:` block at the
   top of every employee's system prompt.
3. **Given** the user states something explicitly transient ("I'll be
   five minutes late to my next meeting"), **When** the session ends,
   **Then** no memory row is written for that statement.

---

### User Story 4 — User explicitly addresses one employee in round-table (Priority: P2)

A user is in a round-table with Atlas, `sales`, and `marketing`. They
say "Sales — what would you do about the pricing objection?" Only
`sales` responds. Atlas and `marketing` stay silent for that turn.
On the next user turn, normal routing resumes.

**Why this priority**: the round-table is currently router-driven —
the worker decides who speaks. Users sometimes have a specific
addressee in mind and want their direct attention without Atlas
synthesizing or routing. Today this is implicit and inconsistent.

**Independent Test**: open a round-table with at least three
employees. Address one by name ("Sales, ...", "Marketing, ...").
Verify: (a) only the addressed employee's audio is heard for that
turn; (b) the `active_speaker` data event names that employee; (c)
the transcript attributes the response to that employee; (d) the
next round-trip without an explicit addressee returns to normal
routing.

**Acceptance Scenarios**:

1. **Given** a round-table with at least two specialists plus Atlas,
   **When** the user prefixes a turn with a clear addressee
   (employee display name), **Then** only that employee responds.
2. **Given** an addressee tag for an employee not present in the
   room (locked by tier or simply not in this round-table's
   participant set), **When** the turn is processed, **Then**
   Atlas speaks one short sentence indicating the addressee isn't
   available — surfacing a tier-aware upgrade hint when the cause
   is tier-locking — and then answers the question himself; the
   transcript records the unavailability.
3. **Given** a turn with no addressee, **When** the turn is
   processed, **Then** routing falls back to the existing
   round-table default (worker picks; Atlas synthesizes if multiple
   speak).

---

### User Story 5 — Resume context from a prior voice session (Priority: P3)

A user opens `/app/settings/voice-history`, picks any prior session
within the last 14 days that has a non-empty `transcript_summary`,
and chooses "continue." A new voice room opens with the prior
session's summary plus its last 6 user/agent turn pairs loaded into
the agent's working context — so the user can pick up the thread
without re-establishing where they left off. Sessions older than 14
days hide the affordance; durable cross-session recall is what
`conduit_memory` is for, not transcript replay.

**Why this priority**: `conduit_voice_sessions` already stores
`raw_transcript` and `transcript_summary`. The persistence is done;
the surface is not. This is a P3 because memory recall (Story 3)
already partially covers the "they remember" promise — Story 5 makes
within-conversation continuity (mid-thread state, not just durable
facts) explicit.

**Independent Test**: end a voice session mid-thread, navigate to
voice history, "continue" the session. Verify the new room's first
agent turn references the prior thread accurately and the prior
session's `transcript_summary` is visible somewhere user-discoverable
(or its presence in the agent's prompt is otherwise verifiable in
worker logs).

**Acceptance Scenarios**:

1. **Given** a finished voice session with a non-empty
   `transcript_summary`, **When** the user triggers "continue" from
   voice history, **Then** a new voice room opens and the agent's
   first turn demonstrates awareness of the prior session's last
   thread.
2. **Given** the user "continues" a session, **When** the new
   session ends, **Then** the new `conduit_voice_sessions` row's
   `parent_session_id` column points to the prior session's id.
3. **Given** a session whose `transcript_summary` is empty (worker
   never produced one), **When** the user attempts to continue,
   **Then** the surface either falls back to a fresh session with a
   notice, or hides the "continue" affordance — the user is not
   shown a broken button.

---

### Edge Cases

- **Tier change mid-session**: a user on Pro starts a round-table
  with four employees; their tier downgrades to free during the
  session. Behavior: the current session completes under its
  starting grants; no mid-session re-eval. The next session honors
  the new tier.
- **Daily voice cap reached mid-call**: today the `max_seconds` is
  enforced client-side via the timer and the worker presumably
  closes server-side. Spec: behavior on cap-hit MUST be graceful —
  the agent finishes its in-flight sentence, then the room ends
  with `end_reason='daily_cap_reached'` (existing column).
- **LiveKit room provisioning fails**: `/api/voice/token` returns
  503 with `voice_not_configured`. UI surface MUST render a
  recoverable error state ("Voice mode is being set up. Try again
  in a few minutes."), not a blank room.
- **Worker not present in room**: if the agent never joins (Railway
  worker is down or mis-scheduled), the user sees "joining…" with no
  resolution. UI MUST time out at a defined threshold and offer a
  retry/end path rather than spinning indefinitely.
- **Mic permission denied**: user may have revoked the browser mic
  grant since their last session. UI MUST surface the permission
  block as a recoverable error, not a connection error.
- **Switch to a locked employee** (Story 2 #3): refused with a
  user-visible upgrade hint; session continues with the prior
  active employee.
- **Addressee tag ambiguity** (Story 4): if multiple employees match
  ("the team" or "everyone"), fall back to default round-table
  routing rather than picking one arbitrarily.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a solo voice session to switch its
  active employee mid-call without ending the LiveKit room, without
  resetting the session timer, and without losing the prior turns of
  context. The new active employee's system prompt becomes effective
  on the next agent turn. The switch is triggered by either (a) a
  natural-language voice command ("get me Sales", "switch to
  Engineering") or (b) a UI affordance — a "Team" pill in the
  solo-mode bottom toolbar that opens a bottom-sheet picker on mobile
  (375/390px) and a popover on desktop; the pill is hidden in
  round-table mode (where all participants are already on screen).
  The new employee MUST audibly acknowledge the handoff with one
  short sentence (e.g. "Sales here — picking this up") before
  proceeding to answer. There is no hard cap on switches per session;
  the context payload (FR-014) bounds the effective prompt size
  regardless of switch count.
- **FR-002**: When a solo session has multiple active employees over
  its lifetime, the system MUST record every employee that spoke at
  least one turn in `conduit_voice_sessions.participants`, ordered
  by first-speaker time.
- **FR-003**: Switching to an employee not permitted on the user's
  current tier MUST be refused with a user-visible reason. The
  session MUST continue without disruption.
- **FR-004**: Memory writes originating from voice sessions MUST
  flow through `POST /api/voice/memory-write` exclusively. The
  endpoint MUST continue to authenticate via shared worker secret
  and force `written_by='jarvis'`. (Existing.)
- **FR-005**: Memory writes from voice sessions MUST follow the same
  Atlas-emits-tags pattern as chat: Atlas (`jarvis`) emits
  `[REMEMBER: …]` / `[SUPERSEDE: …]` tags in his text deltas using
  the existing `ATLAS_MEMORY_INSTRUCTIONS`, the worker scans deltas
  with the existing `parseMemoryWrites` parser at
  `src/lib/ai/memory.ts`, strips the tags from text before passing to
  TTS so the user never hears them, and posts each parsed row to
  `POST /api/voice/memory-write` in real-time. Every voice-sourced
  row MUST carry the tag `voice_session:<session_id>` for attribution
  and source-tracing from the memory UI.
- **FR-006**: A natural-language addressee in a round-table turn —
  the user prefixes the turn with an employee's display name
  ("Sales, …", "Marketing, …") — MUST route to that single employee
  for that turn only. The next turn without an addressee MUST return
  to default routing. When the named employee is not in the room
  (locked by tier, or not in this round-table's participant set),
  Atlas MUST speak one short sentence indicating the unavailability,
  including a tier-aware upgrade hint when the cause is tier-locking,
  and then answer the question himself.
- **FR-007**: Voice history (`/app/settings/voice-history`) MUST
  expose a "continue" affordance for any session within the last 14
  days that has a non-empty `transcript_summary`. Sessions without a
  summary, or older than 14 days, MUST NOT show the affordance.
- **FR-008**: A continued session MUST persist a link from the new
  session row back to the prior session row via a
  `parent_session_id uuid` column on `conduit_voice_sessions`,
  foreign-keyed to the same table with `ON DELETE SET NULL`. The
  creating migration MUST enable RLS and ship at least one policy in
  the same file per Constitution Principle II. Multi-hop chains are
  followed by recursive query if/when needed; no separate chain
  table for v1.
- **FR-009**: The end-of-response cutoff and gate-stuck-open bug
  documented in `docs/atlas-voice-state-machine.md` §3 MUST be
  resolved end-to-end before v1 ships. The worker writes the
  discriminating value `gate_open_fallback` into
  `conduit_voice_sessions.end_reason` (existing text column — no
  migration needed) whenever the 5-second `POST_TEXT_DONE_FALLBACK_MS`
  path fires. SC-002 verification becomes the simple query "fraction
  of sessions in a window where `end_reason = 'gate_open_fallback'`."
- **FR-010**: All voice surfaces MUST continue to honor the
  brand-integrity rules in Constitution Principle III — no
  user-visible reference to "Claude," "Anthropic," "OpenAI,"
  "ElevenLabs," or other provider names in transcripts, error
  messages, settings, or metadata. Provider concealment is
  enforced at the prompt layer and at the UI layer.
- **FR-011**: All new or modified tables MUST be `conduit_*`
  prefixed with RLS enabled in the creating migration, per
  Constitution Principle II.
- **FR-012**: Tier and daily cap enforcement at room provisioning
  (`POST /api/voice/token`) MUST continue to be the authoritative
  gate — UI affordances are courtesy hints, not enforcement.
- **FR-013**: Voice-sourced memory rows MUST count against the same
  `conduit_pricing_tiers.memory_cap` as chat-sourced rows. There is
  no separate per-channel budget; the cap is a durability budget,
  not a per-channel one.
- **FR-014**: When a solo session switches employees mid-call
  (FR-001), the new employee's first turn MUST receive a context
  payload consisting of (a) a short worker-generated summary of the
  session up to the switch point, plus (b) the last 4 user/agent
  turn pairs verbatim. This payload shape mirrors the chat handoff
  and bounds the effective prompt size regardless of switch count.
- **FR-015**: When a session is resumed via "continue" (FR-007), the
  new room's worker bootstrap context MUST consist of the prior
  session's `transcript_summary` plus the prior session's last 6
  user/agent turn pairs verbatim. This shape mirrors the mid-session
  switch handoff (FR-014) so there is one mental model, not two.
- **FR-016**: A new room mounted from a "continue" affordance
  (FR-007) MUST visually surface the link — e.g. a "Continuing
  your conversation from <relative time>" note — so the user
  understands why the agent already knows the prior context.

### Key Entities *(new or changed only)*

- **conduit_voice_sessions** (existing): gains a
  `parent_session_id uuid` column (FK to the same table, `ON DELETE
  SET NULL`) for Story 5 continuity (FR-008). The existing
  `end_reason` text column gains the discriminating value
  `gate_open_fallback` (no schema change; new value semantically
  reserved) for Story 1 telemetry (FR-009).
- **conduit_memory** (existing): unchanged shape. Voice-sourced
  rows distinguish themselves only by the `voice_session:<id>`
  tag (FR-005).
- **Voice agent (out-of-repo)**: the LiveKit room participant in
  the `conduit-voice-worker` repo. This spec depends on the
  worker for: emitting memory writes from voice transcripts
  (Story 3), respecting addressee tags in round-table routing
  (Story 4), accepting a continuation payload at room join
  (Story 5), and implementing the round-2 TTS-end-flush fix
  (Story 1).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of solo voice sessions ≥ 10 seconds of TTS
  output complete the final word audibly. (Verified by manual
  ear-test on Vercel preview across 5 long-form sessions per
  employee.)
- **SC-002**: 95th-percentile gate-open latency after agent
  speech-end is ≤ 1.2 seconds on the normal happy path; the
  5-second fallback path fires in < 5% of sessions. (Verified
  from worker telemetry or `total_output_ms` deltas in
  `conduit_voice_sessions`.)
- **SC-003**: A solo session can switch active employees at
  least twice without ending the LiveKit room and without the
  user perceiving a session reset. (Verified by manual demo;
  `participants` column records all three employees.)
- **SC-004**: At least 80% of voice sessions ≥ 60 seconds
  produce ≥ 1 `conduit_memory` row when the user states a
  qualifying fact/preference/decision/goal during the session.
  (Verified by post-session inspection of the memory table
  for 5 staged sessions per employee.)
- **SC-005**: An explicit round-table addressee ("Sales —
  …") routes exclusively to that employee in 100% of cases
  where the named employee is present in the room. (Verified
  by transcript inspection across 5 staged round-tables.)
- **SC-006**: A "continue" from voice history opens a new
  session whose first agent turn demonstrates awareness of
  the prior session's last topic in 100% of cases where
  `transcript_summary` is non-empty. (Manual verification on
  preview.)
- **SC-007**: Mobile viewports at 375px and 390px render the
  voice room (solo + round-table + new switch affordance + new
  addressee handling) without overflow, with touch targets ≥
  44px, per Constitution Principle V.
- **SC-008**: No user-visible string in any new voice surface
  references "Claude," "Anthropic," "OpenAI," "ElevenLabs," or
  any model-provider name. (Verified by grep over `src/app/app/`,
  `src/components/conduit/voice/`, and rendered preview
  metadata.)

## Assumptions

- The `conduit-voice-worker` repository is reachable, deployable,
  and accepts a fix for the Atlas state-machine round-2 issue.
  This spec depends on that work but does not deliver it.
- Worker PR ships **first** (round-2 fix; switch context payload;
  natural-language addressee routing; continuation payload at room
  join; Atlas-emits-tags memory parsing on voice transcripts),
  behind a feature flag if needed. This Next.js spec's PR follows
  ~24–48h later. Verification of SC-001/SC-002 happens on the
  merged worker before this spec's surface changes go live.
- LiveKit, OpenAI Realtime, and ElevenLabs streaming TTS remain
  the underlying transport / model / TTS stack. Replacing any
  of these is a separate spec.
- The R10 memory invariant — Atlas (`jarvis`) is the only writer
  — is preserved. Voice memory writes continue to attribute to
  `jarvis` regardless of which employee hosted the session.
- The 9-employee canonical roster (`jarvis`, `marketing`, `sales`,
  `engineering`, `finance`, `compliance`, `hr`, `ops`, `legal`)
  is fixed for v1. Adding employees is out of scope and would
  re-open Principle Zero source-authority review.
- Voice sessions remain owner-scoped via RLS; multi-tenant or
  guest-participant scenarios are out of scope.
- The `voice_session_id` link on `conduit_conversations`
  (migration 016) is the existing mechanism for tying a voice
  session to a text conversation. Story 5's continuation may
  reuse this column or add a sibling — decision at plan time.

## Out of Scope

### Already implemented — do not re-implement in plan or tasks

- LiveKit JWT mint (`POST /api/voice/token`), including
  solo/round-table modes, tier-gated participant counts (free
  2, pro 4, enterprise 9), daily/per-session caps, per-employee
  voice resolution.
- The `VoiceRoom` client component: connect, mic/mute, session
  timer with warn threshold, mic + agent waveforms, transcript
  stream, multi-avatar layout, active-speaker highlighting,
  end button. Solo and round-table both implemented.
- Voice landing surface at `/app/voice`: hero (round-table),
  solo employee picker, today/cap usage cards, recent-sessions
  list.
- Per-employee voice picker at `/app/settings/voice`.
- Voice history list at `/app/settings/voice-history`.
- Session persistence: `conduit_voice_sessions` with
  `raw_transcript`, `transcript_summary`, `mode`, `participants`,
  `end_reason`, `duration_seconds`, timing columns.
- The memory layer: `conduit_memory` table, `parseMemoryWrites`,
  `renderMemoryBlock`, `trimMemoriesForPrompt`,
  `ATLAS_MEMORY_INSTRUCTIONS`, chat-route wiring at
  `src/app/api/conduit/chat/route.ts:597`.
- Worker-only memory write endpoint: `POST /api/voice/memory-write`
  (shared secret, forces `written_by='jarvis'`).
- Conversation ↔ voice-session linking via
  `conduit_conversations.voice_session_id` (migration 016).

### Out of scope for v1 (deferred)

- Modifications inside the `conduit-voice-worker` repository
  itself. Worker changes are dependencies, not deliverables,
  for this spec. The companion worker PR is tracked separately.
- Multi-tenant voice rooms (e.g., two human users in the same
  LiveKit room with an AI moderator).
- Voice transcripts as a first-class searchable artifact (full-
  text search, deep-link to specific turns, export). Voice
  history list + "continue" is the v1 affordance.
- Multi-language voice (locale routing exists in
  `voice_locale`; turning it into a user-driven setting is
  out of scope here).
- Voice-room analytics dashboards beyond the existing
  today/cap cards on `/app/voice`.
- Replacing OpenAI Realtime or ElevenLabs.
- Adding new employees beyond the canonical 9.
- "Take notes during the call" output artifacts (artifacts
  exist as a separate system; binding them to voice is
  out of scope).
- A push-to-talk mode (always-on mic via VAD is the v1
  interaction model).
