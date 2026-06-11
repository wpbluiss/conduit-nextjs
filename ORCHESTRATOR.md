# Conductor — the cross-repo orchestrator

The per-repo Claude Code agents (see `AGENT_REPLICATION.md`) each ship work inside
their own repo. **Conductor** is the layer above them: it watches what every team
ships and, when one team's merged work unblocks another team, it files the next
`claude-queue` issue in the downstream repo automatically. Hub-and-spoke, with
Conductor as the conductor — not a free-for-all mesh.

> Example: the Unity HQ repo merges a new visitor scene → Conductor files a
> "showcase the new HQ on the landing page" issue in `conduit-nextjs`, and a
> "produce launch assets" issue in the marketing repo. You wake up to PRs, not a
> blank backlog.

It runs on the existing Supabase Praxis fleet (same `$5/day` cap, same
`praxis_runs` ledger, same Haiku model + prompt caching). It is **read-only on
code** and **propose-only** — it creates issues; humans/agents still approve every
PR.

---

## How it works

```
merged PR in repo A
        │  (GitHub REST, polled every 15 min)
        ▼
  praxis-orchestrator edge function
        │  reads company goal + dependency edges (repo A → repo B …)
        │  asks Haiku: "does this PR unblock concrete downstream work?"
        ▼
  praxis_cross_repo_dispatches  (durable outbox, deduped per PR→repo)
        │
        ▼
  claude-queue issue filed in repo B  ──►  repo B's autopilot picks it up ──► PR
```

### Moving parts (all in Supabase project `mvuslmfjkkuizixjpkgl`)

| Piece | What it is |
| --- | --- |
| `praxis_repos` | Registry of every repo + a per-repo "last merged PR seen" cursor. |
| `praxis_repo_edges` | The dependency map: `from_repo → to_repo`, when it fires, and the playbook for framing the downstream issue. |
| `praxis_cross_repo_dispatches` | Durable outbox of every issue Conductor decides to file (status: `ready` / `created` / `pending_auth` / `error`). Deduped on `(source_repo, source_pr_number, target_repo)`. |
| `praxis_orchestrator_state` | Singleton: the company goal Conductor optimizes for + global on/off switches. |
| `praxis-orchestrator` edge function | The brain. Custom auth (`x-praxis-secret`). Respects `praxis_config.fleet_enabled` + the daily spend cap. |
| `praxis_dispatch_orchestrator()` + cron `praxis_orchestrator` | Fires the function every 15 minutes via `pg_net`. |
| `conductor` row in `praxis_agents` | Heartbeat + spend visibility alongside the other agents. |

---

## Activation — the one step it needs (≈3 min, phone-friendly)

Conductor is **already deployed and running**. The only thing it can't do yet is
reach GitHub, because that needs a credential it doesn't have. Until you add it,
Conductor logs a `warn` alert each cycle and parks any planned issues as
`pending_auth` — nothing is lost; they flush automatically the moment the token
exists.

1. **Mint a fine-grained GitHub PAT** — `github.com/settings/personal-access-tokens`
   → *Generate new token (fine-grained)*.
   - **Resource owner:** your account (`wpbluiss`).
   - **Repository access:** the conduit repos (or *All repositories* for simplicity).
   - **Permissions:** *Issues* → **Read and write**; *Contents* → **Read-only**;
     *Pull requests* → **Read-only**. (Metadata read is added automatically.)

2. **Store it as a Supabase secret named `GITHUB_ORCHESTRATOR_TOKEN`** — Supabase
   dashboard → your project → *Edge Functions* → *Secrets* (a.k.a. *Manage secrets*)
   → add `GITHUB_ORCHESTRATOR_TOKEN` = the token. The function reads env secrets
   first, so this needs no SQL.

   *Do not paste the token into chat or commit it anywhere.* The Edge Functions
   secret store is the right home for it.

That's it. On its next 15-minute tick Conductor starts watching merged PRs and
filing downstream issues.

---

## Tuning it (plain SQL, no deploy needed)

```sql
-- Change what the whole company is optimizing for:
update praxis_orchestrator_state set company_goal = '…' where id = 1;

-- Add a new dependency (repo A shipping X should queue work in repo B):
insert into praxis_repo_edges (from_repo, to_repo, when_condition, playbook)
values ('wpbluiss/conduit-backend', 'wpbluiss/conduit-nextjs',
        'A new API endpoint ships.',
        'File a claude-queue issue to wire the web client to the endpoint.');

-- Register / pause a repo:
update praxis_repos set watch_merged_prs = false where full_name = 'wpbluiss/conduit-trading-bot';

-- Pause cross-repo orchestration entirely (workers keep running):
update praxis_orchestrator_state set github_polling_enabled = false where id = 1;

-- See what Conductor has filed:
select source_repo, source_pr_number, target_repo, status, github_issue_url
from praxis_cross_repo_dispatches order by created_at desc;
```

## Safety

- **Propose-only.** Conductor opens issues; it never pushes code or merges.
- **Budgeted.** Every reasoning call is charged to the same `$5/day` fleet cap; it
  skips chores/refactors/tiny PRs to avoid noise and spend.
- **Idempotent.** One dispatch per `(source PR → target repo)`; reruns never
  double-file.
- **Least privilege.** The PAT only needs Issues:write + Contents/PRs:read.
- **Fail-safe.** No token → it parks work and tells you; it never crashes the fleet.
