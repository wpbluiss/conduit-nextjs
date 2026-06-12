"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";
import { track } from "@/lib/analytics/track";

const EASE = [0.25, 1, 0.5, 1] as const;

const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};
const ITEM = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (data.session) {
      track("signup_completed");
      router.replace("/app");
      router.refresh();
    } else {
      setInfo("Check your email to confirm. Once confirmed, you can sign in.");
      setLoading(false);
    }
  }

  return (
    <main className="praxis-root conduit-bg-canvas min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-16">
      {/* Atmospheric layers */}
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
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            Create your Praxis workspace
          </p>
        </motion.div>

        {/* Form card */}
        <motion.div
          variants={ITEM}
          className="rounded-2xl border border-[var(--color-border-default)] p-8"
          style={{
            background: "var(--color-surface-elevated)",
            boxShadow:
              "inset 0 0 0 1px rgba(255,138,61,0.05), 0 24px 64px rgba(10,9,8,0.45)",
          }}
        >
          <form onSubmit={onSubmit} className="space-y-5">
            <motion.div variants={ITEM}>
              <label
                htmlFor="name"
                className="block text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)] mb-2"
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
                placeholder="First Last"
                className="w-full rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-default)] px-4 py-3 text-[var(--color-text)] text-[15px] outline-none transition-all duration-200 focus:border-[var(--color-indigo-500)] focus:shadow-[0_0_0_3px_rgba(91,99,232,0.12)] placeholder:text-[var(--color-text-muted)]"
              />
            </motion.div>

            <motion.div variants={ITEM}>
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)] mb-2"
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
                className="w-full rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-default)] px-4 py-3 text-[var(--color-text)] text-[15px] outline-none transition-all duration-200 focus:border-[var(--color-indigo-500)] focus:shadow-[0_0_0_3px_rgba(91,99,232,0.12)] placeholder:text-[var(--color-text-muted)]"
              />
            </motion.div>

            <motion.div variants={ITEM}>
              <label
                htmlFor="password"
                className="block text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)] mb-2"
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
                placeholder="Min. 8 characters"
                className="w-full rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-default)] px-4 py-3 text-[var(--color-text)] text-[15px] outline-none transition-all duration-200 focus:border-[var(--color-indigo-500)] focus:shadow-[0_0_0_3px_rgba(91,99,232,0.12)]"
              />
            </motion.div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-[var(--color-pink)] leading-[1.5]"
              >
                {error}
              </motion.p>
            )}

            {info && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-[var(--color-green)] leading-[1.5]"
              >
                {info}
              </motion.p>
            )}

            <motion.button
              variants={ITEM}
              type="submit"
              disabled={loading}
              className="conduit-btn-primary w-full justify-center disabled:opacity-60"
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  Creating workspace…
                </>
              ) : (
                <>
                  Create workspace
                  <ArrowRight size={15} weight="bold" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        <motion.div
          variants={ITEM}
          className="mt-5 space-y-3 text-center"
        >
          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
            By creating an account you agree to our{" "}
            <Link
              href="/legal/terms"
              className="underline underline-offset-2 hover:text-[var(--color-indigo-500)] transition-colors"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/legal/privacy"
              className="underline underline-offset-2 hover:text-[var(--color-indigo-500)] transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Already have one?{" "}
            <Link
              href="/auth/sign-in"
              className="text-[var(--color-indigo-500)] hover:text-[var(--color-indigo-700)] transition-colors font-medium"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
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
