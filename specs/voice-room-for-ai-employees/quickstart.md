# Quickstart — Voice Room v1 completion

**Feature**: Voice Room v1 completion
**Plan**: [`plan.md`](./plan.md)
**Date**: 2026-05-14

Local-development walkthrough for the in-repo deliverables. **Worker
work is out of scope here** — assume `conduit-voice-worker` on Railway
is running the round-2 fix and the voice memory parse loop (plan
dependencies W1–W6).

## Prerequisites

- Local dev server runs against the production Supabase instance
  (`mvuslmfjkkuizixjpkgl`) — the repo does not use a separate dev DB.
  Voice tests touch real `conduit_voice_sessions` rows; use a test
  account.
- LiveKit credentials configured locally (`LIVEKIT_API_KEY`,
  `LIVEKIT_API_SECRET`, `LIVEKIT_URL`) — same as for any voice work.
- A working voice account (tier ≥ pro for the "Talk solo" entry into
  the new Team pill; tier == free is locked out of voice mode entirely
  per the existing `pickRoomParticipants` gate).
- The worker is live on Railway with the new contract (verify by
  joining any existing solo room and observing a long-form response
  lands in full — SC-001).

## Run

```bash
pnpm install          # only if dependency cache is cold
pnpm dev              # next dev on default port
# open http://localhost:3000/app/voice
```

## Flow 1 — Mid-session employee switch (Story 2)

1. Sign in (tier ≥ pro). Navigate to `/app/voice` → "Talk solo" →
   pick Atlas. A solo room opens.
2. Speak a question. Confirm Atlas responds.
3. Tap the new **"Team" pill** in the bottom toolbar (next to mute /
   end).
4. **Mobile (375/390px)**: bottom sheet slides up with allowed
   employees. Locked employees show a small lock icon.
5. **Desktop**: same picker renders as a popover anchored to the pill.
6. Tap **Sales**. The sheet dismisses. The active-speaker avatar
   transitions to Sales. The worker speaks one short acknowledgement
   ("Sales here — picking this up") and answers your next turn.
7. End the session. In Supabase (or via `/app/settings/voice-history`),
   inspect `conduit_voice_sessions.participants` — both `jarvis` and
   `sales` appear in first-spoke order.

**Negative case**: try tapping a locked employee. The pill MUST NOT
permit the switch; a small toast surfaces a tier-aware upgrade hint
and the prior active employee continues without disruption (FR-003).
The non-blocking worker data event `switch_refused` drives this toast.

## Flow 2 — Continue a prior session (Story 5)

1. Have a completed session ≤14 days old with a non-empty
   `transcript_summary` (the worker writes the summary at session
   end; verify in `conduit_voice_sessions`).
2. Navigate to `/app/settings/voice-history`. The eligible row shows
   a **Continue** button next to its existing metadata. Ineligible
   rows (older than 14 days OR empty `transcript_summary`) MUST NOT
   show the button.
3. Tap **Continue**. A new solo room opens. The header surfaces a
   `ContinuationBadge` — "Continuing your conversation from <relative
   time>".
4. The agent's first turn demonstrates awareness of the prior session
   (e.g., references the topic, asks a clarifying follow-up rather
   than greeting from scratch).
5. End the new session. Inspect `conduit_voice_sessions.parent_session_id`
   on the new row — it points at the prior session's id.

**Negative case**: open the dev console, manually POST to
`/api/voice/token` with a `parent_session_id` that is (a) not yours,
(b) older than 14 days, or (c) has an empty `transcript_summary`.
Confirm 403/400 with the documented error shapes in
[`contracts/voice-token-extension.md`](./contracts/voice-token-extension.md#delta--validation).

## Flow 3 — Voice memory (Story 3)

1. Start a solo room with Atlas.
2. State a durable fact ("I just decided to focus on Pro-tier customers
   for the next two quarters"). Atlas responds — *without speaking the
   `[REMEMBER]` tag*. The tag is emitted by Atlas at the end of his
   text deltas and stripped by the worker before TTS.
3. End the session. Inspect `conduit_memory` for a row with:
   - `account_id` = your account
   - `kind` = `decision` (or `goal` / `preference`, model's call)
   - `written_by` = `jarvis`
   - `tags` contains `voice_session:<session_id>`
4. Start a fresh chat or voice session. Confirm the memory appears in
   the system-prompt "WHAT YOU KNOW ABOUT THIS USER AND BUSINESS:"
   block by asking a question that should leverage it — Atlas or any
   other employee should act as if they already know.

## Flow 4 — Round-table addressee (Story 4)

1. Tier ≥ pro. Navigate to `/app/voice` → "Enter the room" (the
   round-table card). A round-table opens with Atlas + the tier's
   default specialist set.
2. Address a specific employee by display name: "Sales — what's the
   objection-handle here?"
3. Only Sales responds for that turn. Confirm the `active_speaker`
   highlight on the Sales avatar; Atlas + others stay silent.
4. Next turn without an addressee: routing returns to default (Atlas
   synthesizes or the worker picks).

**Negative case — locked employee**: address an employee not on your
tier. Atlas speaks one short sentence about unavailability with an
upgrade hint, then answers (FR-006 / D8).

**Negative case — not in room**: address an employee that's on your
tier but simply not in this round-table's participant set. Atlas
speaks one short sentence ("Sales isn't in this room — I can route
them in next session"), then answers.

## Flow 5 — Verify SC-002 (gate-open fallback rate)

After 24h of usage on the merged worker:

```sql
SELECT
  count(*) FILTER (WHERE end_reason = 'gate_open_fallback')::numeric
  / NULLIF(count(*), 0) AS fallback_rate
FROM conduit_voice_sessions
WHERE created_at > now() - interval '24 hours';
```

**Target**: < 0.05 (i.e., < 5% of sessions hit the fallback path —
i.e., the round-2 fix is doing its job in production).

## Mobile sweep checklist (Principle V)

Run each of Flows 1–4 at both 375px and 390px viewport widths. For
each:

- [ ] Team pill visible and tappable in solo mode (touch target ≥44px)
- [ ] Bottom sheet opens / dismisses cleanly
- [ ] Employee rows in sheet readable without horizontal scroll
- [ ] Lock icons render on tier-locked rows
- [ ] ContinuationBadge fits header without overflow
- [ ] Continue button on voice-history sits next to existing controls
      without cramping the touch envelope
- [ ] Active-speaker avatar still visible behind the sheet backdrop
- [ ] End-call button still reachable

## Build verification

```bash
pnpm build
```

Build MUST be green. Any Next.js 16 deprecation notices in the build
output MUST be addressed or filed as TODOs per Constitution
Principle I.

## Pre-merge grep (Principle III)

```bash
git diff main --name-only | xargs grep -EI 'Claude|Anthropic|OpenAI|ElevenLabs|LiveKit' 2>/dev/null
```

MUST return zero hits in user-visible string contexts. (Hits inside
non-user-visible places like a `// LiveKit transport` comment are
fine; hits in JSX text or visible strings are not.)
