-- 028_praxis_dispatcher.sql
-- Throughput crank: a Supabase-driven dispatcher fires each wired repo's autopilot
-- via the GITHUB_ORCHESTRATOR_TOKEN, bypassing GitHub's own cron cadence + the need
-- to edit per-repo workflow files. Edge fn: praxis-dispatcher.
-- Tiered to respect GitHub Actions minutes: conduit-nextjs is PUBLIC (free, unlimited)
-- so it's hammered every 15 min; the private repos run hourly (on top of their own
-- native hourly cron ≈ 2x). Dial the fleet cron down if Actions minutes run hot.

alter table public.praxis_repos add column if not exists agents_wired boolean not null default false;
update public.praxis_repos set agents_wired = true where full_name in (
  'wpbluiss/conduit-nextjs','wpbluiss/conduit-mobile','wpbluiss/conduit-backend',
  'wpbluiss/conduit-marketing-worker','wpbluiss/conduit-engineering-worker','wpbluiss/jonathan-demo');

create or replace function public.praxis_dispatch_flagship() returns void language plpgsql security definer set search_path=public as $fn$
declare sec text; begin
  if not (select fleet_enabled from praxis_config where id=1) then return; end if;
  select value into sec from conduit_secrets where name='PRAXIS_CRON_SECRET';
  perform net.http_post(url:='https://mvuslmfjkkuizixjpkgl.supabase.co/functions/v1/praxis-dispatcher',
    headers:=jsonb_build_object('Content-Type','application/json','x-praxis-secret',sec),
    body:=jsonb_build_object('repos', jsonb_build_array('wpbluiss/conduit-nextjs')));
end;$fn$;

create or replace function public.praxis_dispatch_fleet() returns void language plpgsql security definer set search_path=public as $fn$
declare sec text; begin
  if not (select fleet_enabled from praxis_config where id=1) then return; end if;
  select value into sec from conduit_secrets where name='PRAXIS_CRON_SECRET';
  perform net.http_post(url:='https://mvuslmfjkkuizixjpkgl.supabase.co/functions/v1/praxis-dispatcher',
    headers:=jsonb_build_object('Content-Type','application/json','x-praxis-secret',sec),
    body:=jsonb_build_object('repos', jsonb_build_array(
      'wpbluiss/conduit-mobile','wpbluiss/conduit-backend','wpbluiss/conduit-marketing-worker',
      'wpbluiss/conduit-engineering-worker','wpbluiss/jonathan-demo')));
end;$fn$;

select cron.unschedule('praxis_dispatch_flagship') where exists (select 1 from cron.job where jobname='praxis_dispatch_flagship');
select cron.schedule('praxis_dispatch_flagship','*/15 * * * *','select public.praxis_dispatch_flagship()');
select cron.unschedule('praxis_dispatch_fleet') where exists (select 1 from cron.job where jobname='praxis_dispatch_fleet');
select cron.schedule('praxis_dispatch_fleet','0 * * * *','select public.praxis_dispatch_fleet()');

-- Planner cadence: hourly (deepened thresholds live in the edge fn: refill <8 -> 10).
select cron.unschedule('praxis_planner') where exists (select 1 from cron.job where jobname='praxis_planner');
select cron.schedule('praxis_planner','5 * * * *','select public.praxis_dispatch_planner()');
