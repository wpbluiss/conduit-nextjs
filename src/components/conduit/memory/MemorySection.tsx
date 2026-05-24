"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { EMPLOYEES, type EmployeeId } from "@/lib/conduit/employees";
import type { MemoryRecord } from "@/lib/ai/memory";
import { MemoryCard } from "./MemoryCard";
import { MemoryAddForm, type NewMemoryDraft } from "./MemoryAddForm";

interface Props {
  /** Section identity: dept id, or null for the Global section. */
  dept: EmployeeId | null;
  memories: MemoryRecord[];
  /** Empty-state copy override for this section. */
  emptyCopy: string;
  /** Called when a memory was added/updated/archived from within this section. */
  onAdded: (mem: MemoryRecord) => void;
  onPatched: (next: Partial<MemoryRecord> & { id: string }) => void;
  onArchived: (id: string) => void;
}

export function MemorySection({
  dept,
  memories,
  emptyCopy,
  onAdded,
  onPatched,
  onArchived,
}: Props) {
  const [adding, setAdding] = useState(false);

  const isGlobal = dept === null;
  const title = isGlobal ? "Everyone knows" : EMPLOYEES[dept].name;
  const eyebrow = isGlobal
    ? "GLOBAL"
    : EMPLOYEES[dept].role.toUpperCase();
  const initialScope: EmployeeId[] = isGlobal ? [] : [dept];

  const pinned = memories.filter((m) => m.pinned);
  const unpinned = memories.filter((m) => !m.pinned);

  const submit = async (draft: NewMemoryDraft) => {
    const r = await fetch("/api/conduit/memory", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    const j = (await r.json().catch(() => ({}))) as {
      memory?: MemoryRecord;
      error?: string;
      message?: string;
    };
    if (!r.ok || !j.memory) {
      throw new Error(j.message ?? j.error ?? `request_${r.status}`);
    }
    // Server returns memory + scope; merge in defaults the API might omit.
    onAdded({
      ...j.memory,
      pinned: j.memory.pinned ?? false,
      locked: j.memory.locked ?? false,
      scope: j.memory.scope ?? draft.scope,
    });
    setAdding(false);
  };

  return (
    <section
      className="memory-section"
      data-dept={dept ?? undefined}
      style={
        dept
          ? ({
              ["--dept" as string]: EMPLOYEES[dept].color,
            } as React.CSSProperties)
          : undefined
      }
    >
      <div className="memory-section-header">
        <div className="memory-section-title">
          <div className="memory-section-eyebrow">{eyebrow}</div>
          <h2 className="memory-section-name">{title}</h2>
          <span className="memory-section-count">
            {memories.length} {memories.length === 1 ? "memory" : "memories"}
          </span>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="memory-section-add-link"
          >
            <Plus size={11} /> Add memory
          </button>
        )}
      </div>

      {adding && (
        <MemoryAddForm
          initialScope={initialScope}
          onCancel={() => setAdding(false)}
          onSubmit={submit}
        />
      )}

      {memories.length === 0 && !adding && (
        <p className="memory-section-empty">{emptyCopy}</p>
      )}

      {pinned.length > 0 && (
        <div className="memory-pinned-bar">
          <div className="memory-pinned-bar-label">Always known</div>
          {pinned.map((m) => (
            <MemoryCard
              key={m.id}
              memory={m}
              onPatched={onPatched}
              onArchived={onArchived}
            />
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {unpinned.map((m) => (
          <MemoryCard
            key={m.id}
            memory={m}
            onPatched={onPatched}
            onArchived={onArchived}
          />
        ))}
      </div>
    </section>
  );
}
