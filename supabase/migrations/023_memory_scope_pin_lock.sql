-- R17 Slice 1: per-department memory scope + pin/lock affordances.
-- Backward-compatible: every existing row defaults to pinned=false,
-- locked=false, and ZERO rows in conduit_memory_scope (= global, current
-- behavior). Existing Settings memory UI continues to function unchanged
-- until the chat-route loader is extended in the same slice.
--
-- Applied to remote: 2026-05-23 via Supabase MCP apply_migration.

-- Pinned / locked columns on conduit_memory
ALTER TABLE conduit_memory
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT false;

-- Index for the prompt-trim hot path (pinned rows first, then recency)
CREATE INDEX IF NOT EXISTS conduit_memory_pinned_idx
  ON conduit_memory(account_id, pinned DESC, created_at DESC)
  WHERE archived_at IS NULL;

-- Per-department scope join table.
-- Zero rows for a memory = global (visible to all employees).
-- 1+ rows = scoped to those employees only.
CREATE TABLE IF NOT EXISTS conduit_memory_scope (
  memory_id uuid NOT NULL REFERENCES conduit_memory(id) ON DELETE CASCADE,
  employee_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (memory_id, employee_id),
  CONSTRAINT conduit_memory_scope_employee_id_check
    CHECK (employee_id IN (
      'jarvis', 'marketing', 'sales', 'engineering',
      'finance', 'compliance', 'hr', 'ops', 'legal'
    ))
);

CREATE INDEX IF NOT EXISTS conduit_memory_scope_memory_idx
  ON conduit_memory_scope(memory_id);
CREATE INDEX IF NOT EXISTS conduit_memory_scope_employee_idx
  ON conduit_memory_scope(employee_id, memory_id);

ALTER TABLE conduit_memory_scope ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners_full_access" ON conduit_memory_scope;
CREATE POLICY "owners_full_access" ON conduit_memory_scope
  FOR ALL USING (
    memory_id IN (
      SELECT m.id FROM conduit_memory m
      JOIN conduit_accounts a ON a.id = m.account_id
      WHERE a.owner_user_id = auth.uid()
    )
  );
