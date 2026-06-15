-- Stable unsubscribe token for weekly email digest.
-- Stored as a uuid so the unsubscribe URL works without auth.
-- A new token is generated only if the column is null (lazily on first send).

ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS digest_unsubscribe_token uuid DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS conduit_accounts_digest_unsubscribe_token_idx
  ON conduit_accounts (digest_unsubscribe_token)
  WHERE digest_unsubscribe_token IS NOT NULL;
