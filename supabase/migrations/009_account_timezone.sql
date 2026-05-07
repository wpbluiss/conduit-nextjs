-- R8: per-account timezone so time-aware system prompts say
-- "good evening" at 8pm instead of "good morning."

ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York';

UPDATE conduit_accounts SET timezone = 'America/New_York' WHERE timezone IS NULL;
