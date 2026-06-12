-- Track whether the account has dismissed the "meet your team" first-run intro.
-- NULL = not yet dismissed; timestamp = dismissed at that time.
ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS intro_dismissed_at TIMESTAMPTZ NULL;
