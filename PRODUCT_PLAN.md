# Praxis Private Bank → Product Master Plan

Turning the Luis & Delia app into a downloadable, multi-user, AI-powered personal
finance product (a "best-in-class Rocket Money + private advisor"). This is the
detailed execution plan. Status legend: ✅ done · 🟡 in progress · ⬜ planned.

---

## 0. Where we are today
- Polished web app at `conduitai.io/finance`, ember single-accent identity, mobile-first Command Center home. ✅
- Features: pooled cash, variable-income paycheck projections, due-now action list, debt-killer (snowball/avalanche), child support, allocation engine, investments, credit/utilization, AI advisor (Claude tool-use, logs from natural language), goal tracker. ✅
- Supabase Postgres, `fin_*` tables, RLS **already per-household** (scoped via `fin_user_household()`). ✅
- Single-tenant in practice: every login was mapped to ONE seeded household. 🟡 (being removed in Phase 1)

The architecture was built multi-tenant-ready from day one — RLS is per-household, schema has `external_id` columns for bank sync. That's why this is achievable, not a rewrite.

---

## 1. PHASE 1 — Multi-user foundation (the backbone)  🟡
Goal: any stranger can sign up and get their **own private, isolated** household.

### 1.1 Auth & accounts
- Email/password (have it) + add **Apple & Google OAuth** (you have both dev accounts) and magic-link.
- Email verification ON for the public product (was off for our private use).
- Password reset, change email, **account + data deletion** (App Store requires in-app delete).
- **MFA/2FA** (TOTP) before bank-sync ships — table stakes for finance.

### 1.2 Per-user data model
- On first login with no household → **onboarding** creates a fresh household (name, goal, target date) + a `people` record. Clean slate, not our seed data.
- `fin_household_members(user_id → household_id)` already isolates data via RLS. Remove the "everyone maps to the seed household" shortcut. ✅(this phase)
- **Couples:** `join_code` on a household; partner signs up and joins the same household → shared pool, two logins. (`fin_join_household(code)` security-definer RPC.)
- Every insert uses the **caller's** household id, never a constant.

### 1.3 Onboarding flow (first-run)
1. Welcome → 2. Name your household → 3. Your goal ($ + target date) → 4. Add first account/balance (or "skip, I'll connect my bank") → 5. Optional: invite partner.
- Keep it < 60 seconds. Pre-fill smart defaults.

### 1.4 Acceptance criteria
- Two separate signups can NEVER see each other's data (verified with RLS tests).
- Luis & Delia's existing data untouched (their login already owns its household).

---

## 2. PHASE 2 — Installable app (PWA → native shells)  ⬜
### 2.1 PWA (week 1)
- `manifest.json`, maskable icons, splash, theme color, offline shell (service worker), "Add to Home Screen" prompt. Installable today, no store needed.
### 2.2 Native shells (you have Apple Dev + Google Play)
- Wrap with **Capacitor** (keeps the Next.js codebase; thin native container). Or Expo/React Native if we want deeper native later.
- Native niceties: push notifications (due-bill reminders, "you're behind pace"), biometric unlock (Face ID), secure storage.
- **App Store review reality:** finance apps get extra scrutiny — need Privacy Policy URL, data-use disclosures (App Privacy "nutrition label"), account-deletion, and no misleading "advice" claims. Plan 1–2 review rounds.

---

## 3. PHASE 3 — Bank connectivity (the Rocket Money superpower)  ⬜
- **Plaid** (or MX/Finicity) for: account balances, transaction import, auto-categorization, **subscription/recurring detection**, balance refresh.
- Schema is ready (`external_id` columns). Add `fin_plaid_items` (access tokens, encrypted), `fin_transactions` (raw + categorized), a sync worker + webhooks.
- **Server-side only**: Plaid tokens never touch the browser; store encrypted (Supabase Vault / KMS).
- Optional later: **bill negotiation / cancellation** (Rocket Money's paid hook) — usually via a partner or concierge ops, not pure software.
- You sign up for Plaid (has its own pricing + they vet finance apps before production keys).

---

## 4. PHASE 4 — AI advisor at scale  ⬜
- Per-user context, **prompt caching** (already used) to cut cost, **rate limits + monthly token budgets** per plan tier.
- Memory across sessions (we have `fin_ai_messages`); add summarization so context stays cheap.
- Guardrails: stays in "organize / coach / educate" lane + disclaimers (see §7). Never executes money movement.
- Cost control: cheap model for routine logging, strong model for advice; cap free-tier messages.

---

## 5. PHASE 5 — Business layer  ⬜
- **Freemium (Stripe, already wired in this repo):**
  - **Free:** manual tracking, goal, debt-killer, limited AI (e.g., 10 msgs/mo).
  - **Plus (~$8–12/mo):** bank sync, unlimited AI advisor, subscription detection, projections, multi-account.
  - (Optional) **Couples/Family** tier.
- In-app purchases on iOS/Android must use **Apple/Google billing** for digital subscriptions (15–30% fee) — or keep subscription sign-up on web to use Stripe directly (allowed if you don't link out from the app per current rules; verify).
- Analytics (privacy-respecting: PostHog/Plausible), error monitoring (Sentry), KPIs: activation (completed onboarding), D7/D30 retention, free→paid conversion, AI engagement.

---

## 6. PHASE 6 — Brand & spin-out  ⬜
- New product **name + domain + identity** (it shouldn't live under `conduitai.io` long-term). Keep the ember system or evolve it.
- Move into its **own repo** (clean, portable — all finance code is self-contained in `src/{app/finance,components/finance,lib/finance}`).
- Marketing site / landing page, App Store listing copy + screenshots, waitlist.

---

## 7. Compliance & trust (the real gate — read carefully)  ⬜
**Talk to a lawyer before public launch.** Budget a few hundred–low thousands for proper docs. Software I build supports all of this; I can't *be* your legal/compliance.
- **Terms of Service + Privacy Policy** (required by both app stores and Plaid).
- **"Educational, not financial/investment advice" disclaimer**, shown in-app. If the AI ever gives *personalized investment advice for a fee*, that can trigger **Investment Adviser** regulation (SEC/state RIA) — so we keep AI in the organize/coach/educate lane. We do **not** move money → avoids money-transmitter licensing.
- **Data security:** encryption in transit (TLS) + at rest, encrypted secrets, least-privilege, audit logs, RLS (have it), MFA, breach/incident plan. Aim for **SOC 2** as you scale.
- **Plaid agreements** + their end-user privacy requirements.
- **CCPA/GDPR**-style data rights: export + delete my data (build the buttons).
- App Store: data-deletion in-app, Privacy nutrition label, no scraping credentials.

---

## 8. Costs to expect (rough, scales with users)
- Vercel (hosting), Supabase (DB/auth/storage) — modest until thousands of users.
- Anthropic API — per AI message (caching helps); cap on free tier.
- Plaid — per linked item/account, monthly minimums on production.
- Apple $99/yr (have), Google $25 once (have), domain, legal (one-time), email (Resend/Postmark), monitoring.
- Pricing must cover Plaid + AI per active paid user with margin.

---

## 9. Sequenced timeline (realistic)
1. **Multi-user foundation** (now) — signup, onboarding, isolation, couples. 🟡
2. **PWA installable** + push reminders. ⬜
3. **Legal docs + privacy/delete + MFA** (pre-launch gate). ⬜
4. **Stripe freemium** + paywall. ⬜
5. **Closed beta** (friends/family), fix retention. ⬜
6. **Plaid bank sync** (the wow). ⬜
7. **Native shells** → App Store / Play submission. ⬜
8. **Brand spin-out + public launch + marketing.** ⬜

---

## 10. What I can build vs. what only you can do
**I build:** all software — multi-tenant auth/onboarding, PWA, Capacitor shells, Plaid integration, Stripe billing, AI scaling, admin, analytics wiring, the marketing site, App Store metadata.
**You own (real-world):** Plaid account + approval, Apple/Google submissions (have accounts), Stripe/Anthropic billing, **a lawyer for ToS/Privacy/compliance**, the brand decision, and the go/no-go calls.

---
*Living doc — updated as phases land. Phase 1 (multi-user) is in progress now.*
