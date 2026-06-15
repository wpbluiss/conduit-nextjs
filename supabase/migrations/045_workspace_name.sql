ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS workspace_name text;
