-- Praxis R20 — pin/favorite conversations
-- Adds a `pinned` flag to conduit_conversations so users can star up to 5
-- conversations for quick access at the top of /app/conversations.
-- Boolean with a NOT NULL DEFAULT false — safe to apply to live tables.

ALTER TABLE conduit_conversations
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;

-- Index for efficient "pinned conversations for this account" lookups.
CREATE INDEX IF NOT EXISTS idx_conduit_conversations_pinned
  ON conduit_conversations (account_id, pinned)
  WHERE pinned = true;
