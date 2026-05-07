# Session Handoff — End of R15, Heading into R15.5

## Where we are
- Conduit AI: R1-R10 + Brand-1..4 + R12 + R12.5 + R13 + R15 staged on conduitai.io.
  Live and working. R15 build path is internal-only and requires Railway + env
  vars before the button does anything.
- Lunaro: 100% shipped at jonathan-demo.vercel.app (R1-R7).
- Last round: R15 (real Engineering execution via claude CLI subprocess in a
  sandboxed Docker container on Railway). Worker repo:
  wpbluiss/conduit-engineering-worker.

## Round map shipped
- R1-R10: see SESSION_HANDOFF_2026-05-06.md
- R11: shipped (sales leads)
- R12: shipped (voice room)
- R12.5: shipped (round-table worker)
- R13: shipped (streaming TTS)
- R14: deferred (mobile)
- Brand-1..4: shipped (Conduit/Praxis split + marketing rewrite + product pages)
- R15: STAGED (this round). Demo path needs Railway deploy.

## R15 status — STAGED, awaiting Railway deploy + env

Code merged on Praxis branch feat/conduit-r15-engineering (HEAD ae8060d) — this
branch needs a final review + merge to main when you're ready to flip the
button on for internal demos. Worker repo wpbluiss/conduit-engineering-worker
is on main (HEAD e748897).

### What's live without you doing anything
- Migration 018_engineering applied to project mvuslmfjkkuizixjpkgl.
  conduit_engineering_sessions + conduit_engineering_logs created;
  conduit_conversations gained engineering_session_id FK; both new tables
  added to supabase_realtime publication.

### What needs you to ship the demo
1. Railway: new service from wpbluiss/conduit-engineering-worker (Dockerfile
   builder). Env:
   - ANTHROPIC_API_KEY = the bot key (~$24 balance)
   - VERCEL_API_TOKEN = same value as conduit-nextjs Vercel uses
   - NEXT_PUBLIC_SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - ENGINEERING_WORKER_SECRET = `openssl rand -hex 32`
   - GITHUB_PAT = not used by deploy.ts yet (R15.5 audit-trail push)
2. Vercel (conduit-nextjs): merge the Praxis branch to main, then add:
   - ENGINEERING_WORKER_URL = Railway URL (e.g. https://...up.railway.app)
   - ENGINEERING_WORKER_SECRET = same value as Railway
3. Sign in as luisinvestments101@gmail.com (only internal_account for v1),
   open /app/team/engineering, click "Start a build", paste a prompt, click
   "Ship it". The overlay opens; logs stream; deploy URL appears when done.

## Live env vars on conduit-nextjs Vercel (current)
ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, VERCEL_API_TOKEN, GITHUB_PAT,
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_*, SUPABASE_SERVICE_KEY,
LIVEKIT_*, CONDUIT_WORKER_SECRET (R12 voice).

R15 needs added: ENGINEERING_WORKER_URL, ENGINEERING_WORKER_SECRET.

## Round queue (next)
- R14: Mobile app (Expo) — deferred from earlier, still in queue.
- R15.5: Engineering hardening — iptables egress allowlist on the worker,
  per-account spend cap, GitHub audit-trail push (deploy.ts plumbing exists,
  unimplemented), abort/cancel path, tokens-streamed-live (instead of bumped
  at exit).
- R15.6: Public release — open the Engineering button to Pro tier users with
  the spend cap from R15.5.
- R16: Open. Possible candidates: dashboard for engineering session history,
  scheduled builds, multi-step workflows.

## Locked principles (do not re-derive)
- Brevity over preamble. No "great question!"
- No emojis in client-facing output.
- Conduit users never see "Claude," "Anthropic," "Vercel," etc.
- Multi-tenant: every query scoped by account_id.
- Internal_account = Luis = bypasses all tier gates AND is the v1 R15 gate.
- ANTHROPIC_API_KEY unset in dev shell (Max plan) — the bot key lives ONLY on
  the Railway worker for R15.
- Don't break R1-R13.
- Memory: Atlas is the only writer; all employees read-only.

## Files always read first by Claude Code
1. STRATEGY.md (root of repo)
2. SESSION_HANDOFF_2026-05-07.md (this file)
3. CONDUIT_LOG.md (full round-by-round history — Round 15 is at the bottom)

## R15 known v1 limitations (planned for R15.5)
- No iptables egress allowlist on the worker (Railway capability constraint).
- No abort path — "Close session" closes the overlay; the worker keeps running.
- Live token count lags the terminal by seconds (bumped at exit).
- Bot Anthropic key on the worker has no per-account spend cap.
- Chat-triggered build via [START_BUILD: ...] tag is deferred (workspace button
  is the v1 surface).
