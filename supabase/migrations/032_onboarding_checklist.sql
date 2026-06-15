-- Praxis R21 — first-run welcome checklist
-- Stores per-account checklist state as a JSONB map of item_key → boolean.
-- Nullable; absence means the checklist has never been interacted with.
-- New accounts (< 7 days old) see the checklist; older accounts skip it.

ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS onboarding_checklist jsonb;
