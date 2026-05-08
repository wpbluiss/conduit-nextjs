# Session Handoff — Voice Architecture Fix + R15.5 Execution Depth + R16 Marketing Scaffolding

## Where we are
- Conduit AI: R1-R15 + R15.5 staged. Voice fix (proactive audio gate) deployed
  to the voice worker. Marketing worker repo bootstrapped.
- Branch: `feat/voice-fix-and-execution-2026-05-08` (HEAD `502ff9c`).
- Sister repos:
  - `conduit-voice-worker` main: HEAD `1f934b5` (proactive audio gate).
  - `conduit-engineering-worker` main: HEAD `3015a51` (abort + persistence + live tokens).
  - `conduit-marketing-worker` main: HEAD initial (Phase 3.1 scaffold).

## Three tracks shipped this round

### Track 1 — Atlas voice cut-off, architectural fix (not knob-tuning)

Diagnosis written up in full at `docs/voice-architecture-fix.md`. Round 1's
RMS-gate / VAD-threshold / cooldown tweaks were *reactive* — they let
OpenAI Realtime's server VAD fire on echo-contaminated audio, then tried
to second-guess each fire. Edge cases got through.

**Root cause:** worker shipped user-mic audio to Realtime even while the
agent was talking. Server VAD evaluated audio that contained agent-voice
echo (browser AEC half-cancels it, AGC residue and onset transients
leak through). Worse: `agentSpeaking` flipped to `false` on `text_done`
but TTS audio was still draining for seconds, leaving an unguarded
trailing window where echo could trigger response auto-creation against
the agent's own voice.

**Fix:** proactive audio gate. Two states (`listening` / `gated`).

- Closes on first `text_delta`.
- Opens 800 ms after TTS `done` (covers WS close + LiveKit publish queue
  + browser playback latency).
- Real interrupts during `gated` are detected in-worker via sustained
  voice-level RMS (≥0.04 for 100 ms — high enough to reject coughs,
  keyboard clicks, echo residue; low enough to catch normal speech).
- Removes redundant cooldown timer, redundant `lastUserAudioAt` energy
  gate, and the `!agentSpeaking` guard.

`conduit-voice-worker` `src/agent.ts` (commit `1f934b5`). Doc commit
`6bec0a2` on the Praxis branch.

**Verification needed:** Luis at the mic. Steps in
`docs/voice-architecture-fix.md`. Worker logs show
`[agent] audio gate closed/opened` transitions on every turn.

### Track 2 — Engineering R15.5 (public release + execution depth)

Six pieces, paired across `conduit-nextjs` (commit `88f6cf2`) and
`conduit-engineering-worker` (commit `3015a51`).

1. **Public release** — `internal_account` 403 gate dropped.
   `/lib/engineering/limits.ts` enforces tier-based daily caps:
   free=1/day, pro=10/day, enterprise=unlimited. internal_account
   bypasses all caps.
2. **Spend cap** — daily $-denominated ceiling per tier
   (free=$0.50, pro=$5, enterprise=$50). Cost computed from
   total tokens × Sonnet 4 pricing.
3. **Abort path** — `POST /api/engineering/session/[id]/abort` marks
   the row `aborted` (new status; migration 019 extends the enum) and
   asks the worker to SIGTERM the claude subprocess. BuildSession
   X button now actually kills active builds.
4. **File persistence** — `parent_session_id` column +
   "Continue" button on completed sessions. Worker copies the parent's
   workspace into the new session's `/workspace/<id>` before claude
   runs and uses a continuation-flavored prompt prefix. Cleanup keeps
   workspaces on success (until container restart).
5. **Live token streaming** — worker flushes token deltas every 30s
   via `bumpTokens`; existing realtime UPDATE on the session row fans
   the change out to the BuildSession overlay live.
6. **Usage banner** — `/app/builds` shows "today: X / Y builds, $A /
   $B spend" with red highlight when exhausted + upgrade link.

Migration `019_engineering_v2.sql`. New routes:
`POST /api/engineering/session/[id]/abort`, `GET /api/engineering/usage`.

### Track 3 — Marketing R16 Phase 3.1 (scaffolding)

New repo `wpbluiss/conduit-marketing-worker` (separate from this
codebase). Architecturally a sibling of the engineering worker:

- Two-stage debian-slim Dockerfile (builder → runtime).
- Express on PORT, HMAC-authed `POST /generate` and
  `POST /session/:id/abort`.
- Per-session ephemeral `/workspace/<sessionId>`, 30-min hard timeout.
- Claude (Sonnet 4.6) acts as **creative director**: returns a
  structured JSON asset plan (`rationale + assets[]`). Worker walks
  the plan in order, honoring `depends_on` (so a video can be built
  from the hero image).
- `providers.ts` ships **stubs** for fal.ai (Flux Pro, Ideogram,
  Seedance), ElevenLabs, and Runway. Phase 3.1 returns
  deterministic placeholder URLs when keys aren't set so the
  end-to-end Praxis UI flow is testable before keys land.

Praxis side (commit `502ff9c`):
- Migration `020_marketing.sql` (numbered 020 because R15.5 took 019):
  `conduit_marketing_sessions` (status enum pending|generating|editing|
  complete|failed|aborted, output_urls jsonb, total_cost_cents),
  `conduit_marketing_logs` (realtime-published).
- `POST /api/marketing/session` (gated to internal_account first,
  per Phase 3.1 brief).
- `GET /api/marketing/session/[id]` for backfill / reopen.
- `POST /api/marketing/session/[id]/abort` for symmetry with engineering.
- `/lib/marketing/{hmac.ts, worker.ts}` bridge.
- `/lib/ai/employees/marketing.ts` rewritten as a senior creative
  director: brand-aware, audience-aware, refuses to fake-render visual
  assets in chat (defers to the Generate button on /app/team/marketing).

Phase 3.2 (deferred to next round):
- Real fal.ai / ElevenLabs / Runway HTTP calls in the worker.
- MarketingSession overlay UI component.
- "Generate" button + modal on `/app/team/marketing`.
- Public release with tier caps (mirror `/lib/engineering/limits.ts`).
- CapCut MCP automation for stitched + captioned outputs.

## What needs you to land it

### Voice worker
- Railway: trigger a redeploy on `conduit-voice-worker` so the
  proactive audio gate activates. No new env vars.

### Engineering worker
- Railway: trigger a redeploy on `conduit-engineering-worker` so the
  abort endpoint, parent-workspace cloning, and 30s token flush go
  live. No new env vars.

### Marketing worker (new)
- Create Railway service from `wpbluiss/conduit-marketing-worker`
  (Dockerfile builder).
- Env required at boot: `MARKETING_WORKER_SECRET` (run
  `openssl rand -hex 32`), `ANTHROPIC_API_KEY` (bot key),
  `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Optional (Phase 3.1 stubs are fine without these):
  `FAL_API_KEY`, `ELEVENLABS_API_KEY`, `RUNWAY_API_KEY`.

### Praxis (conduit-nextjs)
- Merge `feat/voice-fix-and-execution-2026-05-08` to `main`. Vercel
  auto-deploys.
- Apply migrations `019_engineering_v2.sql` and `020_marketing.sql`
  to project `mvuslmfjkkuizixjpkgl`.
- Add Vercel env vars: `MARKETING_WORKER_URL`,
  `MARKETING_WORKER_SECRET` (same value as Railway).

### Manual rotation note
Per the round brief, `ENGINEERING_WORKER_SECRET` is NOT rotated this
round. Do that separately when convenient.

## Verification checklist (Luis, at the mic / browser)

1. **Voice fix** — open Voice Mode with Atlas, ask "tell me about my
   pipeline in detail." Multi-sentence response, no self-cutting.
   Mid-response: speak clearly → agent stops within ~150ms. Worker
   logs show `[agent] audio gate closed (agent speaking)` then
   `[agent] interrupt confirmed — sustained voice during gated state`.
2. **R15.5 abort** — start a build, wait for "Building" status, click
   "Stop build" in the overlay. Status should flip to "Aborted"
   within seconds; worker log shows `user_aborted — sending SIGTERM
   to claude`.
3. **R15.5 continue** — open a completed build, click "Continue",
   submit a follow-up prompt. New session opens; logs show
   `cloned workspace from parent session <id>`.
4. **R15.5 live tokens** — start a build; the BuildSession stats
   panel should update In/Out token counts every ~30s, not just
   at the end.
5. **R15.5 usage banner** — `/app/builds` shows "Today: X / Y builds,
   $A / $B spend" for non-internal accounts.
6. **R16 wiring** — once the marketing worker is deployed, hit
   `/api/marketing/session` from a curl in the dashboard and watch
   `conduit_marketing_logs` rows arrive in realtime. The "Generate"
   button + MarketingSession overlay UI is Phase 3.2.

## Round queue (next)

- **R16 Phase 3.2** — real fal.ai / ElevenLabs / Runway calls,
  MarketingSession overlay, /app/team/marketing Generate button,
  public release with tier caps.
- **R16.5** — OAuth-based posting to IG/TikTok/LinkedIn.
- **R17** — multi-step workflows that chain Engineering + Marketing
  (e.g. "build a landing page for product X and the launch ad
  bundle").
- **R14 (still queued)** — Mobile app (Expo), originally deferred
  multiple rounds back.

## Locked principles (do not re-derive)
- Brevity over preamble.
- No emojis in client-facing output.
- Users never see "Claude", "Anthropic", "Vercel" in any user-facing
  surface.
- Multi-tenant: every query scoped by account_id.
- internal_account=true = Luis = bypasses all tier gates, AND is the
  v1 gate for new execution paths until they ship publicly.
- ANTHROPIC_API_KEY unset in dev shell (Max plan); the bot key lives
  ONLY on the Railway workers.
- Atlas is the only memory writer; all other employees read-only.

## Files always read first by Claude Code
1. `STRATEGY.md`
2. `SESSION_HANDOFF_2026-05-08.md` (this file)
3. `CONDUIT_LOG.md` (full round-by-round history)
