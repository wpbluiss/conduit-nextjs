"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { PraxisButton } from "@/components/conduit/ui/Button";

interface Props {
  conversationId: string;
  initialTitle: string | null;
}

export function ConversationTitleEditor({ conversationId, initialTitle }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle ?? "Untitled chat");
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.select();
    }
  }, [editing]);

  const startEdit = useCallback(() => {
    setDraft(title);
    setEditing(true);
  }, [title]);

  const save = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setEditing(false);
      return;
    }
    setEditing(false);
    if (trimmed === title) return;

    const prev = title;
    setTitle(trimmed);
    window.dispatchEvent(
      new CustomEvent("praxis:title_updated", {
        detail: { conversation_id: conversationId, title: trimmed },
      }),
    );

    try {
      const res = await fetch(`/api/conduit/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) {
        setTitle(prev);
        window.dispatchEvent(
          new CustomEvent("praxis:title_updated", {
            detail: { conversation_id: conversationId, title: prev },
          }),
        );
      }
    } catch {
      setTitle(prev);
      window.dispatchEvent(
        new CustomEvent("praxis:title_updated", {
          detail: { conversation_id: conversationId, title: prev },
        }),
      );
    }
  }, [conversationId, draft, title]);

  const cancel = useCallback(() => {
    setEditing(false);
  }, []);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); void save(); }
          if (e.key === "Escape") cancel();
        }}
        onBlur={() => void save()}
        maxLength={160}
        aria-label="Rename conversation"
        className="flex-1 bg-transparent cx-type-base outline-none border-b border-[var(--color-accent)] text-[var(--color-text)] min-w-0 py-0.5"
      />
    );
  }

  return (
    <span className="flex items-center gap-1.5 flex-1 min-w-0 group/title">
      <span className="truncate cx-type-base">{title}</span>
      <PraxisButton
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={(e) => { e.preventDefault(); startEdit(); }}
        aria-label="Rename conversation"
        className="shrink-0 opacity-0 group-hover/title:opacity-100 focus:opacity-100"
      >
        <Pencil size={11} strokeWidth={1.75} />
      </PraxisButton>
    </span>
  );
}
