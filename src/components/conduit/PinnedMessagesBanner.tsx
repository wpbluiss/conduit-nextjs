"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, MapPin, X } from "lucide-react";
import { PraxisButton } from "@/components/conduit/PraxisButton";

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
      <PraxisButton
        type="button"
        variant="ghost"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse pinned messages" : "Expand pinned messages"}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <MapPin
            size={13}
            style={{ color: "var(--color-accent)", flexShrink: 0 }}
          />
          <span
            className="cx-type-xs font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Pinned
          </span>
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full cx-type-xs font-bold"
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
      </PraxisButton>

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
                className="flex-1 cx-type-sm leading-snug truncate"
                style={{ color: "var(--color-text)" }}
                title={pin.content}
              >
                {truncate(pin.content)}
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                <PraxisButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onJumpTo(pin.message_id)}
                  aria-label="Jump to message"
                  title="Jump to message"
                  className="cx-type-xs"
                >
                  ↑ Go
                </PraxisButton>
                <PraxisButton
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onUnpin(pin.message_id)}
                  aria-label="Unpin message"
                  title="Unpin"
                >
                  <X size={11} />
                </PraxisButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
