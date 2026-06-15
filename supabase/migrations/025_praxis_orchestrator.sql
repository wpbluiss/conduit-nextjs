-- 025_praxis_orchestrator.sql
-- Conductor: cross-repo orchestration for the Praxis agent fleet.
-- Atlas plans WITHIN repos; Conductor watches merged PRs ACROSS repos and files
-- claude-queue issues in the downstream repo when one team's shipped work unblocks
-- another. Service-role only (RLS on, no policies) like conduit_secrets.
-- Companion: ORCHESTRATOR.md. Edge function: supabase/functions/praxis-orchestrator.

-- Repo registry: which repos exist + a per-repo merged-PR polling cursor.
create table if not exists public.praxis_repos (
  id uuid primary key default gen_random_uuid(),
  full_name text unique not null,
  label text,
  role text,
  default_branch text not null default 'main',
  enabled boolean not null default true,
  watch_merged_prs boolean not null default true,
  last_seen_merged_at timestamptz,
  last_polled_at timestamptz,
  last_warning text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.praxis_repos enable row level security;

-- Dependency map: from_repo shipping X should queue downstream work in to_repo.
create table if not exists public.praxis_repo_edges (
  id uuid primary key default gen_random_uuid(),
  from_repo text not null,
  to_repo text not null,
  when_condition text not null,
  playbook text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (from_repo, to_repo, when_condition)
);
alter table public.praxis_repo_edges enable row level security;

-- Durable outbox of every cross-repo issue Conductor decides to file.
create table if not exists public.praxis_cross_repo_dispatches (
  id uuid primary key default gen_random_uuid(),
  source_repo text not null,
  source_pr_number integer,
  source_pr_title text,
  source_pr_url text,
  target_repo text not null,
  issue_title text not null,
  issue_body text not null,
  labels text[] not null default array['claude-queue'],
  reasoning text,
  status text not null default 'ready',  -- ready | pending_auth | created | skipped | error
  github_issue_number integer,
  github_issue_url text,
  error text,
  created_at timestamptz not null default now(),
  dispatched_at timestamptz,
  unique (source_repo, source_pr_number, target_repo)
);
alter table public.praxis_cross_repo_dispatches enable row level security;

-- Singleton: the company goal Conductor optimizes for + global switches.
create table if not exists public.praxis_orchestrator_state (
  id integer primary key default 1,
  company_goal text,
  github_polling_enabled boolean not null default true,
  last_run_at timestamptz,
  notes text,
  constraint praxis_orchestrator_state_singleton check (id = 1)
);
alter table public.praxis_orchestrator_state enable row level security;

-- ---------------------------------------------------------------------------
-- Seed: company goal, repo registry, dependency map, conductor agent row.
-- ---------------------------------------------------------------------------
insert into public.praxis_orchestrator_state (id, company_goal, github_polling_enabled, notes)
values (
  1,
  'Ship Praxis (Conduit AI''s autonomous AI-workforce product) to production across web (conduitai.io) and the App Store; win real users and revenue through organic marketing; keep every product surface (web, mobile, Unity HQ, backend) in sync. Conductor coordinates the per-repo Claude Code engineering agents so that when one team ships, the next team''s now-unblocked work is automatically queued.',
  true,
  'Cross-repo issue creation requires a GITHUB_ORCHESTRATOR_TOKEN secret (fine-grained GitHub PAT with Issues:write + Contents:read on the conduit repos). Until it exists, dispatches are saved with status pending_auth and flushed automatically once the token is added. See ORCHESTRATOR.md.'
)
on conflict (id) do nothing;

insert into public.praxis_repos (full_name, label, role, default_branch, enabled, watch_merged_prs) values
  ('wpbluiss/conduit-nextjs', 'Praxis Web — conduitai.io', 'The flagship web app + marketing site (Next.js). Production hub.', 'main', true, true),
  ('wpbluiss/conduit-mobile', 'Praxis Mobile (App Store)', 'The Praxis mobile app shipped to the App Store. Mirrors web product features.', 'main', true, true),
  ('wpbluiss/conduit-hq-unity-scripts', 'Conduit HQ — Unity', 'The 3D Unity headquarters experience. Ships feed marketing + web showcase work.', 'main', true, true),
  ('wpbluiss/conduit-backend', 'Conduit Backend', 'Shared backend services / APIs. Ships unblock web + mobile wiring.', 'main', true, true),
  ('wpbluiss/conduit-engineering-worker', 'Engineering Worker', 'Shared engineering tooling / libraries.', 'main', true, false),
  ('wpbluiss/conduit-marketing-worker', 'Marketing Worker', 'Marketing automation / asset pipeline.', 'main', true, false),
  ('wpbluiss/conduit-trading-bot', 'Trading Bot', 'Autonomous trading workstream (monitoring only without an approved gate).', 'main', true, false)
on conflict (full_name) do nothing;

insert into public.praxis_repo_edges (from_repo, to_repo, when_condition, playbook) values
  ('wpbluiss/conduit-hq-unity-scripts', 'wpbluiss/conduit-nextjs',
   'A Unity HQ build, scene, or visitor-facing feature ships.',
   'File a claude-queue issue to showcase the new HQ on the web: add/refresh a landing-page section, embed/screenshot/video, and CTA into the experience. Small and phone-approvable.'),
  ('wpbluiss/conduit-hq-unity-scripts', 'wpbluiss/conduit-marketing-worker',
   'A Unity HQ milestone ships worth announcing.',
   'Queue a marketing issue to produce announcement assets/copy (organic social, short demo clip script) for the new HQ capability.'),
  ('wpbluiss/conduit-backend', 'wpbluiss/conduit-nextjs',
   'A backend API endpoint, schema, or service ships.',
   'File a claude-queue issue to wire the web app to the new endpoint: types/client, the UI surface that consumes it, and error/loading states.'),
  ('wpbluiss/conduit-backend', 'wpbluiss/conduit-mobile',
   'A backend API endpoint or contract ships that the app needs.',
   'File a claude-queue issue to wire the mobile app to the new endpoint, matching the web client contract.'),
  ('wpbluiss/conduit-nextjs', 'wpbluiss/conduit-mobile',
   'A user-facing product feature/flow ships on web that the app should match.',
   'File a claude-queue issue for mobile feature-parity: mirror the web flow with native patterns. Skip pure marketing-page or web-only infra changes.'),
  ('wpbluiss/conduit-nextjs', 'wpbluiss/conduit-marketing-worker',
   'A notable user-facing feature ships on web worth announcing.',
   'Queue a marketing issue: organic announcement copy + a changelog/blog entry idea for the shipped feature.'),
  ('wpbluiss/conduit-mobile', 'wpbluiss/conduit-marketing-worker',
   'An app feature or App Store release ships.',
   'Queue a marketing issue for the app update: store copy refresh + organic launch post.'),
  ('wpbluiss/conduit-engineering-worker', 'wpbluiss/conduit-nextjs',
   'Shared tooling/library work ships that web should adopt.',
   'File a claude-queue issue to adopt the shared library/tooling change in the web app. Low priority unless it fixes a bug.')
on conflict (from_repo, to_repo, when_condition) do nothing;

insert into public.praxis_agents (name, field, role, model, status, enabled, daily_budget_usd)
values ('conductor', 'cross_repo',
  'Cross-repo orchestrator — watches merged PRs across all repos and files claude-queue issues downstream when one team''s shipped work unblocks another. Driven by its own cron (praxis-orchestrator), not the agent-tick loop.',
  'claude-haiku-4-5', 'active', false, 0.50)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Cron dispatcher: fire the edge function every 15 minutes via pg_net.
-- ---------------------------------------------------------------------------
create or replace function public.praxis_dispatch_orchestrator()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  base text := 'https://mvuslmfjkkuizixjpkgl.supabase.co/functions/v1/';
  sec  text;
begin
  if not (select fleet_enabled from praxis_config where id = 1) then return; end if;
  select value into sec from conduit_secrets where name = 'PRAXIS_CRON_SECRET';
  perform net.http_post(
    url     := base || 'praxis-orchestrator',
    headers := jsonb_build_object('Content-Type','application/json','x-praxis-secret', sec),
    body    := jsonb_build_object('trigger','cron')
  );
end;
$$;

-- Schedule (idempotent: unschedule any prior copy first).
select cron.unschedule('praxis_orchestrator')
where exists (select 1 from cron.job where jobname = 'praxis_orchestrator');
select cron.schedule('praxis_orchestrator', '*/15 * * * *', 'select public.praxis_dispatch_orchestrator()');
