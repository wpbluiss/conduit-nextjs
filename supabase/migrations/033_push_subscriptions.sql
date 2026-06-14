-- R22 PWA push notification subscriptions.
-- Note: if migration 033_account_avatar.sql from PR #422 merges first,
-- rename this file to 034_push_subscriptions.sql before applying.

CREATE TABLE IF NOT EXISTS conduit_push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  endpoint   text NOT NULL,
  keys       jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, endpoint)
);

ALTER TABLE conduit_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_full_access" ON conduit_push_subscriptions
  FOR ALL
  USING (
    account_id IN (
      SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()
    )
  );
