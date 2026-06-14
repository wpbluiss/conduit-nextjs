-- Add avatar_url to conduit_accounts for profile photo storage.
-- Nullable — existing rows get NULL until the user uploads a photo.
ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
