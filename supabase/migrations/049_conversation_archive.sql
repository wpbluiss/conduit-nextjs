-- Adds soft-archive to conversations so users can hide old chats without
-- permanently deleting them. archived_at is nullable; NULL means visible.
-- The existing hard-delete endpoint is unchanged.

ALTER TABLE conduit_conversations
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS conduit_conversations_archived_at_idx
  ON conduit_conversations (account_id, archived_at)
  WHERE archived_at IS NULL;
