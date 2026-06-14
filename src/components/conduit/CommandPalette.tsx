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
  Activity,
  Brain,
  Clock,
  CreditCard,
  FileText,
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
  icon: ReactNode;
  href?: string;
  action?: () => void;
  group: string;
}

interface SearchResult {
  chats: { id: string; title: string | null; updated_at: string; dominant_employee: string | null }[];
  memory: { id: string; content: string; kind: string; created_at: string }[];
  artifacts: { id: string; title: string; type: string; created_at: string; conversation_id: string | null }[];
}

const RECENT_KEY = "praxis:palette:recent";
const MAX_RECENT = 5;

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  try {
    const prev = readRecent().filter((s) => s !== q);
    localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)));
  } catch {
    // localStorage blocked
  }
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
    id: "nav-activity",
    label: "Activity",
    sublabel: "Recent specialist activity timeline",
    icon: <Activity size={ICON_SIZE} />,
    href: "/app/activity",
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
  const [recent, setRecent] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIdx(0);
    setSearchResults(null);
  }, []);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().startsWith("MAC");
      const trigger = isMac ? e.metaKey : e.ctrlKey;
      if (trigger && e.key === "k") {
        e.preventDefault();
        setOpen((v: boolean) => {
          if (v) { setQuery(""); setActiveIdx(0); setSearchResults(null); }
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

  // Focus input when opened + load recent searches
  useEffect(() => {
    if (open) {
      setRecent(readRecent());
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/conduit/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json() as SearchResult;
          setSearchResults(data);
        }
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

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

  const allStaticItems: PaletteItem[] = [...NAV_ITEMS, ...teamItems];

  // When there's a query: filter static items + append search results
  // When query is empty: show recent searches + static items
  const hasQuery = query.trim().length >= 2;

  const filteredStatic = query.trim()
    ? allStaticItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.sublabel?.toLowerCase().includes(query.toLowerCase()),
      )
    : allStaticItems;

  // Build dynamic search result items
  type ChatResult = SearchResult["chats"][number];
  type MemResult = SearchResult["memory"][number];
  type ArtResult = SearchResult["artifacts"][number];
  const dynamicItems: PaletteItem[] = hasQuery && searchResults
    ? [
        ...(searchResults.chats ?? []).map((c: ChatResult) => ({
          id: `chat-result-${c.id}`,
          label: c.title || "Untitled chat",
          sublabel: "Conversation",
          icon: <MessageSquare size={ICON_SIZE} />,
          href: `/app?c=${c.id}`,
          group: "Chats",
        })),
        ...(searchResults.memory ?? []).map((m: MemResult) => ({
          id: `mem-result-${m.id}`,
          label: m.content.slice(0, 60) + (m.content.length > 60 ? "…" : ""),
          sublabel: `Memory · ${m.kind}`,
          icon: <Brain size={ICON_SIZE} />,
          href: "/app/memory",
          group: "Memory",
        })),
        ...(searchResults.artifacts ?? []).map((a: ArtResult) => ({
          id: `art-result-${a.id}`,
          label: a.title || "Untitled artifact",
          sublabel: `Artifact · ${a.type}`,
          icon: a.type === "build" ? <Hammer size={ICON_SIZE} /> : <FileText size={ICON_SIZE} />,
          href: a.conversation_id ? `/app?c=${a.conversation_id}` : "/app/artifacts",
          group: "Artifacts",
        })),
      ]
    : [];

  // Merge: search results first, then static (filtered)
  const allItems: PaletteItem[] = hasQuery
    ? [...dynamicItems, ...filteredStatic]
    : filteredStatic;

  // Group
  const groups: { name: string; items: PaletteItem[] }[] = [];
  for (const item of allItems) {
    const existing = groups.find((g) => g.name === item.group);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({ name: item.group, items: [item] });
    }
  }

  const flatItems = allItems;

  const activate = (item: PaletteItem) => {
    if (query.trim().length >= 2) saveRecent(query.trim());
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

  const activateRecent = (term: string) => {
    close();
    setQuery(term);
    setTimeout(() => {
      setOpen(true);
      setQuery(term);
    }, 50);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i: number) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i: number) => Math.max(i - 1, 0));
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
                  className={`shrink-0 transition-opacity ${searching ? "animate-pulse" : ""}`}
                  style={{ color: "var(--color-text-muted)" }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Search chats, memory, artifacts, actions…"
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

              {/* Recent searches (shown when query is empty) */}
              {!query && recent.length > 0 && (
                <div className="py-2 border-b border-[var(--color-border)]">
                  <div className="px-4 pt-1 pb-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] flex items-center gap-1">
                    <Clock size={10} />
                    Recent
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-4 pb-2 pt-1">
                    {recent.map((term: string) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => activateRecent(term)}
                        className="text-[11px] px-2 py-0.5 rounded-full border transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent-hi)]"
                        style={{
                          borderColor: "var(--color-border)",
                          background: "var(--color-surface)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              <div
                id="palette-list"
                role="listbox"
                ref={listRef}
                className="max-h-[52vh] overflow-y-auto py-2"
                aria-label="Results"
              >
                {flatItems.length === 0 && !searching && query.trim().length >= 2 ? (
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
