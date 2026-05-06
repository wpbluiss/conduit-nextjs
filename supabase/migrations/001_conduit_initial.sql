-- Conduit Round 1 — chat platform shell
-- Applied via Supabase MCP on 2026-05-06.
-- Tables prefixed conduit_* to coexist with lunaro_* in shared project.

CREATE TABLE conduit_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  business_type text,
  business_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (owner_user_id)
);
ALTER TABLE conduit_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_full_access" ON conduit_accounts
  FOR ALL USING (owner_user_id = auth.uid());

CREATE TABLE conduit_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX ON conduit_conversations (account_id, updated_at DESC);
ALTER TABLE conduit_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "account_members_full_access" ON conduit_conversations
  FOR ALL USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));

CREATE TABLE conduit_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conduit_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  employee text,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON conduit_messages (conversation_id, created_at);
ALTER TABLE conduit_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "account_members_full_access" ON conduit_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT c.id FROM conduit_conversations c
      JOIN conduit_accounts a ON a.id = c.account_id
      WHERE a.owner_user_id = auth.uid()
    )
  );

CREATE TABLE conduit_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conduit_conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES conduit_messages(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('blog_post', 'document', 'code', 'plan', 'image', 'other')),
  title text NOT NULL,
  content text NOT NULL,
  produced_by text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON conduit_artifacts (account_id, created_at DESC);
ALTER TABLE conduit_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "account_members_full_access" ON conduit_artifacts
  FOR ALL USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));

CREATE TABLE conduit_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  employee text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  input_tokens integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  estimated_cost_cents integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON conduit_usage_events (account_id, created_at DESC);
ALTER TABLE conduit_usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_read" ON conduit_usage_events
  FOR SELECT USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));
