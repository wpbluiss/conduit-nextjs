"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  Edit3,
  Lock,
  LockOpen,
  Pin,
  PinOff,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { EMPLOYEES, type EmployeeId } from "@/lib/conduit/employees";
import type { MemoryRecord, MemoryKind } from "@/lib/ai/memory";

interface Props {
  memory: MemoryRecord;
  /** Called after a successful PATCH. Parent updates its state from the body. */
  onPatched: (
    next: Partial<MemoryRecord> & { id: string },
  ) => void;
  /** Called after a successful archive. Parent removes from state. */
  onArchived: (id: string) => void;
}

const KIND_LABEL: Record<MemoryKind, string> = {
  fact: "Fact",
  context: "Context",
  preference: "Preference",
  decision: "Decision",
  goal: "Goal",
};

export function MemoryCard({ memory, onPatched, onArchived }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memory.content);
  const [busy, setBusy] = useState(false);

  const isGlobal = memory.scope.length === 0;
  // For dept tinting, pick the FIRST scope (multi-dept memories still get ONE
  // tint — the card is the same regardless of which section it's rendered in;
  // global cards get a neutral tint).
  const tintDept: EmployeeId | undefined =
    memory.scope[0] as EmployeeId | undefined;

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const r = await fetch(`/api/conduit/memory/${memory.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        // Surface error briefly; do not destroy parent state.
        console.error("memory patch failed", r.status);
        return;
      }
      onPatched({ id: memory.id, ...body });
    } finally {
      setBusy(false);
    }
  };

  const archive = async () => {
    if (!window.confirm("Archive this memory? You can restore it from the archived view.")) return;
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

  const saveContent = async () => {
    const trimmed = draft.trim();
    if (trimmed.length < 4 || trimmed.length > 1000) return;
    await patch({ content: trimmed });
    setEditing(false);
  };

  return (
    <div
      className="memory-card"
      data-dept={tintDept}
      data-global={isGlobal || undefined}
      data-pinned={memory.pinned || undefined}
    >
      <div className="memory-card-body">
        <div className="memory-card-kind">
          {KIND_LABEL[memory.kind] ?? memory.kind}
          {memory.locked && (
            <span style={{ marginLeft: 6, color: "var(--color-text)" }}>
              · locked
            </span>
          )}
        </div>

        {editing ? (
          <>
            <textarea
              className="memory-card-edit-textarea"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={1000}
              autoFocus
              disabled={busy}
              rows={3}
            />
            <div className="memory-card-edit-actions">
              <button
                type="button"
                onClick={saveContent}
                disabled={busy || draft.trim().length < 4}
                className="btn-primary inline-flex items-center gap-1.5"
              >
                {busy && <Loader2 size={11} className="animate-spin" />}
                <Check size={12} /> Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(memory.content);
                  setEditing(false);
                }}
                disabled={busy}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] px-3"
              >
                <X size={12} style={{ display: "inline" }} /> Cancel
              </button>
            </div>
          </>
        ) : (
          <p className="memory-card-content">{memory.content}</p>
        )}

        {memory.tags && memory.tags.length > 0 && !editing && (
          <div className="memory-card-meta">
            {memory.tags.map((t) => (
              <span key={t} className="memory-card-meta-tag">
                #{t}
              </span>
            ))}
          </div>
        )}

        {!editing && memory.scope.length > 0 && (
          <div className="memory-card-scope">
            {memory.scope.map((dept) => {
              const meta = EMPLOYEES[dept as EmployeeId];
              return (
                <span
                  key={dept}
                  className="memory-card-scope-chip"
                  data-dept={dept}
                  style={
                    {
                      ["--dept" as string]: meta.color,
                    } as React.CSSProperties
                  }
                >
                  {meta.name}
                </span>
              );
            })}
          </div>
        )}

        {!editing &&
          memory.source_conversation_id &&
          memory.written_by !== "user" && (
            <div className="memory-card-meta">
              <Link
                href={`/app?c=${memory.source_conversation_id}`}
                className="memory-card-meta-source"
              >
                via {memory.written_by === "jarvis" ? "Atlas" : memory.written_by} ↗
              </Link>
            </div>
          )}
      </div>

      {!editing && (
        <div className="memory-card-actions">
          <button
            type="button"
            onClick={() => patch({ pinned: !memory.pinned })}
            disabled={busy}
            className="memory-card-action"
            data-active={memory.pinned || undefined}
            title={memory.pinned ? "Unpin (allow trim)" : "Pin (always include)"}
            aria-label={memory.pinned ? "Unpin memory" : "Pin memory"}
          >
            {memory.pinned ? <PinOff size={12} /> : <Pin size={12} />}
          </button>
          <button
            type="button"
            onClick={() => patch({ locked: !memory.locked })}
            disabled={busy}
            className="memory-card-action"
            data-active={memory.locked || undefined}
            title={memory.locked ? "Unlock (Atlas can supersede)" : "Lock (Atlas can't overwrite)"}
            aria-label={memory.locked ? "Unlock memory" : "Lock memory"}
          >
            {memory.locked ? <LockOpen size={12} /> : <Lock size={12} />}
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="memory-card-action"
            title="Edit content"
            aria-label="Edit memory"
          >
            <Edit3 size={12} />
          </button>
          <button
            type="button"
            onClick={archive}
            disabled={busy}
            className="memory-card-action"
            title="Archive"
            aria-label="Archive memory"
          >
            <Archive size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
