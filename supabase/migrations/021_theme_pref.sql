-- Praxis Console R3 — theme preference column.
-- Stored per-account so the choice survives across devices/sessions.
-- Default 'system' means "follow OS prefers-color-scheme". Client also
-- mirrors this to localStorage for pre-paint application (no FOUC).

ALTER TABLE conduit_accounts
  ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'system'
    CHECK (theme_preference IN ('system', 'light', 'dark'));
