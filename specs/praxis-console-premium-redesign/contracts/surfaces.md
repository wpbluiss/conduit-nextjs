# Contract — Surface-to-Primitive Mapping

For each redesigned surface, the exact composition of primitives it
must use. Anything not listed here is either out of scope or a
violation.

---

## S-001 — `/app/workspace` (Welcome-back dashboard)

**File**: `src/app/app/workspace/page.tsx`

**Render type**: server component (`export const dynamic =
"force-dynamic"`, unchanged from current).

**Composition** (top to bottom):

1. `PraxisLiveStrip` — when a voice session is live, render above
   everything else. Otherwise omit.
2. `PraxisWelcomeHero` — eyebrow + headline + subline, with the copy
   ladder result from `composeWelcomeCopy()` (R-009).
3. Row of 4 `PraxisCard variant="kpi"` — the four operational tiles:
   - Atlas pinged you (latest `conduit_memory` row by `written_by =
     'jarvis'`)
   - Pipeline (count from `sales_leads` per VERIFY note in data-model.md
     §5)
   - Last conversation (most-recent `conduit_conversations` row)
   - Voice minutes today (sum from `conduit_voice_sessions`)
   Visual grouping cue per FR-002 is achieved via the KPI variant's
   elevated material (raised surface token) and the `data-cluster="kpi"`
   attribute on the row for styling hooks.
4. Section eyebrow: `Your team`.
5. `PraxisTeamRoster` — 9 cards in opinionated order (FR-004), with
   tier-locked employees rendered as ghosted variants.

**Wrapper**: the page is wrapped in `PraxisCanvasTintProvider` with
`initialDept` set to the dashboard's most-recently-active employee
(computed server-side from the same activity query the team grid
uses).

**Primitives used**: `PraxisLiveStrip`, `PraxisWelcomeHero`,
`PraxisCard(variant=kpi)`, `PraxisCard(variant=team)` (inside roster),
`PraxisAvatar`, `PraxisPulsePip`, `PraxisCanvasTintProvider`,
`useDeptTint` (consumed inside roster).

**Out**: no `conduit-card`, no `conduit-suggestion`, no `live-dot`,
no `employee-pulse`. The page must contain ZERO references to the
out-going primitives.

**Acceptance hooks**: SC-001, SC-002, SC-006, SC-008, SC-010, SC-012,
SC-009 (visible in roster).

---

## S-002 — `/app/team/[employee]` (Team detail page header)

**File**: `src/app/app/team/[employee]/page.tsx` — **header band only**
in this redesign. The body (Quick start, stats, recent activity, and
the V2 employee workspaces) keeps current composition; only the header
band updates.

**Header band composition**:

1. `PraxisCanvasTintProvider` wrapper with `initialDept` set to the
   route's employee (so the entire team page reads as that employee's
   room).
2. New header structure (replaces the current `linear-gradient(135deg,
   colorSoft, transparent)` block):
   - `PraxisAvatar` `size="2xl"` `employee={employeeId}`.
   - Eyebrow with employee role.
   - `--text-display-1` headline with employee name.
   - Body-lg tagline.
   - Action cluster (existing `VoiceModeButton`, optional
     `EngineeringBuildButton`, "Talk to X" CTA) — these existing
     components keep their current visuals for this round, only
     wrapping in the new layout grid.
3. Page-transition continuity: the entrypoint into this page from
   `/app/workspace`'s team grid uses the View Transitions API per
   R-001. The header band's avatar receives a `view-transition-name`
   that matches the source card's avatar.

**Out**: the existing background gradient on the header band is
removed; the `PraxisCanvasTintProvider` does the room-level tinting
instead.

**Acceptance hooks**: SC-011.

---

## S-003 — `/app` (Chat shell)

**File**: `src/components/conduit/Chat.tsx`

**Refactor surfaces**:
- The `EmptyState` sub-component (`Chat.tsx:930–980`) is replaced.
- The composer pill (`Chat.tsx:743–880`) is replaced by
  `PraxisComposerPill`.
- The handoff card rendering (`MessageBubble` for `system + handoffTo`,
  `Chat.tsx:1005+`) is replaced by `PraxisHandoffBaton`.
- The page wraps in `PraxisCanvasTintProvider` at the layout level
  (already done by S-004 below).

**New EmptyState composition**:
1. `PraxisAvatar` `employee="jarvis"` `size="lg"` `pulse="ambient"`
   adjacent to the headline (FR-008).
2. Eyebrow per FR-017.
3. Headline per `composeChatEmptyCopy()` (a sibling to
   `composeWelcomeCopy()`, time-of-day aware, names Atlas, never
   "What are we building today?").
4. Subline.
5. Four `conduit-suggestion`-equivalent suggestion tiles, refactored
   into a new lightweight `PraxisSuggestionTile` (server-safe). Each
   tile shows: dept `PraxisAvatar(size=md)`, attribution line ("Atlas
   will route this" / "Marketing builds the play"), prompt text.

**Composer behavior** (P-010):
- On pin change, calls `useDeptTint().setPinDept(pinDept)`.
- On stream start (via `conduit:stream` event), the canvas wash
  upgrades automatically through the provider.
- On stream end, the wash fades out over 600ms (handled in CSS via
  the canvas tint transition).

**Handoff baton** (P-009):
- Mounted in place of the existing handoff-card markup. Same
  triggering data (`system` role + `handoffTo` employee).

**Out**: `.conduit-pill-input`, `.conduit-suggestion`, the existing
`.handoff-card`, the existing `hero-fade-in` class on empty state.

**Acceptance hooks**: Story 3 ACs.

---

## S-004 — `src/app/app/layout.tsx` (the shell)

**File**: `src/app/app/layout.tsx`

**Single change**: wrap the existing `.praxis-root` div's children
with `PraxisCanvasTintProvider`. The `.conduit-canvas` `<main>`
inside also gets the `.praxis-canvas-tint` companion class so the
provider has somewhere to write `data-dept`.

**Diff (sketch)**:
```diff
- <div className="praxis-root h-screen flex bg-[var(--color-surface)] text-[var(--color-text)]">
+ <div className="praxis-root h-screen flex bg-[var(--color-surface)] text-[var(--color-text)]">
+   <PraxisCanvasTintProvider>
     <RouteProgress />
     <Sidebar ... />
-    <main className="conduit-canvas flex-1 flex flex-col min-w-0">
+    <main className="conduit-canvas praxis-canvas-tint flex-1 flex flex-col min-w-0">
       <UpgradeNudge ... />
       {children}
     </main>
+   </PraxisCanvasTintProvider>
   </div>
```

The provider does not affect any out-of-scope surface visually because
no out-of-scope surface consumes `useDeptTint()` or sets
`data-dept`. Those surfaces continue to render against the base
`.conduit-canvas` background, unchanged.

---

## S-005 — Sidebar (LIMITED change; not a full redesign)

**File**: `src/components/conduit/Sidebar.tsx`

**Single change** per FR-034 + FR-035: the Team-list status pip and
the active-route indicator gradient stripe.

- Replace inline `<span>` pip rendering (`Sidebar.tsx:201–215`) with
  `PraxisPulsePip` consuming the same `streamingEmployee` state.
- Replace the active-route 0.5px solid stripe with a 1.5px gradient
  stripe using `--tint-{dept}-edge` for team rows and
  `--color-accent` for non-team rows.

Everything else in the sidebar — collapsible Team section, recent
conversations, settings/billing/sign-out footer — stays exactly as
today.

**Acceptance hooks**: visible-in-sidebar consistency for the
streaming-pulse system.

---

## Out-of-scope surfaces (explicit, for the implementer)

The following surfaces are NOT touched by this redesign and continue
to use existing primitives:

- `/app/voice` — separate spec
- `/app/builds`, `/app/artifacts`, `/app/analytics`,
  `/app/settings/*`
- `SalesWorkspace` (the bespoke sales surface, even though it's
  reached via `/app/team/sales`)
- The `OnboardingModal`, `PaywallModal`, `UpgradeNudge`
- `EmployeeRightRail` — rendered alongside the redesigned team-page
  header but its body stays current
- The `MarketingWorkspace`, `OpsWorkspace`, `ComplianceWorkspace`,
  `HRWorkspace`, `LegalWorkspace` bodies — only their containing
  page's header band updates per S-002
