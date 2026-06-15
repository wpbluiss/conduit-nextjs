"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CreditCard,
  Keyboard,
  Lock,
  MessageSquare,
  Puzzle,
  Search,
  User,
} from "lucide-react";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, EMPLOYEE_ICON, employeeLabel } from "./EmployeeBadge";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";

interface PaletteItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: ReactNode;
  href: string;
  group: "Conversations" | "Specialists" | "Settings";
}

interface CommandPaletteProps {
  recentConvos?: { id: string; title: string | null; dominant_employee: string | null }[];
}

const ICON_SIZE = 14;

const SETTINGS_ITEMS: PaletteItem[] = [
  {
    id: "settings-profile",
    label: "Profile",
    sublabel: "Account name, display name, avatar",
    icon: <User size={ICON_SIZE} />,
    href: "/app/settings?tab=profile",
    group: "Settings",
  },
  {
    id: "settings-billing",
    label: "Billing",
    sublabel: "Manage your subscription",
    icon: <CreditCard size={ICON_SIZE} />,
    href: "/app/settings?tab=billing",
    group: "Settings",
  },
  {
    id: "settings-connectors",
    label: "Connectors",
    sublabel: "Integrations and connected services",
    icon: <Puzzle size={ICON_SIZE} />,
    href: "/app/settings?tab=integrations",
    group: "Settings",
  },
  {
    id: "settings-security",
    label: "Security",
    sublabel: "Sessions, passwords, and account security",
    icon: <Lock size={ICON_SIZE} />,
    href: "/app/settings?tab=security",
    group: "Settings",
  },
];

const GROUPS_ORDER = ["Conversations", "Specialists", "Settings"] as const;

const TEAM = EMPLOYEE_ORDER as EmployeeKey[];

export function CommandPalette({ recentConvos = [] }: CommandPaletteProps) {
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

  // ⌘K / Ctrl+K to open; Esc to close
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().startsWith("MAC");
      const trigger = isMac ? e.metaKey : e.ctrlKey;
      if (trigger && e.key === "k") {
        e.preventDefault();
        setOpen((v: boolean) => {
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

  // Conversation items from sidebar data (no DB call)
  const convoItems: PaletteItem[] = recentConvos.slice(0, 10).map((c) => {
    const emp = (c.dominant_employee ?? null) as EmployeeKey | null;
    const Icon = emp && EMPLOYEE_ICON[emp] ? EMPLOYEE_ICON[emp] : MessageSquare;
    return {
      id: `convo-${c.id}`,
      label: c.title || "Untitled chat",
      sublabel: emp ? `with ${employeeLabel(emp)}` : "Conversation",
      icon: <Icon size={ICON_SIZE} style={emp ? { color: DEPT_COLOR[emp] } : undefined} />,
      href: `/app?c=${c.id}`,
      group: "Conversations",
    };
  });

  // Specialist items (hardcoded)
  const specialistItems: PaletteItem[] = TEAM.map((emp) => {
    const Icon = EMPLOYEE_ICON[emp];
    return {
      id: `specialist-${emp}`,
      label: employeeLabel(emp),
      sublabel: "Open a new chat",
      icon: <Icon size={ICON_SIZE} style={{ color: DEPT_COLOR[emp] }} />,
      href: `/app?pin=${emp}`,
      group: "Specialists",
    };
  });

  const allItems: PaletteItem[] = [...convoItems, ...specialistItems, ...SETTINGS_ITEMS];

  // Client-side fuzzy filter
  const q = query.trim().toLowerCase();
  const filteredItems = q
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          (item.sublabel?.toLowerCase().includes(q) ?? false),
      )
    : allItems;

  const groups = GROUPS_ORDER
    .map((name) => ({ name, items: filteredItems.filter((i) => i.group === name) }))
    .filter((g) => g.items.length > 0);

  const activate = (item: PaletteItem) => {
    close();
    router.push(item.href);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i: number) => Math.min(i + 1, filteredItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i: number) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filteredItems[activeIdx];
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
              className="cx-glass-float cx-glass-border pointer-events-auto w-full max-w-lg rounded-2xl overflow-hidden"
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
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Search conversations, specialists, settings…"
                  autoComplete="off"
                  spellCheck={false}
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-[var(--color-text-muted)]"
                  aria-label="Search palette"
                  aria-controls="palette-list"
                  aria-activedescendant={
                    filteredItems[activeIdx]
                      ? `palette-item-${filteredItems[activeIdx].id}`
                      : undefined
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
                {filteredItems.length === 0 ? (
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
                        const flatIdx = filteredItems.indexOf(item);
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

              {/* Footer */}
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
                <span className="ml-auto flex items-center gap-3">
                  <span className="hidden sm:inline">
                    <kbd className="font-mono">⌘K</kbd> to reopen
                  </span>
                  <button
                    type="button"
                    className="sm:hidden flex items-center gap-1.5 transition-colors hover:text-[var(--color-text)]"
                    onClick={() => {
                      close();
                      window.dispatchEvent(new CustomEvent("praxis:shortcuts:open"));
                    }}
                    aria-label="Open keyboard shortcuts"
                  >
                    <Keyboard size={12} />
                    Shortcuts
                  </button>
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
