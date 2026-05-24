# Phase 1 Data Model — Praxis Design Language

**Date**: 2026-05-23
**Status**: Phase 1 complete

This document describes (1) the schema delta for Slice 1, (2) the token
surface that defines the design language, (3) the brand-mark library
shape, and (4) the node-graph derived entities.

---

## 1. Schema delta (Slice 1 only)

### 1.1 `024_memory_node_positions.sql`

```sql
-- R18 Slice 1: forward-compat columns for the Memory canvas v2
-- (drag-to-arrange). v1 uses auto-layout; these columns stay NULL
-- until v2 lands. Both NULL-able; RLS inherited from existing
-- conduit_memory owner policy.

ALTER TABLE conduit_memory
  ADD COLUMN IF NOT EXISTS position_x real,
  ADD COLUMN IF NOT EXISTS position_y real;

-- No index needed — positions are read with the memory rows themselves
-- via the existing account_id scan.
```

**Forward-compat**: v1 ignores the columns; v2 drag-to-arrange UI will
populate them via a PATCH to `/api/conduit/memory/[id]`. The PATCH route
needs to be extended (Slice 1 or a follow-up) to accept `position_x` +
`position_y` in the body — but actual UI drag wiring is OUT OF SCOPE for
Slice 1.

---

## 2. Token surface (Slice 0)

### 2.1 `--pdl-*` token categories

| Category | Tokens (representative; full set in `spec.md §Tokens`) |
|---|---|
| **Canvas tiers** | `--pdl-canvas`, `--pdl-surface`, `--pdl-surface-raised`, `--pdl-surface-glass` |
| **Text tiers** | `--pdl-text`, `--pdl-text-muted`, `--pdl-text-soft` |
| **Borders** | `--pdl-border-hairline`, `--pdl-border-default`, `--pdl-border-strong` |
| **Accent** | `--pdl-accent`, `--pdl-accent-soft`, `--pdl-accent-glow` |
| **Node-graph** | `--pdl-node-fill`, `--pdl-node-border`, `--pdl-node-glow`, `--pdl-edge`, `--pdl-dot-grid`, `--pdl-dot-grid-strong` |
| **Dept jewel-tones** | `--pdl-dept-{employee}-{dark|light}` × 9 employees × 2 modes |
| **Spacing** | `--pdl-space-xs` … `--pdl-space-4xl` (10 steps) |
| **Radii** | `--pdl-radius-sharp` … `--pdl-radius-round` (5 steps) |
| **Elevation** | `--pdl-elev-1` … `--pdl-elev-3`, `--pdl-elev-glow` |
| **Motion durations** | `--pdl-dur-ultra` (120 ms) … `--pdl-dur-celebration` (1200 ms) — 5 steps |
| **Motion easings** | `--pdl-ease`, `--pdl-ease-emphasis`, `--pdl-ease-spring` (3 curves) |

### 2.2 Theme scoping

```css
/* Default = dark (no attribute required) */
.praxis-root {
  --pdl-canvas: #0A0815;
  /* … all dark tokens … */
}

/* Light theme: html[data-praxis-theme="light"] is set pre-paint by ThemeBoot */
html[data-praxis-theme="light"] .praxis-root {
  --pdl-canvas: #F7F4EE;
  /* … all light tokens … */
}
```

This pattern preserves the existing `ThemeBoot.tsx` + R3 light-theme
infrastructure (HR-2 in plan.md).

### 2.3 Utility classes

```css
.pdl-glass { /* glassmorphic surface recipe */ }
.pdl-canvas-grid { /* dotted-grid background */ }
.pdl-canvas-grid[data-strong="true"] { /* heavier dots */ }
```

---

## 3. Brand-mark library (Slice 0)

### 3.1 Vendored marks (top-10)

| Kind | Component | Brand color (light theme) | Brand color (dark theme) |
|---|---|---|---|
| `github` | `BrandMarkGithub` | `#181717` (octocat-black) | `#FFFFFF` |
| `gmail` | `BrandMarkGmail` | full-color (red envelope) | full-color (red envelope) |
| `drive` | `BrandMarkDrive` | full-color (Y/G/B triangle) | full-color |
| `notion` | `BrandMarkNotion` | `#000000` | `#FFFFFF` |
| `slack` | `BrandMarkSlack` | full-color (4-color hash) | full-color |
| `stripe` | `BrandMarkStripe` | `#635BFF` (Stripe purple) | `#FFFFFF` (mono variant) |
| `supabase` | `BrandMarkSupabase` | `#3ECF8E` (Supabase green) | `#3ECF8E` |
| `vercel` | `BrandMarkVercel` | `#000000` | `#FFFFFF` |
| `telegram` | `BrandMarkTelegram` | `#0088CC` (Telegram blue) | `#0088CC` |
| `whatsapp` | `BrandMarkWhatsapp` | `#25D366` (WhatsApp green) | `#25D366` |

Each component:
- Accepts `size: number` (default 24).
- Accepts `className?: string` for theme-aware sizing/positioning hooks.
- Returns inline SVG. Brand colors locked per brand guideline; theme-aware via two-color variants where the brand provides them (GitHub, Notion, Stripe, Vercel).
- Source URL for the canonical SVG is documented in a `// SOURCE:` comment at the top of each file.

### 3.2 `BRAND_MARKS` registry

```ts
// src/components/conduit/brand-marks/index.ts

import { BrandMarkGithub } from "./BrandMarkGithub";
// … 9 more

export type BrandKind =
  | "github" | "gmail" | "drive" | "notion" | "slack"
  | "stripe" | "supabase" | "vercel" | "telegram" | "whatsapp";

export const BRAND_MARKS: Record<BrandKind, React.ComponentType<{ size?: number; className?: string }>> = {
  github: BrandMarkGithub,
  gmail: BrandMarkGmail,
  // …
};
```

### 3.3 `BrandChip` primitive

```ts
// src/components/conduit/pdl/BrandChip.tsx

interface Props {
  kind: BrandKind;
  size?: "sm" | "md" | "lg";  // 20 / 32 / 48 px
  className?: string;
}

// Renders a circular surface chip with the brand mark centered inside.
// Theme-aware via the BRAND_MARKS component's own theme handling.
// Surface uses --pdl-surface in dark mode, --pdl-surface-raised in
// light mode for subtle differentiation.
```

---

## 4. Node-graph derived entities (Slice 1)

### 4.1 `LayoutedMemory` (derived; not persisted)

```ts
// src/components/conduit/memory/auto-layout.ts

import type { MemoryRecord } from "@/lib/ai/memory";

export interface LayoutedMemory extends MemoryRecord {
  /** Resolved position (px from canvas top-left). */
  layoutX: number;
  layoutY: number;
  /** Cluster the node belongs to (drives edge generation). */
  cluster: "global" | EmployeeId;
}

export interface LayoutResult {
  nodes: LayoutedMemory[];
  edges: { from: string; to: string }[];  // from = cluster center, to = node id
}

export function autoLayout(
  memories: MemoryRecord[],
  viewport: { width: number; height: number },
): LayoutResult;
```

### 4.2 Cluster geometry (auto-layout v1)

- **Global cluster center**: viewport center.
- **Dept cluster centers**: 9 points on a circle at radius `R = min(width, height) * 0.32`, starting at 12 o'clock and going clockwise in `EMPLOYEE_ORDER`.
- **Within-cluster layout**: nodes arranged in a 3-column grid centered on the cluster point. Vertical spacing 56 px, horizontal 64 px. Up to 8 nodes per cluster (overflow nodes stack tighter; v2 may pan).
- **Multi-scope memories**: positioned in the FIRST scope's cluster (deterministic via `EMPLOYEE_ORDER`).
- **Manual-position override**: if `memory.position_x !== null && position_y !== null`, USE those values directly (forward-compat with v2 drag-to-arrange).

### 4.3 Edge generation

For each cluster, draw 1 edge from the cluster center (a virtual node, not a memory) to each memory node in that cluster. Edges are subtle curved SVG paths.

Inter-cluster edges (Global → dept clusters) ARE drawn — they emphasize the spatial relationship "global facts inform every dept." These edges are dashed and lower-opacity.

### 4.4 Node tone (color)

A node's tone derives from its memory's scope:
- Empty scope (`global`) → neutral (no dept tint; `--pdl-node-glow` uses accent color).
- Single dept → that dept's jewel-tone (`--pdl-dept-{id}-{theme}`).
- Multiple depts → first-scope's tone (consistent with cluster assignment).

The tone drives `--pdl-node-glow` on that specific node. The node's fill
stays `--pdl-node-fill` (surface color); only the glow changes.

---

## 5. State invariants

- **R17 Slice 1 invariants are preserved.** The per-employee chat-route memory loader (Atlas sees all; others see global + their-scope) continues to function unchanged. The migration is additive; existing scope/pinned/locked columns + `conduit_memory_scope` join table carry forward intact.
- **Auto-layout is deterministic.** Same input memories + same viewport → same output positions. Refresh produces the same canvas every time.
- **`position_x` + `position_y` are NEVER mutated by Slice 1.** They stay NULL for every row. Auto-layout v1 ignores them; only v2 drag-to-arrange will populate (out of scope for R18).
- **Brand marks are static.** The vendored SVG components do not fetch, don't depend on theme context beyond CSS variables. Renders are pure.
- **`pdl/*` primitives are leaf components.** They don't import from `praxis/*`, `builds/*`, `engineering/*`, or any feature surface. They consume only `--pdl-*` tokens + `EMPLOYEE_ICON` registry + `BRAND_MARKS` registry.
