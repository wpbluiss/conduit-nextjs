-- Add seen_welcome_tour flag to conduit_accounts.
-- Default false so new accounts (created after this migration) see the intro.
-- Existing accounts are immediately backfilled to true — they've already
-- experienced the product and don't need the first-run tour.
ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS seen_welcome_tour boolean DEFAULT false NOT NULL;

-- Backfill all rows that predate this migration so existing users are unaffected.
UPDATE conduit_accounts
  SET seen_welcome_tour = true
  WHERE created_at < '2026-06-12 00:00:00+00';
