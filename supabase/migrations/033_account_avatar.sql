-- R22 — profile avatar URL + display name stored on account.
-- avatar_url: public URL from Supabase Storage (conduit bucket, avatars/ prefix).
-- display_name: personal name distinct from conduit_accounts.name (business name).
-- Both are nullable; existing rows unaffected.
ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;
