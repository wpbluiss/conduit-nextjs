// R18 Slice 1 — pure auto-layout for the Memory canvas.
// Cluster-radial: Global at center, 9 dept clusters in a ring, within-
// cluster 3-column grid. Deterministic (same input → same positions).
// Forward-compat: if a memory has both position_x and position_y set,
// use those directly (v2 drag-to-arrange will populate them).
//
// Contract: specs/praxis-design-language/contracts/memory-canvas.md §7

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

export interface ClusterAnchor {
  id: "global" | EmployeeId;
  x: number;
  y: number;
}

export interface LayoutResult {
  nodes: LayoutedMemory[];
  edges: LayoutEdge[];
  clusters: ClusterAnchor[];
}

const COL_SPACING = 64;
const ROW_SPACING = 56;
const RING_RADIUS_RATIO = 0.32;

export function autoLayout(
  memories: MemoryRecord[],
  viewport: { width: number; height: number },
): LayoutResult {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  const r = Math.min(viewport.width, viewport.height) * RING_RADIUS_RATIO;

  // Cluster centers: Global at viewport center; depts on a circle around.
  const clusters: ClusterAnchor[] = [{ id: "global", x: cx, y: cy }];
  EMPLOYEE_ORDER.forEach((emp, i) => {
    const theta = (i / EMPLOYEE_ORDER.length) * Math.PI * 2 - Math.PI / 2;
    clusters.push({
      id: emp,
      x: cx + Math.cos(theta) * r,
      y: cy + Math.sin(theta) * r,
    });
  });

  // Assign each memory to a cluster. Empty scope → global. Multi-scope →
  // first scope in EMPLOYEE_ORDER (deterministic).
  const byCluster = new Map<"global" | EmployeeId, MemoryRecord[]>();
  for (const cluster of clusters) byCluster.set(cluster.id, []);
  for (const m of memories) {
    const cluster: "global" | EmployeeId =
      m.scope.length === 0
        ? "global"
        : (EMPLOYEE_ORDER.find((e) => m.scope.includes(e)) ?? "global");
    byCluster.get(cluster)!.push(m);
  }

  // Lay out within each cluster: 3-column grid centered on the cluster point.
  const nodes: LayoutedMemory[] = [];
  for (const cluster of clusters) {
    const inCluster = byCluster.get(cluster.id) ?? [];
    inCluster.forEach((m, idx) => {
      // Use persisted position if BOTH set (forward-compat with v2 drag).
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
      const offsetX = (col - 1) * COL_SPACING;
      const offsetY = row * ROW_SPACING;
      nodes.push({
        ...m,
        layoutX: cluster.x + offsetX,
        layoutY: cluster.y + offsetY,
        cluster: cluster.id,
      });
    });
  }

  // Edges:
  // - Global cluster center → each dept cluster center (inter, dashed).
  // - Each node → its cluster center (intra, subtle).
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
