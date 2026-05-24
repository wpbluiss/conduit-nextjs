# Implementation Plan: Memory + Connectors — The Operator's Desk (R17)

**Branch**: `main` (push-to-main per Constitution Principle VI; short-lived feature branches allowed)
**Date**: 2026-05-23
**Spec**: [`spec.md`](./spec.md) (GATE 1 approved 2026-05-23; 8 decisions locked)
**Round**: R17 (succeeds R16 engineering-build-trust)

**Input**: per the user's GATE 1 directive, this plan ships in two **independent
deployable slices**. Slice 1 is memory (already-real infrastructure promoted
+ per-department scoping + pin/lock). Slice 2 is the GitHub connector (PAT
storage with encryption-at-rest + tool-calling architecture + per-employee
grants). **Slice 1 ships and is preview-validated BEFORE Slice 2 starts.**
The user explicitly does not want a 1-hour polish job bundled with a
multi-hour architecture job.

---

## Summary

### Slice 1 — Memory promotion + per-department scope + pin/lock (deployable today)

Promote the existing R10 memory system out of Settings and into a top-level
`/app/memory` surface. Add a per-department scope dimension (memory can be
**global** — the current behavior — or **scoped to one or more of the 9
employees**). Add **pin** (always include in prompt-trim) and **lock**
(Atlas's `[SUPERSEDE]` cannot overwrite) per-row affordances. Filter the
chat-route's memory injection so every employee except Atlas sees only
`global + their-scoped` memories. **One new migration**, **one new top-level
route**, **~6 new components**, **5 file mods**. Zero new dependencies. Zero
new architectural primitives. **Ships in one merge.**

### Slice 2 — GitHub PAT connector + tool-calling architecture (after Slice 1)

Net-new surface AND net-new architecture. Adds a `conduit_connectors` table
with **pgcrypto-encrypted credential storage**, a `conduit_connector_grants`
table (per-(connector, employee) matrix), a top-level `/app/connectors`
surface, a PAT-paste flow (user enters their own GitHub token in the UI; we
never see it in code or chat), and — critically — the **first tool-calling
architecture in this codebase**. The chat route + provider abstraction
(`src/lib/ai/provider.ts`) currently does text-only completion. Slice 2
extends both to support Anthropic's tool-use API. **Two migrations**, **two
new top-level routes (`/api/conduit/connectors/*` + `/app/connectors`)**, a
tool registry, and the agentic-loop refactor in the chat route. **Ships in
one merge once Slice 1 has been preview-validated.**

---

## Tool-Calling Architecture Risk (flagged per user directive)

This is the **single biggest risk in this plan**. Naming it up-front so it
doesn't surprise anyone at implementation time.

### Today's state (verified at plan time)

- `src/lib/ai/provider.ts:204-238` (`complete()`) and `:240-296` (`streamComplete()`) issue a SINGLE `messages.create` / `messages.stream` call per turn and filter the response to **text content only** (`type === "text"`, `type === "text_delta"`).
- The `CompletionResponse` type returns `content: string` — there is no field for tool calls.
- The chat route (`src/app/api/conduit/chat/route.ts`, 1051 lines) is built around this text-only contract. Streaming, memory injection, tag parsing (`[REMEMBER]`, `[SUPERSEDE]`, `[HANDOFF]`, `[ARTIFACT]`), and conversation persistence all assume a single agentic turn.
- There is **zero existing tool-use plumbing**. No tool registry, no agentic loop, no `tool_use` content-block handling, no `tool_result` send-back path.

### What Slice 2 has to add

1. **Provider abstraction extensions** (`src/lib/ai/provider.ts`):
   - New `tools?: AnthropicTool[]` field on `CompletionRequest`.
   - New `CompletionResponse` shape that returns content blocks (not just text), preserving `tool_use` blocks for the caller to execute.
   - `streamComplete` must yield events for `tool_use` content blocks in addition to text deltas.
2. **Agentic loop** in the chat route:
   - When Anthropic's response includes `tool_use` blocks, the chat route must (a) execute each tool, (b) capture the result, (c) send a follow-up `messages.create` call with the `tool_result` blocks, (d) loop until a turn produces no `tool_use` blocks.
   - Bounded: max N tool-use turns per user message (proposed cap: 5) to prevent runaway loops.
   - Streamed: tool calls and their results should stream to the UI so the user sees the AI thinking + acting in near-realtime, not a 30-second pause.
3. **Tool registry** (`src/lib/connectors/tools.ts` or similar):
   - Maps tool name → `(args, ctx) => Promise<result>` implementation.
   - Schema definitions (JSON Schema per Anthropic's tool spec) for the model.
   - Per-employee filtering: returns only tools the active employee has grants for.
4. **Chat-route persistence**:
   - Tool-call events written to `conduit_messages.metadata` (existing jsonb column) so conversation history shows what tools the AI invoked.
   - Tool calls visible in chat-UI replay (so refreshing the page doesn't lose them).
5. **Chat-UI rendering**:
   - Tool-call pills inline in the chat ("Engineering read `app/page.tsx` from `wpbluiss/lunaro`").
   - Pending-state pill while a tool runs.
   - Error-state pill if a tool fails (translated message, not raw upstream error).

### Risks within the architecture step

- **Streaming + tool-use is tricky.** Anthropic's stream API emits `content_block_start` events for tool_use blocks, then `input_json_delta` deltas accumulating the JSON args. The chat route must accumulate args before executing. Bugs here are subtle.
- **Provider concealment (Constitution III).** Tool-call argument JSON could include strings the model echoes from its own reasoning — including provider names — that then surface in the inline chat pills. Need scrubbing at the pill render layer (mirroring `scrubProviderTells` from R16).
- **Multi-turn cost.** Agentic loops with 5 tool calls per user turn could 5× input-token consumption per message (each subsequent turn replays the full message history including prior tool results). Spend caps may need re-thinking. Out of scope for THIS plan to fix, but called out so the implementer doesn't ship a token-bleed by accident.
- **Tier-aware tool availability.** Tools become a new tier-bound axis. Free tier gets 1 connector → its tools become available; Pro unlocks more. Currently no tier gate on tool execution.
- **No automated tests.** Per Constitution V, no test suite. Verification of the agentic loop is mobile-preview-deploy + manual exercise. Plan-time mitigation: a hidden `/app/debug/tool-test` route in dev-mode only that exercises a synthetic "ping" tool to verify the loop independently of GitHub being connected.

### Mitigation in the plan

- **Slice 1 ships first and validates.** The user can adopt the new memory surface without any tool-use risk on their daily flow.
- **Slice 2 is sub-phased** (see Slice 2 Phasing below): Phase 2.A is the tool-calling architecture + a synthetic test tool (no user-visible product yet); Phase 2.B builds the GitHub connector on top. The user sees the connector tile only after the architecture is proven.
- **Bounded scope inside Phase 2.B**: GitHub gets ~3 tools (`readRepoFile`, `listRepoFiles`, `searchRepo`). Not 20. The connector ships when those work; everything else is P2/P3 of the spec.

This is the only material risk in the plan. Every other architectural piece
follows existing repo patterns.

---

## Technical Context

**Language/Version**: TypeScript 5; React 19.2.4; Next.js 16.2.2 (App Router).
Per Constitution Principle I, the framework version is load-bearing.

**Primary Dependencies** (already installed; Slice 1 adds none; Slice 2 adds
ONE for the GitHub tools — `@octokit/rest` or `@octokit/core`):

- `next@16.2.2`, `react@19.2.4`, `react-dom@19.2.4`
- `@supabase/ssr@0.10.2`, `@supabase/supabase-js@2.105.3`
- `@anthropic-ai/sdk@0.95.0` (Slice 2 exercises tools API — confirmed available in this SDK version)
- `lucide-react`
- `tailwindcss@4` via `@tailwindcss/postcss`
- **Slice 2 NEW**: an Octokit dep (Phase 2.B picks the smallest variant that supports `readRepoFile` / `listRepoFiles` / `searchRepo`). Re-evaluates Spec Assumption 5 from R16 (no new deps) for this round only.

**Storage**: Supabase Postgres (shared instance `mvuslmfjkkuizixjpkgl` with
Lunaro per Constitution Principle II).

- **Slice 1**: ONE new migration (`023_memory_scope_pin_lock.sql`):
  - `ALTER TABLE conduit_memory ADD COLUMN pinned boolean NOT NULL DEFAULT false`
  - `ALTER TABLE conduit_memory ADD COLUMN locked boolean NOT NULL DEFAULT false`
  - `CREATE TABLE conduit_memory_scope (memory_id uuid, employee_id text, PRIMARY KEY (memory_id, employee_id))` — RLS-enabled, owner-scoped via memory_id → conduit_memory → conduit_accounts join.
- **Slice 2**: ONE new migration (`024_connectors.sql`):
  - `CREATE EXTENSION IF NOT EXISTS pgcrypto` (if not enabled).
  - `CREATE TABLE conduit_connectors (...)` with `credential_encrypted bytea` storing `pgp_sym_encrypt(token, $key)`.
  - `CREATE TABLE conduit_connector_grants (...)`.
  - Both RLS-enabled, owner-scoped.

**Encryption-at-rest decision (locked at plan time per user directive)**:

**pgcrypto wins over Supabase Vault for this feature.** Justification:

- pgcrypto is a standard PostgreSQL extension that Supabase enables natively. `pgp_sym_encrypt(text, key)` / `pgp_sym_decrypt(bytea, key)` are documented, well-understood primitives.
- The encryption key lives in a Vercel env var (`CONNECTOR_CREDENTIAL_KEY`, ~32-byte random hex). This pattern is already established by `ENGINEERING_WORKER_SECRET` (HMAC signing) in `src/lib/engineering/hmac.ts` and the worker bridge — so we are extending an existing operational pattern, not inventing a new one.
- pgcrypto encryption is **visible at the migration / SQL level** — auditable in the DB by inspecting `SELECT credential_encrypted FROM conduit_connectors LIMIT 1` and confirming it is not plaintext. Easy to verify SC-010 (spec).
- Supabase Vault is a strong feature for SERVICE-side secrets that need to be accessed from server-side code via the `vault.secrets` table indirection. Its sweet spot is "store an external API key once, app server reads it via a function." Our use case is different: PER-USER credentials, written and read on user-facing chat turns, with encrypted-at-rest the primary requirement (not centralized secret management).
- Vault adds an extra DB indirection per tool call (vault.decrypt_secret RPC + the credential lookup). pgcrypto does it in one query: `SELECT pgp_sym_decrypt(credential_encrypted, $key) FROM conduit_connectors WHERE …`.
- Rotation: pgcrypto supports re-encryption via a DB migration that decrypts with old key + encrypts with new. Vault has a managed-rotation story that we'd be unlikely to use in our timeline.

**Trade-offs accepted**:
- pgcrypto requires the env-var key to be present and protected. Loss of `CONNECTOR_CREDENTIAL_KEY` = all stored connector credentials become unreadable (recoverable only by user re-entering them).
- pgcrypto uses CPU cycles on every read. Negligible at our scale (≤ 1000 active connectors total).

**No tests** (Constitution Principle V). Verification per surface:
- Slice 1: mobile-sweep matrix on `/app/memory`; per-department prompt assembly verified by chat-route manual exercise.
- Slice 2: SC-010 (DB inspection of encrypted credential); end-to-end GitHub repo read via Engineering chat; per-department grant toggle verified by toolset shape in chat.

**Target Platform**: Vercel (Next.js deploy of `conduitai.io`); Supabase (Postgres + Realtime + RLS).

**Project Type**: Web — Next.js App Router monolith (Constitution Principle IV).

**Performance Goals**:
- Slice 1 `/app/memory` first paint ≤ 600 ms on warm cache.
- Per-employee memory query (filter via join) ≤ 80 ms p95 (indexed lookup).
- Slice 2 PAT-paste → connected-state ≤ 2 s wall clock (DB write + token verify against GitHub `/user`).
- Tool-call round-trip (`readRepoFile` happy path) ≤ 1.5 s p95 once the Anthropic SDK call returns.
- No JS-driven animation loops (CSS only — consistent with R15/R16).

**Constraints**:
- Constitution Principle I: read `node_modules/next/dist/docs/01-app/01-getting-started/{03-layouts-and-pages,05-server-and-client-components,15-route-handlers}.md` before authoring. Slice 1 follows the established patterns. Slice 2's new API routes (OAuth-shaped, but PAT-shaped now) mirror `/api/engineering/session/[id]` for shape.
- Constitution Principle II: every new table is `conduit_*` and ships with RLS + at least one owner-scoped policy in the creating migration. Slice 2 introduces the encryption-at-rest precedent — documented in the migration and in the session report.
- Constitution Principle III: AI-provider concealment preserved; user-facing external service names (GitHub) are EXPECTED (not concealed). Per-pill render-time scrubbing for any tool-argument strings that echo provider names from the model.
- Constitution Principle IV: all new files under `/app/app/memory`, `/app/app/connectors`, `/app/api/conduit/memory*`, `/app/api/conduit/connectors*`, `/src/components/conduit/memory`, `/src/components/conduit/connectors`, `/src/lib/connectors`. `src/proxy.ts` untouched. Zero marketing imports.
- Constitution Principle V: 375 + 390 mobile sweep, light + dark theme, reduced-motion sweep per slice. Material milestone YES for each slice → dated session reports.
- Constitution Principle VI: each slice merges to `main` independently. No long branches.

**Scale/Scope**:
- Slice 1: 1 migration, 1 new top-level route, ~6 new components, ~5 file modifications. ~250–400 LoC delta.
- Slice 2: 1 migration, 2 new top-level routes (`/app/connectors` + the connect modal flow), 1 new OAuth-shaped API surface, 1 new tool registry, ~10 new components, the agentic-loop refactor in chat route. ~600–900 LoC delta. **Bigger by 2-3×.**

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Both slices evaluated against all 7 gates. Some verdicts differ per slice
because Slice 2 carries the architectural change.

### Slice 1 (memory)

| # | Principle | Verdict | Justification (one line) |
|---|---|---|---|
| 0 | Domain Truth | **PASS** | 9-employee roster preserved (sourced `src/lib/conduit/employees.ts`); no new domain content; per-department scoping is a UX extension over real R10 infra (`012_conduit_memory.sql`). |
| I | Next.js 16 | **PASS** | One new server-component route at `src/app/app/memory/page.tsx`; one redirect from `src/app/app/settings/memory/page.tsx`. Standard App Router. `src/proxy.ts` untouched. |
| II | Schema Namespacing | **PASS** | `023_memory_scope_pin_lock.sql` adds `pinned`/`locked` columns on `conduit_memory` + new `conduit_memory_scope` join table — both `conduit_*` namespaced, RLS-enabled with owner-scoped policy via existing memory→account join in the same migration. |
| III | Brand Integrity | **PASS** | All new UI is `/app/*` (Praxis brand). Zero AI-provider strings. Employee names (the 9 dept labels) come from `EMPLOYEES`. |
| IV | Dual-Brand Single-Deploy | **PASS** | All files under `src/app/app/memory/`, `src/components/conduit/memory/`, `src/styles/memory-desk.css`. Zero marketing imports. |
| V | Verification by Preview + Mobile Sweep | **PASS** | Preview-URL exercise + 375 + 390 + light + dark + reduced-motion sweep per `quickstart.md §1`. Material milestone (new top-level surface) → produces `SESSION_REPORT_2026-05-XX_MEMORY_DESK.md`. |
| VI | Push-to-Main | **PASS** | One merge. No long branches. |

**Slice 1 net**: 7/7 PASS. No waivers. Ships clean.

### Slice 2 (GitHub PAT connector + tool-calling architecture)

| # | Principle | Verdict | Justification (one line) |
|---|---|---|---|
| 0 | Domain Truth | **PASS** | GitHub is REAL — the spec mandates end-to-end before ship; no "Connect Coming Soon" tiles. Per-employee grant defaults sourced from a new `connector-registry.ts` (NOT invented mid-flight). |
| I | Next.js 16 | **PASS (with risk)** | New `/api/conduit/connectors/github/{start,verify,disconnect}` route handlers follow `src/app/api/engineering/session/[id]` shape. `src/proxy.ts` untouched. **Architectural risk** (tool-calling agentic loop) is in app code, not in the framework surface — Next.js 16 doesn't constrain this. |
| II | Schema Namespacing | **PASS (with new operational standard)** | `024_connectors.sql` adds `conduit_connectors` (with `credential_encrypted bytea`) and `conduit_connector_grants` — both `conduit_*` namespaced, RLS-enabled. **New operational precedent**: pgcrypto encryption-at-rest for user credentials. Documented in the migration AND in the session report so future agents know the convention. |
| III | Brand Integrity | **PASS** | AI-provider strings (Claude/Anthropic/OpenAI/etc.) concealed. User-facing third-party names (GitHub) ARE rendered — that is correct per FR-024 in the spec. Tool-call pills apply render-time provider-tell scrubbing (mirrors R16's pattern). |
| IV | Dual-Brand Single-Deploy | **PASS** | All files under `/app/app/connectors/`, `/app/api/conduit/connectors/`, `/src/components/conduit/connectors/`, `/src/lib/connectors/`. Zero marketing imports. |
| V | Verification by Preview + Mobile Sweep | **PASS** | Preview-URL exercise; mobile + theme + reduced-motion sweep; SC-010 (DB inspection of encrypted credential); end-to-end GitHub repo-read via chat. Material milestone (new architectural primitive — tool use) → produces `SESSION_REPORT_2026-05-XX_GITHUB_CONNECTOR.md`. |
| VI | Push-to-Main | **PASS** | Slice 2 phased: Phase 2.A (tool-calling architecture + synthetic test tool) merges first; Phase 2.B (GitHub connector) merges second. Both short-lived. |

**Slice 2 net**: 7/7 PASS. The pgcrypto precedent is flagged in §Complexity Tracking (NOT as a waiver — as a forward-pointer for future credential-storage decisions).

---

## Aesthetic Direction (frontend-design skill applied)

Concept: **"The Operator's Desk."** Luis is the operator of Praxis. The
desk has two surfaces:

- **Memory surface** = the *dossier*. What the AI workforce knows about
  his business. Organized by department.
- **Connectors surface** = the *key ring*. Which of his real tools the AI
  workforce can touch.

Both live under the same conceptual roof. Both consume the R15 premium-
redesign tokens (Fraunces serif display, Inter sans body, dept jewel-tones,
brand-purple accent, dark canvas).

### Slice 1: Memory surface — "the dossier"

The unforgettable moment: **a memory card written in italic Fraunces serif,
with a thin dept-tint left rule, pinned in a section titled with the
employee's name in serif display.** It should feel like reading a research
analyst's notebook — quiet, organized, intentional.

**Composition** (top to bottom):

1. **Page header** — serif display title "What Praxis knows" + a small total/cap counter (e.g. `47 / 200`).
2. **Global section** — full-width, hero-tier. Section title "Everyone knows" (serif display) + an inline add-form on the right. Cards beneath in a 2- or 3-column grid (responsive).
3. **Department sections** — 9 collapsible sections in `EMPLOYEE_ORDER`. Each section header: dept-tinted serif title + dept eyebrow + count badge + inline add-affordance. Empty state: italic single-line invitation ("Marketing doesn't know anything yet — drop a brand voice note").
4. **Memory card** — off-surface card (`var(--color-surface-elevated)`) with a 3-px dept-tint left rule. Kind chip at the top (eyebrow tracking, small-caps). Content in serif italic at body-lg size. Tag chips at the bottom. Hover surfaces 4 affordances on the right edge: pin toggle, lock toggle, edit, archive. Pinned cards have a brand-purple pin glyph; locked cards have a dept-tinted lock glyph.
5. **Pinned memories** in each section live in a thin "Always known" sub-bar at the top of the section (above the regular cards, separated by a hair-line divider).
6. **Atlas-written cards** carry a small "via Atlas" attribution under the content with a `→` linking to the source conversation (FR-009; just a stub in Slice 1, fully wired in P3 / US7).

**Motion** (all CSS, all reduced-motion gated):
- Add-form expand: 220 ms ease-out, height transition.
- Card mount: 180 ms scale-up + opacity on insert.
- Section collapse/expand: 280 ms.
- Pin/lock toggle: 120 ms cross-fade on the icon (no scale — feels twitchy).

**Light/dark parity**: card surface flips to off-white in light mode; dept-tint left rule deepens for legibility on warm-bone canvas.

### Slice 2: Connectors surface — "the key ring"

The unforgettable moment: **a single, tall connector tile with the GitHub
octocat in real GitHub black-on-white, framed by a brand-purple inner
glow, with a per-employee grant matrix as 9 small chips beneath.** The
tile feels like a key on a ring — solid, present, decisive. When the
status flips from `Not connected` to `Connected · @username`, the tile
gets a subtle one-time gold-flash celebration (1.2s, opacity-only).

**Composition**:

1. **Page header** — serif display "What Praxis can touch" + small subtitle "Connect your real tools so departments can read your data."
2. **Connector grid** — 1-up on mobile, 2-up on desktop. Each tile is large (~280 px tall) with:
   - Connector logo (real brand mark — GitHub's octocat in `#0d1117` on `#ffffff` chip).
   - Connector name (serif display).
   - Status pill (`Not connected` / `Connected · @username` / `Reconnect required` / `Error: <human>`).
   - Connect CTA OR per-employee grant matrix (9 chips, dept-tinted, on/off toggleable) once connected.
   - Disconnect affordance (subtle, bottom-right).
3. **Connect flow** — clicking `Connect` opens a focused drawer (not a modal — drawer is calmer for a sensitive operation):
   - Drawer slides in from the right.
   - Headline: "Connect GitHub."
   - Body explanation: "Paste a Personal Access Token below. We encrypt it at rest and only Engineering uses it. We never show it back to you."
   - Single secure input (`<input type="password">` with `autocomplete="off"`, no clipboard history).
   - Helper link: "How to generate a token" (links to GitHub docs in a new tab).
   - Verify button → POST to `/api/conduit/connectors/github/verify` → on success, flip the tile and close the drawer with a subtle slide-out.
4. **Per-employee grant chip** — small dept-tinted chip with the employee glyph. On state: filled background. Off state: outlined only. Click toggles immediately (no save button); a 600 ms confirmation pulse on the chip on success.

**Motion**:
- Tile celebration on first-connect: 1.2 s opacity-only flash.
- Drawer open: 280 ms slide.
- Chip grant toggle confirmation: 600 ms pulse.

**Light/dark parity**: GitHub octocat needs explicit handling. In dark theme it sits on a white chip; in light theme it can sit on the surface directly. Test on preview.

### Rejected aesthetic directions

- **Modal-based add forms** — modals on Memory's curation surface make every action feel weighty. Inline expand + drawer for the sensitive flows is calmer and respects the curator's tempo.
- **Tag-pill-heavy memory cards** — would bury the content. Tags live small at the bottom of the card. Serif italic content is the dominant element.
- **Connectors as a Settings tab** — would bury the second-most-important new surface under nested chrome. Top-level required (matches the user's "Connectors surface" framing).
- **Generic dashboard tile aesthetics for connectors** — would feel like Zapier circa 2018. Going taller + decisive + key-on-ring instead.

---

## Project Structure

### Documentation (this feature)

```text
specs/memory-and-connectors/
├── spec.md                          # GATE 1 approved 2026-05-23
├── plan.md                          # This file (GATE 2)
├── research.md                      # Phase 0 — decisions (R-001 … R-008)
├── data-model.md                    # Phase 1 — schema + derived entities for both slices
├── quickstart.md                    # Phase 1 — per-slice verification recipes
├── contracts/
│   ├── memory-desk.md               # Slice 1 — URL + data + per-dept query contract
│   ├── connectors-api.md            # Slice 2 — /api/conduit/connectors/* shape
│   ├── tool-registry.md             # Slice 2 — agentic-loop contract + tool-schema convention
│   └── encryption.md                # Slice 2 — pgcrypto convention + key env var
└── tasks.md                         # Phase 2 — created by GATE 3 (NOT this command)
```

### Source code (Slice 1 only — Slice 2 sketched at end)

```text
conduit-nextjs/
├── src/
│   ├── app/
│   │   ├── app/
│   │   │   ├── memory/
│   │   │   │   └── page.tsx                                # NEW — top-level route. Server component; loads + groups memories by scope; mounts MemoryDesk client.
│   │   │   └── settings/
│   │   │       └── memory/
│   │   │           └── page.tsx                            # MODIFY — turns into a redirect() to /app/memory.
│   │   └── api/
│   │       └── conduit/
│   │           └── memory/
│   │               ├── route.ts                            # MODIFY — POST accepts `scope: string[]` (empty array = global); inserts into conduit_memory_scope.
│   │               └── [id]/
│   │                   └── route.ts                        # MODIFY — PATCH accepts `scope`, `pinned`, `locked` and updates accordingly (replaces scope rows atomically).
│   ├── components/
│   │   ├── conduit/
│   │   │   ├── Sidebar.tsx                                 # MODIFY — add /app/memory entry under primary nav (between Workspace and Voice Room).
│   │   │   ├── SettingsTabs.tsx                            # MODIFY — remove the Memory tab from the Settings tab strip (it's promoted out).
│   │   │   └── memory/                                     # NEW namespace
│   │   │       ├── MemoryDesk.tsx                          # NEW "use client" — top-level surface orchestrator
│   │   │       ├── MemorySection.tsx                       # NEW — per-section (global + 9 dept) wrapper
│   │   │       ├── MemoryCard.tsx                          # NEW — single card with hover affordances (pin, lock, edit, archive)
│   │   │       ├── MemoryAddForm.tsx                       # NEW — inline add form (kind + scope multi-select + content + tags)
│   │   │       ├── MemoryDeptPicker.tsx                    # NEW — multi-select chips (default "Everyone")
│   │   │       └── MemoryKindPicker.tsx                    # NEW — kind chips (fact/preference/decision/goal/context)
│   ├── lib/
│   │   └── ai/
│   │       └── memory.ts                                   # MODIFY — extend MemoryRecord with `pinned`, `locked`, `scope?: string[]`; trim function prioritizes pinned rows; ATLAS_MEMORY_INSTRUCTIONS gains optional `scope:` syntax.
│   └── styles/
│       └── memory-desk.css                                 # NEW — slice-1 layout + card + motion; consumes praxis-tokens; reduced-motion gated.
├── supabase/
│   └── migrations/
│       └── 023_memory_scope_pin_lock.sql                   # NEW — pinned + locked columns + conduit_memory_scope join table + RLS + indexes.
├── docs/                                                   # UNCHANGED for Slice 1
├── .specify/
│   └── feature.json                                        # MODIFY — pin to specs/memory-and-connectors/
├── SESSION_REPORT_2026-05-XX_MEMORY_DESK.md                # NEW — material milestone report (Slice 1)
└── CLAUDE.md                                               # MODIFY — current-plan pointer
```

### Source code (Slice 2 — sketched; full structure locks at Slice-2 plan-time follow-up)

```text
src/
├── app/
│   ├── app/
│   │   └── connectors/
│   │       └── page.tsx                                    # NEW — top-level Connectors surface (server-renders connector + grant state)
│   └── api/
│       └── conduit/
│           └── connectors/
│               ├── route.ts                                # NEW — GET list, common shape
│               └── github/
│                   ├── verify/route.ts                     # NEW — POST PAT verify + encrypt + store
│                   ├── disconnect/route.ts                 # NEW — DELETE credential
│                   └── grant/route.ts                      # NEW — POST/DELETE per-(connector, employee) grant
├── components/
│   └── conduit/
│       └── connectors/
│           ├── ConnectorTile.tsx                           # NEW — large tile + status pill
│           ├── ConnectGitHubDrawer.tsx                     # NEW — PAT-paste drawer (secure input, no chat capture)
│           ├── ConnectorGrantChips.tsx                     # NEW — 9-chip per-dept grant matrix
│           └── ConnectorStatusPill.tsx                     # NEW — status pill
├── lib/
│   ├── connectors/
│   │   ├── registry.ts                                     # NEW — connector definitions + default grants
│   │   ├── encryption.ts                                   # NEW — pgcrypto wrapper (calls into SQL functions)
│   │   ├── github/
│   │   │   ├── client.ts                                   # NEW — Octokit-backed client factory
│   │   │   └── tools.ts                                    # NEW — readRepoFile, listRepoFiles, searchRepo tool implementations + JSON Schemas
│   │   └── tool-runtime.ts                                 # NEW — agentic-loop driver; per-employee tool filtering
│   └── ai/
│       └── provider.ts                                     # MODIFY — extend CompletionRequest with tools; extend CompletionResponse with content blocks; streamComplete yields tool_use events
└── styles/
    └── operator-keys.css                                   # NEW — connectors-surface aesthetic
```

**Structure decision**: Single-project Next.js App Router monolith. All
deliverables under `/app/app/*`, `/components/conduit/*`, `/lib/*`,
`/styles/*`. New `src/lib/connectors/` namespace introduced in Slice 2 for
the connector-runtime layer (sister to `src/lib/engineering/`).

---

## Slice 1 Phasing

Goal: Luis can use the new memory surface on production within one session.

### 1.A — Schema + chat-route filter (foundation)
Smallest non-trivial change that doesn't break any existing surface.
- Migration `023_memory_scope_pin_lock.sql` lands (pgcrypto NOT yet needed).
- `lib/ai/memory.ts` extended: `MemoryRecord` adds `pinned`, `locked`, optional `scope: string[]`. `trimMemoriesForPrompt` prioritizes pinned. `ATLAS_MEMORY_INSTRUCTIONS` gains optional `scope:` clause.
- `chat/route.ts` memory load query updated: when active employee ≠ Atlas/Jarvis, join `conduit_memory_scope` and filter to `global + scoped-to-them`. Atlas continues to see all.
- Existing `/api/conduit/memory` GET/POST/PATCH extended to read/write the new fields. Existing `/app/settings/memory` (the SettingsTab MemoryTab) continues to function — every existing memory has `pinned=false`, `locked=false`, zero scope rows = global behavior preserved.

### 1.B — Top-level surface
- `src/app/app/memory/page.tsx` (server component).
- `src/components/conduit/memory/*` (6 components).
- `src/styles/memory-desk.css`.
- `Sidebar.tsx` adds the nav entry between Workspace and Voice Room.
- `SettingsTabs.tsx` removes the Memory tab.
- `src/app/app/settings/memory/page.tsx` becomes a `redirect("/app/memory")`.

### 1.C — Polish + verification
- Mobile + light/dark + reduced-motion sweep per `quickstart.md §1`.
- Per-employee prompt assembly verified by manual chat exercise (talk to Marketing, talk to Engineering, confirm scoping works).
- `SESSION_REPORT_2026-05-XX_MEMORY_DESK.md`.

**Slice 1 merge gate**: full `quickstart.md §1` sweep passes on preview;
Luis can use the surface in production. STOP before Slice 2.

---

## Slice 2 Phasing

Goal: GitHub end-to-end + tool-calling architecture in place. STARTS only
after Slice 1 is preview-validated.

### 2.A — Tool-calling architecture (no user-visible product yet)
The risk surface from the §Tool-Calling Architecture Risk section.
- Extend `src/lib/ai/provider.ts` `CompletionRequest` / `CompletionResponse` for tools.
- Extend `streamComplete` to yield tool-use events.
- Add `src/lib/connectors/tool-runtime.ts` with the agentic-loop driver.
- Refactor the relevant chunk of `chat/route.ts` (the per-turn assistant call) into a multi-turn loop bounded by max-5-tool-turns.
- Persist tool-call events into `conduit_messages.metadata` (existing jsonb).
- Add a hidden `/api/debug/tool-test` route (gated on `internal_account = true`) that exercises a synthetic "ping" tool returning a known string. Verifies the agentic loop independently of GitHub.
- Verification: in dev, hit the debug route → confirm response includes the synthetic tool's output threaded through Anthropic's tool-use cycle.

### 2.B — GitHub connector built on the architecture
- Migration `024_connectors.sql` (pgcrypto extension + 2 tables + RLS + encryption-key env var documented).
- `src/lib/connectors/encryption.ts` (pgp_sym_encrypt / pgp_sym_decrypt wrappers).
- `src/lib/connectors/github/{client.ts,tools.ts}` (Octokit + 3 tool implementations).
- `src/lib/connectors/registry.ts` (GitHub entry + default grants).
- `/api/conduit/connectors/github/{verify,disconnect}/route.ts`.
- `/api/conduit/connectors/grant/route.ts` (per-(connector, employee) toggle).
- `/app/app/connectors/page.tsx` + Connector tile + drawer + grant chips.
- `src/styles/operator-keys.css`.
- Sidebar entry for `/app/connectors`.

### 2.C — Polish + verification
- Mobile + light/dark + reduced-motion sweep per `quickstart.md §2`.
- End-to-end exercise: connect GitHub via PAT-paste, talk to Engineering about a real repo on Luis's account, verify response quotes real code.
- SC-010 verification: DB inspection of `credential_encrypted` confirms non-plaintext.
- `SESSION_REPORT_2026-05-XX_GITHUB_CONNECTOR.md`.

**Slice 2 merge gate**: full `quickstart.md §2` sweep passes; one real GitHub
read works end-to-end; encryption verified.

---

## Phase 0 → Phase 1 re-check

**Status**: COMPLETE — `research.md` (Phase 0; 8 decisions R-001…R-008),
`data-model.md`, `contracts/{memory-desk,connectors-api,tool-registry,encryption}.md`,
and `quickstart.md` all authored alongside this plan.

**Re-check verdict** — every gate re-passes after Phase 0/1:

| Slice | 0 | I | II | III | IV | V | VI |
|---|---|---|---|---|---|---|---|
| **Slice 1 (memory)** | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| **Slice 2 (connector + tool-calling)** | PASS | PASS¹ | PASS² | PASS | PASS | PASS | PASS |

¹ Slice 2 / Principle I: re-confirmed the agentic-loop work lives in app
code (chat route + provider abstraction), not in Next.js framework
surfaces. `src/proxy.ts` untouched. The new `/api/conduit/connectors/*`
routes follow established `/api/engineering/session/[id]` shape.

² Slice 2 / Principle II: pgcrypto is a documented Postgres extension,
RLS preserved on the new tables (SECURITY INVOKER on the helper
functions). New operational precedent ("encryption-at-rest via pgcrypto
+ Vercel-env key") documented in `contracts/encryption.md` and slated
for the Slice 2 session report.

Nothing in Phase 0/1 authoring surfaced a hidden framework requirement,
schema requirement, or brand-axis conflict that would force a return
through GATE 2.

---

## Complexity Tracking

> Fill only if Constitution Check has violations that must be justified.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| _(none — all 7 gates PASS in both slices)_ | | |

**Notes on residual risk + new precedents** (NOT waivers — flagged for the
implementer):

- **Tool-calling architecture (Slice 2.A)** is net-new architecture, not a waiver but a risk. Sub-phasing inside Slice 2 + a synthetic test tool (`/api/debug/tool-test`) mitigate. If Phase 2.A reveals the provider abstraction can't cleanly support tools (e.g., the streamComplete generator pattern is structurally incompatible), the right response is to surface the conflict back to GATE 2 — not to inline-rewrite the abstraction in Phase 2.B.
- **pgcrypto encryption-at-rest precedent (Slice 2.B)** is a new operational standard for this repo. Documented in the migration AND in the session report so future credential-storage decisions (more connectors, OAuth tokens, etc.) know the convention. The `CONNECTOR_CREDENTIAL_KEY` env var is REQUIRED on Vercel for Slice 2 to function — if absent, connector verify endpoints fail closed with a clear operator message.
- **Bumping Spec Assumption 5 from R16 (zero new deps)** is acknowledged. Slice 2 adds one Octokit package. Justified: Phase 2.B's tool implementations need a GitHub REST client; rolling our own is more brittle than `@octokit/*`. Constitution Principle I (Next.js docs) is unrelated; Principle VI (push-to-main) is unaffected.
- **The 9-employee `EMPLOYEE_ORDER` array** is the source of truth for both per-department memory scope (Slice 1) and per-employee connector grants (Slice 2). If the roster ever changes, both schemas need a backward-compat plan. Out of scope for this round — flagged as a cross-cutting concern.

---

## Open NEEDS CLARIFICATION (Slice 2 plan-time)

These are resolved at Slice-2-plan-time, NOT before Slice 1 ships:

- **Tool-result max size in Anthropic context** — what's the practical cap for a `tool_result` content block before the SDK objects? Affects how much of a repo file we can return in one tool call.
- **Streaming tool-use UX choice** — show tool-call pills inline mid-stream (smoother UX) vs. show them only between assistant turns (simpler implementation). Recommend inline; lock at Slice-2 plan time.
- **Multi-tool concurrency** — if Anthropic returns 3 tool_use blocks in one turn, execute serially or in parallel? Octokit can handle parallel; Anthropic accepts parallel tool_result blocks. Recommend parallel; lock at Slice-2 plan time.
- **Token-cost reporting for tool turns** — chat UI currently shows assistant message token counts. Tool turns add input tokens; do we surface that or hide it? Lock at Slice-2 plan time.

---

## Worker dependencies (out-of-repo)

None. Both slices are pure in-repo work. The R16 engineering-build-trust
worker dependency (Path C streaming for code-stream cinema) is a separate
spec, unrelated to this one.
