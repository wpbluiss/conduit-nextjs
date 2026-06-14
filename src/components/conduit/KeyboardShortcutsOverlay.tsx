"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; label: string }[];
}

function buildShortcutGroups(isMac: boolean): ShortcutGroup[] {
  const mod = isMac ? "⌘" : "Ctrl";
  return [
    {
      title: "Navigation",
      shortcuts: [
        { keys: ["N"], label: "New chat" },
        { keys: ["G", "C"], label: "Go to Conversations" },
        { keys: ["G", "S"], label: "Go to Settings" },
        { keys: ["G", "M"], label: "Go to Memory" },
        { keys: ["G", "B"], label: "Go to Builds" },
        { keys: ["/"], label: "Focus conversation search" },
      ],
    },
    {
      title: "Chat",
      shortcuts: [
        { keys: [`${mod}↵`], label: "Send message" },
      ],
    },
    {
      title: "General",
      shortcuts: [
        { keys: [`${mod}K`], label: "Open command palette" },
        { keys: [`${mod}⇧S`], label: "Toggle sidebar" },
        { keys: ["?"], label: "Open keyboard shortcuts" },
        { keys: ["Esc"], label: "Close overlay / sidebar" },
      ],
    },
  ];
}

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
  const [isMac, setIsMac] = useState(false);
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().startsWith("MAC"));
  }, []);

  // External trigger — sidebar ? button dispatches this event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("praxis:shortcuts:open", handler);
    return () => window.removeEventListener("praxis:shortcuts:open", handler);
  }, []);

  // Focus management + trap
  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const panel = panelRef.current;
    if (!panel) return;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    window.addEventListener("keydown", onTab);
    return () => window.removeEventListener("keydown", onTab);
  }, [open]);

  useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout> | null = null;

    const onKey = (e: KeyboardEvent) => {
      // Cmd/Ctrl+Shift+S → toggle sidebar (checked before modifier-skip)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("praxis:sidebar:toggle"));
        return;
      }

      // Skip remaining shortcuts if any modifier key is held
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

      // / → focus conversation search (or navigate to conversations)
      if (e.key === "/" && !open) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[aria-label="Search conversations"]',
        );
        if (searchInput) {
          searchInput.focus();
        } else {
          router.push("/app/conversations");
        }
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

  const groups = buildShortcutGroups(isMac);

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
              ref={panelRef}
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
                  ref={closeButtonRef}
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
                {groups.map((group) => (
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
