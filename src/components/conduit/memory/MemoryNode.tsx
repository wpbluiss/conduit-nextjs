"use client";

// R18 Slice 1 — MemoryNode
//
// Wraps the validated pdl <Node> primitive with memory-specific tone,
// kind glyph (Lucide icon per kind — NEVER letter-initials per P1),
// lock overlay, fresh-mount pulse, and the canvas-local
// <MemoryNodeTooltip>.
//
// Hover state managed via React useState so the tooltip can mount as
// a sibling positioned within canvas coordinate space (avoids the
// broken pdl Tooltip primitive's portal/positioning issues).

import { useState, type CSSProperties } from "react";
import {
  Diamond,
  Heart,
  Flag,
  Target,
  Layers,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { Node } from "@/components/conduit/pdl/Node";
import type { MemoryRecord, MemoryKind } from "@/lib/ai/memory";
import { EMPLOYEES, type EmployeeId } from "@/lib/conduit/employees";
import { MemoryNodeTooltip } from "./MemoryNodeTooltip";

const KIND_ICON: Record<MemoryKind, LucideIcon> = {
  fact: Diamond,
  preference: Heart,
  decision: Flag,
  goal: Target,
  context: Layers,
};

interface Props {
  memory: MemoryRecord;
  position: { x: number; y: number };
  /** Recently-added → fires mount pulse. */
  fresh?: boolean;
  /** Filtered out — fade to 20% opacity. */
  dimmed?: boolean;
  /** Active search query — passed to tooltip for highlighting. */
  searchQuery?: string;
  onPatched: (next: Partial<MemoryRecord> & { id: string }) => void;
  onArchived: (id: string) => void;
  onEdit: () => void;
}

// Tooltip positioning relative to the node (px offset).
// Node center is at (position.x, position.y); tooltip's natural origin
// is its top-left corner. We place it to the right of the node at the
// same vertical center, then clamp to viewport in CSS via max-width.
const TOOLTIP_OFFSET_X = 40;
const TOOLTIP_OFFSET_Y = -100;

export function MemoryNode({
  memory,
  position,
  fresh,
  dimmed = false,
  searchQuery = "",
  onPatched,
  onArchived,
  onEdit,
}: Props) {
  const [hovered, setHovered] = useState(false);

  const tone =
    memory.scope.length > 0
      ? EMPLOYEES[memory.scope[0] as EmployeeId]?.color
      : null;
  const size = memory.pinned ? 64 : 52;

  const Icon = KIND_ICON[memory.kind] ?? Diamond;
  const iconSize = memory.pinned ? 22 : 18;

  // Position the wrap at the node center (the pdl Node itself translates
  // -50%, -50% so its center aligns to (left, top)).
  const wrapStyle: CSSProperties = {
    left: position.x,
    top: position.y,
    opacity: dimmed ? 0.2 : 1,
    transition: "opacity 0.15s ease",
  };

  return (
    <div
      className="mem-node-wrap"
      data-fresh={fresh || undefined}
      style={wrapStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Node
        position={{ x: 0, y: 0 }}
        size={size}
        tone={tone ?? undefined}
        state={hovered ? "hover" : "idle"}
        ariaLabel={`${memory.kind}: ${memory.content.slice(0, 60)}`}
      >
        <span className="mem-node-glyph">
          <Icon size={iconSize} strokeWidth={1.75} />
        </span>
      </Node>

      {memory.locked && (
        <span className="mem-node-lock" aria-hidden>
          <Lock size={8} strokeWidth={2.25} />
        </span>
      )}

      {hovered && (
        <div
          style={{
            position: "absolute",
            left: TOOLTIP_OFFSET_X,
            top: TOOLTIP_OFFSET_Y,
            pointerEvents: "auto",
          }}
        >
          <MemoryNodeTooltip
            memory={memory}
            searchQuery={searchQuery}
            onPatched={onPatched}
            onArchived={onArchived}
            onEdit={onEdit}
          />
        </div>
      )}
    </div>
  );
}
