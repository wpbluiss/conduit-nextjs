"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MagnifyingGlass } from "@phosphor-icons/react";

interface PaletteItem {
  id: string;
  group: string;
  label: string;
  hint?: string;
  action: () => void;
}

// Hook — expose open/close to the parent layout via a global event so
// we don't need a context provider just for this one signal.
export function useCommandPalette() {
  const open = useCallback(() => {
    window.dispatchEvent(new CustomEvent("praxis:cmd-palette:open"));
  }, []);
  return { open };
}

export function CommandPalette({ accountId }: { accountId?: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const ITEMS: PaletteItem[] = [
    // Navigation
    { id: "nav-chat", group: "Navigate", label: "Chat", hint: "Workspace", action: () => router.push("/app") },
    { id: "nav-memory", group: "Navigate", label: "Memory", hint: "Knowledge graph", action: () => router.push("/app/memory") },
    { id: "nav-conversations", group: "Navigate", label: "Conversations", hint: "History", action: () => router.push("/app/conversations") },
    { id: "nav-settings-profile", group: "Navigate", label: "Settings — Profile", action: () => router.push("/app/settings/profile") },
    { id: "nav-settings-billing", group: "Navigate", label: "Settings — Billing", action: () => router.push("/app/settings/billing") },
    { id: "nav-settings-voice", group: "Navigate", label: "Settings — Voice", action: () => router.push("/app/settings/voice") },
    // Actions
    {
      id: "act-new-convo",
      group: "Actions",
      label: "New conversation",
      hint: "Start fresh",
      action: () => router.push("/app"),
    },
    {
      id: "act-sign-out",
      group: "Actions",
      label: "Sign out",
      action: () => {
        const form = document.createElement("form");
        form.method = "post";
        form.action = "/auth/sign-out";
        document.body.appendChild(form);
        form.submit();
      },
    },
  ];

  const filtered = query.trim()
    ? ITEMS.filter((item) =>
        [item.label, item.hint ?? "", item.group]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : ITEMS;

  // Group for display
  const groups: Record<string, PaletteItem[]> = {};
  for (const item of filtered) {
    (groups[item.group] = groups[item.group] ?? []).push(item);
  }

  const flatFiltered = Object.values(groups).flat();

  const openPalette = useCallback(() => {
    setIsOpen(true);
    setQuery("");
    setActiveIdx(0);
  }, []);

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openPalette();
      }
    };
    const onEvent = () => openPalette();
    window.addEventListener("keydown", onKey);
    window.addEventListener("praxis:cmd-palette:open", onEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("praxis:cmd-palette:open", onEvent);
    };
  }, [openPalette]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flatFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatFiltered[activeIdx];
      if (item) {
        item.action();
        setIsOpen(false);
      }
    }
  };

  // Reset active index when query changes
  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[200]"
                style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
                className="fixed left-1/2 top-[18vh] z-[201] -translate-x-1/2 w-full max-w-[560px] px-4"
                onKeyDown={handleKeyDown}
              >
                <div
                  className="rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    background: "var(--color-surface-elevated)",
                    border: "1px solid var(--color-border)",
                    boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
                  }}
                >
                  <Dialog.Title className="sr-only">Command palette</Dialog.Title>

                  {/* Search */}
                  <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--color-border)]">
                    <MagnifyingGlass
                      size={16}
                      weight="regular"
                      className="shrink-0"
                      style={{ color: "var(--color-text-muted)" }}
                    />
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search commands…"
                      className="flex-1 bg-transparent outline-none text-sm"
                      style={{ color: "var(--color-text)" }}
                      aria-label="Command palette search"
                    />
                    <kbd
                      className="text-[11px] px-1.5 py-0.5 rounded"
                      style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      esc
                    </kbd>
                  </div>

                  {/* Results */}
                  <ul
                    ref={listRef}
                    className="overflow-y-auto py-2"
                    style={{ maxHeight: "min(360px, 50vh)" }}
                    role="listbox"
                  >
                    {flatFiltered.length === 0 ? (
                      <li className="px-4 py-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
                        No results for &ldquo;{query}&rdquo;
                      </li>
                    ) : (
                      Object.entries(groups).map(([group, items]) => (
                        <div key={group}>
                          <p
                            className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-[0.16em]"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {group}
                          </p>
                          {items.map((item) => {
                            const globalIdx = flatFiltered.indexOf(item);
                            const isActive = globalIdx === activeIdx;
                            return (
                              <li
                                key={item.id}
                                role="option"
                                aria-selected={isActive}
                                onClick={() => {
                                  item.action();
                                  setIsOpen(false);
                                }}
                                onMouseEnter={() => setActiveIdx(globalIdx)}
                                className="flex items-center justify-between gap-3 mx-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm"
                                style={{
                                  background: isActive
                                    ? "var(--color-accent-subtle, color-mix(in srgb, var(--color-accent) 10%, transparent))"
                                    : "transparent",
                                  color: isActive
                                    ? "var(--color-text)"
                                    : "var(--color-text)",
                                }}
                              >
                                <span>{item.label}</span>
                                <span className="flex items-center gap-2">
                                  {item.hint && (
                                    <span
                                      className="text-[11px]"
                                      style={{ color: "var(--color-text-muted)" }}
                                    >
                                      {item.hint}
                                    </span>
                                  )}
                                  {isActive && (
                                    <ArrowRight
                                      size={12}
                                      weight="bold"
                                      style={{ color: "var(--color-accent)" }}
                                    />
                                  )}
                                </span>
                              </li>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </ul>

                  {/* Footer */}
                  <div
                    className="flex items-center gap-4 px-4 py-2.5 border-t border-[var(--color-border)] text-[11px]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <span><kbd>↑↓</kbd> navigate</span>
                    <span><kbd>↵</kbd> open</span>
                    <span><kbd>esc</kbd> close</span>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
