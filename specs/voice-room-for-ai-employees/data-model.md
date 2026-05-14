# Phase 1 — Data Model

**Feature**: Voice Room v1 completion
**Plan**: [`plan.md`](./plan.md)
**Date**: 2026-05-14

This document captures the schema delta introduced by this plan and the
tagging conventions that the worker must follow when writing to existing
tables. **No new tables are introduced.** One column is added; one
free-text column gains a reserved value.

## Schema delta — `conduit_voice_sessions`

### Added column: `parent_session_id uuid` (Story 5 / FR-008)

**Purpose**: when a user "continues" a prior voice session via the new
voice-history affordance (FR-007), the new session row's
`parent_session_id` points to the prior session's `id`. Enables
follow-the-chain queries and is the FK target for the worker's
continuation context payload (FR-015).

**Definition** (full DDL ships in
`supabase/migrations/022_voice_session_continuation.sql`):

```sql
ALTER TABLE conduit_voice_sessions
  ADD COLUMN parent_session_id uuid
    REFERENCES conduit_voice_sessions(id)
    ON DELETE SET NULL;

CREATE INDEX conduit_voice_sessions_parent_idx
  ON conduit_voice_sessions(parent_session_id)
  WHERE parent_session_id IS NOT NULL;
```

**Constraints**:
- `NULL` for sessions that did not originate via "Continue."
- `ON DELETE SET NULL` — if a parent is deleted (data retention policy
  or manual cleanup), the chain breaks but the child survives.
- The partial index (`WHERE parent_session_id IS NOT NULL`) keeps the
  index small since most rows will be `NULL`.

**RLS impact**: none. Existing
`conduit_voice_sessions` policies gate by row (owner-scoped via
`account_id IN (SELECT … WHERE owner_user_id = auth.uid())`), not by
column. Adding a column does not require a new policy. Migration 022
does not include `ENABLE ROW LEVEL SECURITY` because RLS is already
enabled from the table's creating migration (006 chain).

### Reserved value: `end_reason = 'gate_open_fallback'` (Story 1 / FR-009)

**Purpose**: the worker writes this value to the existing free-text
`end_reason` column whenever the 5-second
`POST_TEXT_DONE_FALLBACK_MS` path fires (worker dependency W2). Used by
SC-002 verification:

```sql
SELECT
  count(*) FILTER (WHERE end_reason = 'gate_open_fallback')::numeric
  / NULLIF(count(*), 0) AS fallback_rate
FROM conduit_voice_sessions
WHERE created_at > now() - interval '24 hours';
-- target: < 0.05 (5%)
```

**No schema change**: column is already `text`. The value is
semantically reserved by this plan and the worker is the only writer.

### Other `conduit_voice_sessions` columns (referenced, unchanged)

| Column | Type | Used by this plan |
|---|---|---|
| `id` | `uuid` | FK target for `parent_session_id` |
| `account_id` | `uuid` | owner scope (RLS) |
| `employee_id` | `text` | display + active-speaker init |
| `mode` | `conduit_voice_session_mode` (enum: solo/roundtable) | gates Team-pill visibility (`solo` only) |
| `participants` | `jsonb` | extended by the worker to record every speaker after mid-session switches |
| `transcript_summary` | `text` | source of continuation context (FR-015) + gate for "Continue" affordance (FR-007) |
| `raw_transcript` | `text` | tail-of-6 source for continuation payload (FR-015) |
| `end_reason` | `text` | gains `'gate_open_fallback'` reserved value (above) |
| `created_at` / `started_at` / `ended_at` | `timestamptz` | 14-day window for "Continue" gate (FR-007); session ordering |
| `duration_seconds` | `int` | usage cards on `/app/voice` (unchanged) |
| `total_input_ms`, `total_output_ms` | `int` | worker telemetry (unchanged) |

## Tagging convention — `conduit_memory`

**Purpose**: Story 3 / FR-005. Voice-sourced memory rows distinguish
themselves from chat-sourced rows only by the `voice_session:<id>`
prefix tag.

**Convention** (enforced by the worker; the Next.js endpoint
`POST /api/voice/memory-write` appends the prefix to any tags passed):

```text
conduit_memory.tags = [
  ...user-provided tags (worker-supplied via [REMEMBER: kind | content | tag1, tag2]),
  "voice_session:<source_voice_session_id>"
]
```

The endpoint at `src/app/api/voice/memory-write/route.ts:54` already
appends this prefix when `source_session_id` is in the request body —
no Next.js code change required for this convention.

**Shape preserved**: `written_by` is forced to `'jarvis'` regardless of
which employee hosted the voice session (the R10 invariant — Atlas is
the only writer). `account_id`, `kind` (∈ fact/preference/decision/
goal/context), `content`, `tags` are unchanged from the chat-route
memory shape.

## Entity relationships

```text
conduit_accounts ─┬─< conduit_voice_sessions ─┐
                  │                            │
                  │           ▲                │
                  │           │ parent_session_id (new — same-table FK)
                  │           │
                  └─< conduit_memory
                       (tags include voice_session:<id> for voice-sourced rows)
```

- One account → many voice sessions (existing).
- One voice session → zero-or-one parent voice session (NEW; self-FK).
- One account → many memory rows (existing); voice-sourced rows
  trace back to their session by the `voice_session:<id>` tag.

## Validation rules

These are enforced at the API layer (the extended
`POST /api/voice/token`) before the worker is involved:

| Rule | Where | Failure mode |
|---|---|---|
| `parent_session_id` MUST belong to the same `account_id` as the requester | `POST /api/voice/token` (Next.js) | 403 `parent_session_forbidden` |
| `parent_session_id` MUST point to a row whose `transcript_summary` is non-empty | `POST /api/voice/token` (Next.js) | 400 `parent_session_unavailable` |
| `parent_session_id` MUST point to a row whose `created_at` is within the last 14 days | `POST /api/voice/token` (Next.js) | 400 `parent_session_too_old` |
| `parent_session_id` (if absent) is `null` in LiveKit room metadata | `POST /api/voice/token` (Next.js) | n/a (default) |

## Migration ordering

Migration `022_voice_session_continuation.sql` is a single-statement
ALTER + a single-statement CREATE INDEX. Safe to run in production with
no read/write quiesce. Forward-numbered after 021_theme_pref.sql per
Principle II. No data backfill required (`parent_session_id` defaults
to `NULL`).
