"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, MapPin, X } from "lucide-react";

export interface PinnedMessage {
  id: string;
  message_id: string;
  content: string;
  role: string;
  employee?: string | null;
  pinned_at: string;
}

interface Props {
  pins: PinnedMessage[];
  onUnpin: (messageId: string) => void;
  onJumpTo: (messageId: string) => void;
}

function truncate(text: string, max = 80): string {
  const flat = text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  return flat.length > max ? flat.slice(0, max).trimEnd() + "…" : flat;
}

export function PinnedMessagesBanner({ pins, onUnpin, onJumpTo }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (pins.length === 0) return null;

  return (
    <div
      className="rounded-xl overflow-hidden mb-4"
      style={{
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-elevated)",
      }}
    >
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left"
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse pinned messages" : "Expand pinned messages"}
        style={{ background: "transparent" }}
      >
        <div className="flex items-center gap-2">
          <MapPin
            size={13}
            style={{ color: "var(--color-accent)", flexShrink: 0 }}
          />
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Pinned
          </span>
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
            style={{
              background: "var(--color-accent)",
              color: "#fff",
            }}
          >
            {pins.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
        ) : (
          <ChevronDown size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
        )}
      </button>

      {/* Expanded list */}
      {expanded && (
        <div
          className="border-t divide-y"
          style={{
            borderColor: "var(--color-border)",
            "--tw-divide-opacity": 1,
          } as React.CSSProperties}
        >
          {pins.map((pin) => (
            <div
              key={pin.id}
              className="flex items-start gap-3 px-4 py-2.5"
              style={{ borderColor: "var(--color-border)" }}
            >
              <p
                className="flex-1 text-[13px] leading-snug truncate"
                style={{ color: "var(--color-text)" }}
                title={pin.content}
              >
                {truncate(pin.content)}
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onJumpTo(pin.message_id)}
                  aria-label="Jump to message"
                  title="Jump to message"
                  className="text-[11px] px-2 py-0.5 rounded transition-colors"
                  style={{
                    color: "var(--color-accent)",
                    border: "1px solid var(--color-border)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--color-surface-raised)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  ↑ Go
                </button>
                <button
                  type="button"
                  onClick={() => onUnpin(pin.message_id)}
                  aria-label="Unpin message"
                  title="Unpin"
                  className="p-1 rounded transition-colors"
                  style={{ color: "var(--color-text-muted)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--color-text)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)";
                  }}
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
