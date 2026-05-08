-- R15.5 (Praxis 2026-05-08): Engineering execution depth.
--
-- Three additions:
--   1. 'aborted' status — user-initiated cancellation distinct from 'failed'
--      (which is reserved for unrecoverable worker errors).
--   2. parent_session_id — points at a prior session whose workspace files
--      should be cloned into this session's workspace so the user can
--      iterate on the same project ("Continue from previous build").
--   3. Daily usage / spend cap is enforced at the API layer by summing
--      tokens from rows in this table — no schema change needed for that.

-- 1. extend status enum
ALTER TABLE conduit_engineering_sessions
  DROP CONSTRAINT IF EXISTS conduit_engineering_sessions_status_check;
ALTER TABLE conduit_engineering_sessions
  ADD CONSTRAINT conduit_engineering_sessions_status_check
  CHECK (status IN ('pending','running','deploying','complete','failed','timeout','aborted'));

-- 2. parent_session_id for "continue from previous build"
ALTER TABLE conduit_engineering_sessions
  ADD COLUMN IF NOT EXISTS parent_session_id uuid
    REFERENCES conduit_engineering_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS conduit_engineering_sessions_parent_idx
  ON conduit_engineering_sessions(parent_session_id);

-- The (account_id, status) partial index from migration 018 still covers
-- the 'pending','running','deploying' query the abort UI uses. 'aborted'
-- is terminal and read-once — no new index needed.
