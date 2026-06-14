-- R-462: Accent colour preference — persists the user's chosen accent swatch.
-- Stored as a short key string (ember|blue|sage|rose|amber|slate).
-- Nullable; absence means default (ember). No RLS change needed.

ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS accent_preference TEXT;
