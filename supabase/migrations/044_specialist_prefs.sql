-- Per-specialist preferences (e.g. response length).
-- Stored as a JSON object keyed by employee id:
--   { "marketing": { "response_length": "short" }, "sales": { "response_length": "detailed" } }
-- NULL (default) means all specialists use 'balanced'.
ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS specialist_prefs jsonb DEFAULT NULL;
