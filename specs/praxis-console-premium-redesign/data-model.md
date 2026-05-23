# Phase 1 — Data Model (Visual Primitive Model)

> **Note**: This redesign introduces NO schema changes. The "data model"
> for a visual-system feature is the **token + primitive model** — the
> values, types, and components the redesigned surfaces consume. Real
> database tables read by the redesign are listed separately at the end
> as **Read-Only Data Sources** (no modifications).

---

## 1. Token Model

Tokens live in two CSS files and are scoped to `.praxis-root` (the
`/app/*` shell only — marketing surfaces untouched per Constitution
Principle IV):

- `src/styles/praxis-tokens.css` — existing, extended with the new
  `--rhythm-*`, `--space-*`, `--space-card-*`, `--radius-*`, `--text-*`,
  `--tint-*`, `--elev-*` tokens.
- `src/styles/praxis-system.css` — **NEW** — utility classes
  (`.praxis-card`, `.praxis-avatar`, `.praxis-pulse`, etc.) that
  consume the tokens.

### 1.1 Color tokens (already exist; this redesign consumes)

| Token | Type | Source | Notes |
|---|---|---|---|
| `--color-surface` | hex | `praxis-tokens.css:42` (dark) / `:171` (light) | Base canvas |
| `--color-surface-elevated` | hex | `praxis-tokens.css:43` / `:172` | Card material |
| `--color-surface-raised` | hex | `praxis-tokens.css:44` / `:173` | KPI tile elevated material |
| `--color-border` | hex | `praxis-tokens.css:45` / `:174` | Resting border |
| `--color-border-soft` | hex | `praxis-tokens.css:46` / `:175` | Hover/active border |
| `--color-text` | hex | `praxis-tokens.css:48` / `:178` | Primary ink |
| `--color-text-muted` | hex | `praxis-tokens.css:49` / `:179` | Secondary/microcopy |
| `--color-accent` | alias | `praxis-tokens.css:53` / `:181` | Brand purple (Atlas/system accent) |
| `--color-dept-jarvis` … `--color-dept-legal` | hex/oklch | `praxis-tokens.css:70–87` / `:195–212` | 9 dept signatures |
| `--color-dept-{name}-soft` | rgba | `praxis-tokens.css:71–88` / `:196–213` | 14% alpha tint for existing primitives |

### 1.2 New color tokens introduced

Derived programmatically via `color-mix()`. Defined once per dept (9
depts × 5 derivations = 45 declarations), scoped under
`.praxis-root` so both themes flip automatically.

| Token shape | Formula | Use |
|---|---|---|
| `--tint-{dept}-wash` | `color-mix(in srgb, var(--color-dept-{dept}) 5%, var(--color-surface) 95%)` | Canvas backdrop (transient, hover/stream) |
| `--tint-{dept}-wash-strong` | `color-mix(in srgb, var(--color-dept-{dept}) 9%, var(--color-surface) 91%)` | Canvas backdrop (persistent, pinned-in-chat) |
| `--tint-{dept}-glow` | `color-mix(in srgb, var(--color-dept-{dept}) 14%, transparent)` | Outer hover-shadow on card |
| `--tint-{dept}-edge` | `color-mix(in srgb, var(--color-dept-{dept}) 35%, transparent)` | Top-edge gradient indicator + composer focus ring |
| `--tint-{dept}-radial` | `radial-gradient(120% 80% at 100% 100%, color-mix(in srgb, var(--color-dept-{dept}) 8%, transparent), transparent 60%)` | Team card bottom-right signature |

**Atlas exception** (R-003): `--tint-jarvis-wash` and
`--tint-jarvis-wash-strong` fall through to a neutral warm wash
(`color-mix(in srgb, var(--color-text) 4%, var(--color-surface) 96%)`
and 8%) because platinum has no chroma to carry as a tint.

### 1.3 Spacing scale (NEW)

| Token | Value | Use |
|---|---|---|
| `--space-1` | 4px | Inline gaps, microcopy gutters |
| `--space-2` | 8px | Pill internal padding y, tight stacks |
| `--space-3` | 12px | Card-sm padding, eyebrow → body gap |
| `--space-4` | 16px | Default content gutters |
| `--space-5` | 20px | Card-md padding |
| `--space-6` | 24px | Section gap, container padding |
| `--space-8` | 32px | Hero → content gap |
| `--space-10` | 40px | Large vertical rhythm |

Anything not on this scale on a redesigned surface is a violation
(FR-036).

### 1.4 Card padding presets (NEW)

| Token | Value | Used by |
|---|---|---|
| `--space-card-sm` | 12px | `.praxis-card-stat` (in-page stat tile) |
| `--space-card-md` | 20px | `.praxis-card-team` (team grid cell) |
| `--space-card-lg` | 28px | `.praxis-card-kpi` (dashboard KPI tile) |

### 1.5 Radii (NEW)

| Token | Value | Use |
|---|---|---|
| `--radius-pill` | 9999px | Composer pill, status pips, ghosted-tag |
| `--radius-md` | 8px | Buttons, small chips |
| `--radius-card` | 16px | All `.praxis-card-*` variants |
| `--radius-hero` | 20px | Optional hero block surround (if used) |

### 1.6 Typography scale (NEW)

**Display** (Fraunces, weight 400, line-height 1.05, letter-spacing -0.02em):

| Token | Value | Use |
|---|---|---|
| `--text-display-1` | `clamp(2.25rem, 4vw + 0.5rem, 3.25rem)` | Single hero — `/app/workspace`, `/app/team/[employee]`, `/app` empty state |
| `--text-display-2` | `clamp(1.75rem, 2.5vw + 0.5rem, 2.25rem)` | Section heads within a page |
| `--text-display-3` | `1.5rem` | In-card display number (KPI metric) |

**UI** (Inter):

| Token | Value | Use |
|---|---|---|
| `--text-eyebrow` | `11px / 500 / 0.18em tracking / uppercase` | Single eyebrow style, all surfaces |
| `--text-microlabel` | `10px / 500 / 0.15em tracking / uppercase` | Micro-state labels (status pill text) |
| `--text-body-sm` | `13px / 400 / -0.005em` | Card body, list-row body |
| `--text-body` | `15px / 400 / -0.005em` | Default body |
| `--text-body-lg` | `17px / 400 / -0.005em` | Hero supporting copy |

**Numeric** (JetBrains Mono, tabular figures):

| Token | Spec | Use |
|---|---|---|
| `--text-numeric-display` | `1.5rem / 500 / -0.02em / font-feature-settings: "tnum" 1` | KPI metric value |
| `--text-numeric-body` | `13px / 500 / 0 / font-feature-settings: "tnum" 1` | Inline stamps, counts |

### 1.7 Elevation (NEW)

Three rest levels, three hover levels. Each is a CSS variable holding
the full `box-shadow` stack. Hover levels include a dept-tinted outer
glow.

| Token | Dark theme value | Light theme value |
|---|---|---|
| `--elev-rest-1` | `0 1px 0 inset rgba(255,255,255,0.03)` | `0 1px 0 inset rgba(255,255,255,0.7)` |
| `--elev-rest-2` | `0 1px 2px rgba(0,0,0,0.30), 0 1px 0 inset rgba(255,255,255,0.04)` | `0 1px 2px rgba(20,16,31,0.06), 0 1px 0 inset rgba(255,255,255,0.7)` |
| `--elev-rest-3` | `0 4px 16px rgba(0,0,0,0.35), 0 1px 0 inset rgba(255,255,255,0.04)` | `0 4px 16px rgba(20,16,31,0.08), 0 1px 0 inset rgba(255,255,255,0.7)` |
| `--elev-hover-1` | `var(--elev-rest-2), 0 0 0 1px var(--tint-{dept}-edge)` | same |
| `--elev-hover-2` | `var(--elev-rest-3), 0 0 32px var(--tint-{dept}-glow)` | `var(--elev-rest-3), 0 0 24px var(--tint-{dept}-glow)` |
| `--elev-hover-3` | `0 16px 48px rgba(0,0,0,0.40), 0 0 0 1px var(--tint-{dept}-edge), 0 0 48px var(--tint-{dept}-glow)` | `0 8px 24px rgba(20,16,31,0.10), 0 0 0 1px var(--tint-{dept}-edge), 0 0 32px var(--tint-{dept}-glow)` |

Hover-level tokens accept a `--dept` CSS variable from the consuming
component so the glow color flows from whichever card is being hovered.

### 1.8 Motion tokens (NEW)

**Easing curves:**

| Token | Value | Use |
|---|---|---|
| `--praxis-ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | Hover, fade-in, tint-in |
| `--praxis-ease-in-out-quart` | `cubic-bezier(0.76, 0, 0.24, 1)` | Page transition, baton hand-off |
| `--praxis-ease-baton` | `cubic-bezier(0.4, 0, 0.2, 1)` | Handoff card color transition |

**Rhythm tokens (role-typed pulse cadences — FR-013, locked by user at GATE 1):**

| Token | Desktop | Mobile (×1.2) |
|---|---|---|
| `--rhythm-jarvis` | `4s` | `4.8s` |
| `--rhythm-marketing` | `3s` | `3.6s` |
| `--rhythm-sales` | `2.5s` | `3s` |
| `--rhythm-engineering` | `2s` | `2.4s` |
| `--rhythm-finance` | `5s` | `6s` |
| `--rhythm-compliance` | `6s` | `7.2s` |
| `--rhythm-hr` | `3.5s` | `4.2s` |
| `--rhythm-ops` | `3s` | `3.6s` |
| `--rhythm-legal` | `5s` | `6s` |

**Lifts:**

| Token | Value |
|---|---|
| `--lift-card` | `translateY(-2px)` |

---

## 2. Primitive Model

CSS utility classes that consume the tokens above. Live in
`src/styles/praxis-system.css` (NEW). Each class has a documented
contract — the props it accepts via `--dept` / `data-dept` / `data-state`,
and the variants it ships in.

### 2.1 `.praxis-card` family

```
.praxis-card           — base material
.praxis-card-kpi       — variant: dashboard KPI tile (padding-lg, elevated material)
.praxis-card-team      — variant: team grid cell (padding-md, radial dept signature)
.praxis-card-stat      — variant: in-page stat tile (padding-sm)
.praxis-card-activity  — variant: activity-feed row (padding-sm, left-aligned)
```

Shared base contract:
- Inputs: optional `--dept` CSS custom property; optional
  `data-state="active" | "rest"` attribute; optional `data-locked` attribute.
- Behavior: 1px outer border in `--color-border-soft`; 1px inner highlight
  at 4% white at top edge; on hover, swaps to `--elev-hover-2` and
  translates by `--lift-card`; on `data-locked`, applies ~40% chroma
  desaturation + ~70% luminance.
- Top-edge gradient indicator (FR-023): a `::before` pseudo-element
  with a 1px height, gradient from `var(--tint-{dept}-edge)` to
  transparent across the card width.

Variant deltas:
- `praxis-card-kpi`: `--space-card-lg` padding; background uses
  `--color-surface-raised` instead of base `--color-surface-elevated`
  to visually elevate the operational row from the team roster
  (FR-002).
- `praxis-card-team`: `--space-card-md` padding; adds the
  `--tint-{dept}-radial` background at the bottom-right corner (FR-024).
- `praxis-card-stat`: `--space-card-sm` padding; no top-edge indicator
  (visual quietness).
- `praxis-card-activity`: like base but with a fixed-width left gutter
  for the activity icon.

### 2.2 `.praxis-avatar` family

```
.praxis-avatar           — base employee chip
.praxis-avatar-atlas     — Atlas-spine variant (slightly larger, permanent presence pip)
.praxis-avatar-ghosted   — tier-locked variant (desaturated, lock glyph slot)
```

Shared base contract:
- Inputs: `data-dept` attribute (resolves all colors); `data-size`
  attribute with options `sm` (20px), `md` (24px), `lg` (28px), `xl`
  (32px), `2xl` (56px); optional `data-pulse="ambient" | "streaming" |
  "ship-celebration"`.
- Material: circular chip with inset highlight ring at top edge (subtle
  gloss); inner gradient from `var(--color-dept-{dept})` to `transparent`
  at 0.08 alpha toward top; icon glyph from
  `EMPLOYEE_ICON[employee]` (Lucide).
- Pulse: when `data-pulse` is set, applies the `praxis-pulse` keyframe
  with the dept's `--rhythm-{dept}` duration.

Variant deltas:
- `praxis-avatar-atlas`: `data-size="lg"` minimum; permanent presence
  pip at bottom-right (always on, regardless of `data-pulse`); slightly
  warmer inner gradient (so platinum still reads as identity).
- `praxis-avatar-ghosted`: applies CSS filter
  `filter: saturate(0.4) brightness(0.7)`; lock glyph slot at top-right.

### 2.3 `.praxis-pulse` (motion primitive)

```
.praxis-pulse                              — ambient breathing, role-typed cadence
.praxis-pulse[data-state="streaming"]      — stronger glow, fixed 1.1s
.praxis-pulse[data-state="celebration"]    — one-shot, 1200ms
```

Contract:
- Inputs: `data-dept` (resolves color), `data-state` (resolves cadence
  + intensity).
- Behavior: under reduced motion, all states render as the rest visual
  (no animation) per FR-057.
- Conflict resolution (FR-060): only one state applies at a time;
  precedence is `streaming > celebration > ambient`. Implementation:
  CSS specificity ordering.

### 2.4 `.praxis-pulse-pip`

The standalone status pip used in card corners and sidebar rows.
Smaller surface than `.praxis-avatar`, same cadence semantics. Replaces
the existing `.team-dot.ambient` for redesigned surfaces.

### 2.5 `.praxis-eyebrow` / `.praxis-microlabel` / `.praxis-tag-locked`

```
.praxis-eyebrow       — single locked microcopy style (FR-017)
.praxis-microlabel    — 1px smaller, slightly tighter tracking
.praxis-tag-locked    — ghosted pill for tier-locked rows
```

### 2.6 `.praxis-composer-pill` (chat composer)

```
.praxis-composer-pill                  — demoted resting state (FR-009)
.praxis-composer-pill[data-state="focus"]    — focused: dept-colored ring
.praxis-composer-pill[data-state="streaming"] — streaming: subtle pulse on the avatar slot only
```

Replaces `.conduit-pill-input` on the chat surface only; the existing
class stays for sidebar search etc. (R-006 coexistence strategy).

### 2.7 `.praxis-canvas-tint` (the canvas backdrop)

Single class applied to the main canvas element
(`src/app/app/layout.tsx`'s `.conduit-canvas` is extended with this
companion class).

```
.praxis-canvas-tint                              — base, no tint
.praxis-canvas-tint[data-dept="marketing"]       — Marketing wash
.praxis-canvas-tint[data-dept="sales"]           — Sales wash
… (9 dept rules)
.praxis-canvas-tint[data-tint-strength="strong"][data-dept="marketing"]  — strong-wash variant for pinned-in-chat
```

Transition: `background 240ms var(--praxis-ease-out-quart)` on
attribute change.

### 2.8 `.praxis-handoff-baton` (chat handoff)

Replaces the existing `.handoff-card` for redesigned chat. Inputs:
`data-from`, `data-to`. Behavior: animates left-edge color
`from → to` over 480ms with `--praxis-ease-baton`.

### 2.9 `.praxis-live-strip` (above-the-hero voice-active strip)

Inputs: `data-employee` (resolves the speaking employee's color).
Behavior: continuous waveform-style pulse; "Rejoin" CTA on the right.

### 2.10 `.praxis-welcome-hero` (dashboard hero composition)

The hero block on `/app/workspace`. Composes:
- Eyebrow (`.praxis-eyebrow`) with optional `live-dot` if voice active
- Headline (`--text-display-1`)
- Optional sub-line (`--text-body-lg`)
- Ambient breathing (`praxis-breath` keyframe, cadence keyed to overall
  team activity per FR-012)

---

## 3. Component Model

React components that consume the primitives. Each lives under
`src/components/conduit/praxis/` (NEW namespace, prefixed `Praxis*` to
visually distinguish from the existing `conduit/` siblings during
coexistence per R-006).

| Component | File | Type | Props (sketch) |
|---|---|---|---|
| `PraxisCanvasTintProvider` | `praxis/PraxisCanvasTintProvider.tsx` | `"use client"` | `{ children, initialDept?: EmployeeId }` |
| `useDeptTint` (hook) | `praxis/usePraxisTint.ts` | client hook | `() => { dept, setHoverDept, setPinDept, setStreamDept }` |
| `useReducedMotion` (hook) | `src/hooks/useReducedMotion.ts` | client hook | `() => boolean` |
| `PraxisAvatar` | `praxis/PraxisAvatar.tsx` | server-safe | `{ employee, size, pulse?, ghosted? }` |
| `PraxisPulsePip` | `praxis/PraxisPulsePip.tsx` | server-safe | `{ employee, state? }` |
| `PraxisCard` | `praxis/PraxisCard.tsx` | server-safe | `{ variant, dept?, locked?, children, href? }` |
| `PraxisWelcomeHero` | `praxis/PraxisWelcomeHero.tsx` | server-safe | `{ firstName, copy, voiceLive? }` |
| `PraxisLiveStrip` | `praxis/PraxisLiveStrip.tsx` | `"use client"` | `{ employee, rejoinHref }` |
| `PraxisTeamRoster` | `praxis/PraxisTeamRoster.tsx` | `"use client"` (hover interactions) | `{ employees: TeamCardData[], onHoverDept }` |
| `PraxisHandoffBaton` | `praxis/PraxisHandoffBaton.tsx` | `"use client"` | `{ from, to, label }` |
| `PraxisComposerPill` | `praxis/PraxisComposerPill.tsx` | `"use client"` | `{ pinDept, onPinChange, onSubmit, voicePrefs }` |

**Note on existing `EmployeeAvatar`**: The existing
`src/components/conduit/EmployeeBadge.tsx` `EmployeeAvatar` keeps its
current call sites (sidebar, settings, voice, paywall, etc.) untouched
per R-006. The new `PraxisAvatar` is used only on redesigned surfaces.
After all surfaces adopt the system in follow-on rounds, the two can
be merged.

---

## 4. Domain Types (consumed, not created)

The redesign reads existing types only:

| Type | File | Use |
|---|---|---|
| `EmployeeId` | `src/lib/conduit/employees.ts:12–21` | Discriminator for dept |
| `EmployeeKey` | `src/lib/ai/provider.ts` | Alias of EmployeeId at the AI layer |
| `EmployeeConfig` | `src/lib/conduit/employees.ts:23–34` | Color, role, tagline, etc. |
| `EMPLOYEES` | `src/lib/conduit/employees.ts:41–142` | Canonical roster |
| `EMPLOYEE_ORDER` | `src/lib/conduit/employees.ts:144–154` | Canonical render order |

No new types are introduced for the visual system; component prop types
are inline in their files.

---

## 5. Read-Only Data Sources (per dashboard render)

These are the existing tables/queries the redesigned dashboard reads.
The redesign does NOT change any of these — it only changes how their
values are visually composed.

| Source | Used by | Page-data shape |
|---|---|---|
| `conduit_conversations` | Workspace dashboard, sidebar, chat | `id, title, updated_at, dominant_employee` |
| `conduit_messages` | Per-employee activity, chat, recent activity | `id, role, employee, content, metadata, created_at` |
| `conduit_artifacts` | KPI tile (per-dept artifact counts), team page recent | `id, type, title, created_at, conversation_id, produced_by` |
| `conduit_memory` | "Atlas pinged you" KPI tile | `id, kind, content, tags, created_at, written_by` |
| `conduit_voice_sessions` | Voice minutes today KPI, "live now" strip | `duration_seconds, started_at, ended_at` |
| `conduit_builds` | Engineering ship celebration | `id, status, created_at` |
| `conduit_engineering_sessions` | Engineering in-flight indicator | `id, status, created_at` |
| `sales_leads` (Lunaro-adjacent? — VERIFY) | Pipeline KPI tile | `id, business_name, score, status` |

**VERIFY at plan-implementation time**: `sales_leads` does NOT carry
the `conduit_` namespace prefix in the existing dashboard query
(`workspace/page.tsx:77–86`). Per Constitution Principle II, this could
be a cross-tenant read that needs investigation, OR a Praxis-owned
table that pre-dates the namespacing convention. The redesign MUST NOT
introduce new queries that perpetuate the gap; if the table is
Praxis-owned, the constitution-amendment path may apply. If it is a
Lunaro table, the dashboard's pipeline KPI is in violation already and
the redesign should *flag* (not silently re-emit) the violation in the
implementation PR.

---

## 6. New thin server endpoint

One new route handler at `src/app/api/conduit/team-activity/route.ts`
(GET). Returns a small JSON payload for the team-activity poll
(R-002):

```typescript
GET /api/conduit/team-activity
→ 200 OK
{
  employees: {
    [employeeId: EmployeeId]: {
      last_active_at: string | null,
      last_artifact_title: string | null,
      last_artifact_created_at: string | null,
      in_flight_build_id: string | null,
      top_lead_score: number | null,  // sales only
    }
  },
  voice_live: { session_id: string, started_at: string } | null,
}
```

Auth: existing `getCurrentAccount()` pattern; returns 401 if not
authenticated. RLS-scoped via the standard server-Supabase client.

This is the ONLY new API surface this redesign introduces. No new
mutations, no new tables.
