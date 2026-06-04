"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { GradientText } from "./ui";
import { Button, inputCls, labelCls } from "./forms";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState(mode === "sign-in" ? "luisdelia@praxisbank.app" : "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/finance");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          router.push("/finance");
          router.refresh();
        } else {
          setNotice("Account created. If email confirmation is on, confirm then sign in.");
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="fin-mono text-[11px] uppercase tracking-[0.3em] text-[var(--fin-muted)] mb-3">
          Praxis Private Bank
        </div>
        <h1 className="fin-display text-3xl tracking-tight">
          {mode === "sign-in" ? (
            <>
              Welcome back, <GradientText>Luis &amp; Delia</GradientText>
            </>
          ) : (
            <>
              Create your <GradientText>household</GradientText>
            </>
          )}
        </h1>
        <p className="text-sm text-[var(--fin-muted)] mt-2">
          One shared pool. One goal: <span className="text-white">$75,000</span>.
        </p>
      </div>

      <form onSubmit={onSubmit} className="fin-card p-6 space-y-4">
        <label className="block">
          <span className={labelCls}>Email</span>
          <input
            className={inputCls}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="block">
          <span className={labelCls}>Password</span>
          <input
            className={inputCls}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            placeholder="••••••••"
            required
          />
        </label>

        {error && <p className="text-xs text-red-300">{error}</p>}
        {notice && <p className="text-xs text-emerald-300">{notice}</p>}

        <Button type="submit" variant="animate" disabled={loading} className="w-full">
          {loading ? "…" : mode === "sign-in" ? "Enter the bank" : "Create household"}
        </Button>

        <p className="text-center text-xs text-[var(--fin-muted)] pt-1">
          {mode === "sign-in" ? (
            <>
              Need an account?{" "}
              <Link href="/finance/sign-up" className="text-violet-300 hover:underline">
                Create one
              </Link>
            </>
          ) : (
            <>
              Already have one?{" "}
              <Link href="/finance/sign-in" className="text-violet-300 hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
