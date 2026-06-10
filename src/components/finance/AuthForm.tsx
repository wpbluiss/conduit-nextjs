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
  const [email, setEmail] = useState("");
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
          setNotice("Check your email to confirm your account, then sign in.");
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
          Cadence · by Conduit AI
        </div>
        <h1 className="fin-display text-3xl tracking-tight">
          {mode === "sign-in" ? (
            <>
              Welcome back to <GradientText>Cadence</GradientText>
            </>
          ) : (
            <>
              Create your <GradientText>Cadence</GradientText> account
            </>
          )}
        </h1>
        <p className="text-sm text-[var(--fin-muted)] mt-2">
          Your AI-powered private bank. One pool, one goal.
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

        {error && <p className="text-xs text-[#f0888c]">{error}</p>}
        {notice && <p className="text-xs text-[#7cc6a0]">{notice}</p>}

        <Button type="submit" variant="animate" disabled={loading} className="w-full">
          {loading ? "…" : mode === "sign-in" ? "Sign in" : "Create account"}
        </Button>

        {mode === "sign-up" && (
          <p className="text-center text-[11px] text-[var(--fin-muted)] leading-relaxed">
            By continuing you agree to our{" "}
            <Link href="/finance/legal/terms" className="text-[#ffa876] hover:underline">Terms</Link> and{" "}
            <Link href="/finance/legal/privacy" className="text-[#ffa876] hover:underline">Privacy Policy</Link>.
            Cadence is a budgeting &amp; education tool, not financial advice.
          </p>
        )}

        <p className="text-center text-xs text-[var(--fin-muted)] pt-1">
          {mode === "sign-in" ? (
            <>
              Need an account?{" "}
              <Link href="/finance/sign-up" className="text-[#ffa876] hover:underline">
                Create one
              </Link>
            </>
          ) : (
            <>
              Already have one?{" "}
              <Link href="/finance/sign-in" className="text-[#ffa876] hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
