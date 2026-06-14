-- Praxis R21 — conversation branching (fork from any message)
-- Adds two nullable columns to conduit_conversations to track fork lineage.
-- RLS is inherited from the existing "account_members_full_access" policy.

ALTER TABLE conduit_conversations
  ADD COLUMN IF NOT EXISTS forked_from_conversation_id uuid REFERENCES conduit_conversations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS forked_at_message_id uuid REFERENCES conduit_messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS conduit_conversations_forked_from_idx
  ON conduit_conversations (forked_from_conversation_id)
  WHERE forked_from_conversation_id IS NOT NULL;
