"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GradientText } from "./ui";
import { Button, Field, inputCls, labelCls } from "./forms";
import { onboardCreateHousehold, onboardJoinHousehold } from "@/lib/finance/actions";

export function OnboardingFlow() {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>, fd: FormData) {
    start(async () => {
      const res = await action(fd);
      if (res.ok) {
        router.push("/finance");
        router.refresh();
      } else {
        setError(res.error || "Something went wrong");
      }
    });
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="fin-mono text-[11px] uppercase tracking-[0.3em] text-[var(--fin-muted)] mb-3">
          Welcome
        </div>
        <h1 className="fin-display text-3xl tracking-tight">
          Set up your <GradientText>household</GradientText>
        </h1>
        <p className="text-sm text-[var(--fin-muted)] mt-2">
          One shared pool, one goal. Takes about a minute.
        </p>
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => { setMode("create"); setError(null); }}
          className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${mode === "create" ? "bg-white/10 text-white" : "text-[var(--fin-muted)] hover:bg-white/5"}`}
        >
          Create new
        </button>
        <button
          onClick={() => { setMode("join"); setError(null); }}
          className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${mode === "join" ? "bg-white/10 text-white" : "text-[var(--fin-muted)] hover:bg-white/5"}`}
        >
          Join a partner
        </button>
      </div>

      {mode === "create" ? (
        <form
          action={(fd) => submit(onboardCreateHousehold, fd)}
          className="fin-card p-6 space-y-4"
        >
          <Field label="Household name" name="name" placeholder="The Garcia Household" required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Savings goal $" name="savings_goal" type="number" step="100" defaultValue={10000} required />
            <Field label="Target date" name="goal_target_date" type="date" />
          </div>
          <Field label="Monthly savings target $" name="monthly_savings_target" type="number" step="50" defaultValue={1000} />
          {error && <p className="text-xs text-[#f0888c]">{error}</p>}
          <Button type="submit" variant="animate" disabled={pending} className="w-full">
            {pending ? "Creating…" : "Create my household"}
          </Button>
        </form>
      ) : (
        <form
          action={(fd) => submit(onboardJoinHousehold, fd)}
          className="fin-card p-6 space-y-4"
        >
          <label className="block">
            <span className={labelCls}>Partner&apos;s household code</span>
            <input className={`${inputCls} uppercase tracking-widest`} name="code" placeholder="e.g. K7M2QX" required />
          </label>
          <p className="text-[11px] text-[var(--fin-muted)]">
            Ask your partner for their code (Settings → Household). You&apos;ll share one pooled view.
          </p>
          {error && <p className="text-xs text-[#f0888c]">{error}</p>}
          <Button type="submit" variant="animate" disabled={pending} className="w-full">
            {pending ? "Joining…" : "Join household"}
          </Button>
        </form>
      )}
    </div>
  );
}
