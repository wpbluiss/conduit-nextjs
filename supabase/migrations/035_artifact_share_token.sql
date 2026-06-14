-- Public share tokens for conduit_artifacts.
-- A uuid share_token enables a read-only public URL (/share/<token>) for any
-- artifact. The token is generated on demand and can be revoked (set to NULL).
-- The public route uses the service-role client to read by token — no RLS
-- change required since the admin client bypasses RLS entirely and only
-- exposes safe columns (title, content, type, produced_by, created_at).

ALTER TABLE conduit_artifacts
  ADD COLUMN IF NOT EXISTS share_token uuid UNIQUE;

CREATE INDEX IF NOT EXISTS conduit_artifacts_share_token_idx
  ON conduit_artifacts (share_token)
  WHERE share_token IS NOT NULL;
