"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      },
    );
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
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
            Reset your password
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-[var(--color-green)]">
              Check your email — a reset link is on its way.
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Didn&rsquo;t get it? Check your spam folder or{" "}
              <button
                type="button"
                className="text-[var(--color-accent)] hover:text-[var(--color-accent-hi)]"
                onClick={() => setSent(false)}
              >
                try again
              </button>
              .
            </p>
            <Link
              href="/auth/sign-in"
              className="block text-sm text-[var(--color-text-muted)] mt-4"
            >
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <>
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
              {error && (
                <p className="text-sm text-[var(--color-pink)]">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
              <Link
                href="/auth/sign-in"
                className="text-[var(--color-accent)] hover:text-[var(--color-accent-hi)]"
              >
                ← Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
