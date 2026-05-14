# Phase 0 — Research

**Feature**: Voice Room v1 completion
**Plan**: [`plan.md`](./plan.md)
**Date**: 2026-05-14

Every NEEDS CLARIFICATION raised during Phase 0 has already been resolved
in [`clarify.md`](./clarify.md) (12 questions, all defaults accepted by
Luis on 2026-05-14). This document captures the **rationale traces** for
the load-bearing decisions and the **best-practices research** for the
in-repo work, in the standard Decision / Rationale / Alternatives form.
It also documents the small number of new investigations triggered by
the plan itself (not by the spec).

## Decisions inherited from clarify.md (resolved 2026-05-14)

### D1. Worker PR ships first; `gate_open_fallback` end_reason discriminator

**Decision**: Worker PR with the Atlas state-machine round-2 fix
(`docs/atlas-voice-state-machine.md` §4) merges and deploys to Railway
~24–48h before this Next.js plan's PR opens. Worker writes
`end_reason = 'gate_open_fallback'` into `conduit_voice_sessions`
whenever the 5-second `POST_TEXT_DONE_FALLBACK_MS` path fires. SC-002
verification = "fraction of sessions in a window where `end_reason =
'gate_open_fallback'` is < 5%."

**Rationale**: SC-001/SC-002 are unverifiable from this repo without an
in-DB signal. Using the existing `end_reason` text column avoids a
migration just for telemetry. Worker-first ordering means in-repo
verification (a single query) is the *only* gate we need to flip green;
no inter-repo race conditions during rollout.

**Alternatives**:
- Lockstep merge — riskier rollback; coordination cost across two repos.
- New `bool fallback_gate_used` column — cleaner type but adds a
  migration row solely for telemetry.
- Worker logs only — fails Constitution Principle V (verification lives
  in human + platform feedback loops accessible from this repo).

### D2. Switch trigger — voice command + Team-pill bottom sheet

**Decision**: Two-trigger model. (a) Voice command picked up by the
worker ("get me Sales", "switch to Engineering"); (b) a "Team" pill in
the solo-mode bottom toolbar opens a bottom-sheet picker on mobile
(375/390px) and a popover on desktop. The pill is hidden in round-table
mode (the multi-avatar layout is already on screen). UI publishes a
LiveKit data event `{ type: "request_switch", target_employee_id: "<id>" }`
when the user taps a sheet entry; worker treats this equivalently to the
voice command path.

**Rationale**: Voice-first matches the room metaphor; UI fallback covers
muted mic, noisy environments, and the mobile demo path. The data event
gives the worker one router input regardless of trigger origin.

**Alternatives**:
- Voice-only — failure modes (mic muted / noisy env) leave the user
  stuck.
- UI-only — feels backwards in a voice-first room.

### D3. Switch context handoff — summary + last 4 turn pairs

**Decision**: Worker constructs the new employee's first system prompt
with (a) a short generated summary of the session up to the switch
point, plus (b) the last 4 user/agent turn pairs verbatim.

**Rationale**: Mirrors the chat-handoff shape that exists today in the
text-chat route. Bounds the prompt size regardless of how many switches
happen in a session (no hard cap on switch count required per D4).

**Alternatives**:
- Full transcript — token-expensive on long sessions.
- Summary only — loses the just-said context the user cares most about.

### D4. Audible switch acknowledgement, no hard cap on switches

**Decision**: New employee speaks one short acknowledgement sentence on
arrival ("Sales here — picking this up") before answering. No hard cap
on switches per session.

**Rationale**: Acknowledgement avoids "wait, who am I talking to?"
confusion. No cap is safe because D3 bounds the effective prompt size.

**Alternatives**:
- Silent swap — feels jarring in voice.
- Hard cap (5/session) — arbitrary, can be revisited if the no-cap
  default produces a misuse pattern.

### D5. Memory writes — Atlas-emits-tags parity with chat

**Decision**: Atlas (`jarvis`) emits `[REMEMBER: …]` / `[SUPERSEDE: …]`
tags inside his text deltas while speaking. Worker scans deltas using
the same parser shape as `src/lib/ai/memory.ts:parseMemoryWrites`,
strips the tags from text before passing to TTS, and posts each parsed
row to `POST /api/voice/memory-write` with the tag
`voice_session:<session_id>` appended.

**Rationale**: One memory-write code path (Atlas-emits-tags) for both
voice and chat. The chat route at
`src/app/api/conduit/chat/route.ts:597` already uses this pattern. Worker
gets `ATLAS_MEMORY_INSTRUCTIONS` added to Atlas's voice system prompt;
nothing else changes.

**Alternatives**:
- End-of-session worker summarization — second code path; can drift
  from chat behavior.

### D6. Shared memory cap with chat

**Decision**: Voice-sourced rows count against the same
`conduit_pricing_tiers.memory_cap` as chat-sourced rows (free 25, pro
200, enterprise 1000).

**Rationale**: The cap is a durability budget, not a per-channel
budget. Splitting it would require provenance-aware counts in the cap
check.

**Alternatives**:
- Voice-specific cap or +50% headroom — adds complexity for marginal
  gain.

### D7. Natural-language addressee routing only

**Decision**: Round-table routing detects a natural-language addressee
when the user prefixes a turn with an employee's display name ("Sales,
…", "Marketing, …"). No explicit verbal tag syntax. No UI tap-to-direct
in v1.

**Rationale**: Voice is voice; an `@sales` syntax doesn't pronounce
naturally. The worker's existing routing already does some of this
implicitly; FR-006 just makes it 100% deterministic when the named
employee is present.

**Alternatives**:
- Verbal tag — unnatural; teaching burden.
- UI tap — useful but a v1.x extension.

### D8. Unavailable-addressee → audible one-sentence Atlas message

**Decision**: When the addressed employee is not in the room (locked by
tier or not in this round-table's participant set), Atlas speaks one
short sentence indicating unavailability, with a tier-aware upgrade hint
when the cause is tier-locking. Atlas then answers the question.

**Rationale**: Voice UX is conversation; a silent fallback breaks
expectations. The upgrade hint is value-aligned and only fires on the
tier-lock cause.

**Alternatives**:
- Silent fallback — risky in voice-only UX.

### D9. Resume scope — last 14 days, non-empty `transcript_summary`

**Decision**: Voice history exposes "Continue" only for sessions ≤14
days old with a non-empty `transcript_summary`.

**Rationale**: Beyond 14 days, recall belongs to `conduit_memory`
(durable facts), not transcript replay. The non-empty summary guard
prevents broken-button UX.

**Alternatives**:
- Most-recent only — too narrow; loses Wednesday-resume-Friday flow.
- Any from voice history — too broad; stale context confusion.

### D10. Resume context payload — summary + last 6 turn pairs

**Decision**: On continuation, worker bootstraps with the prior
session's `transcript_summary` + last 6 user/agent turn pairs verbatim.

**Rationale**: Mirrors D3's switch-handoff shape; one mental model
across both flows.

**Alternatives**:
- Summary only — loses recent specifics.
- Full transcript — token-expensive.

### D11. Resume schema — `parent_session_id uuid` column

**Decision**: Add `parent_session_id uuid` to `conduit_voice_sessions`,
FK to same table, `ON DELETE SET NULL`. RLS already enabled on the
table; existing owner-scoped policy covers the new column.

**Rationale**: Simple FK matches the existing
`conduit_conversations.voice_session_id` pattern. Recursive query
handles multi-hop chains if they ever appear.

**Alternatives**:
- Join table `conduit_voice_session_chains` — over-built for v1.

### D12. Mobile UX — bottom sheet via Team pill

**Decision**: Solo-mode UI gains a "Team" pill in the bottom toolbar
(next to mute and end). Tap opens a bottom sheet on mobile, popover on
desktop. Pill is hidden in round-table mode (participants already on
screen). Touch targets ≥44px per Principle V.

**Rationale**: Chrome budget on 375px is tight; a bottom sheet costs
zero chrome until activated. Hiding in round-table avoids redundant UI.

**Alternatives**:
- Avatar carousel — always visible; eats vertical space.
- Long-press the current avatar — undiscoverable.

## Plan-time research (new investigations)

### R1. Next.js 16 Route Handler caching for the extended `/api/voice/token`

**Investigation**: confirm that adding a body field to an existing POST
Route Handler does not change its caching semantics.

**Source**: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
("Route Handlers are not cached by default. You can, however, opt into
caching for `GET` methods. Other supported HTTP methods are **not**
cached.").

**Conclusion**: POST handlers are uncached. The existing route exports
`runtime = "nodejs"` (correct per
`01-app/03-api-reference/03-file-conventions/02-route-segment-config/runtime.md`).
No cache invalidation work needed. The extension is body-only.

### R2. Server vs Client component boundary for the new UI pieces

**Investigation**: which of the new files need `"use client"`?

**Source**: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
("Use Client Components when you need: State and event handlers, …
useEffect, … Browser-only APIs.").

**Conclusion**:
- `TeamSwitchSheet.tsx` — `"use client"` (state for sheet open/closed,
  `onClick` event handlers, optional `useEffect` for backdrop dismiss).
- `ContinuationBadge.tsx` — `"use client"` if it uses `useEffect` for
  relative-time refresh; otherwise can be a server component that
  receives a pre-computed string prop. Plan-default: client component
  for refresh consistency.
- `VoiceRoom.tsx` — already `"use client"` (LiveKit client SDK).
- `src/app/app/settings/voice-history/page.tsx` — stays server
  component; receives data from Supabase server client; renders a
  small client child for the Continue button onClick (or uses a server
  action / form submission — but for v1 the simplest is a client
  button that POSTs to `/api/voice/token` like the existing voice
  entry flows do).

### R3. LiveKit data-event wire format for `request_switch`

**Investigation**: VoiceRoom currently consumes data events
(`onData` handler on lines 183–215 of `VoiceRoom.tsx`) and parses
`{ type: "transcript" | "active_speaker", … }`. The plan adds an
outbound publish path: `room.localParticipant.publishData(...)` with
`{ type: "request_switch", target_employee_id: "<id>" }` serialized as
JSON bytes.

**Source**: `livekit-client@2.18.9` (existing dep) —
`LocalParticipant.publishData(payload: Uint8Array, options?: { reliable?: boolean })`.

**Conclusion**: send with `reliable: true` so the worker doesn't miss
a switch request under transient packet loss. Wire format mirrors the
worker's existing inbound event shape (small JSON object with a `type`
discriminator).

### R4. Supabase RLS coverage for `parent_session_id`

**Investigation**: does the existing
`conduit_voice_sessions` owner-scoped RLS policy cover the new column,
or does the migration need additional policy work?

**Source**: `supabase/migrations/006_voice.sql` and the
`conduit_voice_sessions` policy chain through migrations 006 → 011 →
014 → 015 → 016.

**Conclusion**: existing policies are `FOR ALL USING (account_id IN
(SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()))`
shape; they gate by row, not by column. Adding a new column does not
require a new policy. The migration adds the column and the FK index
only.

## Open follow-ups

None blocking. The `SESSION_HANDOFF_2026-05-XX_VOICE_ROOM_V1.md`
referenced in the plan's worker-dependencies section captures the
worker-PR SHA + deploy timestamp at handoff time.
