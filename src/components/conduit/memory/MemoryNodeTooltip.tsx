"use client";

// R18 Slice 1 — MemoryNodeTooltip
//
// Canvas-local glassmorphic tooltip. Replaces the broken pdl <Tooltip>
// primitive per SLICE-0-VALIDATION-PUNCHLIST.md ("nothing happens on
// click; hover state blended/invisible"). Same .pdl-glass visual recipe
// (inlined in memory-canvas.css :: .mem-tooltip), positioned absolutely
// relative to its parent node container — no React Portal, no global
// z-index fight.
//
// Contract: specs/praxis-design-language/contracts/memory-canvas.md §5

import { useState } from "react";
import { Pin, PinOff, Lock, LockOpen, Edit3, Archive } from "lucide-react";
import type { MemoryRecord, MemoryKind } from "@/lib/ai/memory";
import { EMPLOYEES, type EmployeeId } from "@/lib/conduit/employees";
import { DeptIcon } from "@/components/conduit/pdl/DeptIcon";

const KIND_LABEL: Record<MemoryKind, string> = {
  fact: "Fact",
  preference: "Preference",
  decision: "Decision",
  goal: "Goal",
  context: "Context",
};

interface Props {
  memory: MemoryRecord;
  searchQuery?: string;
  onPatched: (next: Partial<MemoryRecord> & { id: string }) => void;
  onArchived: (id: string) => void;
  onEdit: () => void;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        style={{
          background: "color-mix(in srgb, var(--pdl-accent, #5B63E8) 25%, transparent)",
          color: "inherit",
          borderRadius: "2px",
          padding: "0 1px",
        }}
      >
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function MemoryNodeTooltip({
  memory,
  searchQuery = "",
  onPatched,
  onArchived,
  onEdit,
}: Props) {
  const [busy, setBusy] = useState(false);

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const r = await fetch(`/api/conduit/memory/${memory.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.ok) onPatched({ id: memory.id, ...body });
    } finally {
      setBusy(false);
    }
  };

  const archive = async () => {
    if (
      !window.confirm(
        "Archive this memory? You can restore it from the archived view later.",
      )
    )
      return;
    setBusy(true);
    try {
      const r = await fetch(`/api/conduit/memory/${memory.id}`, {
        method: "DELETE",
      });
      if (r.ok) onArchived(memory.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mem-tooltip" role="dialog" aria-label="Memory details">
      <div className="mem-tooltip-kind">{KIND_LABEL[memory.kind] ?? memory.kind}</div>

      <p className="mem-tooltip-content">
        <HighlightedText text={memory.content} query={searchQuery} />
      </p>

      <div className="mem-tooltip-scope">
        {memory.scope.length === 0 ? (
          <span className="mem-tooltip-scope-chip" data-global="true">
            Everyone knows
          </span>
        ) : (
          memory.scope.map((dept) => {
            const meta = EMPLOYEES[dept as EmployeeId];
            return (
              <span
                key={dept}
                className="mem-tooltip-scope-chip"
                style={
                  meta
                    ? ({
                        ["--mem-dept" as string]: meta.color,
                      } as React.CSSProperties)
                    : undefined
                }
              >
                <DeptIcon employee={dept} size={10} />
                {meta?.name ?? dept}
              </span>
            );
          })
        )}
      </div>

      <div className="mem-tooltip-actions">
        <button
          type="button"
          className="mem-tooltip-action"
          data-active={memory.pinned || undefined}
          onClick={() => patch({ pinned: !memory.pinned })}
          disabled={busy}
          title={memory.pinned ? "Unpin" : "Pin (always include in prompts)"}
          aria-label={memory.pinned ? "Unpin memory" : "Pin memory"}
        >
          {memory.pinned ? <PinOff size={13} /> : <Pin size={13} />}
        </button>
        <button
          type="button"
          className="mem-tooltip-action"
          data-active={memory.locked || undefined}
          onClick={() => patch({ locked: !memory.locked })}
          disabled={busy}
          title={memory.locked ? "Unlock (Atlas can supersede)" : "Lock (Atlas can't overwrite)"}
          aria-label={memory.locked ? "Unlock memory" : "Lock memory"}
        >
          {memory.locked ? <LockOpen size={13} /> : <Lock size={13} />}
        </button>
        <button
          type="button"
          className="mem-tooltip-action"
          onClick={onEdit}
          disabled={busy}
          title="Edit"
          aria-label="Edit memory"
        >
          <Edit3 size={13} />
        </button>
        <button
          type="button"
          className="mem-tooltip-action"
          data-destructive="true"
          onClick={archive}
          disabled={busy}
          title="Archive"
          aria-label="Archive memory"
        >
          <Archive size={13} />
        </button>
      </div>
    </div>
  );
}
