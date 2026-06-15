"use client";

import { useRouter } from "next/navigation";
import type { ConversationLabel } from "./ConversationLabels";

export function ConversationLabelFilter({
  labels,
  activeLabelId,
}: {
  labels: ConversationLabel[];
  activeLabelId: string | null;
}) {
  const router = useRouter();

  const toggle = (id: string) => {
    if (activeLabelId === id) {
      router.push("/app/conversations");
    } else {
      router.push(`/app/conversations?label=${id}`);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      {labels.map((label) => {
        const active = activeLabelId === label.id;
        return (
          <button
            key={label.id}
            type="button"
            onClick={() => toggle(label.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={
              active
                ? {
                    background: label.color,
                    color: "#fff",
                    border: "1px solid transparent",
                  }
                : {
                    background: `color-mix(in srgb, ${label.color} 12%, var(--color-surface-elevated))`,
                    color: label.color,
                    border: `1px solid color-mix(in srgb, ${label.color} 35%, transparent)`,
                  }
            }
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: active ? "#fff" : label.color }}
              aria-hidden
            />
            {label.name}
          </button>
        );
      })}
    </div>
  );
}
