# Implementation Plan: Voice Room for AI Employees — v1 completion

**Branch**: `main` (push-to-main per Constitution Principle VI; feature pinned via `.specify/feature.json`) | **Date**: 2026-05-14 | **Spec**: [`spec.md`](./spec.md)

**Input**: Feature specification from `/specs/voice-room-for-ai-employees/spec.md` (locked 2026-05-14, all 12 clarify defaults accepted — see [`clarify.md`](./clarify.md))

## Summary

Voice Room v1 completion closes five gaps on top of an already-shipped foundation: (1) the worker-side TTS-end-flush bug that causes trailing-audio cutoff and 5-second gate lockout; (2) mid-session employee switch in solo mode (voice command + UI "Team" pill → bottom-sheet picker); (3) memory writes from voice transcripts via Atlas-emits-tags parity with chat; (4) natural-language addressee routing in round-table; (5) "continue" a prior voice session within 14 days from voice-history.

**Approach**: minimal in-repo additions. One Supabase migration adds `parent_session_id uuid` to `conduit_voice_sessions`. The existing `POST /api/voice/token` is extended with an optional `parent_session_id` request field that is validated and propagated into the LiveKit room metadata for the worker to consume. Two new client components (`TeamSwitchSheet`, `ContinuationBadge`) ship under `src/components/conduit/voice/`; `VoiceRoom.tsx` is extended to mount them. `/app/settings/voice-history/page.tsx` gains a "Continue" affordance gated on `transcript_summary` non-empty + `created_at` within 14 days. No new API routes. No middleware/proxy edits.

**Out-of-repo dependency**: the worker repo (`conduit-voice-worker`, Railway) ships first (~24–48h ahead) with the Atlas round-2 fix, voice-side `[REMEMBER]` parsing, natural-language addressee detection, switch context payload (summary + last 4 turn pairs), continuation context payload (summary + last 6 turn pairs from the parent session), and `gate_open_fallback` end-reason emission. Worker work is **enumerated below as dependencies** but is not in this plan's task surface.

## Technical Context

**Language/Version**: TypeScript 5; Node.js 24 LTS (Vercel default runtime per session-start knowledge update).

**Primary Dependencies** (already installed; this plan adds none):
- `next@16.2.2` (App Router); `react@19.2.4`
- `@supabase/ssr@0.10.2`, `@supabase/supabase-js@2.105.3`
- `livekit-client@2.18.9`, `livekit-server-sdk@2.15.2`
- `@anthropic-ai/sdk@0.95.0` (text-chat path only; voice path is worker-owned)
- `lucide-react` (icons)
- `tailwindcss@4` via `@tailwindcss/postcss`

**Storage**: Supabase Postgres (shared instance `mvuslmfjkkuizixjpkgl` with Lunaro per Constitution Principle II). All access through `conduit_*`-namespaced tables. Migration **022** is the v1 deliverable (see Data Model).

**Testing**: no automated test suite — by intent per Constitution Principle V. Verification is the Vercel preview deploy + 375/390px mobile sweep + dated `SESSION_REPORT_*` on material milestones (this plan ships one).

**Target Platform**: Vercel (Next.js deploy of `conduitai.io`); Supabase (Postgres, RLS); LiveKit (transport). The voice **agent** itself runs on Railway in a separate repository (`conduit-voice-worker`) and is out of scope.

**Project Type**: Web — Next.js App Router monolith serving Conduit AI marketing at `/` and the Praxis console at `/app/*` (Constitution Principle IV — dual-brand single-deploy preserved).

**Performance Goals**:
- 95th-percentile gate-open latency after agent speech-end ≤ 1.2s on happy path (SC-002 — verified by `end_reason` distribution in `conduit_voice_sessions`).
- Switch latency: first audible word of new employee ≤ 2s after switch trigger.
- Bottom-sheet open/close ≤ 60fps on mid-tier mobile (iPhone 14 baseline).

**Constraints**:
- Constitution Principle II: only `conduit_*` tables; RLS in creating migration.
- Constitution Principle III: zero "Claude"/"Anthropic"/"OpenAI"/"ElevenLabs"/"LiveKit" in user-visible strings.
- Constitution Principle V: 375px + 390px mobile sweep; preview-URL exercise before merge.
- Constitution Principle VI: push-to-main; no long-running branches.
- Worker PR merges and deploys ~24–48h before this plan's PR (per spec Assumptions).

**Scale/Scope**:
- 9 employees (`jarvis`/Atlas, `marketing`, `sales`, `engineering`, `finance`, `compliance`, `hr`, `ops`/Operations, `legal`).
- Voice-session ceilings per tier (existing `readVoiceCeilings` in `src/lib/voice/config.ts`).
- Round-table participant caps: free 2, pro 4, enterprise 9 (unchanged).
- Per-session transcript size: bounded by max-seconds ceiling × Realtime/TTS rates (already enforced server-side).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

For each gate, record **pass / fail / N/A** with a one-line justification. A
**fail** blocks Phase 0 until either the plan is revised or the violation is
recorded in **Complexity Tracking** below with an explicit waiver and a
rejected simpler alternative.

| # | Principle | Gate question | Verdict |
|---|-----------|---------------|---------|
| 0 | Domain Truth & No Hallucination | Does this plan introduce or rely on Praxis/Conduit AI product domain content — employees, capabilities, pricing tiers, customer logos, integration claims, or terminology (Jarvis, Praxis, voice room, build, artifact, round identifier `R<N>.<M>`)? If yes, cite the source for every domain decision in source-authority order (latest applicable `SESSION_REPORT_YYYY-MM-DD_*.md`, then active `briefs/CONDUIT_BRIEF_*.md`, then `STRATEGY.md`). Unsourced items MUST be flagged **NEEDS CLARIFICATION**, not guessed. If no domain content is introduced, mark **N/A**. | **PASS** — 9-employee roster + Atlas/Jarvis display semantics sourced from `src/lib/conduit/employees.ts` (the codebase is itself the post-R12.5 source of truth here, codifying `STRATEGY.md`'s "users see Jarvis/Marketing/Sales/Engineering/etc., never Claude/Anthropic"); R10 memory invariant sourced from `supabase/migrations/012_conduit_memory.sql` + `src/lib/ai/memory.ts`; voice gate state machine sourced from `docs/atlas-voice-state-machine.md`. Zero employees / tiers / capabilities invented. |
| I | Next.js 16 Source-of-Truth | Does this plan touch Next.js APIs, file conventions, framework behavior, caching, routing, server actions, server components, or middleware? If yes, list the specific `node_modules/next/dist/docs/` guides consulted before authoring the plan, and confirm any middleware references use `src/proxy.ts` exporting `proxy(request)` — never `src/middleware.ts`. Deprecation notices surfaced during work MUST be addressed in the same PR or filed as tracked TODOs. If no framework concerns are touched, mark **N/A**. | **PASS** — guides consulted: `01-app/01-getting-started/15-route-handlers.md` (Route Handlers: non-GET methods uncached by default; `NextRequest`/`NextResponse` helpers — confirms existing `/api/voice/token/route.ts` shape we are extending), `01-app/01-getting-started/05-server-and-client-components.md` (use Client Components for state/event/`useEffect`/browser APIs — confirms `TeamSwitchSheet`/`ContinuationBadge` must be `"use client"`), `01-app/03-api-reference/03-file-conventions/02-route-segment-config/runtime.md` (confirms `runtime = 'nodejs'` default; doc explicitly says option "cannot be used in Proxy" — Next.js 16 rename of middleware → proxy, aligning with Constitution Principle I). Plan does not touch `src/proxy.ts`; does not add new route handler files; uses the existing `runtime = "nodejs"` directive on the extended token route. |
| II | Schema Namespacing & Tenant Boundary | Does this plan add or modify Supabase tables, functions, or views? If yes, all new tables MUST be named `conduit_<name>` and ship with `ENABLE ROW LEVEL SECURITY` plus at least one policy in the creating migration. Any read/write from non-`conduit_*` schemas (`auth.users`, `storage.*`, or anything `lunaro_*`) MUST be named and justified — cross-tenant `lunaro_*` reads are forbidden. If no schema changes, mark **N/A**. | **PASS** — migration `022_voice_session_continuation.sql` adds one column (`parent_session_id uuid REFERENCES conduit_voice_sessions(id) ON DELETE SET NULL`) to existing `conduit_voice_sessions` table. RLS already enabled on `conduit_voice_sessions` from migration 006 chain; the existing owner-scoped policy covers the new column. `auth.uid()` is read inside the existing policy only (Supabase native, never bypassed). No `lunaro_*` reads. No new tables. |
| III | Brand Integrity & Provider Concealment | Does this plan surface AI-generated content, error messages, debug output, page metadata, or any client-visible UI? If yes, confirm: (a) no "Claude"/"Anthropic"/"OpenAI" strings appear outside `src/lib/ai/provider.ts` and its callers; (b) LLM output is scrubbed of provider-tells at the prompt layer, not the display; (c) marketing routes render "Conduit AI" wordmark + parent-brand tokens, `/app/*` routes render "Praxis" wordmark + in-app tokens — no cross-contamination in components, copy, or page metadata. If no client-visible surface is added, mark **N/A**. | **PASS** — new client surface (`TeamSwitchSheet`, `ContinuationBadge`, voice-history Continue button) lives under `/app/*` and references employee display names only via `src/lib/conduit/employees.ts`. The "Continuing your conversation from <relative time>" copy in `ContinuationBadge` (FR-016) uses generic terminology. SC-008 is the verification clause; plan adds a pre-merge grep step over `src/app/app/` and `src/components/conduit/voice/` for the provider-name blocklist. Provider-tell scrubbing on Atlas voice output is a worker-side responsibility (dependency W3 below). |
| IV | Dual-Brand Single-Deploy | Does this plan add or modify route files or components? If yes, confirm: marketing routes (`/`, `/about`, `/approach`, `/careers`, `/changelog`, `/customers`, `/engineering`, `/pricing`, `/products`, `/trust`) do NOT import from `/app/*` or `src/components/conduit/`; `/app/*` routes do NOT import marketing landing components (`Hero.tsx`, `Footer.tsx`, `Navbar.tsx`); shared primitives live in `src/components/design-system/` only when brand-neutral. Edits to the `src/proxy.ts` matcher MUST document the session-refresh impact on every `/app/*` surface. If no route/component changes, mark **N/A**. | **PASS** — every new/modified file is under `/app/*` or `src/components/conduit/voice/` (the existing Praxis-console namespace). Zero marketing-route changes. Zero imports of `Hero.tsx`/`Footer.tsx`/`Navbar.tsx`. `src/proxy.ts` is not touched. |
| V | Verification by Preview + Mobile Sweep | What is the verification plan? List: (a) the Vercel preview URL that exercises the affected surface in-browser; (b) the 375px and 390px mobile sweep plan for any UI change; (c) for voice/realtime changes, the LiveKit-room end-to-end exercise plan; (d) whether this qualifies as a material milestone (new surface, ≥3-table migration, brand rollout, voice/realtime change, billing/entitlement change, or round-numbered `R<N>.<M>` increment) requiring a dated `SESSION_REPORT_YYYY-MM-DD_<scope>.md`. "It built" is not sufficient. | **PASS** — (a) the merging PR's auto-generated Vercel preview URL exercises the new `/app/voice` and `/app/settings/voice-history` surfaces; (b) 375px + 390px sweep checklist: Team pill visibility in solo, bottom-sheet open/close, employee selection in sheet, sheet dismisses on backdrop tap, Continue button in voice-history, ContinuationBadge legibility in VoiceRoom header; (c) LiveKit-room exercise: 5 long-form solo sessions per employee (test SC-001/SC-002) + 3 round-tables with natural-language addressee (SC-005) + 3 continue-from-history flows (SC-006) + 2 mid-session switches with locked-tier refusal (SC-003) — all against the merged worker on Railway; (d) material milestone YES — voice/realtime change + schema migration + new product surface → produces `SESSION_REPORT_2026-05-XX_VOICE_ROOM_V1.md` capturing decisions + verification outcomes + any follow-ups. |
| VI | Push-to-Main | Will this feature ship via `git push` to `main` (or a short-lived feature branch merged fast-forward into `main`)? Confirm no long-running branch is implied by the plan's phasing, and that preview verification runs on Vercel preview deploys per Principle V. Any anticipated manual `vercel --prod` recovery deploy MUST be justified under **Complexity Tracking** below. | **PASS** — entire plan is sized to fit a single round-of-work PR sequence: migration first, then API extension, then UI additions, all pushed directly to `main` once worker is live. No long-running branches. No manual `vercel --prod` anticipated. Spec Kit tooling now compatible with push-to-main via `.specify/feature.json` (created this session) — branch-name enforcement is bypassed, but the spec's `Feature Branch: 001-voice-room-for-ai-employees` label is preserved as a directory-prefix convention only. |

## Worker Dependencies (out-of-repo)

These are **dependencies**, not tasks in this plan. They live in `conduit-voice-worker` (Railway) and ship in a separate PR ~24–48h ahead of this plan's merge. Listed here so the in-repo plan reads coherently and the cross-repo coordination is auditable.

| # | Dependency | Story / FR | Notes |
|---|---|---|---|
| W1 | TTS end-flush round-2 fix (`docs/atlas-voice-state-machine.md` §4) — close ElevenLabs WS on `isFinal:true` not on 200ms timer; idempotent `done` emission. | Story 1 / FR-009 / SC-001 / SC-002 | Architectural fix, not knob-tuning. |
| W2 | Worker writes `end_reason = 'gate_open_fallback'` to `conduit_voice_sessions` whenever the 5-second `POST_TEXT_DONE_FALLBACK_MS` path fires. | Story 1 / FR-009 | No Next.js-side schema change required (existing text column). |
| W3 | Voice-side `[REMEMBER]` / `[SUPERSEDE]` tag parsing using the in-repo `parseMemoryWrites` parser shape (mirror, do not import) — Atlas emits tags in text deltas, worker scans + strips before TTS, POSTs each parsed row to `POST /api/voice/memory-write` with `tags: ["voice_session:<id>"]` and forced `written_by='jarvis'`. | Story 3 / FR-005 / SC-004 | Endpoint exists; worker work is enabling Atlas's voice system prompt with `ATLAS_MEMORY_INSTRUCTIONS` and adding the delta-scan loop. |
| W4 | Natural-language addressee detection in round-table: prefix-match employee display name → route turn to that single employee; fallback to Atlas with one-sentence audible "not available" + tier-aware upgrade hint when locked. | Story 4 / FR-006 / SC-005 | Worker owns routing decision; UI shows `active_speaker` event already. |
| W5 | Mid-session switch context payload: when worker observes a switch (voice command "get me X" OR client data event from the UI bottom sheet), build the new employee's first system prompt with summary-up-to-switch + last 4 user/agent turn pairs verbatim; speak short audible acknowledgement before answering. | Story 2 / FR-001 / FR-014 / SC-003 | UI publishes a LiveKit data event `{ type: "request_switch", target_employee_id: "<id>" }` when the user taps in the bottom sheet; worker treats voice command equivalently. |
| W6 | Continuation context payload: on join, worker reads `parent_session_id` from LiveKit room metadata (added by the extended token route), pulls the prior session's `transcript_summary` + last 6 user/agent turn pairs, primes the agent's first-turn context. | Story 5 / FR-007 / FR-015 / SC-006 | Worker has DB access via shared `CONDUIT_WORKER_SECRET` and an admin client. |

A new `SESSION_HANDOFF_2026-05-XX_VOICE_ROOM_V1.md` written before this plan's PR opens documents the worker-PR SHA + Railway deploy timestamp that satisfies W1–W6, so the Next.js PR has a single linkable reference for "worker is ready."

## Project Structure

### Documentation (this feature)

```text
specs/voice-room-for-ai-employees/
├── spec.md              # Locked 2026-05-14 (12 defaults accepted)
├── clarify.md           # Resolved 2026-05-14
├── plan.md              # This file
├── research.md          # Phase 0 output (rationale traces for accepted defaults)
├── data-model.md        # Phase 1 output (conduit_voice_sessions delta + tagging conventions)
├── quickstart.md        # Phase 1 output (local-dev steps for the new flows)
├── contracts/
│   └── voice-token-extension.md   # Phase 1 output (extended POST /api/voice/token contract)
└── tasks.md             # Phase 2 output — created by /speckit-tasks (NOT this command)
```

### Source Code (repository root)

```text
conduit-nextjs/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── voice/
│   │   │       └── token/
│   │   │           └── route.ts          # MODIFY — accept optional `parent_session_id`; validate ownership + 14-day window + non-empty transcript_summary; propagate into LiveKit room metadata
│   │   └── app/
│   │       └── settings/
│   │           └── voice-history/
│   │               └── page.tsx          # MODIFY — render "Continue" affordance per FR-007 (≤14 days + non-empty transcript_summary)
│   ├── components/
│   │   └── conduit/
│   │       └── voice/
│   │           ├── VoiceRoom.tsx         # MODIFY — mount TeamSwitchSheet (solo only), ContinuationBadge, publish `request_switch` LiveKit data event
│   │           ├── TeamSwitchSheet.tsx   # NEW — "use client" — bottom-sheet picker (mobile) / popover (desktop) over employee roster; tier-aware lock indicators
│   │           └── ContinuationBadge.tsx # NEW — "use client" — header chip "Continuing your conversation from <relative time>"
│   └── lib/
│       └── (no changes — memory.ts is consumed by worker via shape mirror, not by this plan)
├── supabase/
│   └── migrations/
│       └── 022_voice_session_continuation.sql   # NEW — ADD COLUMN parent_session_id uuid + FK + index; existing RLS policy already covers the new column
├── .specify/
│   ├── feature.json                              # CREATED this session — pins active feature dir to specs/voice-room-for-ai-employees/ for /speckit-* tools under push-to-main
│   └── memory/constitution.md                    # untouched
└── (CLAUDE.md SPECKIT marker updated to point at this plan.md)
```

**Structure Decision**: Single-project Next.js App Router monolith. The marketing surface at `/` and the Praxis console at `/app/*` share one deploy (Constitution Principle IV — Dual-Brand Single-Deploy). All in-repo deliverables for this feature live under `src/app/app/*`, `src/app/api/voice/*`, `src/components/conduit/voice/*`, and `supabase/migrations/022_*.sql`. The worker repo (Railway) is the only other moving piece and is named explicitly as out-of-repo above.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none — all 7 gates PASS)_ | | |
