"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CX_EASE, CX_DUR_FAST, CX_DUR_BASE } from "@/lib/ui/motion";
import {
  Activity,
  BarChart3,
  Bookmark,
  Brain,
  Check,
  CircleHelp,
  CreditCard,
  Hammer,
  LayoutGrid,
  Lock,
  LogOut,
  MessageSquare,
  Mic,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Pin,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  Users2,
  Monitor,
  X,
} from "lucide-react";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, DEPT_COLOR_SOFT, employeeLabel } from "./EmployeeBadge";
import { SpecialistAvatar } from "./SpecialistAvatar";
import { EMPLOYEE_ORDER, EMPLOYEES } from "@/lib/conduit/employees";
import { useNicknames } from "@/context/NicknameContext";
import { PraxisLogo } from "./PraxisLogo";
import { SidebarBuildPip } from "./builds/in-flight/SidebarBuildPip";
import { SidebarBuildsSection } from "./builds/in-flight/SidebarBuildsSection";
import { Button, PraxisButton } from "@/components/conduit/ui/Button";
import type { InFlightBuild } from "@/lib/engineering/in-flight";
import { ChangelogPopover } from "./ChangelogPopover";
import { NotificationCenter } from "./NotificationCenter";
import { PaywallModal } from "./PaywallModal";
import type { PaywallPayload } from "./PaywallModal";
import { GettingStartedChecklist } from "./GettingStartedChecklist";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { Tooltip } from "./pdl/Tooltip";

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
      className="mx-3 mb-2 rounded-[var(--cx-radius-md)]"
      style={{
        background: "color-mix(in srgb, var(--cx-accent) 6%, var(--cx-surface))",
        border: "1px solid color-mix(in srgb, var(--cx-accent) 20%, var(--cx-border))",
      }}
    >
      <div className="px-3 pt-3 pb-3">
        <div className="flex items-start justify-between gap-1 mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={11} strokeWidth={1.75} style={{ color: "var(--cx-accent)", flexShrink: 0 }} />
            <span className="cx-type-xs font-semibold" style={{ color: "var(--cx-text)" }}>
              Unlock all 9 specialists
            </span>
          </div>
          <PraxisButton
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={dismiss}
            aria-label="Dismiss upgrade prompt"
          >
            <X size={12} strokeWidth={1.75} />
          </PraxisButton>
        </div>

        {/* Usage meter */}
        <div className="mb-3">
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 4, background: "var(--cx-border)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct * 100}%`,
                background: pct >= 0.8 ? "var(--cx-danger)" : "var(--cx-accent)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <p className="cx-mono cx-type-xs mt-1" style={{ color: "var(--cx-text-muted)" }}>
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
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored !== null) return stored === "1";
    // No explicit preference — auto-collapse on tablet (768–1023px)
    return window.innerWidth >= 768 && window.innerWidth < 1024;
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
    light: <Sun size={16} strokeWidth={1.75} />,
    dark: <Moon size={16} strokeWidth={1.75} />,
    system: <Monitor size={16} strokeWidth={1.75} />,
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
      <PraxisButton
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={cycle}
        title={nextLabels[pref]}
        aria-label={nextLabels[pref]}
      >
        {icons[pref]}
      </PraxisButton>
    );
  }

  return (
    <PraxisButton
      type="button"
      variant="ghost"
      size="sm"
      onClick={cycle}
      title={nextLabels[pref]}
      className="w-full justify-start"
    >
      {icons[pref]}
      {labels[pref]}
    </PraxisButton>
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

  // Inline rename / delete for conversation rows
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    // Responsive: auto-collapse/expand on resize when user has no stored preference.
    const onResize = () => {
      try {
        if (localStorage.getItem(COLLAPSED_KEY) !== null) return;
      } catch { /* ignore */ }
      setCollapsed(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    window.addEventListener("resize", onResize, { passive: true });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSkipTransition(false));
    });
    return () => window.removeEventListener("resize", onResize);
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

  const startRename = (id: string, currentTitle: string) => {
    setDeletingId(null);
    setRenamingId(id);
    setRenameValue(currentTitle);
  };

  const commitRename = async () => {
    if (!renamingId) return;
    const idToRename = renamingId;
    const trimmed = renameValue.trim();
    if (!trimmed) { setRenamingId(null); return; }
    const prev = titleOverrides[idToRename] ?? conversations.find((c) => c.id === idToRename)?.title ?? "Untitled chat";
    setRenamingId(null);
    if (trimmed === prev) return;
    setTitleOverrides((p) => ({ ...p, [idToRename]: trimmed }));
    window.dispatchEvent(new CustomEvent("praxis:title_updated", { detail: { conversation_id: idToRename, title: trimmed } }));
    try {
      const res = await fetch(`/api/conduit/conversations/${idToRename}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) {
        setTitleOverrides((p) => ({ ...p, [idToRename]: prev }));
        window.dispatchEvent(new CustomEvent("praxis:title_updated", { detail: { conversation_id: idToRename, title: prev } }));
      }
    } catch {
      setTitleOverrides((p) => ({ ...p, [idToRename]: prev }));
      window.dispatchEvent(new CustomEvent("praxis:title_updated", { detail: { conversation_id: idToRename, title: prev } }));
    }
  };

  const cancelRename = () => { setRenamingId(null); setRenameValue(""); };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); void commitRename(); }
    if (e.key === "Escape") { e.preventDefault(); cancelRename(); }
  };

  const confirmDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/conduit/conversations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeletingId(null);
        setDeleteLoading(false);
        if (activeId === id) router.push("/app");
        router.refresh();
      } else {
        setDeleteLoading(false);
      }
    } catch {
      setDeleteLoading(false);
    }
  };

  const openPeek = (id: string, el: HTMLElement, fromFocus = false) => {
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
        animate={{ width: collapsed ? 52 : 256, minWidth: collapsed ? 52 : 256 }}
        transition={skipTransition || shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease: [...CX_EASE] }}
        className={`cx-glass border-r border-[var(--cx-glass-border)] fixed md:static z-40 inset-y-0 left-0 flex flex-col overflow-hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        style={{
          transition: shouldReduceMotion ? "none" : "transform 180ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Header — workspace logo / Praxis wordmark + collapse toggle */}
        <div
          className={`px-3 py-3 flex items-center border-b ${
            collapsed ? "justify-center" : "justify-between"
          }`}
          style={{ borderColor: "var(--cx-glass-border)" }}
        >
          {!collapsed && (
            <Link
              href="/app/workspace"
              onClick={close}
              className="flex items-center gap-2 min-w-0"
            >
              {avatarUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl}
                    alt="Workspace logo"
                    className="w-7 h-7 rounded-lg object-cover shrink-0"
                    style={{ border: "1px solid var(--cx-border)" }}
                  />
                  <span className="cx-type-sm font-semibold truncate" style={{ color: "var(--cx-text)" }}>
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
                  className="w-7 h-7 rounded-lg object-cover border border-[var(--cx-border)]"
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
                <PraxisButton
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleCollapsed}
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose size={16} strokeWidth={1.75} />
                </PraxisButton>
              </div>
              <PraxisButton
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={close}
                aria-label="Close menu"
                className="md:hidden"
              >
                <X size={18} strokeWidth={1.75} />
              </PraxisButton>
            </>
          )}
        </div>

        {/* Expand button when collapsed — desktop only */}
        {collapsed && (
          <div className="hidden md:flex justify-center py-2 border-b border-[var(--cx-glass-border)]">
            <PraxisButton
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <PanelLeftOpen size={16} strokeWidth={1.75} />
            </PraxisButton>
          </div>
        )}

        {/* New chat — quick action */}
        {collapsed ? (
          <div className="flex justify-center my-2">
            <Button
              variant="primary"
              size="icon-sm"
              onClick={() => {
                close();
                router.push("/app");
                router.refresh();
              }}
              aria-label="New chat"
              title="New chat"
            >
              <Plus size={14} strokeWidth={1.75} />
            </Button>
          </div>
        ) : (
          <div className="mx-3 my-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                close();
                router.push("/app");
                router.refresh();
              }}
              className="w-full justify-start"
            >
              <Plus size={14} strokeWidth={1.75} /> New chat
            </Button>
          </div>
        )}

        {/* Primary nav sections */}
        <nav className="flex-1 overflow-y-auto pb-3" aria-label="Main navigation">
          <NavLink
            href="/app/workspace"
            icon={<LayoutGrid size={20} strokeWidth={1.75} />}
            label="Workspace"
            active={isActive("/app/workspace")}
            onClick={close}
            collapsed={collapsed}
          />
          <div data-tour-target="specialists">
          <NavLink
            href="/app/team"
            icon={<Users2 size={20} strokeWidth={1.75} />}
            label="Team"
            active={pathname === "/app/team"}
            onClick={close}
            collapsed={collapsed}
          />
          </div>

          {/* Pinned specialists — non-collapsed, shown above the full team list */}
          {!collapsed && pinned.length > 0 && (
            <div className="mt-3">
              <div
                className="mx-3 mt-0 mb-2 pb-1 flex items-center gap-2"
                style={{ borderBottom: "1px solid var(--cx-glass-border)" }}
              >
                <Pin size={10} strokeWidth={1.75} aria-hidden style={{ color: "var(--cx-text-faint)" }} />
                <span className="cx-label" style={{ color: "var(--cx-text-faint)" }}>
                  Pinned
                </span>
              </div>
              <ul className="space-y-1 mt-1">
                {pinned.map((emp) => {
                  const isStreaming = streamingEmployee === emp;
                  const allowed = allowedEmployees.includes(emp);
                  const active = pathname === `/app/team/${emp}`;
                  const empRole = EMPLOYEES[emp]?.role ?? "";
                  const deptColor = DEPT_COLOR[emp];
                  const deptColorSoft = DEPT_COLOR_SOFT[emp];
                  const rowInner = (
                    <motion.span
                      whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.98, y: 0 }}
                      transition={{ duration: CX_DUR_FAST, ease: [...CX_EASE] }}
                      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-150 ${!active ? "hover:bg-[var(--cx-surface-raised)]" : ""}`}
                      style={{
                        background: active ? deptColorSoft : undefined,
                      }}
                      onContextMenu={(e) => handleSpecialistContextMenu(e, emp)}
                      onTouchStart={(e) => handleSpecialistTouchStart(e, emp)}
                      onTouchEnd={handleSpecialistTouchEnd}
                      onTouchCancel={handleSpecialistTouchEnd}
                    >
                      {active && (
                        <span
                          aria-hidden
                          className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full"
                          style={{ background: deptColor }}
                        />
                      )}
                      <SpecialistAvatar employee={emp} size={20} active={active} streaming={isStreaming} />
                      <div className="min-w-0 flex-1">
                        <span
                          className="block truncate cx-type-sm"
                          style={{
                            color: active ? deptColor : "var(--cx-text-muted)",
                            fontWeight: active ? 600 : 400,
                          }}
                        >
                          {labelFor(emp)}
                        </span>
                        {empRole && (
                          <span
                            className="block truncate cx-mono cx-type-xs"
                            style={{ color: "var(--cx-text-faint)" }}
                          >
                            {empRole}
                          </span>
                        )}
                      </div>
                      {!allowed ? (
                        <Lock
                          size={10}
                          strokeWidth={1.75}
                          aria-label="Locked — upgrade to unlock"
                          style={{ color: "var(--cx-text-muted)" }}
                        />
                      ) : (
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            background: deptColor,
                            opacity: isStreaming ? 1 : active ? 0.7 : 0.45,
                            boxShadow: isStreaming ? `0 0 5px ${deptColor}` : "none",
                          }}
                          aria-label={isStreaming ? "Active" : "Online"}
                        />
                      )}
                    </motion.span>
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
                className="w-full mx-0 flex items-center justify-between px-3 pt-1 pb-2 rounded-lg transition-colors duration-150 hover:bg-[var(--cx-surface-raised)]"
                style={{ borderBottom: "1px solid var(--cx-glass-border)", marginBottom: "4px" }}
              >
                <span className="cx-label inline-flex items-center gap-2" style={{ color: "var(--cx-text-faint)" }}>
                  <Users2 size={10} strokeWidth={1.75} aria-hidden /> Specialists
                </span>
                <span aria-hidden style={{ fontSize: "var(--cx-type-xs)" }}>
                  {teamExpanded ? "−" : "+"}
                </span>
              </button>
              <AnimatePresence initial={false}>
              {teamExpanded && (
                <motion.ul
                  key="specialists-list"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: CX_DUR_BASE, ease: [...CX_EASE] }}
                  className="space-y-1 mt-1 overflow-hidden"
                >
                  {TEAM.map((emp) => {
                    const isStreaming = streamingEmployee === emp;
                    const allowed = allowedEmployees.includes(emp);
                    const active = pathname === `/app/team/${emp}`;
                    const empRole = EMPLOYEES[emp]?.role ?? "";
                    const deptColor = DEPT_COLOR[emp];
                    const deptColorSoft = DEPT_COLOR_SOFT[emp];
                    const rowInner = (
                      <motion.span
                        whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.98, y: 0 }}
                        transition={{ duration: CX_DUR_FAST, ease: [...CX_EASE] }}
                        className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-150 ${!active ? "hover:bg-[var(--cx-surface-raised)]" : ""}`}
                        style={{
                          background: active ? deptColorSoft : undefined,
                        }}
                        onContextMenu={(e) => handleSpecialistContextMenu(e, emp)}
                        onTouchStart={(e) => handleSpecialistTouchStart(e, emp)}
                        onTouchEnd={handleSpecialistTouchEnd}
                        onTouchCancel={handleSpecialistTouchEnd}
                      >
                        {active && (
                          <span
                            aria-hidden
                            className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full"
                            style={{ background: deptColor }}
                          />
                        )}
                        <SpecialistAvatar employee={emp} size={20} active={active} streaming={isStreaming} />
                        <div className="min-w-0 flex-1">
                          <span
                            className="block truncate cx-type-sm"
                            style={{
                              color: active ? deptColor : "var(--cx-text-muted)",
                              fontWeight: active ? 600 : 400,
                            }}
                          >
                            {labelFor(emp)}
                          </span>
                          {empRole && (
                            <span
                              className="block truncate cx-mono cx-type-xs"
                              style={{ color: "var(--cx-text-faint)" }}
                            >
                              {empRole}
                            </span>
                          )}
                        </div>
                        {!allowed ? (
                          <Lock
                            size={10}
                            strokeWidth={1.75}
                            aria-label="Locked — upgrade to unlock"
                            style={{ color: "var(--cx-text-muted)" }}
                          />
                        ) : (
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              background: deptColor,
                              opacity: isStreaming ? 1 : active ? 0.7 : 0.45,
                              boxShadow: isStreaming ? `0 0 5px ${deptColor}` : "none",
                            }}
                            aria-label={isStreaming ? "Active" : "Online"}
                          />
                        )}
                      </motion.span>
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
                </motion.ul>
              )}
              </AnimatePresence>
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
                const deptColor = DEPT_COLOR[emp];
                const deptColorSoft = DEPT_COLOR_SOFT[emp];
                const btn = (
                  <motion.span
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.06 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                    transition={{ duration: CX_DUR_FAST, ease: [...CX_EASE] }}
                    className="relative flex items-center justify-center w-9 h-9 rounded-lg"
                    style={{ background: active ? deptColorSoft : undefined }}
                    onContextMenu={(e) => handleSpecialistContextMenu(e, emp)}
                    onTouchStart={(e) => handleSpecialistTouchStart(e, emp)}
                    onTouchEnd={handleSpecialistTouchEnd}
                    onTouchCancel={handleSpecialistTouchEnd}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full z-10"
                        style={{ background: deptColor }}
                      />
                    )}
                    <SpecialistAvatar employee={emp} size={28} active={active} streaming={isStreaming} />
                    {!allowed && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 flex items-center justify-center z-10">
                        <Lock size={8} strokeWidth={1.75} style={{ color: "var(--cx-text-muted)" }} />
                      </span>
                    )}
                    {allowed && !isPinned && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-[var(--cx-canvas)] z-10"
                        style={{
                          background: deptColor,
                          opacity: isStreaming ? 1 : active ? 0.7 : 0.5,
                          boxShadow: isStreaming ? `0 0 4px ${deptColor}` : "none",
                        }}
                      />
                    )}
                    {allowed && isPinned && (
                      <span
                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 flex items-center justify-center rounded-full border border-[var(--cx-canvas)] z-10"
                        style={{ background: deptColor }}
                        aria-label="Pinned"
                      >
                        <Pin size={7} style={{ color: "var(--cx-canvas)", strokeWidth: 2.5 }} />
                      </span>
                    )}
                  </motion.span>
                );
                const linkEl = allowed ? (
                  <Link href={`/app/team/${emp}`} onClick={close} className="block">
                    {btn}
                  </Link>
                ) : (
                  <Link href="/app/settings" onClick={close} className="block">
                    {btn}
                  </Link>
                );
                return (
                  <li key={emp} className="list-none flex justify-center">
                    <Tooltip trigger={linkEl} side="right" triggerClassName="block" delay={180}>
                      <span className="cx-type-xs font-medium">{labelFor(emp)}</span>
                    </Tooltip>
                  </li>
                );
              })}
            </div>
          )}

          <div className="mt-3 space-y-1">
            <NavLink
              href="/app/voice"
              icon={<Mic size={20} strokeWidth={1.75} />}
              label="Voice Room"
              active={isActive("/app/voice")}
              onClick={close}
              collapsed={collapsed}
            />
            {allowedEmployees.includes("sales") && (
              <NavLink
                href="/app/team/sales"
                icon={<Sparkles size={20} strokeWidth={1.75} />}
                label="Leads"
                active={pathname === "/app/team/sales"}
                onClick={close}
                collapsed={collapsed}
              />
            )}
            <div data-tour-target="memory">
            <NavLink
              href="/app/activity"
              icon={<Activity size={20} strokeWidth={1.75} />}
              label="Activity"
              active={isActive("/app/activity")}
              onClick={close}
              collapsed={collapsed}
            />
            <NavLink
              href="/app/memory"
              icon={<Brain size={20} strokeWidth={1.75} />}
              label="Memory"
              active={isActive("/app/memory")}
              onClick={close}
              collapsed={collapsed}
            />
            </div>
            <NavLink
              href="/app/outputs"
              icon={<Bookmark size={20} strokeWidth={1.75} />}
              label="Outputs"
              active={isActive("/app/outputs")}
              onClick={close}
              collapsed={collapsed}
            />
            {allowedEmployees.includes("engineering") && (() => {
              const buildsLink = (
                <Link
                  href="/app/builds"
                  onClick={close}
                  aria-label={collapsed ? "Builds" : undefined}
                  className={[
                    "relative flex items-center rounded-lg transition-colors duration-150",
                    collapsed ? "justify-center mx-auto w-8 h-8" : "gap-2 px-3 py-2",
                    isActive("/app/builds")
                      ? "text-[var(--cx-text)]"
                      : "text-[var(--cx-text-muted)] hover:text-[var(--cx-text)] hover:bg-[var(--cx-surface-raised)]",
                  ].join(" ")}
                  style={{
                    background: isActive("/app/builds") ? "var(--cx-accent-tint)" : undefined,
                    fontSize: collapsed ? undefined : "var(--cx-type-sm)",
                  }}
                >
                  {isActive("/app/builds") && (
                    <span
                      aria-hidden
                      className={`absolute left-0 rounded-full ${
                        collapsed ? "top-1.5 bottom-1.5 w-0.5" : "top-2 bottom-2 w-[2px]"
                      }`}
                      style={{ background: "var(--cx-accent)" }}
                    />
                  )}
                  <span
                    className="relative inline-flex shrink-0"
                    style={{ color: isActive("/app/builds") ? "var(--cx-accent)" : undefined }}
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
                        transition={shouldReduceMotion ? { duration: 0 } : { duration: CX_DUR_FAST, ease: [...CX_EASE] }}
                        className="truncate"
                      >
                        Builds
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
              return collapsed ? (
                <Tooltip trigger={buildsLink} side="right" triggerClassName="block" delay={180}>
                  <span className="cx-type-xs font-medium">Builds</span>
                </Tooltip>
              ) : buildsLink;
            })()}
            <NavLink
              href="/app/analytics"
              icon={<BarChart3 size={20} strokeWidth={1.75} />}
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
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "var(--cx-accent-tint)",
                  border: "1px solid color-mix(in srgb, var(--cx-accent) 20%, transparent)",
                }}
              >
                <MessageSquare size={18} strokeWidth={1.75} style={{ color: "var(--cx-accent)" }} />
              </div>
              <div>
                <p className="cx-type-sm font-semibold" style={{ color: "var(--cx-text)" }}>
                  No conversations yet
                </p>
                <p className="cx-type-xs mt-1 max-w-[11rem] mx-auto" style={{ color: "var(--cx-text-muted)", lineHeight: "var(--cx-lh-body)" }}>
                  Pick a specialist and start a conversation
                </p>
              </div>
              <Link
                href="/app"
                onClick={close}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg cx-type-xs font-medium hover:opacity-90 transition-opacity"
                style={{ background: "var(--cx-accent)", color: "var(--cx-canvas)" }}
              >
                Start your first conversation →
              </Link>
            </div>
          )}

          {/* Recent conversations — hidden in icon-only mode */}
          {!collapsed && conversations.length > 0 && (
            <div className="mt-3">
              <div
                className="mx-3 mt-3 mb-2 pb-2 flex items-center gap-2"
                style={{ borderBottom: "1px solid var(--cx-glass-border)" }}
              >
                <span className="cx-label" style={{ color: "var(--cx-text-faint)" }}>
                  Conversations
                </span>
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
                  <motion.button
                    type="button"
                    onClick={() => setSpecialistFilter(null)}
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                    transition={{ duration: CX_DUR_FAST, ease: [...CX_EASE] }}
                    className="shrink-0 flex items-center px-2 py-1 rounded-full cx-type-xs font-medium whitespace-nowrap"
                    style={
                      specialistFilter === null
                        ? {
                            background: "var(--cx-accent)",
                            color: "var(--cx-canvas)",
                          }
                        : {
                            background: "var(--cx-surface-raised)",
                            color: "var(--cx-text-muted)",
                            border: "1px solid var(--cx-border)",
                          }
                    }
                    aria-pressed={specialistFilter === null}
                  >
                    All
                  </motion.button>
                  {activeSpecialists.map((emp) => {
                    const active = specialistFilter === emp;
                    return (
                      <motion.button
                        key={emp}
                        type="button"
                        onClick={() =>
                          setSpecialistFilter(active ? null : emp)
                        }
                        title={labelFor(emp)}
                        aria-label={`Filter by ${labelFor(emp)}`}
                        aria-pressed={active}
                        whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                        transition={{ duration: CX_DUR_FAST, ease: [...CX_EASE] }}
                        className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full cx-type-xs font-medium whitespace-nowrap"
                        style={
                          active
                            ? {
                                background: `color-mix(in srgb, ${DEPT_COLOR[emp]} 20%, var(--cx-surface-raised))`,
                                color: DEPT_COLOR[emp],
                                border: `1px solid color-mix(in srgb, ${DEPT_COLOR[emp]} 50%, transparent)`,
                              }
                            : {
                                background: "var(--cx-surface-raised)",
                                color: "var(--cx-text-muted)",
                                border: "1px solid var(--cx-border)",
                              }
                        }
                      >
                        <SpecialistAvatar employee={emp} size={12} active={active} />
                        {labelFor(emp)}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Search input */}
              <div className="px-2 pb-1">
                {/* Mobile: icon-only trigger — collapses the search to a single tap target */}
                <PraxisButton
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setSearchExpanded(true);
                    requestAnimationFrame(() => searchInputRef.current?.focus());
                  }}
                  aria-label="Search conversations"
                  className={`${searchExpanded ? "hidden" : "md:hidden"}`}
                >
                  <Search size={13} strokeWidth={1.75} />
                </PraxisButton>
                {/* Full input: always on desktop; on mobile only when expanded */}
                <div
                  className={`${searchExpanded ? "flex" : "hidden md:flex"} items-center gap-2 px-2 py-1.5 rounded-lg transition-shadow duration-150 focus-within:[box-shadow:var(--cx-accent-glow)]`}
                  style={{
                    background: "var(--cx-glass-bg)",
                    border: "1px solid var(--cx-glass-border)",
                  }}
                >
                  <Search
                    size={11}
                    strokeWidth={1.75}
                    className="shrink-0"
                    style={{ color: "var(--cx-text-muted)" }}
                  />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={convSearch}
                    onChange={(e) => setConvSearch(e.target.value)}
                    placeholder="Search conversations…"
                    aria-label="Search conversations"
                    autoComplete="off"
                    className="flex-1 min-w-0 bg-transparent text-xs outline-none placeholder:text-[var(--cx-text-muted)]"
                    style={{ color: "var(--cx-text)" }}
                  />
                  {convSearch && (
                    <PraxisButton
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => { setConvSearch(""); searchInputRef.current?.focus(); }}
                      aria-label="Clear search"
                      className="shrink-0"
                    >
                      <X size={11} strokeWidth={1.75} />
                    </PraxisButton>
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
                    <div className="space-y-1">
                      {filtered.slice(0, 8).map((c) => {
                        const active = isChat && activeId === c.id;
                        const dom = c.dominant_employee;
                        const isTeam = dom === "team";
                        const empKey = (
                          dom && (TEAM as string[]).includes(dom) ? dom : "jarvis"
                        ) as EmployeeKey;
                        const preview = c.last_message
                          ? c.last_message.replace(/\n+/g, " ").trim().slice(0, 100)
                          : null;
                        const displayTitle = titleOverrides[c.id] ?? c.title ?? "Untitled chat";

                        const avatarEl = (
                          <span className="shrink-0 mt-1">
                            {isTeam ? (
                              <span
                                aria-hidden
                                className="inline-block w-3.5 h-3.5 rounded-full"
                                style={{
                                  background: "conic-gradient(from 90deg, var(--color-dept-marketing), var(--color-dept-sales), var(--color-dept-engineering), var(--color-dept-jarvis), var(--color-dept-marketing))",
                                }}
                              />
                            ) : (
                              <SpecialistAvatar employee={empKey} size={16} active={active} />
                            )}
                          </span>
                        );

                        return (
                          <motion.div
                            key={c.id}
                            className="group relative"
                            whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                            whileTap={shouldReduceMotion ? undefined : { y: 0, scale: 0.99 }}
                            transition={{ duration: CX_DUR_FAST, ease: [...CX_EASE] }}
                          >
                            {deletingId === c.id ? (
                              /* Delete confirmation inline strip */
                              <div
                                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                style={{
                                  background: "color-mix(in srgb, var(--cx-danger) 8%, var(--cx-surface))",
                                  border: "1px solid color-mix(in srgb, var(--cx-danger) 20%, var(--cx-border))",
                                }}
                              >
                                <Trash2 size={12} strokeWidth={1.75} style={{ color: "var(--cx-danger)", flexShrink: 0 }} />
                                <span className="cx-type-xs flex-1 truncate" style={{ color: "var(--cx-text)" }}>
                                  Delete this conversation?
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <PraxisButton
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => setDeletingId(null)}
                                    aria-label="Cancel delete"
                                    disabled={deleteLoading}
                                  >
                                    <X size={11} strokeWidth={1.75} />
                                  </PraxisButton>
                                  <PraxisButton
                                    type="button"
                                    variant="danger"
                                    size="sm"
                                    onClick={() => confirmDelete(c.id)}
                                    disabled={deleteLoading}
                                    aria-label="Confirm delete"
                                  >
                                    Delete
                                  </PraxisButton>
                                </div>
                              </div>
                            ) : renamingId === c.id ? (
                              /* Rename inline mode */
                              <div
                                className="relative flex items-start gap-2 pl-3 pr-2 py-2 rounded-lg"
                                style={{ background: active ? "var(--cx-accent-tint)" : "var(--cx-glass-bg)" }}
                              >
                                {active && (
                                  <span
                                    aria-hidden
                                    className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full"
                                    style={{ background: "var(--cx-accent)" }}
                                  />
                                )}
                                {avatarEl}
                                <div className="flex-1 min-w-0 flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={handleRenameKeyDown}
                                    onBlur={() => void commitRename()}
                                    autoFocus
                                    maxLength={160}
                                    aria-label="Rename conversation"
                                    className="flex-1 min-w-0 bg-transparent cx-type-sm outline-none pb-px"
                                    style={{
                                      color: "var(--cx-text)",
                                      borderBottom: "1px solid var(--cx-accent)",
                                    }}
                                  />
                                  <PraxisButton
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onMouseDown={(e) => { e.preventDefault(); void commitRename(); }}
                                    aria-label="Save rename"
                                  >
                                    <Check size={11} strokeWidth={2} style={{ color: "var(--cx-accent)" }} />
                                  </PraxisButton>
                                  <PraxisButton
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onMouseDown={(e) => { e.preventDefault(); cancelRename(); }}
                                    aria-label="Cancel rename"
                                  >
                                    <X size={11} strokeWidth={1.75} />
                                  </PraxisButton>
                                </div>
                              </div>
                            ) : (
                              /* Normal state — link + hover action buttons */
                              <>
                                <Link
                                  href={`/app?c=${c.id}`}
                                  onClick={close}
                                  className={`relative flex items-start gap-2 pl-3 pr-9 py-2 rounded-lg transition-[background] duration-150 ${!active ? "hover:bg-[var(--cx-surface-raised)]" : ""}`}
                                  style={{ background: active ? "var(--cx-accent-tint)" : undefined }}
                                  onMouseEnter={(e) => openPeek(c.id, e.currentTarget)}
                                  onMouseLeave={closePeek}
                                  onFocus={(e) => openPeek(c.id, e.currentTarget, true)}
                                  onBlur={closePeek}
                                >
                                  {active && (
                                    <span
                                      aria-hidden
                                      className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full"
                                      style={{ background: "var(--cx-accent)" }}
                                    />
                                  )}
                                  {avatarEl}
                                  {/* Content: title + date on one line, preview below */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-1">
                                      <span
                                        className="truncate flex-1 cx-type-sm leading-snug"
                                        style={{ color: "var(--cx-text)", fontWeight: active ? 600 : 400 }}
                                      >
                                        {displayTitle}
                                      </span>
                                      <span
                                        className="shrink-0 cx-mono cx-type-xs"
                                        style={{ color: "var(--cx-text-faint)" }}
                                      >
                                        {relativeDate(c.updated_at)}
                                      </span>
                                    </div>
                                    {preview && (
                                      <p className="truncate cx-type-xs mt-1" style={{ color: "var(--cx-text-faint)" }}>
                                        {preview}
                                      </p>
                                    )}
                                    {c.labels && c.labels.length > 0 && (
                                      <span className="flex items-center gap-1 mt-1">
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
                                  </div>
                                </Link>
                                {/* Hover action affordances — hidden at rest, revealed on group hover */}
                                <div className="absolute right-1 top-1.5 flex items-center gap-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-100 z-10">
                                  <PraxisButton
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); startRename(c.id, displayTitle); }}
                                    aria-label="Rename conversation"
                                    title="Rename"
                                  >
                                    <Pencil size={11} strokeWidth={1.75} />
                                  </PraxisButton>
                                  <PraxisButton
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setDeletingId(c.id); }}
                                    aria-label="Delete conversation"
                                    title="Delete"
                                  >
                                    <Trash2 size={11} strokeWidth={1.75} style={{ color: "var(--cx-danger)" }} />
                                  </PraxisButton>
                                </div>
                              </>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                    {(q || specialistFilter) && filtered.length === 0 && (
                      <p className="px-3 py-2 cx-type-xs" style={{ color: "var(--cx-text-muted)" }}>
                        {specialistFilter && !q
                          ? `No conversations with ${labelFor(specialistFilter)} yet`
                          : "No conversations match"}
                      </p>
                    )}
                    {!q && !specialistFilter && conversations.length > 8 && (
                      <Link
                        href="/app/conversations"
                        onClick={close}
                        className="mt-1 flex items-center px-3 py-2 cx-type-xs uppercase tracking-[0.15em] text-[var(--cx-text-muted)] hover:text-[var(--cx-text)] transition-colors"
                      >
                        See all <span className="cx-mono">({conversations.length})</span>
                      </Link>
                    )}
                    {filtered.length > 8 && (
                      <p className="px-3 py-1 cx-type-xs" style={{ color: "var(--cx-text-muted)" }}>
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
          className="pt-2 pb-3 space-y-1"
          style={{
            borderTop: "1px solid var(--cx-glass-border)",
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0.75rem))",
          }}
        >
          {collapsed ? (
            // Icon-only bottom strip
            <div className="flex flex-col items-center gap-1 px-2">
              <div className="flex justify-center"><ChangelogPopover /></div>
              <div className="flex justify-center"><NotificationCenter /></div>
              <PraxisButton
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => window.dispatchEvent(new CustomEvent("praxis:shortcuts:open"))}
                title="Keyboard shortcuts"
                aria-label="Keyboard shortcuts"
              >
                <CircleHelp size={16} strokeWidth={1.75} />
              </PraxisButton>
              <SidebarThemeButton collapsed />
              <Link href="/app/settings" title="Settings" aria-label="Settings" onClick={close} data-tour-target="settings"
                className="cx-icon-btn cx-icon-btn-lg"
                style={{
                  background: isActive("/app/settings") ? "var(--cx-accent-tint)" : undefined,
                  color: isActive("/app/settings") ? "var(--cx-accent)" : "var(--cx-text-muted)",
                }}>
                <Settings size={16} strokeWidth={1.75} />
              </Link>
              <Link href="/app/settings/billing" title="Billing" aria-label="Billing" onClick={close}
                className="cx-icon-btn cx-icon-btn-lg"
                style={{
                  background: isActive("/app/settings/billing") ? "var(--cx-accent-tint)" : undefined,
                  color: isActive("/app/settings/billing") ? "var(--cx-accent)" : "var(--cx-text-muted)",
                }}>
                <CreditCard size={16} strokeWidth={1.75} />
              </Link>
              <form action="/auth/sign-out" method="post">
                <PraxisButton
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut size={16} strokeWidth={1.75} />
                </PraxisButton>
              </form>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center cx-type-xs font-semibold shrink-0 overflow-hidden mt-1"
                style={{
                  background: "color-mix(in srgb, var(--cx-accent) 15%, var(--cx-surface))",
                  border: "1px solid color-mix(in srgb, var(--cx-accent) 25%, var(--cx-border))",
                }}
                title={displayName || userEmail}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span style={{ color: "var(--cx-accent-bright)" }}>
                    {(displayName || userEmail)[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="px-2 space-y-1">
              <ChangelogPopover />
              <div className="px-1"><NotificationCenter /></div>
              <PraxisButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent("praxis:shortcuts:open"))}
                className="w-full justify-start"
              >
                <CircleHelp size={16} strokeWidth={1.75} /> Shortcuts
              </PraxisButton>
              <SidebarThemeButton />
              <div data-tour-target="settings">
              <NavLink
                href="/app/settings"
                icon={<Settings size={16} strokeWidth={1.75} />}
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
                icon={<CreditCard size={16} strokeWidth={1.75} />}
                label="Billing"
                active={isActive("/app/settings/billing")}
                onClick={close}
                small
              />
              <form action="/auth/sign-out" method="post">
                <PraxisButton
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <LogOut size={16} strokeWidth={1.75} /> Sign out
                </PraxisButton>
              </form>
              <div className="px-3 pt-2 flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center cx-type-xs font-semibold shrink-0 overflow-hidden"
                  style={{
                    background: "color-mix(in srgb, var(--cx-accent) 15%, var(--cx-surface))",
                    border: "1px solid color-mix(in srgb, var(--cx-accent) 25%, var(--cx-border))",
                  }}
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ color: "var(--cx-accent-bright)" }}>
                      {(displayName || userEmail)[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="cx-type-xs font-medium truncate" style={{ color: "var(--cx-text)" }}>
                    {displayName || userEmail.split("@")[0]}
                  </div>
                  <div className="cx-type-xs truncate" style={{ color: "var(--cx-text-muted)" }}>
                    {tierName ? tierName : "Free"}{" "}
                    {workspaceName || accountName ? `· ${(workspaceName || accountName).slice(0, 16)}` : ""}
                  </div>
                </div>
              </div>
              {/* Bottom collapse toggle — desktop only, spec-required position */}
              <div className="hidden md:block">
                <PraxisButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleCollapsed}
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                  className="w-full justify-start"
                >
                  <PanelLeftClose size={16} strokeWidth={1.75} />
                  Collapse
                </PraxisButton>
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
          className="praxis-root cx-glass-float cx-glass-border"
          style={{
            position: "fixed",
            top: ctxMenu.y,
            left: ctxMenu.x,
            zIndex: 100,
            minWidth: 140,
            borderRadius: "var(--cx-radius-md)",
            padding: "4px",
          }}
        >
          <PraxisButton
            type="button"
            role="menuitem"
            variant="ghost"
            size="sm"
            onClick={() => {
              pinned.includes(ctxMenu.emp) ? unpin(ctxMenu.emp) : pin(ctxMenu.emp);
              setCtxMenu(null);
            }}
            className="w-full justify-start"
          >
            <Pin size={12} strokeWidth={1.75} style={{ color: "var(--cx-text-muted)" }} />
            {pinned.includes(ctxMenu.emp) ? "Unpin specialist" : "Pin specialist"}
          </PraxisButton>
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
            className="praxis-root pdl-tooltip cx-glass-popover"
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
            <div className="flex items-center gap-2 mb-1">
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
                style={{ color: isTeam ? "var(--cx-accent-bright)" : DEPT_COLOR[empKey] }}
              >
                {isTeam ? "Team" : employeeLabel(empKey)}
              </span>
            </div>
            {preview ? (
              <p className="cx-type-xs leading-snug" style={{ color: "var(--cx-text-muted)" }}>
                {preview}
              </p>
            ) : (
              <p className="cx-type-xs italic" style={{ color: "var(--cx-text-muted)" }}>
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

  const inner = (
    <motion.div
      whileHover={!shouldReduceMotion ? { y: -1 } : undefined}
      whileTap={!shouldReduceMotion ? { scale: 0.97 } : undefined}
      transition={{ duration: 0.15, ease: [...CX_EASE] }}
    >
      <Link
        href={href}
        onClick={onClick}
        aria-label={collapsed ? label : undefined}
        className={[
          "relative flex items-center rounded-lg transition-colors duration-150",
          collapsed
            ? "justify-center mx-auto w-8 h-8"
            : `gap-2 px-3 ${small ? "py-1" : "py-2"}`,
          !active
            ? "hover:bg-[var(--cx-surface-raised)] hover:text-[var(--cx-text)]"
            : "",
        ].join(" ")}
        style={{
          fontSize: !collapsed && small ? "var(--cx-type-xs)" : "var(--cx-type-sm)",
          background: active ? "var(--cx-accent-tint)" : undefined,
          color: active ? "var(--cx-text)" : "var(--cx-text-muted)",
          fontWeight: active ? 500 : 400,
        }}
      >
        {active && (
          <span
            aria-hidden
            className={`absolute left-0 rounded-full ${
              collapsed ? "top-1.5 bottom-1.5 w-0.5" : "top-2 bottom-2 w-[2px]"
            }`}
            style={{ background: "var(--cx-accent)" }}
          />
        )}
        <motion.span
          whileHover={shouldReduceMotion ? undefined : { scale: collapsed ? 1.15 : 1.12 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
          transition={{ duration: CX_DUR_FAST, ease: [...CX_EASE] }}
          className="shrink-0 inline-flex"
          style={{ color: active ? "var(--cx-accent)" : undefined }}
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
                  : { duration: CX_DUR_FAST, ease: [...CX_EASE] }
              }
              className="truncate"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    </motion.div>
  );

  if (collapsed) {
    return (
      <Tooltip trigger={inner} side="right" triggerClassName="block" delay={180}>
        <span className="cx-type-xs font-medium">{label}</span>
      </Tooltip>
    );
  }

  return inner;
}
