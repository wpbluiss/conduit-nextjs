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
STRIPE_PRICE_ENTERPRISE_MONTHLY, STRIPE_PRICE_TOPUP_10/25/50,
SUPABASE_SERVICE_KEY (R11 admin client falls back to this; canonical
name is SUPABASE_SERVICE_ROLE_KEY — add as soon as convenient).

R12 additions (Vercel side):
  LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL — LiveKit Cloud creds
  for /api/voice/token. Worker uses the same values.
  CONDUIT_WORKER_SECRET — shared secret between Vercel and Railway worker.
  Worker passes it in x-conduit-worker-secret to call /api/voice/memory-write.

R12 additions (Railway worker only — NOT on Vercel):
  OPENAI_API_KEY — Realtime API access, kept off Vercel to isolate cost
  surface. Plus all of the Vercel-side R12 vars + SUPABASE_SERVICE_KEY +
  ANTHROPIC_API_KEY (transcript summary via Haiku).

## Round queue (locked order)
- R11: SHIPPED to prod. Free-source lead pipeline (Overpass discovery
  + Reddit intent + Playwright Maps enrichment). FB cut — Meta v.
  Bright Data. Sales workspace at /app/team/sales backed by real
  prospects. Tables: sales_leads, reddit_lead_sources,
  lead_intent_signals. APIs: POST /api/sales/refresh-leads,
  GET/PATCH /api/sales/leads. Pre-seeded: 21 real WPB+Boca+Delray+
  Jupiter med spa leads via Overpass.
- R12: SHIPPED + verified live. Voice Room functional end-to-end.
  Voice ID Jarvis = UgBBYS2sOqTuMpoF3BR0 (Mark - Natural Conversations),
  ElevenLabs upgraded to Starter (free tier returns payment_required
  on streaming WS). Container CA-certs fixed the rtc-node TLS hop
  to /settings/regions. Polish round added inbound-audio-energy gate
  + 800ms interrupt cooldown on the worker so VAD jitter no longer
  self-cancels the agent's response.
- R13: SHIPPED to prod. Streaming TTS in text chat — audio starts
  ~500-900ms after first sentence instead of 8-12s for full response.
  /api/conduit/chat now multiplexes audio chunks into the SSE
  stream as event:'audio'. Web Audio queue on the client schedules
  PCM chunks back-to-back. Migration 015 adds
  accounts.streaming_tts_enabled + conduit_voice_chat_sessions
  usage log + 50k daily char cap. Settings toggle deferred — runs
  ON by default with the existing voice_enabled + voice_auto_play
  prefs gating it.
- R12.5: SHIPPED (functional core). Worker rewrite (Option B —
  single Realtime + single rotating ElevenLabs WS + Haiku router)
  is live on Railway. Round-robin trigger phrases ('team',
  'everyone', 'go around', etc.) fire 1-sentence-each + Jarvis
  closer. Single LiveKit audio track; frontend tracks active
  speaker via 'active_speaker' data events from the worker.
  Multi-avatar VoiceRoom layout shows all participants with the
  speaking one highlighted. Voice IDs assigned for all 9 employees
  (see docs/voice-picks.md). DEFERRED to next session: Voice mode
  button in /app/page.tsx chat header, and 'Bring in employee'
  modal for upgrading a solo room to roundtable in place.
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
