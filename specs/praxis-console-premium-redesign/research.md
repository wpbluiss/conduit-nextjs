# Phase 0 — Research: Praxis Console Premium Redesign

Open decisions the spec deferred to plan time. Each entry records:
**Decision · Rationale · Alternatives Rejected · Source/Citation.**

---

## R-001: View Transitions API vs FLIP for shared-color page continuity

**Spec hook**: FR-056 — "Page-transition continuity between the dashboard
team card and the destination team page MUST use a shared-color FLIP-style
transition over 300–360ms."

**Decision**: Use the **CSS-only View Transitions API** (`view-transition-name`
on the source card and on the destination header band, paired with
`document.startViewTransition()` in a thin `"use client"` wrapper). Fall back
to a plain no-transition navigation under (a) browsers without
`document.startViewTransition` (Firefox ESR, older Safari) and (b) when
`prefers-reduced-motion: reduce` is set. No FLIP polyfill, no JS animation
library.

**Rationale**:
1. The two surfaces that need to share color (`/app/workspace` team card →
   `/app/team/[employee]` header band) are *different routes* under the same
   App Router segment. The View Transitions API was designed for exactly this
   shape: pair source and destination DOM nodes with the same
   `view-transition-name` and the browser interpolates the geometry +
   color cross-fade in compositor.
2. Next.js 16 added experimental `viewTransition` config support
   (`experimental.viewTransition: true` in `next.config.ts`) but this plan
   does NOT enable it. The redesign uses the *browser* API directly inside
   a client-side `useRouter().push()` wrapper because we only need
   transitions on a small, named set of links (team-card → team-page).
   Enabling the experimental Next config flag is a sledgehammer for this
   nail and would affect every cross-route navigation, including ones
   (settings, billing, auth) where we explicitly do not want a transition.
3. CSS-only avoids the JS animation library prohibition (spec Assumption 7).

**Alternatives rejected**:
- *Framer Motion `LayoutGroup` / shared layout*. Framer is installed
  (marketing site uses it) but is forbidden in `/app/*` per spec Assumption 7
  and the existing console convention (zero `framer-motion` imports under
  `src/components/conduit/`). Adopting it here would break the convention
  and reintroduce a runtime cost we currently don't pay.
- *FLIP via `getBoundingClientRect()` + manual `requestAnimationFrame`*.
  Works in every browser but is ~80 lines of fiddly JS per call site,
  doesn't interpolate background-color cleanly, and competes with React 19
  concurrent rendering for the same frame. Rejected as not worth the
  surface area.
- *Next.js `experimental.viewTransition` config flag*. Rejected per (2)
  above — too broad, affects unrelated routes.

**Source/Citation**: Spec FR-056, FR-058 (CSS-only), Assumption 7.
W3C View Transitions API spec for browser-side semantics. Next.js 16.2.2
release notes for `experimental.viewTransition` availability.

> **Note on Constitution Principle I**: `node_modules/` is not installed in
> this checkout, so I CANNOT cite specific `node_modules/next/dist/docs/`
> guides for the View Transition + App Router interaction. Before the
> plan moves to implementation, the implementer MUST run `npm install` and
> verify against `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/viewTransition.mdx`
> (path assumed; verify the actual path) that the documented behavior
> matches this plan's decision. If the docs disagree, fall back to the
> FLIP alternative per Constitution Principle I ("docs win over training
> data"). This is flagged in Constitution Check Gate I as a follow-up,
> not a blocker — the redesign's core does not depend on this transition;
> it is a polish moment.

---

## R-002: Polling cadence for team-activity refresh

**Spec hook**: FR-014 (streaming pulse upgrade), FR-015 (ship celebration),
FR-020 (time-since stamp cross-fade), and Story 1 AC-1 ("status row of
live pips under 'Your team' that pulse for any department with activity
in the last 24h").

**Decision**: Two-tier refresh strategy.

1. **Live signals (streaming, voice-active)**: piggyback on the existing
   `conduit:stream` `window` event already dispatched by `Chat.tsx`
   (`src/components/conduit/Sidebar.tsx:69–77`). The redesigned team grid
   subscribes to the same event for the dashboard's "currently streaming
   employee" indicator. No new polling; the dashboard updates instantly
   the moment any chat surface in any tab dispatches the event.
2. **Recent activity (last shipped artifact, last-active stamp, hot lead
   notification)**: a single client-side `useEffect` that re-fetches the
   dashboard's per-employee activity bundle every **60 seconds**, gated on
   `document.visibilityState === "visible"`. Fetch endpoint is a new
   thin `GET /api/conduit/team-activity` route handler that returns a
   small JSON payload (one row per dept: `last_active_at`,
   `last_artifact_title`, `last_artifact_at`, `in_flight_build_id`,
   `top_lead_score`). The dashboard server-renders the initial snapshot;
   the client overlay refreshes from this endpoint.

**Rationale**:
- 60s is the longest cadence at which the "last 3m ago" → "4m ago"
  cross-fade per FR-020 reads as *alive* without being expensive.
- `visibilityState` gating prevents background tabs from racking up DB
  reads while the user is elsewhere.
- A new GET route is cheaper than re-running the full dashboard's
  `Promise.all` (which today fans out to 6 queries) every minute on the
  server, because the cached server payload already has 90% of what we
  need at first paint.
- Reusing the existing `conduit:stream` `CustomEvent` is *literally
  free* — the dashboard tab is its own React tree but `window` is shared.

**Alternatives rejected**:
- *Supabase Realtime subscription*. The console doesn't currently use
  Realtime; adopting it just for the team-activity refresh would (a)
  add a WS connection on every dashboard load and (b) introduce a new
  failure mode (WS dropouts) for a cosmetic feature. Rejected as
  premature.
- *Server-Sent Events from a new `/api/conduit/team-activity/stream`
  route handler*. Cleaner than polling but increases server-side
  long-lived-connection count for the same cosmetic gain. Rejected for
  parity-of-reach with polling.
- *Re-`router.refresh()` every 60s on the dashboard page*. Would
  re-render *the entire page* every minute, which would also re-fire
  every per-employee Supabase query — heavy. Rejected.

**Source/Citation**: `src/components/conduit/Sidebar.tsx:69–77`
(`conduit:stream` event), `src/app/app/workspace/page.tsx:59–102`
(current dashboard Promise.all shape).

---

## R-003: Color value calibration for dept tints, washes, glows

**Spec hook**: FR-010 (4–10% canvas wash), FR-022 (layered card shadow
with dept glow), FR-023 (top-edge gradient indicator), FR-024 (radial
dept tint on team cards), FR-047 (named tint utility tokens).

**Decision**: Three locked tint levels per dept, derived programmatically
from the existing `--color-dept-{name}` HEX/oklch tokens via CSS
`color-mix()`:

| Token | Formula | Use |
|---|---|---|
| `--tint-{dept}-wash` | `color-mix(in srgb, var(--color-dept-{dept}) 5%, var(--color-surface) 95%)` | Canvas backdrop wash (dashboard hover, chat per-turn) |
| `--tint-{dept}-wash-strong` | `color-mix(in srgb, var(--color-dept-{dept}) 9%, var(--color-surface) 91%)` | Canvas backdrop for pinned-in-chat employee |
| `--tint-{dept}-glow` | `var(--color-dept-{dept})` at 14% alpha via `color-mix(in srgb, ... 14%, transparent)` | Outer hover-shadow on card |
| `--tint-{dept}-edge` | `color-mix(in srgb, var(--color-dept-{dept}) 35%, transparent)` | Top-edge gradient indicator + focused composer ring |
| `--tint-{dept}-radial` | `radial-gradient(120% 80% at 100% 100%, color-mix(in srgb, var(--color-dept-{dept}) 8%, transparent), transparent 60%)` | Team card bottom-right radial signature |

These are **derived**, not hand-tuned per dept. The single derivation
formula scales across all 9 depts and both themes (dark Praxis, light
Praxis). The percentages were chosen by reading the existing
`employeePulse` keyframe's `22%` mix (`globals.css:362–369`) and the
existing `team-dot.ambient` keyframe's `25%` shadow (`globals.css:432`)
as the upper-bound for "comfortable presence" — the new tints sit
deliberately *below* those existing values because they apply to a
larger surface area (the canvas + the card body, not just a pip).

**Atlas exception** (per Edge Cases): Atlas's `--color-dept-jarvis` is
platinum (`#C8C5BD` dark / `#6B665C` light) — high-luminance, low-
chroma. Applying the wash formula to platinum produces a perceptually
warm-neutral wash that doesn't carry identity. **Atlas's wash falls
through to a neutral warm tone** (`color-mix(in srgb,
var(--color-text) 4%, var(--color-surface) 96%)`). The other 8 depts
use the formulaic value.

**Rationale**:
- `color-mix()` is shipping in every modern browser as of 2024 and
  already used in this codebase
  (`globals.css:173`, `globals.css:185`, etc.). Zero new browser
  surface adopted.
- Programmatic derivation means adding a 10th employee later is a
  one-line change (`--color-dept-{newdept}: ...`) — the tint engine
  picks it up automatically.
- Both themes work because the formulas reference theme-scoped tokens
  (`--color-surface` and `--color-text` resolve to dark or light per
  `praxis-tokens.css` theme switch).

**Alternatives rejected**:
- *Hand-tune each dept × tint × theme combination*. 9 × 5 × 2 = 90
  values to maintain. Brittle; drifts. Rejected.
- *Use the existing `*-soft` (14% alpha) tokens for the wash*. They
  are too opaque for the canvas-scale application; the surface stops
  reading as the canvas and starts reading as a colored sheet.
- *Compute tints in JS at render time*. CSS handles it; no JS needed.

**Source/Citation**: Existing `--color-dept-*` tokens in
`src/styles/praxis-tokens.css:70–87` (dark) and `:195–212` (light);
existing `color-mix()` usage in `src/app/globals.css:362–369`.

---

## R-004: Light-theme parity strategy

**Spec hook**: Edge Cases ("Light theme (Praxis). The token system
already supports a light variant via `html[data-praxis-theme="light"]`.
The redesign must hold in both"); Story 4 AC-2; Assumption 4.

**Decision**: Both themes ship together, not phased. The light theme
"works for free" via the existing `praxis-tokens.css` overrides for
`--color-surface`, `--color-text`, etc. (already in place at
`src/styles/praxis-tokens.css:158–234`). The redesign adds **no
per-theme component overrides** — every redesigned primitive consumes
the same token names; the tokens flip per theme; the components flip
with them.

The one thing that needs explicit per-theme treatment:

- **Shadow values**. Dark theme uses heavy outer shadows with low
  black (`0 16px 48px rgba(0,0,0,0.4)`). Light theme cannot use heavy
  black shadows (they pollute the warm bone canvas with cold gray
  smudges). Light-theme shadow tokens use a tinted ink shadow
  (`rgba(20, 16, 31, 0.08)` from the existing light-theme card hover
  at `praxis-tokens.css:248–253`).

Both themes' shadow tokens are defined in the new `praxis-system.css`
sheet under `.praxis-root` (dark, default) and
`html[data-praxis-theme="light"] .praxis-root` (light) — mirroring the
existing token-override pattern.

**Rationale**: Themability is a contract this redesign upholds, not
extends. The existing pattern works; the redesign rides it.

**Alternatives rejected**:
- *Dark-only redesign now, light-theme retrofit later*. Spec
  Assumption 4 explicitly forbids this; we'd accumulate per-component
  overrides during the retrofit that would be hard to unwind.

**Source/Citation**: `src/styles/praxis-tokens.css:158–262`
(existing light-theme overrides + canvas radial + card hover); spec
Assumption 4.

---

## R-005: Tint-engine state: server-render vs client-render

**Spec hook**: FR-010 (canvas wash keyed to active employee), FR-029
(pinned-employee persistent wash), FR-030 (streaming-employee transient
wash).

**Decision**: **Client-side `data-dept` attribute on `.praxis-root`**,
flipped by a single React context provider mounted at the layout level
(`src/app/app/layout.tsx`). The provider's state machine:

1. **Default** (no activity, no hover, no pin, no stream): no `data-dept`
   attribute → canvas reads as base surface, no tint.
2. **Dashboard mode** (current route is `/app/workspace`): `data-dept`
   reflects either (a) hovered team-card dept (transient) or (b)
   most-recently-active dept (steady-state from server-rendered initial
   snapshot, refreshed by R-002 polling).
3. **Chat mode** (current route is `/app`): `data-dept` reflects (a)
   currently-streaming employee (transient, set on `conduit:stream`
   window event), or (b) currently-pinned employee from the composer
   dropdown (persistent), in that priority order.
4. **Team-page mode** (current route is `/app/team/[employee]`):
   `data-dept` is fixed to the route's employee for the duration of the
   page.

The provider exposes a `useDeptTint()` hook for components that need
to flip canvas state imperatively (the team card on hover, the chat
composer on pin change).

CSS handles the visual application:
```css
.praxis-canvas-tint[data-dept="marketing"] {
  background: var(--tint-marketing-wash) ...;
}
```
One selector per dept, ~9 rules. No JS-driven color animation; the
240ms in / 480ms out crossfade is a CSS `transition: background 240ms ease-out-quart;` on the canvas element.

**Rationale**:
- A single attribute on a single ancestor element is the smallest possible
  change surface. Adding/removing a 10th dept later is one CSS rule + zero
  React changes.
- Server-rendered initial state matches what the user sees on first paint
  (no FOUC of "uniform purple" → "tinted").
- The provider is **inside** `src/app/app/layout.tsx` so it never reaches
  marketing routes (Principle IV).

**Alternatives rejected**:
- *Per-page `useEffect` writing inline `style` on `<body>`*. Scattered
  state across N page files; bug-prone.
- *Server component conditionally rendering different canvas classes
  per route*. Cannot react to client-only state (hover, stream).
- *Compute wash color in JS and animate via `requestAnimationFrame`*.
  CSS transitions handle it for free.

**Source/Citation**: Existing layout shell at `src/app/app/layout.tsx:69–93`
(the `.praxis-root` wrapper is already the natural mount point); existing
`conduit:stream` `window` event pattern (`src/components/conduit/Sidebar.tsx:69–77`).

---

## R-006: Coexistence with the existing `conduit-card` primitive

**Spec hook**: Out-of-scope section ("Sidebar full redesign — only the
status pip system [FR-034] and active-route indicator [FR-035] update
in this round"); FR-049 (new primitives `.praxis-card-*`).

**Decision**: The redesign introduces a **new family** of primitives
prefixed `.praxis-*`, leaves the existing `.conduit-card` /
`.conduit-suggestion` / `.conduit-pill-input` / etc. **untouched** for
the surfaces that are out of scope (sidebar, settings, voice room,
artifacts, builds, analytics, paywall, onboarding). The two families
coexist in the same dark-Praxis canvas for the duration of the rollout.

A future pass adopts the `.praxis-*` family across the remaining
surfaces; until then, the visual diff between a redesigned surface and a
not-yet-touched surface is acceptable and intentional — it is the
incremental delivery shape.

**Migration order** (informational; lives in `tasks.md`):
1. P1 — dashboard + team grid + team-page header (`praxis-card-kpi`,
   `praxis-card-team`, `praxis-card-stat`).
2. P2 — chat shell (`praxis-composer-pill`, `praxis-bubble-*`).
3. Follow-on rounds — sidebar, settings, voice, etc.

**Rationale**: A simultaneous full-console redesign is a 3-week
implementation that ships nothing usable in week 1. The phased
strategy ships P1 visible to the user in ~3 days. The two families
sitting side-by-side for a round of work is a small price for the
delivery cadence.

**Alternatives rejected**:
- *Edit `.conduit-card` in-place to become the new primitive*. Every
  out-of-scope surface (sidebar lists, settings cards, voice rail, etc.)
  immediately gets the new look without being designed for it — risk of
  unintended regressions across surfaces that haven't been verified per
  Principle V. Rejected as too broad.
- *Ship the redesign behind a feature flag and dark-launch the new
  primitives*. Adds infrastructure (a flag system) the codebase doesn't
  currently have. Rejected as out of scope.

**Source/Citation**: Out-of-Scope section in spec; existing
`.conduit-card` definition in `src/app/globals.css:854–891`.

---

## R-007: Pulse cadence implementation — CSS variable, single keyframe

**Spec hook**: FR-013 (locked role-typed pulse cadences), FR-054
(named `--rhythm-*` tokens), GATE 1 approval ("cadences feel right —
lock them").

**Decision**: One `@keyframes praxis-pulse` definition, applied
per-component with an `animation-duration` driven by the dept's
`--rhythm-{dept}` CSS variable. The 9 rhythm tokens are defined once in
`praxis-tokens.css`, scoped to `.praxis-root`, with a mobile multiplier
applied via `@media (max-width: 640px)`.

```css
:root {
  --rhythm-jarvis: 4s;
  --rhythm-marketing: 3s;
  --rhythm-sales: 2.5s;
  --rhythm-engineering: 2s;
  --rhythm-finance: 5s;
  --rhythm-compliance: 6s;
  --rhythm-hr: 3.5s;
  --rhythm-ops: 3s;
  --rhythm-legal: 5s;
}
@media (max-width: 640px) {
  :root {
    --rhythm-jarvis: 4.8s;
    /* ... 1.2× multiplier on the rest ... */
  }
}
.praxis-pulse[data-dept="marketing"] {
  animation: praxis-pulse var(--rhythm-marketing) ease-in-out infinite;
}
```

**Rationale**: One keyframe, nine selectors, two `@media` blocks. No
component code changes when cadences are tuned post-ship — edit the
`--rhythm-*` value and every consumer updates.

**Alternatives rejected**:
- *Nine separate keyframe definitions*. Pure duplication; tuning one
  cadence means re-deriving the keyframe percentages.
- *JS-driven via `requestAnimationFrame`*. Forbidden per FR-058.

**Source/Citation**: Spec FR-013, FR-054, FR-055.

---

## R-008: Ship-celebration trigger — server-source vs client-snapshot

**Spec hook**: FR-015 (ship celebration only when row created within
session window; "no faking retroactive aliveness — per Principle Zero").

**Decision**: The dashboard records a `session-mounted-at` timestamp in
React state on mount. The team-activity polling endpoint (R-002) returns,
per dept, a `last_artifact_created_at` and `last_build_created_at`. The
client compares: if a new value is **strictly greater than** the last
seen value **and** that value is **strictly greater than**
`session-mounted-at`, fire `praxis-ship-celebration` once on that card.
The "last seen" cache lives in client state so subsequent polls don't
re-fire.

This satisfies Principle Zero: we celebrate only ships that occur
while the operator is watching. We never replay shipped artifacts the
user might have missed.

**Rationale**: Client-side comparison; no schema change; no server
state.

**Alternatives rejected**:
- *Server flag "fresh since mount"*. Requires the server to know the
  client's session-mount timestamp; round-tripping the timestamp into
  every poll is the same data with extra hops.
- *Always celebrate on first observation per session*. Would fire on
  every dashboard reload for the most recent ship even if it shipped a
  week ago — fabricates aliveness. Rejected per Principle Zero.

**Source/Citation**: Spec FR-015, Story 5 AC-2, Constitution Principle Zero.

---

## R-009: Hero copy ladder — how Atlas's voice surfaces without fabrication

**Spec hook**: FR-001 (hero varies by time of day, recent memory, and
24h event), SC-008 (4 distinct copy variants, none fabricated), SC-012
(>72h inactivity gets a "what happened while you were away" recap).

**Decision**: A small **copy ladder** evaluated server-side at dashboard
render. Inputs: `time-of-day bucket` (morning/afternoon/evening/late),
`hours-since-last-visit`, `highest-priority recent event` (one of:
shipped-build, scored-hot-lead, atlas-memory-pinned,
prior-conversation, none). Output: a single `(eyebrow, headline,
sub-line)` tuple. Total ladder size: ~32 variants; each variant a
template string where {placeholders} are filled from real data
(employee name, artifact title, etc.). Stored as a pure module:

```
src/lib/conduit/welcome-copy.ts
  → composeWelcomeCopy({ firstName, hoursSinceLastVisit,
                          timeOfDay, primaryEvent }): WelcomeCopy
```

Every variant is statically auditable in one file. Every placeholder
maps to a real field on a real row. No LLM call generates the copy —
this is deterministic templating to honor Principle Zero.

**Rationale**: A 32-variant deterministic ladder is auditable; an
LLM-generated headline is not. The "personality" the user wants
("Welcome back, Luis. Marketing finished the 3-post draft.") comes
from real data + templating, not from a model.

**Alternatives rejected**:
- *LLM-generated welcome line at render time*. Risks Principle Zero
  ("Marketing finished a 5-post draft" when only 3 shipped). Cost +
  latency on every dashboard render. Rejected.
- *Single static headline*. Loses the thesis ("the team is doing real
  work"). Rejected.

**Source/Citation**: Spec FR-001, SC-008, SC-012, Constitution
Principle Zero.

---

## R-010: Reduced-motion fallback — per-primitive policy

**Spec hook**: FR-057 (per-primitive reduced-motion policy table),
FR-059 (single `useReducedMotion` hook for JS-side gating).

**Decision**: Two layers.

1. **CSS layer**: every `@keyframes` definition introduced by this
   redesign is *gated by* `@media not (prefers-reduced-motion: reduce)`
   wrappers in `praxis-system.css`. Under reduced motion, the keyframe
   does not fire; the rest state is the visible state. No JS needed.
2. **JS layer**: the page-transition continuity (R-001), the ship-
   celebration trigger (R-008), and the canvas-tint provider (R-005)
   all consult a single shared hook
   `src/hooks/useReducedMotion.ts` that wraps
   `matchMedia('(prefers-reduced-motion: reduce)')`. The hook
   subscribes to changes so toggling the OS preference mid-session
   takes effect without a reload.

**Rationale**: Centralizing the matchMedia subscription in one hook
honors FR-059 and prevents the existing scatter of inline
`window.matchMedia(...)` calls from spreading further.

**Source/Citation**: Spec FR-057, FR-059. Existing CSS pattern at
`src/app/globals.css:282–286` (reduced-motion wraps `.word-in`,
`.underline-draw`, `.node-pulse`).

---

## R-011: `node_modules` is not installed in this checkout — Principle I follow-up

**Spec hook**: Constitution Principle I ("read the relevant guide in
`node_modules/next/dist/docs/`").

**Status**: The checkout used to author this plan does **not** have
`node_modules/` installed. I could not read Next.js 16 docs directly.
Three plan decisions touch Next.js framework surfaces:

- R-001 (View Transitions API + experimental `viewTransition` config)
- R-002 (a new GET route handler at `/api/conduit/team-activity`)
- R-005 (`"use client"` React context provider mounted in `src/app/app/layout.tsx`)

**Required follow-up before implementation**: the implementer MUST run
`npm install`, then read and reconcile this plan with the actual docs
at:

- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
  (confirm GET route handler shape for R-002)
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
  (confirm provider can mount in an async server layout via a
  `"use client"` child component — the pattern used elsewhere in this
  codebase)
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/`
  (confirm `experimental.viewTransition` availability and shape — or
  fall back to FLIP per R-001 if missing)

If any doc disagrees with this plan, the doc wins (Constitution
Principle I) and the affected research entry must be revised before
the corresponding tasks are written.

**Status flag**: documented here as an explicit pre-implementation
gate; not a Constitution Check fail (the Constitution Check passes
because the plan's framework footprint is minimal and pattern-aligned
with existing code), but a tracked follow-up.
