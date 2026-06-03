# Praxis Private Bank — Luis & Delia's household finance app

A Linear-inspired, dark, aurora-accented personal finance app for one shared
household with one goal: **$75,000 down payment in ~15 months.**

- **Live preview URL:** https://conduit-nextjs-git-claude-luis-delia-f-d6ae53-wpbluiss-projects.vercel.app/finance
- **First login:** `luisdelia@praxisbank.app` / `LuisDelia$75K-2026`
- **Lives at:** `/finance` inside the existing `conduit-nextjs` repo/project (the rest of the site is untouched).

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind v4 · Framer Motion · Recharts ·
Supabase (Postgres + Auth) · Anthropic (AI advisor). Fonts: Fraunces (display) +
JetBrains Mono (numbers) + Geist Sans (body). Components are hand-built in the
Cult-UI / 21st.dev spirit (animated numbers, glow/gradient borders, glass cards,
bg-animate buttons, progress rings). *(Checked: there is no real MIT "watermelon
UI" shadcn library, so it was skipped per instructions.)*

## Data model (Supabase, all `fin_*`, RLS enabled + scoped to the household)
`fin_household`, `fin_people`, `fin_household_members`, `fin_accounts`,
`fin_paychecks`, `fin_inflows`, `fin_expenses`, `fin_debts`, `fin_child_support`,
`fin_payments`, `fin_savings_log`, `fin_investments`, `fin_investment_txns`,
`fin_credit_scores`, `fin_ai_messages`. Designed so a Plaid/bank-sync layer can be
added later (external_id columns) with no rework.

Seeded starting data (all editable): the 6 known debts (Credit One $443, Kikoff
$70 past due, Infra $110, Perpay $1,677 charged-off, Capital One $95 on a plan,
Mercedes deficiency settle $4,795), child support ($175/mo, $3,500 remaining),
placeholder accounts, and three investment buckets (Luis / Delia / Daughter).

## What I need from you to make the live link fully work

1. **Open the app & log in.** Go to the live URL above and sign in with
   `luisdelia@praxisbank.app` / `LuisDelia$75K-2026`. (Change the password later in
   Supabase → Authentication if you like, or just keep it — it's your shared login.)

2. **Make the link public (optional, ~30s).** The preview currently sits behind
   Vercel's login gate, so it opens for you (you're logged into Vercel) but not for
   someone who isn't. To make it openable by anyone (e.g. Delia on her phone):
   Vercel → Project `conduit-nextjs` → **Settings → Deployment Protection →
   Vercel Authentication → set to *Only Production* (or Off for Preview)** → Save.
   The same URL then loads without a Vercel login.

3. **Confirm the 3 environment variables exist for the *Preview* environment.**
   Vercel → Project `conduit-nextjs` → **Settings → Environment Variables**. These
   should already be set (the main Conduit app uses the same Supabase project and
   Anthropic key) — just confirm each has **Preview** checked:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://mvuslmfjkkuizixjpkgl.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (the anon key for that project)
   - `ANTHROPIC_API_KEY` = (your existing Claude key — powers the AI Advisor)
   If `ANTHROPIC_API_KEY` is missing, the whole app still works; only the Advisor
   chat shows a "needs key" notice until you add it and redeploy.

4. **Supabase project:** nothing to create — I used your existing project
   **`mvuslmfjkkuizixjpkgl`** ("Conduit AI" org). The schema + seed are already
   applied and RLS is enabled and scoped to your household, so only your login can
   read/write the `fin_*` tables.

## Heads-up (pre-existing, not from this app)
Supabase flagged **50 of your *other* apps' tables** (lunaro_*, jarvis_*, trading_*,
etc.) with Row Level Security **disabled** — meaning anyone with the anon key can
read/modify them. That predates this work; I did **not** change them. Worth fixing
when you have a moment. Every `fin_*` table I added has RLS **enabled**.

## How the money model works (as specified)
One shared pool. All income (both people) + one-off inflows flow in; all expenses
and obligations are paid from it regardless of whose they are. Person tags
(Luis / Delia / Shared) are for visibility only — no per-person envelopes. Income is
never hardcoded: every paycheck is a logged data point and projections are computed
from real history, labeled "based on N paychecks logged."

## The AI Advisor
In-app chat ("your private bank") with full read+write access to your data via Claude
tool-use. Talk to it naturally: *"paid $175 child support today"*, *"got a $150 gift —
what do I do?"*, *"bought $40 VOO in Delia's account"* — it logs the transaction and
updates every module live. It opens with your status, engineers the fastest debt
payoff (snowball for momentum, avalanche when APRs make it cheaper), and is honest
about horizons (the property is the 15-month engine; investing is the long game).
