-- R7: real Engineering execution. conduit_builds tracks every site Engineering
-- has shipped; conduit_build_events streams progress for the in-chat status UI.
-- Adds 'build' to the conduit_artifacts type allowlist so deployed sites can be
-- linked as artifacts in the conversation.

CREATE TABLE conduit_builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conduit_conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES conduit_messages(id) ON DELETE SET NULL,
  template_id text NOT NULL,
  build_name text NOT NULL,
  build_slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'building', 'live', 'failed', 'archived')),
  github_repo_url text,
  vercel_project_id text,
  vercel_deployment_id text,
  live_url text,
  config jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX ON conduit_builds (account_id, created_at DESC);
CREATE INDEX ON conduit_builds (status) WHERE status IN ('pending', 'building');
ALTER TABLE conduit_builds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_full_access" ON conduit_builds
  FOR ALL USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));

CREATE TABLE conduit_build_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id uuid NOT NULL REFERENCES conduit_builds(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON conduit_build_events (build_id, created_at);
ALTER TABLE conduit_build_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_read" ON conduit_build_events
  FOR SELECT USING (build_id IN (
    SELECT b.id FROM conduit_builds b
    JOIN conduit_accounts a ON a.id = b.account_id
    WHERE a.owner_user_id = auth.uid()
  ));

ALTER TABLE conduit_artifacts DROP CONSTRAINT IF EXISTS conduit_artifacts_type_check;
ALTER TABLE conduit_artifacts ADD CONSTRAINT conduit_artifacts_type_check
  CHECK (type IN ('blog_post', 'document', 'code', 'plan', 'image', 'other', 'build'));
