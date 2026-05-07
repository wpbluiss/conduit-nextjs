-- R10: cross-conversation memory layer.
-- Jarvis writes durable records via [REMEMBER] / [SUPERSEDE] tags. Every
-- employee reads them at the top of their system prompt. Owner-scoped via RLS.

CREATE TYPE conduit_memory_kind AS ENUM (
  'fact',
  'preference',
  'decision',
  'goal',
  'context'
);

CREATE TABLE conduit_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  kind conduit_memory_kind NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  source_conversation_id uuid REFERENCES conduit_conversations(id) ON DELETE SET NULL,
  source_message_id uuid REFERENCES conduit_messages(id) ON DELETE SET NULL,
  written_by text NOT NULL DEFAULT 'jarvis',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  superseded_by uuid REFERENCES conduit_memory(id) ON DELETE SET NULL
);

CREATE INDEX conduit_memory_account_idx
  ON conduit_memory(account_id, created_at DESC)
  WHERE archived_at IS NULL;
CREATE INDEX conduit_memory_account_kind_idx
  ON conduit_memory(account_id, kind)
  WHERE archived_at IS NULL;

ALTER TABLE conduit_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY conduit_memory_owner_select ON conduit_memory
  FOR SELECT USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));
CREATE POLICY conduit_memory_owner_insert ON conduit_memory
  FOR INSERT WITH CHECK (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));
CREATE POLICY conduit_memory_owner_update ON conduit_memory
  FOR UPDATE USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));
CREATE POLICY conduit_memory_owner_delete ON conduit_memory
  FOR DELETE USING (account_id IN (SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()));

ALTER TABLE conduit_pricing_tiers
  ADD COLUMN IF NOT EXISTS memory_cap integer DEFAULT 50;

UPDATE conduit_pricing_tiers SET memory_cap = 25 WHERE id = 'free';
UPDATE conduit_pricing_tiers SET memory_cap = 200 WHERE id = 'pro';
UPDATE conduit_pricing_tiers SET memory_cap = 1000 WHERE id = 'enterprise';
