"use client";

// Top-level orchestrator for the /app/memory surface.
// Sections rendered in order: Global, then EMPLOYEE_ORDER.
// Holds all memories in client state; each section filters its own slice.

import { useCallback, useState } from "react";
import { EMPLOYEE_ORDER, EMPLOYEES, type EmployeeId } from "@/lib/conduit/employees";
import type { MemoryRecord } from "@/lib/ai/memory";
import { MemorySection } from "./MemorySection";

interface Props {
  initial: MemoryRecord[];
  cap: number;
}

function emptyCopyFor(dept: EmployeeId | null): string {
  if (dept === null) {
    return "Nothing global yet. Drop a fact about your business — every employee will know it.";
  }
  const meta = EMPLOYEES[dept];
  const verb =
    dept === "marketing"
      ? "a brand or campaign note"
      : dept === "sales"
        ? "a pipeline or ICP detail"
        : dept === "engineering"
          ? "a tech-stack or repo detail"
          : dept === "finance"
            ? "a runway or pricing fact"
            : dept === "compliance"
              ? "a regulatory note"
              : dept === "hr"
                ? "a team or hiring note"
                : dept === "ops"
                  ? "an SOP or vendor note"
                  : dept === "legal"
                    ? "a contract or counsel note"
                    : "a context note";
  return `${meta.name} doesn't know anything yet — drop ${verb}.`;
}

export function MemoryDesk({ initial, cap }: Props) {
  const [memories, setMemories] = useState<MemoryRecord[]>(initial);

  const onAdded = useCallback((mem: MemoryRecord) => {
    setMemories((prev) => [mem, ...prev]);
  }, []);

  const onPatched = useCallback(
    (next: Partial<MemoryRecord> & { id: string }) => {
      setMemories((prev) =>
        prev.map((m) => (m.id === next.id ? { ...m, ...next } : m)),
      );
    },
    [],
  );

  const onArchived = useCallback((id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const globalMemories = memories.filter((m) => m.scope.length === 0);
  const total = memories.length;

  return (
    <div className="memory-desk">
      <header className="memory-desk-head">
        <div>
          <h1 className="memory-desk-title">What Praxis knows</h1>
          <p className="memory-desk-subtitle">
            Curated by you. Used on every chat turn. Per-department scope and
            pin make it surgical.
          </p>
        </div>
        <div className="memory-desk-cap">
          {total} / {cap}
        </div>
      </header>

      <MemorySection
        dept={null}
        memories={globalMemories}
        emptyCopy={emptyCopyFor(null)}
        onAdded={onAdded}
        onPatched={onPatched}
        onArchived={onArchived}
      />

      {EMPLOYEE_ORDER.map((dept) => {
        const deptMems = memories.filter((m) => m.scope.includes(dept));
        return (
          <MemorySection
            key={dept}
            dept={dept}
            memories={deptMems}
            emptyCopy={emptyCopyFor(dept)}
            onAdded={onAdded}
            onPatched={onPatched}
            onArchived={onArchived}
          />
        );
      })}
    </div>
  );
}
