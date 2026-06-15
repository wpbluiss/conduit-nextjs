-- Custom display nicknames for each of the 9 Praxis specialists.
-- Stored as a JSON object: { "jarvis": "Atlas", "marketing": "Brand", ... }
-- Empty object = all canonical names.
ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS specialist_nicknames jsonb NOT NULL DEFAULT '{}'::jsonb;
