-- 027_praxis_planner.sql
-- Planner: keeps every repo's claude-queue stocked with the next most valuable work,
-- guided by the company goal in praxis_orchestrator_state. Edge fn: praxis-planner.
-- Refill threshold: <3 open claude-queue issues → top up to 4. Every 2h at :40.

create or replace function public.praxis_dispatch_planner()
returns void language plpgsql security definer set search_path = public as $$
declare base text := 'https://mvuslmfjkkuizixjpkgl.supabase.co/functions/v1/'; sec text;
begin
  if not (select fleet_enabled from praxis_config where id = 1) then return; end if;
  select value into sec from conduit_secrets where name = 'PRAXIS_CRON_SECRET';
  perform net.http_post(url := base || 'praxis-planner',
    headers := jsonb_build_object('Content-Type','application/json','x-praxis-secret', sec),
    body := jsonb_build_object('trigger','cron'));
end; $$;

select cron.unschedule('praxis_planner') where exists (select 1 from cron.job where jobname='praxis_planner');
select cron.schedule('praxis_planner', '40 */2 * * *', 'select public.praxis_dispatch_planner()');
