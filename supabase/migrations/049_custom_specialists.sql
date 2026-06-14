-- Praxis R598 — user-defined custom specialists
-- Workspace owners can create named AI employees beyond the default nine.

CREATE TABLE conduit_custom_specialists (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid        NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  name          text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 64),
  role          text        NOT NULL DEFAULT '' CHECK (char_length(role) <= 128),
  color         text        NOT NULL DEFAULT '#6366f1',
  system_prompt text        NOT NULL CHECK (char_length(system_prompt) BETWEEN 1 AND 5000),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conduit_custom_specialists_account_idx
  ON conduit_custom_specialists (account_id, created_at);

ALTER TABLE conduit_custom_specialists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_full_access" ON conduit_custom_specialists
  FOR ALL USING (
    account_id IN (
      SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()
    )
  );
