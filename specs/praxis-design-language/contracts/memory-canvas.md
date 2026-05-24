# Contract — Memory Canvas (Slice 1)

**Files**: `src/app/app/memory/page.tsx` (rewrite), `src/components/conduit/memory/{MemoryCanvas, MemoryNode, MemoryNodeTooltip, MemoryNodeComposer, auto-layout}.tsx`, `src/styles/memory-canvas.css`
**Spec FRs**: P1, P2, P3, P4, P5 (canvas-first surface), P6
**Replaces**: R17 Slice 1 dossier (`MemoryDesk` / `MemorySection` / `MemoryCard` / `MemoryAddForm` — all deleted)

---

## 1. URL contract

- **Canonical**: `/app/memory` (unchanged from R17 Slice 1).
- **Backward-compat**: `/app/settings/memory` → server-redirect to `/app/memory` (unchanged).

---

## 2. Server-render contract

The page server-fetches identically to R17 Slice 1 — same query, same scope
join, same RLS:

```ts
// src/app/app/memory/page.tsx (REWRITE)
export default async function MemoryPage() {
  const current = await getCurrentAccount();
  if (!current) redirect("/auth/sign-in?next=/app/memory");
  const supabase = await createSupabaseServerClient();

  const { data: memoryRows } = await supabase
    .from("conduit_memory")
    .select(
      "id, account_id, kind, content, tags, source_conversation_id, source_message_id, written_by, created_at, updated_at, archived_at, superseded_by, pinned, locked, position_x, position_y",
    )
    .eq("account_id", current.account.id)
    .is("archived_at", null)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  // scope join (unchanged from R17 Slice 1)
  …
  const initial: MemoryRecord[] = …;

  return <MemoryCanvas initial={initial} cap={cap} />;
}
```

`MemoryRecord` extended to include `position_x: number | null` and
`position_y: number | null` (from the new migration).

---

## 3. `MemoryCanvas` orchestrator contract

```ts
interface MemoryCanvasProps {
  initial: MemoryRecord[];
  cap: number;
}
```

Internal state:
- `memories: MemoryRecord[]` — client state, optimistically updated.
- `composerOpen: boolean` + `composerAnchor: {x, y} | null` — toggled by canvas click.
- `selectedNodeId: string | null` — null = no inline edit; populated = composer-style edit panel.

Render:
- Header (small, top-left): `What Praxis knows` + count chip (`47 / 200`). NO "+ Add" button — composer is summoned by canvas click.
- `<Canvas density={1}>` wrapping the dotted-grid.
- Auto-layout runs each render: `const layout = autoLayout(memories, viewport)`.
- For each node in `layout.nodes`: `<MemoryNode memory={…} position={…} />`.
- For each edge in `layout.edges`: `<Edge from={…} to={…} dashed={edge.isInter} tone={…} />`.
- When `composerOpen`: `<MemoryNodeComposer anchor={composerAnchor} onClose={…} onSubmit={…} />`.

Click handler:
- Click on empty canvas → set `composerAnchor` to click point + open composer.
- Click on existing node → open inline edit (replaces tooltip with edit panel; same surface).

---

## 4. `MemoryNode` contract

```ts
interface MemoryNodeProps {
  memory: MemoryRecord;
  position: { x: number; y: number };
  onPatched: (next: Partial<MemoryRecord> & { id: string }) => void;
  onArchived: (id: string) => void;
}
```

Renders:
- `<Node>` primitive at `position`, with `tone` derived from `memory.scope[0]` (or null for global).
- Size: 56 px default; 72 px if `pinned`.
- Glow: brighter if pinned.
- Lock icon overlay (small, top-right) if `locked`.
- Wrapped in `<Tooltip>` with `<MemoryNodeTooltip>` as content.

---

## 5. `MemoryNodeTooltip` contract

Glassmorphic content panel. Shown via `<Tooltip>` (which provides the
.pdl-glass surface).

Content:
- Kind chip (eyebrow style).
- `memory.content` (Fraunces italic, body-lg, line-clamp 3).
- Scope chips row (one `<DeptIcon>` per scope; for global, a small "Everyone" chip).
- Affordance row (4 buttons: pin/unpin, lock/unlock, edit, archive). Each is a small icon button. Buttons are ALWAYS visible inside the tooltip (the tooltip itself is the hover-reveal).

Affordance handlers PATCH to `/api/conduit/memory/[id]` exactly as
R17 Slice 1 (no API changes).

---

## 6. `MemoryNodeComposer` contract

```ts
interface MemoryNodeComposerProps {
  anchor: { x: number; y: number };       // click point
  onClose: () => void;
  onSubmit: (memory: MemoryRecord) => void;
  /** Optional: pre-fill scope (e.g., if the composer was opened from inside a dept cluster region). */
  initialScope?: EmployeeId[];
}
```

Renders:
- A `<Composer>` (glassmorphic shell) positioned near `anchor` (clamped to canvas bounds).
- Above the textarea: `<MemoryKindPicker>` (REUSED from R17 Slice 1) + `<MemoryDeptPicker>` (REUSED).
- Textarea (Fraunces italic).
- Tags input (small inline field).
- Save / Cancel.

Submit:
- POST to `/api/conduit/memory` (unchanged from R17 Slice 1).
- On success: receive the new memory, call `onSubmit(memory)`, parent inserts into state + auto-layout re-runs + new node appears with a pulse.
- Pulse animation: 600 ms scale 0.85 → 1 + glow flash. Reduced-motion: 240 ms opacity fade.

---

## 7. Auto-layout algorithm (Slice 1.B)

```ts
// src/components/conduit/memory/auto-layout.ts

import type { MemoryRecord } from "@/lib/ai/memory";
import { EMPLOYEE_ORDER, type EmployeeId } from "@/lib/conduit/employees";

export interface LayoutedMemory extends MemoryRecord {
  layoutX: number;
  layoutY: number;
  cluster: "global" | EmployeeId;
}

export interface LayoutEdge {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  /** True when this edge crosses cluster boundaries (Global ↔ dept cluster). */
  isInter: boolean;
  tone?: string;
}

export interface LayoutResult {
  nodes: LayoutedMemory[];
  edges: LayoutEdge[];
  /** Cluster anchor points (for debug + future drag). */
  clusters: { id: "global" | EmployeeId; x: number; y: number }[];
}

export function autoLayout(
  memories: MemoryRecord[],
  viewport: { width: number; height: number },
): LayoutResult {
  // Step 1: compute cluster centers.
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  const r = Math.min(viewport.width, viewport.height) * 0.32;
  const clusters: { id: "global" | EmployeeId; x: number; y: number }[] = [
    { id: "global", x: cx, y: cy },
  ];
  EMPLOYEE_ORDER.forEach((emp, i) => {
    const theta = (i / EMPLOYEE_ORDER.length) * Math.PI * 2 - Math.PI / 2;
    clusters.push({
      id: emp,
      x: cx + Math.cos(theta) * r,
      y: cy + Math.sin(theta) * r,
    });
  });

  // Step 2: assign each memory to a cluster.
  // - Empty scope → "global".
  // - Otherwise → first scope in EMPLOYEE_ORDER (deterministic).
  const byCluster = new Map<"global" | EmployeeId, MemoryRecord[]>();
  for (const m of memories) {
    const cluster = m.scope.length === 0
      ? "global"
      : (EMPLOYEE_ORDER.find((e) => m.scope.includes(e)) ?? "global");
    const arr = byCluster.get(cluster) ?? [];
    arr.push(m);
    byCluster.set(cluster, arr);
  }

  // Step 3: layout within each cluster.
  // 3-column grid, vertical spacing 56px, horizontal 64px.
  const nodes: LayoutedMemory[] = [];
  for (const cluster of clusters) {
    const inCluster = byCluster.get(cluster.id) ?? [];
    inCluster.forEach((m, idx) => {
      // Use persisted position if BOTH set (forward-compat v2).
      if (m.position_x !== null && m.position_y !== null) {
        nodes.push({
          ...m,
          layoutX: m.position_x,
          layoutY: m.position_y,
          cluster: cluster.id,
        });
        return;
      }
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const offsetX = (col - 1) * 64;
      const offsetY = row * 56;
      nodes.push({
        ...m,
        layoutX: cluster.x + offsetX,
        layoutY: cluster.y + offsetY,
        cluster: cluster.id,
      });
    });
  }

  // Step 4: generate edges.
  // - Each node → its cluster center (intra-cluster, subtle).
  // - Global cluster center → each dept cluster center (inter-cluster, dashed).
  const edges: LayoutEdge[] = [];
  const globalCenter = clusters[0];
  for (let i = 1; i < clusters.length; i++) {
    edges.push({
      fromX: globalCenter.x,
      fromY: globalCenter.y,
      toX: clusters[i].x,
      toY: clusters[i].y,
      isInter: true,
    });
  }
  for (const node of nodes) {
    const cluster = clusters.find((c) => c.id === node.cluster)!;
    edges.push({
      fromX: cluster.x,
      fromY: cluster.y,
      toX: node.layoutX,
      toY: node.layoutY,
      isInter: false,
    });
  }

  return { nodes, edges, clusters };
}
```

---

## 8. Mobile reflow

At viewport ≤ 640 px:
- Cluster radius shrinks proportionally.
- Within-cluster grid collapses to 2 columns.
- Some dept clusters may overlap if there are many memories; auto-layout v1 accepts this. v2 may add pan or compression.
- Tooltips become full-width sheet from bottom (`<Tooltip>` primitive auto-flips on narrow viewports).

---

## 9. Theme parity

Both themes render the same canvas + node + edge system; tokens drive
the visual difference. Dept jewel-tones in light mode use the deepened
`--pdl-dept-*` values. Glow intensity adjusts via `--pdl-node-glow`
(less opaque in light theme so it doesn't overwhelm the bone canvas).

---

## 10. Verification

See `quickstart.md §2`.

---

## 11. What this surface does NOT do (deferred to v2 or later)

- Drag-to-arrange (positions stay auto-layout in v1; columns exist for forward-compat).
- Pan / zoom (fixed viewport).
- Multi-select / batch operations on nodes.
- Bulk import (P2 from R17 spec; not in scope).
- Source-attribution panel (P3 from R17 spec; not in scope).
- Edge labels (lines are purely visual).
- Node filtering / search (everything is on screen at once).
- Cluster naming customization.
