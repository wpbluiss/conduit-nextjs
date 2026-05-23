# Praxis Console — Design System (R15)

**Status**: v1 (Phase 2 — tokens + system CSS shipped, no surface
consumers yet). v2 (full primitive catalogue + surface map) lands at
Phase 7.

**Source**: spec at
[`specs/praxis-console-premium-redesign/spec.md`](../specs/praxis-console-premium-redesign/spec.md).
Plan at
[`specs/praxis-console-premium-redesign/plan.md`](../specs/praxis-console-premium-redesign/plan.md).

**Scope**: every value and primitive in this document is scoped to
`.praxis-root` (the `/app/*` Praxis console shell). The Conduit AI
marketing site at `/` uses a separate token system in
`src/app/globals.css` (`@theme` block) and is **untouched** by this
redesign per Constitution Principle IV.

---

## 1. Tokens

All tokens are CSS custom properties declared in
`src/styles/praxis-tokens.css` and consumed by
`src/styles/praxis-system.css` and component code.

### 1.1 Spacing

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |

### 1.2 Card padding presets

| Token | Value | Use |
|---|---|---|
| `--space-card-sm` | 12px | In-page stat tile |
| `--space-card-md` | 20px | Team grid cell |
| `--space-card-lg` | 28px | Dashboard KPI tile |

### 1.3 Radii

| Token | Value | Use |
|---|---|---|
| `--radius-pill` | 9999px | Composer pill, pips, tags |
| `--radius-md` | 8px | Buttons, small chips |
| `--radius-card` | 16px | All `.praxis-card-*` variants |
| `--radius-hero` | 20px | Optional hero surround |

### 1.4 Typography display (Fraunces, weight 400, line-height 1.05, letter-spacing −0.02em)

| Token | Value | Use |
|---|---|---|
| `--text-display-1` | `clamp(2.25rem, 4vw + 0.5rem, 3.25rem)` | Hero — dashboard, team page, chat empty (single step, shared) |
| `--text-display-2` | `clamp(1.75rem, 2.5vw + 0.5rem, 2.25rem)` | Section heads within a page |
| `--text-display-3` | `1.5rem` | In-card display number / metric |

### 1.5 Typography UI (Inter)

| Token | Spec | Use |
|---|---|---|
| `--text-eyebrow-*` | 11px / 500 / 0.18em tracking / uppercase | Single eyebrow style across all surfaces |
| `--text-microlabel-*` | 10px / 500 / 0.15em tracking / uppercase | Micro-state labels |
| `--text-body-sm` | 13px | Card body |
| `--text-body` | 15px | Default body |
| `--text-body-lg` | 17px | Hero supporting copy |

### 1.6 Numeric (JetBrains Mono, tabular figures via `font-feature-settings: "tnum" 1`)

| Class | Use |
|---|---|
| `.praxis-numeric-display` | KPI tile metric value |
| `.praxis-numeric-body` | Inline counts / stamps |

### 1.7 Elevation

Three rest levels, three hover levels. Hover levels include the
dept-tinted outer glow via `--dept-edge` and `--dept-glow` custom
properties on the consuming element.

| Token | Use |
|---|---|
| `--elev-rest-1` | Minimal — base team-card surface |
| `--elev-rest-2` | KPI tile rest |
| `--elev-rest-3` | Featured/strong rest |
| `--elev-hover-1` | Light hover (border-edge swap) |
| `--elev-hover-2` | KPI hover (with dept glow) |
| `--elev-hover-3` | Team-card hover (with dept glow + dept edge ring) |

Dark and light themes both define these tokens (light uses
ink-tinted shadow values, not black).

### 1.8 Motion

**Easing curves:**

| Token | Value |
|---|---|
| `--praxis-ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` |
| `--praxis-ease-in-out-quart` | `cubic-bezier(0.76, 0, 0.24, 1)` |
| `--praxis-ease-baton` | `cubic-bezier(0.4, 0, 0.2, 1)` |

**Lifts:**

| Token | Value |
|---|---|
| `--lift-card` | `translateY(-2px)` |

**Rhythm tokens — role-typed ambient pulse cadences** (locked by
operator at GATE 1 per spec FR-013/FR-054):

| Token | Desktop | Mobile (×1.2) | Character |
|---|---|---|---|
| `--rhythm-jarvis` | 4s | 4.8s | Atlas — calm, steady |
| `--rhythm-marketing` | 3s | 3.6s | Creative medium sway |
| `--rhythm-sales` | 2.5s | 3s | Conversational |
| `--rhythm-engineering` | 2s | 2.4s | Build-burst, fastest |
| `--rhythm-finance` | 5s | 6s | Slow ledger |
| `--rhythm-compliance` | 6s | 7.2s | Deliberate, slowest |
| `--rhythm-hr` | 3.5s | 4.2s | People-paced |
| `--rhythm-ops` | 3s | 3.6s | Process-paced |
| `--rhythm-legal` | 5s | 6s | Deliberate |

### 1.9 Per-dept tints (derived, 45 declarations)

Five derivations × 9 depts. All via `color-mix()` against
`--color-surface` so both themes flip automatically.

| Token shape | Use |
|---|---|
| `--tint-{dept}-wash` (5%) | Canvas backdrop (transient — hover, stream) |
| `--tint-{dept}-wash-strong` (9%) | Canvas backdrop (persistent — pinned-in-chat) |
| `--tint-{dept}-glow` (14% alpha) | Outer hover-shadow on card |
| `--tint-{dept}-edge` (35% alpha) | Top-edge gradient indicator, composer focus ring |
| `--tint-{dept}-radial` | Team card bottom-right radial signature |

**Atlas exception**: `--tint-jarvis-wash` and `--tint-jarvis-wash-strong`
fall through to a neutral warm wash (`color-mix(in srgb,
var(--color-text) {4|8}%, var(--color-surface))`) because platinum has
no chroma to tint with at low opacity.

---

## 2. Primitives

*Coming in v2 (Phase 7). For now, see
[`specs/praxis-console-premium-redesign/contracts/primitives.md`](../specs/praxis-console-premium-redesign/contracts/primitives.md)
for the full primitive contracts.*

Brief list, by class name:

- `.praxis-card` (+ variants `kpi`, `team`, `stat`, `activity`,
  modifier `data-locked="true"`)
- `.praxis-avatar` (+ variants `-atlas`, `-ghosted`, sizes via
  `data-size`)
- `.praxis-pulse-pip` (+ states via `data-state`)
- `.praxis-canvas-tint` (+ `data-dept`, `data-tint-strength`)
- `.praxis-display-{1,2,3}`, `.praxis-eyebrow`, `.praxis-microlabel`,
  `.praxis-body-{sm,lg}`, `.praxis-body`, `.praxis-numeric-{display,body}`
- `.praxis-tag-locked`
- `.praxis-composer-pill` (+ `data-state="focus"`)
- `.praxis-handoff-baton`
- `.praxis-live-strip` (+ `.praxis-live-strip-wave`)
- `.praxis-welcome-hero` (+ `data-activity-bucket`)

Dept resolution: setting `data-dept="{employeeId}"` on any wrapper
cascades `--dept`, `--dept-edge`, `--dept-glow`, `--dept-radial`,
and `--rhythm` down the subtree.

---

## 3. Surface map

*Coming in v2 (Phase 7). Until then, see
[`specs/praxis-console-premium-redesign/contracts/surfaces.md`](../specs/praxis-console-premium-redesign/contracts/surfaces.md).*

Redesigned surfaces:

| Surface | Status |
|---|---|
| `src/app/app/workspace/page.tsx` (dashboard) | Phase 4 |
| `src/app/app/team/[employee]/page.tsx` (header only) | Phase 5 |
| `src/components/conduit/Chat.tsx` (empty + composer + handoff) | Phase 6 |
| `src/app/app/layout.tsx` (canvas-tint provider mount) | Phase 4 |
| `src/components/conduit/Sidebar.tsx` (pip + active-route indicator only) | Phase 8 |

Surfaces explicitly **not** in this redesign: voice room, builds,
artifacts, analytics, settings, sales bespoke workspace, onboarding
+ paywall modals, marketing site.

---

## 4. Motion vocabulary

Named keyframes shipping in `praxis-system.css`:

| Keyframe | Cadence | Trigger |
|---|---|---|
| `praxis-pulse` | `var(--rhythm-{dept})` infinite | Ambient — applied to `.praxis-pulse-pip[data-state="ambient"]` and `.praxis-avatar[data-pulse="ambient"]` |
| `praxis-pulse-streaming` | 1.1s infinite | Stronger glow — applied when employee is currently streaming a reply |
| `praxis-pulse-celebration` | 1.2s one-shot | Fires once on detection of fresh-since-mount artifact/build |
| `praxis-breath` | 2–4s infinite (cadence keyed to team-activity bucket) | Hero block subtle translate-y |
| `praxis-baton` | 480ms one-shot | Handoff card edge color transition (`--from` → `--to`) |
| `praxis-time-fade` | 200ms one-shot | Stamp value change crossfade |
| `praxis-live-wave-{1,2,3}` | 0.9s infinite (staggered) | Live-strip waveform abstraction |

### 4.1 Reduced-motion policy (FR-057)

| Primitive | Under `prefers-reduced-motion: reduce` |
|---|---|
| `praxis-pulse*` | Suppressed entirely — rest state communicates identity |
| `praxis-wash-in/out` (CSS `transition` on canvas) | Collapses to 0 — hard swap |
| `praxis-baton` | Renders end state (right-edge `--to` color) only — no animation |
| `praxis-breath` | Suppressed entirely |
| `praxis-pulse-celebration` | Suppressed — fires a static one-frame flash via inline opacity change |
| `praxis-time-fade` | No transition — hard swap |
| `praxis-live-wave-*` | Suppressed — static dot + label only |
| View Transitions API page-transition | Falls back to plain `router.push()` |

### 4.2 Motion conflict resolution (FR-060)

Only one motion state is permitted per element at a time. Precedence
when multiple would apply:

`streaming > ship-celebration > ambient`

Implemented in CSS via selector specificity — the streaming selector
beats the ambient selector, the celebration selector replaces both
on one-shot detect.

---

## 5. Don'ts

- **No hex literals in component code** (FR-037). Every color value
  must trace to a `--color-*` token. Author the dept-tint in CSS via
  `color-mix()` and consume it from there.
- **No arbitrary Tailwind utilities** (FR-036) on redesigned surfaces:
  `text-[Npx]`, `min-h-[Npx]`, `px-[Np]`, etc. Use the spacing scale
  and typography classes from this document.
- **No JS animation libraries in `/app/*`** (spec Assumption 7).
  `framer-motion` is installed but reserved for marketing surfaces.
  CSS keyframes + transitions + the View Transitions API cover every
  motion need.
- **No inline `style={{ animationDuration: ..., easing: ... }}`** for
  motion (FR-038). Use named tokens and named classes.
- **No nesting `PraxisCanvasTintProvider`**. The layout mounts one;
  child surfaces consume the hook to update its state, never wrap
  again.
- **No two competing pulse states** on the same element. The
  `data-state` attribute carries one value at a time; provider /
  parent decides precedence.

---

## 6. Coexistence with `.conduit-*` (legacy primitives)

For the duration of R15, the existing `.conduit-card`,
`.conduit-suggestion`, `.conduit-pill-input`, `.conduit-bubble-*`,
`.live-dot`, `.employee-pulse`, `.team-dot.ambient`, etc. **remain
in place** for out-of-scope surfaces (sidebar body, settings, voice,
artifacts, builds, analytics, modals).

A future round migrates the remaining surfaces to the `.praxis-*`
family; until then the two systems sit side-by-side on the dark
Praxis canvas without conflict (different selector namespaces, same
underlying color tokens).
