-- R18 Slice 1: forward-compat columns for the Memory canvas v2
-- (drag-to-arrange). v1 uses auto-layout and ignores these columns; v2
-- drag UI will populate them via PATCH /api/conduit/memory/[id]. Both
-- columns are NULL-able with no default. RLS inherited from existing
-- owners_full_access policy on conduit_memory.
--
-- Applied to remote: 2026-05-23 via Supabase MCP apply_migration.

ALTER TABLE conduit_memory
  ADD COLUMN IF NOT EXISTS position_x real,
  ADD COLUMN IF NOT EXISTS position_y real;
