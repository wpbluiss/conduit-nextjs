# Phase 0 Research — Memory + Connectors

**Date**: 2026-05-23
**Status**: Phase 0 complete

Eight decisions consulted at plan time. Each names what was investigated,
what was decided, and what was explicitly rejected.

---

## R-001 — Slice split (memory before connector)

**Question**: Ship memory + connectors together or split?

**Decision**: **Split.** Slice 1 (memory) ships and is preview-validated
before Slice 2 (GitHub connector) begins. **Locked by user** at GATE 2
2026-05-23.

**Investigation**: Memory is mostly-shipped infrastructure being promoted +
extended. Slice 1 is ~250–400 LoC, one migration, zero new architecture.
Slice 2 introduces tool-calling — the biggest architectural step in the
repo since voice. Bundling would couple a fast win to a slow architecture
shift.

**Rejected**: Coupled ship. Risk of one slice's delays blocking the other.

---

## R-002 — Cinema URL shape, memory surface URL shape

**Question**: Where does the memory surface live?

**Decision**: **`/app/memory`** as a top-level route, mirroring how
`/app/voice` and `/app/builds` are top-level. The existing
`/app/settings/memory` becomes a server-side redirect. **Locked by user**.

**Rejected**: Keep at `/app/settings/memory`. Memory is a primary curation
surface, not a settings sub-tab — burying it under chrome is wrong for the
user's framing.

---

## R-003 — Memory scope storage shape

**Question**: How is per-department scoping stored?

**Decision**: **Join table** `conduit_memory_scope (memory_id, employee_id)`.
ZERO rows for a memory = global (visible to everyone). 1+ rows = scoped to
those depts. **Lean per user**; locked at GATE 2.

**Investigation**: Three options:
- (a) `scope text[]` column on `conduit_memory` — simplest, but a Postgres
  text[] has no foreign-key constraints against employee ids, so typos
  go undetected.
- (b) Join table (PICKED). Multi-dept naturally; FK-ish (employee_id is
  text, sourced from `EMPLOYEE_ORDER` — could add a check constraint).
  Indexable.
- (c) Reuse `tags` (`scope:engineering`) — conflates UX-tags and routing-tags.

**Rejected**: (a) and (c). (a) lacks integrity; (c) is a UX/security
anti-pattern (a user adding a tag accidentally re-scopes).

**Chat-route query** (verified at plan time):

```sql
-- Atlas (jarvis): all memories
SELECT * FROM conduit_memory
WHERE account_id = $1 AND archived_at IS NULL
ORDER BY created_at DESC LIMIT 60;

-- Other employee X: global OR scoped to X
SELECT m.* FROM conduit_memory m
WHERE m.account_id = $1
  AND m.archived_at IS NULL
  AND (
    NOT EXISTS (SELECT 1 FROM conduit_memory_scope WHERE memory_id = m.id)
    OR EXISTS (SELECT 1 FROM conduit_memory_scope WHERE memory_id = m.id AND employee_id = $2)
  )
ORDER BY m.created_at DESC LIMIT 60;
```

Index needed: `conduit_memory_scope(memory_id)` covers the EXISTS subqueries.

---

## R-004 — Encryption at rest: pgcrypto vs Supabase Vault

**Question**: How are connector credentials stored?

**Decision**: **pgcrypto.** Migration declares `CREATE EXTENSION IF NOT
EXISTS pgcrypto` (Supabase enables natively); credential column is
`bytea` storing `pgp_sym_encrypt(token, $key)`. Key lives in
`CONNECTOR_CREDENTIAL_KEY` Vercel env var. **Locked at plan time per user
directive** ("your call, justify in the plan").

**Investigation**:

| Axis | pgcrypto | Supabase Vault |
|---|---|---|
| Where it lives | pg extension, available natively | Supabase-managed service |
| Access pattern | `pgp_sym_decrypt(col, key)` in your own SELECT | `vault.decrypt_secret(secret_id)` RPC |
| Per-user credentials | Native fit (column per row) | Awkward (one Vault secret per user requires lots of vault.secrets rows) |
| Key location | App env var (Vercel) | Managed by Supabase |
| Key rotation | Manual migration | Managed feature |
| Existing repo pattern | New, but rhymes with `ENGINEERING_WORKER_SECRET` env-var convention | None |
| Audit by inspection | `SELECT credential_encrypted FROM conduit_connectors` → visible bytea | `SELECT * FROM vault.decrypted_secrets WHERE …` |

**Rejected**: Supabase Vault. Sweet spot is service-side secrets (a single
shared API key the app reads); our case is per-user user-controlled
secrets that the app reads per chat turn. Vault adds indirection without
a security upgrade for our use case.

---

## R-005 — OAuth vs PAT for first connector

**Question**: Real OAuth flow or PAT-paste for GitHub?

**Decision**: **PAT (Personal Access Token) paste.** **Locked by user.**

**Investigation**: OAuth is production-correct (no token in user's
clipboard, scoped consent, easy revoke). PAT is operationally simpler:
zero GitHub App registration, zero callback URL allowlist, zero secret
rotation on our side. User wants to use this today; PAT ships in a day.

**Rejected**: OAuth-only. Adds 1–3 days for App registration + callback
routes + state-CSRF. Worth doing later (P2 maybe), not blocking the first
slice.

**UI guarantee**: The PAT-paste input is `<input type="password"
autocomplete="off">`, sits inside a focused drawer (not a chat surface),
and the token is sent immediately to `/api/conduit/connectors/github/verify`
which encrypts + stores it; the API response does NOT echo the token back.
Token never appears in chat history, conversation logs, or any client-side
state that survives the verify call.

---

## R-006 — First connector pick

**Question**: GitHub, Gmail, Drive, Supabase — pick one.

**Decision**: **GitHub.** **Locked by user.**

**Rationale** (sourced from spec.md Assumption 7):
1. Engineering already touches GitHub (`conduit_engineering_sessions.github_repo`). Adding READ closes the loop.
2. Use cases are concrete and immediate.
3. Privacy stakes are lower than email/calendar.
4. Clean dept-scope model (Engineering granted by default; Marketing not).

---

## R-007 — Tier gating on connectors

**Question**: Free tier connector access?

**Decision**: **Free gets 1 connector, Pro unlocks more.** **Locked by user.**

**Enforcement** (Slice 2):
- `/api/conduit/connectors/github/verify` checks the connector count for the account against tier.
- Tier limits:
  - Free: 1 connector.
  - Pro: 5 connectors.
  - Enterprise: unlimited.
  - Internal account: unlimited.
- Error response on cap reached: `{ error: "connector_cap_reached", message: "Free plans get 1 connector — upgrade to Pro for more." }`.

---

## R-008 — Tool-calling agentic loop bound

**Question**: How many tool-use turns max per user message?

**Decision**: **Max 5 tool-use turns.** Locked at plan time.

**Investigation**: Anthropic's tool-use can in principle loop indefinitely
(model decides to call another tool based on prior result). Pragmatic
ceiling needed to:
- prevent token-bleed runaway (each turn replays full history)
- prevent UI confusion (user staring at "thinking…" for 90 seconds)
- bound spend per message

5 turns covers: "list files → search for X → read file A → read file B → answer."
Beyond that the model should answer with what it has + suggest a follow-up
question.

**Rejected**: Unbounded. Token-bleed risk + UX risk.

**Failure mode at limit**: After 5 tool-use turns without a final response,
the chat route forces a final text-only turn ("based on what you've
gathered, answer the user") and surfaces a small "5-tool limit reached"
attribution pill in the UI.
