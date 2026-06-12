-- Add tour_dismissed_at to conduit_accounts so the first-run "meet your
-- team" intro only shows once per account.
ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS tour_dismissed_at TIMESTAMPTZ DEFAULT NULL;

-- Existing onboarded accounts already know the product; mark them as
-- tour-complete so they don't see the intro on their next load.
UPDATE conduit_accounts
SET tour_dismissed_at = NOW()
WHERE business_type IS NOT NULL
  AND business_description IS NOT NULL
  AND tour_dismissed_at IS NULL;
