# Praxis Console — Web R3: execution layer + polish

**Date:** 2026-05-12
**Branch:** main (4 commits)
**Scope:** Four bounded items, verification gate per item, one commit
per item.

---

## TL;DR

| # | Item | Resolution | Commit |
|---|---|---|---|
| 1 | Workspace home cards rendered white-on-dark | Remapped marketing v3 surface/border/ink tokens inside `.praxis-root` so `conduit-card` and family inherit Praxis dark surfaces with zero component edits. | `c26719a` |
| 2 | Light/Dark toggle in Settings > Profile | Added a pre-paint `<ThemeBoot>` script + Settings toggle + light-mode palette + DB column migration + best-effort persistence. System mode tracks `prefers-color-scheme` live. | `7f8806b` |
| 3 | `/app/builds` cluttered by 4 legacy FAILED rows | Added `Show failed (N)` toggle pinned to tab strip, default off, persisted to localStorage; applies to both R7 templates + Engineering sessions tabs. | `ba93407` |
| 4 | Per-employee workspace V2 (Marketing, Ops, Compliance, HR, Legal) | Replaced shared template for the 5 employees with distinct widget compositions mirroring Praxis Mobile R20 Item 6. Sales, Engineering, Jarvis, Finance unchanged. | `72d248d` |

---

## Item 1 — Workspace home theme fix

**Root cause:** `conduit-card`, `conduit-bg-surface*`, etc. were
authored against the Conduit marketing palette (white surfaces, dark
ink). `.praxis-root` overrode `--color-surface` / `--color-text` but
never remapped the marketing v3 names — `--color-bg-surface`,
`--color-ink-*`, `--color-border-subtle`. So Console cards rendered
as white tiles with low-contrast gray text against the dark canvas
across the workspace home, voice history, artifacts, voice page, team
pages, and settings.

**Fix:** Inside `.praxis-root`, remap every marketing v3 token name
to the corresponding Praxis surface token. The cascade now flips every
consumer with zero per-component edits. Also overrode `.conduit-card`
hover ring to brand purple instead of indigo so the focus moment stays
on-brand.

**Files:**
- `src/styles/praxis-tokens.css` — added the remap block + hover override.

---

## Item 2 — Light/Dark toggle

**Behavior:**
- **`ThemeBoot`** inline script runs in `<head>` before paint. Reads
  `localStorage.praxis.theme` (`system|light|dark`, default `system`),
  resolves `system` via `matchMedia('(prefers-color-scheme: dark)')`,
  writes `data-praxis-theme` on `<html>`. No FOUC.
- **`ThemeToggle`** segmented control (System / Light / Dark) lives in
  Settings > Profile under Email. Choice persists immediately to
  localStorage and POSTs to `/api/conduit/account/prefs` for cross-
  device sync. The API gracefully degrades to local-only if the
  `theme_preference` column is missing (migration 021 not yet applied).
- **Live system tracking:** when pref === `system`, a `matchMedia`
  change listener re-resolves on OS theme flip without a reload.

**Light palette design** — not an inverse, a polished alternative:
- Canvas: `#F7F4EE` (warm bone), not blue-white.
- Surface elevated: pure white card.
- Borders: warm soft gray `#E2DCD0`.
- Brand purple deepened to `oklch(45% 0.22 290)` so it reads on light.
- Dept jewel-tones desaturated to readable equivalents
  (e.g. marketing `#FF8A3D` → `#C76A2A` rust).
- Conduit-canvas radial: subtle purple wash on bone instead of dark
  purple gradient.

**Hardcoded color audit:** swept `/app` and `components/conduit`. The
`#0A0908` text on jewel-tone chip backgrounds is correct in both modes
because the chip bg comes from JS `EMPLOYEES.color` constants (which
don't flip with theme). VoiceRoom, modal scrims, and the engineering
build terminal are intentionally dark in both themes — Praxis stays
"primarily dark."

**Migration:** `supabase/migrations/021_theme_pref.sql` adds the
`theme_preference text DEFAULT 'system' CHECK (...)` column. Apply via
Supabase MCP. Persistence works locally without it; cross-device sync
activates once the column lands.

**Files:**
- `src/app/layout.tsx` — `<head>` renders `<ThemeBoot />`. Added
  `suppressHydrationWarning` on `<html>` for the pre-paint attribute.
- `src/components/conduit/ThemeBoot.tsx` (new) — inline script.
- `src/components/conduit/ThemeToggle.tsx` (new) — segmented control.
- `src/components/conduit/SettingsTabs.tsx` — `ProfileTab` now renders
  `<ThemeToggle initialPref=…>` and accepts `themePref` prop.
- `src/lib/conduit/account.ts` — `ConduitAccount.theme_preference?`.
- `src/lib/conduit/settings-data.ts` — surfaces it to the client.
- `src/app/api/conduit/account/prefs/route.ts` — accepts
  `theme_preference`; gracefully degrades to local-only on missing
  column.
- `src/styles/praxis-tokens.css` — `[data-praxis-theme="light"]`
  palette + canvas + card hover + scrollbar overrides.
- `supabase/migrations/021_theme_pref.sql` (new).

---

## Item 3 — `/app/builds` Show failed toggle

**Behavior:**
- Default off. Hides `failed | timeout | aborted` rows.
- `pending | running | deploying | complete` stay visible always.
- Toggle only appears when at least one failed row exists in the
  current tab, so empty accounts see no clutter.
- Hidden count surfaces in the toggle label (`Show failed (4)`).
- Choice persists to localStorage (`praxis.builds.showFailed`).
- Applied to both R7 templates and Engineering sessions tabs since
  the same clutter pattern can appear in either.
- Tab badge counts reflect the filtered list.

**Files:**
- `src/components/conduit/engineering/BuildsTabs.tsx` — added
  `FAILED_STATUSES` set, `showFailed` state, `FailedToggle` subcomponent,
  filter applied at the tab-strip level, badge counts swapped to
  filtered values.

---

## Item 4 — Per-employee workspace V2

**Replaced the shared middle scroll area** (Quick start + Stats +
Recent activity) for 5 roles with distinct widget compositions. Hero
band and right rail stay constant across all roles.

### Marketing
- **7-day content calendar strip:** Mon–Sun chips, today emphasized
  with dept-tint background + accent border. Each day shows a
  scaffolded channel hint chip (B/@/S/A/P).
- **Recent posts list:** pulls real rows from
  `conduit_marketing_sessions` ordered by `created_at DESC` (limit 5).
  Empty state pivots to a `Draft a launch post` deep-link.
- "Plan the week" header CTA.

### Ops
- **Split panel** (2-column on md+, stacked on mobile):
- Left: **SOP list** — 4 sample SOPs with status pills
  (`draft|ready|active`). Status color rotates the left border
  (text-muted/amber/green).
- Right: **Vendor renewal countdown** — 3 scaffolded vendors with
  large day-precision numerals. Cards under 14d renewal flip border
  to amber.
- Footer-spanning CTA promotes the weekly business review.

### Compliance
- **3 framework cards** (HIPAA / SOC2 / GDPR) in a responsive grid.
- Each card: dept-purple progress bar, `N/M` completion ratio,
  4-item highlight checklist (filled pip for done, hollow for not).
- Clicking opens the framework with a pre-filled prompt.
- Footer disclaimer flags the cards as scaffolds.

### HR
- **Hiring funnel:** 4 stage cards (`Applied → Screened →
  Interviewing → Offer`) with per-stage bar fills sized by max stage
  count. Offer stage gets dept-tint background.
- **Open roles list:** 3 scaffolded roles with applicant counts.
  Status border is dept color for open, muted for drafting.

### Legal
- **Expiring documents banner:** amber border, scaffolded count of
  docs expiring in 30 days, per-doc rows with day countdowns (red
  under 7 days, amber above).
- **Contract library list:** 3 scaffolded contracts with status
  pills (`draft|signed|active|expired`). Border color encodes status.

**Implementation:** `V2_EMPLOYEES = {marketing, ops, compliance, hr,
legal}`. The team page conditionally renders the corresponding
workspace component instead of the Quick start/Stats/Recent activity
block. Marketing data is fetched in the existing `Promise.all` block
so render is unblocked.

**Files:**
- `src/app/app/team/[employee]/page.tsx` — V2 routing block, added
  `conduit_marketing_sessions` query for the marketing case.
- `src/components/conduit/workspaces/MarketingWorkspace.tsx` (new).
- `src/components/conduit/workspaces/OpsWorkspace.tsx` (new).
- `src/components/conduit/workspaces/ComplianceWorkspace.tsx` (new).
- `src/components/conduit/workspaces/HRWorkspace.tsx` (new).
- `src/components/conduit/workspaces/LegalWorkspace.tsx` (new).

---

## Verification

- `npx tsc --noEmit` — clean after each item.
- `curl http://localhost:3000/app/team/{marketing,ops,compliance,hr,legal}`
  returns 307 (auth redirect) — pages compile and resolve.
- ThemeBoot inline script verified on `curl /` — present in `<head>`
  and writes `data-praxis-theme` on `<html>` pre-paint.

## Follow-ups

- Apply `021_theme_pref.sql` via Supabase MCP to activate cross-device
  theme sync. Until then, local-only.
- Scaffold widgets (Ops vendors, Compliance frameworks, HR pipeline,
  Legal contracts) hold mock data. Wire to real tables when those
  schemas land.
- Audit the engineering build terminal in light mode if user reports
  it feels out of place — currently dark in both themes by design.

---

## R3-4 (email / Resend cutover) — closed, no-op

**Outcome:** No DNS changes, no code changes. Resend domain `conduitai.io`
was verified ~3 months ago (apex DKIM + `mail.conduitai.io` SPF/MX,
account region `us-east-1`). `RESEND_DEV_TO` was already removed from
Vercel production by the time this round closed, so live sending is
active.

**Correction to my earlier output in this thread:**
- DNS for `conduitai.io` is hosted at **Porkbun**, not Namecheap. Any
  future record additions go in the Porkbun zone editor.
- The DNS table I drafted is unnecessary; the records were already in
  place. Logged for future reference; **do not** add them — Porkbun
  already serves the authoritative answers Resend expects.

**R3 round closed.** Four shipped items (workspace dark theme,
light/dark toggle, builds Show-failed toggle, per-employee workspace
V2) plus this no-op email-cutover check.
