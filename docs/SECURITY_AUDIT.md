# Supabase Security Audit — Conduit / Cadence

**Project:** `mvuslmfjkkuizixjpkgl` (Conduit AI org)
**Source:** Supabase Security Advisor, 157 findings.
**Status:** Audit only — **no live changes applied.** RLS changes on live tables
must be reviewed per-app (enabling RLS with no policy locks the owning app out
instantly), so we apply the fixes below together, table by table.

> Note: this Supabase project is shared by *many* apps (Cadence/`fin_*`, Praxis,
> Lunaro, Jarvis, Mateo, trading, workforce, marketing…). A blanket script is
> dangerous. Tiers below are ordered by real exposure, not count.

## TL;DR — what's actually exposed

The original "50 tables with RLS disabled" note is now mostly out of date — most
of those tables have RLS *enabled* (deny-all to public). The genuine exposures
today are a much shorter list:

| # | Issue | Real-world impact |
|---|-------|-------------------|
| 1 | `waitlist_emails` — RLS **disabled** | Anyone with the public anon key can read/dump and write the waitlist. |
| 2 | 6 tables with `USING(true)` ALL policies **not restricted to a role** | Effectively public read/write despite "Service role full access" names. |
| 3 | 5 tables with explicit anon read/write | `client_memory`, `client_sites`, `content_queue`, `session_logs`, `workflows`. |
| 4 | 6 `trading_*` / `discovery_responses` anon **INSERT** | Anyone can inject fake trades/signals/responses (integrity, not read leak). |
| 5 | 2 public storage buckets listable | `gallery`, `mateo-photos` — object enumeration. |
| 6 | Security-definer functions executable by `anon` | Incl. `fin_join_household`, `fin_user_household`, `fin_delete_my_account`. |
| 7 | 74 tables RLS-enabled-**no-policy** | Locked to service role only — low risk, but those apps depend on the service key and have no per-user access. |
| 8 | 22 functions with mutable `search_path` | `search_path` injection hardening. |
| 9 | Leaked-password protection **off** | Enable Supabase HIBP check. |

**Cadence/`fin_*` verdict:** healthy. The only `fin_*` flag is
`fin_household_insert` — an INSERT-only policy (`WITH CHECK true`, role
`authenticated`) used by onboarding. That is **not** a cross-tenant read leak;
SELECT/UPDATE/DELETE remain membership-scoped. No action required for Cadence's
own data beyond tightening the definer-function grants (Tier 2).

---

## Tier 1 — public data exposure (fix first)

### 1a. `waitlist_emails` has RLS off
```sql
alter table public.waitlist_emails enable row level security;
-- Inserts come from the marketing site's server (service role) — no public policy needed.
-- If the public site inserts with the anon key, add ONLY an INSERT policy:
-- create policy "anon can join waitlist" on public.waitlist_emails
--   for insert to anon with check (true);
```

### 1b. "Service role full access" policies that aren't restricted to a role
These read as safe but have no `TO` clause, so `USING(true)` applies to **every**
role including `anon`. Affected: `affiliates`, `gallery_photos`, `locations`,
`prospects`, `referrals`, `team_members`.
```sql
-- For each table: pin the permissive policy to the service role.
alter policy "Service role full access on affiliates" on public.affiliates to service_role;
-- (repeat per table/policy name; service role bypasses RLS anyway, so the
--  policy can also simply be dropped if only server code touches the table.)
```

### 1c. Explicit anon read/write tables
`client_memory`, `client_sites`, `content_queue`, `session_logs`, `workflows`
all have `USING(true) ALL`. Decide per table whether the client really needs
direct access; if not, drop the policy and route through server/service role:
```sql
drop policy "Allow anon read/write client_memory" on public.client_memory;
-- then add scoped policies if the browser needs access, e.g.:
-- create policy "members read client_memory" on public.client_memory
--   for select to authenticated using (<ownership check>);
```

## Tier 2 — integrity & privilege

### 2a. Anon INSERT on trading/discovery tables
`trading_agent_states`, `trading_equity_snapshots`, `trading_sentiment`,
`trading_signals`, `trading_trades`, `discovery_responses` accept anon inserts.
If these are written by bots/server, drop the anon INSERT policy and use the
service role. If a public form writes `discovery_responses`, keep a narrow
`for insert to anon with check (...)` with validation.

### 2b. Security-definer functions executable by anon
19 functions are `SECURITY DEFINER` and granted to `anon`/`authenticated`,
including `fin_join_household`, `fin_user_household`, `fin_delete_my_account`.
These are likely safe *if* each checks `auth.uid()` internally — but verify, and
revoke `anon` where the function should require a logged-in user:
```sql
revoke execute on function public.fin_delete_my_account() from anon;
revoke execute on function public.fin_join_household(text) from anon;
```

### 2c. Public storage buckets
`gallery` and `mateo-photos` allow listing. If only specific object URLs should
be shareable, disable listing and serve via signed URLs.

## Tier 3 — hardening

- **74 `rls_enabled_no_policy` tables:** functionally locked (deny-all to
  public). Add explicit per-tenant SELECT/INSERT policies for any that a browser
  client reads directly; leave server-only tables as-is. Low urgency.
- **22 `function_search_path_mutable`:** add `set search_path = ''` (or an
  explicit schema) to each function definition.
- **Leaked password protection:** enable in Supabase → Authentication → Policies
  (checks passwords against HaveIBeenPwned).

---

## How we'll apply this

1. Confirm, per Tier-1 table, who writes/reads it (browser vs. server) — I can
   check each app's code in the other repos in scope.
2. Apply Tier 1 in a single reviewed migration, verifying the owning app still
   works after each table.
3. Tier 2 + 3 as follow-ups.

Re-run the advisor after each tier:
`get_advisors(project_id, type: "security")`.
Reference: https://supabase.com/docs/guides/database/database-linter
