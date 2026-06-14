"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  CreditCard,
  Hammer,
  LayoutGrid,
  MessageSquare,
  Mic,
  Plus,
  Search,
  Settings,
  Users2,
} from "lucide-react";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, EMPLOYEE_ICON, employeeLabel } from "./EmployeeBadge";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";

interface PaletteItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
  group: string;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = (el as HTMLElement).tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

const ICON_SIZE = 14;

const NAV_ITEMS: Omit<PaletteItem, "action">[] = [
  {
    id: "nav-new-chat",
    label: "New chat",
    sublabel: "Start a fresh conversation",
    icon: <Plus size={ICON_SIZE} />,
    href: "/app",
    group: "Navigation",
  },
  {
    id: "nav-workspace",
    label: "Workspace",
    sublabel: "Your Praxis dashboard",
    icon: <LayoutGrid size={ICON_SIZE} />,
    href: "/app/workspace",
    group: "Navigation",
  },
  {
    id: "nav-conversations",
    label: "Conversations",
    sublabel: "Browse conversation history",
    icon: <MessageSquare size={ICON_SIZE} />,
    href: "/app/conversations",
    group: "Navigation",
  },
  {
    id: "nav-memory",
    label: "Memory",
    sublabel: "View and manage Praxis memory",
    icon: <Brain size={ICON_SIZE} />,
    href: "/app/memory",
    group: "Navigation",
  },
  {
    id: "nav-builds",
    label: "Builds",
    sublabel: "Engineering build history",
    icon: <Hammer size={ICON_SIZE} />,
    href: "/app/builds",
    group: "Navigation",
  },
  {
    id: "nav-team",
    label: "Team",
    sublabel: "Browse Praxis specialists",
    icon: <Users2 size={ICON_SIZE} />,
    href: "/app/team",
    group: "Navigation",
  },
  {
    id: "nav-voice",
    label: "Voice room",
    sublabel: "Live voice session with your team",
    icon: <Mic size={ICON_SIZE} />,
    href: "/app/voice",
    group: "Navigation",
  },
  {
    id: "nav-settings",
    label: "Settings",
    sublabel: "Profile, billing, voice, and more",
    icon: <Settings size={ICON_SIZE} />,
    href: "/app/settings",
    group: "Navigation",
  },
  {
    id: "nav-billing",
    label: "Billing",
    sublabel: "Manage your subscription",
    icon: <CreditCard size={ICON_SIZE} />,
    href: "/app/settings/billing",
    group: "Navigation",
  },
];

const TEAM = EMPLOYEE_ORDER as EmployeeKey[];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIdx(0);
  }, []);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().startsWith("MAC");
      const trigger = isMac ? e.metaKey : e.ctrlKey;
      if (trigger && e.key === "k") {
        e.preventDefault();
        setOpen((v) => {
          if (v) { setQuery(""); setActiveIdx(0); }
          return !v;
        });
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Build team items
  const teamItems: PaletteItem[] = TEAM.map((emp) => {
    const Icon = EMPLOYEE_ICON[emp];
    return {
      id: `chat-${emp}`,
      label: `Chat with ${employeeLabel(emp)}`,
      sublabel: "Open a conversation",
      icon: <Icon size={ICON_SIZE} style={{ color: DEPT_COLOR[emp] }} />,
      href: `/app?employee=${emp}`,
      group: "Specialists",
    };
  });

  const allItems: PaletteItem[] = [...NAV_ITEMS, ...teamItems];

  const filtered = query.trim()
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.sublabel?.toLowerCase().includes(query.toLowerCase()),
      )
    : allItems;

  // Group filtered items
  const groups: { name: string; items: PaletteItem[] }[] = [];
  for (const item of filtered) {
    const existing = groups.find((g) => g.name === item.group);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({ name: item.group, items: [item] });
    }
  }

  // Flat index for keyboard nav
  const flatItems = filtered;

  const activate = (item: PaletteItem) => {
    close();
    if (item.action) {
      item.action();
    } else if (item.href) {
      if (item.id === "nav-new-chat") {
        router.push("/app");
        router.refresh();
      } else {
        router.push(item.href);
      }
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[activeIdx];
      if (item) activate(item);
    } else if (e.key === "Escape") {
      close();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-palette-idx="${activeIdx}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  // Reset active idx when query changes
  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cmd-palette-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] bg-black/50"
            aria-hidden
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            key="cmd-palette-panel"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className="fixed inset-0 z-[201] flex items-start justify-center pt-[12vh] px-4 pointer-events-none"
            aria-live="off"
          >
            <div
              role="dialog"
              aria-label="Command palette"
              aria-modal="true"
              className="pointer-events-auto w-full max-w-lg rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden"
              style={{ background: "var(--color-surface-elevated)" }}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--color-border)]">
                <Search
                  size={15}
                  className="shrink-0"
                  style={{ color: "var(--color-text-muted)" }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Search actions and navigation…"
                  autoComplete="off"
                  spellCheck={false}
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-[var(--color-text-muted)]"
                  aria-label="Search palette"
                  aria-controls="palette-list"
                  aria-activedescendant={
                    flatItems[activeIdx] ? `palette-item-${flatItems[activeIdx].id}` : undefined
                  }
                />
                <kbd
                  className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border shrink-0"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Esc
                </kbd>
              </div>

              {/* Results */}
              <div
                id="palette-list"
                role="listbox"
                ref={listRef}
                className="max-h-[52vh] overflow-y-auto py-2"
                aria-label="Results"
              >
                {filtered.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
                    No results for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  groups.map((group) => (
                    <div key={group.name}>
                      <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                        {group.name}
                      </div>
                      {group.items.map((item) => {
                        const flatIdx = flatItems.indexOf(item);
                        const isActive = flatIdx === activeIdx;
                        return (
                          <button
                            key={item.id}
                            id={`palette-item-${item.id}`}
                            role="option"
                            aria-selected={isActive}
                            data-palette-idx={flatIdx}
                            type="button"
                            onClick={() => activate(item)}
                            onMouseEnter={() => setActiveIdx(flatIdx)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                            style={{
                              background: isActive
                                ? "color-mix(in srgb, var(--color-accent) 10%, transparent)"
                                : "transparent",
                            }}
                          >
                            <span
                              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{
                                background: isActive
                                  ? "color-mix(in srgb, var(--color-accent) 15%, transparent)"
                                  : "var(--color-surface)",
                                border: "1px solid var(--color-border)",
                              }}
                            >
                              {item.icon}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium truncate">
                                {item.label}
                              </span>
                              {item.sublabel && (
                                <span className="block text-[11px] text-[var(--color-text-muted)] truncate">
                                  {item.sublabel}
                                </span>
                              )}
                            </span>
                            {isActive && (
                              <kbd
                                className="hidden sm:inline-flex shrink-0 items-center px-1.5 py-0.5 text-[10px] font-mono rounded border"
                                style={{
                                  background: "var(--color-surface)",
                                  borderColor: "var(--color-border)",
                                  color: "var(--color-text-muted)",
                                }}
                                aria-hidden
                              >
                                ↵
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer hint */}
              <div
                className="px-4 py-2.5 border-t border-[var(--color-border)] flex items-center gap-4 text-[10px]"
                style={{ color: "var(--color-text-muted)" }}
              >
                <span>
                  <kbd className="font-mono">↑↓</kbd> navigate
                </span>
                <span>
                  <kbd className="font-mono">↵</kbd> open
                </span>
                <span>
                  <kbd className="font-mono">Esc</kbd> close
                </span>
                <span className="ml-auto">
                  <kbd className="font-mono">⌘K</kbd> to reopen
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
