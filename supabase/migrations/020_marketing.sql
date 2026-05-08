-- R16 Phase 3.1 (Praxis 2026-05-08): Marketing execution sessions.
--
-- Sibling to conduit_engineering_sessions (migration 018) — same
-- shape, different columns: marketing produces a bundle of asset
-- URLs (image/video/audio) instead of a single deploy_url, and
-- tracks dollar cost cumulatively because per-provider billing
-- is heterogeneous.
--
-- Migration number is 020 because R15.5 took 019 (engineering v2);
-- the brief mentioned "019_marketing" but the earlier engineering
-- patch shipped first this round. Functionally equivalent.

CREATE TABLE conduit_marketing_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conduit_conversations(id) ON DELETE SET NULL,
  prompt text NOT NULL,
  -- Light brand context the worker forwards to the creative director.
  -- Stays nullable since most v1 invocations will infer brand from
  -- the account context.
  brand jsonb,
  -- Optional ref image URL for character / product consistency.
  reference_image_url text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','generating','editing','complete','failed','aborted')),
  -- Array of { kind, url, caption } produced as the worker walks
  -- the asset plan. Live-updated; UI subscribes via realtime.
  output_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_cost_cents integer NOT NULL DEFAULT 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON conduit_marketing_sessions (account_id, created_at DESC);
CREATE INDEX ON conduit_marketing_sessions (status)
  WHERE status IN ('pending','generating','editing');
ALTER TABLE conduit_marketing_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_full_access" ON conduit_marketing_sessions
  FOR ALL
  USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));

CREATE TABLE conduit_marketing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES conduit_marketing_sessions(id) ON DELETE CASCADE,
  ts timestamptz NOT NULL DEFAULT now(),
  level text NOT NULL CHECK (level IN ('info','stdout','stderr','system')),
  message text NOT NULL
);
CREATE INDEX ON conduit_marketing_logs (session_id, ts);
ALTER TABLE conduit_marketing_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_read" ON conduit_marketing_logs
  FOR SELECT
  USING (session_id IN (
    SELECT s.id FROM conduit_marketing_sessions s
    JOIN conduit_accounts a ON a.id = s.account_id
    WHERE a.owner_user_id = auth.uid()
  ));

ALTER TABLE conduit_conversations
  ADD COLUMN IF NOT EXISTS marketing_session_id uuid
    REFERENCES conduit_marketing_sessions(id) ON DELETE SET NULL;

ALTER PUBLICATION supabase_realtime ADD TABLE conduit_marketing_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE conduit_marketing_sessions;
