"use client";

import { useState, useRef, useEffect } from "react";
import { Bookmark, BookmarkCheck, X } from "lucide-react";
import { Button, PraxisButton } from "@/components/conduit/ui/Button";

interface Props {
  messageId: string;
  content: string;
  specialist: string;
  conversationId?: string;
  suggestedTitle?: string;
}

export function SaveOutputButton({ messageId, content, specialist, conversationId, suggestedTitle = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(suggestedTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [open]);

  const save = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/conduit/outputs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content,
          specialist,
          source_message_id: messageId,
          source_conversation_id: conversationId,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setOpen(false);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="relative">
      <PraxisButton
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => {
          if (saved) return;
          setOpen((v) => !v);
        }}
        aria-label={saved ? "Saved to Outputs" : "Save as output"}
        title={saved ? "Saved to Outputs" : "Save as output"}
        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
        style={{ color: saved ? "var(--color-accent)" : undefined }}
      >
        {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
        <span className="hidden md:inline cx-type-xs">{saved ? "Saved" : "Save"}</span>
      </PraxisButton>

      {open && (
        <div
          className="cx-glass-float cx-glass-border absolute bottom-full left-0 mb-2 z-30 rounded-xl p-3 w-64"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="cx-type-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
              Save as output
            </span>
            <PraxisButton
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="p-0.5"
            >
              <X size={12} />
            </PraxisButton>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void save();
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Name this output…"
            maxLength={200}
            className="w-full rounded-lg px-2.5 py-1.5 cx-type-base outline-none mb-2"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          />
          <Button
            type="button"
            onClick={() => void save()}
            isDisabled={!title.trim()}
            isLoading={busy}
            loadingText="Saving…"
            variant="primary"
            size="sm"
            className="w-full"
          >
            Save to Outputs
          </Button>
        </div>
      )}
    </span>
  );
}
