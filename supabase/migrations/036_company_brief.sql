-- R-463: Company brief — a user-authored 500-char context block that Atlas
-- distributes to all specialists. Nullable; existing rows are unaffected.
-- No RLS change required: conduit_accounts already scoped to owner_user_id.

ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS company_brief TEXT;
