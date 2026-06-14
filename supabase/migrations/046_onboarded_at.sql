ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;
