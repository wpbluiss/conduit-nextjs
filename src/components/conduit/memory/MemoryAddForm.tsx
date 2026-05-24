"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { MemoryKind } from "@/lib/ai/memory";
import type { EmployeeId } from "@/lib/conduit/employees";
import { MemoryKindPicker } from "./MemoryKindPicker";
import { MemoryDeptPicker } from "./MemoryDeptPicker";

export interface NewMemoryDraft {
  kind: MemoryKind;
  content: string;
  tags: string[];
  scope: EmployeeId[];
}

interface Props {
  /** Pre-fill scope (e.g., when opened from a specific dept section). */
  initialScope: EmployeeId[];
  onCancel: () => void;
  onSubmit: (draft: NewMemoryDraft) => Promise<void>;
}

export function MemoryAddForm({ initialScope, onCancel, onSubmit }: Props) {
  const [kind, setKind] = useState<MemoryKind>("fact");
  const [content, setContent] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [scope, setScope] = useState<EmployeeId[]>(initialScope);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = content.trim();
    if (trimmed.length < 4) {
      setError("Write a bit more — 4+ characters.");
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
      await onSubmit({ kind, content: trimmed, tags, scope });
    } catch (err) {
      setError(err instanceof Error ? err.message : "save_failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="memory-add-form">
      <div>
        <div className="memory-add-form-label">Kind</div>
        <MemoryKindPicker value={kind} onChange={setKind} />
      </div>

      <div>
        <div className="memory-add-form-label">Who should know this?</div>
        <MemoryDeptPicker value={scope} onChange={setScope} />
      </div>

      <div>
        <div className="memory-add-form-label">What should Praxis know?</div>
        <textarea
          className="memory-add-form-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write 1–2 sentences in third person. e.g. “User runs Lunaro, an insurance CRM for Medicare agents.”"
          rows={3}
          maxLength={1000}
          disabled={busy}
        />
      </div>

      <div>
        <div className="memory-add-form-label">Tags (optional)</div>
        <input
          type="text"
          className="memory-add-form-input"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="brand, voice, icp"
          disabled={busy}
        />
      </div>

      {error && <p className="memory-add-form-error">{error}</p>}

      <div className="memory-add-form-actions">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] px-3 py-1.5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={busy || content.trim().length < 4}
          className="btn-primary inline-flex items-center gap-1.5"
        >
          {busy && <Loader2 size={12} className="animate-spin" />}
          Save memory
        </button>
      </div>
    </div>
  );
}
