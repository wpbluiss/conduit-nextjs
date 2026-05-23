# Contract — Step Taxonomy

**File**: `src/lib/engineering/step-taxonomy.ts`
**Spec FRs**: FR-017, FR-018
**Consumers**: cinema stage band, in-flight strip eyebrow text, in-flight strip celebration / failure interstitials.

---

## 1. Signature

```ts
export interface Step {
  label: string;        // serif display — "Writing", "Deploying", "Shipped"
  eyebrow: string;      // small-caps small text — "BUILDING THE PROJECT"
  kind: StepKind;       // discriminant
  index?: number;       // optional "step N of M"; only set when grounded
  total?: number;
}

export type StepKind =
  | 'queued'
  | 'scaffolding'
  | 'installing'
  | 'writing'
  | 'refining'
  | 'deploying'
  | 'shipped'
  | 'failed'
  | 'stopped'
  | 'investigating'
  | 'unknown';

export function deriveStep(
  session: { status: SessionStatus; deploy_url: string | null; error_message: string | null },
  recentLogs: { ts: string; level: LogLevel; message: string }[],
  heartbeat?: { kind: 'healthy' } | { kind: 'investigating'; since: number },
): Step;
```

`recentLogs` is the trailing-30 tail (consumers slice if they have more). The
function reads from the end backwards.

---

## 2. Priority-ordered rules

First match wins.

### Rule 1 — Heartbeat investigating

If `heartbeat?.kind === 'investigating'` AND `session.status ∈ {pending, running, deploying}`:

```ts
{
  label: 'Investigating',
  eyebrow: 'STILL THINKING',
  kind: 'investigating',
}
```

(Overrides everything else when the heartbeat trips; the user needs to see
"stuck" before "writing".)

### Rule 2 — Terminal statuses

| `session.status` | Step |
|---|---|
| `complete` | `{ label: 'Shipped', eyebrow: 'LIVE', kind: 'shipped' }` |
| `failed` | `{ label: 'Failed', eyebrow: 'DID NOT SHIP', kind: 'failed' }` |
| `timeout` | `{ label: 'Timed out', eyebrow: 'TOOK TOO LONG', kind: 'failed' }` |
| `aborted` | `{ label: 'Stopped', eyebrow: 'YOU STOPPED THE BUILD', kind: 'stopped' }` |

### Rule 3 — `pending`

```ts
{ label: 'Queued', eyebrow: 'WAITING FOR ENGINEERING', kind: 'queued' }
```

### Rule 4 — `deploying`

```ts
{ label: 'Deploying', eyebrow: 'PUSHING TO VERCEL', kind: 'deploying' }
```

### Rule 5 — `running` + recent log heuristics

Scan `recentLogs` from end backwards. First match wins.

#### Rule 5a — `npm install` / `pnpm install` / `yarn install`

If a log message in the last 8 entries matches `/^(npm|pnpm|yarn)\s+install\b|installing dependencies|adding \d+ packages?/i`:

```ts
{ label: 'Installing', eyebrow: 'INSTALLING DEPENDENCIES', kind: 'installing' }
```

#### Rule 5b — Vercel / deploy keywords (but session not yet `deploying`)

If a log message matches `/\bvercel deploy\b|\buploading\b|\bbuilding for production\b/i`:

```ts
{ label: 'Preparing deploy', eyebrow: 'GETTING READY TO SHIP', kind: 'deploying' }
```

#### Rule 5c — Most-recent system EDIT

If the most-recent `system`-level log matches `/^EDIT\s+(.+)$/`:

```ts
{ label: 'Refining', eyebrow: 'REFINING THE PROJECT', kind: 'refining' }
```

(File path goes into the craft strip, not the step label.)

#### Rule 5d — Most-recent system WRITE

If the most-recent `system`-level log matches `/^WRITE\s+(.+)$/`:

```ts
{ label: 'Writing', eyebrow: 'BUILDING THE PROJECT', kind: 'writing' }
```

#### Rule 5e — No file events yet

If `recentLogs` has no system-level WRITE/EDIT lines:

```ts
{ label: 'Scaffolding', eyebrow: 'SETTING UP', kind: 'scaffolding' }
```

### Rule 6 — Fallback

If none of the above match (defensive — shouldn't be reachable):

```ts
{ label: '—', eyebrow: 'WORKING', kind: 'unknown' }
```

---

## 3. File-event derivation (consumed by craft strip, not step label)

Separately from `deriveStep`, the cinema's `BuildCraftStrip` reads:

```ts
export interface FileTouch {
  path: string;
  kind: 'write' | 'edit';
  ts: string;
}

export function deriveFileTouches(logs: LogRow[]): FileTouch[];
```

Implementation:
- Iterate `logs` in order (already time-ASC from the server).
- For each `system`-level log matching `/^(WRITE|EDIT)\s+(.+)$/`:
  - Push `{ path, kind: 'write'|'edit', ts: log.ts }`.
- Return the resulting array.

The craft strip renders the most-recent N (e.g. 12) as chips, ordered by `ts`
DESC. The chip closest to "now" gets the pulse + spark.

`fileCount` (used in the in-flight strip) is `new Set(touches.map(t => t.path)).size`.
`currentFile` is `touches[touches.length - 1]?.path ?? null`.

---

## 4. `index` / `total` ("step N of M")

Deliberately optional. Set to `undefined` for every rule above — because we
cannot honestly ground a step number against worker emissions today (per
Spec Assumption 2 and Constitution Principle 0).

A future refinement (post-Phase A2 verification) MAY add:
- If the worker emits a phase-marker log like `[PHASE 3/7] Installing deps`, parse it into `index/total`.
- Until then, the cinema renders the label without a counter.

The cinema's stage band visual MUST gracefully render with or without
`index/total`. The progress affordance is a soft accent strip under the
label that fills proportionally — when no index, the strip renders as an
ambient ribbon (no fill amount), preserving the visual rhythm without
implying a quantitative progress that we can't substantiate.

---

## 5. Phase A2 verification (re-grounding the heuristic)

The R-006 research decision pinned defaults based on observable emissions
(`WRITE`, `EDIT`, session-status transitions). Phase A2 of the implementation
MUST:

1. Trigger a real build on the Vercel preview.
2. Capture the actual log emissions via `/app/builds/<id>` raw log panel + DB query.
3. Verify the pinned matchers cover every observable phase the user can see.
4. If a phase is observable but unmapped (e.g. a `[STAGE]` line we didn't anticipate), add a matcher rule.
5. Update this contract document in the SAME PR.

Step taxonomy refinements are a code-only change inside `step-taxonomy.ts` —
no spec change, no plan re-gate.

---

## 6. Verification

For each rule (Rule 1, Rule 2 per status, Rule 3, Rule 4, Rules 5a–5e, Rule 6):
- Construct a synthetic `{ session, recentLogs, heartbeat? }` matching the trigger.
- Call `deriveStep(...)`.
- Assert `label`, `eyebrow`, `kind` match this contract.

For file-event derivation:
- Inject a sequence of `WRITE app/page.tsx`, `WRITE app/components/Hero.tsx`, `EDIT app/page.tsx`, `WRITE app/components/CTA.tsx` (system-level logs).
- `deriveFileTouches` returns 4 entries in input order.
- `fileCount` for the cinema returns 3 (distinct paths).
- `currentFile` returns `app/components/CTA.tsx`.
- Craft strip chips: 3 distinct chips rendered, `app/page.tsx` shown as 'edit' kind (kind upgrade from write → edit happens on the most recent touch).
