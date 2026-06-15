"use client";

// R18 Slice 1 — MemoryNodeComposer
//
// Canvas-local glassmorphic composer. Replaces the broken pdl Drawer /
// Modal path for inline canvas adds. Reuses the validated R17 Slice 1
// MemoryKindPicker + MemoryDeptPicker components as the header.
//
// Two modes:
//   - ADD: anchor at canvas click point; POST /api/conduit/memory.
//   - EDIT: anchor at existing node position; PATCH /api/conduit/memory/[id].
//
// Contract: specs/praxis-design-language/contracts/memory-canvas.md §6

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { PraxisButton } from "@/components/conduit/PraxisButton";
import type { MemoryKind, MemoryRecord } from "@/lib/ai/memory";
import type { EmployeeId } from "@/lib/conduit/employees";
import { MemoryKindPicker } from "./MemoryKindPicker";
import { MemoryDeptPicker } from "./MemoryDeptPicker";

interface Props {
  anchor: { x: number; y: number };
  onClose: () => void;
  onSubmit: (memory: MemoryRecord) => void;
  initialScope?: EmployeeId[];
  /** When set, composer is in EDIT mode (PATCH); otherwise ADD (POST). */
  existingMemory?: MemoryRecord;
}

// Composer panel width — used for left-edge clamping.
const PANEL_WIDTH = 360;
const EDGE_PAD = 16;

export function MemoryNodeComposer({
  anchor,
  onClose,
  onSubmit,
  initialScope,
  existingMemory,
}: Props) {
  const editing = !!existingMemory;
  const [kind, setKind] = useState<MemoryKind>(existingMemory?.kind ?? "fact");
  const [content, setContent] = useState(existingMemory?.content ?? "");
  const [scope, setScope] = useState<EmployeeId[]>(
    existingMemory?.scope ?? initialScope ?? [],
  );
  const [tagsRaw, setTagsRaw] = useState(
    (existingMemory?.tags ?? []).join(", "),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape; outside-click handled by canvas-level click target.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Clamp position so the panel stays on-canvas. We position via inline
  // style; CSS handles mobile-sheet override.
  const left = Math.max(
    EDGE_PAD,
    Math.min(anchor.x, (window?.innerWidth ?? 1000) - PANEL_WIDTH - EDGE_PAD),
  );
  const top = Math.max(EDGE_PAD, anchor.y);

  const submit = async () => {
    const trimmed = content.trim();
    if (trimmed.length < 4) {
      setError("Tell Praxis a bit more — 4+ characters.");
      return;
    }
    if (trimmed.length > 1000) {
      setError("Keep it under 1000 characters.");
      return;
    }
    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0 && t.length < 32)
      .slice(0, 5);

    setBusy(true);
    setError(null);
    try {
      if (editing && existingMemory) {
        const r = await fetch(`/api/conduit/memory/${existingMemory.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind, content: trimmed, tags, scope }),
        });
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string; message?: string };
          setError(j.message ?? j.error ?? `request_${r.status}`);
          return;
        }
        // PATCH returns { ok: true } — synthesize the next state locally.
        onSubmit({
          ...existingMemory,
          kind,
          content: trimmed,
          tags,
          scope,
        });
      } else {
        const r = await fetch("/api/conduit/memory", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind, content: trimmed, tags, scope }),
        });
        const j = (await r.json().catch(() => ({}))) as {
          memory?: MemoryRecord;
          error?: string;
          message?: string;
        };
        if (!r.ok || !j.memory) {
          setError(j.message ?? j.error ?? `request_${r.status}`);
          return;
        }
        onSubmit({
          ...j.memory,
          pinned: j.memory.pinned ?? false,
          locked: j.memory.locked ?? false,
          scope: j.memory.scope ?? scope,
          position_x: j.memory.position_x ?? null,
          position_y: j.memory.position_y ?? null,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "save_failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      ref={panelRef}
      className="mem-composer"
      style={{ left, top }}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={editing ? "Edit memory" : "Add memory"}
    >
      <div>
        <div className="mem-composer-label" style={{ marginBottom: 6 }}>
          Kind
        </div>
        <MemoryKindPicker value={kind} onChange={setKind} />
      </div>

      <div>
        <div className="mem-composer-label" style={{ marginBottom: 6 }}>
          Who should know this?
        </div>
        <MemoryDeptPicker value={scope} onChange={setScope} />
      </div>

      <div>
        <div className="mem-composer-label" style={{ marginBottom: 6 }}>
          What should Praxis know?
        </div>
        <textarea
          className="mem-composer-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write 1–2 sentences in third person. e.g. “User runs Lunaro, an insurance CRM for Medicare agents.”"
          maxLength={1000}
          disabled={busy}
          autoFocus
        />
      </div>

      <div>
        <div className="mem-composer-label" style={{ marginBottom: 6 }}>
          Tags (optional)
        </div>
        <input
          type="text"
          className="mem-composer-tags-input"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="brand, voice, icp"
          disabled={busy}
        />
      </div>

      {error && <p className="mem-composer-error">{error}</p>}

      <div className="mem-composer-actions">
        <PraxisButton
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={busy}
          className="mem-composer-cancel"
        >
          Cancel
        </PraxisButton>
        <PraxisButton
          variant="primary"
          size="sm"
          onClick={submit}
          disabled={busy || content.trim().length < 4}
          className="mem-composer-save"
        >
          {busy && (
            <Loader2
              size={12}
              className="animate-spin"
              style={{ marginRight: 6, display: "inline-block", verticalAlign: "middle" }}
            />
          )}
          {editing ? "Save" : "Add memory"}
        </PraxisButton>
      </div>
    </div>
  );
}
