-- Praxis R22 — connector page cache
-- Stores synced content from third-party connectors (e.g. Notion pages)
-- so it can be injected into specialist context at chat time without a live API call.

CREATE TABLE conduit_connector_cache (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid        NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  provider    text        NOT NULL,   -- e.g. 'notion'
  cache_key   text        NOT NULL,   -- provider-specific key (e.g. notion page_id)
  title       text,                   -- human-readable label for the cached item
  content     text        NOT NULL,   -- truncated plain text of the page/doc
  synced_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, provider, cache_key)
);

CREATE INDEX conduit_connector_cache_account_idx
  ON conduit_connector_cache (account_id, provider, synced_at DESC);

ALTER TABLE conduit_connector_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_full_access" ON conduit_connector_cache
  FOR ALL USING (
    account_id IN (
      SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()
    )
  );
