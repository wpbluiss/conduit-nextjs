-- Conversation branching (fork from any message point).
-- Both columns are nullable so existing rows are unaffected.

ALTER TABLE conduit_conversations
  ADD COLUMN IF NOT EXISTS forked_from_conversation_id uuid
    REFERENCES conduit_conversations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS forked_at_message_id uuid
    REFERENCES conduit_messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS conduit_conversations_fork_idx
  ON conduit_conversations(forked_from_conversation_id)
  WHERE forked_from_conversation_id IS NOT NULL;
