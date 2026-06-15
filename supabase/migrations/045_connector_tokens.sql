-- Praxis connectors — shared token store for OAuth-based integrations.
-- Each row holds one provider's tokens for one account (unique per pair).
-- Tokens are plaintext (owner-only RLS enforces isolation).
-- Future: migrate to Supabase Vault for encryption at rest.

CREATE TABLE conduit_connector_tokens (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid        NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  provider      text        NOT NULL,  -- 'google_calendar' | 'slack'
  access_token  text        NOT NULL,
  refresh_token text,
  expires_at    timestamptz,
  scope         text,
  meta          jsonb       NOT NULL DEFAULT '{}',  -- provider-specific extras (e.g. channel_id for Slack)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(account_id, provider)
);

CREATE INDEX conduit_connector_tokens_account_idx
  ON conduit_connector_tokens (account_id, provider);

ALTER TABLE conduit_connector_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_full_access" ON conduit_connector_tokens
  FOR ALL USING (
    account_id IN (
      SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()
    )
  );
