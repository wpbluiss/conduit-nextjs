# Feature Specification: Praxis Console — Premium Visual Redesign (R15)

**Feature Branch**: `feat/praxis-console-premium-redesign`

**Created**: 2026-05-22

**Status**: Draft — awaiting GATE 1

**Input**: "Premium visual redesign of the Praxis console UI in this repo — the
workspace, the 'Welcome back' dashboard, and the team/department grid. The
design thesis (this is the soul of it): Praxis is 'a cofounder in your pocket.'
The user talks to Atlas (chief of staff), who routes work down to a living team
of AI departments — Marketing, Sales, Engineering, Finance, Ops, etc. The UI
must feel like commanding a living workforce that does REAL work, not like
another chat app. This is a 2026 product that competes with ChatGPT and Claude
— the differentiator is presence: the team feels alive and accountable, the chat
box is just one surface. Current problems: it's good but FLAT, the layout feels
off, it's inconsistent (type/spacing/color not locked), and it doesn't feel
premium."

---

## Design Thesis (the soul of this redesign)

**Praxis is a cofounder in your pocket.** The user is a small-business operator
who's used to running everything themselves. They open the console and the
console makes them feel *less alone* — there is a team here. Atlas is in the
room. Marketing is in the next room over, working on something. Engineering
just shipped a build twenty minutes ago. The team is *present*, *named*, and
*doing real work* — not a faceless model behind a textarea.

Three visual commitments that flow from the thesis:

1. **Presence over polish.** Every surface communicates *who is here and what
   they're doing* before it communicates what *you* should type. A flat chat
   box loses to a living roster. The team is the hero; the composer is the
   service.
2. **Real work, surfaced.** Where ChatGPT shows "How can I help?", Praxis
   shows "Marketing drafted 3 posts this week. Engineering shipped a CRM
   build. Sales has 12 leads scored — Atlas thinks two are hot." Artifacts,
   pipelines, builds, and pinned decisions are the texture of the surface,
   not buried in sub-pages.
3. **One material, jewel-toned.** Today the console has nine jewel-tone
   employee colors but they live on a flat black-purple sheet that doesn't
   refract them. The redesign treats every surface as a *single material*
   that takes color from the employee currently in focus — purple wash when
   Atlas speaks, emerald when Sales, citrine when Finance. The room changes
   tint with whoever is in it.

**Anti-goals.** This is not a "make it sparkle" pass. No drop-shadows for
their own sake, no glassmorphism cliché, no marquee scrolling logos, no
gradient-text on body copy. Premium here means *fewer, heavier, deliberate*
moves — not more chrome.

---

## What exists today (grounding, not a plan — see plan.md later)

To prevent the redesign from drifting into generality, every requirement
below is written against the current implementation surface, audited
2026-05-22:

- **`/app` (Chat shell)** — `src/components/conduit/Chat.tsx` (1,284 LOC).
  EmptyState: small `live-dot` + eyebrow ("Your team is online · Luis"),
  serif H1 "What are we building today?" (`text-3xl md:text-5xl`),
  4-tile suggestion grid. Composer: `conduit-pill-input` pill with
  dept-pin avatar dropdown, textarea, mic toggle, circular send button.
  Stream presence line under composer: "Marketing is thinking…" in dept
  color. Bubbles: user is orange-tinted (`bubble-user`), assistant has
  a 2px dept-colored left border on `surface-elevated`.
- **`/app/workspace` (Welcome-back dashboard)** —
  `src/app/app/workspace/page.tsx`. Eyebrow with `live-dot` + plan name.
  Serif "Welcome back, {firstName}." (`text-4xl md:text-5xl`). Four KPI
  tiles (Atlas pinged you / Pipeline / Last conversation / Voice minutes
  today) using `conduit-card` with a 3px left dept stripe, `min-h-140px`.
  "Your team" section below: 9 small `conduit-card` cells in a 2/3/5-col
  responsive grid, each showing avatar + a *static* dept-colored 1.5px
  status dot (`opacity 0.85`) + name + role + last-active stamp.
- **`/app/team/[employee]`** — `src/app/app/team/[employee]/page.tsx`.
  Header band: `linear-gradient(135deg, colorSoft, transparent 60%)`,
  56px circular avatar, role eyebrow, serif H1, tagline, action cluster
  (VoiceModeButton, optional EngineeringBuildButton, "Talk to X" CTA).
  Body: Quick-start prompts, 3 stat tiles, recent activity feed. Right
  rail (`EmployeeRightRail.tsx`, 80-col): About / Recent context (memory
  + engineering sessions) / Quick actions.
- **Sidebar** — `src/components/conduit/Sidebar.tsx`. 256px column.
  PraxisLogo with `glow`, workspace name, "New chat", Workspace nav link,
  collapsible Team list of 9 employees (role icon chip + name + status
  pip + lock icon if tier-locked), Voice/Leads/Memory/Builds/Analytics
  links, Recent conversations (8 max), Settings/Billing/Sign-out footer.
- **Tokens** — `src/app/globals.css` (dark/marketing) and
  `src/styles/praxis-tokens.css` (scoped to `.praxis-root`).
  Dark canvas `#0A0815`, elevated `#131027`, raised `#1A152F`, border
  `#221C3A`. Accent = brand purple `oklch(50% 0.22 290)`. Nine employee
  jewel-tones already exist as `--color-dept-*` vars. Fonts: Fraunces
  (serif), Inter (sans), JetBrains Mono. Motion: `live-dot`,
  `employee-pulse`, `team-dot.ambient` (12s cycle, 4-slot stagger),
  `team-dot.streaming`, `typing-dot`, `presence-line`, `handoff-card`,
  `hero-fade-in`. Reduced-motion respected globally.

**Diagnosed flatness, layout, and consistency gaps (drives the requirements
below)**:

1. *Flat surface.* Cards are `1px #221C3A` borders on `#131027` fill with
   no depth, no specular, no inner highlight. Hover only swaps a border
   color. The "Your team" grid's status dots are *static* — the
   `team-dot.ambient` animation exists in CSS but isn't applied to the
   workspace dashboard grid (only the welcome-back team cards), so the
   roster reads as a static directory, not a living workforce.
2. *Layout off.* Welcome serif H1 is `5xl`, chat empty serif H1 is `5xl`,
   team page H1 is `4xl` — three different heroes on three sibling
   surfaces. Workspace is `max-w-5xl`, team is `max-w-4xl`, chat is
   `max-w-3xl` — three reading widths inside the same console chrome.
   The four KPI tiles share visual weight with the nine team cards
   beneath them despite being conceptually different (state-snapshots vs
   people), which makes the surface feel like a grid of grids.
3. *Inconsistent type + spacing.* Eyebrow tracking varies (`0.15em`,
   `0.18em`, `0.2em`). Card paddings vary (`p-4`, `p-5`, `px-3 py-2`,
   `px-4 py-3`). Stat tiles use `text-2xl` serif; dashboard tiles use
   `text-3xl` serif. Border-stripe widths shift (3px on tiles, 2px on
   assistant bubble, 0.5px sidebar active indicator). No spacing step
   scale enforced; values are ad-hoc Tailwind utilities at each site.
4. *Doesn't feel premium.* Borders are uniform, no layered shadows on
   dark, no gradient borders for the focused/active department, no
   subtle gloss or grain. The nine jewel tones never *mix* into the
   surface — they only appear as 3px stripes and small dots. The
   surface texture stays the same regardless of who is speaking.
5. *Thesis missing.* The "cofounder" / "living workforce" promise is
   carried *only* in the streaming-presence line below the composer, and
   only after the user has sent a message. Before that, the team is
   nine logos in a grid. There is no ambient indication that work is
   happening — no department-currently-working badge, no "Atlas pinned
   this for you" callout, no shipped-build celebration, no "the room is
   tinted because Marketing has the floor."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — The Welcome-Back Dashboard becomes a Living Command Center (Priority: P1)

Luis opens `/app/workspace` after a few hours away. He should land on a
surface that *immediately* signals (a) what his team has been doing in his
absence, (b) what they think he should look at next, and (c) who is
currently working or idle — all without him having to read. The dashboard
should feel like walking onto an operating floor where every department's
status is legible at a glance, not like opening a project-management
sidebar.

**Why this priority**: This is the *first surface a returning user sees*
on every session entry. It is the single biggest carrier of the "living
workforce" thesis, and the highest-leverage place to fix the "flat /
doesn't feel premium" complaint. If only this story ships, the user
already has an MVP redesign — every other surface can adopt the same
system incrementally. Get this wrong and the rest of the system can't
recover the impression. Get it right and the rest can ride the wave.

**Independent Test**: Can be tested end-to-end by signing in as an
internal account with at least one prior conversation, one Atlas memory
note, one sales lead, and one voice session today; landing on
`/app/workspace` and confirming that (1) the surface tints with the
*last-active* employee's signature color rather than being uniformly
purple, (2) the team grid shows live activity pulses keyed to which
departments have moved in the last 24h, (3) the headline copy varies
with time of day and what Atlas wants to surface, and (4) the four KPI
tiles read as one row of *operations* visually distinct from the team
roster below them.

**Acceptance Scenarios**:

1. **Given** a returning operator with prior activity, **When** they land
   on `/app/workspace`, **Then** the page renders with: (a) a serif
   headline that names them by first name *and* the most recent
   employee-driven event ("Welcome back, Luis. Marketing finished the
   3-post draft."), (b) a subtle ambient tint on the canvas keyed to the
   employee with the most recent activity, (c) a status row of live pips
   under "Your team" that pulse for any department with activity in the
   last 24h.
2. **Given** the same operator on a fresh account with no activity,
   **When** they land on `/app/workspace`, **Then** the headline degrades
   gracefully ("Welcome, Luis. Your team is on standby."), the team grid
   shows a calm idle state (single-cycle ambient pulse, no per-dept
   activity claim), and the four KPI tiles surface *invitations* (e.g.
   "Tell Atlas about your business" replaces "Atlas pinged you") rather
   than empty zeroes.
3. **Given** an operator with a voice session live (rare), **When** they
   land on `/app/workspace`, **Then** a single high-priority "live now"
   strip appears above the headline with a continuous waveform-style
   pulse and a one-click "Rejoin" affordance, taking visual precedence
   over both the headline and the KPI row.
4. **Given** any state, **When** the operator hovers a department card,
   **Then** the whole canvas tint shifts toward that department's color
   over 240ms (subtle, not jarring — the room "leans" toward whoever
   they're considering), and the card lifts with a layered shadow that
   includes a faint dept-colored outer glow rather than just a border
   swap.
5. **Given** the operator's locale and tier, **When** the dashboard
   renders, **Then** every numeric stat in the four KPI tiles uses
   tabular-figure spacing so the digits don't dance between renders,
   and time-since stamps update with a soft cross-fade rather than a
   hard text-swap.

---

### User Story 2 — The Team/Department Grid becomes a Roster of People, not a Catalog of Logos (Priority: P1)

The "Your team" grid (currently 9 small uniform cards on the dashboard,
and a sidebar list) should communicate *who is real, who is currently
working, who has shipped recently, and who is locked behind tier*. It
should feel closer to a Slack sidebar's online-presence affordance — but
elevated and intentional, not borrowed — than to a faceless dept tile
grid. The roster should make the user *think of Atlas, Marketing, etc.
as colleagues* before they think of them as features.

**Why this priority**: The team is the product. The grid is where the
"living workforce" thesis either lands or doesn't. Today the grid is the
weakest part of the dashboard precisely because it's the most generic-
looking — 9 same-shape rectangles is the worst possible reading for "a
team of distinct specialists." Tied for P1 with Story 1 because Story 1
*relies* on the grid feeling alive to land its tint behavior.

**Independent Test**: Can be tested by viewing `/app/workspace` and
hovering through the 9 dept cards: each card must (a) show its own
ambient breathing rhythm tied to the dept's pulse rate (Atlas is calm
and steady, Engineering is faster bursts, Marketing is medium creative
sway — see FR-021 for the locked pulse curves), (b) reveal a one-line
"last shipped" / "last said" preview on hover that comes from real data
in `conduit_artifacts`, `conduit_messages`, or `conduit_engineering_sessions`,
(c) animate the dept color *through* the card on hover (a slow inward
wash, not a solid fill flash), and (d) for tier-locked departments,
render with a deliberate ghosted variant that reads as "not yet hired"
rather than "broken."

**Acceptance Scenarios**:

1. **Given** Sales has scored a new hot lead in the last hour, **When**
   the operator looks at the Sales card, **Then** the card shows a
   small pulsing emerald notification dot (distinct from the always-on
   ambient pulse) and the hover-preview reads "Just scored:
   {business_name} · {score}/100".
2. **Given** Engineering is mid-build (a `conduit_engineering_sessions`
   row in `running` or `deploying` status), **When** the operator
   looks at the Engineering card, **Then** the card carries an
   "in-flight" visual treatment — faster pulse rhythm, a subtle scanning
   line across the card surface (like a build progress indicator
   abstracted), and a "1 build in flight" sub-label that takes
   precedence over "last active" stamp.
3. **Given** Compliance is tier-locked for the user's plan, **When**
   the card renders, **Then** it appears with reduced saturation
   (~40% color, ~70% luminosity), a slim lock-glyph in the corner,
   and on hover *invites* the upgrade ("Hire Compliance — $X/mo") in
   the same tonal language as the active cards, not in a contrasting
   billing-page-feeling style.
4. **Given** the operator clicks any department card, **When** the
   navigation completes to `/app/team/[employee]`, **Then** the
   transition carries the dept color forward — the destination header
   band picks up where the source card's tint left off (a brief
   shared-element-style continuity, 300–360ms, ease-out-quart) — so
   the user feels they are walking *into* that department's room, not
   route-jumping.
5. **Given** an operator on mobile (375px), **When** the team grid
   renders, **Then** it collapses to 2 columns with adequate tap
   targets (min 44px), the pulse rhythm slows by 20% to reduce visual
   noise on a small screen, and the order is opinionated: Atlas first
   (always), then the operator's most-engaged department from the last
   7 days, then the rest in roster order.

---

### User Story 3 — The Chat Workspace Stops Being a Chat App, Becomes a Room (Priority: P2)

The `/app` empty chat surface today reads as a polished ChatGPT-clone:
serif headline, suggestion grid, pill composer. To carry the thesis it
must read as *a room where the team is already present and Atlas is
already at the table*. The composer demotes; Atlas's presence
promotes; the four suggestion tiles become *named-by-employee
provocations* rather than generic prompts. Once a conversation begins,
the room visually acknowledges *who has the floor*.

**Why this priority**: P2 not because chat is unimportant — it is the
single most-used surface — but because the *chat shell already works
fluently* (streaming, handoffs, voice, paywall) and the redesign cost is
mostly visual. The dashboard and team grid (P1) carry the thesis at
*surface level*; the chat surface (P2) carries it *in motion*. Both
matter; we ship visual hierarchy first because it's the harder change
to retrofit.

**Independent Test**: Can be tested by opening `/app` on a fresh
conversation and confirming: (1) the empty-state hero is *not* a
neutral "What are we building today?" — it names Atlas specifically and
shows him in a present, named pose ("Atlas is at the table.
{Department} just freed up. {Department} is mid-task."), (2) the
composer pill recedes — softer border, dropped shadow on focus only,
not a permanent visual anchor — so the *room*, not the input, is the
eye-catch, (3) once the user sends a message and an employee replies,
the entire canvas takes on a faint wash of that employee's color for
the duration of the turn (cleared on next user input or next handoff),
(4) handoff cards are upgraded from a horizontal slide-in to a
*shared-color baton-pass* — outgoing dept color fades to handed-to
dept color over 480ms.

**Acceptance Scenarios**:

1. **Given** an operator opens `/app` cold, **When** the empty state
   renders, **Then** the hero says "Atlas is at the table." (or a
   time-of-day variant), the four suggestion tiles are explicitly
   attributed to a department by avatar + dept name + the actual
   prompt, and Atlas's avatar appears once near the headline at a size
   that reads as "he's here" (28–32px, not the 22px micro-avatar
   currently in suggestions).
2. **Given** a streaming reply from Marketing, **When** the response
   is in flight, **Then** the canvas background takes on a 4–6% wash
   of Marketing's color, the streaming indicator under the composer
   intensifies ("Marketing is drafting…" with a 3-dot typing
   animation in Marketing's color), and on stream completion the
   wash fades to 0% over 600ms.
3. **Given** Atlas routes to Engineering mid-thread, **When** the
   handoff card appears, **Then** it animates as a baton-pass: the
   left edge is Atlas's platinum, the right edge becomes Engineering's
   electric blue over 480ms, with a small "Atlas → Engineering"
   eyebrow that mirrors the color transition.
4. **Given** the operator pins a specific employee from the composer
   dropdown, **When** they pin, **Then** the canvas takes a *persistent*
   ambient wash of that employee's color (slightly stronger than the
   per-turn wash, e.g. 8–10%) until they unpin or close the
   conversation — so pinning has a *room-level* consequence, not just
   a dropdown selection.
5. **Given** voice playback is active for an assistant reply, **When**
   the audio plays, **Then** the speaking employee's avatar in the
   message pulses in sync with the audio waveform (or a smoothed
   abstraction of it), and the "Stop voice" floating button picks up
   the speaking employee's dept color rather than a generic accent.

---

### User Story 4 — A Locked, Documented Design System Replaces Ad-Hoc Tailwind Utilities (Priority: P2)

The redesign must ship a *locked* design system — a small, documented
token set (color, spacing, type, radius, elevation, motion) plus a small
set of *named* primitives (the card, the tile, the stat, the eyebrow,
the dept badge, the canvas tint, the breathing pulse, the baton handoff)
that every surface uses. After this story, no surface should be
introducing one-off `text-[10px]` tracking values, `min-h-[140px]`
magic numbers, or `px-5 py-3` ad-hoc paddings outside the system. The
system itself is the deliverable; the dashboard and team grid (P1) and
chat (P2) are the first three consumers.

**Why this priority**: P2 not because it's optional — it is *the only
way the consistency complaint gets durably fixed* — but because in the
spec-toolkit flow this lands in implementation tasks rather than in
visual user-facing stories. Tied to Story 5 below; both are
system-level and can be developed in parallel with the surface stories.

**Independent Test**: Can be tested by reading the rendered surfaces
through the locked token tables (FR-040 through FR-052 below) and
confirming every value present on the dashboard, team grid, and chat
shell traces to a named token. A second test: a designer or developer
unfamiliar with the codebase can compose a *new* console surface using
only the published primitives and tokens, without needing to invent any
new values.

**Acceptance Scenarios**:

1. **Given** the locked token sheet is in place, **When** any console
   surface is grep'd for inline magic spacing (`px-[Np]`, `text-[Npx]`,
   `min-h-[Npx]`), **Then** zero hits remain on the redesigned surfaces
   (dashboard, team grid, chat); all spacing/typography reads from named
   utility classes or CSS custom properties.
2. **Given** the dashboard and team grid are rebuilt on the system,
   **When** the operator switches between dark and (future) light
   Praxis themes via the existing `ThemeBoot` mechanism, **Then** every
   color value on those surfaces flips correctly via the token layer
   with zero per-component overrides, and the redesign's visual logic
   holds in both themes.
3. **Given** a new department were to be added to the roster (per
   `EMPLOYEES` in `src/lib/conduit/employees.ts`, gated by Principle
   Zero — no inventing departments), **When** the team grid renders,
   **Then** that department picks up its tint, pulse rhythm, and card
   primitive automatically with no per-surface edits — the system is the
   integration point.

---

### User Story 5 — Motion + Aliveness Become a First-Class Layer (Priority: P3)

The redesign needs a small, *named*, *documented* motion vocabulary
that the team-as-living-workforce thesis rests on. Today motion is
sprinkled (`live-dot`, `team-dot.ambient`, `presence-line`, etc.) but
is neither catalogued nor consistently applied. This story spec's the
motion layer as a *single named system* the surfaces consume — pulse,
breath, wash, baton, ship-celebration, idle-drift — with locked
curves, durations, and reduced-motion fallbacks.

**Why this priority**: P3 because motion can land *after* the visual
system (P1, P2) is in place — but it is what tips the surface from
"premium static" to "alive." Without it, the redesign is a still
photograph of a team rather than a video of one.

**Independent Test**: Can be tested by enumerating each named motion
primitive (FR-053 through FR-060) and confirming on the redesigned
surfaces that (a) it is used where specified, (b) at the specified
curve and duration, (c) gracefully degrades under
`prefers-reduced-motion: reduce` to either a static state or a
single-frame fade.

**Acceptance Scenarios**:

1. **Given** the team grid is loaded, **When** the operator watches it
   for 30 seconds with no interaction, **Then** at least three distinct
   ambient micro-motions are visible (the dept pulse cycle, a slow
   gradient drift on the focused dept's accent color, and a periodic
   "someone said something" subtle flash on one randomly-chosen active
   dept), each at the cadences specified in FR-054.
2. **Given** Engineering ships a build (a `conduit_builds` row
   transitions to `live`), **When** the operator is on the dashboard,
   **Then** a one-shot "ship celebration" animation plays — a soft
   electric-blue flash that crests the Engineering card and a single
   pip travels along the canvas top edge — over 1.2s, then settles.
   This celebration does NOT fire if the user wasn't on the dashboard
   at the time (we don't fake retroactive aliveness).
3. **Given** `prefers-reduced-motion: reduce`, **When** any motion
   primitive would fire, **Then** the motion either resolves
   instantly to its end state (for content transitions) or is
   suppressed entirely (for ambient pulses, drifts, and washes), and
   no surface becomes unreadable or loses meaning.

---

### Edge Cases

- **Brand-new account with zero data.** The dashboard, team grid, and
  chat empty-state must each have a graceful "first-day" composition:
  the four KPI tiles surface invitations instead of zeros; the team
  grid pulses in a slow synchronised idle rhythm (no per-dept activity
  to dramatize); the chat hero reads "Atlas is at the table — tell him
  about your business." Constitution Principle Zero applies: copy
  must NOT fabricate prior activity.
- **Internal account with full roster.** All nine cards render; tint
  logic must handle Atlas-recent (platinum) without making the canvas
  feel washed-out (platinum is luminance, not chroma — the tint logic
  should fall through to a neutral warm tone for Atlas-recent).
- **Free tier with three employees allowed.** Locked employees still
  render in the grid (the team should *feel hireable*, not invisible),
  but in the ghosted variant with the "Hire {dept}" hover affordance.
- **Voice session live while operator is on the dashboard.** The "live
  now" strip takes top precedence and the rest of the dashboard mutes
  by ~15% opacity to draw the eye.
- **Streaming reply in progress when operator navigates from chat to
  dashboard.** The streaming employee's color should briefly tint the
  dashboard canvas (continuity); on stream completion, dashboard
  returns to last-active tint.
- **Mobile 375px.** The redesigned dashboard must not require horizontal
  scroll, the team grid collapses to 2 columns, headline shrinks one
  step in the scale, and ambient pulse rates slow by 20%.
- **Reduced motion.** Every ambient pulse, wash, drift, and baton
  animation MUST suppress under `prefers-reduced-motion: reduce`. The
  thesis must still land *visually* without motion (texture, color,
  type hierarchy do the work).
- **High contrast / forced colors mode.** Per WCAG, dept tints,
  shadows, and washes must degrade to system colors without losing
  identity affordances (the lock glyph, the live pip, the active-state
  indicator must remain legible).
- **Plan downgrade mid-session.** If a previously-allowed employee
  becomes locked while the operator is mid-conversation with them, the
  grid card should re-render to the ghosted variant within one minute
  (not the next reload), with a soft toast.
- **Light theme (Praxis).** The token system already supports a light
  variant via `html[data-praxis-theme="light"]`. The redesign must
  hold in both — light is *not* an afterthought; the dashboard hero,
  team grid, and chat shell each have first-class light comps.
- **An Atlas memory pinned to a department the user has never spoken
  to.** The dashboard's "Atlas pinged you" tile should surface it
  with the relevant department's tint, even if that department's
  activity stamp is null — so the surfacing of Atlas's *intent* is not
  blocked by missing per-dept activity.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Surface composition

- **FR-001**: `/app/workspace` MUST present a single primary hero block
  whose copy varies by (a) time of day, (b) presence of recent Atlas
  memory, and (c) the highest-priority event from the last 24h
  (shipped build > scored hot lead > Atlas memory > prior conversation
  > none).
- **FR-002**: The four KPI tiles ("Atlas pinged you," "Pipeline,"
  "Last conversation," "Voice minutes today") MUST be visually grouped
  as a single operational row, distinct in surface treatment from the
  team roster below. The grouping cue MUST NOT be a literal border or
  caption — it MUST be a difference in card material (e.g. KPI tiles
  on slightly elevated/warmer material, team cards on the base canvas
  with the dept-tint engine).
- **FR-003**: The "Your team" grid MUST render all nine employees from
  `EMPLOYEE_ORDER` (`src/lib/conduit/employees.ts`) in *every* tier
  state. Tier-locked employees render in the ghosted variant per
  FR-035. No employee may be conditionally hidden.
- **FR-004**: The team grid order MUST be: Atlas first, then the
  operator's most-engaged dept in the last 7 days (computed from
  `getLastActiveByEmployee` activity-merged signal), then the
  remaining departments in `EMPLOYEE_ORDER` sequence.
- **FR-005**: Each team card MUST surface (in priority order if space
  constrained): department name, role label, a one-line "current state"
  derived from real data (last shipped artifact title / last said /
  pipeline count / locked-CTA), an ambient pulse pip, and a
  tier-locked glyph if applicable.
- **FR-006**: A "live now" strip MUST render above the hero whenever
  any of the operator's `conduit_voice_sessions` has `ended_at IS NULL`,
  with a one-click "Rejoin" affordance and a continuous waveform pulse.
- **FR-007**: The team page header band (`/app/team/[employee]`) MUST
  visually continue from the source dashboard card the operator
  clicked: a shared-color continuity that picks up the source card's
  tint over 300–360ms on entry.
- **FR-008**: The chat empty state (`/app` with `messages.length === 0`)
  MUST replace the current "What are we building today?" headline with
  copy that names Atlas explicitly, and MUST display Atlas's avatar at
  28–32px adjacent to the headline.
- **FR-009**: The composer pill MUST be demoted visually — softer
  border on rest, dept-colored focus ring only when focused, no
  permanent drop-shadow — so that the empty-state hero and (later)
  the conversation outranks the input control as the primary visual
  weight.

#### Presence & ambient tint engine

- **FR-010**: The console canvas MUST support a "dept tint" engine: a
  low-opacity (4–10%) wash keyed to a single active employee at a
  time. On the dashboard, this is the most-recently-active employee or
  the employee whose card is hovered (transient). On chat, this is the
  pinned employee (persistent) or the employee currently streaming
  (transient).
- **FR-011**: Hover-tint transitions MUST use the locked
  `--praxis-ease-out-quart` curve at 240ms in, 480ms out — slower
  release so the room "settles back" gently when the operator
  un-hovers.
- **FR-012**: The dashboard hero MUST display an ambient breathing
  pulse keyed to overall team activity in the last hour (no activity:
  4s cycle, low activity: 3s cycle, high activity: 2s cycle); the
  breath is a 1–2px translate-y on the hero block, not a color change.
- **FR-013**: Each team card MUST display an ambient pulse pip whose
  cadence is *role-typed*: Atlas (4s, calm), Marketing (3s, creative
  medium), Sales (2.5s, conversational), Engineering (2s, faster
  build-cadence), Finance (5s, slow ledger), Compliance (6s, slowest,
  deliberate), HR (3.5s), Ops (3s), Legal (5s). These cadences MUST be
  locked tokens (FR-054) — not per-component magic numbers.
- **FR-014**: A team card MUST upgrade its pulse to "streaming" (per
  the existing `team-dot.streaming` keyframe semantics) whenever that
  employee's id matches the in-flight streaming employee (per the
  `conduit:stream` window event already dispatched by `Chat.tsx`).
- **FR-015**: A team card MUST upgrade its pulse to a one-shot
  "ship celebration" (1.2s flash + pip travel) whenever a
  `conduit_artifacts` or `conduit_builds` row created by that
  department is detected in the page's most recent activity poll
  *and* the row's `created_at` is within the operator's current
  session window (no faking retroactive aliveness — per Principle Zero
  and the Edge Cases section).

#### Type, spacing, color hierarchy

- **FR-016**: A single hero typography step MUST be used consistently
  across `/app/workspace`, `/app/team/[employee]`, and `/app` empty
  state. Proposed scale (locked at plan time): `text-display-1`
  (Fraunces, `clamp(2.25rem, 4vw + 0.5rem, 3.25rem)`, line-height
  1.05, letter-spacing -0.02em). No surface re-implements its own
  hero size.
- **FR-017**: Eyebrow microcopy ("ATLAS PINGED YOU", "YOUR TEAM",
  etc.) MUST use a single locked spec: Inter 11px, weight 500,
  letter-spacing `0.18em`, color `--color-text-muted`. No surface
  may override tracking or size.
- **FR-018**: Card padding MUST be one of three named tokens:
  `--space-card-sm` (12px), `--space-card-md` (20px),
  `--space-card-lg` (28px). The dashboard KPI tiles use `lg`; team
  cards use `md`; stat tiles inside team page use `sm`.
- **FR-019**: All numeric values displayed (counts, minutes, scores)
  MUST use `font-feature-settings: "tnum" 1` for tabular figures so
  digits do not reflow between renders.
- **FR-020**: All time-since stamps ("3m ago," "2h ago") MUST update
  with a 200ms cross-fade on value change, not a hard text-swap.
- **FR-021**: The four KPI tiles MUST share an internal layout grid
  (eyebrow row / display number or one-line snippet / footer chip),
  so they read as a row of *peers*. No tile may invent its own
  internal layout.

#### Card material & elevation

- **FR-022**: Cards MUST move from a flat `1px border on
  surface-elevated` material to a *layered* material: (a) base
  surface, (b) 1px inner highlight at 4% white on top edge for
  specular, (c) 1px outer border in `--color-border-soft`, (d) on
  hover, a layered shadow with a faint dept-colored outer glow
  (specifically: `0 0 0 1px dept@10%`, `0 8px 24px black@40%`,
  `0 0 32px dept@14%`).
- **FR-023**: The 3px left dept-stripe currently used on dashboard
  tiles MUST be replaced by a *gradient* dept indicator: a 1px
  top-edge line that fades from `dept` to `transparent` across the
  card width, paired with a 1px inner shadow at the top edge in
  `dept@8%`. The stripe metaphor is too 2010s; the new indicator
  reads as "this card has dept signal" without shouting.
- **FR-024**: Team cards MUST render with a *radial* dept tint at the
  card's bottom-right corner at very low opacity (3–5%), so each card
  carries its dept signature even at rest — without that signature
  dominating the surface.
- **FR-025**: All cards MUST share a single radius token
  (`--radius-card`, default 16px) and a single hover-lift translate
  token (`--lift-card`, default `translateY(-2px)`). No surface
  invents per-card radii or lifts.

#### Team identity & ghosted/locked states

- **FR-026**: The avatar component (`EmployeeAvatar`) MUST be
  visually upgraded from a static color-soft circle with an icon to
  a *materially distinct* chip: ringed (inset highlight), with a
  faint inner gradient from `dept` to `dept@0` toward the top edge
  (subtle gloss), and an optional outer dept-colored pulse ring
  when `active`. The icon set itself (lucide) stays.
- **FR-027**: Tier-locked employees MUST render in a "not yet hired"
  ghosted variant: ~40% chroma desaturation, ~70% luminance, a slim
  lock glyph in the top-right, and an "interview" affordance copy on
  hover that frames upgrading as *hiring this department* ("Hire
  Compliance"), not as a billing transaction. Tagline copy stays
  honest — no fictional outcomes.
- **FR-028**: Atlas MUST be visually distinguished from the eight
  departments — slightly larger avatar in roster contexts (28px vs
  24px), a "Chief of Staff" eyebrow that other cards don't get, and
  a permanent (vs hover-triggered) presence pip. He is the spine.

#### Chat-surface upgrades (P2)

- **FR-029**: When the operator pins a specific employee from the
  composer dropdown, the canvas MUST take a persistent ambient wash
  (8–10%) of that employee's color until unpinned or conversation
  closed.
- **FR-030**: During a streaming assistant reply, the canvas MUST
  take a transient wash (4–6%) of the streaming employee's color,
  fading to 0% over 600ms on stream complete.
- **FR-031**: Handoff cards (Atlas → Engineering, etc.) MUST animate
  as a baton-pass: the card's left edge starts in the outgoing
  employee's color and the right edge transitions to the incoming
  employee's color over 480ms. The "Atlas → Engineering" eyebrow
  shares the gradient.
- **FR-032**: During TTS playback of an assistant message, that
  message's employee avatar MUST pulse in sync with the audio
  amplitude (or a smoothed proxy if amplitude data is not available).
- **FR-033**: The "Stop voice" floating button MUST pick up the
  speaking employee's dept color instead of the generic accent.

#### Sidebar & continuity (out of scope for P1 but locked for consistency)

- **FR-034**: Sidebar Team list status pips MUST consume the same
  `team-dot.ambient` and `team-dot.streaming` system used by the
  dashboard team grid — single source of truth for "this employee
  is breathing / streaming."
- **FR-035**: The sidebar "active route" indicator (currently a 0.5px
  vertical stripe at the row's left edge) MUST be promoted to a
  1.5px gradient stripe that adopts the destination employee's color
  when on a team page, the accent color elsewhere.

#### System enforcement

- **FR-036**: No console surface (`/app/*`) may use one-off Tailwind
  arbitrary values (`text-[Npx]`, `min-h-[Npx]`, `px-[Np]`) after
  the redesign lands. Permitted exceptions MUST be documented in
  comments with rationale.
- **FR-037**: All color values on redesigned surfaces MUST trace to
  either (a) a `--color-*` token in `globals.css` `@theme`, (b) a
  `--color-praxis-*` token in `praxis-tokens.css`, or (c) a
  `--color-dept-*` token. No hex literals in component code.
- **FR-038**: All motion durations and curves MUST trace to one of
  the named motion tokens (FR-053).
- **FR-039**: A token-reference document MUST ship at
  `docs/praxis-design-system.md` listing every named token and
  primitive introduced by this redesign, with usage examples.

#### Locked token tables (proposed; subject to plan-time refinement)

- **FR-040**: Spacing scale — 8 steps:
  `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`,
  `--space-4: 16px`, `--space-5: 20px`, `--space-6: 24px`,
  `--space-8: 32px`, `--space-10: 40px`. No surface uses values
  outside this scale.
- **FR-041**: Card padding presets — `--space-card-sm: 12px`,
  `--space-card-md: 20px`, `--space-card-lg: 28px`. Locked.
- **FR-042**: Radii — `--radius-pill: 9999px`, `--radius-md: 8px`,
  `--radius-card: 16px`, `--radius-hero: 20px`. Locked.
- **FR-043**: Typography display scale (Fraunces, all line-height
  1.05, letter-spacing -0.02em, weight 400):
  `--text-display-1: clamp(2.25rem, 4vw + 0.5rem, 3.25rem)` (hero,
  shared across dashboard / team / chat-empty),
  `--text-display-2: clamp(1.75rem, 2.5vw + 0.5rem, 2.25rem)`
  (section heads within a page),
  `--text-display-3: 1.5rem` (in-card display number / metric).
- **FR-044**: Typography UI scale (Inter):
  `--text-eyebrow: 11px / 500 / 0.18em tracking`,
  `--text-microlabel: 10px / 500 / 0.15em tracking`,
  `--text-body-sm: 13px / 400 / -0.005em`,
  `--text-body: 15px / 400 / -0.005em`,
  `--text-body-lg: 17px / 400 / -0.005em`.
- **FR-045**: Numeric display MUST be `--text-display-3` in
  JetBrains Mono with `font-feature-settings: "tnum" 1`.
- **FR-046**: Elevation — three rest levels, three hover levels:
  `--elev-rest-1`, `--elev-rest-2`, `--elev-rest-3`,
  `--elev-hover-1`, `--elev-hover-2`, `--elev-hover-3`. Specific
  shadow stacks locked at plan time. Hover stacks include the
  dept-tinted outer glow per FR-022.
- **FR-047**: Dept tint utility — `--tint-{dept}-wash`
  (4% surface), `--tint-{dept}-wash-strong` (8%),
  `--tint-{dept}-glow` (14%, for outer-shadow hover). Generated for
  all nine departments.
- **FR-048**: Canvas tint utility — `.praxis-canvas-tint[data-dept]`
  applies the appropriate `--tint-{dept}-wash` to a radial gradient
  on the canvas backdrop.
- **FR-049**: Material primitives — `.praxis-card` (base material per
  FR-022), `.praxis-card-kpi` (dashboard KPI variant, padding `lg`),
  `.praxis-card-team` (team grid variant, includes radial dept tint
  per FR-024), `.praxis-card-stat` (in-page stat tile, padding `sm`).
- **FR-050**: Identity primitives — `.praxis-avatar` (per FR-026),
  `.praxis-avatar-atlas` (the Atlas-spine variant per FR-028),
  `.praxis-pulse[data-rhythm]` (the role-typed pulse per FR-013),
  `.praxis-pulse-streaming`, `.praxis-pulse-ship-celebration`.
- **FR-051**: Eyebrow & label primitives — `.praxis-eyebrow` (per
  FR-017), `.praxis-microlabel`, `.praxis-tag-locked` (the ghosted
  tag for tier-locked rows).
- **FR-052**: Composer primitives — `.praxis-composer-pill` (the
  demoted resting composer per FR-009), `.praxis-composer-pill-focus`
  (focused state with dept-colored ring).

#### Motion vocabulary

- **FR-053**: Locked easing curves:
  `--praxis-ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1)`,
  `--praxis-ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1)`,
  `--praxis-ease-baton: cubic-bezier(0.4, 0, 0.2, 1)`. No surface
  introduces a new curve.
- **FR-054**: Locked ambient pulse cadences per FR-013, expressed as
  CSS custom properties: `--rhythm-jarvis: 4s`,
  `--rhythm-marketing: 3s`, `--rhythm-sales: 2.5s`,
  `--rhythm-engineering: 2s`, `--rhythm-finance: 5s`,
  `--rhythm-compliance: 6s`, `--rhythm-hr: 3.5s`, `--rhythm-ops: 3s`,
  `--rhythm-legal: 5s`. Mobile applies a 1.2x multiplier (slower).
- **FR-055**: Named motion primitives:
  `praxis-pulse` (ambient, infinite, role-typed cadence),
  `praxis-pulse-streaming` (1.1s, infinite, stronger glow),
  `praxis-wash-in` (240ms ease-out-quart),
  `praxis-wash-out` (480ms ease-out-quart),
  `praxis-baton` (480ms ease-baton, one-shot),
  `praxis-ship-celebration` (1200ms ease-out-quart, one-shot),
  `praxis-breath` (2–4s depending on activity, infinite, ±2px
  translate-y),
  `praxis-time-fade` (200ms ease-out-quart, on stamp value change).
- **FR-056**: Page-transition continuity between the dashboard team
  card and the destination team page MUST use a shared-color FLIP-
  style transition over 300–360ms. Implementation detail belongs in
  the plan; the contract is that the destination header band's tint
  matches the source card's tint at moment of click.
- **FR-057**: Reduced-motion fallback policies:
  `praxis-pulse*` → suppressed entirely (state communicated by
  static color/opacity only);
  `praxis-wash-in/out`, `praxis-baton` → resolve to end state in 1
  frame;
  `praxis-breath` → suppressed entirely;
  `praxis-ship-celebration` → static one-frame flash, no travel pip;
  `praxis-time-fade` → hard swap (no transition).
- **FR-058**: All motion primitives MUST be authored as CSS keyframes
  or transitions, not JS-driven, except for the page-transition
  continuity (FR-056) which MAY use the View Transitions API where
  supported and a CSS-only fallback otherwise.
- **FR-059**: A single `useReducedMotion` hook MUST gate any JS-side
  motion (currently scattered across components). Surfaces MUST NOT
  read `window.matchMedia('(prefers-reduced-motion: reduce)')`
  inline.
- **FR-060**: Animations MUST NOT compete: only one of {streaming
  pulse, ship celebration, hover wash} may be in flight per
  card/canvas at a time. Conflict resolution rule: streaming pulse
  > ship celebration > hover wash. Locked in the motion-system code,
  not negotiated per-component.

#### Accessibility & responsive

- **FR-061**: All interactive elements MUST maintain a minimum 44px
  hit area on mobile (375px), including team grid cards.
- **FR-062**: All dept-tinted text MUST maintain WCAG AA contrast
  against the surface; ghosted/locked variants MUST maintain AA
  against muted surfaces.
- **FR-063**: All ambient and one-shot motion MUST respect
  `prefers-reduced-motion: reduce` per the policies in FR-057.
- **FR-064**: All surfaces MUST be verified at 375px and 390px
  viewports (per Constitution Principle V).
- **FR-065**: Forced-colors / high-contrast mode MUST not lose
  identity affordances (lock glyph, live pip, active-state
  indicator).

### Key Entities *(visual primitives, not data)*

- **PraxisCard** — the universal card material. Variants: `kpi`,
  `team`, `stat`, `activity-row`. Carries inner highlight, outer
  border, hover-elevation stack with optional dept-tinted glow.
- **PraxisAvatar** — the materially-upgraded employee chip. Variants:
  `atlas`, `dept`, `dept-ghosted`. Supports `pulse`, `streaming`,
  `tts-sync` modes.
- **PraxisPulse** — the role-typed ambient breathing system. Parameter:
  `rhythm` (one of the nine `--rhythm-*` tokens). Modes: `ambient`,
  `streaming`, `ship-celebration`.
- **CanvasTintEngine** — the application-level component that
  computes the current canvas tint (last-active employee, hovered
  dept, pinned employee, streaming employee) and applies it via the
  `data-dept` attribute on the canvas root.
- **PraxisComposerPill** — the demoted composer surface. Variants:
  `rest`, `focus`, `streaming`. Hosts the dept-pin avatar dropdown,
  textarea, mic, send button.
- **HandoffBaton** — the redesigned handoff card with shared-color
  baton-pass animation.
- **LiveStrip** — the above-the-hero "voice session live now" strip.
- **TeamRoster** — the dashboard team grid: opinionated order, role-
  typed pulses, ghosted tier-lock state, shared-color page transition.
- **WelcomeHero** — the dashboard hero composition: time-of-day +
  Atlas-event-driven copy, ambient breathing.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A returning user who lands on `/app/workspace` can name
  the *single most recent thing their team did* within 5 seconds of
  page load, without scrolling. Tested by usability check.
- **SC-002**: A new visitor who lands on `/app/workspace` for the
  first time can identify *at least three departments by name and
  role* within 10 seconds of page load, without hovering. Tested by
  the on-card name + role label being legible and the visual rhythm
  drawing the eye through the roster.
- **SC-003**: An operator on free tier sees zero locked departments
  *missing* from the team roster — all nine are visible, with
  three actively available and six rendered in the ghosted "hire"
  variant. Measured by render check.
- **SC-004**: Zero one-off arbitrary Tailwind utilities
  (`text-[Npx]`, `min-h-[Npx]`, `px-[Np]`) remain on the redesigned
  surfaces (workspace dashboard, team grid, team detail header,
  chat empty state) after the redesign lands. Measured by grep.
- **SC-005**: Every color value, spacing value, radius value, motion
  duration, and motion curve on the redesigned surfaces traces to a
  named token in the design system document. Measured by audit
  against `docs/praxis-design-system.md`.
- **SC-006**: The console surface holds at 375px and 390px without
  horizontal scroll, with the team grid collapsing to 2 columns and
  no card content overflowing or wrapping awkwardly. Verified per
  Constitution Principle V mobile sweep.
- **SC-007**: Under `prefers-reduced-motion: reduce`, every
  redesigned surface remains fully legible and identity-preserving,
  with no animation playing. Tested by toggling the OS preference
  and reloading.
- **SC-008**: The dashboard's "Welcome back, {firstName}." headline
  varies between at least four distinct copy variants across
  realistic state combinations (time of day × recent-activity type),
  none of which fabricate activity that didn't occur. Verified by
  enumerating the copy ladder.
- **SC-009**: A team card's role-typed pulse cadence is *visually
  distinguishable* between Atlas (slowest) and Engineering (fastest)
  by a user watching the dashboard for 10 seconds. Tested by user
  reading.
- **SC-010**: Time-from-last-active stamps update without visible
  flicker (200ms cross-fade per FR-020) when the page polls fresh
  data. Tested by watching the stamp tick during a session.
- **SC-011**: Page transition from a dashboard team card to the
  destination team page maintains visible color continuity (the
  header band picks up the source card's tint within 360ms). Tested
  by recording the transition and frame-stepping.
- **SC-012**: A returning user who has not opened the console for >72
  hours is offered a one-sentence "what happened while you were away"
  recap in the hero region, sourced from real artifacts/conversations
  (per Principle Zero — no fabrication). Tested by simulating an
  inactivity window.

---

## Assumptions

1. **Domain truth is locked at the current roster.** Nine employees,
   Atlas (jarvis) as Chief of Staff, dept colors and roles as defined
   in `src/lib/conduit/employees.ts`. Constitution Principle Zero
   applies: this spec invents no new employees, no new departments,
   and no copy claims that aren't backed by real data on the
   operator's account.
2. **Tokens live in two files (already).** `globals.css` `@theme`
   block carries the marketing + base system tokens; `praxis-tokens.css`
   scoped to `.praxis-root` carries the Praxis-specific overrides.
   The redesign extends both; it does not introduce a third token
   surface.
3. **No new font files.** Fraunces, Inter, JetBrains Mono are the
   committed faces. The redesign uses them.
4. **Light theme is a first-class target.** `ThemeBoot` and
   `html[data-praxis-theme="light"]` already exist; both themes get
   first-class redesign comps, not "dark first, light retrofit later."
5. **Voice surfaces (`/app/voice`) and Sales workspace
   (`SalesWorkspace`) are out of scope for this redesign.** Their
   visual treatment will follow once the design system is locked, but
   they are not included in this spec's stories. The motion +
   material primitives this spec establishes will be available to
   them later.
6. **Performance budget.** Ambient pulses, washes, and gradients
   must not push the console's main-thread render past current
   baselines on a mid-range 2024 laptop. Specifically: no surface
   may use a backdrop-filter blur with > 8px radius, no animation
   may animate `box-shadow` more than 2 layers deep (compose with a
   pseudo-element instead), no surface may register a `requestAnimation
   Frame` loop for ambient effects when CSS keyframes suffice.
7. **No JS animation libraries.** GSAP, Framer Motion, etc. are NOT
   adopted as part of this redesign. CSS keyframes + transitions +
   the View Transitions API (with graceful fallback) cover every
   motion need above.
8. **No new dependencies.** Lucide for icons stays; Tailwind v4 stays;
   the design system is authored as CSS custom properties + utility
   classes in `praxis-tokens.css` + a new `praxis-system.css`
   companion. No design-system npm package introduced.
9. **Push-to-main deploy holds.** Per Constitution Principle VI; the
   redesign ships in short-lived branches that merge fast.
10. **Spec scope is intentionally limited to three surfaces.** Even
    though the design system created in service of the redesign is
    available to every Praxis surface (sidebar, settings, voice,
    artifacts), the *stories* and *acceptance criteria* in this spec
    cover only the dashboard, the team grid, the team detail page
    header, and the chat shell. Other surfaces will adopt the system
    in follow-on rounds.

---

## Out of Scope (explicit non-goals)

- Marketing site (`/`, `/about`, `/pricing`, etc.) — covered by the
  separate Conduit AI v3 indigo system in `globals.css`. This
  redesign MUST NOT touch marketing tokens or components.
- `/app/voice` (the voice room itself) — separate spec in flight
  (`specs/voice-room-for-ai-employees/`).
- `/app/builds`, `/app/artifacts`, `/app/analytics`, `/app/settings/*`
  — adopt the system later.
- The `SalesWorkspace` bespoke component — adopts the system later.
- Sidebar full redesign — only the status pip system (FR-034) and
  active-route indicator (FR-035) update in this round.
- The onboarding modal, paywall modal, upgrade nudge — adopt the
  system later.
- New product capabilities (new employees, new tier features, new
  routing semantics) — out of scope by Principle Zero. This is a
  visual redesign, not a product expansion.
- Backend / schema changes. The redesign reads existing data only.
  If a new piece of data is needed (e.g. a "current focus dept"
  computed value), it lives at the page-data layer, not in a new
  table.

---

## What this spec stops short of (handed to the plan)

- *Exact* color values for the dept-tint wash / glow per dept.
- *Exact* shadow stack values for elevation tokens.
- *Exact* component file structure for the new primitives.
- *Exact* implementation strategy for the page-transition
  continuity (View Transitions API vs FLIP).
- *Exact* polling cadence for the team-activity refresh.
- *Exact* copy ladder for the time-of-day × event-type hero.

Those belong in `plan.md` after this spec is approved at GATE 1.
