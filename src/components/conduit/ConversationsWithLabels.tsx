"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Tag, Trash2, X } from "lucide-react";
import type { Label } from "./ConversationLabelChip";

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#06B6D4", "#3B82F6", "#A855F7", "#EC4899",
  "#14B8A6", "#6B7280",
];

const MAX_LABELS = 10;

interface Props {
  allLabels: Label[];
  filterLabelId: string | null;
}

export function ConversationsWithLabels({ allLabels: initial, filterLabelId }: Props) {
  const router = useRouter();
  const [labels, setLabels] = useState<Label[]>(initial);
  const [formOpen, setFormOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[5]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setFilter = useCallback(
    (id: string | null) => {
      if (id) {
        router.push(`/app/conversations?label=${id}`);
      } else {
        router.push("/app/conversations");
      }
    },
    [router],
  );

  const createLabel = useCallback(async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const resp = await fetch("/api/conduit/labels", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, color: newColor }),
      });
      if (!resp.ok) {
        const j = await resp.json();
        setError(j.message ?? j.error ?? "Could not create label.");
        return;
      }
      const j = await resp.json();
      setLabels((prev) => [...prev, j.label]);
      setNewName("");
      setFormOpen(false);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setCreating(false);
    }
  }, [newName, newColor]);

  const deleteLabel = useCallback(
    async (id: string) => {
      await fetch(`/api/conduit/labels/${id}`, { method: "DELETE" });
      setLabels((prev) => prev.filter((l) => l.id !== id));
      if (filterLabelId === id) setFilter(null);
    },
    [filterLabelId, setFilter],
  );

  if (labels.length === 0 && !formOpen) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          <Tag size={12} />
          Add labels to organize conversations
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-3">
      {/* Filter pills */}
      {(labels.length > 0 || formOpen) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="flex items-center gap-1"
            style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, color: "var(--color-text-muted)" }}
          >
            <Tag size={10} /> Labels
          </span>

          <button
            type="button"
            onClick={() => setFilter(null)}
            style={{
              fontSize: "11px",
              padding: "2px 10px",
              borderRadius: "9999px",
              border: "1px solid var(--color-border)",
              background: !filterLabelId ? "var(--color-accent)" : "transparent",
              color: !filterLabelId ? "var(--color-surface)" : "var(--color-text-muted)",
              cursor: "pointer",
              transition: "all 150ms",
            }}
          >
            All
          </button>

          {labels.map((l) => (
            <div key={l.id} style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
              <button
                type="button"
                onClick={() => setFilter(filterLabelId === l.id ? null : l.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  fontSize: "11px",
                  fontWeight: 500,
                  background: filterLabelId === l.id
                    ? `color-mix(in srgb, ${l.color} 25%, var(--color-surface-elevated))`
                    : `color-mix(in srgb, ${l.color} 10%, var(--color-surface-elevated))`,
                  color: l.color,
                  border: `1px solid color-mix(in srgb, ${l.color} ${filterLabelId === l.id ? "50%" : "25%"}, transparent)`,
                  cursor: "pointer",
                  transition: "all 150ms",
                }}
              >
                <span
                  aria-hidden
                  style={{ width: 5, height: 5, borderRadius: "50%", background: l.color, flexShrink: 0 }}
                />
                {l.name}
              </button>
              <button
                type="button"
                onClick={() => void deleteLabel(l.id)}
                aria-label={`Delete label ${l.name}`}
                title="Delete label"
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  color: "var(--color-text-muted)",
                  border: "none",
                  cursor: "pointer",
                  opacity: 0.6,
                  padding: 0,
                }}
              >
                <Trash2 size={9} />
              </button>
            </div>
          ))}

          {labels.length < MAX_LABELS && (
            <button
              type="button"
              onClick={() => setFormOpen((v) => !v)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "9999px",
                border: "1px dashed var(--color-border)",
                background: "transparent",
                color: "var(--color-text-muted)",
                cursor: "pointer",
              }}
            >
              <Plus size={10} /> New
            </button>
          )}
        </div>
      )}

      {/* Create form */}
      {formOpen && (
        <div
          className="conduit-card p-3 flex flex-col gap-2"
          style={{ maxWidth: "320px" }}
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Label name"
              maxLength={50}
              onKeyDown={(e) => {
                if (e.key === "Enter") void createLabel();
                if (e.key === "Escape") setFormOpen(false);
              }}
              autoFocus
              style={{
                flex: 1,
                background: "var(--color-surface-raised)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                padding: "5px 8px",
                fontSize: "13px",
                color: "var(--color-text)",
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              style={{ color: "var(--color-text-muted)", cursor: "pointer", border: "none", background: "transparent" }}
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                aria-label={`Color ${c}`}
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: c,
                  border: newColor === c ? "2px solid white" : "2px solid transparent",
                  boxShadow: newColor === c ? `0 0 0 2px ${c}` : "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>
          {error && (
            <p style={{ fontSize: "11px", color: "#ef4444" }}>{error}</p>
          )}
          <button
            type="button"
            onClick={() => void createLabel()}
            disabled={creating || !newName.trim()}
            style={{
              alignSelf: "flex-start",
              padding: "4px 12px",
              borderRadius: "6px",
              background: "var(--color-accent)",
              color: "var(--color-surface)",
              border: "none",
              fontSize: "12px",
              cursor: creating || !newName.trim() ? "not-allowed" : "pointer",
              opacity: creating || !newName.trim() ? 0.5 : 1,
            }}
          >
            {creating ? "Creating…" : "Create label"}
          </button>
        </div>
      )}
    </div>
  );
}
