"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  House, Wallet, Money, Receipt, Flame, ChartLineUp,
  Gauge, Sparkle, GearSix, SignOut, List, X, Crown,
} from "@phosphor-icons/react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { clsx } from "./clsx";
import { GradientText } from "./ui";

const NAV = [
  { href: "/finance", label: "Home", icon: House },
  { href: "/finance/accounts", label: "Accounts", icon: Wallet },
  { href: "/finance/paychecks", label: "Paychecks", icon: Money },
  { href: "/finance/expenses", label: "Expenses", icon: Receipt },
  { href: "/finance/debts", label: "Debt-Killer", icon: Flame },
  { href: "/finance/investments", label: "Investments", icon: ChartLineUp },
  { href: "/finance/credit", label: "Credit", icon: Gauge },
  { href: "/finance/advisor", label: "Advisor", icon: Sparkle },
  { href: "/finance/upgrade", label: "Upgrade", icon: Crown },
  { href: "/finance/settings", label: "Settings", icon: GearSix },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active =
          item.href === "/finance"
            ? pathname === "/finance"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={clsx(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
              active
                ? "bg-white/10 text-white"
                : "text-[var(--fin-muted)] hover:text-white hover:bg-white/5",
            )}
          >
            <Icon
              size={18}
              weight={active ? "fill" : "regular"}
              className={active ? "text-[#ffa876]" : ""}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SignOutButton() {
  const router = useRouter();
  async function out() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/finance/sign-in");
    router.refresh();
  }
  return (
    <button
      onClick={out}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--fin-muted)] hover:text-white hover:bg-white/5 transition w-full"
    >
      <SignOut size={18} />
      Sign out
    </button>
  );
}

function Brand() {
  return (
    <div className="px-3 mb-6">
      <div className="fin-mono text-[10px] uppercase tracking-[0.28em] text-[var(--fin-muted)]">
        Conduit AI
      </div>
      <div className="fin-display text-xl leading-tight">
        <GradientText>Cadence</GradientText>
      </div>
    </div>
  );
}

export function NavSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col justify-between border-r border-white/5 bg-black/30 backdrop-blur-xl p-4 z-30">
        <div>
          <Brand />
          <NavLinks />
        </div>
        <SignOutButton />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-black/50 backdrop-blur-xl px-4 py-3">
        <div className="fin-display text-base">
          <GradientText>Cadence</GradientText>
        </div>
        <button onClick={() => setOpen(true)} className="text-white p-1">
          <List size={22} />
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-[#131110] border-r border-white/10 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Brand />
                <button onClick={() => setOpen(false)} className="text-white p-1">
                  <X size={20} />
                </button>
              </div>
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <SignOutButton />
          </div>
        </div>
      )}
    </>
  );
}
