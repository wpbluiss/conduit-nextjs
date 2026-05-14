# Contract — `POST /api/voice/token` (extended)

**Feature**: Voice Room v1 completion
**Route**: `src/app/api/voice/token/route.ts`
**Plan**: [`../plan.md`](../plan.md)
**Date**: 2026-05-14

This is the **only** API surface change in this plan. The route already
exists; this contract documents the **delta** — three new request
fields (one optional, two echoed-only) and four new validation error
shapes.

## Existing baseline (unchanged)

Auth: bearer (Supabase session cookie via SSR client). Tier and daily-
cap gates already enforced. Existing body fields (`employee_id`,
`mode`, `participants`, `conversation_id`) and response fields
(`token`, `ws_url`, `room_name`, `employee_id`, `voice_id`,
`voice_locale`, `max_seconds`, `warn_seconds`, `daily_seconds_used`,
`daily_seconds_max`, `internal_account`, `mode`, `participants`,
`participant_voices`, `conversation_id`) remain.

## Delta — Request body

```ts
interface TokenBody {
  // existing
  employee_id?: string;
  mode?: "solo" | "roundtable";
  participants?: string[];
  conversation_id?: string;

  // NEW (Story 5 / FR-007 / FR-008 / FR-015)
  parent_session_id?: string;   // uuid of a prior conduit_voice_sessions row
}
```

**Field semantics**:

- `parent_session_id` (optional) — when present, signals that this new
  session continues a prior session. The route MUST validate
  ownership, recency, and summary-presence (see Validation below) and
  MUST propagate the validated id into the LiveKit room metadata so the
  worker can read it on join.

## Delta — Validation

The route MUST perform the following checks **after** the existing tier
and cap gates and **before** minting the LiveKit JWT. All checks
short-circuit with a JSON error response and no token issued.

| Check | Failure status | Failure body |
|---|---|---|
| `parent_session_id` is a valid uuid (regex / `crypto.randomUUID`-shape) | 400 | `{ "error": "parent_session_invalid", "message": "Bad parent_session_id." }` |
| The referenced row exists AND `account_id` equals the requester's `account.id` | 403 | `{ "error": "parent_session_forbidden" }` |
| The referenced row's `transcript_summary` is non-empty (`length > 0` after trim) | 400 | `{ "error": "parent_session_unavailable", "message": "That session has no summary to continue from." }` |
| The referenced row's `created_at` is within the last 14 days (`now() - interval '14 days'`) | 400 | `{ "error": "parent_session_too_old", "message": "Sessions older than 14 days can't be continued." }` |

All four error shapes are user-actionable: the voice-history "Continue"
button MUST be gated on the same predicates client-side (FR-007), so a
4xx from this route on a continuation request is a UI desync or a race
(e.g., 14-day boundary tick between page render and click) — surface
the message verbatim.

## Delta — Response body

```ts
interface TokenResponse {
  // existing (unchanged)
  token: string;
  ws_url: string;
  room_name: string;
  employee_id: string;
  voice_id: string | null;
  voice_locale: string;
  max_seconds: number;
  warn_seconds: number;
  daily_seconds_used: number;
  daily_seconds_max: number;
  internal_account: boolean;
  mode: "solo" | "roundtable";
  participants: string[];
  participant_voices: Record<string, { voice_id: string | null; voice_locale: string }>;
  conversation_id: string | null;

  // NEW (Story 5 — echoed for client display via ContinuationBadge)
  parent_session_id: string | null;
  parent_session_started_at: string | null;  // ISO 8601 — used by ContinuationBadge for relative time
}
```

When `parent_session_id` is absent or fails validation, both new
response fields are `null`. When validated, both are populated; the
client renders `ContinuationBadge` only when both are non-null.

## Delta — LiveKit room metadata (worker contract)

The route already serializes the `AccessToken.metadata` field with a
JSON object that the worker parses on participant join. This plan adds
one field; the rest is unchanged.

```ts
metadata: JSON.stringify({
  // existing
  account_id, employee_id, voice_id, voice_locale, max_seconds,
  warn_seconds, internal_account, mode, participants,
  participant_voices, conversation_id,

  // NEW
  parent_session_id,  // string | null
})
```

The worker reads `parent_session_id` and, when present, fetches the
prior session's `transcript_summary` + last 6 turn pairs via its
admin Supabase client (worker dependency W6) to bootstrap the new
agent's first turn context.

## Delta — LiveKit data event (`request_switch`)

**Direction**: client → worker (NEW, used by mid-session switch UI).

**Wire format** (serialized as `Uint8Array` JSON bytes, published via
`room.localParticipant.publishData(payload, { reliable: true })`):

```ts
interface RequestSwitchEvent {
  type: "request_switch";
  target_employee_id: string;  // canonical id from src/lib/conduit/employees.ts
}
```

**Worker response**: treat equivalent to a voice-command switch (D2).
Build context payload per D3 (summary + last 4 turn pairs verbatim).
Speak short audible acknowledgement (D4). Update `active_speaker` data
event the UI already consumes.

**Failure mode** (tier-locked target): worker emits a data event
`{ type: "switch_refused", target_employee_id: "<id>", reason: "tier_locked" }`
that VoiceRoom listens for and surfaces as a non-blocking toast. The
prior active employee continues without disruption (FR-003).

## Backwards compatibility

- Existing token-request bodies (no `parent_session_id`) → unchanged
  behavior; new response fields are `null`.
- Worker repos that have not yet shipped the metadata-parsing
  extension (W6) → `parent_session_id` is ignored and the agent starts
  with no prior-session context. The Next.js side does not error. The
  user-visible result is a "fresh" session without the
  Continuation context — UI still shows the badge if the response
  fields are populated; that's a mild UX issue surfaced as
  worker-not-ready, not a Next.js bug.

  **Mitigation**: the worker PR ships ~24–48h *before* this Next.js PR
  per D1 / plan Assumptions, so this skew window is operational only.
