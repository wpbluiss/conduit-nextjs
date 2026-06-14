-- R536: workspace_name — user-customisable label shown in the sidebar header.
-- Nullable varchar(100); falls back to account.name if not set.
ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS workspace_name varchar(100);
