"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CHANGELOG_ENTRIES } from "@/lib/conduit/changelog-entries";
import { PraxisButton } from "@/components/conduit/ui/Button";

const STORAGE_KEY = "praxis_changelog_last_seen";
const RECENT_ENTRIES = CHANGELOG_ENTRIES.slice(0, 5);

const TAG_COLOR: Record<string, { bg: string; color: string }> = {
  feature: {
    bg: "color-mix(in srgb, var(--color-accent) 10%, transparent)",
    color: "var(--color-accent-hi, var(--color-accent))",
  },
  fix: {
    bg: "rgba(22, 163, 74, 0.10)",
    color: "var(--color-green)",
  },
  infra: {
    bg: "rgba(202, 138, 4, 0.10)",
    color: "var(--color-amber)",
  },
};

function getLastSeen(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function setLastSeen(date: string) {
  try {
    localStorage.setItem(STORAGE_KEY, date);
  } catch {
    // ignore
  }
}

function countUnseen(lastSeen: string): number {
  if (!lastSeen) return RECENT_ENTRIES.length;
  return RECENT_ENTRIES.filter((e) => e.date > lastSeen).length;
}

export function ChangelogPopover() {
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeenState] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLastSeenState(getLastSeen());
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const unseen = countUnseen(lastSeen);

  const markAllRead = () => {
    const latest = RECENT_ENTRIES[0]?.date ?? "";
    setLastSeen(latest);
    setLastSeenState(latest);
  };

  const handleOpen = () => {
    setOpen(true);
    markAllRead();
  };

  return (
    <div className="relative">
      <PraxisButton
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        aria-label={`What's new${unseen > 0 ? ` — ${unseen} unread` : ""}`}
        className="relative w-full justify-start"
      >
        <Bell size={14} />
        <span>What&apos;s new</span>
        {unseen > 0 && (
          <span
            aria-hidden
            className="absolute top-1 left-5 flex items-center justify-center w-3.5 h-3.5 rounded-full cx-type-xs font-bold leading-none"
            style={{
              background: "var(--color-accent)",
              color: "#fff",
            }}
          >
            {unseen > 9 ? "9+" : unseen}
          </span>
        )}
      </PraxisButton>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            key="changelog-panel"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            className="cx-glass-float cx-glass-border absolute bottom-full left-0 mb-2 w-64 rounded-xl z-50 overflow-hidden"
            role="dialog"
            aria-label="What's new"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                What&apos;s new
              </span>
              <PraxisButton
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X size={14} />
              </PraxisButton>
            </div>

            {/* Entries */}
            <ul className="divide-y divide-[var(--color-border)] max-h-[60vh] overflow-y-auto">
              {RECENT_ENTRIES.map((e) => {
                const tag = TAG_COLOR[e.tag];
                return (
                  <li key={`${e.date}-${e.title}`} className="px-4 py-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block cx-type-xs uppercase tracking-[0.12em] font-semibold rounded-full px-1.5 py-0.5"
                        style={{ background: tag.bg, color: tag.color }}
                      >
                        {e.tag}
                      </span>
                      <span className="cx-meta tabular-nums">
                        {e.date}
                      </span>
                    </div>
                    <p className="cx-type-sm font-medium leading-snug text-[var(--color-text)]">
                      {e.title}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed line-clamp-2">
                      {e.body}
                    </p>
                  </li>
                );
              })}
            </ul>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[var(--color-border)] flex items-center justify-between">
              <a
                href="/changelog"
                target="_blank"
                rel="noopener noreferrer"
                className="cx-type-xs text-[var(--color-accent)] hover:underline"
                onClick={() => setOpen(false)}
              >
                Full changelog →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
