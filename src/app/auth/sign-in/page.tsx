"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";
import { OAuthButtons, OAuthDivider } from "@/components/conduit/OAuthButtons";

const EASE = [0.25, 1, 0.5, 1] as const;

const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};
const ITEM = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInShell />}>
      <SignInForm />
    </Suspense>
  );
}

function SignInShell() {
  return (
    <main className="praxis-root conduit-bg-canvas min-h-screen" />
  );
}

const QUERY_ERROR_MESSAGES: Record<string, string> = {
  confirmation_failed:
    "Email confirmation failed. Please try signing up again or contact support.",
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
    queryError
      ? (QUERY_ERROR_MESSAGES[queryError] ??
          "An error occurred. Please try again.")
      : null,
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
    <main className="conduit-bg-inverse min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-16">
      {/* Atmospheric layers matching marketing site */}
      <div className="conduit-mesh" aria-hidden />
      <div className="conduit-ember-radial" aria-hidden />

      {/* Ember aura at bottom */}
      <div
        aria-hidden
        className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[700px] h-[320px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center bottom, rgba(255,138,61,0.14) 0%, transparent 65%)",
          filter: "blur(48px)",
        }}
      />

      <motion.div
        initial="hidden"
        animate="show"
        variants={CONTAINER}
        className="relative w-full max-w-[400px]"
      >
        {/* Logo */}
        <motion.div variants={ITEM} className="mb-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center"
            aria-label="Praxis"
          >
            <PraxisLogo size={48} withWordmark glow />
          </Link>
          <p className="mt-3 text-sm text-[var(--color-ink-on-inverse-soft)]">
            Sign in to your workspace
          </p>
        </motion.div>

        {/* OAuth providers */}
        <motion.div variants={ITEM}>
          <OAuthButtons />
          <OAuthDivider />
        </motion.div>

        {/* Form card */}
        <motion.div
          variants={ITEM}
          className="rounded-2xl border border-[rgba(255,255,255,0.08)] p-8"
          style={{
            background: "var(--color-bg-inverse-elevated)",
            boxShadow:
              "inset 0 0 0 1px rgba(255,138,61,0.07), 0 24px 64px rgba(10,9,8,0.55)",
          }}
        >
          <form onSubmit={onSubmit} className="space-y-5">
            <motion.div variants={ITEM}>
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-[0.14em] text-[var(--color-ink-on-inverse-soft)] mb-2"
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
                placeholder="you@company.com"
                className="w-full rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] px-4 py-3 text-[var(--color-ink-on-inverse)] text-[15px] outline-none transition-all duration-200 focus:border-[var(--color-ember-500)] focus:shadow-[0_0_0_3px_rgba(255,138,61,0.12)] placeholder:text-[var(--color-ink-on-inverse-mute)]"
              />
            </motion.div>

            <motion.div variants={ITEM}>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs uppercase tracking-[0.14em] text-[var(--color-ink-on-inverse-soft)]"
                >
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[11px] text-[var(--color-ink-on-inverse-mute)] hover:text-[var(--color-ember-300)] transition-colors"
                  tabIndex={-1}
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
                placeholder="••••••••"
                className="w-full rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] px-4 py-3 text-[var(--color-ink-on-inverse)] text-[15px] outline-none transition-all duration-200 focus:border-[var(--color-ember-500)] focus:shadow-[0_0_0_3px_rgba(255,138,61,0.12)]"
              />
            </motion.div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 leading-[1.5]"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              variants={ITEM}
              type="submit"
              disabled={loading}
              className="conduit-auth-btn w-full justify-center disabled:opacity-60"
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={15} weight="bold" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        <motion.p
          variants={ITEM}
          className="mt-6 text-center text-sm text-[var(--color-ink-on-inverse-soft)]"
        >
          New here?{" "}
          <Link
            href="/auth/sign-up"
            className="text-[var(--color-ember-500)] hover:text-[var(--color-ember-300)] transition-colors font-medium"
          >
            Create an account
          </Link>
        </motion.p>
      </motion.div>
    </main>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="30 28"
      />
    </svg>
  );
}
