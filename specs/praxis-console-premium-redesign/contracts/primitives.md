# Contract — Primitives

Component and class contracts. For each primitive: required props,
optional props, variants, behavior, accessibility notes, theme
parity.

---

## P-001 — `PraxisCard`

**File**: `src/components/conduit/praxis/PraxisCard.tsx`
**Underlying class**: `.praxis-card` + variant modifier
**Render type**: server-safe (no hooks; pure JSX wrapper)

**Props**:
```ts
type PraxisCardProps = {
  variant: "kpi" | "team" | "stat" | "activity";
  dept?: EmployeeId;          // resolves --dept for top-edge + hover glow
  locked?: boolean;           // applies ghosted treatment + lock glyph slot
  href?: string;              // when set, renders as <Link>; otherwise <div>
  children: React.ReactNode;
  className?: string;         // narrow escape hatch; lint enforces no magic spacing
  ariaLabel?: string;
};
```

**Variant behaviors**:
- `kpi`: `--space-card-lg` padding, `--color-surface-raised` base,
  default `elev-rest-2` rest / `elev-hover-2` hover, top-edge
  gradient indicator visible.
- `team`: `--space-card-md` padding, base surface, default
  `elev-rest-1` rest / `elev-hover-3` hover, top-edge indicator +
  `--tint-{dept}-radial` bottom-right signature.
- `stat`: `--space-card-sm` padding, base surface, `elev-rest-1`
  only (no hover-elevation; stats are not interactive).
- `activity`: like `team` but with fixed-width left gutter for icon
  + reduced hover elevation.

**`locked` behavior**:
- Applies `filter: saturate(0.4) brightness(0.7)`.
- Reserves a slot for a lock glyph (consumer renders the glyph
  inside, but the slot reserves layout to prevent shift on unlock).
- Disables hover-elevation; replaces hover-glow with a faint
  `--color-accent` ring (the "hire" affordance).

**A11y**:
- When `href` is set, renders `<Link>` with appropriate role.
- When `locked`, `aria-disabled` is NOT set (the card is still
  clickable — it routes to billing), but `aria-label` MUST clearly
  state "Hire {dept}" for the locked variant.

**Reduced-motion**: hover-translate suppressed; hover-glow rendered as
a static border swap.

**Theme parity**: every visual decision flows from tokens; primitive
has no per-theme code paths.

---

## P-002 — `PraxisAvatar`

**File**: `src/components/conduit/praxis/PraxisAvatar.tsx`
**Underlying class**: `.praxis-avatar` (+ `.praxis-avatar-atlas` /
`.praxis-avatar-ghosted`)
**Render type**: server-safe

**Props**:
```ts
type PraxisAvatarProps = {
  employee: EmployeeId;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";  // default "md" (24px)
  pulse?: "ambient" | "streaming" | "ship-celebration";
  ghosted?: boolean;
  ariaLabel?: string;
};
```

**Material**:
- Circular chip.
- Background: `var(--color-dept-{dept}-soft)`.
- Inner gradient: `linear-gradient(180deg, var(--color-dept-{dept})
  at 0/0.08-alpha, transparent at 100/0)` — subtle top-edge gloss.
- Ring: `inset 0 0 0 1.5px var(--color-dept-{dept})`.
- Icon: from `EMPLOYEE_ICON[employee]` (Lucide); scales with size.

**Atlas variant** (`employee === "jarvis"` triggers
`.praxis-avatar-atlas` modifier):
- `size` minimum is `lg`.
- Permanent presence pip at bottom-right (always on; not controlled
  by `pulse`).
- Warmer inner gradient (platinum reads as warm metal, not gray).

**Ghosted variant** (`ghosted === true`):
- Filter: `saturate(0.4) brightness(0.7)`.
- Lock glyph slot top-right (consumer renders glyph; primitive
  reserves slot).

**Pulse behavior**:
- `pulse="ambient"`: `praxis-pulse` keyframe, cadence
  `var(--rhythm-{dept})`.
- `pulse="streaming"`: `praxis-pulse-streaming` keyframe, 1.1s.
- `pulse="ship-celebration"`: `praxis-pulse-celebration` keyframe,
  1.2s, ONCE; auto-removes class after animation end.
- Conflict resolution per FR-060: streaming > celebration > ambient.

**A11y**: `aria-label` defaults to `"{employee.name}, {role}"`.

**Reduced-motion**: all pulse modes resolve to the rest state (no
animation).

---

## P-003 — `PraxisPulsePip`

**File**: `src/components/conduit/praxis/PraxisPulsePip.tsx`
**Underlying class**: `.praxis-pulse-pip`
**Render type**: server-safe

**Props**:
```ts
type PraxisPulsePipProps = {
  employee: EmployeeId;
  state?: "ambient" | "streaming" | "active" | "rest";
  size?: 6 | 8;  // px
  ariaLabel?: string;
};
```

Lightweight standalone pip. Used in card corners, sidebar rows, KPI
tile chips. Same cadence semantics as `PraxisAvatar`'s pulse modes.

**Reduced-motion**: rest visual only.

---

## P-004 — `PraxisCanvasTintProvider` + `useDeptTint` hook

**Files**:
- `src/components/conduit/praxis/PraxisCanvasTintProvider.tsx`
- `src/components/conduit/praxis/usePraxisTint.ts`

**Render type**: `"use client"` (provider); client hook.

**Provider props**:
```ts
type Props = {
  children: React.ReactNode;
  initialDept?: EmployeeId;       // server-rendered initial value
  initialStrength?: "wash" | "wash-strong";
};
```

**Provider behavior**:
- Mounts a React context with state machine per `research.md` R-005.
- Writes `data-dept` and `data-tint-strength` attributes onto the
  nearest ancestor with class `.praxis-canvas-tint`.
- Subscribes to the `conduit:stream` `window` event to update the
  stream-dept state.
- Listens to route changes via `usePathname()` to apply per-route
  defaults (dashboard / chat / team-page modes per R-005 §3).

**Hook surface**:
```ts
const {
  currentDept,
  setHoverDept,    // transient, cleared on un-hover
  setPinDept,      // persistent (chat composer)
  clearPin,
  setStreamDept,   // transient, cleared on stream-end (or via conduit:stream event)
} = useDeptTint();
```

Priority (highest wins): `streamDept > pinDept > hoverDept >
routeDefault > none`.

**Reduced-motion**: tint-transition duration on the canvas element
collapses from 240ms to 0 (rendered as a hard swap) when
`useReducedMotion()` returns true.

---

## P-005 — `useReducedMotion` hook

**File**: `src/hooks/useReducedMotion.ts`
**Render type**: client hook.

```ts
const reduced = useReducedMotion();
```

Wraps `matchMedia('(prefers-reduced-motion: reduce)')` with a
subscription so toggling the OS preference mid-session updates the
hook without a reload. SSR-safe (returns `false` on the server).

Consumers per FR-059:
- `PraxisCanvasTintProvider` — collapses tint transition duration.
- The `PraxisTeamRoster` — skips JS-side scroll/hover micro-animations.
- The page-transition entrypoint in `PraxisTeamRoster` — falls back
  to plain `router.push()` (no `document.startViewTransition`).
- The ship-celebration trigger in `PraxisTeamRoster` — renders a
  one-frame static flash instead of the 1.2s animation per FR-057.

---

## P-006 — `PraxisWelcomeHero`

**File**: `src/components/conduit/praxis/PraxisWelcomeHero.tsx`
**Render type**: server-safe.

**Props**:
```ts
type PraxisWelcomeHeroProps = {
  firstName: string;
  copy: WelcomeCopy;   // returned by composeWelcomeCopy()
  voiceLiveSessionId?: string | null;   // when set, renders LiveStrip above
};

type WelcomeCopy = {
  eyebrow: string;
  headline: string;       // contains {firstName} placeholder pre-resolved
  subline?: string;
  primaryEvent?: {
    employeeId: EmployeeId;
    label: string;        // e.g. "Marketing finished the 3-post draft"
    href?: string;
  };
};
```

**Behavior**:
- Renders `--text-display-1` headline; eyebrow uses `.praxis-eyebrow`.
- Applies `praxis-breath` ambient animation (cadence keyed to
  team-activity bucket — passed via a `data-activity-bucket` attribute
  resolved server-side).
- When `voiceLiveSessionId` is set, renders `PraxisLiveStrip` above
  the hero with the rejoin affordance.
- When `copy.primaryEvent` is set, the headline ends with a
  hover-revealable affordance to deep-link into that event.

**Reduced-motion**: `praxis-breath` suppressed.

---

## P-007 — `PraxisLiveStrip`

**File**: `src/components/conduit/praxis/PraxisLiveStrip.tsx`
**Render type**: `"use client"` (waveform pulse synced to time).

**Props**:
```ts
type Props = {
  employee: EmployeeId;
  rejoinHref: string;
};
```

Renders a thin strip with: continuous waveform-style pulse in the
employee's color (CSS-only, multi-segment with staggered animation
delays — see existing `wave1/wave2/wave3` keyframes in `globals.css`
for the pattern), employee name + "live now" label, "Rejoin" CTA on
the right with the employee's color.

**Reduced-motion**: waveform suppressed; static dot + label only.

---

## P-008 — `PraxisTeamRoster`

**File**: `src/components/conduit/praxis/PraxisTeamRoster.tsx`
**Render type**: `"use client"` (hover, page-transition trigger).

**Props**:
```ts
type Props = {
  cards: TeamCardData[];          // computed server-side, polled per R-002
  allowedEmployees: Set<EmployeeId>;
};

type TeamCardData = {
  employee: EmployeeId;
  lastActiveAt: string | null;
  lastArtifactTitle: string | null;
  lastArtifactCreatedAt: string | null;
  inFlightBuildId: string | null;
  topLeadScore: number | null;    // sales only
  topLeadName: string | null;     // sales only
};
```

**Behavior**:
- Renders one `PraxisCard variant="team"` per employee in the
  opinionated order from FR-004.
- Wires `useDeptTint().setHoverDept` to each card's `onMouseEnter` /
  `onMouseLeave`.
- For tier-locked employees, renders with `locked={true}` and
  routes click to `/app/settings/billing`.
- Subscribes to the team-activity poll (R-002) and updates card
  state in place; uses a client-side cache to detect "newly shipped"
  vs "previously known" rows per R-008.
- Fires `praxis-pulse-celebration` exactly once per genuinely-new
  ship event detected during the session window.
- On card click for an unlocked employee, initiates the View
  Transitions API page-transition per R-001 (with reduced-motion
  fallback per P-005).

---

## P-009 — `PraxisHandoffBaton`

**File**: `src/components/conduit/praxis/PraxisHandoffBaton.tsx`
**Render type**: `"use client"`.

**Props**:
```ts
type Props = {
  from: EmployeeId;
  to: EmployeeId;
  label?: string;   // default: "{from.name} → {to.name}"
};
```

Replaces the existing `.handoff-card` rendering inside the redesigned
chat surface. Animates per FR-031.

**Reduced-motion**: renders the end state (right-edge color) only;
no animation.

---

## P-010 — `PraxisComposerPill`

**File**: `src/components/conduit/praxis/PraxisComposerPill.tsx`
**Render type**: `"use client"`.

**Props** (the existing Chat.tsx composer surface, refactored):
```ts
type Props = {
  value: string;
  onChange(next: string): void;
  onSubmit(): void;
  pinDept: PinValue;
  pinOptions: { value: PinValue; label: string }[];
  onPinChange(next: PinValue): void;
  voicePrefs: VoicePrefs;
  speechState: { listening: boolean; supported: boolean };
  onSpeechToggle(): void;
  streamingEmployee: EmployeeKey | null;
};
```

Demoted resting border per FR-009; dept-colored ring on focus only
(consumes `--tint-{pinDept}-edge` for the ring color); subtle pulse on
the avatar slot when streaming.

Wires `useDeptTint().setPinDept(pinDept)` on every pin change so the
canvas tint follows the pin.

**Reduced-motion**: no pulse on the avatar slot.

---

## Out-of-redesign primitive (intentional)

`.conduit-card`, `.conduit-suggestion`, `.conduit-pill-input`,
`.conduit-bubble-*`, `.team-dot.ambient`, `.live-dot`,
`.employee-pulse` — REMAIN in place. The redesign does not touch
them. Consumers on out-of-scope surfaces (sidebar, settings, voice,
artifacts, builds, analytics, paywall, onboarding) continue to use
them through this round. A future round migrates remaining surfaces
to the `.praxis-*` family.
