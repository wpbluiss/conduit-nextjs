-- Praxis R22 — task templates
-- Reusable prompts with {{variable}} placeholders, owned per-account.

CREATE TABLE conduit_prompt_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  title       text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  body        text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conduit_prompt_templates_account_idx
  ON conduit_prompt_templates (account_id, created_at DESC);

ALTER TABLE conduit_prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_full_access" ON conduit_prompt_templates
  FOR ALL USING (
    account_id IN (
      SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()
    )
  );
