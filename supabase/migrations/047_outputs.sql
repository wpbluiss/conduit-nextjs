-- Praxis — Output Library
-- User-selected specialist outputs (reports, briefs, plans) saved from chat history.

CREATE TABLE conduit_outputs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  title           text NOT NULL,
  content         text NOT NULL,
  specialist      text NOT NULL,
  source_message_id text,
  source_conversation_id text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conduit_outputs_account_idx
  ON conduit_outputs (account_id, created_at DESC);

ALTER TABLE conduit_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_full_access" ON conduit_outputs
  FOR ALL USING (
    account_id IN (
      SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()
    )
  );
