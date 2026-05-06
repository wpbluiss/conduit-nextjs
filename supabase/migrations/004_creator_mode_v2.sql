-- R3: creator_mode_version. v2 = Opus-default adaptive (Sonnet fallback for
-- creative/routing/factual). v1 = legacy forced-Haiku for any remaining account.
-- Owner flipped to v2 for daily premium use.

ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS creator_mode_version integer DEFAULT 1;

UPDATE conduit_accounts
SET creator_mode_version = 2
WHERE owner_user_id IN (
  SELECT id FROM auth.users WHERE email = 'luisinvestments101@gmail.com'
);
