# Praxis Console — Web R1: Visual + Functional Parity with Praxis Mobile

**Date:** 2026-05-11
**Branch:** main
**Scope:** Praxis Console (conduitai.io/app) — R1 parity ship with Praxis Mobile R14/R19

---

## TL;DR

The Console at `/app` is now visually aligned with Praxis Mobile R14: jewel
purple primary, electric blue secondary, role-icon employee avatars, the new
geometric Praxis prism mark in the rail, and the same dark canvas / chat
loop / Supabase tables as Mobile. Marketing site is untouched — the Conduit
AI brand (indigo, light-first) remains its own identity.

Friday's tab-switch perf fix (`/app/loading.tsx`, `staleTimes`, cached
`getCurrentAccount`) is verified intact and was not regressed.

---

## Part A — Visual system

### A1. Praxis token sheet
**New file:** `src/styles/praxis-tokens.css`
**Wired in:** `src/app/layout.tsx` (imported once, after `globals.css`).
**Scoped via:** `.praxis-root` on the `/app` shell (`src/app/app/layout.tsx`).

Adds the R14 jewel-tone axis:

| Token | Value | Used by |
|---|---|---|
| `--color-praxis-purple` | `oklch(50% 0.22 290)` | brand primary, `--color-accent` |
| `--color-praxis-purple-hi` | `oklch(60% 0.20 290)` | hover, `--color-accent-hi` |
| `--color-praxis-purple-deep` | `oklch(40% 0.22 290)` | pressed, `--color-accent-deep` |
| `--color-praxis-blue` | `oklch(60% 0.22 248)` | secondary, Engineering signature |
| `--color-praxis-blue-hi` | `oklch(68% 0.20 248)` | blue hover |

Scope choice: `.praxis-root` (Console subtree) rather than `:root` (global)
so the Conduit marketing site retains its indigo identity. Both brands
coexist instead of colliding.

### A2. Indigo → brand purple sweep
The audit found **zero** indigo references inside the `/app` subtree (the
indigo lives on the Conduit marketing site, which is a sibling brand and
intentionally untouched). What Console *did* have was warm orange
(`#FF8A3D`) as `--color-accent`. The token swap in `.praxis-root` retargets
every existing `var(--color-accent)` callsite to brand purple, so the visual
sweep is a single-line override — no component edits required for the bulk
of the surface.

Two stray RGBA orange literals were normalized to use `color-mix(...,
var(--color-accent), ...)`:
- `src/app/globals.css` → `.conduit-bubble-user`
- `src/components/conduit/OnboardingModal.tsx` → business-type chip

### A3. PraxisLogo (geometric purple prism)
**New file:** `src/components/conduit/PraxisLogo.tsx`

Three-faced isometric cube SVG. Single form, three brand-purple tones for
volume (top = brightest, left = base, right = deepest), with a hairline edge
highlight along the top seams. Optional `withWordmark` prop renders the
serif "Praxis" wordmark beside it; `glow` prop adds a soft outer drop-shadow
via the `.praxis-mark` filter.

Replaces the legacy dot-and-wordmark pattern in:
- `Sidebar.tsx` rail header (size 20, with wordmark, glow on)
- `OnboardingModal.tsx` step indicator (size 14, mark only)

Renders crisp at 14px–96px (uses `viewBox="0 0 24 24"` with integer paths).

---

## Part B — Information architecture parity

### B4. Left rail roster
**Edited:** `src/components/conduit/Sidebar.tsx`, `src/components/conduit/EmployeeBadge.tsx`

All nine employees (Atlas, Marketing, Sales, Engineering, Finance,
Compliance, HR, Operations, Legal) are present in the rail with their R14
signature color, in canonical order. Two behavior changes vs. prior:

1. **Letter-initial chips → Lucide role icons.** New `EMPLOYEE_ICON` map in
   `EmployeeBadge.tsx`:
   - Atlas (jarvis): `Compass` (orienting/routing)
   - Marketing: `Megaphone`
   - Sales: `TrendingUp`
   - Engineering: `Code2`
   - Finance: `DollarSign`
   - Compliance: `ShieldCheck`
   - HR: `HeartHandshake`
   - Operations: `Workflow`
   - Legal: `Scale`

   The `EmployeeAvatar` component now defaults to `variant="icon"`; the
   letter form is still available via `variant="letter"` for the voice
   surface, which references `EMPLOYEES.initial` directly.

2. **No gray-out for locked employees.** The `opacity-60` wrapper was
   removed from the locked rail row. Lock is signaled by the `Lock` icon
   only; the colored role-icon chip and label render at full strength,
   so the roster looks like a coherent team rather than a half-shadow.
   Clicking a locked row still routes to Settings.

The "Recent" conversation rows below the roster also picked up the same
icon treatment for consistency.

### B5. Per-employee workspaces (audit)
`/app/team/[employee]/page.tsx` already implements the spec:
- Header band tinted with the employee's `colorSoft`
- Quick-start prompt chips from `WORKSPACE_PROMPTS` (Atlas's are
  cross-org: status check, prioritization, summarize the team's work,
  decision support)
- Stats row (per-cycle artifacts/builds, conversations, last active)
- Recent activity list (artifacts + conversations, merged by time)
- Right rail (`EmployeeRightRail`) with About, Recent context, Quick actions
- Sales gets its own dashboard (`SalesWorkspace`), Engineering gets a build
  CTA (`EngineeringBuildButton`)

Finance / Compliance / HR / Operations / Legal use the generic workspace
template + their employee-specific quick-start prompts. Matches the Mobile
R19 spec of "scaffolded dashboards."

### B6. Chat parity (audit)
`src/components/conduit/Chat.tsx` already mirrors the Mobile chat shape:

| Surface | Implementation |
|---|---|
| User message bubbles | `.conduit-bubble-user` (right-aligned, accent-tinted via token) |
| Assistant message bubbles | `.conduit-bubble-assistant` (left-aligned, dept-colored 2px border) |
| Send composer | `.conduit-pill-input` (pill-shaped, accent border on focus) |
| Typing indicator | Three `.typing-dot` spans, `typingDot` keyframe in `globals.css` |
| Employee routing | `message.employee` field, `DEPT_COLOR[*]` resolves the bubble color |

With the A1 token swap, the user bubble now reads as soft brand-purple
instead of soft orange — same component, new accent, no per-component edits.

A separate shared chat package between Console (Next.js) and Praxis Mobile
(presumably Expo/React Native) was not viable inside this repo. The
"shared codebase OR mirror the UI" branch in the spec is satisfied by
mirroring.

---

## Part C — Chat backend parity

### C7. Same Supabase tables
**Verified — no code changes needed.** Console reads/writes via
`src/app/api/conduit/chat/route.ts` against the tables defined in
`supabase/migrations/001_conduit_initial.sql`:

- `conduit_accounts` — one per user (RLS: `owner_user_id = auth.uid()`)
- `conduit_conversations` — RLS scoped to the user's account
- `conduit_messages` — `{ conversation_id, role, employee, content, metadata, created_at }`
- `conduit_artifacts` — linked to message + conversation

Both Console and Mobile point at the same Supabase project. A message
written from Console lands in `conduit_messages` for the user's
`account_id`; Mobile reads the same rows under the same RLS predicate.
Cross-device send/receive parity is automatic at the data layer —
no edge function rewire required for R1.

The send loop in Console calls `/api/conduit/chat`, which streams Anthropic
responses and persists assistant messages back to `conduit_messages` with
the routed `employee` field set. The same pattern will hold for Mobile
once R19 lands its chat fix.

---

## Part D — Performance verification

### D8. Tab-switch perf fix still in place

Commit `3a41786` introduced three coordinated changes; all are intact:

1. **`src/app/app/loading.tsx`** — present (2.3K, skeleton shell with
   four dashboard tiles + five team tiles, no client hooks). Confirms the
   `/app` layout stays mounted on tab clicks so the rail remains
   interactive while a new segment server-renders.
2. **`next.config.ts`** — `experimental.staleTimes = { dynamic: 30,
   static: 180 }`. Re-visiting a tab within 30s hits the client cache.
3. **Cached helpers** — `getCurrentAccount` in `src/lib/conduit/account.ts`
   wraps with React `cache()`; layout + page now do one auth check
   per render instead of two.

Lighthouse before/after comparison is deferred to the live Vercel deploy
— the R1 visual ship doesn't touch any of the three legs, so the perf
profile should be unchanged. Empirically, sidebar clicks → skeleton
flash → segment hydrate is unchanged in the dev build.

---

## Files changed

```
src/app/layout.tsx                                 import praxis-tokens.css
src/app/app/layout.tsx                             add .praxis-root class
src/app/globals.css                                .conduit-bubble-user → token
src/styles/praxis-tokens.css                       NEW — R14 jewel-tone tokens
src/components/conduit/PraxisLogo.tsx              NEW — geometric prism mark
src/components/conduit/Sidebar.tsx                 PraxisLogo + role icons + no gray-out
src/components/conduit/EmployeeBadge.tsx           EMPLOYEE_ICON map + icon-default avatar
src/components/conduit/OnboardingModal.tsx         PraxisLogo + token-driven chip bg
SESSION_REPORT_2026-05-11_PRAXIS_CONSOLE_R1.md     this file
```

## Build / deploy

- `npm run build` — compiles cleanly in 4.2s, 38/38 static pages generated.
- No type errors, no ESLint warnings.
- Push to `main` triggers Vercel auto-deploy → conduitai.io/app.

## Verification deferred to live deploy

- **Side-by-side parity screenshots** — desktop Console at `/app/workspace`
  vs. iPhone Praxis Mobile R19 at the same surface. Manual verification
  on conduitai.io once the deploy lands.
- **Lighthouse before/after** — perf fix from `3a41786` is structurally
  intact; numeric confirmation is a Vercel-side step.
- **375/390px mobile viewport check** — per the standing feedback memo
  (mobile is load-bearing), verify rail collapse + hamburger + workspace
  dashboard at iPhone widths on the live URL.

## Architectural notes

- **Why scope tokens with `.praxis-root` and not `@theme`:** Tailwind v4's
  `@theme inline` writes tokens at `:root`, which would bleed into the
  Conduit marketing site. Praxis is a sibling brand under the Conduit AI
  parent, so its tokens need to be subtree-scoped. The CSS cascade gives
  `.praxis-root` higher specificity than `:root`, so every Tailwind
  arbitrary-value `bg-[var(--color-accent)]` inside Console resolves to
  brand purple while marketing pages keep resolving to whatever they had.
- **Why icons over letter initials:** Mobile R14's role-icon avatars are
  the canonical Praxis visual identity. The letter form is preserved
  behind `variant="letter"` on `EmployeeAvatar` for surfaces that need it
  (voice room, where the icon would be redundant with the live waveform).
- **Why the prism mark and not a "P" badge:** the spec explicitly asks for
  the prism. The "P" badge wasn't actually present in this codebase, so
  the change is additive: the rail and onboarding steps gain a real brand
  mark instead of a colored dot.
