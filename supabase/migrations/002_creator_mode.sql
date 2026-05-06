-- R2: creator_mode flag forces Haiku for all employees on the owner's account.
-- Used so Luis's personal usage costs ~10-15% of normal while paying customers get full quality.

ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS creator_mode boolean DEFAULT false;

UPDATE conduit_accounts
SET creator_mode = true
WHERE owner_user_id IN (
  SELECT id FROM auth.users WHERE email = 'luisinvestments101@gmail.com'
);
