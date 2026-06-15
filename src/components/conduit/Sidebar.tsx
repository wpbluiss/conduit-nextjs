"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Bookmark,
  Brain,
  CircleHelp,
  CreditCard,
  Hammer,
  LayoutGrid,
  Lock,
  LogOut,
  Mic,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  Users2,
  Monitor,
  X,
} from "lucide-react";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, employeeLabel } from "./EmployeeBadge";
import { SpecialistAvatar } from "./SpecialistAvatar";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";
import { useNicknames } from "@/context/NicknameContext";
import { PraxisLogo } from "./PraxisLogo";
import { SidebarBuildPip } from "./builds/in-flight/SidebarBuildPip";
import { SidebarBuildsSection } from "./builds/in-flight/SidebarBuildsSection";
import { Button } from "@/components/conduit/ui/Button";
import type { InFlightBuild } from "@/lib/engineering/in-flight";
import { ChangelogPopover } from "./ChangelogPopover";
import { NotificationCenter } from "./NotificationCenter";
import { PaywallModal } from "./PaywallModal";
import type { PaywallPayload } from "./PaywallModal";
import { GettingStartedChecklist } from "./GettingStartedChecklist";
import { OnboardingChecklist } from "./OnboardingChecklist";

const BANNER_SESSION_KEY = "praxis:upgrade_banner_dismissed";
const PINNED_SPECIALISTS_KEY = "praxis:pinned-specialists";

function usePinnedSpecialists() {
  const [pinned, setPinned] = useState<EmployeeKey[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PINNED_SPECIALISTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setPinned(parsed as EmployeeKey[]);
      }
    } catch { }
  }, []);

  const pin = (id: EmployeeKey) => {
    setPinned((prev) => {
      // Newest pin goes to the front; oldest (last) is evicted when over limit.
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 3);
      try { localStorage.setItem(PINNED_SPECIALISTS_KEY, JSON.stringify(next)); } catch { }
      return next;
    });
  };

  const unpin = (id: EmployeeKey) => {
    setPinned((prev) => {
      const next = prev.filter((x) => x !== id);
      try { localStorage.setItem(PINNED_SPECIALISTS_KEY, JSON.stringify(next)); } catch { }
      return next;
    });
  };

  return { pinned, pin, unpin };
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SidebarUpgradeBanner({
  tokensUsed,
  tokensAllowance,
  onUpgradeClick,
}: {
  tokensUsed: number;
  tokensAllowance: number;
  onUpgradeClick: () => void;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(BANNER_SESSION_KEY) !== "1") setDismissed(false);
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;

  const pct = tokensAllowance > 0 ? Math.min(tokensUsed / tokensAllowance, 1) : 0;
  const pctDisplay = Math.round(pct * 100);
  const usedK = (tokensUsed / 1000).toFixed(0);
  const capK = (tokensAllowance / 1000).toFixed(0);

  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(BANNER_SESSION_KEY, "1"); } catch { /* ignore */ }
  };

  return (
    <div
      className="mx-3 mb-2 rounded-xl"
      style={{
        background: "color-mix(in srgb, var(--color-accent) 6%, var(--color-surface-elevated))",
        border: "1px solid color-mix(in srgb, var(--color-accent) 20%, var(--color-border))",
      }}
    >
      <div className="px-3 pt-2.5 pb-2.5">
        <div className="flex items-start justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={11} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
            <span className="cx-type-xs font-semibold" style={{ color: "var(--color-text)" }}>
              Unlock all 9 specialists
            </span>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss upgrade prompt"
            className="shrink-0 transition-colors"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X size={12} />
          </button>
        </div>

        {/* Usage meter */}
        <div className="mb-2.5">
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 4, background: "var(--color-border)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct * 100}%`,
                background: pct >= 0.8 ? "var(--cx-danger, #F4607D)" : "var(--color-accent)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <p className="cx-mono cx-type-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            {usedK}k / {capK}k tokens used ({pctDisplay}%)
          </p>
        </div>

        <Button
          onClick={() => { dismiss(); onUpgradeClick(); }}
          variant="primary"
          size="sm"
          className="w-full"
        >
          Upgrade to Pro
        </Button>
      </div>
    </div>
  );
}

interface ConvoSummary {
  id: string;
  title: string | null;
  updated_at: string;
  dominant_employee: string | null;
  last_message?: string | null;
  labels?: { id: string; name: string; color: string }[];
}

interface TeamActivity {
  employee: EmployeeKey;
  last_active_at: string | null;
}

const TEAM: EmployeeKey[] = EMPLOYEE_ORDER as EmployeeKey[];

const COLLAPSED_KEY = "praxis:sidebar:collapsed";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

const THEME_KEY = "praxis.theme";
type ThemePref = "system" | "light" | "dark";
const THEME_CYCLE: ThemePref[] = ["light", "dark", "system"];

function applyThemePref(pref: ThemePref): void {
  if (typeof document === "undefined") return;
  const resolved =
    pref === "system"
      ? window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : pref;
  document.documentElement.setAttribute("data-praxis-theme", resolved);
  document.documentElement.setAttribute("data-praxis-theme-pref", pref);
}

function SidebarThemeButton({ collapsed = false }: { collapsed?: boolean }) {
  const [pref, setPref] = useState<ThemePref>(() => {
    if (typeof localStorage === "undefined") return "system";
    return (localStorage.getItem(THEME_KEY) as ThemePref | null) ?? "system";
  });

  useEffect(() => {
    const stored = (localStorage.getItem(THEME_KEY) as ThemePref | null) ?? "system";
    setPref(stored);
    applyThemePref(stored);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem(THEME_KEY) ?? "system") === "system") {
        applyThemePref("system");
      }
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  function cycle() {
    const idx = THEME_CYCLE.indexOf(pref);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    setPref(next);
    applyThemePref(next);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_KEY, next);
    }
    fetch("/api/conduit/account/prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ theme_preference: next }),
    }).catch(() => {});
  }

  const icons: Record<ThemePref, React.ReactNode> = {
    light: <Sun size={16} />,
    dark: <Moon size={16} />,
    system: <Monitor size={16} />,
  };
  const labels: Record<ThemePref, string> = {
    light: "Light",
    dark: "Dark",
    system: "System",
  };
  const nextLabels: Record<ThemePref, string> = {
    light: "Switch to dark",
    dark: "Switch to system",
    system: "Switch to light",
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={cycle}
        title={nextLabels[pref]}
        aria-label={nextLabels[pref]}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-100"
      >
        {icons[pref]}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={cycle}
      title={nextLabels[pref]}
      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] rounded-lg transition-colors duration-100"
    >
      {icons[pref]}
      {labels[pref]}
    </button>
  );
}

export function Sidebar({
  userEmail,
  accountName,
  workspaceName,
  conversations,
  team,
  allowedEmployees,
  tierName,
  tierId,
  tokensUsed,
  tokensAllowance,
  internalAccount,
  accountId,
  inFlightBuildsInitial,
  avatarUrl,
  displayName,
  showGettingStarted,
  hasContext,
}: {
  userEmail: string;
  accountName: string;
  workspaceName?: string | null;
  conversations: ConvoSummary[];
  team: TeamActivity[];
  allowedEmployees: EmployeeKey[];
  tierName?: string;
  tierId?: string;
  tokensUsed?: number;
  tokensAllowance?: number;
  internalAccount?: boolean;
  accountId: string;
  inFlightBuildsInitial: InFlightBuild[];
  avatarUrl?: string | null;
  displayName?: string | null;
  showGettingStarted?: boolean;
  hasContext?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeId = params.get("c");
  const { labelFor } = useNicknames();
  const [open, setOpen] = useState(false);
  const [teamExpanded, setTeamExpanded] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  // Desktop collapsed state — lazy init from localStorage, persisted.
  const [collapsed, setCollapsed] = useState<boolean>(false);
  // Suppress the width transition on initial hydration to avoid CLS.
  const [skipTransition, setSkipTransition] = useState(true);
  const sidebarRef = useRef<HTMLElement>(null);
  // Conversation list search
  const [convSearch, setConvSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Mobile: search expands from icon on tap; desktop always shows the full input.
  const [searchExpanded, setSearchExpanded] = useState(false);
  // Optimistic title overrides — updated when chat fires praxis:title_updated.
  const [titleOverrides, setTitleOverrides] = useState<Record<string, string>>({});
  // Specialist filter chip — null = "All"
  const [specialistFilter, setSpecialistFilter] = useState<EmployeeKey | null>(null);

  const shouldReduceMotion = useReducedMotion() ?? false;
  const { pinned, pin, unpin } = usePinnedSpecialists();

  // Specialist context menu (right-click / long-press to pin/unpin)
  const [ctxMenu, setCtxMenu] = useState<{ emp: EmployeeKey; x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSpecialistContextMenu = (e: { preventDefault(): void; clientX: number; clientY: number }, emp: EmployeeKey) => {
    e.preventDefault();
    setCtxMenu({ emp, x: e.clientX, y: e.clientY });
  };

  const handleSpecialistTouchStart = (e: { touches: ArrayLike<{ clientX: number; clientY: number }> }, emp: EmployeeKey) => {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    longPressTimer.current = setTimeout(() => {
      setCtxMenu({ emp, x, y });
    }, 500);
  };

  const handleSpecialistTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Quick-peek tooltip: which conversation is hovered + its anchor rect.
  const [peekId, setPeekId] = useState<string | null>(null);
  const [peekRect, setPeekRect] = useState<DOMRect | null>(null);
  const [portalMounted, setPortalMounted] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(true); // assume touch until checked
  const peekOpenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peekDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate collapsed state from localStorage after mount (avoids SSR mismatch).
  // Two rAF calls ensure the corrected layout is painted before re-enabling
  // the animated transition, preventing a visible collapse animation on load.
  useEffect(() => {
    setCollapsed(readCollapsed());
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSkipTransition(false));
    });
  }, []);

  useEffect(() => {
    const onTitleUpdated = (e: Event) => {
      const { conversation_id, title } = (e as CustomEvent<{ conversation_id: string; title: string }>).detail;
      if (conversation_id && title) {
        setTitleOverrides((prev) => ({ ...prev, [conversation_id]: title }));
      }
    };
    window.addEventListener("praxis:title_updated", onTitleUpdated);
    return () => window.removeEventListener("praxis:title_updated", onTitleUpdated);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // localStorage blocked
      }
      return next;
    });
  };

  const close = () => setOpen(false);

  // ESC key: clear search if active, collapse mobile search if expanded, otherwise close sidebar on mobile
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (convSearch) {
          setConvSearch("");
          searchInputRef.current?.focus();
        } else if (searchExpanded) {
          setSearchExpanded(false);
        } else if (open) {
          close();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, convSearch, searchExpanded]);

  // Reset mobile search expansion when the drawer closes
  useEffect(() => {
    if (!open) setSearchExpanded(false);
  }, [open]);

  // Focus trap + focus management: mobile only (when drawer is open as dialog)
  useEffect(() => {
    // Only trap on mobile viewports where the sidebar is a modal drawer
    if (!open || typeof window === "undefined" || window.innerWidth >= 768) return;
    if (!sidebarRef.current) return;
    const sidebar = sidebarRef.current;
    const focusable = sidebar.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", trap);
    return () => window.removeEventListener("keydown", trap);
  }, [open]);


  // Keyboard shortcut: Cmd/Ctrl+Shift+S → toggle sidebar collapsed state
  useEffect(() => {
    const onToggle = () => toggleCollapsed();
    window.addEventListener("praxis:sidebar:toggle", onToggle);
    return () => window.removeEventListener("praxis:sidebar:toggle", onToggle);
  }, []);

  // ConsoleTopBar → open mobile drawer via event (avoids prop-drilling through layout)
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("praxis:sidebar:open", onOpen);
    return () => window.removeEventListener("praxis:sidebar:open", onOpen);
  }, []);

  // Streaming employee: pulsed strong + steady while a Chat is streaming.
  const [streamingEmployee, setStreamingEmployee] =
    useState<EmployeeKey | null>(null);
  useEffect(() => {
    const onStream = (e: Event) => {
      const detail = (e as CustomEvent<{ employee: EmployeeKey | null }>)
        .detail;
      setStreamingEmployee(detail?.employee ?? null);
    };
    window.addEventListener("conduit:stream", onStream as EventListener);
    return () =>
      window.removeEventListener("conduit:stream", onStream as EventListener);
  }, []);

  // Detect coarse-pointer (touch) devices to suppress hover tooltip.
  useEffect(() => {
    setIsCoarsePointer(window.matchMedia("(pointer: coarse)").matches);
    setPortalMounted(true);
  }, []);

  // Dismiss specialist context menu on outside click or Escape.
  useEffect(() => {
    if (!ctxMenu) return;
    const dismiss = () => setCtxMenu(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
    window.addEventListener("click", dismiss);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", dismiss);
      window.removeEventListener("keydown", onKey);
    };
  }, [ctxMenu]);

  // Clean up long-press timer on unmount.
  useEffect(() => {
    return () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };
  }, []);

  const openPeek = (id: string, el: HTMLAnchorElement, fromFocus = false) => {
    // Suppress hover tooltip on touch/coarse-pointer devices; always allow keyboard focus.
    if (!fromFocus && isCoarsePointer) return;
    if (peekOpenTimer.current) clearTimeout(peekOpenTimer.current);
    if (peekDismissTimer.current) clearTimeout(peekDismissTimer.current);
    peekOpenTimer.current = setTimeout(() => {
      setPeekRect(el.getBoundingClientRect());
      setPeekId(id);
      peekDismissTimer.current = setTimeout(() => setPeekId(null), 3000);
    }, 300);
  };

  const closePeek = () => {
    if (peekOpenTimer.current) clearTimeout(peekOpenTimer.current);
    if (peekDismissTimer.current) clearTimeout(peekDismissTimer.current);
    setPeekId(null);
  };

  // `team` prop reserved for future per-employee status coloring.
  void team;

  // Specialists that appear in the current conversation list (in EMPLOYEE_ORDER sequence).
  const activeSpecialists = useMemo<EmployeeKey[]>(() => {
    const seen = new Set<string>();
    for (const c of conversations) {
      const key = c.dominant_employee;
      if (key && (TEAM as string[]).includes(key)) seen.add(key);
    }
    return (TEAM as EmployeeKey[]).filter((k) => seen.has(k));
  }, [conversations]);

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");
  const isChat = pathname === "/app";

  return (
    <>
      {/* Mobile backdrop — framer-motion fade, closes on outside tap */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-30 bg-black/60"
            aria-hidden="true"
            onClick={close}
          />
        )}
      </AnimatePresence>

      <motion.aside
        id="app-sidebar"
        ref={sidebarRef}
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-label="Navigation"
        animate={{ width: collapsed ? 56 : 256 }}
        transition={skipTransition || shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className={`cx-glass fixed md:static z-40 inset-y-0 left-0 border-r flex flex-col overflow-hidden transform transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        style={{ minWidth: collapsed ? 56 : 256, borderColor: "var(--cx-glass-border, rgba(255,255,255,0.08))" }}
      >
        {/* Header — workspace logo / Praxis wordmark + collapse toggle */}
        <div
          className={`px-3 py-3 flex items-center border-b ${
            collapsed ? "justify-center" : "justify-between"
          }`}
          style={{ borderColor: "var(--cx-border, var(--color-border))" }}
        >
          {!collapsed && (
            <Link
              href="/app/workspace"
              onClick={close}
              className="flex items-center gap-2.5 min-w-0"
            >
              {avatarUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl}
                    alt="Workspace logo"
                    className="w-7 h-7 rounded-lg object-cover shrink-0"
                    style={{ border: "1px solid var(--cx-border, var(--color-border))" }}
                  />
                  <span className="cx-type-sm font-semibold truncate" style={{ color: "var(--cx-text, var(--color-text))" }}>
                    {workspaceName || accountName}
                  </span>
                </>
              ) : (
                <PraxisLogo size={32} withWordmark glow />
              )}
            </Link>
          )}
          {collapsed && (
            <Link
              href="/app/workspace"
              onClick={close}
              className="flex items-center justify-center"
              title={workspaceName || accountName || "Workspace"}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Workspace logo"
                  className="w-7 h-7 rounded-lg object-cover border border-[var(--color-border)]"
                />
              ) : (
                <PraxisLogo size={28} glow />
              )}
            </Link>
          )}
          {/* Toggle button — desktop only; close button — mobile only */}
          {!collapsed && (
            <>
              <div className="hidden md:flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                  className="cx-icon-btn cx-focus-ring"
                >
                  <PanelLeftClose size={16} strokeWidth={1.75} />
                </button>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="md:hidden text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors p-1 rounded"
              >
                <X size={18} />
              </button>
            </>
          )}
        </div>

        {/* Expand button when collapsed — desktop only */}
        {collapsed && (
          <div className="hidden md:flex justify-center py-2 border-b border-[var(--color-border)]">
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="cx-icon-btn cx-focus-ring"
            >
              <PanelLeftOpen size={16} strokeWidth={1.75} />
            </button>
          </div>
        )}

        {/* New chat — quick action */}
        {collapsed ? (
          <motion.button
            type="button"
            onClick={() => {
              close();
              router.push("/app");
              router.refresh();
            }}
            title="New chat"
            aria-label="New chat"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto my-2 flex items-center justify-center w-8 h-8 rounded-lg"
            style={{
              background: "color-mix(in srgb, var(--color-accent) 12%, var(--color-surface-elevated))",
              border: "1px solid color-mix(in srgb, var(--color-accent) 25%, var(--color-border))",
              color: "var(--color-accent)",
            }}
          >
            <Plus size={14} />
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={() => {
              close();
              router.push("/app");
              router.refresh();
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mx-3 my-2 flex items-center gap-2 px-3 py-2 rounded-lg cx-type-sm font-medium"
            style={{
              background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-elevated))",
              border: "1px solid color-mix(in srgb, var(--color-accent) 22%, var(--color-border))",
              color: "var(--color-accent-hi, var(--color-accent))",
            }}
          >
            <Plus size={14} /> New chat
          </motion.button>
        )}

        {/* Primary nav sections */}
        <nav className="flex-1 overflow-y-auto pb-3" aria-label="Main navigation">
          <NavLink
            href="/app/workspace"
            icon={<LayoutGrid size={20} />}
            label="Workspace"
            active={isActive("/app/workspace")}
            onClick={close}
            collapsed={collapsed}
          />
          <div data-tour-target="specialists">
          <NavLink
            href="/app/team"
            icon={<Users2 size={20} />}
            label="Team"
            active={pathname === "/app/team"}
            onClick={close}
            collapsed={collapsed}
          />
          </div>

          {/* Pinned specialists — non-collapsed, shown above the full team list */}
          {!collapsed && pinned.length > 0 && (
            <div className="mt-3">
              <div className="px-3 py-1 flex items-center gap-1.5 cx-type-xs font-medium uppercase tracking-[0.14em]" style={{ color: "var(--cx-text-faint, var(--color-text-muted))" }}>
                <Pin size={9} aria-hidden /> Pinned
              </div>
              <ul className="space-y-0.5 mt-0.5">
                {pinned.map((emp) => {
                  const isStreaming = streamingEmployee === emp;
                  const allowed = allowedEmployees.includes(emp);
                  const active = pathname === `/app/team/${emp}`;
                  const rowInner = (
                    <span
                      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-[120ms] ${!active ? "hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]" : ""}`}
                      style={{
                        background: active ? "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-elevated))" : undefined,
                      }}
                      onContextMenu={(e) => handleSpecialistContextMenu(e, emp)}
                      onTouchStart={(e) => handleSpecialistTouchStart(e, emp)}
                      onTouchEnd={handleSpecialistTouchEnd}
                      onTouchCancel={handleSpecialistTouchEnd}
                    >
                      {active && (
                        <span
                          aria-hidden
                          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[var(--cx-accent,var(--color-accent))]"
                        />
                      )}
                      <SpecialistAvatar employee={emp} size={28} active={active} streaming={isStreaming} />
                      <span
                        className="truncate flex-1 cx-type-sm"
                        style={{ color: active ? "var(--cx-text, var(--color-text))" : "var(--cx-text-muted, var(--color-text-muted))", fontWeight: active ? 500 : 400 }}
                      >
                        {labelFor(emp)}
                      </span>
                      {!allowed ? (
                        <Lock
                          size={10}
                          aria-label="Locked — upgrade to unlock"
                          className="text-[var(--color-text-muted)]"
                        />
                      ) : (
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            background: isStreaming ? "var(--cx-accent, var(--color-accent))" : DEPT_COLOR[emp],
                            opacity: isStreaming ? 1 : 0.5,
                            boxShadow: isStreaming ? "0 0 6px var(--cx-accent, var(--color-accent))" : "none",
                          }}
                          aria-label={isStreaming ? "Active" : "Online"}
                        />
                      )}
                    </span>
                  );
                  return (
                    <li key={emp} title={allowed ? undefined : "Available on a higher plan"}>
                      {allowed ? (
                        <Link href={`/app/team/${emp}`} onClick={close} className="block">{rowInner}</Link>
                      ) : (
                        <Link href="/app/settings" onClick={close} className="block">{rowInner}</Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Team header (collapsible) — hidden in icon-only mode */}
          {!collapsed && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setTeamExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-1.5 cx-type-xs font-medium uppercase tracking-[0.14em] transition-colors duration-[120ms] hover:text-[var(--cx-text-muted,var(--color-text-muted))]"
                style={{ color: "var(--cx-text-faint, var(--color-text-muted))" }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Users2 size={11} /> Specialists
                </span>
                <span aria-hidden className="text-[10px]">
                  {teamExpanded ? "−" : "+"}
                </span>
              </button>
              {teamExpanded && (
                <ul className="space-y-0.5 mt-1">
                  {TEAM.map((emp) => {
                    const isStreaming = streamingEmployee === emp;
                    const allowed = allowedEmployees.includes(emp);
                    const active = pathname === `/app/team/${emp}`;
                    const rowInner = (
                      <span
                        className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-[120ms] ${!active ? "hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]" : ""}`}
                        style={{
                          background: active ? "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-elevated))" : undefined,
                        }}
                        onContextMenu={(e) => handleSpecialistContextMenu(e, emp)}
                        onTouchStart={(e) => handleSpecialistTouchStart(e, emp)}
                        onTouchEnd={handleSpecialistTouchEnd}
                        onTouchCancel={handleSpecialistTouchEnd}
                      >
                        {active && (
                          <span
                            aria-hidden
                            className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[var(--cx-accent,var(--color-accent))]"
                          />
                        )}
                        <SpecialistAvatar employee={emp} size={28} active={active} streaming={isStreaming} />
                        <span
                          className="truncate flex-1 cx-type-sm"
                          style={{ color: active ? "var(--cx-text, var(--color-text))" : "var(--cx-text-muted, var(--color-text-muted))", fontWeight: active ? 500 : 400 }}
                        >
                          {labelFor(emp)}
                        </span>
                        {!allowed ? (
                          <Lock
                            size={10}
                            aria-label="Locked — upgrade to unlock"
                            className="text-[var(--color-text-muted)]"
                          />
                        ) : (
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              background: isStreaming ? "var(--cx-accent, var(--color-accent))" : DEPT_COLOR[emp],
                              opacity: isStreaming ? 1 : 0.5,
                              boxShadow: isStreaming ? "0 0 6px var(--cx-accent, var(--color-accent))" : "none",
                            }}
                            aria-label={isStreaming ? "Active" : "Online"}
                          />
                        )}
                      </span>
                    );
                    return (
                      <li
                        key={emp}
                        title={allowed ? undefined : "Available on a higher plan"}
                      >
                        {allowed ? (
                          <Link
                            href={`/app/team/${emp}`}
                            onClick={close}
                            className="block"
                          >
                            {rowInner}
                          </Link>
                        ) : (
                          <Link
                            href="/app/settings"
                            onClick={close}
                            className="block"
                          >
                            {rowInner}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Team icons — icon-only mode */}
          {collapsed && (
            <div className="mt-2 space-y-0.5 px-2">
              {TEAM.map((emp) => {
                const isStreaming = streamingEmployee === emp;
                const allowed = allowedEmployees.includes(emp);
                const active = pathname === `/app/team/${emp}`;
                const isPinned = pinned.includes(emp);
                const btn = (
                  <span
                    className="relative flex items-center justify-center"
                    onContextMenu={(e) => handleSpecialistContextMenu(e, emp)}
                    onTouchStart={(e) => handleSpecialistTouchStart(e, emp)}
                    onTouchEnd={handleSpecialistTouchEnd}
                    onTouchCancel={handleSpecialistTouchEnd}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[var(--color-accent)] z-10"
                      />
                    )}
                    <SpecialistAvatar employee={emp} size={32} active={active} streaming={isStreaming} />
                    {!allowed && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 flex items-center justify-center z-10">
                        <Lock size={8} className="text-[var(--color-text-muted)]" />
                      </span>
                    )}
                    {allowed && !isPinned && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-[var(--color-surface)] z-10"
                        style={{
                          background: DEPT_COLOR[emp],
                          opacity: isStreaming ? 1 : 0.55,
                          boxShadow: isStreaming ? `0 0 4px ${DEPT_COLOR[emp]}` : "none",
                        }}
                      />
                    )}
                    {allowed && isPinned && (
                      <span
                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 flex items-center justify-center rounded-full border border-[var(--color-surface)] z-10"
                        style={{ background: DEPT_COLOR[emp] }}
                        aria-label="Pinned"
                      >
                        <Pin size={7} style={{ color: "var(--color-canvas, #fff)" }} strokeWidth={2.5} />
                      </span>
                    )}
                  </span>
                );
                return (
                  <li key={emp} className="list-none flex justify-center" title={labelFor(emp)}>
                    {allowed ? (
                      <Link href={`/app/team/${emp}`} onClick={close} className="block">
                        {btn}
                      </Link>
                    ) : (
                      <Link href="/app/settings" onClick={close} className="block">
                        {btn}
                      </Link>
                    )}
                  </li>
                );
              })}
            </div>
          )}

          <div className="mt-3 space-y-0.5">
            <NavLink
              href="/app/voice"
              icon={<Mic size={20} />}
              label="Voice Room"
              active={isActive("/app/voice")}
              onClick={close}
              collapsed={collapsed}
            />
            {allowedEmployees.includes("sales") && (
              <NavLink
                href="/app/team/sales"
                icon={<Sparkles size={20} />}
                label="Leads"
                active={pathname === "/app/team/sales"}
                onClick={close}
                collapsed={collapsed}
              />
            )}
            <div data-tour-target="memory">
            <NavLink
              href="/app/activity"
              icon={<Activity size={20} />}
              label="Activity"
              active={isActive("/app/activity")}
              onClick={close}
              collapsed={collapsed}
            />
            <NavLink
              href="/app/memory"
              icon={<Brain size={20} />}
              label="Memory"
              active={isActive("/app/memory")}
              onClick={close}
              collapsed={collapsed}
            />
            </div>
            <NavLink
              href="/app/outputs"
              icon={<Bookmark size={20} />}
              label="Outputs"
              active={isActive("/app/outputs")}
              onClick={close}
              collapsed={collapsed}
            />
            {allowedEmployees.includes("engineering") && (
              <Link
                href="/app/builds"
                onClick={close}
                title={collapsed ? "Builds" : undefined}
                aria-label={collapsed ? "Builds" : undefined}
                className={[
                  "relative flex items-center rounded-lg transition-colors duration-100",
                  collapsed ? "justify-center mx-auto w-8 h-8" : "gap-2 px-3 py-2 text-sm",
                  isActive("/app/builds")
                    ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]",
                ].join(" ")}
              >
                {isActive("/app/builds") && (
                  <span
                    aria-hidden
                    className={`absolute left-0 rounded-full ${
                      collapsed ? "top-1.5 bottom-1.5 w-0.5" : "top-2 bottom-2 w-[3px]"
                    }`}
                    style={{ background: "var(--cx-accent, var(--color-accent))" }}
                  />
                )}
                <span
                  className="relative inline-flex shrink-0"
                  style={{ color: isActive("/app/builds") ? "var(--cx-accent, var(--color-accent))" : undefined }}
                >
                  <Hammer size={collapsed ? 20 : 16} strokeWidth={1.75} />
                  <SidebarBuildPip
                    initial={inFlightBuildsInitial}
                    accountId={accountId}
                  />
                </span>
                <AnimatePresence mode="popLayout">
                  {!collapsed && (
                    <motion.span
                      key="builds-label"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
                      className="truncate"
                    >
                      Builds
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )}
            <NavLink
              href="/app/analytics"
              icon={<BarChart3 size={20} />}
              label="Analytics"
              active={isActive("/app/analytics")}
              onClick={close}
              collapsed={collapsed}
            />
          </div>

          {/* In-flight builds — hidden in icon-only mode */}
          {!collapsed && allowedEmployees.includes("engineering") && (
            <SidebarBuildsSection
              initial={inFlightBuildsInitial}
              accountId={accountId}
            />
          )}

          {/* Empty state — no conversations yet, not in icon-only mode */}
          {!collapsed && conversations.length === 0 && (
            <div className="mt-8 px-4 flex flex-col items-center text-center gap-3">
              <PraxisLogo size={28} withWordmark glow />
              <p className="text-sm font-semibold text-[var(--color-text)] mt-1">
                Your specialists are ready
              </p>
              <p className="text-xs text-[var(--color-text-muted)] max-w-[13rem] leading-relaxed">
                Nine specialists. Zero payroll. Start a conversation to put your team to work.
              </p>
              <Link
                href="/app"
                onClick={close}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity mt-1"
              >
                <Plus size={12} />
                Start a conversation
              </Link>
            </div>
          )}

          {/* Recent conversations — hidden in icon-only mode */}
          {!collapsed && conversations.length > 0 && (
            <div className="mt-3">
              <div className="px-3 pt-3 pb-1.5 cx-type-xs font-medium uppercase tracking-[0.14em]" style={{ color: "var(--cx-text-faint, var(--color-text-muted))" }}>
                Conversations
              </div>

              {/* Specialist filter chips — only when 2+ specialists appear in the list */}
              {activeSpecialists.length > 1 && (
                <div
                  className="px-2 pb-1 flex items-center gap-1 overflow-x-auto"
                  style={{ scrollbarWidth: "none" }}
                  role="group"
                  aria-label="Filter by specialist"
                >
                  {/* "All" chip */}
                  <button
                    type="button"
                    onClick={() => setSpecialistFilter(null)}
                    className="shrink-0 flex items-center px-2 py-0.5 rounded-full cx-type-xs font-medium transition-colors duration-100 whitespace-nowrap"
                    style={
                      specialistFilter === null
                        ? {
                            background: "var(--color-accent)",
                            color: "#fff",
                          }
                        : {
                            background: "var(--color-surface-elevated)",
                            color: "var(--color-text-muted)",
                            border: "1px solid var(--color-border)",
                          }
                    }
                    aria-pressed={specialistFilter === null}
                  >
                    All
                  </button>
                  {activeSpecialists.map((emp) => {
                    const active = specialistFilter === emp;
                    return (
                      <button
                        key={emp}
                        type="button"
                        onClick={() =>
                          setSpecialistFilter(active ? null : emp)
                        }
                        title={labelFor(emp)}
                        aria-label={`Filter by ${labelFor(emp)}`}
                        aria-pressed={active}
                        className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full cx-type-xs font-medium transition-colors duration-100 whitespace-nowrap"
                        style={
                          active
                            ? {
                                background: `color-mix(in srgb, ${DEPT_COLOR[emp]} 20%, var(--color-surface-elevated))`,
                                color: DEPT_COLOR[emp],
                                border: `1px solid color-mix(in srgb, ${DEPT_COLOR[emp]} 50%, transparent)`,
                              }
                            : {
                                background: "var(--color-surface-elevated)",
                                color: "var(--color-text-muted)",
                                border: "1px solid var(--color-border)",
                              }
                        }
                      >
                        <SpecialistAvatar employee={emp} size={12} active={active} />
                        {labelFor(emp)}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Search input */}
              <div className="px-2 pb-1">
                {/* Mobile: icon-only trigger — collapses the search to a single tap target */}
                <button
                  type="button"
                  onClick={() => {
                    setSearchExpanded(true);
                    requestAnimationFrame(() => searchInputRef.current?.focus());
                  }}
                  aria-label="Search conversations"
                  className={`${searchExpanded ? "hidden" : "md:hidden"} flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-100`}
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <Search size={13} />
                </button>
                {/* Full input: always on desktop; on mobile only when expanded */}
                <div
                  className={`${searchExpanded ? "flex" : "hidden md:flex"} items-center gap-1.5 px-2 py-1.5 rounded-lg`}
                  style={{
                    background: "var(--color-surface-elevated)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <Search
                    size={11}
                    className="shrink-0"
                    style={{ color: "var(--color-text-muted)" }}
                  />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={convSearch}
                    onChange={(e) => setConvSearch(e.target.value)}
                    placeholder="Search conversations…"
                    aria-label="Search conversations"
                    autoComplete="off"
                    className="flex-1 min-w-0 bg-transparent text-xs outline-none placeholder:text-[var(--color-text-muted)]"
                    style={{ color: "var(--color-text)" }}
                  />
                  {convSearch && (
                    <button
                      type="button"
                      onClick={() => { setConvSearch(""); searchInputRef.current?.focus(); }}
                      aria-label="Clear search"
                      className="shrink-0"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtered list */}
              {(() => {
                const q = convSearch.trim().toLowerCase();
                const bySearch = q
                  ? conversations.filter((c) =>
                      (titleOverrides[c.id] ?? c.title ?? "").toLowerCase().includes(q)
                    )
                  : conversations;
                const filtered = specialistFilter
                  ? bySearch.filter(
                      (c) => c.dominant_employee === specialistFilter,
                    )
                  : bySearch.slice(0, 8);
                return (
                  <>
                    <div className="space-y-0.5">
                      {filtered.slice(0, 8).map((c) => {
                        const active = isChat && activeId === c.id;
                        const dom = c.dominant_employee;
                        const isTeam = dom === "team";
                        const empKey = (
                          dom && (TEAM as string[]).includes(dom) ? dom : "jarvis"
                        ) as EmployeeKey;
                        return (
                          <Link
                            key={c.id}
                            href={`/app?c=${c.id}`}
                            onClick={close}
                            className={`relative flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg transition-colors duration-[120ms] group ${!active ? "hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]" : ""}`}
                            style={{
                              background: active ? "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-elevated))" : undefined,
                            }}
                            onMouseEnter={(e) => openPeek(c.id, e.currentTarget)}
                            onMouseLeave={closePeek}
                            onFocus={(e) => openPeek(c.id, e.currentTarget, true)}
                            onBlur={closePeek}
                          >
                            {active && (
                              <span
                                aria-hidden
                                className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[var(--cx-accent,var(--color-accent))]"
                              />
                            )}
                            {isTeam ? (
                              <span
                                aria-hidden
                                className="inline-block w-3.5 h-3.5 rounded-full shrink-0"
                                style={{
                                  background:
                                    "conic-gradient(from 90deg, var(--color-dept-marketing), var(--color-dept-sales), var(--color-dept-engineering), var(--color-dept-jarvis), var(--color-dept-marketing))",
                                }}
                              />
                            ) : (
                              <SpecialistAvatar employee={empKey} size={16} active={active} />
                            )}
                            <span
                              className="truncate flex-1 cx-type-sm leading-snug"
                              style={{
                                color: active ? "var(--cx-text, var(--color-text))" : "var(--cx-text-muted, var(--color-text-muted))",
                                fontWeight: active ? 500 : 400,
                              }}
                            >
                              {titleOverrides[c.id] ?? c.title ?? "Untitled chat"}
                            </span>
                            <span
                              className="shrink-0 cx-mono cx-type-xs opacity-40 group-hover:opacity-80 transition-opacity duration-[120ms]"
                              style={{ color: "var(--cx-text-faint, var(--color-text-muted))" }}
                            >
                              {relativeDate(c.updated_at)}
                            </span>
                            {c.labels && c.labels.length > 0 && (
                              <span className="flex items-center gap-0.5 shrink-0">
                                {c.labels.slice(0, 3).map((l) => (
                                  <span
                                    key={l.id}
                                    aria-label={l.name}
                                    title={l.name}
                                    className="inline-block w-2 h-2 rounded-full"
                                    style={{ background: l.color }}
                                  />
                                ))}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                    {(q || specialistFilter) && filtered.length === 0 && (
                      <p className="px-3 py-2 cx-type-xs" style={{ color: "var(--color-text-muted)" }}>
                        {specialistFilter && !q
                          ? `No conversations with ${labelFor(specialistFilter)} yet`
                          : "No conversations match"}
                      </p>
                    )}
                    {!q && !specialistFilter && conversations.length > 8 && (
                      <Link
                        href="/app/conversations"
                        onClick={close}
                        className="mt-1 flex items-center px-3 py-1.5 cx-type-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                      >
                        See all ({conversations.length})
                      </Link>
                    )}
                    {filtered.length > 8 && (
                      <p className="px-3 py-1 cx-type-xs" style={{ color: "var(--color-text-muted)" }}>
                        Showing 8 of {filtered.length} matches
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </nav>

        {/* Onboarding checklist — early-stage workspaces only, hidden in icon-only mode */}
        {!collapsed && !showGettingStarted && (
          <OnboardingChecklist
            conversationCount={conversations.length}
            hasContext={Boolean(hasContext)}
          />
        )}

        {/* Getting-started checklist — new accounts only, hidden in icon-only mode */}
        {!collapsed && showGettingStarted && (
          <GettingStartedChecklist hasConversations={conversations.length > 0} />
        )}

        {/* Upgrade banner — free-plan users only, hidden in icon-only mode */}
        {!collapsed && tierId === "free" && !internalAccount && typeof tokensUsed === "number" && typeof tokensAllowance === "number" && (
          <SidebarUpgradeBanner
            tokensUsed={tokensUsed}
            tokensAllowance={tokensAllowance}
            onUpgradeClick={() => setShowPaywall(true)}
          />
        )}

        {/* Bottom — settings, billing, sign out, email, tier */}
        <div
          className="pt-2 pb-3 space-y-0.5"
          style={{
            borderTop: "1px solid var(--cx-border, var(--color-border))",
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0.75rem))",
          }}
        >
          {collapsed ? (
            // Icon-only bottom strip
            <div className="flex flex-col items-center gap-1 px-2">
              <div className="flex justify-center"><ChangelogPopover /></div>
              <div className="flex justify-center"><NotificationCenter /></div>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("praxis:shortcuts:open"))}
                title="Keyboard shortcuts"
                aria-label="Keyboard shortcuts"
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-[120ms]"
                style={{ color: "var(--cx-text-muted, var(--color-text-muted))" }}
              >
                <CircleHelp size={16} />
              </button>
              <SidebarThemeButton collapsed />
              <Link href="/app/settings" title="Settings" aria-label="Settings" onClick={close} data-tour-target="settings"
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-[120ms] ${isActive("/app/settings") ? "" : ""}`}
                style={{
                  background: isActive("/app/settings") ? "color-mix(in srgb, var(--cx-accent, var(--color-accent)) 12%, var(--color-surface-elevated))" : undefined,
                  color: isActive("/app/settings") ? "var(--cx-accent, var(--color-accent))" : "var(--cx-text-muted, var(--color-text-muted))",
                }}>
                <Settings size={16} />
              </Link>
              <Link href="/app/settings/billing" title="Billing" aria-label="Billing" onClick={close}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-[120ms]"
                style={{
                  background: isActive("/app/settings/billing") ? "color-mix(in srgb, var(--cx-accent, var(--color-accent)) 12%, var(--color-surface-elevated))" : undefined,
                  color: isActive("/app/settings/billing") ? "var(--cx-accent, var(--color-accent))" : "var(--cx-text-muted, var(--color-text-muted))",
                }}>
                <CreditCard size={16} />
              </Link>
              <form action="/auth/sign-out" method="post">
                <button type="submit" title="Sign out" aria-label="Sign out"
                  className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-[120ms]"
                  style={{ color: "var(--cx-text-muted, var(--color-text-muted))" }}>
                  <LogOut size={16} />
                </button>
              </form>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center cx-type-xs font-semibold shrink-0 overflow-hidden mt-1"
                style={{
                  background: "color-mix(in srgb, var(--cx-accent, var(--color-accent)) 15%, var(--cx-surface, var(--color-surface-elevated)))",
                  border: "1px solid color-mix(in srgb, var(--cx-accent, var(--color-accent)) 25%, var(--cx-border, var(--color-border)))",
                }}
                title={displayName || userEmail}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span style={{ color: "var(--color-accent-hi)" }}>
                    {(displayName || userEmail)[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="px-2 space-y-0.5">
              <ChangelogPopover />
              <div className="px-1"><NotificationCenter /></div>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("praxis:shortcuts:open"))}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] rounded-lg transition-colors duration-100"
              >
                <CircleHelp size={16} /> Shortcuts
              </button>
              <SidebarThemeButton />
              <div data-tour-target="settings">
              <NavLink
                href="/app/settings"
                icon={<Settings size={16} />}
                label="Settings"
                active={
                  pathname === "/app/settings" ||
                  (pathname.startsWith("/app/settings/") &&
                    !pathname.startsWith("/app/settings/billing"))
                }
                onClick={close}
                small
              />
              </div>
              <NavLink
                href="/app/settings/billing"
                icon={<CreditCard size={16} />}
                label="Billing"
                active={isActive("/app/settings/billing")}
                onClick={close}
                small
              />
              <form action="/auth/sign-out" method="post">
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] rounded-lg transition-colors duration-100"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </form>
              <div className="px-3 pt-2 flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center cx-type-xs font-semibold shrink-0 overflow-hidden"
                  style={{
                    background: "color-mix(in srgb, var(--color-accent) 15%, var(--color-surface-elevated))",
                    border: "1px solid color-mix(in srgb, var(--color-accent) 25%, var(--color-border))",
                  }}
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ color: "var(--color-accent-hi, var(--color-accent))" }}>
                      {(displayName || userEmail)[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="cx-type-xs font-medium truncate" style={{ color: "var(--color-text)" }}>
                    {displayName || userEmail.split("@")[0]}
                  </div>
                  <div className="cx-type-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                    {tierName ? tierName : "Free"}{" "}
                    {workspaceName || accountName ? `· ${(workspaceName || accountName).slice(0, 16)}` : ""}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Upgrade / paywall modal — triggered from banner CTA */}
      {showPaywall && (
        <PaywallModal
          payload={{
            reason: "employee_locked",
            message: "Upgrade to unlock all 9 Praxis specialists.",
          } satisfies PaywallPayload}
          onClose={() => setShowPaywall(false)}
        />
      )}

      {/* Specialist pin/unpin context menu — portal-rendered to escape sidebar overflow */}
      {portalMounted && ctxMenu && createPortal(
        <div
          role="menu"
          aria-label="Specialist options"
          onClick={(e) => e.stopPropagation()}
          className="praxis-root"
          style={{
            position: "fixed",
            top: ctxMenu.y,
            left: ctxMenu.x,
            zIndex: 100,
            minWidth: 140,
            borderRadius: 10,
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-elevated)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            padding: "4px",
          }}
        >
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              pinned.includes(ctxMenu.emp) ? unpin(ctxMenu.emp) : pin(ctxMenu.emp);
              setCtxMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors duration-100 hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
            style={{ color: "var(--color-text)" }}
          >
            <Pin size={12} style={{ color: "var(--color-text-muted)" }} />
            {pinned.includes(ctxMenu.emp) ? "Unpin specialist" : "Pin specialist"}
          </button>
        </div>,
        document.body
      )}

      {/* Conversation quick-peek tooltip — portal-rendered to escape sidebar overflow */}
      {portalMounted && peekId && peekRect && (() => {
        const conv = conversations.find((c) => c.id === peekId);
        if (!conv) return null;
        const dom = conv.dominant_employee;
        const isTeam = dom === "team";
        const empKey = (dom && (TEAM as string[]).includes(dom) ? dom : "jarvis") as EmployeeKey;
        const preview = conv.last_message
          ? conv.last_message.replace(/\n+/g, " ").trim().slice(0, 120) +
            (conv.last_message.length > 120 ? "…" : "")
          : null;
        const tooltipTop = peekRect.top + peekRect.height / 2;
        const tooltipLeft = peekRect.right + 8;
        return createPortal(
          <div
            role="tooltip"
            className="praxis-root pdl-tooltip pdl-glass"
            style={{
              position: "fixed",
              top: tooltipTop,
              left: tooltipLeft,
              transform: "translateY(-50%)",
              maxWidth: 240,
              pointerEvents: "none",
              zIndex: 50,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              {isTeam ? (
                <span
                  aria-hidden
                  className="inline-block w-3.5 h-3.5 rounded-full shrink-0"
                  style={{
                    background:
                      "conic-gradient(from 90deg, var(--color-dept-marketing), var(--color-dept-sales), var(--color-dept-engineering), var(--color-dept-jarvis), var(--color-dept-marketing))",
                  }}
                />
              ) : (
                <SpecialistAvatar employee={empKey} size={14} />
              )}
              <span
                className="cx-type-xs font-semibold truncate"
                style={{ color: isTeam ? "var(--color-accent-hi)" : DEPT_COLOR[empKey] }}
              >
                {isTeam ? "Team" : employeeLabel(empKey)}
              </span>
            </div>
            {preview ? (
              <p className="cx-type-xs leading-snug" style={{ color: "var(--pdl-text-muted, var(--color-text-muted))" }}>
                {preview}
              </p>
            ) : (
              <p className="cx-type-xs italic" style={{ color: "var(--pdl-text-muted, var(--color-text-muted))" }}>
                No messages yet
              </p>
            )}
          </div>,
          document.body,
        );
      })()}
    </>
  );
}

function NavLink({
  href,
  icon,
  label,
  active,
  onClick,
  small = false,
  collapsed = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
  small?: boolean;
  collapsed?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={[
        "relative flex items-center rounded-lg transition-colors duration-100",
        collapsed
          ? "justify-center mx-auto w-8 h-8"
          : `gap-2 px-3 ${small ? "py-1.5" : "py-2"}`,
        !active
          ? "hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] hover:text-[var(--color-text)]"
          : "",
      ].join(" ")}
      style={{
        fontSize: !collapsed && small ? "0.75rem" : "0.8125rem",
        background: active
          ? `color-mix(in srgb, var(--color-accent) ${collapsed ? 12 : 10}%, var(--color-surface-elevated))`
          : undefined,
        color: active ? "var(--color-text)" : "var(--color-text-muted)",
        fontWeight: active ? 500 : 400,
      }}
    >
      {active && (
        <span
          aria-hidden
          className={`absolute left-0 rounded-full ${
            collapsed ? "top-1.5 bottom-1.5 w-0.5" : "top-2 bottom-2 w-[3px]"
          }`}
          style={{ background: "var(--cx-accent, var(--color-accent))" }}
        />
      )}
      <motion.span
        whileHover={shouldReduceMotion ? undefined : { scale: collapsed ? 1.15 : 1.12 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
        transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="shrink-0 inline-flex"
        style={{ color: active ? "var(--cx-accent, var(--color-accent))" : undefined }}
      >
        {icon}
      </motion.span>
      <AnimatePresence mode="popLayout">
        {!collapsed && (
          <motion.span
            key="nav-label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.12, ease: [0.22, 1, 0.36, 1] }
            }
            className="truncate"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
