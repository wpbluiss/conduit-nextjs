ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS onboarding_goals JSONB;

ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;
