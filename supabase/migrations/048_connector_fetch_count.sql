-- Track how many times each connector has been fetched for context injection.
-- Used by the Settings → Usage tab to show connector call totals.
ALTER TABLE conduit_connector_tokens
  ADD COLUMN IF NOT EXISTS fetch_count     int         NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_fetched_at timestamptz;
