# PRAXIS FLEET — operating state & handoff

Read this first. It's the live state of Luis Garcia's autonomous AI engineering fleet so a
new Claude Code session can pick up seamlessly. (Names of secrets only — never values.)

## Who / what
- Founder: **Luis Garcia**. Company: **Conduit AI** (parent). Flagship: **Praxis** — a chat
  platform where an autonomous agent fleet builds his businesses. Live: **conduitai.io**.
- Other products/repos: **Lunaro** (white-label insurance CRM = `jonathan-demo` repo +
  `lunaro_*` Supabase tables), a trading bot, a Unity 3D "Conduit HQ" (paused).
- Goal: ship Praxis web + iOS App Store, revenue via organic marketing. Solo founder, busy
  at a day job, mostly on phone. **Full autonomy granted** (agents merge after review).

## Supabase (the fleet brain)
- Project id: **`mvuslmfjkkuizixjpkgl`**. Fleet edge functions use custom auth:
  header **`x-praxis-secret` == conduit_secrets.PRAXIS_CRON_SECRET** (verify_jwt off).
- Secrets present (names): `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `PRAXIS_CRON_SECRET`,
  `OWNER_PHONE` (in `conduit_secrets`); `GITHUB_ORCHESTRATOR_TOKEN`, `VAPI_API_KEY`,
  `VAPI_ATLAS_ASSISTANT_ID`, `VAPI_PHONE_NUMBER_ID` (Edge Function env). Telegram removed.
  NOT yet added: `TWILIO_ACCOUNT_SID/AUTH_TOKEN/SMS_FROM` (for SMS alerts).
- Daily spend cap: `praxis_config.daily_spend_cap_usd` = $5 (Haiku layer). Agents run on
  Luis's Claude **Max plan ($0)** via GitHub Actions, not this cap.

### Edge functions + pg_cron jobs
- `praxis-orchestrator` (Conductor: merged-PR → downstream `claude-queue` issues) — cron `praxis_orchestrator` */15.
- `praxis-planner` (refills each repo's queue, low-water 8 → 10) — cron `praxis_planner` :05 hourly.
- `praxis-dispatcher` (fires/enables/disables repo `claude-autopilot.yml` via token; actions: dispatch|enable_workflow|disable_workflow; body.repos optional) — crons `praxis_dispatch_flagship` */15 (conduit-nextjs), `praxis_dispatch_fleet` hourly (private repos).
- `praxis-merger` (reviewed auto-merge across repos; HARD FLOOR: never merges data-deletes, destructive DB migrations, or secret exposure — those it flags) — cron `praxis_merger` */30.
- `praxis-milestone` (web launch %, capped 90; calls Atlas on +20% milestones) — cron `praxis_milestone` :10 hourly.
- `praxis-launch-watch` (alerts when a PR needs Luis) — cron `praxis_launch_watch` */20. Uses `praxis-notify`.
- `praxis-notify` (sends to Luis: **Twilio SMS** when configured, else logs to `praxis_runs` event `pending_alert`; Telegram intentionally removed).
- `praxis-atlas-brief` (daily status text/call) — cron `praxis_atlas_brief` 13:00 UTC.
- `praxis-atlas-call` (Vapi: inspect | configure | call; injects live `{{status}}`).
- `praxis-atlas-tools` (Vapi voice-tool server — Atlas's hands: `fleet_status, repo_status,
  pending_prs, read_pr, recent_ships, queue_work, dispatch_now, remember, recall, think_hard
  (reason + web search), text_me`). SAFE: voice can read/queue/dispatch, never merge prod/secrets.
- `praxis-call-transcripts` (read recent Vapi call transcripts).

### Key tables
`praxis_config`, `praxis_repos` (full_name, enabled, agents_wired), `praxis_repo_edges`,
`praxis_cross_repo_dispatches` (issue/merge outbox+log), `praxis_orchestrator_state`
(company_goal, launch_pct_last), `praxis_atlas_memory`, `praxis_notified_prs`,
`praxis_briefs`, `praxis_runs` (ledger).

## Repos (org: wpbluiss)
Wired with agents (`agents_wired=true`): `conduit-nextjs` (web, **PUBLIC**, live),
`conduit-mobile`, `conduit-backend`, `conduit-marketing-worker`, `conduit-engineering-worker`,
`jonathan-demo` (Lunaro). Not wired: `conduit-hq-unity-scripts`, `conduit-trading-bot`.
**conduit-nextjs is public (free Actions); the rest are private (cost Actions minutes).**

### Workflows per wired repo
- `claude.yml` (interactive @claude), `claude-autopilot.yml` (autonomous build — auth via
  `CLAUDE_CODE_OAUTH_TOKEN` = Max $0; `--permission-mode bypassPermissions`; conduit-nextjs:
  8 issues/run, max-turns 160), `post-deploy-qa.yml` (smoke-tests conduitai.io),
  `ui-design-review.yml` (conduit-nextjs: screenshots live pages → Claude vision critique → fixes/issues).
- **`auto-review-merge.yml` is DISABLED everywhere** (redundant — `praxis-merger` does merging).
- Standards the agents follow: `CLAUDE.md`, `AGENTS.md`, `DESIGN.md` (world-class UI bar),
  `ORCHESTRATOR.md`, `AGENT_REPLICATION.md`. Labels: `claude-queue` (work), `[LAUNCH-BLOCKER]`, `[UI]`.

## Atlas (phone chief of staff)
- Calls **from 561-678-3691 → to OWNER_PHONE (+1 561-446-4520)** via **Vapi**.
- Assistant "Atlas — Chief of Staff": brain `claude-sonnet-4-20250514`, voice ElevenLabs
  `JBFqnCBsd6RMkjVDRZzb`, transcriber Deepgram nova-2 (cascade — true S2S realtime was tried
  but interrupted on background noise, so reverted). 11 tools wired (above). Accuracy-locked
  prompt (never invent; only state tool/`{{status}}` data). Trigger a call:
  `POST praxis-atlas-call {action:"call", message:"..."}` with `x-praxis-secret`.

## Current status (as of 2026-06-12)
- **Web Praxis ~70% launch-ready (build).** Done: legal, SEO, account deletion, rate-limit,
  analytics, onboarding, polish. Remaining: auth flow, billing/Stripe, tests/CI. ~2 days code.
- All 6 wired repos sprinting. ~17+ PRs merged 6/12. UI loop + DESIGN.md just added.

## Pending HUMAN gates (only Luis — agents can't do these)
1. **Set GitHub Actions spending limit to $0** (Billing) — URGENT, private repos are running.
2. **Add live Stripe keys** when the billing PR is ready (revenue gate).
3. (Optional) add Twilio secrets for SMS alerts; or make mobile/marketing/engineering public
   for free minutes (keep `conduit-backend` + `jonathan-demo` PRIVATE — secrets/client data).
4. App Store submission; final smoke test + go-live; his eye on deployed UI (top design signal).

## House rules
- Never put secret VALUES in chat — they go to Supabase Edge Function secrets / GitHub secrets.
- Be honest, no hype; give real %/projections (the milestone scorer is capped at 90 on purpose).
- Hard floor stays: agents never auto-merge data-deletes, destructive migrations, or secret exposure.
- Keep `/finance` untouched (separate product/workstream).
