# Feature Specification: Memory & Connectors — The Operator's Desk

**Feature Branch**: `feat/memory-and-connectors`
**Created**: 2026-05-23
**Status**: Draft — awaiting GATE 1 approval
**Round**: R17 (succeeds R16 engineering-build-trust)

**Input**: Luis wants direct control of (1) what Praxis knows about his
business — across departments and globally — and (2) which of his real tools
Praxis can read from. The current state is asymmetric: memory exists and is
real; connectors are 100% aspirational. This spec scopes the path to a
unified "operator's desk" — one control plane where Luis curates the AI's
knowledge and grants the AI access to his external systems.

---

## Background — what's real vs. what's mocked

> The user's explicit GATE 0 ask: read the code, name what already works and
> what's vapor before designing.

### Memory — REAL and shipped (R10)

| Element | State | Notes |
|---|---|---|
| `conduit_memory` table | REAL | Migration `012_conduit_memory.sql`. Columns: `id, account_id, kind ENUM(fact, preference, decision, goal, context), content, tags[], source_conversation_id, source_message_id, written_by, created_at, updated_at, archived_at, superseded_by`. Owner-RLS-scoped. Two indexes (account+created_at-desc, account+kind), both `WHERE archived_at IS NULL`. |
| `/app/settings/memory` UI | REAL | Inside the Settings tab system (`SettingsTabs.tsx:469-863`). User can add, edit content + tags inline, archive (soft-delete), unarchive (toggle "Show archived"), filter by kind, see cap progress (`12 / 200`). |
| `/api/conduit/memory` (GET, POST) | REAL | List + create; cap-enforced at POST; tier cap from `tierById(account.tier_id).memoryCap` (free 25, pro 200, enterprise 1000, internal 5000). |
| `/api/conduit/memory/[id]` (PATCH, DELETE) | REAL | Edit + soft-delete. |
| Atlas `[REMEMBER]` / `[SUPERSEDE]` writer | REAL | `src/lib/ai/memory.ts:75-111` parser + `:180-199` Atlas-only instructions. Only Atlas writes via tags — verified by the singleton import in `src/lib/ai/employees/jarvis.ts:6`. |
| Memory injection into every employee's prompt | REAL | `chat/route.ts:146-159` loads + trims to ~1000 tokens; `:479` injects `memoryBlock + withTime` ahead of every employee turn (not just Atlas). |
| Voice → memory bridge | REAL endpoint, partial wiring | `/api/voice/memory-write/route.ts` is implemented and HMAC-auth'd to the worker. Writes attributed to `'jarvis'`. Auto-tags with `voice_session:<id>`. The worker-side summarizer that calls it is in the engineering-voice-worker repo (out of this repo's scope). |
| Tier-based memory cap | REAL | Migration adds `memory_cap` to `conduit_pricing_tiers`; runtime checks in `/api/conduit/memory` POST. |

### Memory — NOT YET (what this spec adds)

| Gap | Why |
|---|---|
| **Per-department scoping** | Today every memory is *global* — all 9 employees see all rows. There's no `department_scope` column and no UI to scope a memory to one or more employees. |
| **User-curated pinning / locking** | A user can't pin a memory as "always include in prompts even when budget tight" or lock it from Atlas's `[SUPERSEDE]`. |
| **Source attribution surface** | `source_conversation_id` + `source_message_id` are stored but never shown — the user can't "click through to the chat where Atlas learned this." |
| **Top-level surface promotion** | Memory lives buried under `/app/settings/memory`. The user asked for "a Memory surface" — implying a primary nav-level destination, not a settings sub-tab. |
| **Bulk import (paste a brief)** | Today every memory is added one-at-a-time. Luis often has a paragraph or a doc that should seed dozens of memories at once. |

### Connectors — 0% REAL

| Search | Result |
|---|---|
| `/api/*/oauth`, `/api/*/callback`, `/api/*/connectors` route handlers | None. |
| `conduit_oauth_*`, `conduit_connectors`, `conduit_credentials` tables | None. |
| OAuth / API-credential code in `src/lib/` | None. |
| MCP server clients (claude.ai's Supabase / Gmail / Drive / Vercel servers) in the Praxis runtime | None — those MCPs are dev-time tooling for the human operator (me/Claude in this session), not consumed by Praxis at runtime. |
| Settings tab for "Integrations" or "Data Sources" | None. `/app/settings/team` is a stub with copy "Coming soon — Personality tuning." |
| Per-employee data source configuration | None. Employees see only the global memory block. |
| Marketing copy mentioning integrations | Aspirational. `STRATEGY.md:202` and `briefs/CONDUIT_BRIEF_R1_2026-05-06.md:202` list "integrations" as something Engineering *can build for you* (i.e., custom Engineering work). `engineering.ts` / `ops.ts` employee prompts include the line *"For external integrations (Google Calendar, scheduling tools), say: 'I'll lay out the structure — real integration comes in the next update.'"* — i.e., employees are explicitly instructed to defer-and-describe, not execute. |

**Verdict**: Connectors are greenfield. Zero credential storage, zero OAuth
flows, zero data-source UI, zero per-employee tool-use plumbing. The
Engineering employee ships builds *to* GitHub via the Railway worker
(`github_repo` is a column on `conduit_engineering_sessions`), but Praxis
itself does not authenticate as the user against GitHub — the worker uses
its own deploy credentials.

### What this means for the spec

Memory is mostly shipped; the deliverable is **promotion + per-department
scoping + curator affordances** on top of existing real infrastructure.

Connectors is **net-new infrastructure**: schema, OAuth (or PAT), credential
storage with strict RLS + encryption-at-rest, a connector registry,
per-employee tool-use plumbing, a UI surface. The smallest honest P1 is
ONE connector working end-to-end. I recommend **GitHub** as the first
connector (rationale in Assumption 7).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — I can curate what Praxis knows, per-department + global (Priority: P1)

Luis lands on a new top-level **Memory** surface in the console (promoted
out of Settings). He sees what Praxis knows — separated into a global
"Everyone knows" bucket and per-department buckets (Marketing-only,
Sales-only, Engineering-only, etc.). He can add a new memory, scope it to
one or more departments or leave it global, edit it inline, archive it,
and click through to the conversation where Atlas wrote it (if Atlas wrote
it). Every change immediately affects the next chat turn.

**Why this priority**: this is half the user's explicit ask. Memory is the
load-bearing context Praxis uses on every turn; the user wants direct,
visible, surgical control of it. The existing global-only model means every
employee sees every memory — including marketing brand voice notes
Engineering doesn't need, or contract terms Marketing doesn't need to
think about.

**Independent Test**: Add a memory scoped to "Marketing only." Open chat
with Marketing — confirm the memory is in their context (e.g., they
reference it). Open chat with Sales — confirm the memory is NOT in their
context. Switch the memory to global. Confirm Sales now sees it.

**Acceptance Scenarios**:

1. **Given** the user opens `/app/memory` (new top-level URL), **When** the page renders, **Then** they see a "Global" section and 9 collapsible department sections (one per employee in `EMPLOYEE_ORDER`), each with its own memory cards and a count. Empty sections render an inviting "Nothing scoped to <dept> yet — drop a fact" affordance, not blank space.
2. **Given** the user adds a memory and picks a scope ("Marketing only" or "Marketing + Sales" or "Everyone"), **When** they submit, **Then** the memory persists with the scope and immediately appears in the right section.
3. **Given** an existing global memory, **When** the user re-scopes it to "Engineering only," **Then** subsequent chat turns with Marketing no longer surface it and Engineering still does.
4. **Given** a memory written by Atlas with a `source_conversation_id`, **When** the user clicks its "Where Atlas learned this" affordance, **Then** they navigate to `/app?c=<id>` at the relevant turn (best-effort scroll).
5. **Given** the user pastes a multi-line briefing into a "Bulk import" textarea, **When** they hit "Parse with Atlas," **Then** Atlas extracts candidate memories with proposed kind + scope, presents them as a review list, and the user accepts/edits/rejects each before insertion. Cap is enforced on the accept step.
6. **Given** a memory the user wants to lock, **When** they toggle "Lock this," **Then** Atlas's `[SUPERSEDE]` parser will skip that row (server-side guard in the chat route's memory-write handler).
7. **Given** the user pins a memory, **When** the prompt trimmer runs (`trimMemoriesForPrompt`), **Then** pinned rows are included even if the char budget would otherwise drop them.
8. **Given** any memory regardless of scope, **When** Atlas is the active employee, **Then** Atlas sees ALL memories (Atlas is the chief-of-staff router; scope-filtering is for the routed employee, not for Atlas's overview).
9. **Given** a memory scoped to dept X, **When** the user is talking to Atlas and Atlas routes to dept Y (different from X), **Then** Y receives only Y-scoped + global memories.
10. **Given** the user opens `/app/memory` on a 375 px viewport, **When** the surface renders, **Then** sections collapse to single-column, add affordances are tappable (≥ 44 px), and bulk-import textarea is full-width.

---

### User Story 2 — I can connect GitHub and Engineering can read my repos (Priority: P1)

Luis opens a new top-level **Connectors** surface in the console. He sees
a tile for **GitHub**. He clicks "Connect," walks through GitHub's OAuth
consent (or pastes a Personal Access Token for early-access), and the tile
flips to "Connected · <github-username>." He then opens chat with
**Engineering** and asks: "Look at my Lunaro repo and tell me what you'd
refactor first." Engineering — with the connector active — actually reads
the repo and answers from real code, not a scaffold.

**Why this priority**: this is the OTHER half of the user's ask, and it's
the load-bearing proof point that "connectors" are real and not vapor. One
connector working end-to-end >>> ten connector UIs with no plumbing. GitHub
is the right first connector (Assumption 7).

**Independent Test**: From a clean account, follow the connect flow,
confirm the credential persists across page refreshes, talk to Engineering
about a real repo on the connected account, verify Engineering's response
quotes actual file paths / lines from the repo (not hallucinated).

**Acceptance Scenarios**:

1. **Given** the user opens `/app/connectors` (new top-level URL), **When** the page renders, **Then** they see at least one connector tile (GitHub) with status `Not connected` and a `Connect` CTA.
2. **Given** the user clicks `Connect`, **When** the OAuth flow completes (or the user pastes a valid PAT), **Then** the credential is encrypted at rest in a new `conduit_connectors` table (Constitution Principle II — full `conduit_*` namespace, full RLS), and the tile flips to `Connected · @<github-handle> · <repo-count> repos accessible`.
3. **Given** GitHub is connected, **When** the user opens chat with Engineering and asks about a repo, **Then** Engineering's runtime has a `readRepo(owner, name, path?)` tool available (or equivalent), uses it transparently, and quotes from the actual code in its response.
4. **Given** GitHub is connected, **When** the user opens chat with Marketing (a department that has NO GitHub tool grant), **Then** Marketing does NOT have the tool available — it cannot read the repo even if asked. This is the per-department tool-grant invariant.
5. **Given** the user disconnects GitHub from the Connectors surface, **When** the disconnect completes, **Then** the credential is destroyed (not just marked inactive), Engineering loses tool access immediately, and any in-flight chat that was relying on the tool surfaces a graceful "connection was removed" error.
6. **Given** GitHub OAuth fails or the user denies consent, **When** the callback fires, **Then** the user lands back on `/app/connectors` with a clear error message and the tile still shows `Not connected`.
7. **Given** a connected GitHub credential expires or is revoked upstream, **When** Engineering's next tool call fails with a 401 from GitHub, **Then** the connector tile auto-flips to `Reconnect required` and the chat surface shows a translated error pointing to the Connectors surface.
8. **Given** the user is on the free tier, **When** they try to connect GitHub, **Then** they see a tier-gated upsell ("Connectors require Pro") — OR the gating policy is explicitly "free tier gets 1 connector" (decision deferred to Assumption 6).
9. **Given** Constitution Principle III (no provider names in `/app/*`), **When** any connector surface renders, **Then** real third-party names (`GitHub`, `Gmail`, `Google Drive`, `Supabase`) ARE allowed because they are the user's own external systems, not AI providers. Principle III scopes to AI-model providers (Claude/Anthropic/OpenAI/ElevenLabs/LiveKit), not user-facing integrations.

---

### User Story 3 — I can see what each department can touch (Priority: P1)

On the new **Connectors** surface, Luis can see — per department — which
connectors that department has access to. He can revoke or grant access
per (department × connector) pair. Engineering can have GitHub but not
Gmail. Marketing can have Gmail but not GitHub. The grants are
visible at a glance.

**Why this priority**: this is part of the user's framing ("Connectors so
**departments** can read my data") and the load-bearing security model
for tool-use. Without per-department grants we either give everyone
everything (privacy hazard) or no one anything (no value). The grant
surface is the user's primary control over what their AI workforce can
touch.

**Independent Test**: With GitHub connected, default access for
Engineering. Toggle off Engineering's access. Confirm Engineering's chat
no longer has the tool. Toggle ON Marketing's access (unusual but
testable). Confirm Marketing's chat has the tool available.

**Acceptance Scenarios**:

1. **Given** a connected GitHub credential, **When** the user views the GitHub tile, **Then** they see a "Departments with access" row showing 9 employee chips, each visually marked granted/denied (default: Engineering granted, all others denied).
2. **Given** a department chip, **When** the user clicks it, **Then** the grant toggles (immediate persist; no save button — server confirms with a subtle pulse on the chip).
3. **Given** an employee with no grant for a given connector, **When** that employee's chat session loads, **Then** the connector's tool is NOT included in the model's tool list.
4. **Given** an employee with a grant, **When** the chat session loads, **Then** the tool IS included in the model's tool list. (The recommended-default grants per connector are sourced from `connector-registry.ts` — Connector spec contract.)
5. **Given** zero connectors are connected, **When** the surface renders, **Then** the per-department grant rows are absent (nothing to grant) and the tiles show the connect CTA.

---

### User Story 4 — Memory + Connectors talk to each other (Priority: P2)

A memory can reference a connector (e.g., "My main repo is `wpbluiss/lunaro`")
and Engineering, when reading that memory, knows it can fetch from the
GitHub connector. The cinema's existing memory block extends slightly:
when a memory contains a connector reference, it renders as a small chip
showing both the fact and the linked tool.

**Why this priority**: P2 because it composes existing primitives. Lands
naturally after P1A + P1B. Adds discoverability — the user can see WHY a
memory matters by what it unlocks.

**Independent Test**: With GitHub connected and a memory like "My main
repo is `wpbluiss/lunaro`," ask Engineering "what's in there?" Engineering
should pick up the repo reference from the memory AND use the GitHub tool,
without the user re-stating the repo.

**Acceptance Scenarios**:

1. **Given** a connected connector and a memory that mentions a connector-relevant value, **When** the memory renders on the Memory surface, **Then** the connector pill is shown alongside ("via GitHub").
2. **Given** the same memory and a chat turn, **When** the agent has both the memory and the tool, **Then** the agent uses the memory's content as a hint for tool-call arguments (e.g., the repo name).

---

### User Story 5 — Gmail as the second connector (Priority: P2)

The Connectors surface includes a Gmail tile. Marketing, Sales, HR, and
Atlas have default grants; Engineering does not. OAuth flow lands a real
Google credential with `gmail.readonly` scope. Marketing can answer "what
did the prospect say in our last email thread?" from real Gmail data.

**Why this priority**: P2 because P1B's GitHub proves the connector
architecture. Gmail is the broadest second connector (4 employees default-
granted vs. 1). Tackled after the connector primitives are stable.

**Independent Test**: Same shape as US2 but for Gmail. Connect →
authorize → ask Marketing about an email thread → confirm real Gmail data
in the response.

**Acceptance Scenarios**: as US2, with `GitHub` substituted by `Gmail` and
the default-granted set being `{marketing, sales, hr, jarvis}`.

---

### User Story 6 — Bulk-import a brief (Priority: P2)

Luis pastes a one-page brief — his business model, his Lunaro positioning,
the people he reports to, the metrics he tracks — into a "Bulk import"
field on the Memory surface. Atlas (running in extract-only mode) returns
a structured list of candidate memories with proposed kind + scope. Luis
reviews the list, edits or drops any row, and clicks "Save all" to persist
the surviving rows in one transaction.

**Why this priority**: P2 because P1A's per-memory CRUD is already
sufficient for a working surface. Bulk import is a 5x productivity unlock
once the surface is live.

**Independent Test**: Paste 5–10 lines of business context. Confirm Atlas
proposes 5–10 candidate memories. Edit one, drop one, save the rest.
Confirm the saved ones appear in the Memory surface immediately and feed
the next chat turn.

**Acceptance Scenarios**:

1. **Given** the bulk-import textarea, **When** the user submits text ≥ 40 chars, **Then** the server proxies the text to an Atlas extraction call (no [REMEMBER] tag parser — direct structured output) and returns N candidate `{kind, content, scope[]}` records.
2. **Given** the candidate list, **When** the user edits / drops / reorders, **Then** the changes are local until they hit "Save."
3. **Given** "Save," **When** the request fires, **Then** the server inserts all surviving rows atomically with `written_by="user (via bulk import)"`, respecting the cap.
4. **Given** the cap is hit mid-batch, **When** the server detects it, **Then** it inserts as many as fit and returns a clear "X saved, Y skipped — cap reached" response.

---

### User Story 7 — Source attribution panel (Priority: P3)

Every memory written by Atlas has a "Where Atlas learned this" link.
Clicking it opens a panel showing the source conversation + the specific
turn that triggered the write.

**Why this priority**: P3 because the data is already stored
(`source_conversation_id`, `source_message_id`) but not surfaced. Quality-of-life
for power users; not load-bearing for either primary feature.

**Independent Test**: Click "Where Atlas learned this" on a memory. Confirm
the panel renders with conversation title + the matching message highlighted.

---

### Edge Cases

- **Per-department scope is empty (no department selected, not "everyone" either)** — server rejects with `scope_required` error.
- **All 9 departments selected** — collapses to a "global" scope display (avoids visual clutter; canonically still stored as `{global: true}` rather than 9 dept-rows).
- **Atlas memory writer with a department-scope hint** — Atlas's `[REMEMBER]` tag is extended to accept an optional `scope: <dept>` (or `scope: global`). Default when missing: `global`. Backward-compatible.
- **Tier downgrade with too many memories** — existing rows stay, new writes fail until archive (cap message names it).
- **Connector credential storage** — never in plaintext. Token encryption-at-rest via Supabase Vault (or `pgcrypto` symmetric encryption keyed off a server-side secret). Constitution Principle II + a new operational standard.
- **OAuth state CSRF** — the OAuth `state` parameter is signed with the existing `CONDUIT_WORKER_SECRET` or equivalent; verified on callback.
- **Connector tool errors** — translation layer mirroring `error-translation.ts` from engineering-build-trust. A failed `readRepo` call surfaces in chat as "Engineering tried to read your repo but couldn't — it might be private or the connection expired," not a raw 404.
- **Memory containing PII** — the user is the source of truth; we do not lint or scrub their input. We DO clearly state in the bulk-import flow that the text is sent through Atlas (Claude) for extraction.
- **Free tier connector access** — see Assumption 6.
- **Mobile sweep at 375 px / 390 px** — Constitution Principle V.
- **Light / dark theme parity** — Constitution Principle V.
- **Reduced-motion preferences** — all surface motion gated.
- **Atlas writes a memory with scope=engineering but Engineering is currently locked behind tier gate** — memory still persists; only renders when the dept is unlocked. No special-case at write time.

---

## Requirements *(mandatory)*

### Functional Requirements

**Memory (P1A)**

- **FR-001**: System MUST add a `scope` field to memory rows expressing "global" or "scoped to one-or-more employees in `EMPLOYEE_ORDER`." Storage shape TBD at plan time (column on `conduit_memory` OR a normalized join table OR a structured-tags convention) — the spec does NOT lock the implementation.
- **FR-002**: System MUST extend the chat-route memory loader to filter by the active employee — Atlas sees all, every other employee sees `global + their-dept-scoped`.
- **FR-003**: System MUST surface a new top-level `/app/memory` route with a Global section and 9 collapsible department sections. The existing `/app/settings/memory` redirects to `/app/memory` for backward compat.
- **FR-004**: Users MUST be able to add a memory with explicit scope selection in the same form. UI affordance: a department picker (default "Everyone" / global) with multi-select chips.
- **FR-005**: Users MUST be able to re-scope an existing memory inline (no full-form re-edit).
- **FR-006**: System MUST support an Atlas-extension to the `[REMEMBER]` and `[SUPERSEDE]` tags allowing optional `scope: <dept>|global`. Existing tag shapes remain valid (default `global`).
- **FR-007**: Users MUST be able to `pin` a memory; pinned memories are included in prompt-trim even when the char budget would otherwise drop them.
- **FR-008**: Users MUST be able to `lock` a memory; locked memories are NEVER overwritten by Atlas's `[SUPERSEDE]` (server-side guard in `chat/route.ts`).
- **FR-009**: System MUST surface a "Where Atlas learned this" link on every memory whose `source_conversation_id` is set (Phase 2 of US7 wires the panel).
- **FR-010**: Users MUST be able to paste a multi-line brief and receive a list of candidate memories extracted by Atlas (US6 / Phase 2).
- **FR-011**: System MUST display per-section counts AND a total against the tier cap (`12 / 200` style).

**Connectors (P1B + P1C)**

- **FR-012**: System MUST introduce a `conduit_connectors` table holding `id, account_id, kind (e.g. "github", "gmail"), credential_encrypted, credential_meta jsonb, status, last_used_at, created_at, updated_at`. Owner-RLS-scoped. Credentials encrypted at rest (Supabase Vault or `pgcrypto`).
- **FR-013**: System MUST introduce a `conduit_connector_grants` table (or equivalent shape) holding `account_id, connector_id, employee_id, granted_at` — the per-department grant matrix. Owner-RLS-scoped.
- **FR-014**: System MUST surface a new top-level `/app/connectors` route listing available connector tiles with status (`Not connected`, `Connected · <handle>`, `Reconnect required`, `Error: <human-readable>`).
- **FR-015**: System MUST implement OAuth (preferred) OR PAT-paste (acceptable early-access fallback) for the P1 GitHub connector. The flow is: `/api/conduit/connectors/github/start` → external consent → `/api/conduit/connectors/github/callback` → encrypted-credential insert → `/app/connectors` with the tile flipped.
- **FR-016**: System MUST sign the OAuth `state` parameter with a server secret and verify it on callback (CSRF protection).
- **FR-017**: System MUST expose a `getConnectorClient(account, employee, kind)` helper that returns a configured client (e.g. an octokit instance for GitHub) ONLY when (a) the connector is connected, (b) the employee has a grant for that connector, and (c) the credential is non-expired. Returns null otherwise.
- **FR-018**: System MUST inject connector-derived tools into the chat-route's model call ONLY for employees with grants. The Engineering tool list with GitHub granted includes (at minimum) `readRepoFile`, `listRepoFiles`, `searchRepo`.
- **FR-019**: System MUST disconnect a connector destructively (DELETE on `conduit_connectors`, cascade to `conduit_connector_grants`) — no soft-delete for credentials. Disconnect is irreversible (user must reconnect).
- **FR-020**: System MUST translate connector tool errors into human-readable surfaced messages (mirroring `error-translation.ts` from engineering-build-trust); 401/403 → "Reconnect required"; 404 → "Couldn't find the repo / thread"; 5xx → "GitHub is having a moment, try again."

**Tool-use plumbing**

- **FR-021**: System MUST extend the chat route (`/api/conduit/chat`) to assemble the per-turn tool list dynamically per (employee, granted connectors) — currently the chat route does NOT pass tools to the model (it's all text-completion). This is net-new plumbing.
- **FR-022**: System MUST persist tool-call events as `conduit_messages` metadata so the conversation history captures what tools the AI invoked and with what arguments. Storage shape: extend the existing `metadata jsonb` column (no new migration needed for the message-side).
- **FR-023**: System MUST surface tool calls in the chat UI as inline pills ("Engineering read `app/page.tsx` from `wpbluiss/lunaro`") so the user knows what data the AI actually saw.

**Cross-cutting**

- **FR-024**: All new `/app/*` routes MUST honor Constitution Principle III (no AI-provider strings) but ARE allowed to render real third-party service names (GitHub, Gmail) because those are the user's own external systems, not concealed AI-model providers.
- **FR-025**: All new surfaces MUST render legibly at 375 px and 390 px (Constitution V mobile sweep).
- **FR-026**: All new surfaces MUST respect `prefers-reduced-motion` (mirroring R15/R16 motion vocabulary).
- **FR-027**: All new surfaces MUST render correctly in light and dark themes.

### Key Entities

- **Memory** — existing row in `conduit_memory` extended with a `scope` shape (TBD storage at plan time). Scope is the only new dimension; everything else (kind, content, tags, written_by, archived_at, superseded_by, source_*) carries forward.
- **Connector** — new entity in `conduit_connectors`. One per (account, third-party kind). Holds the encrypted credential + metadata (e.g., username, scopes granted).
- **Connector Grant** — new entity in `conduit_connector_grants`. Many-to-many between (connector, employee). The matrix of "which department can call which tool."
- **Tool** — a code-side abstraction (not a DB entity). Each connector exposes 1+ tools (e.g., GitHub: `readRepoFile`, `listRepoFiles`, `searchRepo`). The tool registry lives in `src/lib/connectors/<kind>/tools.ts` (path TBD at plan time).
- **Atlas extract result** — transient (not persisted) — the structured output of the bulk-import Atlas pass. User reviews → accepts → persists.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can land on `/app/memory`, add a memory scoped to "Marketing only," and confirm via chat that Marketing's response references it AND Sales's response does not — within 2 minutes of landing.
- **SC-002**: 9/9 employees + global section render with non-empty empty-state copy when their bucket is empty — no blank slots.
- **SC-003**: A user can connect GitHub on the Connectors surface, hit Engineering with a real repo question, and receive a response that quotes ≥ 1 line of real code from the connected repo. Verified manually on a known repo (`wpbluiss/lunaro` or any real repo on Luis's GitHub account).
- **SC-004**: Per-department grant toggles persist across page refreshes within 500 ms of click (no save button).
- **SC-005**: A revoked GitHub credential surfaces "Reconnect required" within the next chat turn that would have used the tool.
- **SC-006**: Memory writes from the new bulk-import flow persist with `written_by="user (via bulk import)"` and respect the tier cap with a graceful partial-save when the cap is hit.
- **SC-007**: Zero `Claude`/`Anthropic`/`OpenAI`/`Sonnet`/`Opus`/`Haiku`/`ElevenLabs`/`LiveKit` strings on any new surface (Constitution III) — verified by grep at PR time.
- **SC-008**: Real third-party service names (`GitHub`, `Gmail` once it lands) DO render — that is correct, not a violation, because they are user-facing external systems.
- **SC-009**: All new surfaces pass the 375 px + 390 px + light + dark + reduced-motion sweep per `quickstart.md` matrix at plan time.
- **SC-010**: Credential encryption at rest is verified by querying the DB directly (`SELECT credential_encrypted FROM conduit_connectors LIMIT 1`) and confirming the returned value is not a plaintext token.
- **SC-011**: Per-department prompt assembly verified by chat-route unit-of-behavior — Atlas sees N memories; Marketing sees only `global + marketing-scoped`; an employee with no scoped memories sees only `global`.

---

## Assumptions

1. **Memory is mostly shipped.** P1A is a UI promotion + per-department dimension + curator affordances (pin/lock/source-link). The underlying CRUD, RLS, tier cap, Atlas writer, and prompt injection are already real and stay as-is.
2. **The chat route does not currently pass tools.** Today's `/api/conduit/chat` is text-completion only; introducing tool-use is net-new plumbing in P1B. This is a meaningful architectural step the plan must size honestly.
3. **The schema choice for memory `scope` is not locked in the spec.** Three viable approaches (NEEDS CLARIFICATION at plan time):
   - **(a) New column** `scope text[]` on `conduit_memory` — simplest; index for prompt-side filtering.
   - **(b) Normalized join table** `conduit_memory_scope (memory_id, employee_id)` with a "global" sentinel row absence.
   - **(c) Reuse `tags`** — `scope:engineering` tag-based filtering — zero migration but conflates UX-tags and routing-tags.
   The plan picks one at GATE 2 with a justification.
4. **Credential encryption mechanism is not locked in the spec.** Supabase Vault is the on-platform choice; pgcrypto is the fallback. The plan picks at GATE 2.
5. **OAuth-vs-PAT for the first connector is not locked.** OAuth is the production-correct path; PAT is the acceptable early-access fallback that ships faster (no app registration on third-party side). The plan picks at GATE 2.
6. **Free-tier connector access is not locked.** Two options:
   - **(a) Connectors require Pro** — clean tier upgrade story.
   - **(b) Free gets 1 connector** — sticky early-access bait.
   Plan picks at GATE 2 with the tier-product implications spelled out.
7. **GitHub is the recommended first connector.** Rationale:
   - **Engineering already touches GitHub** — `conduit_engineering_sessions.github_repo` exists; the worker writes to GitHub on build. Adding READ access closes a loop the user has already seen end-to-end.
   - **Use cases are concrete**: "Iterate on Lunaro," "Refactor the marketing site," "What's in `/src/lib/ai/employees/`?" — all immediate, demonstrable wins.
   - **OAuth scopes are well-defined** (`repo`, `read:user`); PAT fallback is industry-standard for early access.
   - **Privacy stakes are lower than email/calendar** — code is what Luis already deploys publicly via Vercel; email is more invasive.
   - **One employee (Engineering) gets the immediate value** — clean dept-scope grant model.
8. **Gmail is the recommended second connector.** Rationale: broadest reach across departments (Marketing, Sales, HR, Atlas all default-granted); proves the multi-employee grant matrix; familiar OAuth flow.
9. **The Memory surface is promoted to top-level (`/app/memory`), not nested under Settings.** Reason: the user explicitly framed it as "a Memory surface" — implying primary nav. `/app/settings/memory` redirects.
10. **The Connectors surface is similarly top-level (`/app/connectors`).**
11. **No new external dependencies for the connector layer in P1B beyond what GitHub requires.** Likely `octokit/rest` (or `@octokit/core` for a smaller footprint). This re-evaluates Spec Assumption 5 from R16 (which forbade new deps for the cinema work); a connector necessarily needs SOME SDK.
12. **The Atlas extract pass for bulk import (US6 / FR-010) reuses the existing `provider.ts` / Atlas system prompt** with an "extract memories from this brief" mode — no new model, no new SDK.
13. **The R15 premium-redesign tokens are the dominant visual system.** New surfaces consume `--space-*`, `--radius-*`, `--font-serif`, dept tints via `data-dept=`. No new tokens introduced unless absolutely necessary.

---

## Out of Scope

- More than two connectors in P1 (P2 adds Gmail; P3+ adds Google Drive / Supabase / Stripe / others).
- Custom user-built connectors via webhook + schema — that's a future product surface.
- Per-(connector, employee, tool) granularity — P1 is per-(connector, employee). Adding tool-level grants is P3 if it ever matters.
- Connector data caching layer — every tool call hits the upstream API in P1. Caching becomes a question only if rate-limits bite.
- Audit log of every tool call beyond `conduit_messages.metadata` — security audit log is a separate spec when compliance lands.
- Memory versioning / history viewer beyond `superseded_by` chain — current shape is "current view is the truth, archived rows are recoverable."
- Memory export/import between accounts (e.g., for team accounts) — single-user only this round.
- Atlas extract pass for bulk import landing as a streaming surface — P1 is request-response; P2 considers streaming.
- Tool-call confirmation UI ("Engineering wants to read `foo.tsx` — allow?") — not in P1; if it becomes a hazard we add it in P2.
- Per-memory expiry / TTL — not requested; can revisit.
- Multi-account GitHub connections (user belongs to multiple GitHub accounts) — P1 supports ONE connection per (account, connector kind).
- Multi-user account workflow (multi-seat connectors) — single owner_user_id this round.
- Onboarding wizard that walks new users through Memory + Connectors — P1 surfaces are discoverable; an onboarding pass can land later.

---

## Sources & References

Per Constitution Principle 0, every domain reference below is sourced:

| Reference | Source |
|---|---|
| `conduit_memory` schema | `supabase/migrations/012_conduit_memory.sql:1-52` |
| Atlas-only [REMEMBER]/[SUPERSEDE] parser | `src/lib/ai/memory.ts:57-111` |
| ATLAS_MEMORY_INSTRUCTIONS prompt | `src/lib/ai/memory.ts:180-199` |
| Atlas import of memory instructions | `src/lib/ai/employees/jarvis.ts:6` |
| Memory injection into all employee prompts | `src/app/api/conduit/chat/route.ts:146-159,479` |
| Memory trim function | `src/lib/ai/memory.ts:164-173` |
| Memory CRUD API | `src/app/api/conduit/memory/route.ts`, `src/app/api/conduit/memory/[id]/route.ts` |
| Settings Memory tab | `src/components/conduit/SettingsTabs.tsx:469-863` |
| Tier memory caps | `src/lib/billing/tiers.ts:20,36,46,72` |
| Voice → memory bridge | `src/app/api/voice/memory-write/route.ts:1-78` |
| Aspirational connector copy (NOT real) | `STRATEGY.md:202`, `briefs/CONDUIT_BRIEF_R1_2026-05-06.md:202`, `engineering.ts` / `ops.ts` employee prompts |
| Engineering worker GitHub usage (workers-side only) | `conduit_engineering_sessions.github_repo` column, set by Railway worker post-deploy |
| Constitution gates applied | `.specify/memory/constitution.md` v1.0.0 (Principles 0, I, II, III, IV, V, VI) |

---

## Constitution gate notes (informal — formal pass/fail at GATE 2)

- **Principle 0 (Domain Truth)**: Connectors must ship REAL — not "Connect GitHub" tile that does nothing. The P1 GitHub connector either works end-to-end on preview or it isn't shipped. No invented "coming soon" tiles allowed. Memory's per-department scope respects the existing 9-employee roster; no new departments invented.
- **Principle I (Next.js 16)**: New routes follow App Router conventions; `params` Promise pattern preserved. No middleware changes.
- **Principle II (Schema namespacing & Tenant Boundary)**: New tables (`conduit_connectors`, `conduit_connector_grants`, possibly `conduit_memory_scope` if the plan picks option (b)) MUST be `conduit_*` prefixed with RLS enabled in the creating migration. **NEW operational concern**: credential storage requires encryption-at-rest. This is a new precedent for the repo — the plan must lock the encryption strategy and document it.
- **Principle III (Brand Integrity & Provider Concealment)**: AI-model provider concealment (Claude/Anthropic/OpenAI/etc.) preserved. User-facing external service names (GitHub, Gmail) ARE allowed and EXPECTED — they are the user's own systems, not concealed AI providers. Spec FR-024 makes this distinction explicit.
- **Principle IV (Dual-Brand Single-Deploy)**: All new surfaces under `/app/*`. No marketing-route changes. Connector tiles use real third-party logos/wordmarks (GitHub's octocat, Gmail's red envelope) — those are user-facing brand cues, not Praxis brand drift.
- **Principle V (Verification by Preview + Mobile Sweep)**: Material milestone (new schema, new surface, new architectural primitive — tool-use). Produces a dated `SESSION_REPORT_*` per established naming.
- **Principle VI (Push-to-Main)**: Phased rollout (memory promotion → connector primitives → GitHub end-to-end → Gmail) sized for fast-merge cadence; no long branches.

---

## GATE 1 Status

**Status**: Awaiting approval. No plan, no tasks, no code until Luis approves
the spec (or returns feedback for revision).

**For Luis to confirm before GATE 1 close**:

1. **P1 scope** — three coupled P1 stories (US1 per-dept memory + US2 GitHub end-to-end + US3 per-dept grants). All ship together? Or split into a P1A (memory) followed by P1B (connector)?
2. **Memory surface promotion** — `/app/memory` as a top-level route (proposed) vs. keeping it inside Settings (current). I recommend top-level given the user's framing; confirm.
3. **First connector pick** — **GitHub** (my recommendation, rationale in Assumption 7) vs. **Gmail** vs. **Supabase** vs. something else?
4. **OAuth vs. PAT for early-access** — GitHub OAuth requires registering a GitHub App, callback URL, secret rotation (production-correct). PAT-paste ships in a day (early-access friendly). Plan-time pick, but I want your steer now.
5. **Free-tier connector access** — Pro-only (Assumption 6a) vs. free-gets-1 (6b)?
6. **`scope` storage shape** — leave as [NEEDS CLARIFICATION] for the plan (recommended), or lock now? My lean is option (a) new column for query simplicity.
7. **Encryption at rest** — Supabase Vault vs. pgcrypto. Either is fine; plan-time pick.
8. **Bulk import (US6) and source attribution panel (US7)** — keep at P2/P3 respectively, or promote either to P1?
