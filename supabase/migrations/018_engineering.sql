-- R15: Engineering execution v2 — real Claude Code subprocess running in a
-- sandboxed Docker container on Railway. Replaces the R7 templates path for
-- internal_account; R7 (conduit_builds + conduit_build_events) is preserved
-- and continues to serve every other code path.
--
-- conduit_engineering_sessions  : one row per build (prompt, status, deploy_url,
--                                 token totals, conversation linkage).
-- conduit_engineering_logs      : streaming log events from the worker (claude
--                                 stdout/stderr + system messages). Realtime
--                                 publication on this table powers the live
--                                 BuildSession overlay in /app/team/engineering.

CREATE TABLE conduit_engineering_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conduit_conversations(id) ON DELETE SET NULL,
  prompt text NOT NULL,
  build_type text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','deploying','complete','failed','timeout')),
  worker_session_id text,
  github_repo text,
  deploy_url text,
  total_input_tokens int NOT NULL DEFAULT 0,
  total_output_tokens int NOT NULL DEFAULT 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON conduit_engineering_sessions (account_id, created_at DESC);
CREATE INDEX ON conduit_engineering_sessions (status) WHERE status IN ('pending','running','deploying');
ALTER TABLE conduit_engineering_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_full_access" ON conduit_engineering_sessions
  FOR ALL
  USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));

CREATE TABLE conduit_engineering_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES conduit_engineering_sessions(id) ON DELETE CASCADE,
  ts timestamptz NOT NULL DEFAULT now(),
  level text NOT NULL CHECK (level IN ('info','stdout','stderr','system')),
  message text NOT NULL
);
CREATE INDEX ON conduit_engineering_logs (session_id, ts);
ALTER TABLE conduit_engineering_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_read" ON conduit_engineering_logs
  FOR SELECT
  USING (session_id IN (
    SELECT s.id FROM conduit_engineering_sessions s
    JOIN conduit_accounts a ON a.id = s.account_id
    WHERE a.owner_user_id = auth.uid()
  ));

-- Hook into the existing conversation graph so a chat that triggered a build
-- can deeplink to its session. nullable because most builds are kicked off
-- from the workspace button, not from a chat.
ALTER TABLE conduit_conversations
  ADD COLUMN IF NOT EXISTS engineering_session_id uuid
    REFERENCES conduit_engineering_sessions(id) ON DELETE SET NULL;

-- Realtime: subscribers on the Praxis frontend will use postgres_changes
-- (INSERT) on conduit_engineering_logs to render the streaming terminal panel.
ALTER PUBLICATION supabase_realtime ADD TABLE conduit_engineering_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE conduit_engineering_sessions;
