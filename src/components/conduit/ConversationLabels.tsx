"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Tag, X } from "lucide-react";
import { PraxisButton } from "@/components/conduit/PraxisButton";

export interface ConversationLabel {
  id: string;
  name: string;
  color: string;
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#a855f7", // purple
  "#ec4899", // pink
  "#6b7280", // gray
];

function LabelChip({
  label,
  removable,
  onRemove,
}: {
  label: ConversationLabel;
  removable?: boolean;
  onRemove?: () => void;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full cx-type-xs font-medium"
      style={{
        background: `color-mix(in srgb, ${label.color} 15%, var(--color-surface-elevated))`,
        color: label.color,
        border: `1px solid color-mix(in srgb, ${label.color} 40%, transparent)`,
      }}
    >
      {label.name}
      {removable && (
        <PraxisButton
          variant="ghost"
          size="icon-sm"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onRemove?.(); }}
          aria-label={`Remove label ${label.name}`}
          className="ml-0.5"
        >
          <X size={9} strokeWidth={2.5} />
        </PraxisButton>
      )}
    </span>
  );
}

export function ConversationLabelsDisplay({
  labels,
}: {
  labels: ConversationLabel[];
}) {
  if (labels.length === 0) return null;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {labels.map((l) => (
        <LabelChip key={l.id} label={l} />
      ))}
    </div>
  );
}

export function ConversationLabelManager({
  conversationId,
  assignedLabels,
  allLabels,
  onUpdate,
  compact,
}: {
  conversationId: string;
  assignedLabels: ConversationLabel[];
  allLabels: ConversationLabel[];
  onUpdate: (labels: ConversationLabel[]) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [assigned, setAssigned] = useState<ConversationLabel[]>(assignedLabels);
  const [all, setAll] = useState<ConversationLabel[]>(allLabels);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[6]);
  const [busy, setBusy] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  // Sync when parent updates labels (e.g. async fetch in Chat)
  useEffect(() => { setAssigned(assignedLabels); }, [assignedLabels]);
  useEffect(() => { setAll(allLabels); }, [allLabels]);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const toggle = useCallback(async (label: ConversationLabel) => {
    const isAssigned = assigned.some((l) => l.id === label.id);
    const next = isAssigned
      ? assigned.filter((l) => l.id !== label.id)
      : [...assigned, label];
    setAssigned(next);
    onUpdate(next);

    if (isAssigned) {
      await fetch(`/api/conduit/conversations/${conversationId}/labels/${label.id}`, {
        method: "DELETE",
      });
    } else {
      await fetch(`/api/conduit/conversations/${conversationId}/labels`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ labelId: label.id }),
      });
    }
  }, [assigned, conversationId, onUpdate]);

  const createLabel = useCallback(async () => {
    const name = newName.trim();
    if (!name || busy) return;
    setBusy(true);
    const r = await fetch("/api/conduit/labels", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, color: newColor }),
    });
    if (r.ok) {
      const { label } = await r.json() as { label: ConversationLabel };
      const nextAll = [...all, label];
      const nextAssigned = [...assigned, label];
      setAll(nextAll);
      setAssigned(nextAssigned);
      onUpdate(nextAssigned);
      // Assign to conversation
      await fetch(`/api/conduit/conversations/${conversationId}/labels`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ labelId: label.id }),
      });
      setNewName("");
      setCreating(false);
    }
    setBusy(false);
  }, [all, assigned, busy, conversationId, newColor, newName, onUpdate]);

  const removeLabel = useCallback(async (label: ConversationLabel) => {
    const next = assigned.filter((l) => l.id !== label.id);
    setAssigned(next);
    onUpdate(next);
    await fetch(`/api/conduit/conversations/${conversationId}/labels/${label.id}`, {
      method: "DELETE",
    });
  }, [assigned, conversationId, onUpdate]);

  if (compact) {
    return (
      <div className="relative" ref={popRef}>
        <button
          type="button"
          onClick={() => { setOpen((v) => !v); setCreating(false); }}
          aria-label="Manage conversation labels"
          title="Labels"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cx-type-xs transition-colors"
          style={{
            color: assigned.length > 0 ? "var(--color-text)" : "var(--color-text-muted)",
            border: open ? "1px solid var(--color-border)" : "1px solid transparent",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--color-text)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = assigned.length > 0 ? "var(--color-text)" : "var(--color-text-muted)";
            (e.currentTarget as HTMLElement).style.borderColor = open ? "var(--color-border)" : "transparent";
          }}
        >
          <Tag size={12} />
          <span className="hidden sm:inline">Labels</span>
          {assigned.length > 0 && (
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full cx-type-xs font-medium text-white"
              style={{ background: assigned[0].color }}
            >
              {assigned.length}
            </span>
          )}
        </button>
        {open && (
          <div
            className="cx-glass-float cx-glass-border absolute top-full right-0 mt-1.5 z-50 rounded-xl overflow-hidden"
            style={{ minWidth: "200px" }}
          >
            {all.length > 0 && (
              <div className="p-2 space-y-0.5 max-h-48 overflow-y-auto">
                {all.map((label) => {
                  const isOn = assigned.some((l) => l.id === label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => void toggle(label)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-[var(--color-surface)] transition-colors"
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{
                          background: label.color,
                          outline: isOn ? `2px solid ${label.color}` : "none",
                          outlineOffset: "2px",
                        }}
                      />
                      <span className="flex-1 truncate text-left text-[var(--color-text)]">{label.name}</span>
                      {isOn && <span className="cx-type-xs" style={{ color: label.color }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
            {all.length === 0 && (
              <p className="px-3 py-3 text-xs text-[var(--color-text-muted)]">
                No labels yet. Create some in{" "}
                <a href="/app/settings?tab=labels" className="underline">Settings → Labels</a>.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-flex flex-wrap items-center gap-1">
      {assigned.map((l) => (
        <LabelChip key={l.id} label={l} removable onRemove={() => void removeLabel(l)} />
      ))}
      <div className="relative" ref={popRef}>
        <button
          type="button"
          onClick={() => { setOpen((v) => !v); setCreating(false); }}
          aria-label="Add or manage labels"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full cx-type-xs transition-colors"
          style={{
            color: "var(--color-text-muted)",
            border: "1px dashed var(--color-border)",
          }}
        >
          <Tag size={10} />
          {assigned.length === 0 ? "Add label" : ""}
        </button>

        {open && (
          <div
            className="cx-glass-float cx-glass-border absolute top-full left-0 mt-1.5 z-50 rounded-xl overflow-hidden"
            style={{ minWidth: "200px" }}
          >
            {/* Existing labels */}
            {all.length > 0 && (
              <div className="p-2 space-y-0.5 max-h-48 overflow-y-auto">
                {all.map((label) => {
                  const isOn = assigned.some((l) => l.id === label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => void toggle(label)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-[var(--color-surface)] transition-colors"
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{
                          background: label.color,
                          outline: isOn ? `2px solid ${label.color}` : "none",
                          outlineOffset: "2px",
                        }}
                      />
                      <span className="flex-1 truncate text-left text-[var(--color-text)]">
                        {label.name}
                      </span>
                      {isOn && (
                        <span className="cx-type-xs" style={{ color: label.color }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Create new label */}
            {!creating ? (
              <PraxisButton
                variant="ghost"
                size="sm"
                onClick={() => setCreating(true)}
                disabled={all.length >= 10}
                className="w-full flex items-center gap-1.5 px-3 py-2 border-t disabled:opacity-40"
                style={{ borderColor: "var(--color-border)" }}
              >
                <Plus size={12} />
                {all.length >= 10 ? "Label limit reached (10)" : "Create new label"}
              </PraxisButton>
            ) : (
              <div className="p-2 border-t space-y-2" style={{ borderColor: "var(--color-border)" }}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Label name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.slice(0, 32))}
                  onKeyDown={(e) => { if (e.key === "Enter") void createLabel(); if (e.key === "Escape") setCreating(false); }}
                  maxLength={32}
                  className="w-full px-2 py-1 text-xs rounded-lg border outline-none"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text)",
                  }}
                />
                <div className="flex flex-wrap gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      aria-label={`Color ${c}`}
                      className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: c,
                        outline: newColor === c ? `2px solid ${c}` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => void createLabel()}
                    disabled={!newName.trim() || busy}
                    className="flex-1 px-2 py-1 rounded-lg cx-type-xs font-medium text-white transition-opacity disabled:opacity-50"
                    style={{ background: newColor }}
                  >
                    {busy ? "Creating…" : "Create"}
                  </button>
                  <PraxisButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setCreating(false)}
                  >
                    Cancel
                  </PraxisButton>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
