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
  Menu,
  MessageSquare,
  Mic,
  Package,
  Settings,
  Sparkles,
  Users2,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { PraxisButton } from "@/components/conduit/ui/Button";
import { useTopBar } from "@/context/TopBarContext";
import { CX_EASE, CX_DUR_FAST, CX_DUR_BASE } from "@/lib/ui/motion";
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

export function ConsoleTopBar({
  avatarUrl,
  displayName,
  userEmail = "",
}: ConsoleTopBarProps) {
  const pathname = usePathname();
  const { label, Icon } = resolvePageMeta(pathname);
  const { breadcrumb } = useTopBar();
  const prefersReduced = useReducedMotion();

  const userInitial = (displayName || userEmail)[0]?.toUpperCase() ?? "?";
  const userName = displayName || userEmail.split("@")[0];
  const isOnSettings = pathname.startsWith("/app/settings");

  const openSidebar = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("praxis:sidebar:open"));
    }
  };

  return (
    <header
      className="shrink-0 flex items-center h-12 px-3 gap-2 cx-glass z-20"
      style={{ borderBottom: "1px solid var(--cx-glass-border)" }}
      aria-label="Console navigation"
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
      <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
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
            className="flex items-center gap-1.5 min-w-0 shrink-0"
            initial={{ opacity: 0, x: prefersReduced ? 0 : 5 }}
            animate={{ opacity: 1, x: 0, transition: { duration: CX_DUR_BASE, ease: [...CX_EASE] } }}
            exit={{ opacity: 0, x: prefersReduced ? 0 : -3, transition: { duration: CX_DUR_FAST, ease: [...CX_EASE] } }}
          >
            <Icon
              size={14}
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
              className="flex items-center gap-1.5 min-w-0"
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
              className="hidden sm:flex items-center gap-1.5 min-w-0"
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
              <span
                className="truncate"
                style={{
                  fontFamily: "var(--cx-font-mono)",
                  fontSize: "var(--cx-type-xs)",
                  color: "var(--cx-text-faint)",
                }}
              >
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
              size={15}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </Link>
        )}

        {/* Account avatar — 44px tap target, 28px visual */}
        <Link
          href="/app/settings/profile"
          aria-label={`Account: ${userName}`}
          title={userName}
          className="cx-focus-ring rounded-full ml-1 inline-flex items-center justify-center"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
            style={{
              background: avatarUrl
                ? "transparent"
                : "color-mix(in srgb, var(--cx-accent) 15%, var(--cx-surface))",
              border:
                "1px solid color-mix(in srgb, var(--cx-accent) 25%, var(--cx-border))",
              transition: "opacity var(--cx-dur-fast) var(--cx-ease)",
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
          </div>
        </Link>
      </div>
    </header>
  );
}
