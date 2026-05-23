# Contract — In-Flight Build Ambient Surfaces

**Spec FRs**: FR-013, FR-014, FR-015, FR-016, FR-026
**User Story**: P1 US3 + supporting affordances on Sidebar + Team Roster

---

## 1. Surfaces

Three surfaces consume the same `useInFlightBuilds` hook and render the same
underlying state in three different shapes:

| Surface | Shape | Code location |
|---|---|---|
| Workspace dashboard in-flight strip | Above-the-hero band, mirrors `PraxisLiveStrip` | `src/components/conduit/builds/in-flight/EngineeringBuildStrip.tsx` |
| Sidebar pulse pip | Small dept-tinted dot overlaid on the `/app/builds` icon | `src/components/conduit/builds/in-flight/SidebarBuildPip.tsx` |
| Team roster Engineering card | Nested `<Link>` on the existing bottom-line "1 build in flight" copy | Modification to `src/components/conduit/praxis/PraxisTeamRoster.tsx:236-237` |

---

## 2. Source: `useInFlightBuilds` hook

```ts
// src/components/conduit/builds/in-flight/useInFlightBuilds.ts

interface UseInFlightBuildsOptions {
  initial: InFlightBuild[];     // server-rendered initial snapshot
  accountId: string;             // RLS-scoped realtime filter
}

interface UseInFlightBuildsResult {
  active: InFlightBuild[];       // currently in flight (status ∈ {pending, running, deploying})
  celebrating: InFlightBuild[];  // recently completed within last 5s (FR-016)
  subscription: SubscriptionStatus;
}

export function useInFlightBuilds(opts: UseInFlightBuildsOptions): UseInFlightBuildsResult
```

Server-render entry point — `getInFlightBuilds(supabase, accountId)` in
`src/lib/engineering/in-flight.ts`:
- Query: `conduit_engineering_sessions` where `account_id = accountId` AND `status IN ('pending', 'running', 'deploying')` ORDER BY `created_at DESC` LIMIT 5.
- For each session, sub-query last 30 log rows to populate `step`, `fileCount`, `currentFile`.

Client realtime subscription — `useInFlightBuilds`:
- Subscribes to `account-builds:<accountId>` channel (NEW channel name; namespaced under the account, not a single session).
- Listens for `postgres_changes` INSERT + UPDATE on `conduit_engineering_sessions` filtered by `account_id=eq.${accountId}`.
- On INSERT (new session) with non-terminal status → adds to `active`, fires a one-time log-tail fetch via `/api/engineering/session/<id>?limit=30`.
- On UPDATE → if status flipped to non-terminal AND wasn't tracked, adds to `active`; if status flipped to terminal, moves from `active` to `celebrating` with a 5 s timer.
- After the 5 s celebration window, the build is dropped from both arrays. The strip / pip unmounts (FR-016).
- For active sessions, log changes flow through a *per-session* subscription opened lazily on first appearance.

---

## 3. `EngineeringBuildStrip` (workspace dashboard)

### 3.1 Placement

In `src/app/app/workspace/page.tsx`, above the existing `PraxisLiveStrip`
mount block and `PraxisWelcomeHero`. Conditional render:

```tsx
{inFlightBuilds.length > 0 && (
  <EngineeringBuildStrip
    builds={inFlightBuilds}      // from getInFlightBuilds() server-render
  />
)}
```

When BOTH voice and a build are active, the visual order is voice strip
above the build strip (voice is generally more immediately interactive).

### 3.2 Visual

Mirrors `PraxisLiveStrip` (verified in `src/components/conduit/praxis/PraxisLiveStrip.tsx`):

- Full-width strip, ~48 px tall on desktop, ~40 px on mobile.
- Left edge: 3 px stripe in `var(--color-dept-engineering)`.
- Subtle ambient pulse on the stripe (CSS keyframe, opacity 0.6 → 1 → 0.6, 2.4 s infinite). Disabled under reduced-motion.
- Eyebrow text: `BUILDING · <STEP.eyebrow>` (e.g. `BUILDING · BUILDING THE PROJECT`).
- Inline secondary text: `<elapsed> · <fileCount> files`.
- Right side: `<ArrowRight />` chevron with text "Open live view".
- The entire strip is a `<Link href={'/app/builds/${build.id}'}>`.

### 3.3 Multi-build handling (FR-014)

When `active.length > 1`:
- Strip shows the most-recently-started build (first by `started_at DESC`, falling back to `created_at DESC`).
- A small "+N more" affordance on the right (between secondary text and chevron) links to `/app/builds`.

### 3.4 Celebration (FR-016)

When a build is in `celebrating` state:
- Strip swaps eyebrow to `JUST SHIPPED · <prompt summary truncated 40 chars>`.
- Background briefly tints with `var(--color-dept-engineering)` at 6% alpha (CSS keyframe, 1.8 s, fade-out).
- After 5 s, the strip unmounts entirely (or transitions to the next active build if multiple).

### 3.5 Failure state (FR-016)

When `celebrating` carries a non-success terminal status:
- Strip swaps eyebrow to `BUILD FAILED · <translateBuildError().headline>` with `var(--color-pink)` accent on the left stripe (replacing the dept tint).
- "Open live view" link unchanged → routes to cinema for full failure detail.
- Same 5 s timeout before unmount.

---

## 4. `SidebarBuildPip`

### 4.1 Placement

In `src/components/conduit/Sidebar.tsx`, rendered as a child of the existing
`/app/builds` link entry. The pip is positioned absolutely at the icon's
top-right corner via CSS.

```tsx
<Link href="/app/builds" className="…">
  <Hammer size={18} />
  {hasActiveBuild && <SidebarBuildPip />}
  <span>Builds</span>
</Link>
```

The `hasActiveBuild` boolean is fed from `useInFlightBuilds().active.length > 0`,
sourced at the layout level (the sidebar is a child of `src/app/app/layout.tsx`,
which mounts the hook).

### 4.2 Visual

- 8 × 8 px dot.
- Fill: `var(--color-dept-engineering)`.
- Position: absolute, top: -1 px, right: -1 px relative to the icon.
- Ambient pulse: 2.4 s infinite, opacity 0.6 → 1 → 0.6 (same cadence as the strip). Disabled under reduced-motion.

### 4.3 No click target

The pip is purely an indicator. The user clicks the Builds sidebar entry as
normal; the index page surfaces the in-flight rows. Pip click is NOT a
shortcut to the cinema (cleaner separation of concerns).

---

## 5. `PraxisTeamRoster` Engineering card link wrap

### 5.1 Current state

`src/components/conduit/praxis/PraxisTeamRoster.tsx:236-237` renders:

```tsx
} else if (isInFlightEng) {
  bottomLine = "1 build in flight";
}
```

The `bottomLine` is rendered as plain text inside the card. The card itself
links to `/app/team/engineering` via the parent `<PraxisCard href={href}>`.

### 5.2 Modification

The "1 build in flight" copy becomes a click target that routes to the cinema:

```tsx
} else if (isInFlightEng) {
  // Plain text fallback for non-in-flight cases.
  bottomLine = (
    <ClickInterceptor href={`/app/builds/${c.row.in_flight_build_id}`} onClick={onCardClick}>
      <span style={{ textDecoration: "underline dotted", textUnderlineOffset: 2 }}>
        Building now →
      </span>
    </ClickInterceptor>
  );
}
```

Copy upgraded from "1 build in flight" (status) to "Building now →" (call to
action). The `ClickInterceptor` (the existing pattern at
`PraxisTeamRoster.tsx:269`) prevents the parent card's link from intercepting
the click; the user-visible affordance is clearly nested.

### 5.3 Multi-build behavior

`c.row.in_flight_build_id` is currently a single string (set by
`team-activity.ts:109` to the first in-flight session id). When multiple builds
are in flight, the link routes to the first one. The strip (FR-014) is the
"+N more" entry point for the full list.

---

## 6. Verification

- Start a build. Navigate to `/app/workspace`. Confirm the strip is at the top.
- Strip text updates live as the worker emits logs (step changes, fileCount increments, currentFile changes).
- Click the strip → cinema opens at `/app/builds/<id>`.
- Hit browser back → workspace renders with the strip still live.
- Refresh `/app/workspace` mid-build → strip re-mounts populated, no flash of empty state.
- Build completes → strip flips to celebration for 5 s, then disappears.
- Build fails → strip flips to failure state for 5 s, then disappears.
- Sidebar pip visible only when at least one build is in flight; gone otherwise.
- Engineering team card "Building now →" copy is clickable, routes to cinema; the parent card's `/app/team/engineering` route is unaffected by clicking the nested copy.
- Mobile 375 + 390: strip wraps without horizontal scroll; pip stays positioned correctly on the smaller sidebar.
- Reduced-motion: pulses static; strip celebration is opacity-only.
