-- R9 addendum: voice UX cleanup before Voice Room ships.
-- 1. Default auto-play to FALSE for new accounts. Existing accounts unaffected
--    (we change only the column default).
-- 2. Add notify_voice_room_ready opt-in flag for the "coming soon" card.

ALTER TABLE conduit_accounts
  ALTER COLUMN voice_auto_play SET DEFAULT false;

ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS notify_voice_room_ready boolean DEFAULT false;
