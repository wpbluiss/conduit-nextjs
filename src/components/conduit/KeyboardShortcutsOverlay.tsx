"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; label: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["N"], label: "New chat" },
      { keys: ["G", "C"], label: "Go to Conversations" },
      { keys: ["G", "S"], label: "Go to Settings" },
      { keys: ["G", "M"], label: "Go to Memory" },
      { keys: ["G", "B"], label: "Go to Builds" },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { keys: ["?"], label: "Open keyboard shortcuts" },
      { keys: ["Esc"], label: "Close overlay / sidebar" },
    ],
  },
];

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = (el as HTMLElement).tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function KeyboardShortcutsOverlay() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout> | null = null;

    const onKey = (e: KeyboardEvent) => {
      // Skip if any modifier key is held
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Skip if focus is inside an input
      if (isInputFocused()) return;

      // ? → toggle overlay
      if (e.key === "?") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      // Esc → close overlay
      if (e.key === "Escape" && open) {
        setOpen(false);
        return;
      }

      // N → new chat
      if (e.key === "n" || e.key === "N") {
        if (!open) {
          e.preventDefault();
          router.push("/app");
          router.refresh();
        }
        return;
      }

      // G + <letter> chord navigation
      if (e.key === "g" || e.key === "G") {
        gPressed = true;
        if (gTimer) clearTimeout(gTimer);
        gTimer = setTimeout(() => { gPressed = false; }, 800);
        return;
      }

      if (gPressed) {
        gPressed = false;
        if (gTimer) clearTimeout(gTimer);
        const nav: Record<string, string> = {
          c: "/app/conversations",
          C: "/app/conversations",
          s: "/app/settings",
          S: "/app/settings",
          m: "/app/memory",
          M: "/app/memory",
          b: "/app/builds",
          B: "/app/builds",
        };
        if (nav[e.key]) {
          e.preventDefault();
          router.push(nav[e.key]);
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (gTimer) clearTimeout(gTimer);
    };
  }, [open, router]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="kb-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[100] bg-black/50"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <motion.div
            key="kb-panel"
            role="dialog"
            aria-label="Keyboard shortcuts"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-sm rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden"
              style={{ background: "var(--color-surface-elevated)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <Keyboard size={15} className="text-[var(--color-text-muted)]" />
                  <span className="text-sm font-medium">Keyboard shortcuts</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Groups */}
              <div className="px-5 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
                {SHORTCUT_GROUPS.map((group) => (
                  <div key={group.title}>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">
                      {group.title}
                    </div>
                    <div className="space-y-1.5">
                      {group.shortcuts.map((s) => (
                        <div
                          key={s.label}
                          className="flex items-center justify-between gap-4"
                        >
                          <span className="text-sm text-[var(--color-text)]">
                            {s.label}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {s.keys.map((k, i) => (
                              <span key={k}>
                                {i > 0 && (
                                  <span className="text-[10px] text-[var(--color-text-muted)] mx-0.5">
                                    then
                                  </span>
                                )}
                                <kbd
                                  className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 text-[11px] font-mono rounded border"
                                  style={{
                                    background: "var(--color-surface)",
                                    borderColor: "var(--color-border)",
                                    color: "var(--color-text-muted)",
                                  }}
                                >
                                  {k}
                                </kbd>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-[var(--color-border)]">
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Shortcuts are disabled when typing in text fields.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
