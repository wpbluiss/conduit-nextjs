-- Thumbs-up / thumbs-down ratings for individual specialist responses.
-- One row per (message_id, account_id) — upsert replaces the previous rating.
-- rating: +1 = thumbs up, -1 = thumbs down.

CREATE TABLE IF NOT EXISTS conduit_message_feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  uuid  NOT NULL,
  account_id  uuid  NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  rating      smallint NOT NULL CHECK (rating IN (1, -1)),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, account_id)
);

CREATE INDEX IF NOT EXISTS conduit_message_feedback_message_idx
  ON conduit_message_feedback (message_id);

CREATE INDEX IF NOT EXISTS conduit_message_feedback_account_idx
  ON conduit_message_feedback (account_id);

ALTER TABLE conduit_message_feedback ENABLE ROW LEVEL SECURITY;

-- Owner can read their own feedback
CREATE POLICY "feedback_select" ON conduit_message_feedback
  FOR SELECT USING (
    account_id IN (
      SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()
    )
  );

-- Owner can insert feedback
CREATE POLICY "feedback_insert" ON conduit_message_feedback
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()
    )
  );

-- Owner can update their own feedback (for upsert / toggle)
CREATE POLICY "feedback_update" ON conduit_message_feedback
  FOR UPDATE USING (
    account_id IN (
      SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()
    )
  );

-- Owner can delete their own feedback
CREATE POLICY "feedback_delete" ON conduit_message_feedback
  FOR DELETE USING (
    account_id IN (
      SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()
    )
  );
