# Phase 1 Data Model — Memory + Connectors

**Date**: 2026-05-23
**Status**: Phase 1 complete

---

## 1. Schema deltas

### 1.1 Slice 1 — `023_memory_scope_pin_lock.sql`

```sql
-- Pinned / locked columns
ALTER TABLE conduit_memory
  ADD COLUMN pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN locked boolean NOT NULL DEFAULT false;

-- Index for the prompt-trim hot path (pinned rows first)
CREATE INDEX conduit_memory_pinned_idx
  ON conduit_memory(account_id, pinned DESC, created_at DESC)
  WHERE archived_at IS NULL;

-- Per-department scope join table.
-- Zero rows for a memory = global (visible to all employees).
-- 1+ rows = scoped to those employees only.
CREATE TABLE conduit_memory_scope (
  memory_id uuid NOT NULL REFERENCES conduit_memory(id) ON DELETE CASCADE,
  employee_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (memory_id, employee_id)
);

CREATE INDEX conduit_memory_scope_memory_idx ON conduit_memory_scope(memory_id);
CREATE INDEX conduit_memory_scope_employee_idx ON conduit_memory_scope(employee_id, memory_id);

ALTER TABLE conduit_memory_scope ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_full_access" ON conduit_memory_scope
  FOR ALL USING (
    memory_id IN (
      SELECT m.id FROM conduit_memory m
      JOIN conduit_accounts a ON a.id = m.account_id
      WHERE a.owner_user_id = auth.uid()
    )
  );

-- Check constraint: employee_id must be one of the canonical 9.
-- (Source of truth: src/lib/conduit/employees.ts EMPLOYEE_ORDER.)
ALTER TABLE conduit_memory_scope
  ADD CONSTRAINT conduit_memory_scope_employee_id_check
  CHECK (employee_id IN (
    'jarvis', 'marketing', 'sales', 'engineering',
    'finance', 'compliance', 'hr', 'ops', 'legal'
  ));
```

### 1.2 Slice 2 — `024_connectors.sql`

```sql
-- Enable pgcrypto if not already (Supabase has it available natively).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE conduit_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES conduit_accounts(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('github')),  -- extends with future kinds
  credential_encrypted bytea NOT NULL,             -- pgp_sym_encrypt(token, key)
  credential_meta jsonb NOT NULL DEFAULT '{}'::jsonb, -- e.g. {username, scopes[], avatar_url}
  status text NOT NULL DEFAULT 'connected'
    CHECK (status IN ('connected', 'reconnect_required', 'error')),
  last_used_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, kind)  -- one connector of each kind per account in this round
);

CREATE INDEX conduit_connectors_account_idx ON conduit_connectors(account_id);

ALTER TABLE conduit_connectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_full_access" ON conduit_connectors
  FOR ALL USING (
    account_id IN (
      SELECT id FROM conduit_accounts WHERE owner_user_id = auth.uid()
    )
  );

-- Per-employee grant matrix.
CREATE TABLE conduit_connector_grants (
  connector_id uuid NOT NULL REFERENCES conduit_connectors(id) ON DELETE CASCADE,
  employee_id text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (connector_id, employee_id),
  CONSTRAINT conduit_connector_grants_employee_id_check
    CHECK (employee_id IN (
      'jarvis', 'marketing', 'sales', 'engineering',
      'finance', 'compliance', 'hr', 'ops', 'legal'
    ))
);

CREATE INDEX conduit_connector_grants_connector_idx ON conduit_connector_grants(connector_id);
CREATE INDEX conduit_connector_grants_employee_idx ON conduit_connector_grants(employee_id, connector_id);

ALTER TABLE conduit_connector_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners_full_access" ON conduit_connector_grants
  FOR ALL USING (
    connector_id IN (
      SELECT c.id FROM conduit_connectors c
      JOIN conduit_accounts a ON a.id = c.account_id
      WHERE a.owner_user_id = auth.uid()
    )
  );
```

---

## 2. Derived entities (code-side types)

### 2.1 Memory record (Slice 1, extending the existing R10 type)

`src/lib/ai/memory.ts` extends:

```ts
export interface MemoryRecord {
  id: string;
  account_id: string;
  kind: MemoryKind;
  content: string;
  tags: string[];
  source_conversation_id: string | null;
  source_message_id: string | null;
  written_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  superseded_by: string | null;
  /** NEW Slice 1 */
  pinned: boolean;
  /** NEW Slice 1 */
  locked: boolean;
  /** NEW Slice 1 — empty = global; populated = scoped to these employees only. */
  scope: EmployeeId[];
}
```

`trimMemoriesForPrompt` becomes:
```ts
function trimMemoriesForPrompt(rows: MemoryRecord[]): MemoryRecord[] {
  // 1. Pinned rows always included (don't count against char budget — they're
  //    user-chosen and important).
  // 2. Remainder fills char budget, newest first.
  const pinned = rows.filter(r => r.pinned);
  const unpinned = rows.filter(r => !r.pinned);
  let totalChars = pinned.reduce((sum, r) => sum + r.content.length, 0);
  const out = [...pinned];
  for (const m of unpinned.slice(0, PROMPT_MEMORY_LIMIT - pinned.length)) {
    if (totalChars + m.content.length > PROMPT_MEMORY_CHAR_BUDGET) break;
    out.push(m);
    totalChars += m.content.length;
  }
  return out;
}
```

### 2.2 Connector record (Slice 2)

```ts
export type ConnectorKind = "github";

export type ConnectorStatus =
  | "connected"
  | "reconnect_required"
  | "error";

export interface ConnectorRecord {
  id: string;
  accountId: string;
  kind: ConnectorKind;
  // credentialEncrypted is NEVER read into TS land — it stays in the DB
  // and is decrypted at the SQL boundary when needed.
  credentialMeta: {
    username?: string;
    scopes?: string[];
    avatarUrl?: string;
  };
  status: ConnectorStatus;
  lastUsedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  /** Derived — set of employee_id values from conduit_connector_grants. */
  grantedTo: EmployeeId[];
}
```

### 2.3 Tool definition (Slice 2)

```ts
export interface ToolDefinition<TArgs = unknown, TResult = unknown> {
  name: string;
  description: string;
  inputSchema: object;       // JSON Schema per Anthropic's tool format
  /** Which connector kind grants this tool. */
  connectorKind: ConnectorKind;
  /** Per-employee filter happens at call site via conduit_connector_grants. */
  run(args: TArgs, ctx: ToolContext): Promise<TResult>;
}

export interface ToolContext {
  accountId: string;
  employeeId: EmployeeId;
  connectorId: string;
  /** Returns a Promise resolving to a decrypted credential string.
   *  Implementation: SQL roundtrip via pgp_sym_decrypt. */
  getCredential(): Promise<string>;
}
```

---

## 3. Per-turn memory query contract (Slice 1)

The chat-route memory loader becomes employee-aware:

```ts
// src/app/api/conduit/chat/route.ts (the existing :146-159 block)
// Atlas/jarvis sees all memories; other employees see global + their-scope.
async function loadScopedMemories(
  supabase: SupabaseClient,
  accountId: string,
  activeEmployee: EmployeeId,
): Promise<MemoryRecord[]> {
  if (activeEmployee === "jarvis") {
    const { data } = await supabase
      .from("conduit_memory")
      .select("…")
      .eq("account_id", accountId)
      .is("archived_at", null)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(60);
    return data ?? [];
  }
  // Non-Atlas: filter by scope.
  // Use a Postgres function or RPC for the EXISTS-based filter, OR
  // do two queries + merge: (a) global memories, (b) scoped-to-emp memories.
  // Recommendation: a single RPC `conduit_memory_for_employee(account, emp)`.
  // Plan-time decision: defer the RPC vs. two-query choice to implementation;
  // contract is the same either way.
  …
}
```

The exact SQL shape lives in `contracts/memory-desk.md`.

---

## 4. Lifecycle scenarios

### 4.1 Add global memory (Slice 1)

1. User types content + selects kind on the global section's inline add form. No dept chips selected.
2. POST `/api/conduit/memory` with `{ kind, content, tags, scope: [] }`.
3. Server: cap check; INSERT into `conduit_memory` with `pinned=false, locked=false`; no rows added to `conduit_memory_scope` (empty scope).
4. Optimistic UI: card appears in the Global section immediately.

### 4.2 Add Marketing-only memory (Slice 1)

1. User adds in the Marketing section's add form (or selects "Marketing" chip in the global form).
2. POST `/api/conduit/memory` with `{ kind, content, tags, scope: ["marketing"] }`.
3. Server: INSERT memory + INSERT row into `conduit_memory_scope (memory_id, employee_id="marketing")`.
4. Card appears under Marketing only.

### 4.3 Re-scope existing global memory to Sales+Engineering (Slice 1)

1. User clicks dept chips on an existing card.
2. PATCH `/api/conduit/memory/[id]` with `{ scope: ["sales", "engineering"] }`.
3. Server: in a single transaction, DELETE all rows from `conduit_memory_scope` where `memory_id=$1`, INSERT new rows.
4. Card moves between sections in optimistic UI.

### 4.4 Atlas writes a memory with `scope: marketing` (Slice 1)

1. Atlas emits `[REMEMBER: fact | User's brand voice is warm and direct | scope: marketing]` in chat.
2. Existing parser in `lib/ai/memory.ts` is extended to parse optional `scope: <id>` (or `scope: global`) — backward-compatible.
3. Chat route INSERTs memory + INSERTs scope row.
4. Card appears under Marketing on the next dashboard load.

### 4.5 Atlas attempts `[SUPERSEDE]` on a locked memory (Slice 1)

1. Atlas emits `[SUPERSEDE: <id> | fact | new content]`.
2. Chat route's supersede handler checks `conduit_memory.locked` for the target id.
3. If `locked=true`, SKIP the supersede and log a system event. No DB change.
4. Atlas's response is unchanged from the user's perspective — the tag was stripped before display.

### 4.6 PAT-paste flow (Slice 2)

1. User clicks `Connect` on the GitHub tile. Drawer slides in.
2. User pastes PAT + clicks Verify.
3. Client POST `/api/conduit/connectors/github/verify` with `{ token: <pat> }` (token only in this request, never in chat or conversation logs).
4. Server:
   - Token verify: `GET https://api.github.com/user` with `Authorization: Bearer <token>` → confirms valid + extracts username, scopes, avatar.
   - Cap check: count existing connectors against tier limit; reject with `connector_cap_reached` if at cap.
   - INSERT `conduit_connectors` with `credential_encrypted = pgp_sym_encrypt(token, $env_key)`, `credential_meta = { username, scopes, avatar_url }`, `status = 'connected'`.
   - Default grants: INSERT `conduit_connector_grants` rows per `registry.ts` (GitHub default = Engineering).
5. Response: `{ connector_id, credential_meta, granted_to: ["engineering"] }`. **Token NOT in response.**
6. UI: drawer closes; tile flips to `Connected · @<username>`; grant chips render.

### 4.7 Tool call: `readRepoFile` mid-chat (Slice 2)

1. User asks Engineering: "what's in src/lib/ai/memory.ts of wpbluiss/conduit-nextjs?"
2. Chat route assembles tools for Engineering: `[readRepoFile, listRepoFiles, searchRepo]` (granted via GitHub connector).
3. `provider.streamComplete({ messages, tools, … })` returns a stream that yields a `tool_use` event for `readRepoFile({ owner: "wpbluiss", repo: "conduit-nextjs", path: "src/lib/ai/memory.ts" })`.
4. Chat route accumulates the tool_use args; invokes `tool-runtime.runTool("readRepoFile", args, ctx)`.
5. Tool implementation: `getCredential()` → SQL `SELECT pgp_sym_decrypt(credential_encrypted, $env_key) FROM conduit_connectors WHERE id = $1` → Octokit `repos.getContent`.
6. Result string sent back as `tool_result` content block in a follow-up `messages.stream` call.
7. Model produces a final text turn referencing the file content.
8. Chat UI renders an inline pill: "Engineering read `src/lib/ai/memory.ts` from `wpbluiss/conduit-nextjs`."
9. `conduit_messages.metadata` records the tool call shape (name, args, success).

---

## 5. State invariants

- **Memory scope is the only source of truth for "who sees what."** Tags are UX-only; never used for routing.
- **Locked memories are immutable to Atlas.** Only user can change them.
- **Pinned memories always make it into the prompt.** Even when the regular char budget would skip them.
- **Connector credentials never reach TS land.** They are decrypted in SQL only at tool-call time and passed directly to the upstream API client. They are never stored in component state, sent in HTTP responses, or logged.
- **Connector grants are per-(connector, employee).** Tools resolve via `connector_id × employee_id` lookup; no tool runs without a grant.
- **The encryption key (`CONNECTOR_CREDENTIAL_KEY`) is required.** Missing key = connector verify endpoint fails closed with a clear operator message.
