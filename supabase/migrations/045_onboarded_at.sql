-- Track when the user first completed the onboarding coach-mark tour.
-- NULL = tour not yet shown / completed. PATCH /api/conduit/account/onboarded sets this.
ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz DEFAULT NULL;
