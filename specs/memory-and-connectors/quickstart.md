# Phase 1 Quickstart — Memory + Connectors

**Date**: 2026-05-23
**Status**: Phase 1 complete — verification recipes per slice

Verification matrix per Constitution Principle V. Run on Vercel preview
deploys before merging to `main`.

---

## §0. Preflight

- Confirm the preview deploy is live.
- Sign in as an internal_account = true operator (Luis).
- DevTools → Network → "No throttling" by default.
- Slice 2 only: confirm `CONNECTOR_CREDENTIAL_KEY` is set in Vercel preview env.

---

## §1. Slice 1 — Memory Desk

### §1.1 Backward-compat redirect

1. Visit `/app/settings/memory` directly.
2. Confirm server-side redirect lands on `/app/memory`.

### §1.2 Global memory CRUD (existing behavior preserved)

1. On `/app/memory`, scroll to the Global section.
2. Click "+ Add memory" — inline form expands at the top of the section.
3. Type a kind, content, optional tags. Don't select any dept chips.
4. Submit. Card appears in the Global section. `pinned=false, locked=false, scope=[]`.
5. Refresh. Card persists.
6. Open chat with Marketing AND with Sales — both should reference the new global memory (since scope is empty = visible to everyone).

### §1.3 Per-department scope

1. Click "+ Add memory" in the Marketing section.
2. The scope picker is pre-filled with Marketing. Confirm.
3. Submit a fact like "User's brand voice is warm, direct, and serif-leaning."
4. Open chat with Marketing — confirm the memory is referenced or available.
5. Open chat with Sales — confirm the memory is NOT in Sales's context.
6. Edit the memory inline → toggle dept picker to add Sales as well.
7. Open chat with Sales — confirm the memory now IS in Sales's context.

### §1.4 Atlas writes a scoped memory

1. Open chat with Atlas (the default route, `/app`).
2. Tell Atlas something like "Our brand voice is warm and direct — only Marketing needs to know this."
3. Atlas should emit `[REMEMBER: preference | User's brand voice is warm and direct | brand,voice | scope: marketing]` (verify via DB query or via the Memory surface refresh).
4. The card appears under Marketing only, written_by="jarvis".

### §1.5 Pin

1. Pin a memory via the pin toggle on a card.
2. Confirm the card moves to the "Always known" sub-bar at the top of its section.
3. Add 41 unpinned memories to push the prompt past the budget.
4. Talk to an employee — confirm the pinned memory is still in the response context (manually verify via prompt-log inspection or by referencing the pinned content).

### §1.6 Lock

1. Lock a memory via the lock toggle.
2. Talk to Atlas; tell Atlas the fact has changed (e.g., "Actually we don't use that brand voice anymore — replace it.").
3. Atlas should attempt a `[SUPERSEDE: <id> | …]`. The chat route should SKIP the supersede because the memory is locked.
4. Verify the original memory is unchanged on `/app/memory`.

### §1.7 Source-link stub (FR-009 / US7 P3 lands later)

1. Memory written by Atlas should display "via Atlas →" link.
2. Click → routes to `/app?c=<conversation_id>`. (Phase 2 wires the panel; Slice 1 only ships the link.)

### §1.8 Cap behavior

1. Reach the tier cap (free: 25, pro: 200, internal: 5000).
2. Try to add another memory. Server returns 409 with `memory_cap_reached`.
3. UI displays a clear "X / cap — archive a few before adding more" message.

### §1.9 Mobile sweep

1. DevTools → device emulation: iPhone SE (375 px).
2. Visit `/app/memory`. Confirm sections collapse to single-column, tap targets ≥ 44 px.
3. Add a memory; confirm form is usable.
4. Repeat at 390 px (iPhone 14).

### §1.10 Theme parity

1. Settings → Theme → Light. Confirm Memory Desk reads cleanly.
2. Switch back to Dark. Confirm.

### §1.11 Reduced-motion

1. DevTools → Rendering → emulate `prefers-reduced-motion: reduce`.
2. Add a memory — confirm card-enter animation is absent (or opacity-only).

### §1.12 Sidebar nav

1. Confirm the Sidebar's primary nav has a "Memory" entry between Workspace and Voice Room.
2. The Settings tab strip no longer shows Memory.

### §1.13 Constitution V matrix

| Dimension | Pass |
|---|---|
| Vercel preview URL | All §1 recipes pass |
| 375 px viewport | §1.9 |
| 390 px viewport | §1.9 |
| Light theme | §1.10 |
| Dark theme | §1.10 |
| Reduced motion | §1.11 |
| No provider strings | `grep -r "Claude\|Anthropic\|OpenAI\|Sonnet\|Opus\|Haiku" src/app/app/memory/ src/components/conduit/memory/ src/styles/memory-desk.css` returns 0 hits |
| No marketing imports | `grep -r 'from "@/components/(Hero|Footer|Navbar|…)"' src/app/app/memory/ src/components/conduit/memory/` returns 0 hits |
| `src/proxy.ts` untouched | `git diff --stat src/proxy.ts` returns 0 |

### §1.14 Session report

Produces `SESSION_REPORT_2026-05-XX_MEMORY_DESK.md` at repo root.

---

## §2. Slice 2 — GitHub Connector (deferred; runs after Slice 1 merged + validated)

### §2.A — Tool-calling architecture (no user-visible product yet)

#### §2.A.1 Synthetic tool ping

1. As an internal_account user, hit `/api/debug/tool-test?employee=engineering` in dev.
2. Confirm the response includes the synthetic "ping" tool's output threaded through Anthropic's tool-use cycle.
3. Verify the agentic loop terminates within MAX_TOOL_TURNS (5).

#### §2.A.2 Stream + tool ordering

1. Trigger the synthetic ping via chat (a dev-only system message that requests the tool).
2. Confirm the chat UI surfaces a "pending → success" pill mid-stream.

### §2.B — GitHub connector end-to-end

#### §2.B.1 Connect via PAT

1. Generate a fresh GitHub PAT with `repo` + `read:user` scopes.
2. Open `/app/connectors`. Click `Connect` on the GitHub tile.
3. In the drawer, paste the PAT. Click `Verify + connect`.
4. Drawer closes. Tile flips to `Connected · @<your-username>` with a 1.2s gold-flash.
5. Verify the encrypted column directly: via Supabase MCP `execute_sql` against `mvuslmfjkkuizixjpkgl`:
   ```sql
   SELECT credential_encrypted FROM conduit_connectors ORDER BY created_at DESC LIMIT 1;
   ```
   Confirm the returned bytea is NOT the plaintext PAT. (SC-010.)

#### §2.B.2 Cap

1. As a free-tier user, try to connect a second connector.
2. Confirm `connector_cap_reached` error + upgrade-link CTA.

#### §2.B.3 Per-employee grant matrix

1. Default grants: Engineering has GitHub. Toggle off Engineering. Confirm the tool is removed from Engineering's chat tool list (verify via tool-call inspection).
2. Toggle ON Marketing. Confirm the tool IS in Marketing's chat tool list.

#### §2.B.4 Real repo read

1. Ensure Engineering has GitHub granted.
2. Open chat with Engineering. Ask: "What's in `src/lib/ai/memory.ts` of `wpbluiss/conduit-nextjs`?" (substitute a real repo on your connected account).
3. Confirm Engineering's response quotes ≥ 1 line of REAL code from the file.
4. Confirm an inline pill appears: `📄 Read wpbluiss/conduit-nextjs · src/lib/ai/memory.ts`.

#### §2.B.5 Refresh persistence

1. With Engineering's response on screen, refresh the chat.
2. Confirm the tool-call pill replays from `conduit_messages.metadata`.

#### §2.B.6 Connector revoke upstream

1. On GitHub, delete the PAT.
2. Ask Engineering another repo question.
3. Confirm the chat surface shows a translated `Reconnect required` error.
4. Confirm the connector tile auto-flips to `Reconnect required`.

#### §2.B.7 Disconnect

1. Click `Disconnect` on the GitHub tile.
2. Confirm modal. Confirm.
3. Tile flips to `Not connected`.
4. Engineering loses tool access on next chat turn.
5. Verify DB: `SELECT COUNT(*) FROM conduit_connectors WHERE account_id = '<your-account-id>';` returns 0.

#### §2.B.8 Encryption-key missing fail-closed

1. (Dev/staging) Unset `CONNECTOR_CREDENTIAL_KEY` from Vercel preview env temporarily.
2. Redeploy.
3. Try to verify a new PAT. Confirm `500 encryption_failed` with operator-tier message naming the env var.
4. Restore the env var.

#### §2.B.9 Mobile + theme + reduced-motion sweep

Mirror §1.9 / §1.10 / §1.11 for `/app/connectors` and the connect drawer.

#### §2.B.10 Constitution V matrix

| Dimension | Pass |
|---|---|
| Vercel preview URL | All §2.B recipes pass |
| 375 + 390 mobile | §2.B.9 |
| Light + dark | §2.B.9 |
| Reduced motion | §2.B.9 |
| No AI-provider strings | grep new code; user-facing third-party names (`GitHub`) ARE allowed |
| No marketing imports | grep |
| `src/proxy.ts` untouched | git diff |
| Encryption verified at rest | §2.B.1 |
| Per-employee grant invariant | §2.B.3 |
| Tool-call replay persistence | §2.B.5 |

### §2.B.11 Session report

Produces `SESSION_REPORT_2026-05-XX_GITHUB_CONNECTOR.md`.

---

## §3. Cross-slice integration smoke test (after both slices ship)

1. Add a Memory: "User's main repo is `wpbluiss/lunaro`" scoped to Engineering only.
2. Open chat with Engineering. Ask "Refactor the hero section of my landing page."
3. Confirm Engineering uses BOTH the memory (repo identity) AND the GitHub tool (read the actual code) without the user re-stating the repo.
4. Confirm Marketing in a parallel chat does NOT see the memory and does NOT have the tool.

This is the "Memory + Connectors talking to each other" win from US4 (P2 in the spec) — emerges naturally once both slices ship.
