-- Soft-delete support for message edit/retry branches.
-- hidden_at is set on the original message + all subsequent messages in the
-- conversation when a user edits a previous turn. Nothing is ever hard-deleted.
ALTER TABLE conduit_messages
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS conduit_messages_hidden_at
  ON conduit_messages (conversation_id, hidden_at)
  WHERE hidden_at IS NOT NULL;
