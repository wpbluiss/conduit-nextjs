-- Praxis R21 — conversation labels / tags
-- Users can create up to 10 color-coded labels per account and assign
-- them to conversations for organizing the chat history.

CREATE TABLE IF NOT EXISTS conduit_conversation_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conduit_conversation_labels_account_idx
  ON conduit_conversation_labels (account_id, created_at DESC);

ALTER TABLE conduit_conversation_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_full_access" ON conduit_conversation_labels
  FOR ALL USING (account_id IN (
    SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()
  ));

-- Junction table — many-to-many: conversations ↔ labels
CREATE TABLE IF NOT EXISTS conduit_conversation_label_assignments (
  conversation_id uuid NOT NULL REFERENCES conduit_conversations(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES conduit_conversation_labels(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, label_id)
);

CREATE INDEX IF NOT EXISTS conduit_label_assignments_label_idx
  ON conduit_conversation_label_assignments (label_id);

ALTER TABLE conduit_conversation_label_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_full_access" ON conduit_conversation_label_assignments
  FOR ALL USING (
    conversation_id IN (
      SELECT c.id FROM conduit_conversations c
      JOIN conduit_accounts a ON a.id = c.account_id
      WHERE a.owner_user_id = auth.uid()
    )
  );
