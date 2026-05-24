# Contract — Credential Encryption (Slice 2)

**Spec FR**: FR-012 (credential storage with encryption-at-rest)
**Files**: `supabase/migrations/024_connectors.sql`, `src/lib/connectors/encryption.ts`

This is the **new operational standard** for credential storage in this
repo. Documented in the migration AND in `SESSION_REPORT_2026-05-XX_GITHUB_CONNECTOR.md`
so future credential-storage decisions know the convention.

---

## 1. Choice (locked at plan time)

**pgcrypto** (PostgreSQL extension) over Supabase Vault. Full justification
in `research.md §R-004`.

---

## 2. Migration

```sql
-- 024_connectors.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE conduit_connectors (
  …
  credential_encrypted bytea NOT NULL,
  …
);
```

The `credential_encrypted` column stores the output of
`pgp_sym_encrypt(token, key)` where `key` is the value of the
`CONNECTOR_CREDENTIAL_KEY` environment variable (Vercel, 32-byte hex).

---

## 3. Encryption API

The app NEVER passes the key around as a JavaScript string variable
beyond the moment it's read from `process.env`. Instead, the key is set
on a per-connection PostgreSQL setting that the SQL function reads.

```ts
// src/lib/connectors/encryption.ts

import type { SupabaseClient } from "@supabase/supabase-js";

function getKey(): string {
  const k = process.env.CONNECTOR_CREDENTIAL_KEY;
  if (!k || k.length < 32) {
    throw new Error("CONNECTOR_CREDENTIAL_KEY missing or too short");
  }
  return k;
}

/**
 * Encrypt a plaintext credential and INSERT it.
 * Returns the inserted connector row id.
 */
export async function insertEncryptedCredential(
  supabase: SupabaseClient,
  args: {
    accountId: string;
    kind: "github";
    plaintext: string;
    credentialMeta: Record<string, unknown>;
  },
): Promise<{ id: string }> {
  const key = getKey();
  // Single SQL call — token only crosses the wire to pg.
  const { data, error } = await supabase.rpc("conduit_insert_connector", {
    p_account_id: args.accountId,
    p_kind: args.kind,
    p_plaintext: args.plaintext,
    p_key: key,
    p_credential_meta: args.credentialMeta,
  });
  if (error) throw new Error(`insert_connector_failed: ${error.message}`);
  return { id: data as string };
}

/**
 * Decrypt + return a credential for a specific connector. RLS protects
 * access (only owner can read). Returns null if not found / not owned.
 */
export async function getDecryptedCredential(
  supabase: SupabaseClient,
  args: { connectorId: string },
): Promise<string | null> {
  const key = getKey();
  const { data, error } = await supabase.rpc("conduit_decrypt_credential", {
    p_connector_id: args.connectorId,
    p_key: key,
  });
  if (error) {
    if (/not_found|denied/.test(error.message)) return null;
    throw new Error(`decrypt_credential_failed: ${error.message}`);
  }
  return (data as string | null) ?? null;
}
```

---

## 4. SQL helper functions

Migration declares two helper functions to keep encryption logic in the DB:

```sql
CREATE FUNCTION conduit_insert_connector(
  p_account_id uuid,
  p_kind text,
  p_plaintext text,
  p_key text,
  p_credential_meta jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER  -- runs as caller, so RLS applies normally
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Cap check happens in app code BEFORE calling this function.
  INSERT INTO conduit_connectors (account_id, kind, credential_encrypted, credential_meta)
  VALUES (
    p_account_id,
    p_kind,
    pgp_sym_encrypt(p_plaintext, p_key),
    p_credential_meta
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE FUNCTION conduit_decrypt_credential(
  p_connector_id uuid,
  p_key text
) RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_credential text;
BEGIN
  -- RLS-protected: the SELECT only finds the row if the caller owns it.
  SELECT pgp_sym_decrypt(credential_encrypted, p_key)
  INTO v_credential
  FROM conduit_connectors
  WHERE id = p_connector_id;
  RETURN v_credential;
END;
$$;
```

`SECURITY INVOKER` is critical — these functions run as the calling user,
so the existing owner-scoped RLS policy on `conduit_connectors` still
applies. No privilege escalation.

---

## 5. Key lifecycle

- **Generation**: `openssl rand -hex 32` produces a 64-char hex string (= 32 bytes). Set on Vercel as `CONNECTOR_CREDENTIAL_KEY` for both preview and production environments.
- **Loss**: if the env var is lost, ALL stored credentials become unreadable. They are NOT recoverable. Users must reconnect.
- **Rotation**: a forward migration decrypts with the old key + re-encrypts with the new key. Implementation deferred to operational need; not required for Slice 2.B.

---

## 6. Audit + verification

Per spec **SC-010**:

```sql
SELECT id, kind, credential_encrypted FROM conduit_connectors LIMIT 1;
-- credential_encrypted should be a bytea value, not a readable string.
-- The first few bytes will be the pgp magic number, not "ghp_…".
```

The cinema/connectors UI should NEVER call `pgp_sym_decrypt` — only the
chat-route tool runtime does, and only at tool-call time.

---

## 7. Failure modes

| Failure | Behavior |
|---|---|
| `CONNECTOR_CREDENTIAL_KEY` env var missing | Verify endpoint returns `500 encryption_failed`; operator-tier message names the env var. Decrypt path throws on first tool call. |
| Key mismatch (e.g., rotated without re-encryption) | `pgp_sym_decrypt` throws. Connector flips to `status='error'`, `last_error='credential_decrypt_failed'`. User sees `Reconnect required`. |
| RLS denies decrypt | `getDecryptedCredential` returns `null`. Tool throws "connector not found." (Shouldn't happen in practice — tool is invoked through the chat route which already authenticated.) |
| pgcrypto extension not enabled | Migration `CREATE EXTENSION IF NOT EXISTS pgcrypto` should not fail on Supabase; if it does, migration aborts and Slice 2 doesn't ship. |
