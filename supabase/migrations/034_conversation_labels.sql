-- Praxis — conversation labels/tags (#373)
-- Color-coded labels for organizing conversations.
-- Max 10 labels per account enforced at the API layer.

CREATE TABLE IF NOT EXISTS conduit_labels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  name        varchar(50) NOT NULL,
  color       varchar(7) NOT NULL DEFAULT '#6B7280',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, name)
);

CREATE INDEX IF NOT EXISTS idx_conduit_labels_account
  ON conduit_labels (account_id);

-- Join table: many-to-many between conversations and labels.
CREATE TABLE IF NOT EXISTS conduit_conversation_labels (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label_id        uuid NOT NULL REFERENCES conduit_labels(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conduit_conversations(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (label_id, conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_conduit_conversation_labels_label
  ON conduit_conversation_labels (label_id);

CREATE INDEX IF NOT EXISTS idx_conduit_conversation_labels_conversation
  ON conduit_conversation_labels (conversation_id);
