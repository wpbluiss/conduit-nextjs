# PRAXIS FLEET — operating state & handoff

Read this first. Live state of Luis Garcia's autonomous AI engineering fleet so a new
Claude Code session can pick up seamlessly. (Names of secrets only — never values.)

## Who / what
- Founder: **Luis Garcia**. Company: **Conduit AI**. Flagship: **Praxis** — an autonomous
  AI SPECIALIST TEAM for businesses ("Nine specialists. Zero payroll."). Live: **conduitai.io**.
- Praxis is NOT a personal/household-finance app. The `/finance` area in conduit-nextjs is a
  SEPARATE product ("Cadence", household finance) — OFF-LIMITS to the fleet. Never let Cadence
  concepts (household/budget/cash-flow) bleed onto Praxis surfaces.
- Goal: ship Praxis web + revenue. Solo founder, mostly on phone. Full autonomy granted.

## ⚠️ LIVE ARCHITECTURE & GUARDS (updated 2026-06-14) — READ THIS, supersedes older notes
**Coordination runs on the Max plan ($0), NOT the metered API.** The Anthropic API credits
ran dry 6/13; per Luis ($0 until revenue) the brain was moved onto GitHub Actions (Max OAuth).
- **`claude-autopilot.yml`** (conduit-nextjs): SINGLE lane, one issue per run, exits cleanly
  (running to the 160-turn ceiling = a FAILED run + email, so it's scoped to finish early).
  Driven by Supabase `praxis_dispatch_flagship` (*/15).
- **`praxis-coordinator.yml`** (conduit-nextjs): the merger+planner on Max. Refills the
  claude-queue (keeps ~20-30) then merges safe PRs. Driven by Supabase cron
  `praxis_dispatch_coordinator` (*/12) — GitHub's own schedule gets DROPPED under Actions load.
- **DECOMMISSIONED metered crons** (do NOT re-enable without funding API credits):
  `praxis_merger, praxis_orchestrator, praxis_planner, praxis_milestone, praxis_atlas_brief,
  praxis_ticks, praxis_watchdog`. Still active (free, no API): the dispatch crons + launch-watch.

**The 4 reliability guards (these fixed the recurring "something broke overnight"):**
1. **1 build lane** — 3 parallel lanes saturated Actions and starved the merger (2h stall). One lane ships more.
2. **Product-identity guard** (coordinator) — stops Cadence/finance bleeding into Praxis; closes wrong-product PRs.
3. **Migration hold** — coordinator/autopilot NEVER merge or write `supabase/migrations/**`. The pipeline
   has NO migration-apply step; schema must be applied to the live DB by hand (see below).
4. **One-issue / clean-exit autopilot** — prevents max-turns failures + duplicate PRs.

**DB state:** live DB was ~18 migrations behind code (features dark); reconciled 6/14 — applied
030–048 (additive, idempotent) so schema matches code. If new migration files appear, apply them
manually via Supabase MCP `execute_sql` before their feature works (the pipeline won't).

## Console redesign (active, 2026-06-15)
- **CONSOLE_REDESIGN.md is the authoritative /app UI spec.** Direction locked: "Bold & addictive,
  dark" — near-black ink + ONE electric-violet accent. Component-system v2 section adds the founder's
  6/15 mandate: Apple-grade `<Button>`, system-wide glassmorphism, unified icons, a charts/data-viz
  language, refined chat text bubbles, and premium fast "AI is thinking/processing" states.
- Queue (label `claude-queue` + `[REDESIGN]`): button system #799, glassmorphism #800, charts #801,
  AI-thinking states #802, plus existing bubbles #775, composer #776, speed #774/#787/#788, icons
  #796, settings #781, motion #782/#783/#784, etc. Coordinator prioritizes `[REDESIGN]`.

## Supabase (project `mvuslmfjkkuizixjpkgl`)
- Edge fns use custom auth: header `x-praxis-secret` == `conduit_secrets.PRAXIS_CRON_SECRET`.
- Secrets present: `ANTHROPIC_API_KEY` (OUT OF CREDITS — metered layer off), `ELEVENLABS_API_KEY`,
  `PRAXIS_CRON_SECRET`, `OWNER_PHONE`, `TWILIO_ACCOUNT_SID/AUTH_TOKEN/SMS_FROM` (in conduit_secrets/
  edge env); `GITHUB_ORCHESTRATOR_TOKEN`, `VAPI_*`.
- Still-used edge fns: `praxis-dispatcher` (fires repo workflows incl. coordinator), `praxis-notify`
  (Twilio SMS — see below), `praxis-launch-watch` (PR alerts + conduitai.io uptime probe),
  `praxis-atlas-call`/`-tools`/`-call-transcripts` (Atlas phone).
- **Storage buckets:** `conduit` (PUBLIC, 10MB) created 6/15 — was MISSING, which 500'd every voice
  note, workspace-logo, and account-avatar upload (all three routes hard-code `BUCKET="conduit"`).
  Other buckets: `gallery`, `mateo-photos` (public), `lunaro-documents` (private).

## Voice (two separate features — don't conflate)
- **Voice notes in chat** (`/api/conduit/voice/message`): records a clip, uploads to the `conduit`
  bucket. Was 500ing ("voice upload error") only because the bucket didn't exist — FIXED 6/15.
- **Voice ROOM / live agent** (`/api/voice/token` → LiveKit → `conduit-voice-worker` on Railway):
  token endpoint mints 200 (LIVEKIT_* env present on Vercel). The live agent is the dead part —
  it needs the **Railway worker running** + **OpenAI Realtime** + **ElevenLabs**, all metered/
  always-on. No voice session has recorded a duration since **2026-05-14** (today's test created a
  row with `duration_seconds=null` → agent never completed a turn). This conflicts with $0-until-
  revenue; it's a funding/infra decision, not a conduit-nextjs code bug. Worker last shipped 5/12.

## Repos (org wpbluiss)
Wired: `conduit-nextjs` (web, PUBLIC, the launch priority + only one with the Max coordinator),
`conduit-mobile`, `conduit-backend`, `conduit-marketing-worker`, `conduit-engineering-worker`,
`conduit-voice-worker` (Railway, OpenAI Realtime→ElevenLabs bridge), `jonathan-demo` (Lunaro).
Private repos cost Actions minutes (Luis set Actions budget $0).

## Atlas (phone chief of staff, via Vapi)
- Calls from 561-678-3691 → OWNER_PHONE. Brain `claude-sonnet-4` via Vapi (its OWN provider, NOT
  the dead ANTHROPIC_API_KEY — so calls WORK). Trigger: `POST praxis-atlas-call {action:"call",
  message:"..."}` with x-praxis-secret. Scripted-message calls are accurate.
- ⚠️ Atlas ACCURACY BUG (open): on free-form live calls his tool-backed numbers inflate/hallucinate
  ("963 shipped" etc.). `praxis-atlas-tools` metrics need auditing. Prefer scripted-message calls.

## Current status (2026-06-15)
- Site LIVE & healthy, shipping continuously on the stable config. DB reconciled. Funnel pages
  (home/pricing) clean; FAQ Cadence-bleed scrubbed (PR #401). Build green.
- Console redesign in flight (see section above). Voice notes fixed; voice room agent dormant.
- Honest readiness: features ~high, but VERIFIED launch-readiness gated on the items below. The
  product is feature-rich; "ready to take a paying customer" is unproven until the test purchase.

## Pending HUMAN gates (only Luis)
1. **$10 test purchase** — billing code + webhook are live but NO real purchase has succeeded.
   This is the money switch; a Claude session can verify webhook→account upgrade live in real time.
2. **SMS is configured but BLOCKED** — Twilio returns error 30034 (US A2P 10DLC not registered).
   Register A2P 10DLC in Twilio Console (Messaging → Regulatory Compliance, Sole Proprietor path).
   Until then alerts log to `praxis_runs` (event pending_alert); Atlas CALLS work as the channel.
3. Walk the live funnel on a phone (sign up → use a specialist → upgrade) and report breakage.
4. **Voice room** — decide whether to fund the always-on stack (Railway worker + OpenAI Realtime +
   ElevenLabs). Until then the live room won't talk back even though the UI + token work.
5. App Store (native) = separate, days-long, Apple-account-gated track. The PWA (installable) is
   the "downloadable app" for now.

## House rules
- Never put secret VALUES in chat. Be honest, no hype, real %/projections.
- Hard floor: agents never merge data-deletes, destructive migrations, secret exposure, or
  `supabase/migrations/**` (pipeline can't apply migrations); never touch `/finance` (Cadence).
- Reliability over raw throughput: keep 1 lane + the guards. More builders ≠ more shipped.
