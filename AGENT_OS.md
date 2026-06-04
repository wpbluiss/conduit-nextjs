# Praxis Agent OS

An always-on, autonomous AI workforce that runs **serverless on Supabase** — control
plane in Postgres, agent loops as Edge Functions, ticked by `pg_cron`, calling out via
`pg_net`. No process on a machine that can silently die (which is what killed the prior
`conduit-workforce` fleet on 2026-04-28).

> **Status:** Phase 0 deployed and **paused**. Nothing runs or spends until `praxis_go_live()`.

---

## Why the last fleet died — and the fix for each

| Failure (observed) | Fix in this OS |
|---|---|
| No heartbeat → it stopped silently, nobody knew | `praxis_agents.heartbeat_at` + **Watchdog** that pages a human |
| `agent_messages` had 0 rows → agents never coordinated | `praxis_messages` bus is the only coordination substrate |
| No human escalation | `praxis_approvals` gates + `praxis_alerts` paging |
| No cost governance | per-agent + global daily caps, enforced every tick; Watchdog kills runaways |
| State in process memory → restart = amnesia | all state in Postgres; agents stateless + idempotent between ticks |

## The cost model (the whole ballgame)

A Max subscription powers **interactive** sessions (claude.ai, human-driven Claude Code).
It is **not** an API key and cannot drive an unattended, headless fleet. So the autonomous
part **must** use the Anthropic API (pay-per-token). The fix is a **hybrid**:

| | Runs on | Pays with | Does |
|---|---|---|---|
| **The fleet** (always-on) | Supabase + cron | API, capped **$5/day** | Heartbeats, monitoring, triage, queue-keeping, drafting, daily briefs, and **packaging big jobs** |
| **The muscle** (on-demand) | Claude Code sessions | **Max plan (already paid)** | The Unity build, real coding, heavy reasoning |

When a field needs real horsepower, the fleet does **not** burn API money grinding on it —
it marks the task `needs_max_session`, writes a ready-to-run `brief`, and a human-driven
Max session executes it. Every field shows daily motion; the expensive thinking stays on
the plan you already pay for.

**Cheapest stack (built in):** Claude Haiku 4.5 + prompt caching (system prompt cached per
tick) + Batch API for non-urgent work. `$5/day` is a hard cap, not a multiplier — efficiency
buys *more within* $5, not unlimited work.

---

## Control plane (Postgres, `public` schema, service-role-locked)

- `praxis_config` — singleton: **master kill switch** (`fleet_enabled`), daily cap, spend tracker.
- `praxis_agents` — registry: role, model, `status`, per-agent `enabled` switch, `heartbeat_at`, budget.
- `praxis_tasks` — durable queue: `queued→assigned→in_progress→{done,failed,needs_human,needs_max_session}`; `execution_mode` = `auto` | `max_session`; `brief` for handoffs.
- `praxis_messages` — the agent bus.
- `praxis_runs` — append-only heartbeat + activity + per-call token/cost trail.
- `praxis_alerts` — Watchdog → human (SMS once Twilio creds exist).
- `praxis_approvals` — nothing irreversible/external runs without an approved row.

All tables have RLS enabled with no policies → only the service-role key (used by the Edge
Functions) can touch them.

## Runtime (Edge Functions)

- **`praxis-agent-tick`** — universal loop for workers + the Atlas supervisor. Checks kill
  switches → heartbeat → budget → claims one task → Haiku (cached) → writes result/cost. For
  `max_session` tasks it writes a handoff brief instead of grinding. Atlas keeps every field
  fed with tasks and writes a daily brief.
- **`praxis-watchdog`** — no LLM ($0): stale-heartbeat detection, budget breach, stuck-task
  requeue, and **SMS paging** via Twilio the instant creds exist.

Both require header `x-praxis-secret` (= `conduit_secrets.PRAXIS_CRON_SECRET`) and
**hard-return when `fleet_enabled = false`**.

## Scheduler

`pg_cron` jobs (created **inactive**): `praxis_ticks` (*/5 min), `praxis_watchdog` (*/10 min).
Dispatchers post to the Edge Functions via `pg_net`, and also self-gate on `fleet_enabled`.

---

## Roster (10 agents, all paused)

`atlas` (supervisor), `watchdog`, `engineering`, `unity`, `marketing`, `sales`, `finance`,
`ops`, `research`, `trading` (monitoring only — no trades without an approved gate).

## Go-live runbook (one switch)

```sql
-- 1. (optional but recommended) wire SMS paging — add to conduit_secrets:
--    TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM, PRAXIS_ALERT_PHONE
-- 2. arm the system:
select praxis_go_live();      -- fleet_enabled=true + cron active
-- 3. turn on agents (all, or pick):
select praxis_enable_all();   -- or: select praxis_enable_agent('marketing');
```

To stop everything instantly:

```sql
select praxis_pause();        -- fleet_enabled=false + cron inactive. Zero ticks, zero spend.
```

### Watch it work

```sql
select agent, event, cost_usd, created_at from praxis_runs order by created_at desc limit 50;
select field, status, title from praxis_tasks order by updated_at desc;     -- 'needs_max_session' = teed up for you
select severity, message, created_at from praxis_alerts where needs_ack order by created_at desc;
select name, status, heartbeat_at, spend_today_usd from praxis_agents;
select spend_today_usd, daily_spend_cap_usd from praxis_config;
```

## Roadmap

- **Phase 0 (done):** control plane, runtime, watchdog, scheduler, cost governance — paused.
- **Phase 1:** go live with 1–2 agents on a real task; prove 72h uptime + one approval gate exercised + SMS paging confirmed.
- **Phase 2:** scale to the full roster across fields.
- **Phase 3:** richer supervisor decomposition, the message bus in active use, cross-project scope.

## Teardown (fully reversible)

```sql
select praxis_pause();
select cron.unschedule('praxis_ticks'); select cron.unschedule('praxis_watchdog');
drop table praxis_config, praxis_agents, praxis_tasks, praxis_messages,
           praxis_runs, praxis_alerts, praxis_approvals, praxis_cron_jobs cascade;
-- plus drop the praxis_* functions and the two Edge Functions.
```
