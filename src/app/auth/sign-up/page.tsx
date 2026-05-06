"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

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
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/app`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (data.session) {
      router.replace("/app");
      router.refresh();
    } else {
      setInfo(
        "Check your email to confirm. Once confirmed, you can sign in.",
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-[var(--color-surface)]">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="serif text-3xl text-[var(--color-text)]"
          >
            Conduit
          </Link>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            Create your workspace
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
