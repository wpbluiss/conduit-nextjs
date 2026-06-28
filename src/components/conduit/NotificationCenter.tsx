"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CheckCheck,
  CreditCard,
  Hammer,
  MemoryStick,
  FileText,
  Inbox,
  X,
} from "lucide-react";
import { PraxisButton } from "@/components/conduit/ui/Button";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function NotifIcon({ type }: { type: string }) {
  const size = 14;
  if (type === "build_complete") return <Hammer size={size} strokeWidth={1.75} />;
  if (type === "artifact_ready") return <FileText size={size} strokeWidth={1.75} />;
  if (type === "memory_saved") return <MemoryStick size={size} strokeWidth={1.75} />;
  if (type === "billing") return <CreditCard size={size} strokeWidth={1.75} />;
  return <Bell size={size} strokeWidth={1.75} />;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/conduit/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // network error — fail silently
    }
  }, []);

  // Poll for unread count every 60 s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refresh when drawer opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const markRead = async (n: Notification) => {
    if (!n.read_at) {
      await fetch("/api/conduit/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
      setNotifications((prev: Notification[]) =>
        prev.map((x: Notification) =>
          x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x,
        ),
      );
      setUnreadCount((c: number) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.href) router.push(n.href);
  };

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/conduit/notifications/read-all", { method: "POST" });
      setNotifications((prev: Notification[]) =>
        prev.map((n: Notification) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
      );
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Notification bell — matches sidebar NavLink style */}
      <PraxisButton
        variant="ghost"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        onClick={() => setOpen((v: boolean) => !v)}
        className="relative flex items-center gap-2 px-3 py-2 cx-type-xs w-full"
      >
        <Inbox size={14} strokeWidth={1.75} className="shrink-0" />
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span
            aria-hidden
            className="absolute top-1 left-5 flex items-center justify-center w-3.5 h-3.5 rounded-full cx-type-xs font-bold leading-none"
            style={{ background: "var(--color-red, var(--cx-danger))", color: "#fff" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PraxisButton>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="notif-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[198] bg-black/30"
              aria-hidden
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              key="notif-drawer"
              ref={drawerRef}
              role="dialog"
              aria-label="Notifications"
              aria-modal="true"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              className="cx-glass-float cx-glass-border fixed top-0 right-0 bottom-0 z-[199] w-full max-w-sm flex flex-col border-l"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <Bell size={14} strokeWidth={1.75} className="text-[var(--color-text-muted)]" />
                  <span className="cx-type-base font-medium">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="cx-type-xs font-semibold px-1.5 py-0.5 rounded-full bg-red-500 text-white leading-none">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <PraxisButton
                      variant="ghost"
                      size="sm"
                      onClick={markAllRead}
                      isDisabled={loading}
                      title="Mark all as read"
                      aria-label="Mark all as read"
                    >
                      <CheckCheck size={12} strokeWidth={1.75} />
                      Mark all read
                    </PraxisButton>
                  )}
                  <PraxisButton
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setOpen(false)}
                    aria-label="Close notifications"
                  >
                    <X size={14} strokeWidth={1.75} />
                  </PraxisButton>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <motion.div
                    className="flex flex-col items-center justify-center h-full gap-4 text-center px-6 py-10"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span
                      className="inline-flex items-center justify-center w-12 h-12 rounded-2xl"
                      style={{
                        background: "var(--cx-accent-tint, rgba(124,108,255,0.12))",
                        border: "1px solid color-mix(in srgb, var(--cx-accent, #7C6CFF) 20%, transparent)",
                        color: "var(--cx-accent, #7C6CFF)",
                      }}
                    >
                      <Inbox size={22} strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="cx-type-sm font-semibold" style={{ color: "var(--cx-text, #F4F4F7)" }}>
                        No notifications yet
                      </p>
                      <p
                        className="cx-type-xs mt-1 max-w-[16rem] mx-auto"
                        style={{ color: "var(--cx-text-muted, #A0A0B0)", lineHeight: "var(--cx-lh-body, 1.6)" }}
                      >
                        Build completions, artifact events, and billing updates will appear here.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <ul>
                    {notifications.map((n: Notification) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => markRead(n)}
                          className="w-full text-left flex items-start gap-3 px-4 py-4 hover:bg-[var(--color-surface)] transition-colors border-b border-[var(--color-border)] last:border-b-0"
                          style={{
                            background: n.read_at
                              ? "transparent"
                              : "color-mix(in srgb, var(--color-accent) 5%, transparent)",
                          }}
                        >
                          <span
                            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                            style={{
                              background: n.read_at
                                ? "var(--color-surface)"
                                : "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                              border: "1px solid var(--color-border)",
                              color: n.read_at
                                ? "var(--color-text-muted)"
                                : "var(--color-accent-hi)",
                            }}
                          >
                            <NotifIcon type={n.type} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block cx-type-base text-[var(--color-text)] leading-snug">
                              {n.title}
                            </span>
                            {n.body && (
                              <span className="block cx-type-xs text-[var(--color-text-muted)] mt-0.5 truncate">
                                {n.body}
                              </span>
                            )}
                            <span className="block cx-type-xs text-[var(--color-text-muted)] mt-1 opacity-70">
                              {relativeTime(n.created_at)}
                            </span>
                          </span>
                          {!n.read_at && (
                            <span
                              aria-hidden
                              className="shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--color-accent-hi)] mt-2"
                            />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
