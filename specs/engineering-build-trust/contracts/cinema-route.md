# Contract — Cinema Route

**Path**: `/app/builds/[session]`
**File**: `src/app/app/builds/[session]/page.tsx` (server component) + `src/app/app/builds/[session]/error.tsx` (client error boundary)
**Spec FRs**: FR-001, FR-002, FR-003, FR-004, FR-006, FR-007, FR-012, FR-027

---

## 1. URL contract

- **Canonical**: `/app/builds/<sessionId>` where `<sessionId>` is a UUID.
- **Backward-compatible**: `/app/builds?session=<sessionId>` continues to load (`/app/builds/page.tsx` performs a server-side redirect when the query is present and points at the new URL). Bookmarks survive.
- **Share-safe**: visiting `/app/builds/<sessionId>` for a session the current user does NOT own returns a clean Next.js 404 (the server-render `.maybeSingle()` returns null → `notFound()`).

---

## 2. Server-render contract

### 2.1 Page component signature

```ts
// src/app/app/builds/[session]/page.tsx
export const dynamic = "force-dynamic";

interface RouteCtx {
  params: Promise<{ session: string }>;
}

export default async function CinemaPage({ params }: RouteCtx) { … }
```

`params` is a Promise in Next.js 16 (confirmed in `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md` and per the established repo pattern in `src/app/api/engineering/session/[id]/route.ts:14-15`).

### 2.2 Server-render flow

1. `await params` to extract `session` UUID.
2. `getCurrentAccount()` for auth; redirect to `/auth/sign-in?next=/app/builds/<session>` if absent.
3. Single Supabase call (server client, RLS-scoped) to fetch:
   - Session row from `conduit_engineering_sessions` (all columns the cinema needs — see `data-model.md §1.1`).
   - Last 200 log rows from `conduit_engineering_logs` ordered by `ts ASC`.
4. If session is `null` (not found / RLS denied) → `notFound()`.
5. Mount `<BuildCinema initialSession={…} initialLogs={…} internalAccount={…} />` (client component) inside a `<PraxisCanvasTintProvider initialDept="engineering">` boundary.

### 2.3 Performance target

First paint ≤ 600 ms warm-cache (server-render → HTML response → hydration).
This is achievable because all server work is two Supabase queries (one row +
one log tail) on indexed columns.

---

## 3. Client `BuildCinema` contract

### 3.1 Props

```ts
interface BuildCinemaProps {
  initialSession: SessionRow;        // from data-model.md §1.1, fully populated
  initialLogs: LogRow[];              // from §1.2, time-ascending
  internalAccount: boolean;          // gates operator-only error hints
}
```

### 3.2 Lifecycle

1. Mount → `useBuildSession({ sessionId, initialSession, initialLogs, internalAccount })` composes:
   - `useBuildSubscription({ sessionId, onLog, onSession })`
   - `useBuildHeartbeat({ session, logs })`
   - `usePreviewIframe({ deployUrl: session.deploy_url })`
2. Render three stages: `<BuildStageBand>`, `<BuildCraftStrip>`, `<BuildPreviewStage>`.
3. Below: `<BuildRawLogPanel>` (collapsed) and `<BuildShippedSummary>` (rendered only when status is terminal).
4. At the top: `<BuildHeader>` with status pill, prompt, abort button (if abortable), close button (routes to `/app/builds`).

### 3.3 State machine (visual treatment)

| Session status | Heartbeat | Subscription | Visual treatment |
|---|---|---|---|
| pending | healthy | live | Stage band shows "Queued" + ambient pulse |
| running | healthy | live | Stage band shows step from taxonomy + craft strip animates |
| running | investigating | live | Stage band shows "Investigating…" eyebrow + "Refresh now" affordance |
| running | healthy | degraded/reconnecting | ReconnectingPip in header + craft strip frozen but logs preserve |
| deploying | healthy | live | Stage band shows "Deploying" + craft strip in steady state |
| complete | (n/a) | (n/a) | Shipped summary mounts; preview stage transitions via curtain rise if deploy_url set |
| failed/timeout | (n/a) | (n/a) | Shipped summary mounts with translateBuildError treatment |
| aborted | (n/a) | (n/a) | Shipped summary mounts with "Stopped" treatment |

### 3.4 Mobile reflow (FR-027)

At ≤ 640 px viewport width:
- Stage band stacks: step label on top, elapsed + spend below.
- Craft strip remains horizontally-scrolling (native scroll-snap).
- Preview stage fills below; iframe height adapts.
- Raw log panel disclosure unchanged.
- Header collapses prompt to one line with ellipsis, abort + close buttons stay ≥ 44 px tap targets.

---

## 4. Realtime contract

The cinema's subscription uses the channel name pattern `engineering:<sessionId>`
(matching the existing pattern at `BuildSession.tsx:106`). Two `postgres_changes`
listeners:

```ts
.channel(`engineering:${sessionId}`)
  .on("postgres_changes", {
    event: "INSERT",
    schema: "public",
    table: "conduit_engineering_logs",
    filter: `session_id=eq.${sessionId}`,
  }, onLog)
  .on("postgres_changes", {
    event: "UPDATE",
    schema: "public",
    table: "conduit_engineering_sessions",
    filter: `id=eq.${sessionId}`,
  }, onSession)
  .subscribe(onStatusChange)
```

`onStatusChange` is the load-bearing addition vs. the existing pattern.

---

## 5. Error boundary contract

### 5.1 File

`src/app/app/builds/[session]/error.tsx`

### 5.2 Signature (Next.js 16)

```tsx
"use client";

import { useEffect } from "react";

export default function CinemaError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
}) { … }
```

Per Next.js 16 `10-error-handling.md`: error boundaries MUST be Client
Components; `unstable_retry` is the framework-blessed retry path (when
present — it's `unstable_*` so the implementer codes defensively if absent).

### 5.3 UX

- Headline: "Something in the live view broke."
- Body: "Your build is still running — we just couldn't keep showing it to you here."
- Primary CTA: "Reopen the live view" → `unstable_retry?.() ?? router.refresh()`.
- Secondary CTA: "Open Vercel preview" → `<a>` with sessionStorage-cached `deploy_url` if present, else hidden.
- Tertiary CTA: "Back to all builds" → `/app/builds`.
- `useEffect` logs `error.digest` to console (not user-visible) for diagnosis.

### 5.4 Non-goals

- Does NOT call `/api/engineering/session/<id>/abort`. The user's build state is uncorrupted; we are only recovering the UI.
- Does NOT render the cinema body in a degraded mode. Clean separation between "the cinema works" and "the cinema crashed".

---

## 6. Routing entry points

The cinema URL is the canonical "open this build" destination from:

| Surface | Trigger | Code change |
|---|---|---|
| `EngineeringBuildButton` modal | Successful POST `/api/engineering/session` | `router.push('/app/builds/${json.session_id}')` replaces `setActiveSessionId` |
| `BuildsTabs` engineering row | Row click | `<Link href={'/app/builds/${s.id}'}>` replaces `onOpen(s.id)` modal mount |
| `EngineeringBuildStrip` (workspace dashboard) | Strip click | Strip wraps `<Link href={'/app/builds/${id}'}>` |
| `PraxisTeamRoster` Engineering card | "1 build in flight" copy click | Nested `<Link>` on the bottom-line span only; `ClickInterceptor` isolates from the card's parent link |
| `Sidebar` `/app/builds` entry | Hover/click | No direct link — sidebar pulse pip is an indicator, not a click target; user clicks sidebar entry to land on `/app/builds` index, then clicks the in-flight row |
| Direct URL paste / bookmark | URL | Routes load identically |

---

## 7. Verification (matches `quickstart.md`)

- Open `/app/builds/<id>` for a known-good session — cinema renders all three stages.
- Refresh the cinema page — state restores fully from server-render + realtime.
- Navigate to `/app/workspace`, then back to `/app/builds/<id>` — state restores.
- Force a render error (e.g. dev-only inject `throw new Error("test")` into `BuildCraftStrip`) — error boundary catches; "Reopen" returns the cinema to working state.
- Visit `/app/builds/<not-your-session-id>` — clean 404.
- Visit `/app/builds?session=<id>` — server-side redirects to `/app/builds/<id>`.
- Mobile sweep (375 + 390) — three stages reflow per §3.4.
- Reduced-motion preference active — entrance animations omitted; curtain rise replaced with opacity fade.
