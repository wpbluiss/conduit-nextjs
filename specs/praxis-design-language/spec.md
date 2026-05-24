# Praxis Design Language — Visual Constitution

**Feature Branch**: `feat/praxis-design-language`
**Created**: 2026-05-23
**Status**: Draft — awaiting GATE 1 approval
**Round**: R18 (parallel to R17 connectors slice 2)

**Input**: Luis wants a single design language that governs the entire Praxis
platform — not a one-off polish pass. Every surface gets rebuilt against this
artifact. North star: Linear / Arc "at night" — calm, spatial, premium. Direct
reference: Higgsfield Supercomputer (real logos, hover-reveal glassmorphism,
node-graph canvas, quiet chrome, ecosystem framing). Both light AND dark
themes are first-class equals. Memory's node-canvas is the first surface to
be built in the new language.

---

## Vision — "Linear / Arc, at night, with a node-graph for a mind"

Praxis becomes a calm, spatial workspace where intelligence lives on a
canvas, not in chrome. The user lands on dotted-grid space. The chrome
recedes. Controls hide until summoned. Brand marks identify everything —
real Gmail, real GitHub, real Stripe — never colored text or letter-initials.
The whole interface feels like a single instrument the user is learning to
play, not a stack of dashboards.

### The unforgettable moment

The Memory canvas. When Luis opens `/app/memory`, he sees a living
node-graph: glowing nodes representing what Praxis knows, organized into
clusters (Identity, Business, Product, Marketing-only, Engineering-only,
etc.), connected by gentle curved branches. Hovering a node fades in a
glassmorphic tooltip with the memory content + actions. Adding a memory
opens a glassmorphic composer that drops a new glowing node onto the
canvas with a brief pulse. There is no "+ Add memory" button visible
anywhere on first paint — the affordance lives in space, summoned by
hover, never repeated.

That moment IS the experience. Every other surface rebuilds around the
same vocabulary.

---

## Background — what's real, what's mocked, what violates

### What's real (we already have)

- A working light-and-dark theme infrastructure scoped to `.praxis-root` (`src/styles/praxis-tokens.css:158-212` defines the light palette; the dark palette is the default at `:26-113`).
- A token system with `--space-*`, `--radius-*`, `--text-*`, dept jewel-tones (9 employees), `--rhythm-*` motion cadences (added in R15).
- A `EMPLOYEE_ICON` registry of semantic Lucide icons per employee (`src/components/conduit/EmployeeBadge.tsx:28-38`) — good foundation; just not consistently used.
- The Fraunces serif display + JetBrains Mono mono families wired via `next/font` (`src/app/layout.tsx:14-28`).
- A `Tier` system that gates surfaces (memoryCap, allowedEmployees, etc.).
- A real OS-aware theme toggle (`src/components/conduit/ThemeBoot.tsx` + Settings `ThemeToggle`).

### What's missing / aspirational

- A unified design language. Surfaces are designed surface-by-surface (R15 redesign for workspace/team/chat; R16 cinema for builds; R17 dossier for memory) with different vocabularies. No single artifact governs the platform.
- The node-graph component. Zero canvas-based components exist.
- The dotted-grid canvas treatment. Zero existing surface uses it.
- True glassmorphism. Modals/drawers today are opaque cards.
- A brand-mark library. Real GitHub octocat, real Gmail mark, etc. — none of these are vendored or rendered today.
- Hover-reveal (controls fully hidden until hover) as a system pattern. Today the codebase uses opacity-fade (0.4 → 1.0), which is the wrong direction.

### What violates the target aesthetic (the punch list)

See **§Audit — Current UI Violations** below for the full enumeration with
file + line references. Summary of the structural ones, ordered by severity:

1. **Memory Desk** (just built in R17 Slice 1) — vertical card list per dept; colored serif dept name headers; "+ Add memory" link repeats in every section (10 sections × 1 = 10 instances); hover affordances fade from 0.4 opacity (wrong pattern). This is the single biggest structural violation since the surface is fresh.
2. **Sidebar** — 20+ items visible (Workspace + Team-9 + Voice + Memory + Builds + Analytics + Settings + Billing + Sign-out + Recent-8). Always-visible "+ New chat" CTA at the top. Text-heavy, not quiet chrome.
3. **Settings** — 6-tab strip (Profile / Business / Voice / Team / Usage / Billing). Target = "2-3 calm pill tabs per surface."
4. **EmployeeBadge** — `variant="letter"` path still renders text-initials (M, S, E) in colored circles. Should be deprecated.
5. **Hardcoded `bg-black/60`, `bg-white`, `text-white`** scattered across `OnboardingModal`, `PaywallModal`, `VoiceRoom`, Sidebar mobile overlay, Chat composer. Breaks theme parity in light mode.
6. **Dept-colored text labels** as primary identification — TeamRoster employee name renders in dept color (`PraxisTeamRoster.tsx:309-312`), EmployeeBadge name renders in dept color (`EmployeeBadge.tsx:93-96`).
7. **Opaque modals** — `OnboardingModal`, `PaywallModal`, Chat composer, Builds Continue modal all use opaque card surfaces with hard edges. No backdrop-blur, no semi-transparent, no hairline borders.

---

## Principles (NON-NEGOTIABLE)

These are the visual rules every Praxis surface obeys. They sit alongside
the repo constitution (`/.specify/memory/constitution.md`) but govern
**look + interaction**, not domain truth / namespace / brand-axis split.

### P1 — Real brand marks. Always.

Every reference to a third-party product or service renders the real
brand mark. Gmail shows the real Gmail M. GitHub shows the real octocat.
Stripe shows the real Stripe S. The 9 Praxis employees use semantic
Lucide icons from `EMPLOYEE_ICON` as their visual identity — NEVER letter-
initials in colored circles, NEVER colored text headers.

**The 9 employee identities** are semantic icons (Compass / Megaphone /
TrendingUp / Code / Calculator / Shield / Users / Cog / Scale), rendered
in a neutral surface chip. The dept jewel-tone may tint the chip's GLOW
or BORDER, but the icon itself stays in the default ink color. The
employee's NAME is always rendered in `--color-text`, never in their
dept color.

**Brand marks**: a shared `BrandChip` primitive accepts a `kind` (gmail,
github, stripe, drive, supabase, slack, vercel, etc.) and renders the
canonical SVG mark scaled and inset inside a glassmorphic chip. The chip
respects the theme (white-on-octocat-black in dark mode, octocat-black-on-
white in light mode, or whatever each brand's brand guidelines dictate).
Brand marks are checked into `src/components/conduit/brand-marks/*.tsx`.

**Letter-initials are deprecated.** `EmployeeAvatar`'s `variant="letter"`
is removed.

### P2 — Hide controls until hover. Reveal with glassmorphism.

Default state: nodes, cards, panels render WITHOUT visible action buttons.
A node's content is the content; controls are summoned. On hover, a
glassmorphic tooltip / affordance layer fades in (220 ms, ease-out)
displaying actions (Add, Edit, Pin, Lock, Archive, etc.).

**Opacity-fade is forbidden as a hide pattern.** A button rendered at
0.4 opacity is still visible — that's not hide-until-hover. Use
`display: none` or `visibility: hidden` with full opacity on the parent
hover. The reveal motion is opacity + slight translate, not opacity from
0.4.

**Glassmorphic tooltip vocabulary**: backdrop-blur(16px) saturate(180%),
semi-transparent background (rgba 65% dark / 75% light), 1px hairline
border, soft shadow. Pill or panel shape. Max-width ~280px. Pointer-
arrow optional.

### P3 — Power on the canvas, not in chrome.

Sidebar collapses to icon-default (~56 px) and expands on hover/pin to
~200 px showing labels. Only 2-3 pill tabs per surface — never 6. The
top of each surface is a clear, contextual title with optional pill-tab
nav and zero repeated action buttons.

**Repeated buttons** (the "+ Add memory" repeating in 10 places across
the dossier) are explicitly forbidden. ONE add affordance per surface,
summoned via canvas interaction or a single contextual hover.

### P4 — Both themes, first-class equals.

Light and dark theme are not "dark + a light variant." They are two
canonical canvases. Every token is defined for both with parity intent.
Every surface is tested against both before merge. Dept jewel-tones in
light mode are deepened/desaturated to read on bone canvas; in dark mode
they retain saturation against the deep surface.

The default theme follows the OS (`prefers-color-scheme`) on first visit;
the user can override in Settings with persistence in localStorage +
`conduit_accounts.theme_preference`. Both code paths already exist (R3
landed `ThemeBoot` + `ThemeToggle`); we keep them as the contract.

### P5 — Spatial / canvas-first surfaces where appropriate.

Memory, Connectors, Workspace dashboard, and Team are spatial. Chat and
Builds remain time-sequenced (a chat is a stream; a build is a process).
Where spatial: dotted-grid canvas + node-graph or card-on-grid composition.
Where time-sequenced: lane layout, but with the same chrome restraint.

### P6 — Motion is the language, not noise.

Every interaction uses one of five canonical durations (120 / 220 / 360 /
480 / 1200 ms) with one of three canonical easings. Reduced-motion
preferences disable decorative motion and substitute opacity-only
transitions. Glassmorphic reveal, node pulse, page entrance, celebration —
all draw from the same vocabulary.

### P7 — Ecosystem framing.

Connectors are not "integrations." They are a marketplace. The Connectors
surface (R17 Slice 2) gets Available / Installed toggles, Community /
Mine filters, and a "Custom MCP" affordance for power users. Same
framing applies to future employee marketplace, template gallery,
artifact library.

---

## Tokens (the canonical reference)

A new CSS sheet `src/styles/praxis-design-language.css` is the source of
truth. It SUPERSEDES `praxis-tokens.css` for the surfaces that adopt the
new language, and coexists during the rollout. All tokens scoped under
`.praxis-root`.

### Typography

**Display** — Fraunces (keep). Italic for accents. Used for surface
titles, hero headlines, single-line key moments. Sizes: `--text-display-2xl: 56px`, `--text-display-xl: 40px`, `--text-display-lg: 32px`, `--text-display-md: 24px`.

**Body** — **switch from Inter to Geist Sans.** Inter is too generic per
the frontend-design skill principles ("avoid Inter, Roboto, Arial").
Geist is Vercel's font, ships free, integrates natively with `next/font`
(`import { GeistSans } from "geist/font/sans"`), and is visually distinct
from Inter. Sizes: `--text-body-lg: 16px`, `--text-body: 14px`, `--text-body-sm: 13px`, `--text-eyebrow: 10px` (uppercase, letter-spacing 0.18em), `--text-caption: 11px`.

**Mono** — Geist Mono (paired with Geist Sans for cohesion) OR keep
JetBrains Mono (acceptable; less cohesive but battle-tested). [NEEDS
CLARIFICATION: Geist Mono vs JetBrains Mono — defer to implementation
plan once Geist Sans is approved.]

**Weights** (Geist Sans): 400 regular, 500 medium, 600 semibold. No
italic in body (italic lives in Fraunces only).

**Type rules**:
- Display is serif. Body is sans. Mono is mono. Never mix.
- Italic body uses Fraunces italic, not Geist italic. Italics are a serif moment.
- Letter-spacing on eyebrow text is 0.18em uppercase tracking.
- Line-heights: 1.1 for display, 1.45 for body, 1.55 for body-lg, 1.6 for mono.

### Color — dark theme (canonical)

```css
.praxis-root[data-theme="dark"] {
  /* Canvas tiers */
  --pdl-canvas:           #0A0815;   /* deepest — full-page background */
  --pdl-surface:          #131027;   /* panels, cards */
  --pdl-surface-raised:   #1A152F;   /* hover-surface */
  --pdl-surface-glass:    rgba(20, 16, 31, 0.65);   /* glassmorphic */

  /* Text */
  --pdl-text:             #F5F1EA;
  --pdl-text-muted:       #8A88A4;
  --pdl-text-soft:        #5E5C76;   /* tertiary, captions */

  /* Borders */
  --pdl-border-hairline:  rgba(245, 241, 234, 0.08);
  --pdl-border-default:   rgba(245, 241, 234, 0.14);
  --pdl-border-strong:    rgba(245, 241, 234, 0.22);

  /* Accent — brand purple (carry from current praxis) */
  --pdl-accent:           oklch(58% 0.22 290);
  --pdl-accent-soft:      oklch(58% 0.22 290 / 0.14);
  --pdl-accent-glow:      oklch(58% 0.22 290 / 0.35);

  /* Node-graph */
  --pdl-node-fill:        var(--pdl-surface);
  --pdl-node-border:      var(--pdl-border-default);
  --pdl-node-glow:        oklch(70% 0.22 290 / 0.50);
  --pdl-edge:             rgba(245, 241, 234, 0.18);
  --pdl-dot-grid:         rgba(245, 241, 234, 0.05);
  --pdl-dot-grid-strong:  rgba(245, 241, 234, 0.10);
}
```

### Color — light theme (canonical equal)

```css
.praxis-root[data-theme="light"] {
  /* Canvas tiers */
  --pdl-canvas:           #F7F4EE;   /* warm bone */
  --pdl-surface:          #FFFFFF;
  --pdl-surface-raised:   #FAF7F1;
  --pdl-surface-glass:    rgba(255, 255, 255, 0.75);

  /* Text */
  --pdl-text:             #14101F;   /* deep ink */
  --pdl-text-muted:       #6A6878;
  --pdl-text-soft:        #A5A3B3;

  /* Borders */
  --pdl-border-hairline:  rgba(20, 16, 31, 0.06);
  --pdl-border-default:   rgba(20, 16, 31, 0.12);
  --pdl-border-strong:    rgba(20, 16, 31, 0.20);

  /* Accent — deepened for light canvas */
  --pdl-accent:           oklch(42% 0.20 290);
  --pdl-accent-soft:      oklch(42% 0.20 290 / 0.12);
  --pdl-accent-glow:      oklch(42% 0.20 290 / 0.25);

  /* Node-graph */
  --pdl-node-fill:        var(--pdl-surface);
  --pdl-node-border:      var(--pdl-border-default);
  --pdl-node-glow:        oklch(42% 0.20 290 / 0.30);
  --pdl-edge:             rgba(20, 16, 31, 0.16);
  --pdl-dot-grid:         rgba(20, 16, 31, 0.06);
  --pdl-dot-grid-strong:  rgba(20, 16, 31, 0.12);
}
```

### Dept jewel-tones (both modes, paired)

```css
/* DARK MODE */
--pdl-dept-jarvis-dark:       #C8C5BD;
--pdl-dept-marketing-dark:    #FF8A3D;   /* topaz */
--pdl-dept-sales-dark:        #34D399;   /* emerald */
--pdl-dept-engineering-dark:  oklch(60% 0.22 248);
--pdl-dept-finance-dark:      #EAB308;
--pdl-dept-compliance-dark:   #A855F7;
--pdl-dept-hr-dark:           #EC4899;
--pdl-dept-ops-dark:          #14B8A6;
--pdl-dept-legal-dark:        #3B82F6;

/* LIGHT MODE — deepened for bone canvas legibility */
--pdl-dept-jarvis-light:      #7F7C72;
--pdl-dept-marketing-light:   #C76A2A;
--pdl-dept-sales-light:       #128054;
--pdl-dept-engineering-light: oklch(38% 0.20 248);
--pdl-dept-finance-light:     #A77D08;
--pdl-dept-compliance-light:  #6C2BBA;
--pdl-dept-hr-light:          #B62571;
--pdl-dept-ops-light:         #0A6B62;
--pdl-dept-legal-light:       #1E4FB0;
```

Dept colors are accent ONLY — for chip glow, border tint, badge background.
NEVER applied as the color of body text or a section title. The `EMPLOYEE_ICON`
glyph carries dept identity through shape, not hue.

### Spacing rhythm (8-step T-shirt)

```css
--pdl-space-xs:   4px;
--pdl-space-sm:   8px;
--pdl-space-md:   12px;
--pdl-space:      16px;
--pdl-space-lg:   24px;
--pdl-space-xl:   32px;
--pdl-space-2xl:  48px;
--pdl-space-3xl:  64px;
--pdl-space-4xl:  96px;   /* massive negative space, hero-tier */
```

Gaps between primary sections default to `--pdl-space-2xl` (48 px). Negative
space is a feature; layouts cluster content and breathe between clusters.

### Radii

```css
--pdl-radius-sharp:    4px;     /* small chips, mini buttons */
--pdl-radius-default:  8px;     /* inputs, default buttons */
--pdl-radius-soft:     12px;    /* cards, panels */
--pdl-radius-soft-lg:  16px;    /* hero cards, glassmorphic panels */
--pdl-radius-round:    9999px;  /* pills, avatars */
```

### Elevation / shadow

```css
/* DARK */
--pdl-elev-1: 0 1px 2px rgba(0, 0, 0, 0.35);
--pdl-elev-2: 0 4px 16px rgba(0, 0, 0, 0.40);
--pdl-elev-3: 0 16px 48px rgba(0, 0, 0, 0.50);
--pdl-elev-glow: 0 0 24px var(--pdl-accent-glow);

/* LIGHT */
--pdl-elev-1: 0 1px 2px rgba(20, 16, 31, 0.06);
--pdl-elev-2: 0 4px 16px rgba(20, 16, 31, 0.08);
--pdl-elev-3: 0 16px 48px rgba(20, 16, 31, 0.12);
--pdl-elev-glow: 0 0 24px var(--pdl-accent-glow);
```

### Motion vocabulary

```css
/* Durations */
--pdl-dur-ultra:   120ms;   /* micro-toggle, instant feedback */
--pdl-dur-default: 220ms;   /* most interactions */
--pdl-dur-emphasis: 360ms;  /* drawer open, modal mount, hover reveal */
--pdl-dur-transition: 480ms; /* curtain rises, route transitions */
--pdl-dur-celebration: 1200ms; /* one-time success moments */

/* Easings */
--pdl-ease:           cubic-bezier(0.22, 0.61, 0.36, 1);  /* premium ease-out */
--pdl-ease-emphasis:  cubic-bezier(0.4, 0, 0.2, 1);
--pdl-ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1);   /* subtle overshoot */
```

All ambient/decorative motion is gated by
`@media not (prefers-reduced-motion: reduce)`. Functional motion (state
transitions, focus rings) stays under reduced motion at minimum opacity-only.

### Glassmorphism (the canonical recipe)

```css
.pdl-glass {
  background: var(--pdl-surface-glass);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid var(--pdl-border-hairline);
  box-shadow: var(--pdl-elev-3);
  border-radius: var(--pdl-radius-soft-lg);
}
```

Used for: hover-reveal tooltips, modal panels, drawers, the connector
verify drawer (R17 Slice 2), the memory composer.

NOT used for: full-page surfaces (which use `--pdl-canvas`), cards in
the main flow (which use `--pdl-surface`), the chat composer (which gets
its own pill treatment).

### Dotted-grid canvas (the spatial primitive)

The canvas treatment for Memory, Workspace, Connectors:

```css
.pdl-canvas-grid {
  background-color: var(--pdl-canvas);
  background-image:
    radial-gradient(circle, var(--pdl-dot-grid) 1px, transparent 1px);
  background-size: 24px 24px;
  background-position: 0 0;
}

.pdl-canvas-grid[data-strong="true"] {
  background-image:
    radial-gradient(circle, var(--pdl-dot-grid-strong) 1px, transparent 1px);
}
```

Pan / zoom interaction is OUT OF SCOPE for the first surface (Memory
canvas v1). Future surfaces may add it; the dot-grid renders the same
regardless.

---

## Components — the inventory

A new namespace `src/components/conduit/pdl/` will host the design-language
primitives. Existing `src/components/conduit/praxis/*` (R15 redesign) and
`src/components/conduit/builds/*` (R16 cinema) remain in place but are
flagged for systematic rebuild against the new language.

### Chrome

- **`AppShell`** — sidebar + canvas + optional top contextual bar. Single shell wraps every `/app/*` route.
- **`Sidebar`** (rebuild) — collapsible (56 px / 200 px), icon-default. Three groups: primary surfaces (Workspace, Memory, Connectors, Voice, Builds, Chat), recent items (max 4), account/billing (bottom). The Team item collapses to a "View team" icon — the 9-employee list is rendered on Workspace (already there via `PraxisTeamRoster`) and on a dedicated `/app/team` surface, not in the sidebar.
- **`PillTabBar`** — 2-3 pill-shaped tabs max per surface. Active pill fills with accent; inactive shows ink-muted text. Settings collapses from 6 tabs to 3 ("Profile", "Workspace", "Plan & Usage"). Round-robin into the new structure during Settings rebuild.
- **`TopContextBar`** — optional thin top bar for surface title + contextual actions. Used only where the surface needs more than the sidebar provides (e.g. Connectors with Available/Installed toggle).

### Canvas + node-graph

- **`Canvas`** — wraps `pdl-canvas-grid`. Provides positioning context for nodes.
- **`Node`** — circular or rounded-rect node with glow. Props: `position: { x, y }`, `tone?: dept`, `state: idle | hover | active`, `glyph?: ReactNode`, `label?: string`. Renders a subtle ambient pulse (4 s loop, opacity 0.85 → 1) when idle.
- **`Edge`** — SVG path between two nodes. Curved (quadratic Bezier). Stroke uses `--pdl-edge`. Optional `tone` tints subtly.
- **`NodeHoverTooltip`** — glassmorphic tooltip that appears on node hover. Contains memory content, kind chip, scope chips, hover-action row (pin, lock, edit, archive).
- **`NodeComposer`** — glassmorphic composer that opens on canvas click or "+" hotkey. Places a new node at the click position (or center of viewport).

### Primitives

- **`BrandChip`** — real-logo container. Accepts `kind: "github" | "gmail" | "drive" | "stripe" | "supabase" | "slack" | "vercel" | ...`. Renders the canonical SVG from `src/components/conduit/brand-marks/`. Theme-aware (logo color flips appropriately).
- **`DeptIcon`** — semantic Lucide icon for the 9 Praxis employees. Reads from `EMPLOYEE_ICON` registry. NEVER renders text.
- **`Avatar`** — composes `DeptIcon` (for employees) or `BrandChip` (for connectors / external) inside a circular surface. Sizes: sm (20 px), md (32 px), lg (48 px), xl (72 px). NEVER falls back to text-initials.
- **`HoverReveal`** — utility wrapper that hides children by default (visibility: hidden, opacity: 0) and reveals on parent hover (visibility: visible, opacity: 1, optional slight translate). Uses `--pdl-dur-default`, `--pdl-ease`.
- **`Tooltip`** — glassmorphic; max-width 280 px; pointer arrow optional. Appears on hover with 200 ms delay; dismisses on mouseleave.
- **`Popover`** — glassmorphic; click-triggered with absolute positioning. Used for context menus, dept-pickers, kind-pickers, sort menus.
- **`Drawer`** — slides in from right (desktop) or bottom (mobile). Glassmorphic surface. Used for the PAT-paste connector flow and other sensitive operations.
- **`Modal`** — centered dialog. Glassmorphic. Backdrop is `rgba(0,0,0,0.45)` (dark) / `rgba(255,255,255,0.50)` (light) — same backdrop both modes, but the surface adapts.

### Layout

- **`Pane`** — semantic content container. Provides default padding (`--pdl-space-lg` desktop, `--pdl-space-md` mobile).
- **`Stack`** — vertical gap layout. Default gap `--pdl-space`.
- **`Lane`** — horizontal scroll lane (for narrow streams).
- **`Card`** — surface card with `--pdl-radius-soft` + `--pdl-elev-1`. Hover lifts to `--pdl-elev-2`.

### Inputs

- **`Composer`** — chat-style input, glassmorphic on focus. Used for chat + the memory NodeComposer.
- **`SearchField`** — cmd+K-shaped global search. Top-of-surface variant + overlay variant.
- **`TokenInput`** — `<input type="password">` with autocomplete=off, used for secret paste (PAT, API keys). Always inside a Drawer.

### Status

- **`StatusPip`** — small circular pip with optional pulse. Pulse cadence by role (Atlas slow, Engineering fast). Cadences inherit from R15 `--rhythm-*` tokens.
- **`Pill`** — small action button or status badge. Token-tinted. Glassmorphic in floating contexts.

### Data display

- **`KpiTile`** (rebuild) — operational metric card. Single number + label + optional sparkline. Used on Workspace dashboard.
- **`LiveStrip`** (keep, refine) — above-the-hero strip for live ambient state (voice live, build in flight). Already exists; refine to use new tokens + glassmorphism.

---

## Interactions — the system patterns

### I1 — Hover reveal (the core pattern)

Every action lives behind hover. Default state of a card / node / item:
just content. On parent hover:
1. The parent's surface lifts elevation (1 → 2).
2. A glassmorphic affordance layer (`HoverReveal` wrapper) fades in with
   `--pdl-dur-default` and a 4 px translate from below.
3. Affordances inside (pin, lock, edit, archive, etc.) are full opacity
   from the moment they appear.
4. Mouse-leave reverses with same timing.

**Touch devices** (`@media (hover: none)`): affordances are always visible
(no other choice).

### I2 — Node interactions (Memory canvas first)

- **Hover** a node → glassmorphic tooltip slides up (220 ms ease-out) with the memory content + 4-affordance row (pin, lock, edit, archive). Stays open while mouse is over the node OR the tooltip.
- **Click** a node → opens an inline edit composer in place of the tooltip (same surface, more affordances).
- **Click empty canvas** → opens NodeComposer at the click position to add a new memory.
- **Drag** a node → reposition (Memory v1 = MANUAL position persisted to a new `position_x`, `position_y` column on `conduit_memory` OR a sidecar table; OR an auto-layout algorithm where positions are derived, not persisted. **Lock at plan time.** Recommended: auto-layout v1, persistence v2.)

### I3 — Composer pattern

A composer (chat or NodeComposer) is the only always-visible input on a
surface. It uses a glassmorphic pill shell, focuses on cmd+K or "/" or a
canvas-empty-space click. NEVER repeat composer affordances across a
surface — one composer per surface.

### I4 — Drawer for sensitive operations

PAT paste, secret entry, OAuth state confirmation — all in a right-slide
glassmorphic drawer with focused single-input UX. Drawer slides in 280 ms
ease-out, slides out 220 ms ease-in.

### I5 — Modal sparingly

Modals are reserved for true confirm-or-cancel moments (destructive
disconnect, archive-this-permanently, sign-out). Default to drawer or
popover over modal. Modals are glassmorphic.

### I6 — Page entrance (load motion)

When a surface mounts, primary clusters fade + translate in with a
staggered delay (200 ms → 260 ms → 320 ms → 380 ms). Reduced-motion
substitutes a single opacity fade.

---

## Audit — Current UI Violations (the rebuild punch list)

Generated by walking every `/app/*` surface. For each violation: file +
line, the offending pattern, why it violates, and structural-vs-quick
fix classification. **All violations target full rebuild against the new
language; quick fixes are landmark stops, not destinations.**

### Memory Desk (R17 Slice 1 — fresh)

| # | File:Line | Pattern | Why it violates | Effort |
|---|---|---|---|---|
| M-1 | `src/components/conduit/memory/MemorySection.tsx:78-85` | `<h2 className="memory-section-name">{title}</h2>` styled with `color: var(--dept)` | Dept-colored text headers (P1) | **Structural rebuild** — replaced entirely by node clusters on canvas |
| M-2 | `src/styles/memory-desk.css:258` | `.memory-card-actions { opacity: 0.4; }` (fades to 1.0 on hover) | Opacity-fade not hide-until-hover (P2) | Structural — replaced by `HoverReveal` + glassmorphic tooltip |
| M-3 | `src/components/conduit/memory/MemorySection.tsx:81-95` | `+ Add memory` button repeats in 10 sections (Global + 9 dept) | Repeated chrome (P3) | Structural — single NodeComposer on the canvas |
| M-4 | `src/components/conduit/memory/MemorySection.tsx:123-132` | Vertical flex card list (`flex-direction: column`) | List, not node-graph (P5) | Structural — full rebuild as `<Canvas>` + `<Node>` + `<Edge>` |
| M-5 | `src/components/conduit/memory/MemorySection.tsx:73-74` | Section eyebrow rendered with `color: var(--dept)` | Dept-colored text (P1) | Quick — but rolled into the canvas rebuild |

### Workspace dashboard (R15 redesign)

| # | File:Line | Pattern | Why it violates | Effort |
|---|---|---|---|---|
| W-1 | `src/components/conduit/praxis/PraxisTeamRoster.tsx:309-312` | Employee name `style={{ color: var(--dept) }}` | Dept-colored text identifier (P1) | Quick — strip color, keep icon as identity |
| W-2 | `PraxisTeamRoster.tsx:255-333` | No hover-reveal — cards show static content always | Hide-until-hover (P2) | Structural — add HoverReveal overlay layer |
| W-3 | Workspace overall layout | Welcome hero + live strip + KPI 4-tile + team roster all visible at full opacity | Density vs negative space (P3) | Design — clusters with massive negative space; possibly hide live-strip below the fold |

### Sidebar (primary chrome)

| # | File:Line | Pattern | Why it violates | Effort |
|---|---|---|---|---|
| S-1 | `src/components/conduit/Sidebar.tsx:172-250` | Team list expands inline showing 9 employees with text labels | Sidebar density (P3) | Structural — collapse to single Team icon; the 9 employees live on Workspace |
| S-2 | `Sidebar.tsx:135-145` | Always-visible "+ New chat" button at the top of nav | Hide-until-hover (P2) | Quick — hide; bind to cmd+K |
| S-3 | `Sidebar.tsx` (general) | Sidebar is always expanded; no collapsible mode | Quiet chrome (P3) | Structural — collapse to icon-default, hover/pin to expand |
| S-4 | `Sidebar.tsx:172-244` | Each team-list row uses a dept-tinted icon chip + employee name in `--color-text` (good) but the active-indicator stripe + the chip color are heavy | Quiet chrome (P3) | Quick — simplify chip to icon-only, drop the active stripe |

### Settings (6-tab strip)

| # | File:Line | Pattern | Why it violates | Effort |
|---|---|---|---|---|
| SET-1 | `src/components/conduit/SettingsTabs.tsx:90-111` | 6 tabs: Profile / Business / Voice / Team / Usage / Billing | Pill-tab count (P3) | Structural — collapse to 3: Profile, Workspace, Plan & Usage |
| SET-2 | `SettingsTabs.tsx:471` (legacy reference) | `bg-white` hardcoded on toggle knob | Theme parity (P4) | Quick — use `var(--pdl-surface)` |

### EmployeeBadge / Avatar

| # | File:Line | Pattern | Why it violates | Effort |
|---|---|---|---|---|
| E-1 | `src/components/conduit/EmployeeBadge.tsx:93-96` | Employee name in `style={{ color: m.color }}` | Dept-colored text (P1) | Quick — strip the inline color |
| E-2 | `EmployeeBadge.tsx:40-78` | `variant="letter"` renders text-initial (M, S, E) | Letter-initial avatars (P1) | Quick — remove `letter` variant entirely |

### Modals / drawers (glassmorphism gap)

| # | File:Line | Pattern | Why it violates | Effort |
|---|---|---|---|---|
| G-1 | `src/components/conduit/OnboardingModal.tsx:63` | Full-screen opaque `bg-[var(--color-surface)]` | No glassmorphism (P2) | Structural — backdrop-blur + semi-transparent surface |
| G-2 | `src/components/conduit/PaywallModal.tsx:103-104` | `bg-black/70` backdrop + opaque card | Theme parity (P4) + no glassmorphism (P2) | Structural |
| G-3 | Chat composer overlay states | Opaque card | No glassmorphism (P2) | Structural |
| G-4 | Builds index Continue modal (`BuildsTabs.tsx`) | Opaque card on `bg-black/60` backdrop | Theme parity (P4) | Structural |

### Hardcoded color violations (theme parity)

| # | File:Line | Pattern | Why it violates | Effort |
|---|---|---|---|---|
| C-1 | `Sidebar.tsx:428` | `bg-black/60` for mobile overlay | Theme parity (P4) | Quick — `bg-[var(--pdl-canvas)]/85` token-aware |
| C-2 | `Chat.tsx:1153` | `bg-black/60` | Theme parity (P4) | Quick |
| C-3 | `VoiceRoom.tsx:280` | `bg-black/85 backdrop-blur-md text-white` (hardcoded white text) | Theme parity (P4) | Structural — VoiceRoom is intentionally dark in both themes; revisit design intent or token-ize |
| C-4 | Multiple components | Dept-colored buttons with `color: "#0A0908"` hardcoded ink-on-color | Light-theme contrast (P4) | Quick — `color: var(--pdl-ink-on-dept)` semantic token |

### Engineering build cinema (R16)

| # | File:Line | Pattern | Why it violates | Effort |
|---|---|---|---|---|
| B-1 | `src/components/conduit/builds/cinema/BuildHeader.tsx` | Abort + Close buttons always visible in header | Hide-until-hover (P2) | Structural — abort behind a single hover-reveal in the corner; close stays (it's the exit) |
| B-2 | `BuildCinema.tsx` overall | Three vertical stages = list, not canvas | Spatial-first (P5) | DESIGN REVIEW — build cinema is intentionally time-sequenced; may be acceptable. Confirm at plan time. |

### Connectors API spec (R17 Slice 2)

| # | File:Line | Pattern | Status | Effort |
|---|---|---|---|---|
| ✓ | `specs/memory-and-connectors/contracts/connectors-api.md:109` | `[GitHub octocat]` real mark in tile mockup | **ALIGNED** (P1) | None |
| CN-1 | `connectors-api.md §3.2` (drawer flow) | Drawer not yet implemented; spec calls for "focused drawer" but not glassmorphic | Tighten spec — drawer MUST be glassmorphic per the design language | Spec update during R17 Slice 2 plan |

### Aliased positive notes

- `EMPLOYEE_ICON` registry already provides semantic icons (Compass, Megaphone, TrendingUp, Code, Calculator, Shield, Users, Cog, Scale). **Aligned with P1.** Used as the basis for `DeptIcon`.
- Light theme infrastructure (`praxis-tokens.css:158-212`) provides a polished light palette. Aligned with P4; tokens migrate into the new `--pdl-*` namespace.
- R3 `ThemeBoot` + `ThemeToggle` provide OS-aware default + user override + persistence. **Aligned with P4.** Carried forward unchanged.

### The "black/white background split bug"

Cause identified at `src/app/app/layout.tsx:75, 92`: sidebar uses
`bg-[var(--color-surface)]` (one tier) while main uses `conduit-canvas`
(a radial gradient with a different base). Under specific theme + viewport
combinations the vertical seam between sidebar and main appears as a
hard split.

**Fix path**: under the new language, the AppShell uses `--pdl-canvas`
for the whole shell; the sidebar uses `--pdl-surface` (subtle lift); the
canvas area can layer the dot-grid on top of `--pdl-canvas`. The dot-grid
creates the spatial feel; the surface differentiation is minimal (~2-3 %).
No more hard seam.

---

## Adoption plan — what gets rebuilt, in what order

This spec is the LAW for all future surfaces. Existing surfaces are
rebuilt against the language one at a time, each in its own short-lived
merge cycle. **Memory's node-canvas is first**, per the user's explicit
directive.

Rebuild order (proposed; locks at GATE 2):

1. **Foundations** — author `src/styles/praxis-design-language.css` with all tokens (light + dark); land Geist Sans (replace Inter); ship `src/components/conduit/pdl/*` primitives (BrandChip, DeptIcon, Avatar, HoverReveal, Tooltip, Popover, Drawer, Modal, Canvas, Node, Edge, Sidebar, PillTabBar, KpiTile). No surface change yet.
2. **Brand-mark library** — vendor canonical SVGs for GitHub octocat, Gmail mark, Stripe S, Google Drive, Supabase, Slack, Vercel (+ a few more). Check into `src/components/conduit/brand-marks/`. Used by BrandChip.
3. **Sidebar rebuild** — collapse to icon-default; remove inline team list; remove always-visible "+ New chat" CTA; ship under new language.
4. **Memory canvas v1** — the unforgettable moment. Replace the dossier with a node-graph on a dotted-grid canvas. Auto-layout v1 (positions derived, not persisted). Hover-reveal tooltip with affordances. Single NodeComposer for adds. This becomes the proof-point that the language works.
5. **Settings rebuild** — 6 tabs → 3 pill tabs. Glassmorphic surfaces. Drawer for sensitive flows.
6. **Workspace rebuild** — KPI tiles → canvas-on-grid composition; team roster with `DeptIcon` only (no dept-colored names); LiveStrip refined; massive negative space.
7. **Chat rebuild** — composer pill becomes glassmorphic; sidebar of recent chats reduced; employee identification via DeptIcon only.
8. **Connectors surface (R17 Slice 2)** — built natively in the new language from day one. BrandChip is the load-bearing primitive.
9. **Build cinema review** — design review to confirm whether time-sequenced (current) survives or whether the cinema gets a spatial-canvas treatment. Likely keep current shape, polish to use new tokens.
10. **Modal/drawer retrofit** — OnboardingModal, PaywallModal, Continue modal etc. get glassmorphic treatment.
11. **Voice room review** — currently intentionally dark in both themes; revisit whether that's still right under the new language.

Each step ships as its own merge with a session report. The first major
checkpoint (after step 4) is the user actually using the Memory canvas
and validating the language end-to-end.

---

## Out of Scope (this round)

- A storybook / component playground site. (Future.)
- Visual regression testing infrastructure. (Future.)
- A custom icon set. (We're using Lucide + brand-mark SVGs.)
- Marketing-site (Conduit AI at `/`) — separate brand, unchanged. The design language is `/app/*` only (Constitution Principle IV).
- Pan / zoom on the Memory canvas. v1 is a fixed viewport; pan/zoom is v2 if it's useful.
- Multi-user / shared canvas semantics. Single-owner today.
- Animation library adoption (framer-motion, etc.). CSS-only motion, consistent with R15/R16.
- Sound design / haptics. None for v1.

---

## Constitution gate (informal — formal pass/fail at GATE 2)

The new design language must coexist with the repo constitution at
`.specify/memory/constitution.md` v1.0.0. Per-principle status:

- **Principle 0 (Domain Truth)**: PASS. No new domain content; the 9-employee roster carries forward, employee identities are semantic icons sourced from the locked registry. No invented brand claims.
- **Principle I (Next.js 16)**: PASS for the spec. Plan-time will confirm that the canvas + node-graph primitives don't depend on framework patterns that break on 16.2.2 (e.g., View Transitions, Server Actions). They don't — pure client components.
- **Principle II (Schema)**: PASS-with-flag. The Memory canvas may need optional `position_x`, `position_y` columns on `conduit_memory` IF we go with persisted positions (vs auto-layout). Both options are `conduit_*`-namespaced + RLS-inheritable. Lock at plan time.
- **Principle III (Brand Integrity & Provider Concealment)**: PASS. The new BrandChip vocabulary applies to USER's external systems (GitHub, Gmail, Stripe, etc.) — NOT AI-model providers (Claude/Anthropic/OpenAI/ElevenLabs/LiveKit), which remain concealed per the existing rule. The design language EXPLICITLY allows third-party brand marks for connectors and forbids them for AI providers. The "Praxis" wordmark vs "Conduit AI" wordmark split at the brand boundary is preserved.
- **Principle IV (Dual-Brand Single-Deploy)**: PASS. The design language is scoped to `/app/*` via `.praxis-root`. Marketing site (`/`) is untouched. Zero marketing imports introduced. `src/proxy.ts` untouched.
- **Principle V (Verification by Preview + Mobile Sweep)**: PASS. Both-theme parity is a P4 principle of THIS language. Mobile (375 + 390) + light + dark + reduced-motion sweep is part of every rebuild step. Each rebuild step is a material milestone → session report.
- **Principle VI (Push-to-Main)**: PASS. Each rebuild step ships as one merge. No long branches. Foundations + each surface = one fast-merge cycle.

The design language EXTENDS the constitution — it does not replace it.
Where they could conflict (e.g., theme parity vs "primarily dark" framing
in older session reports), the new language wins as the more recent and
more explicit rule.

---

## GATE 1 Status

**Status**: Awaiting approval. No plan, no tasks, no code until Luis
approves the spec (or returns feedback for revision).

### For Luis to confirm before GATE 1 close

1. **Body sans switch — Inter → Geist Sans**. The frontend-design skill explicitly forbids Inter; Geist is the cleanest replacement. Accept the swap, or push back with an alternative (General Sans, IBM Plex Sans, Untitled Sans)?
2. **Mono pairing** — Geist Mono (cohesive with Geist Sans) or keep JetBrains Mono?
3. **Memory canvas positioning** — auto-layout v1 (positions derived from clustering) vs. persisted positions (`position_x`, `position_y` columns on `conduit_memory`, drag-to-save). Recommend auto-layout v1, persistence v2.
4. **Sidebar collapse depth** — icon-default (56 px) is the spec lean. Confirm vs. always-expanded (200 px) per current state.
5. **Settings tab consolidation 6 → 3** — proposed groups: "Profile" (profile + business), "Workspace" (voice + team), "Plan & Usage" (usage + billing). Accept the grouping?
6. **Build cinema treatment** — keep time-sequenced 3-stage (current) or rebuild as spatial canvas? My read: keep current; just retune tokens.
7. **Voice room treatment** — keep "intentionally dark in both themes" (current) or align fully with the new language (light + dark equal)?
8. **Brand-mark scope for v1** — start with GitHub + Gmail only (matches R17 Slice 2 + likely Slice 3); add Drive / Stripe / Supabase / Slack as they're requested? Or vendor the full top-10 up front?
9. **Naming of the language** — "Praxis Design Language" (long), "Praxis DL" (short), "Operator OS" (concept-leaning)? Token prefix `--pdl-*` is the spec lean.
10. **Scope of the first canvas rebuild (Memory v1)** — match current feature set exactly (just visual) or also fold in any deferred Memory features (P2 bulk import, P3 source-attribution)? Recommend match-current-only for the language proof-point.
