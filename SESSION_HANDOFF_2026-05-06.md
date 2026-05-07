# Session Handoff — End of R10, Heading into R11

## Where we are
- Conduit AI: R1-R10 shipped to conduitai.io. Live and working.
- Lunaro: 100% shipped at jonathan-demo.vercel.app (R1-R7).
- Last round: R10 (cross-conversation memory layer). Tested live — Jarvis remembers Lunaro partnership context across conversations, round-table fires real parallel handoffs, memory writes visible at /app/settings → Memory.

## Round map shipped
- R1: chat shell, schema, 4 employees
- R2: cost optimization + visual identity + R1 fixes
- R2.5: life pass (gradient, pulses, hover affordances)
- R3: marketing fix + intent classifier + Creator Mode v2
- R4: Stripe billing schema + tier enforcement + paywall
- R5: voice mode (ElevenLabs TTS + browser STT)
- R6: full team — Finance/Compliance/HR/Ops/Legal employees
- R7: real Engineering execution (templates → live Vercel URLs)
- R8: department workspaces + time-aware system prompts
- R9: round-table mode + conversation icons + perf pass + voice fix
- R10: cross-conversation memory (tag-based [REMEMBER]/[SUPERSEDE] tools, Jarvis-only writer, all-employee read injection)

## Live env vars on conduit-nextjs Vercel
ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, VERCEL_API_TOKEN, GITHUB_PAT,
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_PRO_MONTHLY,
STRIPE_PRICE_ENTERPRISE_MONTHLY, STRIPE_PRICE_TOPUP_10/25/50

## Round queue (locked order)
- R11: Free-source lead generation for Sales (Google Maps, public reviews, FB groups — no Apollo budget)
- R12: Voice Room (full-duplex live conversation, WebRTC + VAD + per-employee voices + waveform UI) — THE big one
- R13: Streaming TTS bridge (R9 deferred — audio starts within 1 sec instead of 10)
- R14: Mobile app (Expo)
- R15: Open-ended Engineering execution via Claude Code subprocess

## Locked principles (do not re-derive)
- Brevity over preamble. No "great question!"
- No emojis in client-facing output
- Conduit users never see "Claude," "Anthropic," "Vercel," etc.
- Multi-tenant: every query scoped by account_id
- Internal_account = Luis = bypasses all tier gates
- ANTHROPIC_API_KEY unset in dev shell (Max plan)
- Don't break R1-R10
- Memory: Jarvis is only writer, all employees read-only

## Files always read first by Claude Code
1. STRATEGY.md (root of repo)
2. SESSION_HANDOFF_2026-05-06.md (this file)
3. briefs/CONDUIT_BRIEF_R10_2026-05-06.md (most recent brief)
4. CONDUIT_LOG.md (full round-by-round history)
