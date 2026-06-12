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

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials") || m.includes("user not found")) {
    return "Wrong email or password.";
  }
  if (m.includes("email not confirmed")) {
    return "Check your inbox — you need to confirm your email before signing in.";
  }
  if (m.includes("rate limit") || m.includes("too many requests") || m.includes("too many")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (m.includes("link") && m.includes("expired")) {
    return "That confirmation link has expired. Request a new one below.";
  }
  return message;
}

/** Ensures redirect target is a safe local path. */
function safeNext(raw: string | null): string {
  if (!raw) return "/app/workspace";
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/app/workspace";
}

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const callbackError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    callbackError === "link_expired"
      ? "That confirmation link has expired — sign in directly or request a new one."
      : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError(friendlyAuthError(authError.message));
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
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]"
              >
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
              >
                Forgot?
              </Link>
            </div>
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
