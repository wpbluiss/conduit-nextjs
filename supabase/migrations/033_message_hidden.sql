-- Praxis — message edit + retry (#371)
-- Adds hidden_at to conduit_messages for non-destructive conversation branching.
-- When a user edits a message, all messages from that point onward are hidden
-- (not deleted) so the AI only sees the new branch as context.

ALTER TABLE conduit_messages
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_conduit_messages_hidden
  ON conduit_messages (conversation_id, hidden_at)
  WHERE hidden_at IS NULL;
