"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";
import { track } from "@/lib/analytics/track";

function friendlySignupError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("user already exists") || m.includes("email already")) {
    return "That email is already registered. Try signing in instead.";
  }
  if (m.includes("password") && (m.includes("short") || m.includes("weak") || m.includes("characters"))) {
    return "Password must be at least 8 characters.";
  }
  if (m.includes("invalid email") || m.includes("email is invalid")) {
    return "Enter a valid email address.";
  }
  if (m.includes("rate limit") || m.includes("too many requests") || m.includes("too many")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  return message;
}

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    track("signup_started");
    const supabase = createSupabaseBrowserClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        // Route through /auth/callback so PKCE code is exchanged correctly.
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/app`,
      },
    });
    if (authError) {
      setError(friendlySignupError(authError.message));
      setLoading(false);
      return;
    }
    if (data.session) {
      track("signup_completed");
      router.replace("/app");
      router.refresh();
    } else {
      setInfo(
        "Check your email to confirm. Once confirmed you'll be signed in automatically.",
      );
      setLoading(false);
    }
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
            Create your Praxis workspace
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-2"
            >
              Your name
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--color-surface-elevated)] hairline px-4 py-3 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
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
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--color-surface-elevated)] hairline px-4 py-3 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Minimum 8 characters
            </p>
          </div>
          {error && (
            <p className="text-sm text-[var(--color-pink)]">{error}</p>
          )}
          {info && (
            <p className="text-sm text-[var(--color-green)]">{info}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-50"
          >
            {loading ? "Creating workspace..." : "Create workspace"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Already have one?{" "}
          <Link
            href="/auth/sign-in"
            className="text-[var(--color-accent)] hover:text-[var(--color-accent-hi)]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
