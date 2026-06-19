"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Pref = "system" | "light" | "dark";

const STORAGE_KEY = "praxis.theme";

function resolveSystem(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(pref: Pref): "light" | "dark" {
  const resolved = pref === "system" ? resolveSystem() : pref;
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-praxis-theme", resolved);
    document.documentElement.setAttribute("data-praxis-theme-pref", pref);
  }
  return resolved;
}

export function ThemeToggle({
  initialPref = "system",
}: {
  initialPref?: Pref;
}) {
  const [pref, setPref] = useState<Pref>(initialPref);
  const [resolved, setResolved] = useState<"light" | "dark">("dark");
  const [saving, setSaving] = useState(false);

  // Sync component state with whatever ThemeBoot wrote pre-paint, then
  // listen for system-pref changes so 'system' tracks live.
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Pref | null) ?? null;
    const effective: Pref = stored ?? initialPref;
    if (!stored) {
      // First load on this device — prime localStorage from the server's
      // remembered choice so subsequent reloads avoid any FOUC.
      localStorage.setItem(STORAGE_KEY, effective);
    }
    if (effective !== pref) setPref(effective);
    setResolved(applyTheme(effective));

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem(STORAGE_KEY) ?? "system") === "system") {
        setResolved(applyTheme("system"));
      }
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function choose(next: Pref) {
    setPref(next);
    setResolved(applyTheme(next));
    localStorage.setItem(STORAGE_KEY, next);
    setSaving(true);
    try {
      await fetch("/api/conduit/account/prefs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ theme_preference: next }),
      });
    } catch {
      // Network drop is fine — localStorage already carries the choice.
    } finally {
      setSaving(false);
    }
  }

  const opts: { key: Pref; label: string; icon: React.ReactNode }[] = [
    { key: "system", label: "System", icon: <Monitor size={14} /> },
    { key: "light", label: "Light", icon: <Sun size={14} /> },
    { key: "dark", label: "Dark", icon: <Moon size={14} /> },
  ];

  return (
    <div>
      <div className="cx-type-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-2">
        Appearance
      </div>
      <div
        role="radiogroup"
        aria-label="Theme"
        className="inline-flex p-1 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)]"
      >
        {opts.map((o) => {
          const active = pref === o.key;
          return (
            <button
              key={o.key}
              role="radio"
              aria-checked={active}
              onClick={() => choose(o.key)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-full cx-type-xs transition-colors ${
                active
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {o.icon}
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 cx-type-xs text-[var(--color-text-muted)]">
        {saving
          ? "Saving…"
          : pref === "system"
            ? `Following your device — currently ${resolved}.`
            : `Locked to ${pref}.`}
      </p>
    </div>
  );
}
