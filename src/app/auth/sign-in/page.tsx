"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInShell />}>
      <SignInForm />
    </Suspense>
  );
}

function SignInShell() {
  return (
    <main className="praxis-root min-h-screen flex items-center justify-center bg-[var(--color-surface)]" />
  );
}

const QUERY_ERROR_MESSAGES: Record<string, string> = {
  confirmation_failed: "Email confirmation failed. Please try signing up again or contact support.",
};

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/app/workspace";
  const queryError = params.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    queryError ? (QUERY_ERROR_MESSAGES[queryError] ?? "An error occurred. Please try again.") : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <main className="praxis-root min-h-screen flex items-center justify-center px-6 py-16 bg-[var(--color-surface)]">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center"
            aria-label="Praxis"
          >
            <PraxisLogo size={48} withWordmark glow />
          </Link>
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            Sign in to Praxis
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--color-surface-elevated)] hairline px-4 py-3 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--color-surface-elevated)] hairline px-4 py-3 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          {error && (
            <p className="text-sm text-[var(--color-pink)]">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          New here?{" "}
          <Link
            href="/auth/sign-up"
            className="text-[var(--color-accent)] hover:text-[var(--color-accent-hi)]"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
