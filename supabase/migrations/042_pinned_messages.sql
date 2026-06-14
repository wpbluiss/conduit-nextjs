-- Praxis R22 — per-conversation pinned messages
-- Users can pin up to 5 specialist responses per conversation.
-- Pins persist across reloads and show in a collapsible banner at the top of chat.

CREATE TABLE conduit_pinned_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conduit_conversations(id) ON DELETE CASCADE,
  message_id      uuid NOT NULL,
  sort_order      integer NOT NULL DEFAULT 0,
  pinned_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, message_id)
);

CREATE INDEX conduit_pinned_messages_conv_idx
  ON conduit_pinned_messages (conversation_id, sort_order, pinned_at);

ALTER TABLE conduit_pinned_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_full_access" ON conduit_pinned_messages
  FOR ALL USING (
    account_id IN (
      SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()
    )
  );
