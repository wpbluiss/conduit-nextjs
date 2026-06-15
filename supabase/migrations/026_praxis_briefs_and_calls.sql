-- 026_praxis_briefs_and_calls.sql
-- Atlas board briefs + the outbound "ETA call/text from Atlas".
-- Atlas (formerly Jarvis) texts Luis via Telegram (@JarvisConduitAIBot) and can phone
-- him via Vapi (number 561-678-3691, ElevenLabs voice). Edge fn: praxis-atlas-brief.
-- Secrets (conduit_secrets or Edge Function env): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
-- for text; VAPI_API_KEY, VAPI_PHONE_NUMBER_ID, VAPI_ATLAS_ASSISTANT_ID, OWNER_PHONE
-- for the call.

create table if not exists public.praxis_briefs (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'eta',          -- eta | daily | adhoc
  title text,
  summary text,                               -- written brief (text/app log)
  spoken_text text,                           -- the short script Atlas says on a call
  eta_text text,                              -- projected finish line, plain language
  metrics jsonb,                              -- the numbers the brief was built from
  channel text,                               -- comma list: telegram, call, none
  call_status text,                           -- placed | failed | skipped | skipped_no_creds
  call_detail jsonb,                          -- { call: {...}, text: { status, detail } }
  created_at timestamptz not null default now()
);
alter table public.praxis_briefs enable row level security;

-- Daily ETA brief via Telegram (text only; calls stay manual to control Vapi cost).
create or replace function public.praxis_dispatch_atlas_brief()
returns void language plpgsql security definer set search_path = public as $$
declare base text := 'https://mvuslmfjkkuizixjpkgl.supabase.co/functions/v1/'; sec text;
begin
  if not (select fleet_enabled from praxis_config where id = 1) then return; end if;
  select value into sec from conduit_secrets where name = 'PRAXIS_CRON_SECRET';
  perform net.http_post(
    url := base || 'praxis-atlas-brief',
    headers := jsonb_build_object('Content-Type','application/json','x-praxis-secret', sec),
    body := jsonb_build_object('kind','daily','text', true, 'call', false));
end; $$;

select cron.unschedule('praxis_atlas_brief') where exists (select 1 from cron.job where jobname='praxis_atlas_brief');
select cron.schedule('praxis_atlas_brief', '0 13 * * *', 'select public.praxis_dispatch_atlas_brief()');
