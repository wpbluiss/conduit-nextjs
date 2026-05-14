# Clarifications — Voice Room v1 completion

**Spec**: `specs/voice-room-for-ai-employees/spec.md`

**Created**: 2026-05-14

**Status**: Resolved 2026-05-14 — all 12 defaults accepted per Luis; folded into `spec.md`

These questions are the ones that, if left unanswered, would force the
planning phase to assume — which Principle Zero forbids. Each entry
proposes a default so the fastest path is "defaults are fine"; flag any
you want to overturn and we'll lock the override into the spec before
planning begins.

The questions are grouped by the user story they unblock. Story 1 and
Story 2 are P1, so their clarifications are load-bearing for any "v1
shippable" claim; Stories 3–5 can theoretically slip if the answer to
Q1 forces a multi-PR rollout.

---

## Story 1 — Long responses land in full (P1)

### Q1. Worker round-2 fix — coordination, deploy order, and verification telemetry

**RESOLVED 2026-05-14** — accepted as default per Luis (worker PR first ~24–48h ahead; `end_reason='gate_open_fallback'` discriminator on existing text column). Folded into spec FR-009, Key Entities, Assumptions.

**Question**: How do we coordinate the `conduit-voice-worker` round-2
fix (`docs/atlas-voice-state-machine.md` §4) with this Next.js spec?
Specifically:

(a) Does the worker PR ship **before**, **after**, or **alongside** the
Next.js work in this spec — and does this spec's "ready to ship" gate
require the worker fix to be live first?

(b) What concretely proves the fix is live from the Next.js side?
The existing `conduit_voice_sessions.end_reason` is a free-text column;
do we tighten it to an enum that distinguishes natural completion from
fallback-gate-open, add a sibling boolean (e.g., `fallback_gate_used`),
or rely on worker logs only?

**Why it matters**: SC-001 and SC-002 are unverifiable without an
agreed signal. Without a Next.js-side verification surface, "v1
shippable" depends entirely on inspecting external worker logs, which
breaks Principle V's "verification lives in human + platform feedback
loops on every PR."

**Proposed default**:
- (a) Worker PR ships **first**, behind a feature flag if necessary;
  this Next.js spec adds the verification telemetry hook in the
  same round (worker PR ~24–48h ahead of the merged Next.js PR).
- (b) Add a discriminating value `gate_open_fallback` to
  `conduit_voice_sessions.end_reason` (keep as text — no enum
  migration needed). The worker sets it when the 5-second
  `POST_TEXT_DONE_FALLBACK_MS` path fires. SC-002 verification
  becomes a simple query.

**Alternatives**:
- (a) Lockstep: both PRs merge together via a brief recovery branch
  on the worker side. Riskier rollback.
- (b) New `bool fallback_gate_used` column. Cleaner schema; one more
  migration row.
- (b) No new column; rely on `total_output_ms` vs an expected range
  per response length. Brittle.

---

## Story 2 — Mid-session employee switch in solo mode (P1)

### Q2. Switch trigger — voice, UI, or both?

**RESOLVED 2026-05-14** — accepted as default per Luis (both: voice primary; "Team" pill → bottom-sheet picker on mobile, popover on desktop; pill hidden in round-table). Folded into spec Story 2 paragraph, FR-001.

**Question**: How does the user trigger a mid-session swap to a
different employee in solo mode?

(a) **Voice-only** — the user says "get me Sales" / "switch to
Engineering" / "bring in Marketing" and the worker routes the next
turn to the named employee.

(b) **UI-only** — an in-room avatar tray (or a "Switch employee"
button) lets the user tap to swap.

(c) **Both** — voice is the primary affordance, UI is a fallback
for noisy environments or mobile-mute scenarios.

**Why it matters**: this drives whether the UI work in
`VoiceRoom.tsx` is "add an avatar swap tray" or "no UI change, just
extend the worker's routing prompt." It also determines whether the
worker needs a new tag in the transcript stream that the UI listens
for to update its active-employee state.

**Proposed default**: **(c) both**. Voice is primary (matches the
"talk like a Zoom call" affordance), UI is the mobile fallback.
On 375/390px viewports the UI is a tap-to-expand tray at the
bottom edge so it doesn't crowd the active-speaker avatar.

**Alternatives**:
- (a) Voice-only — smaller surface area; risks confusion when the
  user's mic is muted or in a noisy room.
- (b) UI-only — explicit, but feels backwards in a voice-first room.

---

### Q3. Switch context handoff — what does the new employee see?

**RESOLVED 2026-05-14** — accepted as default per Luis (summary + last 4 user/agent turn pairs verbatim). Folded into spec FR-014.

**Question**: When the active employee switches from `jarvis` to
`sales` mid-call, what context does `sales` receive on their first
turn?

(a) **Running transcript only** (last N turns of user + Atlas).
(b) **Transcript summary** (worker-generated single-paragraph
synopsis up to the switch point).
(c) **Both**: a short summary + the last 2–4 turns verbatim.

**Why it matters**: option (a) blows the token budget on long
sessions; option (b) loses fine-grained context the user just
spoke; option (c) is the standard hand-off pattern in routed
chat already.

**Proposed default**: **(c)** — short worker-generated summary
of everything before the switch, plus the last 4 user/agent
turn pairs verbatim. Matches the chat handoff shape and bounds
the token cost.

**Alternatives**:
- (a) Verbatim-only — simple, expensive on long sessions.
- (b) Summary-only — cheap, may miss the just-said context.

---

### Q4. Switch UX — audible acknowledgement and per-session cap

**RESOLVED 2026-05-14** — accepted as default per Luis (audible acknowledgement one short sentence; no hard cap — context payload bounds prompt size). Folded into spec Story 2 paragraph, FR-001.

**Question**: Two sub-questions about the switch experience:

(a) When the active employee changes, does the new employee
**audibly acknowledge** the handoff ("Sales here, picking this up
on pricing")? Or do they just answer the next user turn directly
as the new voice?

(b) Do we **cap the number of switches** per session? Unlimited
allows ad-hoc round-tables-in-disguise; capping (e.g., 5 switches
per session) keeps the prompt context bounded and the UX legible.

**Why it matters**: (a) is a small UX question with big perceived-
intelligence impact. (b) is a guardrail on prompt growth and on
"voice room as cosplay round-table" — the round-table mode already
exists for that use case.

**Proposed default**:
- (a) **Audible acknowledgement** — one short sentence ("Sales
  here — let me take this one"). Worker-side prompt change only.
- (b) **No hard cap**, but the handoff context (Q3) only carries
  the most recent transition's summary + last turns, so the
  effective prompt size stays bounded regardless of switch count.

**Alternatives**:
- (a) Silent swap — feels more natural in fast conversation but
  can confuse the user about who they're talking to.
- (b) Hard cap of 3–5 switches per session, after which the user
  is asked to start a round-table or a new session.

---

## Story 3 — Memory writes from voice transcripts (P2)

### Q5. Memory write pattern — Atlas-emits-tags vs. worker-summarizes

**RESOLVED 2026-05-14** — accepted as default per Luis (Atlas-emits-tags in transcript, chat parity; worker uses existing `parseMemoryWrites` parser, strips tags before TTS). Folded into spec FR-005.

**Question**: Which path produces memory writes from voice sessions?

(a) **Atlas-emits-tags in transcript (chat parity)**: Atlas speaks
his answer in voice; the worker scans his text deltas for
`[REMEMBER: …]` / `[SUPERSEDE: …]` tags using the same parser as
chat (`src/lib/ai/memory.ts`), strips them before TTS so the user
never hears them, and posts each to `/api/voice/memory-write`
in real-time.

(b) **Worker summarizes at session end**: at session end, the
worker runs a separate "extract durable facts" pass over the
`raw_transcript` and posts the resulting memory rows. Atlas
himself never emits tags in voice.

**Why it matters**: (a) is structural parity with chat — same
parser, same emit rule, same "good moment" judgment that R10
already codifies in `ATLAS_MEMORY_INSTRUCTIONS`. (b) is simpler
on the speaking-path but doubles the prompt surface (one for
talking, one for end-of-session summarization).

**Proposed default**: **(a) Atlas-emits-tags in transcript**.
Reuses the chat memory invariant verbatim and means voice and
chat both produce identical `conduit_memory` row shapes. The
worker's only new responsibility is to (i) include
`ATLAS_MEMORY_INSTRUCTIONS` in Atlas's voice system prompt and
(ii) strip the tags from text before passing to ElevenLabs.

**Alternatives**:
- (b) End-of-session extraction — easier first pass but creates
  a second memory-write code path that can drift from the chat
  one.

---

### Q6. Voice memory cap — shared with chat, or separate?

**RESOLVED 2026-05-14** — accepted as default per Luis (shared cap; voice rows count against the same `conduit_pricing_tiers.memory_cap`). Folded into spec FR-013.

**Question**: The `conduit_pricing_tiers.memory_cap` column
(free 25, pro 200, enterprise 1000) governs total memory rows.
Does voice share that cap, or does voice get its own cap?

**Why it matters**: a 60-minute voice session could plausibly
produce 5–10 memory rows on a content-rich call. A free-tier
user hitting the 25-row cap from one long voice session feels
abrupt.

**Proposed default**: **Shared cap**. Voice rows count against
the same total. The cap is a durability budget, not a per-
channel budget, and splitting it would mean tracking
provenance in the count query.

**Alternatives**:
- Separate cap (e.g., +50% on top of `memory_cap` for voice).
- No cap on voice; rely on rate-limiting at the worker
  endpoint.

---

## Story 4 — Explicit addressee in round-table (P2)

### Q7. Addressee syntax — natural language, explicit tag, or UI

**RESOLVED 2026-05-14** — accepted as default per Luis (natural-language addressee only for v1; UI tap is a v1.x deferral). Folded into spec FR-006.

**Question**: How does the user signal "I want only Sales to
answer this" in a round-table?

(a) **Natural-language addressee**: the user prefixes a turn
with the employee's display name ("Sales, what's the
objection-handle here?"). Worker-side intent detection picks
this up.

(b) **Explicit verbal tag**: the user says a specific keyword
("at-Sales", "Sales-only") that the worker parses as an
addressee directive.

(c) **UI tap**: the user taps a specific avatar in the multi-
avatar layout to lock the next turn to them, then taps again
to release.

**Why it matters**: voice is voice. `@sales` won't pronounce
naturally. Natural language is the most ergonomic and matches
how a real conference call works.

**Proposed default**: **(a) natural-language addressee**.
The worker's existing routing already does some of this
implicitly; FR-006 makes it explicit and 100%-of-the-time when
the named employee is present.

**Alternatives**:
- (b) Verbal tag — unnatural; would require teaching the user.
- (c) UI tap — useful as a fallback on mobile/noisy
  environments, but a v1.x extension, not v1 default.

---

### Q8. Addressee unavailable — silent fallback or audible message

**RESOLVED 2026-05-14** — accepted as default per Luis (audible one-sentence message from Atlas with tier-aware upgrade hint when locked; transcript records unavailability). Folded into spec FR-006, Story 4 acceptance #2.

**Question**: What happens when the addressed employee is not
in the room (not on user's tier, or not part of the round-
table participant set)?

(a) **Silent fallback**: Atlas (or the worker's default routing)
answers; the unavailability is visible only as a transcript
note in the data stream.

(b) **Audible message**: Atlas says one short line ("Sales
isn't on your plan — I'll take this; want to upgrade?" / "Sales
isn't in this room — I can route them in next session"), then
answers.

**Why it matters**: silent fallback is cheaper but can confuse
the user who explicitly asked for X and got Y. Audible message
is more honest but risks feeling preachy.

**Proposed default**: **(b) audible message — one short
sentence**, then Atlas continues with the answer. The
"upgrade" hint is tier-aware and shown only when the addressed
employee is locked by tier (not when they're simply not in
this particular round-table).

**Alternatives**:
- (a) Silent fallback — let the transcript note do the work;
  trust the user to look. Risky in voice-only UX.

---

## Story 5 — Resume a prior voice session (P3)

### Q9. Resume scope — most-recent only or any prior session

**RESOLVED 2026-05-14** — accepted as default per Luis (any session within last 14 days with non-empty `transcript_summary`). Folded into spec Story 5 paragraph, FR-007.

**Question**: Can the user "continue" any prior session shown
in `/app/settings/voice-history`, or only their most recent
one?

**Why it matters**: continuing from a stale session (days
old) may surface state the user has long since moved past;
continuing only from the most recent reduces the surface and
makes the affordance unambiguous.

**Proposed default**: **Any prior session within the last
14 days** with a non-empty `transcript_summary`. Older than
14 days hides the affordance — recall is what memory is for,
not transcript replay.

**Alternatives**:
- Most-recent only — minimal surface; matches the "pick up
  where you left off" mental model exactly.
- Any in voice history — broadest, can produce stale-context
  confusion.

---

### Q10. Resume context payload — summary, raw transcript, or both

**RESOLVED 2026-05-14** — accepted as default per Luis (summary + last 6 user/agent turn pairs verbatim; mirrors Q3 switch handoff shape). Folded into spec FR-015.

**Question**: When a session is continued, what does the
worker receive as its bootstrap context for the new room?

(a) **`transcript_summary` only** — small, fits in any prompt
budget, may miss specifics.
(b) **`raw_transcript` (full)** — comprehensive but token-
heavy on long prior sessions; expensive on every continuation.
(c) **Summary + last K turns verbatim** — the chat handoff
shape, applied to resume.

**Why it matters**: option (b) on a 30-minute session is many
thousands of tokens of prompt; option (a) loses fidelity on
the last few exchanges.

**Proposed default**: **(c) summary + last 6 turn pairs of
raw transcript**. Mirrors Q3's solo-switch handoff shape so we
have one mental model, not two.

**Alternatives**:
- (a) Summary only — cheapest; loses the fine-grained tail.
- (b) Full transcript — most context; least scalable.

---

### Q11. Resume schema — column on `conduit_voice_sessions` or join table

**RESOLVED 2026-05-14** — accepted as default per Luis (`parent_session_id uuid` column, FK to same table, `ON DELETE SET NULL`, RLS in creating migration). Folded into spec FR-008, Key Entities.

**Question**: How is "session B continues session A" recorded
in the schema?

(a) **`parent_session_id uuid` column** on
`conduit_voice_sessions` referencing the prior session.

(b) **`conduit_voice_session_chains` join table** with
`session_id`, `parent_session_id`, `chain_root_id`, supporting
multi-hop chains and easier root-finding queries.

**Why it matters**: (a) is the simple default and matches the
existing pattern (`conduit_conversations.voice_session_id`).
(b) is over-built for v1 but might pay off if "resume a
resume" becomes a common flow.

**Proposed default**: **(a) `parent_session_id uuid` column
on `conduit_voice_sessions`**, FK to the same table with
ON DELETE SET NULL. RLS enabled in the migration (Principle
II). Multi-hop chains are followed by recursive query if/when
needed.

**Alternatives**:
- (b) Join table — more flexible, more YAGNI.

---

## Cross-cutting

### Q12. Mobile UX for the new switch affordance (Story 2)

**RESOLVED 2026-05-14** — accepted as default per Luis (bottom sheet triggered by "Team" pill in bottom toolbar; hidden in round-table mode). Folded into spec FR-001.

**Question**: The solo-mode switch affordance (Q2 default:
voice + UI fallback) needs a mobile shape on 375/390px
viewports per Principle V. Which?

(a) **Bottom sheet** — tapping a small "Team" pill at the
bottom edge slides up a sheet showing all allowed employees;
tap to swap.

(b) **Avatar carousel** — a horizontal scroll of employee
avatars permanently visible above the mic controls; tap to
swap.

(c) **Long-press the current avatar** — invisible affordance,
no extra chrome, discoverable via tooltip on first use.

**Why it matters**: mobile is load-bearing per Constitution
Principle V. The chrome budget on 375px is tight; the user's
existing demo flows can't sacrifice the active-speaker avatar
or the waveform area.

**Proposed default**: **(a) bottom sheet, triggered by a
"Team" pill in the bottom toolbar next to the mute and end
buttons**. The pill is hidden in round-table mode (where the
UI already shows the full participant set).

**Alternatives**:
- (b) Carousel — always visible; eats vertical space on a
  device where it's already scarce.
- (c) Long-press — clean but undiscoverable.

---

## Open question count

**12** questions. All have proposed defaults; the fastest path
is to confirm "defaults are fine" or flag overrides 1–12.

Once answered, the spec is updated in-place to lock the
decisions, and `/speckit-plan` can run against a complete spec
with the seven Constitution Check gates surfaced explicitly.
