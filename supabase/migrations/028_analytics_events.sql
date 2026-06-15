-- 028_analytics_events.sql
-- Lightweight privacy-first funnel tracking.
-- Records page views on marketing pages + 4 key conversion events.
-- No PII beyond account_id (nullable — fires before auth for page views).
-- Rows are append-only; RLS on, no user-level policies (service-role insert).

create table if not exists public.conduit_analytics_events (
  id          uuid primary key default gen_random_uuid(),
  event       text not null,
  account_id  uuid,           -- null for unauthenticated events (page views)
  path        text,           -- URL path at the time of the event
  properties  jsonb,          -- safe, non-PII metadata (tier_id, reason, etc.)
  created_at  timestamptz not null default now()
);

create index on public.conduit_analytics_events (event, created_at desc);
create index on public.conduit_analytics_events (account_id) where account_id is not null;

alter table public.conduit_analytics_events enable row level security;
-- Service-role inserts via /api/conduit/track; no user-facing read policy needed.
