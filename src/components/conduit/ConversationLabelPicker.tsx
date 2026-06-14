"use client";

import { useEffect, useRef, useState } from "react";
import { Tag } from "lucide-react";
import type { Label } from "./ConversationLabelChip";

interface Props {
  conversationId: string;
  allLabels: Label[];
  assigned: Label[];
}

export function ConversationLabelPicker({ conversationId, allLabels, assigned }: Props) {
  const [open, setOpen] = useState(false);
  const [localAssigned, setLocalAssigned] = useState<Label[]>(assigned);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = async (labelId: string, isAssigned: boolean) => {
    if (loading) return;
    setLoading(true);
    const resp = await fetch(`/api/conduit/labels/${labelId}/assign`, {
      method: isAssigned ? "DELETE" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ conversation_id: conversationId }),
    });
    if (resp.ok || resp.status === 201 || resp.status === 204) {
      if (isAssigned) {
        setLocalAssigned((prev) => prev.filter((l) => l.id !== labelId));
      } else {
        const label = allLabels.find((l) => l.id === labelId);
        if (label) setLocalAssigned((prev) => [...prev, label]);
      }
    }
    setLoading(false);
  };

  if (allLabels.length === 0) return null;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        aria-label="Label this conversation"
        title="Label this conversation"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "3px",
          padding: "2px 6px",
          borderRadius: "5px",
          background: "transparent",
          color: "var(--color-text-muted)",
          border: "1px solid var(--color-border)",
          cursor: "pointer",
          fontSize: "11px",
        }}
      >
        <Tag size={10} />
        {localAssigned.length > 0 && <span>{localAssigned.length}</span>}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Labels"
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            background: "var(--color-surface-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            padding: "6px",
            minWidth: "160px",
          }}
        >
          {allLabels.map((l) => {
            const isAssigned = localAssigned.some((a) => a.id === l.id);
            return (
              <button
                key={l.id}
                type="button"
                role="option"
                aria-selected={isAssigned}
                onClick={() => void toggle(l.id, isAssigned)}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "5px 7px",
                  borderRadius: "4px",
                  border: "none",
                  background: isAssigned ? "var(--color-surface-raised)" : "transparent",
                  color: "var(--color-text)",
                  fontSize: "12px",
                  cursor: loading ? "not-allowed" : "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{ width: "8px", height: "8px", borderRadius: "50%", background: l.color, flexShrink: 0 }}
                />
                <span style={{ flex: 1 }}>{l.name}</span>
                {isAssigned && (
                  <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
