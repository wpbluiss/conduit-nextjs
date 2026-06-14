-- Praxis R22 — specialist handoff
-- Lets founders re-route a conversation to another specialist mid-thread.
-- The original conversation records which new conversation it was handed off to,
-- and the target employee. SET NULL on cascade so deleting the new conversation
-- clears the handoff reference without deleting the original.

ALTER TABLE conduit_conversations
  ADD COLUMN IF NOT EXISTS handoff_conversation_id uuid
    REFERENCES conduit_conversations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS handoff_employee text;
