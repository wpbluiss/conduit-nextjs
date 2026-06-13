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

> **⚠️ ARCHITECTURE CHANGE (2026-06-13 eve): the metered Haiku "brain" is DECOMMISSIONED.**
> The `ANTHROPIC_API_KEY` ran out of prepaid credits (~04:45 UTC) and Luis wants **$0 / no
> API credits until revenue**. So the coordination brain was moved off the metered API onto
> the **Max plan ($0)** via GitHub Actions. These pg_cron jobs were **unscheduled** (gone, not
> paused): `praxis_merger`, `praxis_orchestrator`, `praxis_planner`, `praxis_milestone`,
> `praxis_atlas_brief`, `praxis_ticks`, `praxis_watchdog`. Still scheduled (all free, no
> Anthropic API): `praxis_dispatch_flagship`, `praxis_dispatch_fleet`, `praxis_launch_watch`.
> The merger+planner are replaced by **`praxis-coordinator.yml`** (see Workflows). Do NOT
> re-enable the metered crons unless Luis explicitly funds API credits again.

### Edge functions + pg_cron jobs
- `praxis-orchestrator` (Conductor: merged-PR → downstream `claude-queue` issues) — cron `praxis_orchestrator` */15.
- `praxis-planner` (refills each repo's queue, low-water 8 → 10) — cron `praxis_planner` :05 hourly.
- `praxis-dispatcher` (fires/enables/disables repo `claude-autopilot.yml` via token; actions: dispatch|enable_workflow|disable_workflow; body.repos optional) — crons `praxis_dispatch_flagship` */15 (conduit-nextjs), `praxis_dispatch_fleet` hourly (private repos).
- `praxis-merger` (reviewed auto-merge across repos; HARD FLOOR: never merges data-deletes, destructive DB migrations, or secret exposure — those it flags) — cron `praxis_merger` */30.
- `praxis-milestone` (web launch %, capped 90; calls Atlas on +20% milestones) — cron `praxis_milestone` :10 hourly.
- `praxis-launch-watch` (alerts when a PR needs Luis; ALSO probes conduitai.io `/api/health` every run → events `site_down`/`site_up`, re-alert throttled 6h) — cron `praxis_launch_watch` */20. Uses `praxis-notify`.
- `praxis-notify` (sends to Luis: **Twilio SMS LIVE** — secrets TWILIO_ACCOUNT_SID/AUTH_TOKEN/SMS_FROM + OWNER_PHONE; else logs `praxis_runs` event `pending_alert`. Response includes `diag` of which secrets are present + Twilio status, no values leaked. Telegram removed).
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
- **`praxis-coordinator.yml`** (conduit-nextjs only, added 6/13): the merger+planner rebuilt on
  **Max plan ($0)**. Runs Claude Code every 30 min (cron `*/30`) + `workflow_dispatch`: reviews
  open PRs, squash-merges the safe ones (same HARD FLOOR), closes dups, refills `claude-queue`.
  Needs `permissions: id-token: write` (without it, OIDC auth fails). First run 6/13 cleared the
  flagship backlog **27 → 6 open PRs** in 13 min, $0. Trigger manually via the dispatcher:
  `POST praxis-dispatcher {action:"dispatch", workflow:"praxis-coordinator.yml", repos:["wpbluiss/conduit-nextjs"]}`.
  PHASE 2 (not done): extend to private repos — costs Actions minutes (capped by the $0 budget),
  so deferred until web launch is done or revenue exists.
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
- **Atlas VOICE confirmed working 6/13** even with the API key drained — Vapi uses its own LLM
  provider, NOT the dead `ANTHROPIC_API_KEY`. A scripted `{action:"call", message}` is delivered
  verbatim and accurately.
- **⚠️ Atlas ACCURACY bug (open, 6/13):** on a live free-form call, his tool-backed numbers were
  inflated/misleading (e.g. "963 shipped", "213 queued", "23 PRs open") and he stalled ("just a
  sec" x many). The `praxis-atlas-tools` metrics need auditing/tightening so live calls state real
  counts (the scripted-message path is fine). Until fixed, prefer scripted-message calls.

## Current status (as of 2026-06-13, ~02:30 UTC — major gates cleared)
- **conduitai.io is LIVE again.** It was 402/DEPLOYMENT_DISABLED for ~12h (Vercel paused ALL
  of Luis's projects over an overdue invoice — not a code/agent issue). Luis paid; site serves
  latest main. `praxis-launch-watch` now probes `/api/health` every 20m (events `site_down`/`site_up`).
- **Founder-gate items, now DONE:** ① GitHub Actions budget already $0 w/ stop-usage (all 5
  product budgets). ② Stripe live keys + 5 price IDs + webhook secret in Vercel (since May 6;
  prices confirmed live-mode; existing webhook endpoint kept — do NOT create duplicates, each
  endpoint has its own signing secret). ③ e2e CI workflow (`.github/workflows/e2e.yml`) created.
  ④ Twilio SMS CONFIGURED correctly — secrets `TWILIO_ACCOUNT_SID` (the `AC…` Account SID, NOT
  an API key SID), `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM` in Edge Function secrets; notify returns
  channel:sms / 201. **BUT texts are NOT delivering — Twilio error 30034 (US A2P 10DLC not
  registered).** Carriers block the messages post-accept. FIX (Luis, ~10 min, not done): register
  A2P 10DLC in Twilio Console → Messaging → Regulatory Compliance (Sole Proprietor path). Until
  then SMS is dead; use Atlas calls (work) + the `pending_alert` ledger. ⑤ Lunaro (`jonathan-demo`)
  autopilot was failing every hour (missing `CLAUDE_CODE_OAUTH_TOKEN`); token added, re-enabled, green.

## Update 2026-06-13 ~20:00 UTC — coordination moved to Max ($0)
- Metered API credits ran dry overnight → ALL Supabase Haiku agents errored "credit balance too
  low" from ~04:45. Per Luis ($0 until revenue), moved the brain to GitHub Actions on Max (see the
  ARCHITECTURE CHANGE banner + `praxis-coordinator.yml`). Metered crons unscheduled.
- **Coordinator first run: success, 27 → 6 flagship PRs in 13 min, $0.** The 6 held are correct:
  #192/#155 (auth — want review), #146 (needs DB migration), #127/#128 (stale base, rebase needed).
- `praxis-notify` is v9 (always logs a durable `pending_alert` even when SMS attempted, so nothing
  is lost while 10DLC blocks texts). Atlas voice verified working (Vapi ≠ dead key).
- NOT done: confirm billing w/ a real purchase; A2P 10DLC; Phase-2 coordinator for private repos;
  fix Atlas live-call metrics (see Atlas accuracy bug).
- **Build ~70%+ and climbing.** Big 6/12 dedupe: ~20 duplicate PRs closed across repos; merged
  auth UI (#104), e2e suite (#98), backend signup (#25), hero parallax, FAQ anim, a11y rings +
  reduced-motion. Dedupe guards deployed: dispatcher v4 `queueSync` (parks `claude-queue`→`in-flight`
  when an open PR refs the issue) + planner v3 (feeds open-PR/in-flight titles into prompt).
- NOTE: a milestone tick once hallucinated 100% then reverted to 70 — scorer noise; 70 is honest.

## Remaining (mostly human / non-code)
1. **Confirm billing end-to-end** with one real test purchase (keys are in; webhook signature
   must match the endpoint whose `whsec_` is in Vercel `STRIPE_WEBHOOK_SECRET`).
2. App Store submission; final smoke test + go-live; Luis's eye on deployed UI (top design signal).
3. Optional: make mobile/marketing/engineering public for free Actions minutes (keep
   `conduit-backend` + `jonathan-demo` PRIVATE — secrets/client data).

## House rules
- Never put secret VALUES in chat — they go to Supabase Edge Function secrets / GitHub secrets.
- Be honest, no hype; give real %/projections (the milestone scorer is capped at 90 on purpose).
- Hard floor stays: agents never auto-merge data-deletes, destructive migrations, or secret exposure.
- Keep `/finance` untouched (separate product/workstream).
