# Portfolio Audit — wpbluiss / Conduit AI

**Prepared:** 2026-06-04 · **Scope:** every repository, database, deployment and integration reachable from this account · **Mode:** read-only (this file is the only change).

---

## 0. How this audit was done & an honesty caveat

I was given hard access to exactly **one** of your repositories — `wpbluiss/conduit-nextjs` — through both git and the GitHub tools. Every other repo is **access-denied** at the proxy/API layer (`repository ... is not configured for this session`). I could not read their source.

So the confidence level differs by source:

| Source | What it covers | Confidence |
|---|---|---|
| `conduit-nextjs` working tree (read in full) | Marketing site, Praxis Console, Finance app, AI-employee orchestration, integrations | **High** — read the code |
| Live **Supabase** (`mvuslmfjkkuizixjpkgl`) — 200+ tables, row counts, timestamps, RLS advisors | Real usage of every backend, incl. repos I can't read | **High** — live data |
| Live **Vercel** (team `wpbluiss-projects`) — 22 projects, deployment states | What's actually shipped & live vs. erroring | **High** — live infra |
| Live **Higgsfield** generations | The content/production crew's real output | **High** — live data |
| GitHub repo **metadata** (name, language, description, last-push) | The 25 repos I can't open | Medium |
| In-repo **docs** (`CONDUIT_LOG.md`, `STRATEGY.md`, session reports) | Narrative for the workers/bots/mobile/Unity/backend | Medium — author's own notes, not verified against their code |

Where a claim rests only on docs/metadata I say so. Anything about `conduit-nextjs`, Supabase, Vercel and Higgsfield is verified.

---

## 1. Inventory — every repository

**26 repos** under `wpbluiss` (GitHub account created 2026-01-31). Grouped by role. "Last push" is GitHub's `updated_at`.

### Conduit / Praxis core
| Repo | Lang | Last push | Purpose | State |
|---|---|---|---|---|
| **conduit-nextjs** | TS | 2026-06-03 | Flagship: conduitai.io marketing site **+** Praxis Console (the web app) **+** Praxis Private Bank finance app. Next.js 16 / React 19 / Tailwind v4 / Supabase. | **Active** |
| **conduit-backend** | Python | 2026-03-18 | Original orchestration backend ("Jarvis" chief-of-staff + autonomous loop). | **Partially live** — last push March, but a `JARVIS`/`CEO` agent is *still* writing to `shared_memory`/`team_chat_log` **today** (see §3). |
| **conduit-workforce** | Python | 2026-03-21 | The autonomous **~15-agent crew** (HUNTER, CLOSER, SCOUT, SAGE, SOCIAL, AFFILIATE, STRIKER, WATCHDOG, WEBMASTER, JARVIS + n8n hooks + probes). | **Abandoned ~Apr 28** — last `workforce_activity_log` row 2026-04-28. |
| **conduit-client-bot** | JS | 2026-04-02 | Client-facing chat/SMS bot (per the missed-call/salon vertical). | Likely abandoned. |
| **conduit-voice-worker** | TS | 2026-05-12 | R12 LiveKit voice worker (Railway): OpenAI Realtime text-out → ElevenLabs TTS for Praxis voice rooms. | **Active w/ platform** |
| **conduit-engineering-worker** | TS | 2026-05-08 | R15 engineering execution worker (Railway): sandboxed Claude CLI subprocess + Vercel deploy. | **Active w/ platform** |
| **conduit-marketing-worker** | TS | 2026-05-08 | R16 marketing asset (image/video/audio) worker. | **Newest, gated** (internal-account only). |
| conduit-portal | JS | 2026-03-04 | Early Conduit portal. | Superseded / abandoned. |
| conduit-website | HTML | 2026-02-26 | Original static marketing site. | Superseded by conduit-nextjs. |

### Lunaro
| Repo | Lang | Last push | Purpose | State |
|---|---|---|---|---|
| **jonathan-demo** *(private)* | JS (Vite/React SPA) | 2026-05-21 | **Lunaro** — white-label insurance-agency CRM (the product behind the "Lunaro" brand). Deploys as Vercel project `jonathan-demo`. | **Active — most mature product after the site.** |

### Trading
| Repo | Lang | Last push | Purpose | State |
|---|---|---|---|---|
| **conduit-trading-bot** *(private)* | Python | 2026-04-08 | The trading bots themselves (7 agents: FALCON, GOLDRUSH, ORACLE, PROPHET, SCOUT, TITAN, VIPER) across Alpaca + TradeLocker. | **LIVE RIGHT NOW** — writing equity/state rows as of 2026-06-04 14:51 (see §3). |
| **conduit-trading-dashboard** *(private)* | TS | 2026-04-08 | Front-end for the bots (Vercel project `conduit-trader`). | **Frontend stale** since Apr (several ERROR deploys, last good build Apr 8) even though the bots keep running. |

### Unity / HQ ("playable office")
| Repo | Lang | Last push | Purpose | State |
|---|---|---|---|---|
| **conduit-hq-unity-scripts** *(private)* | C# | 2026-04-06 | Unity scripts for the playable HQ/office game. | Unknown (can't read); paused early Apr. |
| **conduit-hq-3d** | JS | 2026-04-06 | Web/WebGPU (Babylon) 3D office — multi-floor, CEO suite, walkable. Deploys + live. | **Demo-live but abandoned** since Apr 6. |
| conduit-hq | HTML | 2026-03-17 | Early HQ landing page. | Abandoned. |

### Client / agency sites (the "done-for-you" book of business)
| Repo | Lang | Last push | Notes |
|---|---|---|---|
| alevare | TS | 2026-05-18 | Luxury hotel-room restoration marketing site. Most recent client work. |
| ajcuts-site / ajcuts-booking / ajcuts-dashboard | HTML | 2026-03–04 | Barbershop: site + booking + dashboard trio. |
| artemi-booking | HTML | 2026-04-01 | Booking site. |
| lux-nail-lounge | HTML | 2026-03-21 | Nail salon site. |
| encanta-site *(private)* | HTML | 2026-03-16 | Nail/spa site. |
| bar9-fire-detection | HTML | 2026-03-21 | Fire-detection company site. |
| olivia-discovery | HTML | 2026-03-22 | AI discovery questionnaire (client onboarding form). |
| Wpbluiss | — | 2026-03-03 | GitHub profile README. |

**Vercel-only projects with no matching repo here** (likely generated builds or experiments): `field-trainer`, `la-cosecha-apparel`, `mateo-booking` (a photographer-booking vertical — `mateo_*` tables exist but are **all empty**), `project-3i3oc`, plus auto-generated `praxis-build-*` projects (output of the engineering worker — proof it deploys end-to-end).

**Active vs. abandoned at a glance:** Active = conduit-nextjs, jonathan-demo, the three Railway workers, conduit-trading-bot (running), alevare. Idle-but-live = conduit-hq-3d, conduit-trader dashboard. Abandoned = conduit-workforce (Apr 28), conduit-portal, conduit-website, conduit-hq, conduit-client-bot, the static client sites.

---

## 2. State of completion (the named projects)

### 2a. Conduit marketing site (`conduitai.io`) — **~95% built, shipping**
Live production deploy 2026-06-03. Every marketing route is real and content-complete:

| Route | Status |
|---|---|
| `/` landing, `/about`, `/approach`, `/careers`, `/changelog`, `/pricing`, `/trust`, `/products` (+ `/praxis-console`, `/praxis-mobile`, `/praxis-hq`), `/customers`, `/customers/lunaro` | **Built** |
| `/auth/sign-in`, `/auth/sign-up` | **Built** — real Supabase email/password auth, redirects to `/app`. |
| `/engineering` | **Half** — page built, but all 3 blog posts are "Coming soon". |
| `/products/praxis-hq` | **Half** — copy/diagram done; the cinematic video is an honest placeholder ("first frames drop when alpha customers walk the lobby"). |
| `/customers/lunaro` | **Half** — case study done except the testimonial ("Quote pending Jonathan review"). |

Design system (`src/lib/design-system`, `globals.css`) is mature (v3 indigo "Praxis Design Language" tokens).

### 2b. Praxis Console — the web app (`conduitai.io/app`) — **~90% built, near-empty in real use**
Auth-gated, Supabase-backed, tier-gated (Free/Pro/Enterprise/Internal). Real, working surfaces:

| Section | Status | Notes |
|---|---|---|
| Workspace dashboard, Team/{employee} workspaces | **Built** | Live activity from real tables. |
| Memory canvas (`/app/memory`) | **Built** | Node-graph, pin/lock, persisted to `conduit_memory`. |
| Builds + Build cinema (`/app/builds`) | **Built** | Real engineering sessions w/ logs, deploy URL, GitHub repo. |
| Voice room (`/app/voice`) | **Built** | Tier-gated participants, daily caps, session history. |
| Artifacts, Settings (Profile/Business/Voice/Usage/Billing), Voice-history | **Built** | Billing wired to Stripe. |
| Analytics (`/app/analytics`) | **Half** | 3 real cards; rest is "more coming soon". |
| Settings → Team | **Stub** | Teases "personality tuning". |
| `pdl-scratch`, `praxis-scratch` | **Dev-only** | Design-system galleries; marked for deletion before merge. |

**Reality check from the database:** only **3 `conduit_accounts`, 62 `conduit_messages` (last 2026-05-24), 1 engineering session, 2 voice sessions.** The console is *built* but essentially **unused outside your own testing** — there is no real customer traffic on it yet.

### 2c. Praxis Mobile (`conduit-mobile`, Expo) — **can't read; marketed as "TestFlight this week"**
Repo exists (TS/Expo, last push 2026-05-14). Marketing site sells it as TestFlight-imminent with a waitlist form (`conduit_waitlist` table exists, **0 rows**). No evidence of an actual published build. Treat as **early/in-progress**.

### 2d. Lunaro (`jonathan-demo`) — **most complete product; real data; live in production**
A genuinely deep, multi-tenant insurance-agency CRM. Live Vercel production (last 2026-05-21) with **~150 `lunaro_*` tables** and **real populated data**:

- 261 contacts, 157 policies, 168 pipelines / 1,336 pipeline stages, 111 appointments, 92 leads, 48 documents, 46 plans, 200 AEP-outreach rows, 132 automation workflows / 561 steps, 14 agency accounts, 12 company members.
- Whole feature set: contacts, opportunities, policies, AEP center, calendars/appointments, automations, documents/e-sign envelopes, compliance corpus, billing, chat channels, recruitment, commissions.
- Heavy QA discipline: many `agent/qa-*` persona test branches (Maria, Diego, Sandra, Rachel, Tom) running two-layer Playwright + DB-assertion tests.

**Honest gaps (from its own commits):** an "integration-honesty" pass labels only **Supabase + Vercel as truly live**; **Twilio (SMS/voice), Google Calendar, Outlook, Resend (email), DocuSign are scaffolded** with explicit "Missing: …" notes. So the CRM *core* works; outbound comms/e-sign are not wired to real providers. Subscriptions: **27 rows, 26 `trialing` + 1 `active`** — i.e. demo/trial accounts, one live-ish.

### 2e. Unity build / playable HQ — **two parallel attempts, both paused**
- `conduit-hq-3d` (web/WebGPU): walkable multi-floor office, CEO suite, post-processing. Deployed and openable, but untouched since **2026-04-06**.
- `conduit-hq-unity-scripts` (C#): the actual Unity version. Can't read; last push 2026-04-06.
- `conduit-hq` (HTML): early landing, abandoned.

Net: a **playable demo exists** (web 3D), the Unity track is paused, neither is a shipped product.

---

## 3. The agents — roster, invocation, memory, orchestration

There are **two distinct agent systems**, which is important to untangle:

### A) In-product "AI employees" — inside `conduit-nextjs` (verified, wired)
Nine employees, all Anthropic-backed, branded so users never see "Claude":

| Employee | Role | Invocation | Memory | Status |
|---|---|---|---|---|
| **Atlas** (was "Jarvis") | Chief of staff / router | `POST /api/conduit/chat` | `conduit_memory` (sole **writer**) | **Wired** — routes via `[HANDOFF]`, synthesizes round-tables |
| Marketing | Content + visual assets | chat / `POST /api/marketing/session` | `conduit_memory` (read, scoped) | Chat wired; **visual worker gated** to internal accounts |
| Engineering | Builds & ships real sites | chat / `POST /api/engineering/session` | scoped read | **Wired end-to-end** — GitHub repo + Vercel deploy via Railway worker (the `praxis-build-*` Vercel projects are its output) |
| Sales | Pipeline / outreach | chat + `/api/sales/*` | scoped read | Lead **discovery** wired (Overpass/Reddit/Google Maps); **outreach not automated** |
| Finance | Household money advisor | `POST /api/finance/advisor` | `fin_*` tables | **Wired** — Opus + tool-use, real read/write on your finances |
| Compliance, HR, Operations, Legal | Advisory specialists | chat | scoped read | **Wired but advisory** — produce artifacts (docs/contracts/SOPs), no external execution |

**Orchestration (verified):** user → `/api/conduit/chat` → load account + last-10 messages + scoped memory → intent classify (routing/creative/reasoning/code/factual → Haiku/Sonnet/Opus) → either **round-table** (parallel employees + Atlas synthesis) or **single employee**; Atlas can hand off (recursive call), write memory (`[REMEMBER]`/`[SUPERSEDE]`), and emit artifacts. SSE streaming + ElevenLabs TTS bridge. Usage logged to `conduit_usage_events`; tier + token + spend caps enforced.

**Memory model:** `conduit_memory` + `conduit_memory_scope` — Atlas writes, everyone reads their scope, users can pin/lock nodes. This is real and persisted (13 memory rows currently).

**Inter-agent comms:** only via Atlas handoff/brief in a single chat. There is **no shared tool bus** — Employee A cannot call Employee B's tools directly.

### B) The standalone autonomous fleet — `conduit-backend` / `conduit-workforce` / trading bots (can't read source; judged from live DB)
This is what you meant by "~15 agents incl. production/content crew, research, trading." Evidence from Supabase:

- **Trading bots — LIVE NOW.** `trading_agent_states` and `trading_equity_snapshots` are being written **every few minutes, latest 2026-06-04 14:51**. Seven agents — **FALCON, GOLDRUSH, ORACLE, PROPHET, SCOUT, TITAN, VIPER** — across **Alpaca + TradeLocker**. ~98k state rows, ~67k equity snapshots, 80 config rows. **But `trading_trades` = 0** — no executed trades are landing in the trades table; the bots are monitoring/logging equity & state but (at least by that table) **not booking trades**. The dashboard frontend is stale (Apr).
- **Jarvis/CEO loop — still alive.** `team_chat_log` (source `JARVIS`, last **today 12:24**) and `shared_memory` (sources `JARVIS`, `CEO`, `JARVIS_CALL`, `BROSKIE`, `SYSTEM` — 1,319 rows, last **today 14:24**). Something from the `conduit-backend` lineage is still running and journaling.
- **The workforce crew — stopped.** `workforce_activity_log` (2,774 rows) names the full crew — **HUNTER, CLOSER, SCOUT, SAGE, SOCIAL, AFFILIATE, STRIKER, WATCHDOG, WEBMASTER, JARVIS**, plus `N8N_CONVERSION`/`N8N_WATCHDOG` automations and `*_PROBE` health checks — with human-readable cadences ("SOCIAL — scanning Reddit every 6 hrs", "AFFILIATE — finding partners daily"). **Last activity 2026-04-28.** This crew is **dormant**.
- **`agent_messages` (the inter-agent bus) = 0 rows**, RLS off. The cross-agent messaging table was created but **never used** — the orchestration between these standalone agents was scaffolded and never finished.

### C) The content/production crew — **Higgsfield** (live, but not in any repo)
Your "production/content crew" runs through the connected **Higgsfield** account, not code. Recent generations are real: UGC-style creator stills, **cinematic insurance brand visuals** (clearly Lunaro), `seedance` 9:16/16:9 videos, location plates ("Wynwood Tech Loft", "Greenacres Bedroom Office"), and a Lunaro concept board. So the content crew **is producing**, but it lives in Higgsfield + the `conduit-marketing-worker`, not wired into the apps.

**Orchestration map, honest version:** The *in-product* employee orchestration (Atlas + 9) is **fully wired** but barely used. The *standalone fleet* (backend Jarvis + trading + workforce) was a separate, earlier system: trading still runs, a Jarvis loop still journals, but the multi-agent crew and its message bus (`agent_messages`) are **dead/never-finished**. The two systems share one Supabase project but are **not integrated** with each other.

---

## 4. Integrations — connected vs. functional

| Integration | Where | Status | Evidence |
|---|---|---|---|
| **Supabase** (Postgres + Auth + RLS) | everywhere | **Functional** | 200+ tables, server/browser/admin clients, real auth (41 users). |
| **Anthropic** | conduit-nextjs, backend, Lunaro AI, finance | **Functional** | Streaming chat, intent classify, finance tool-use, Reddit scoring. Single key shared across apps. |
| **Stripe** | conduit-nextjs billing; Lunaro billing | **Functional (code)** | Checkout + webhook (idempotent) + portal + tier enforcement. Only **1 `conduit_stripe_events` row** and **0 real Conduit paid subs** → wired but essentially **unexercised**. Lunaro has its own `lunaro_account_subscriptions` (26 trial / 1 active). |
| **LiveKit** | voice room + conduit-voice-worker | **Functional** | Token route mints JWTs w/ metadata; verified live in logs per `CONDUIT_LOG`. |
| **ElevenLabs** | voice TTS | **Functional** | REST + WebSocket streaming, per-employee voices, daily cap. |
| **OpenAI Realtime** | conduit-voice-worker only | **Functional (off-Vercel)** | Intentionally isolated on Railway; not in the web env. |
| **GitHub + Vercel APIs** | engineering builds | **Functional** | Real repo creation + deploy; `praxis-build-*` Vercel projects are the proof. |
| **Higgsfield** | account/MCP + marketing worker | **Functional (external)** | Live image/video generations; **not referenced in any repo's code**. |
| **Lead sources** (Overpass / Reddit / Google-Maps scrape) | sales pipeline | **Functional** | `src/lib/lead-sources/*` + seed script. `sales_leads` currently 0 rows. |
| **Twilio** | Lunaro (SMS/voice), workforce/client-bot | **Scaffolded only** | **Not present in conduit-nextjs at all.** Lunaro has `lunaro_sms_sends`/`_consent` tables + a server wrapper but its own commits flag Twilio as "Missing: A2P 10DLC / verified sender". `mateo_sms_log` empty. |
| **Resend (email), Google Calendar, Outlook, DocuSign** | Lunaro | **Scaffolded** | Labeled non-live in Lunaro's integration-honesty pass; `lunaro_email_sends` has 22 rows so Resend may be partially live. |
| **Trading brokers** (Alpaca, TradeLocker/HeroFX) | conduit-trading-bot | **Functional (live)** | Equity/state being written today; but `trading_trades`=0. |

> ⚠️ **Security finding (critical, verified by Supabase advisor):** **50 tables have Row-Level Security DISABLED** — including `shared_memory`, `jarvis_*`, `trading_config`, `sales_pipeline`, `client_*`, and several `lunaro_*` global tables. Anyone with the **anon key** can read/modify them. Your `fin_*` and `conduit_*` and most tenant `lunaro_*` tables **are** RLS-protected; the exposed ones are mostly the older backend/workforce/trading tables. This predates current work and is noted in `FINANCE_SETUP.md`. Don't blanket-enable RLS (it will lock out the workers that use the anon key) — needs per-table policies or a move to service-role-only access.

---

## 5. Revenue path — what's closest to money

Ranked by proximity to real revenue:

1. **Lunaro (`jonathan-demo`) — closest.** It's a real, populated, multi-tenant insurance CRM live in production with sign-up → onboarding → billing wired (Stripe `lunaro_billing_plans`/`_subscriptions`). **26 trials + 1 active** already exist. **Blocking live revenue:** (a) outbound comms aren't real — Twilio SMS/voice needs **A2P 10DLC + verified caller ID**, Resend needs a **verified sending domain**, e-sign (DocuSign) unwired; (b) trials need to convert (billing exists but is largely untested in anger); (c) it runs on a shared Supabase project with the **RLS-disabled tables** above — a compliance/security risk for an insurance product handling PII/HIPAA-adjacent data.

2. **Praxis Console + marketing site — second.** Sign-up, onboarding, Stripe checkout, tiers, token caps and real agent execution are **all built and deployed**. **Blocking:** essentially **zero customer usage** (3 accounts, 62 messages) and **0 paid subscriptions** — this is a go-to-market/traffic problem, not a build problem. The product is shippable today; nobody is on it.

3. **Done-for-you client sites (alevare, ajcuts, salons, bar9, etc.) — already a cash trickle.** These are simple shipped sites; revenue depends on your services arrangement with each client, not on more engineering.

4. **Trading bots — speculative, not productized.** Running live against Alpaca + TradeLocker, but `trading_trades`=0 means no demonstrable booked P&L, and there's no customer-facing offering. This is R&D / personal capital, not a revenue line yet.

5. **Praxis Mobile / HQ / Unity — not near revenue.** Pre-launch or paused.

**The finance app (`/finance`)** is personal (your household), not a revenue product.

---

## 6. Loose ends — prioritized

Scored on **Done** (how close to finished) and **$$** (how close to making money), High/Med/Low.

| # | Loose end | Done | $$ | Note |
|---|---|---|---|---|
| 1 | **Fix RLS on 50 exposed tables** | Med | — | Security/compliance blocker, esp. for Lunaro PII. Do per-table policies, don't blanket-enable. |
| 2 | **Lunaro: wire real Twilio (A2P 10DLC) + verified email domain + e-sign** | Med | **High** | The last mile between "great demo" and "agencies pay". |
| 3 | **Lunaro: convert the 26 trials → paid** | High | **High** | Billing is built; needs activation/conversion push. |
| 4 | **Get traffic onto Praxis Console** | High | **High** | Product is shippable; 0 paid users. GTM, not code. |
| 5 | **Praxis Mobile: actually publish the TestFlight build** | Low | Med | Marketed as imminent; no evidence of a build or waitlist signups (0 rows). |
| 6 | **Decide the standalone agent fleet's fate** | Low | Med | Workforce crew dead since Apr 28; `agent_messages` bus never used. Either revive + finish orchestration or retire `conduit-workforce`/`conduit-backend`. A Jarvis loop is still running unsupervised — confirm that's intended. |
| 7 | **Trading: confirm trades are executing** | Med | Low | Bots log equity/state live but `trading_trades`=0; verify whether trades fire and redeploy the stale dashboard (Apr, several ERROR builds). |
| 8 | **Marketing site honest placeholders** | High | Low | Lunaro testimonial, Praxis HQ video, 3 "coming soon" engineering posts. |
| 9 | **Praxis Console: finish Analytics + Settings→Team; delete `*-scratch` routes** | High | Low | Small, marked TODOs. |
| 10 | **Praxis HQ / Unity: pick one track or shelve** | Low | Low | Two parallel 3D efforts, both paused since early Apr. |
| 11 | **Repo hygiene** | — | — | Retire/archive superseded repos (`conduit-website`, `conduit-portal`, `conduit-hq`) and empty verticals (`mateo-booking` — all tables empty) to reduce surface area. |

---

## Top 3 findings

1. **Lunaro is your real business; treat it as the priority.** It's the only product with depth, real data (261 contacts / 157 policies / 168 pipelines), live billing, and paying-shaped accounts (26 trials + 1 active). The gap to revenue is small and specific: real Twilio/email/e-sign wiring and trial conversion — not more features.

2. **Praxis (Console + site) is built but empty; the bottleneck is demand, not engineering.** Auth, 9 wired AI employees, real GitHub→Vercel build execution, voice, Stripe tiers — all shipped and deployed — yet only 3 accounts, 62 messages, and **0 paid subscriptions**. You're sitting on a finished product with no traffic.

3. **The agent estate is split and partly unsupervised, with a real security hole.** Trading bots are running live *today* (7 agents, but 0 booked trades), a Jarvis/CEO loop is still journaling to shared memory daily, while the 15-agent "workforce" crew has been dead since Apr 28 and its inter-agent message bus was never used. Meanwhile **50 Supabase tables — including agent memory and trading config — have RLS disabled and are readable with the anon key.** Decide what stays running, and lock down the data.
