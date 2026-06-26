"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  BarChart2,
  Bookmark,
  Brain,
  Building2,
  ChevronRight,
  CreditCard,
  Hammer,
  LogOut,
  Menu,
  MessageSquare,
  Mic,
  Package,
  Settings,
  Sparkles,
  User,
  Users2,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { PraxisButton } from "@/components/conduit/ui/Button";
import { useTopBar } from "@/context/TopBarContext";
import { CX_EASE, CX_DUR_FAST, CX_DUR_BASE, CX_DUR_EMPHASIS } from "@/lib/ui/motion";
import type { LucideIcon } from "lucide-react";

interface PageMeta {
  label: string;
  Icon: LucideIcon;
}

const PAGE_MAP: Record<string, PageMeta> = {
  "/app":               { label: "Chat",          Icon: Sparkles },
  "/app/conversations": { label: "Conversations", Icon: MessageSquare },
  "/app/analytics":     { label: "Analytics",     Icon: BarChart2 },
  "/app/activity":      { label: "Activity",      Icon: Activity },
  "/app/artifacts":     { label: "Artifacts",     Icon: Bookmark },
  "/app/outputs":       { label: "Outputs",       Icon: Package },
  "/app/builds":        { label: "Builds",        Icon: Hammer },
  "/app/memory":        { label: "Memory",        Icon: Brain },
  "/app/voice":         { label: "Voice",         Icon: Mic },
  "/app/team":          { label: "Team",          Icon: Users2 },
  "/app/workspace":     { label: "Workspace",     Icon: Building2 },
  "/app/billing":       { label: "Billing",       Icon: CreditCard },
  "/app/settings":      { label: "Settings",      Icon: Settings },
};

function resolvePageMeta(pathname: string): PageMeta {
  if (PAGE_MAP[pathname]) return PAGE_MAP[pathname];
  const sorted = Object.keys(PAGE_MAP).sort((a, b) => b.length - a.length);
  for (const key of sorted) {
    if (key !== "/app" && pathname.startsWith(key + "/")) return PAGE_MAP[key];
  }
  return { label: "Praxis", Icon: Sparkles };
}

export interface ConsoleTopBarProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  userEmail?: string;
}

const POPOVER_VARIANTS = {
  hidden: { opacity: 0, y: -6, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: CX_DUR_EMPHASIS, ease: [...CX_EASE] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.97,
    transition: { duration: CX_DUR_FAST, ease: [...CX_EASE] as [number, number, number, number] },
  },
};

function UserMenuPopover({
  open,
  onClose,
  userName,
  userEmail,
  avatarUrl,
  displayName,
  userInitial,
  prefersReduced,
}: {
  open: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
  displayName?: string | null;
  userInitial: string;
  prefersReduced: boolean | null;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          role="menu"
          aria-label="Account menu"
          variants={prefersReduced ? undefined : POPOVER_VARIANTS}
          initial={prefersReduced ? { opacity: 0 } : "hidden"}
          animate={prefersReduced ? { opacity: 1 } : "visible"}
          exit={prefersReduced ? { opacity: 0 } : "exit"}
          className="cx-glass-popover"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 220,
            overflow: "hidden",
            zIndex: 100,
          }}
        >
          {/* User identity row */}
          <div
            className="cx-glass-border-b"
            style={{ padding: "12px 16px" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="shrink-0 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  width: 36,
                  height: 36,
                  background: avatarUrl
                    ? "transparent"
                    : "color-mix(in srgb, var(--cx-accent, #7C6CFF) 18%, var(--cx-surface, #131319))",
                  border: "1px solid color-mix(in srgb, var(--cx-accent, #7C6CFF) 30%, var(--cx-border, #262630))",
                }}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span
                    style={{
                      color: "var(--cx-accent-bright, #9B8CFF)",
                      fontSize: "var(--cx-type-sm, 13px)",
                      fontWeight: 600,
                    }}
                  >
                    {userInitial}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                {displayName && (
                  <div
                    className="truncate font-semibold"
                    style={{
                      fontSize: "var(--cx-type-sm, 13px)",
                      color: "var(--cx-text, #F4F4F7)",
                      letterSpacing: "var(--cx-ls-tight, -0.01em)",
                    }}
                  >
                    {displayName}
                  </div>
                )}
                <div className="truncate cx-meta">
                  {userEmail}
                </div>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div style={{ padding: "4px" }}>
            <Link
              href="/app/settings/profile"
              role="menuitem"
              onClick={onClose}
              className="flex items-center gap-2.5 w-full rounded-lg"
              style={{
                padding: "8px 12px",
                fontSize: "var(--cx-type-sm, 13px)",
                color: "var(--cx-text-muted, #A0A0B0)",
                textDecoration: "none",
                transition: `background var(--cx-dur-fast, 120ms) var(--cx-ease, cubic-bezier(0.22,1,0.36,1)), color var(--cx-dur-fast, 120ms) var(--cx-ease, cubic-bezier(0.22,1,0.36,1))`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--cx-surface-raised, #1C1C26)";
                (e.currentTarget as HTMLElement).style.color = "var(--cx-text, #F4F4F7)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--cx-text-muted, #A0A0B0)";
              }}
            >
              <User size={14} strokeWidth={1.75} aria-hidden="true" />
              <span>Profile</span>
            </Link>

            <Link
              href="/app/settings"
              role="menuitem"
              onClick={onClose}
              className="flex items-center gap-2.5 w-full rounded-lg"
              style={{
                padding: "8px 12px",
                fontSize: "var(--cx-type-sm, 13px)",
                color: "var(--cx-text-muted, #A0A0B0)",
                textDecoration: "none",
                transition: `background var(--cx-dur-fast, 120ms) var(--cx-ease, cubic-bezier(0.22,1,0.36,1)), color var(--cx-dur-fast, 120ms) var(--cx-ease, cubic-bezier(0.22,1,0.36,1))`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--cx-surface-raised, #1C1C26)";
                (e.currentTarget as HTMLElement).style.color = "var(--cx-text, #F4F4F7)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--cx-text-muted, #A0A0B0)";
              }}
            >
              <Settings size={14} strokeWidth={1.75} aria-hidden="true" />
              <span>Settings</span>
            </Link>
          </div>

          {/* Sign out */}
          <div
            className="cx-glass-border-t"
            style={{ padding: "4px" }}
          >
            <form action="/auth/sign-out" method="post">
              <PraxisButton
                type="submit"
                role="menuitem"
                variant="ghost"
                size="sm"
                className="w-full justify-start hover:bg-[color-mix(in_srgb,var(--cx-danger,#F4607D)_10%,transparent)] hover:text-[var(--cx-danger,#F4607D)]"
              >
                <LogOut size={14} strokeWidth={1.75} aria-hidden="true" />
                Sign out
              </PraxisButton>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConsoleTopBar({
  avatarUrl,
  displayName,
  userEmail = "",
}: ConsoleTopBarProps) {
  const pathname = usePathname();
  const { label, Icon } = resolvePageMeta(pathname);
  const { breadcrumb } = useTopBar();
  const prefersReduced = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);

  const userInitial = (displayName || userEmail)[0]?.toUpperCase() ?? "?";
  const userName = displayName || userEmail.split("@")[0];
  const isOnSettings = pathname.startsWith("/app/settings");

  const openSidebar = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("praxis:sidebar:open"));
    }
  };

  return (
    <motion.header
      className="shrink-0 flex items-center h-14 px-3 gap-2 cx-glass-float cx-glass-border-b sticky top-0 z-20"
      aria-label="Console navigation"
      initial={{ opacity: 0, y: prefersReduced ? 0 : -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: CX_DUR_FAST, ease: [...CX_EASE] }}
    >
      {/* Mobile hamburger — triggers Sidebar via CustomEvent */}
      <PraxisButton
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={openSidebar}
        aria-label="Open navigation menu"
        aria-haspopup="dialog"
        className="md:hidden -ml-1 shrink-0"
      >
        <Menu size={18} strokeWidth={1.75} />
      </PraxisButton>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
        {/* Accent bar — desktop only */}
        <span
          className="hidden md:block shrink-0 w-0.5 h-4 rounded-full"
          style={{ background: "var(--cx-accent)" }}
          aria-hidden="true"
        />

        {/* Section icon + label — animates on pathname change */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname.split("/").slice(0, 3).join("/")}
            className="flex items-center gap-2 min-w-0 shrink-0"
            initial={{ opacity: 0, x: prefersReduced ? 0 : 5 }}
            animate={{ opacity: 1, x: 0, transition: { duration: CX_DUR_BASE, ease: [...CX_EASE] } }}
            exit={{ opacity: 0, x: prefersReduced ? 0 : -3, transition: { duration: CX_DUR_FAST, ease: [...CX_EASE] } }}
          >
            <Icon
              size={16}
              strokeWidth={1.75}
              aria-hidden="true"
              style={{ color: "var(--cx-text-muted)" }}
              className="shrink-0"
            />
            <span
              className="font-semibold"
              style={{
                fontSize: "var(--cx-type-base)",
                color: "var(--cx-text)",
                letterSpacing: "var(--cx-ls-tight)",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Specialist breadcrumb — set by pages via useSetBreadcrumb */}
        <AnimatePresence>
          {breadcrumb?.specialist && (
            <motion.div
              className="flex items-center gap-2 min-w-0"
              initial={{ opacity: 0, x: prefersReduced ? 0 : 6 }}
              animate={{ opacity: 1, x: 0, transition: { duration: CX_DUR_BASE, ease: [...CX_EASE] } }}
              exit={{ opacity: 0, transition: { duration: CX_DUR_FAST } }}
            >
              <ChevronRight
                size={11}
                strokeWidth={1.75}
                className="shrink-0"
                style={{ color: "var(--cx-text-faint)" }}
                aria-hidden="true"
              />
              <span
                className="truncate font-medium"
                style={{
                  fontSize: "var(--cx-type-sm)",
                  color: "var(--cx-text-muted)",
                  letterSpacing: "var(--cx-ls-tight)",
                }}
              >
                {breadcrumb.specialist}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation title — mono metadata, hidden on small screens */}
        <AnimatePresence>
          {breadcrumb?.conversationTitle && (
            <motion.div
              className="hidden sm:flex items-center gap-2 min-w-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: CX_DUR_BASE, delay: 0.04 } }}
              exit={{ opacity: 0, transition: { duration: CX_DUR_FAST } }}
            >
              <ChevronRight
                size={11}
                strokeWidth={1.75}
                className="shrink-0"
                style={{ color: "var(--cx-text-faint)" }}
                aria-hidden="true"
              />
              <span className="truncate cx-meta">
                {breadcrumb.conversationTitle}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Keyboard shortcut hint — desktop only */}
        <PraxisButton
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("praxis:shortcuts:open"));
            }
          }}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (⌘/)"
          className="hidden md:inline-flex"
        >
          <span
            className="cx-mono"
            style={{
              fontSize: "var(--cx-type-xs)",
              color: "var(--cx-text-faint)",
              letterSpacing: "0",
            }}
          >
            ⌘/
          </span>
        </PraxisButton>

        {/* Settings link — desktop, hidden when already on settings */}
        {!isOnSettings && (
          <Link
            href="/app/settings"
            aria-label="Settings"
            title="Settings"
            className="cx-icon-btn cx-focus-ring hidden md:inline-flex"
          >
            <Settings
              size={16}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </Link>
        )}

        {/* Account avatar — opens animated glass user menu popover */}
        <div className="relative ml-1" style={{ position: "relative" }}>
          <button
            ref={avatarButtonRef}
            type="button"
            aria-label={`Account: ${userName}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="cx-focus-ring rounded-full inline-flex items-center justify-center"
            style={{
              minWidth: 44,
              minHeight: 44,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <motion.div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
              whileHover={prefersReduced ? undefined : { scale: 1.08 }}
              whileTap={prefersReduced ? undefined : { scale: 0.94 }}
              transition={{ duration: CX_DUR_FAST, ease: [...CX_EASE] }}
              style={{
                background: avatarUrl
                  ? "transparent"
                  : "color-mix(in srgb, var(--cx-accent) 15%, var(--cx-surface))",
                border: menuOpen
                  ? "1px solid var(--cx-accent)"
                  : "1px solid color-mix(in srgb, var(--cx-accent) 25%, var(--cx-border))",
                transition: "border-color var(--cx-dur-fast) var(--cx-ease), box-shadow var(--cx-dur-fast) var(--cx-ease)",
                boxShadow: menuOpen ? "var(--cx-accent-glow)" : "none",
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span
                  style={{
                    color: "var(--cx-accent-bright)",
                    fontSize: "var(--cx-type-xs)",
                    fontWeight: 600,
                  }}
                >
                  {userInitial}
                </span>
              )}
            </motion.div>
          </button>

          <UserMenuPopover
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            userName={userName}
            userEmail={userEmail}
            avatarUrl={avatarUrl}
            displayName={displayName}
            userInitial={userInitial}
            prefersReduced={prefersReduced}
          />
        </div>
      </div>
    </motion.header>
  );
}
