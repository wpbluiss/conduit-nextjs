-- Praxis R20 — email notification preferences
-- Stored as JSONB on conduit_accounts so individual fields can be toggled
-- without a schema migration each time a new email type is added.
-- Default: all user-controllable preferences on; billing/security always send.

ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT '{
    "product_updates": true,
    "weekly_digest": true
  }'::jsonb;
