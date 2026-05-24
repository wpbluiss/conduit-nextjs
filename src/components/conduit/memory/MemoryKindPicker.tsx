"use client";

import type { MemoryKind } from "@/lib/ai/memory";

const KINDS: { id: MemoryKind; label: string }[] = [
  { id: "fact", label: "Fact" },
  { id: "context", label: "Context" },
  { id: "preference", label: "Preference" },
  { id: "decision", label: "Decision" },
  { id: "goal", label: "Goal" },
];

interface Props {
  value: MemoryKind;
  onChange: (kind: MemoryKind) => void;
}

export function MemoryKindPicker({ value, onChange }: Props) {
  return (
    <div className="memory-kind-picker" role="radiogroup" aria-label="Memory kind">
      {KINDS.map((k) => {
        const active = value === k.id;
        return (
          <button
            key={k.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(k.id)}
            className="memory-kind-chip"
            data-active={active || undefined}
          >
            {k.label}
          </button>
        );
      })}
    </div>
  );
}
