"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

interface Props {
  conversationId: string;
  pinned: boolean;
  atLimit: boolean;
}

export function PinConversationButton({ conversationId, pinned, atLimit }: Props) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState(pinned);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    if (!optimistic && atLimit) {
      setError("Max 5 pinned");
      setTimeout(() => setError(null), 2500);
      return;
    }
    const next = !optimistic;
    setOptimistic(next);
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/conduit/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pinned: next }),
    });
    setBusy(false);
    if (!res.ok) {
      setOptimistic(!next);
      const j = await res.json().catch(() => ({}));
      if (j.error === "pin_limit_reached") {
        setError("Max 5 pinned");
      } else {
        setError("Couldn't update");
      }
      setTimeout(() => setError(null), 2500);
      return;
    }
    router.refresh();
  };

  return (
    <div className="relative shrink-0">
      <button
        onClick={toggle}
        disabled={busy}
        aria-label={optimistic ? "Unpin conversation" : "Pin conversation"}
        title={
          !optimistic && atLimit
            ? "Limit: 5 pinned conversations"
            : optimistic
              ? "Unpin"
              : "Pin"
        }
        className="cx-icon-btn cx-focus-ring disabled:opacity-50"
      >
        <Star
          size={14}
          className={optimistic ? "fill-current" : ""}
          style={{
            strokeWidth: 2,
            color: optimistic
              ? "var(--color-amber)"
              : "var(--color-text-muted)",
          }}
        />
      </button>
      {error && (
        <span
          className="absolute right-0 top-full mt-1 whitespace-nowrap cx-type-xs px-2 py-0.5 rounded pointer-events-none z-10"
          style={{
            background: "var(--color-surface-elevated)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
