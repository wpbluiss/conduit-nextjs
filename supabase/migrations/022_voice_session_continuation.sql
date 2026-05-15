-- Voice Room v1 — Story 5 continuation + Story 1 telemetry discriminator.
-- Spec: specs/voice-room-for-ai-employees/spec.md (locked aa614dc)
-- Plan: specs/voice-room-for-ai-employees/plan.md (29ee205)
-- Tasks: T009 (this file) + T010 (apply via Supabase MCP).
--
-- Two deltas land here, both on the existing conduit_voice_sessions table:
--
--   1. ADD VALUE 'gate_open_fallback' to the conduit_voice_end_reason
--      enum (defined in 014_voice_voices.sql) so the worker (W2) can
--      mark sessions where the 5s POST_TEXT_DONE_FALLBACK_MS path fired.
--      SC-002 verification (quickstart.md Flow 5) queries on this value.
--      NOTE: spec/data-model.md described end_reason as a text column —
--      reality is the conduit_voice_end_reason ENUM. Spec correction
--      follow-up will land in a separate commit; this migration honors
--      the actual schema.
--
--   2. ADD COLUMN parent_session_id uuid to conduit_voice_sessions with
--      a self-FK and ON DELETE SET NULL. Powers Story 5 (resume prior
--      session). Worker (W6) reads this from LiveKit room metadata on
--      join.
--
-- RLS impact: none. The existing owner-scoped SELECT policy
-- (conduit_voice_sessions_owner_select, migration 014) gates by row via
-- account_id; writes remain service-role-only (worker). Adding a column
-- does not require a new policy.
--
-- Reversal (forward-only caveats applied):
--   -- Drop the new column + its partial index:
--   DROP INDEX IF EXISTS conduit_voice_sessions_parent_idx;
--   ALTER TABLE conduit_voice_sessions DROP COLUMN IF EXISTS parent_session_id;
--   -- Removing the enum value is NOT supported by PostgreSQL
--   -- (ALTER TYPE DROP VALUE does not exist). A true reversal would
--   -- require recreating the enum and rebuilding every dependent
--   -- column. This migration is therefore effectively forward-only for
--   -- the enum delta; treat the enum-value add as a one-way door.

ALTER TYPE conduit_voice_end_reason ADD VALUE IF NOT EXISTS 'gate_open_fallback';

ALTER TABLE conduit_voice_sessions
  ADD COLUMN IF NOT EXISTS parent_session_id uuid
    REFERENCES conduit_voice_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS conduit_voice_sessions_parent_idx
  ON conduit_voice_sessions(parent_session_id)
  WHERE parent_session_id IS NOT NULL;
