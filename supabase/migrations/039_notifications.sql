-- Praxis R21 — in-app notification center
-- Per-account event feed: build completed, artifact ready, memory saved, billing events.

CREATE TABLE conduit_notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  type        text NOT NULL,        -- 'build_complete' | 'artifact_ready' | 'memory_saved' | 'billing'
  title       text NOT NULL,
  body        text,
  href        text,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conduit_notifications_account_idx
  ON conduit_notifications (account_id, created_at DESC);

ALTER TABLE conduit_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_full_access" ON conduit_notifications
  FOR ALL USING (
    account_id IN (
      SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()
    )
  );
