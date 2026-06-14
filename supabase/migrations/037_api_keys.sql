-- API key management for programmatic Praxis access.
-- Keys are 32 random bytes encoded as base64url with a "prx_" prefix.
-- Only the SHA-256 hash is stored; the plain-text key is shown once on creation.

CREATE TABLE conduit_api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  name          text NOT NULL,
  key_hash      text NOT NULL UNIQUE,
  key_preview   text NOT NULL,
  last_used_at  timestamptz,
  created_at    timestamptz DEFAULT now(),
  revoked_at    timestamptz
);

CREATE INDEX conduit_api_keys_account_idx ON conduit_api_keys (account_id, created_at DESC);
CREATE INDEX conduit_api_keys_hash_idx    ON conduit_api_keys (key_hash) WHERE revoked_at IS NULL;

ALTER TABLE conduit_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_members_full_access" ON conduit_api_keys
  FOR ALL USING (
    account_id IN (
      SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()
    )
  );
