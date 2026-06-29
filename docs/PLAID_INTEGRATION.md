# Plaid Integration Roadmap — Cadence

Goal: replace (and augment) manual balance entry with **automatic bank sync** —
real-time balances, imported transactions, and auto-categorized bills/income.

This is a plan, not yet built. It's sequenced so each phase ships independently.

## Why this is a small lift here

Two pieces of groundwork already exist:

1. **A connector framework.** `src/lib/connectors/` already does OAuth-style
   token storage + refresh for HubSpot, GitHub, and Google Calendar, backed by a
   `connector_tokens` table (migration `045_connector_tokens.sql`). Plaid's
   item/access-token lifecycle fits the same shape.
2. **A balance-sync seam.** `adjustPooledCash()` in `src/lib/finance/data.ts` is
   the single chokepoint that moves account balances. Today the *user* triggers
   it by logging activity; with Plaid, the **webhook** becomes another caller.
   Plaid doesn't replace the money model — it just becomes an authoritative writer.

## Data model changes

The `fin_accounts` table already carries `type`, `institution`, and `owner_tag`.
Add bank-link columns (additive, nullable — manual accounts keep working):

```sql
-- fin_accounts: link a row to a Plaid account
alter table public.fin_accounts add column plaid_account_id text;     -- Plaid account_id
alter table public.fin_accounts add column plaid_item_id text;        -- which linked institution
alter table public.fin_accounts add column is_manual boolean default true;
alter table public.fin_accounts add column last_synced_at timestamptz;

-- New: one row per linked institution ("Item" in Plaid terms)
create table public.fin_plaid_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.fin_household(id) on delete cascade,
  item_id text not null unique,
  institution_name text,
  access_token_encrypted text not null,   -- NEVER store raw; see Security
  cursor text,                            -- transactions /sync cursor
  status text default 'good',             -- good | login_required | error
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.fin_plaid_items enable row level security;
create policy "members read their items" on public.fin_plaid_items
  for select to authenticated using (
    household_id in (select household_id from fin_household_members where user_id = auth.uid())
  );
-- writes happen server-side (service role); no public write policy.

-- New: raw imported transactions, before they become expenses/inflows
create table public.fin_plaid_transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.fin_household(id) on delete cascade,
  account_id uuid references public.fin_accounts(id) on delete set null,
  plaid_transaction_id text not null unique,
  name text, merchant_name text,
  amount numeric not null,                -- Plaid: positive = money out
  date date not null,
  category text, pending boolean default false,
  status text default 'unreviewed',       -- unreviewed | categorized | ignored
  linked_kind text, linked_id uuid,        -- once mapped to expense/inflow/debt
  created_at timestamptz default now()
);
-- RLS mirrors fin_plaid_items.
```

## Phases

### Phase 1 — Link a bank (read-only balances)
- Plaid account + dashboard; obtain `PLAID_CLIENT_ID`, `PLAID_SECRET`.
  Start in **Sandbox**, then request **Production** access (gated; takes days).
- Server routes:
  - `POST /api/finance/plaid/link-token` → `link/token/create`.
  - `POST /api/finance/plaid/exchange` → `item/public_token/exchange`, encrypt
    and store the access token in `fin_plaid_items`, create `fin_accounts` rows
    (`is_manual = false`) from `accounts/get`.
- Client: Plaid Link modal on the Accounts page ("Connect a bank").
- Result: linked balances show alongside manual ones; pooled cash includes both.

### Phase 2 — Keep balances fresh
- `transactions/sync` (cursor-based) on a schedule (Vercel Cron) + webhook.
- `POST /api/finance/plaid/webhook` handles `SYNC_UPDATES_AVAILABLE`,
  `DEFAULT_UPDATE`, `ITEM_LOGIN_REQUIRED`.
- On each sync: update `fin_accounts.balance` for linked accounts directly
  (linked balances are authoritative — they replace, not `adjustPooledCash`,
  which stays for manual accounts).

### Phase 3 — Transactions → bills/income (the real product work)
- Store raw rows in `fin_plaid_transactions`.
- Auto-match recurring merchants to existing `fin_expenses` (mark paid instead
  of manual tap); route deposits to `fin_inflows`/`fin_paychecks`.
- A "Review" inbox for unmatched transactions → user confirms category once,
  Cadence remembers the merchant→category mapping.
- The AI advisor reads `fin_plaid_transactions` for grounded, specific advice.

### Phase 4 — Polish
- De-dupe manual vs. imported entries; let users "convert" a manual account to a
  linked one. Re-auth flow for `ITEM_LOGIN_REQUIRED`. Per-account sync toggles.

## Security (non-negotiable)

- **Never store raw Plaid access tokens.** Encrypt at rest (libsodium/KMS) and
  decrypt only server-side. Mirror the existing `connector_tokens` approach.
- All Plaid calls are **server-only** — `PLAID_SECRET` never reaches the client.
- `fin_plaid_*` tables: RLS on, read scoped to household members, writes via
  service role only.
- Complete the Tier-1 items in `SECURITY_AUDIT.md` before going to Plaid
  Production — handling bank data raises the bar.

## Cost / ops notes
- Plaid bills per linked Item/API product; confirm pricing before Production.
- Webhooks need a stable public URL (production domain) + signature verification.
- Sandbox uses test institutions (`user_good` / `pass_good`) — build/test there first.
