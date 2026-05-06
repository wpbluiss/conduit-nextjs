"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Plus,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface ConvoSummary {
  id: string;
  title: string | null;
  updated_at: string;
}

export function Sidebar({
  userEmail,
  accountName,
  conversations,
}: {
  userEmail: string;
  accountName: string;
  conversations: ConvoSummary[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeId = params.get("c");
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="md:hidden fixed top-3 left-3 z-30 hairline bg-[var(--color-surface-elevated)] p-2"
      >
        <Menu size={18} />
      </button>

      <aside
        className={`fixed md:static z-40 inset-y-0 left-0 w-72 bg-[var(--color-surface)] hairline border-t-0 border-b-0 border-l-0 flex flex-col transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-200`}
      >
        <div className="px-5 py-4 flex items-center justify-between hairline border-l-0 border-r-0 border-t-0">
          <Link
            href="/app"
            onClick={close}
            className="serif text-xl text-[var(--color-text)]"
          >
            Conduit
          </Link>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="md:hidden text-[var(--color-text-muted)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-3">
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
            Workspace
          </div>
          <div className="mt-1 text-sm">{accountName}</div>
        </div>

        <button
          type="button"
          onClick={() => {
            close();
            router.push("/app");
          }}
          className="mx-4 mb-2 hairline px-3 py-2 text-sm flex items-center gap-2 hover:border-[var(--color-accent)] hover:text-[var(--color-accent-hi)] transition-colors"
        >
          <Plus size={14} /> New chat
        </button>

        <div className="px-4 mt-2 text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
          Recent
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {conversations.length === 0 && (
            <p className="px-3 py-3 text-xs text-[var(--color-text-muted)]">
              No conversations yet.
            </p>
          )}
          {conversations.map((c) => {
            const active = activeId === c.id;
            return (
              <Link
                key={c.id}
                href={`/app?c=${c.id}`}
                onClick={close}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-none transition-colors ${
                  active
                    ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]"
                }`}
              >
                <MessageSquare size={14} className="shrink-0" />
                <span className="truncate">
                  {c.title || "Untitled chat"}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-3 hairline border-l-0 border-r-0 border-b-0 space-y-1">
          <Link
            href="/app/artifacts"
            onClick={close}
            className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
              pathname.startsWith("/app/artifacts")
                ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <FileText size={14} /> Artifacts
          </Link>
          <Link
            href="/app/settings"
            onClick={close}
            className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
              pathname.startsWith("/app/settings")
                ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <Settings size={14} /> Settings
          </Link>
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <LogOut size={14} /> Sign out
            </button>
          </form>
          <div className="px-3 pt-2 text-xs text-[var(--color-text-muted)] truncate">
            {userEmail}
          </div>
        </div>
      </aside>

      {open && (
        <div
          onClick={close}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          aria-hidden
        />
      )}
    </>
  );
}
