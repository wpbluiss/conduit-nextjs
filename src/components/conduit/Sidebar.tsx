"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  Users2,
  Menu,
  X,
} from "lucide-react";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, EMPLOYEE_ICON, employeeLabel } from "./EmployeeBadge";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";
import { useNicknames } from "@/context/NicknameContext";
import { PraxisLogo } from "./PraxisLogo";
import { SidebarBuildPip } from "./builds/in-flight/SidebarBuildPip";
import { SidebarBuildsSection } from "./builds/in-flight/SidebarBuildsSection";
import type { InFlightBuild } from "@/lib/engineering/in-flight";
import { ChangelogPopover } from "./ChangelogPopover";
import { NotificationCenter } from "./NotificationCenter";
import { PaywallModal } from "./PaywallModal";
import type { PaywallPayload } from "./PaywallModal";

const BANNER_SESSION_KEY = "praxis:upgrade_banner_dismissed";

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
            <span className="text-[11px] font-semibold" style={{ color: "var(--color-text)" }}>
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
                background: pct >= 0.8 ? "#FF8A3D" : "var(--color-accent)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <p className="mt-1 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
            {usedK}k / {capK}k tokens used ({pctDisplay}%)
          </p>
        </div>

        <button
          type="button"
          onClick={() => { dismiss(); onUpgradeClick(); }}
          className="w-full py-1.5 rounded-lg text-[11px] font-semibold transition-opacity hover:opacity-90"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          Upgrade to Pro
        </button>
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

function SidebarThemeButton({ collapsed = false }: { collapsed?: boolean }) {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return true;
    return document.documentElement.getAttribute("data-praxis-theme") === "dark";
  });

  useEffect(() => {
    const stored = typeof localStorage !== "undefined"
      ? (localStorage.getItem(THEME_KEY) ?? "system")
      : "system";
    const resolved = stored === "system"
      ? (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : stored;
    setDark(resolved === "dark");
  }, []);

  function toggle() {
    const next = dark ? "light" : "dark";
    setDark(!dark);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-praxis-theme", next);
      document.documentElement.setAttribute("data-praxis-theme-pref", next);
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_KEY, next);
    }
    fetch("/api/conduit/account/prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ theme_preference: next }),
    }).catch(() => {});
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={toggle}
        title={dark ? "Switch to light theme" : "Switch to dark theme"}
        aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-100"
      >
        {dark ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] rounded-lg transition-colors duration-100"
    >
      {dark ? <Sun size={14} /> : <Moon size={14} />}
      {dark ? "Light" : "Dark"}
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
  const openBtnRef = useRef<HTMLButtonElement>(null);
  // Conversation list search
  const [convSearch, setConvSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Mobile: search expands from icon on tap; desktop always shows the full input.
  const [searchExpanded, setSearchExpanded] = useState(false);
  // Optimistic title overrides — updated when chat fires praxis:title_updated.
  const [titleOverrides, setTitleOverrides] = useState<Record<string, string>>({});

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

  // Return focus to the hamburger button when the mobile drawer closes
  useEffect(() => {
    if (open || typeof window === "undefined" || window.innerWidth >= 768) return;
    openBtnRef.current?.focus();
  }, [open]);

  // Keyboard shortcut: Cmd/Ctrl+Shift+S → toggle sidebar collapsed state
  useEffect(() => {
    const onToggle = () => toggleCollapsed();
    window.addEventListener("praxis:sidebar:toggle", onToggle);
    return () => window.removeEventListener("praxis:sidebar:toggle", onToggle);
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

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");
  const isChat = pathname === "/app";

  return (
    <>
      <button
        ref={openBtnRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="app-sidebar"
        className="md:hidden fixed top-3 left-3 z-30 conduit-card p-2"
      >
        <Menu size={18} />
      </button>

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
        transition={skipTransition ? { duration: 0 } : { duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
        className={`fixed md:static z-40 inset-y-0 left-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col overflow-hidden transform transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        style={{ minWidth: collapsed ? 56 : 256 }}
      >
        {/* Header — workspace logo / Praxis wordmark + collapse toggle */}
        <div
          className={`px-3 py-4 flex items-center border-b border-[var(--color-border)] ${
            collapsed ? "justify-center" : "justify-between"
          }`}
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
                    className="w-7 h-7 rounded-lg object-cover shrink-0 border border-[var(--color-border)]"
                  />
                  <span className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
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
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors p-1 rounded"
                >
                  <PanelLeftClose size={15} />
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
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors p-1 rounded"
            >
              <PanelLeftOpen size={15} />
            </button>
          </div>
        )}

        {/* Workspace name — hidden when collapsed */}
        {!collapsed && (
          <div className="px-5 py-3 border-b border-[var(--color-border)]">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Workspace
            </div>
            <div className="mt-1 text-sm font-medium truncate">{workspaceName || accountName}</div>
            <div className="mt-1.5 flex items-center gap-1 w-fit px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, var(--color-accent) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--color-accent) 22%, transparent)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/praxis-mark.png" alt="" width={9} height={14} style={{ display: "block", width: 9, height: 14, opacity: 0.8 }} />
              <span className="text-[9px] uppercase tracking-[0.2em] font-semibold" style={{ color: "var(--color-accent-hi, var(--color-accent))" }}>Praxis</span>
            </div>
          </div>
        )}

        {/* New chat — quick action */}
        {collapsed ? (
          <button
            type="button"
            onClick={() => {
              close();
              router.push("/app");
              router.refresh();
            }}
            title="New chat"
            aria-label="New chat"
            className="mx-auto my-3 conduit-card p-2 flex items-center justify-center hover:border-[var(--color-accent)] hover:text-[var(--color-accent-hi)] transition-colors"
          >
            <Plus size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              close();
              router.push("/app");
              router.refresh();
            }}
            className="mx-3 my-3 conduit-card px-3 py-2 text-sm flex items-center gap-2 hover:border-[var(--color-accent)] hover:text-[var(--color-accent-hi)] transition-colors"
          >
            <Plus size={14} /> New chat
          </button>
        )}

        {/* Primary nav sections */}
        <nav className="flex-1 overflow-y-auto pb-3" aria-label="Main navigation">
          <NavLink
            href="/app/workspace"
            icon={<LayoutGrid size={14} />}
            label="Workspace"
            active={isActive("/app/workspace")}
            onClick={close}
            collapsed={collapsed}
          />
          <div data-tour-target="specialists">
          <NavLink
            href="/app/team"
            icon={<Users2 size={14} />}
            label="Team"
            active={pathname === "/app/team"}
            onClick={close}
            collapsed={collapsed}
          />
          </div>

          {/* Team header (collapsible) — hidden in icon-only mode */}
          {!collapsed && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setTeamExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Users2 size={11} /> Team
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
                    const Icon = EMPLOYEE_ICON[emp];
                    const rowInner = (
                      <span className="relative flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors duration-100 hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]">
                        {active && (
                          <span
                            aria-hidden
                            className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
                            style={{ background: DEPT_COLOR[emp] }}
                          />
                        )}
                        <span
                          aria-hidden
                          className="inline-flex items-center justify-center shrink-0 w-5 h-5 rounded-md"
                          style={{
                            background: `color-mix(in srgb, ${DEPT_COLOR[emp]} 18%, var(--color-surface-elevated))`,
                            color: DEPT_COLOR[emp],
                            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${DEPT_COLOR[emp]} 65%, transparent)`,
                          }}
                        >
                          <Icon size={11} strokeWidth={2.25} />
                        </span>
                        <span className="text-[var(--color-text)] truncate flex-1">
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
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: DEPT_COLOR[emp],
                              opacity: isStreaming ? 1 : 0.55,
                              boxShadow: isStreaming
                                ? `0 0 6px ${DEPT_COLOR[emp]}`
                                : "none",
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
                const Icon = EMPLOYEE_ICON[emp];
                const btn = (
                  <span
                    className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-100 hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
                    style={{
                      background: active ? `color-mix(in srgb, ${DEPT_COLOR[emp]} 18%, var(--color-surface-elevated))` : undefined,
                      boxShadow: active ? `inset 0 0 0 1px color-mix(in srgb, ${DEPT_COLOR[emp]} 65%, transparent)` : undefined,
                    }}
                  >
                    <Icon
                      size={14}
                      strokeWidth={2.25}
                      style={{ color: active ? DEPT_COLOR[emp] : undefined }}
                    />
                    {!allowed && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 flex items-center justify-center">
                        <Lock size={8} className="text-[var(--color-text-muted)]" />
                      </span>
                    )}
                    {allowed && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-[var(--color-surface)]"
                        style={{
                          background: DEPT_COLOR[emp],
                          opacity: isStreaming ? 1 : 0.55,
                          boxShadow: isStreaming ? `0 0 4px ${DEPT_COLOR[emp]}` : "none",
                        }}
                      />
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
              icon={<Mic size={14} />}
              label="Voice Room"
              active={isActive("/app/voice")}
              onClick={close}
              collapsed={collapsed}
            />
            {allowedEmployees.includes("sales") && (
              <NavLink
                href="/app/team/sales"
                icon={<Sparkles size={14} />}
                label="Leads"
                active={pathname === "/app/team/sales"}
                onClick={close}
                collapsed={collapsed}
              />
            )}
            <div data-tour-target="memory">
            <NavLink
              href="/app/activity"
              icon={<Activity size={14} />}
              label="Activity"
              active={isActive("/app/activity")}
              onClick={close}
              collapsed={collapsed}
            />
            <NavLink
              href="/app/memory"
              icon={<Brain size={14} />}
              label="Memory"
              active={isActive("/app/memory")}
              onClick={close}
              collapsed={collapsed}
            />
            </div>
            <NavLink
              href="/app/outputs"
              icon={<Bookmark size={14} />}
              label="Outputs"
              active={isActive("/app/outputs")}
              onClick={close}
              collapsed={collapsed}
            />
            {allowedEmployees.includes("engineering") && (
              collapsed ? (
                <div className="flex justify-center">
                  <Link
                    href="/app/builds"
                    onClick={close}
                    title="Builds"
                    aria-label="Builds"
                    className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-100 ${
                      isActive("/app/builds")
                        ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
                    }`}
                  >
                    <span className="relative inline-flex">
                      <Hammer size={14} />
                      <SidebarBuildPip
                        initial={inFlightBuildsInitial}
                        accountId={accountId}
                      />
                    </span>
                  </Link>
                </div>
              ) : (
                <Link
                  href="/app/builds"
                  onClick={close}
                  className={`relative flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors duration-100 ${
                    isActive("/app/builds")
                      ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
                  }`}
                >
                  {isActive("/app/builds") && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[var(--color-accent)]"
                    />
                  )}
                  <span className="relative inline-flex">
                    <Hammer size={14} />
                    <SidebarBuildPip
                      initial={inFlightBuildsInitial}
                      accountId={accountId}
                    />
                  </span>
                  <span>Builds</span>
                </Link>
              )
            )}
            <NavLink
              href="/app/analytics"
              icon={<BarChart3 size={14} />}
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
            <div className="mt-4">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Recent
              </div>

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
                const filtered = q
                  ? conversations.filter((c) =>
                      (titleOverrides[c.id] ?? c.title ?? "").toLowerCase().includes(q)
                    )
                  : conversations.slice(0, 8);
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
                            className={`relative flex items-center gap-2 pl-3 pr-3 py-1.5 text-xs rounded-lg transition-colors duration-100 ${
                              active
                                ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
                                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
                            }`}
                            onMouseEnter={(e) => openPeek(c.id, e.currentTarget)}
                            onMouseLeave={closePeek}
                            onFocus={(e) => openPeek(c.id, e.currentTarget, true)}
                            onBlur={closePeek}
                          >
                            {active && (
                              <span
                                aria-hidden
                                className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
                                style={{
                                  background: isTeam
                                    ? "var(--color-accent)"
                                    : DEPT_COLOR[empKey],
                                }}
                              />
                            )}
                            {isTeam ? (
                              <span
                                aria-hidden
                                className="inline-block w-3 h-3 rounded-full shrink-0"
                                style={{
                                  background:
                                    "conic-gradient(from 90deg, var(--color-dept-marketing), var(--color-dept-sales), var(--color-dept-engineering), var(--color-dept-jarvis), var(--color-dept-marketing))",
                                }}
                              />
                            ) : (
                              (() => {
                                const RecentIcon = EMPLOYEE_ICON[empKey];
                                return (
                                  <span
                                    aria-hidden
                                    className="inline-flex items-center justify-center shrink-0 w-3.5 h-3.5 rounded-[4px]"
                                    style={{
                                      background: `color-mix(in srgb, ${DEPT_COLOR[empKey]} 18%, var(--color-surface-elevated))`,
                                      color: DEPT_COLOR[empKey],
                                      boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${DEPT_COLOR[empKey]} 60%, transparent)`,
                                    }}
                                  >
                                    <RecentIcon size={9} strokeWidth={2.5} />
                                  </span>
                                );
                              })()
                            )}
                            <span className="truncate flex-1">
                              {titleOverrides[c.id] ?? c.title ?? "Untitled chat"}
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
                    {q && filtered.length === 0 && (
                      <p className="px-3 py-2 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                        No conversations match
                      </p>
                    )}
                    {!q && conversations.length > 8 && (
                      <Link
                        href="/app/conversations"
                        onClick={close}
                        className="mt-1 flex items-center px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                      >
                        See all ({conversations.length})
                      </Link>
                    )}
                    {q && filtered.length > 8 && (
                      <p className="px-3 py-1 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                        Showing 8 of {filtered.length} matches
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </nav>

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
          className="pt-2 pb-3 border-t border-[var(--color-border)] space-y-0.5"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0.75rem))" }}
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
                className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-100"
              >
                <CircleHelp size={14} />
              </button>
              <SidebarThemeButton collapsed />
              <Link href="/app/settings" title="Settings" aria-label="Settings" onClick={close} data-tour-target="settings"
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-100 ${isActive("/app/settings") ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}>
                <Settings size={14} />
              </Link>
              <Link href="/app/settings/billing" title="Billing" aria-label="Billing" onClick={close}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-100 ${isActive("/app/settings/billing") ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}>
                <CreditCard size={14} />
              </Link>
              <form action="/auth/sign-out" method="post">
                <button type="submit" title="Sign out" aria-label="Sign out"
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                  <LogOut size={14} />
                </button>
              </form>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0 overflow-hidden border border-[var(--color-border)] mt-1"
                style={{ background: "var(--color-surface-elevated)" }}
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
                <CircleHelp size={14} /> Shortcuts
              </button>
              <SidebarThemeButton />
              <div data-tour-target="settings">
              <NavLink
                href="/app/settings"
                icon={<Settings size={14} />}
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
                icon={<CreditCard size={14} />}
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
                  <LogOut size={14} /> Sign out
                </button>
              </form>
              <div className="px-3 pt-2 flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0 overflow-hidden border border-[var(--color-border)]"
                  style={{ background: "var(--color-surface-elevated)" }}
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
                <span className="text-[10px] text-[var(--color-text-muted)] truncate min-w-0">
                  {displayName || userEmail}
                </span>
              </div>
              <div className="px-3 text-[10px] text-[var(--color-text-muted)]">
                Praxis Flow{tierName ? ` · ${tierName}` : ""}
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

      {/* Conversation quick-peek tooltip — portal-rendered to escape sidebar overflow */}
      {portalMounted && peekId && peekRect && (() => {
        const conv = conversations.find((c) => c.id === peekId);
        if (!conv) return null;
        const dom = conv.dominant_employee;
        const isTeam = dom === "team";
        const empKey = (dom && (TEAM as string[]).includes(dom) ? dom : "jarvis") as EmployeeKey;
        const PeekIcon = EMPLOYEE_ICON[empKey];
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
                <span
                  aria-hidden
                  className="inline-flex items-center justify-center shrink-0 w-3.5 h-3.5 rounded-[4px]"
                  style={{
                    background: `color-mix(in srgb, ${DEPT_COLOR[empKey]} 18%, var(--color-surface-elevated))`,
                    color: DEPT_COLOR[empKey],
                    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${DEPT_COLOR[empKey]} 60%, transparent)`,
                  }}
                >
                  <PeekIcon size={9} strokeWidth={2.5} />
                </span>
              )}
              <span
                className="text-[10px] font-semibold truncate"
                style={{ color: isTeam ? "var(--color-accent-hi)" : DEPT_COLOR[empKey] }}
              >
                {isTeam ? "Team" : employeeLabel(empKey)}
              </span>
            </div>
            {preview ? (
              <p className="text-[11px] leading-snug" style={{ color: "var(--pdl-text-muted, var(--color-text-muted))" }}>
                {preview}
              </p>
            ) : (
              <p className="text-[11px] italic" style={{ color: "var(--pdl-text-muted, var(--color-text-muted))" }}>
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
  if (collapsed) {
    return (
      <div className="flex justify-center">
        <Link
          href={href}
          onClick={onClick}
          title={label}
          aria-label={label}
          className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-100 ${
            active
              ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
          }`}
        >
          {active && (
            <span
              aria-hidden
              className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[var(--color-accent)]"
            />
          )}
          {icon}
        </Link>
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center gap-2 px-3 ${
        small ? "py-1.5 text-xs" : "py-2 text-sm"
      } rounded-lg transition-colors duration-100 ${
        active
          ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
      }`}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[var(--color-accent)]"
        />
      )}
      {icon}
      <span>{label}</span>
    </Link>
  );
}
