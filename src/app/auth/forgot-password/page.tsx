"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";
import { Button } from "@/components/conduit/ui/Button";

const EASE = [0.25, 1, 0.5, 1] as const;
const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};
const ITEM = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  return (
    <main className="praxis-root conduit-bg-canvas min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-16">
      <div className="conduit-mesh" aria-hidden />
      <div className="conduit-ember-radial" aria-hidden />

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
        <motion.div variants={ITEM} className="mb-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center"
            aria-label="Praxis"
          >
            <PraxisLogo size={48} withWordmark glow />
          </Link>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            {sent ? "Check your inbox" : "Reset your password"}
          </p>
        </motion.div>

        <motion.div
          variants={ITEM}
          className="rounded-2xl border border-[var(--color-border-default)] p-8"
          style={{
            background: "var(--color-surface-elevated)",
            boxShadow:
              "inset 0 0 0 1px rgba(255,138,61,0.05), 0 24px 64px rgba(10,9,8,0.45)",
          }}
        >
          {sent ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 text-center"
            >
              <p className="text-[var(--color-text)] text-[15px] leading-relaxed">
                We sent a reset link to{" "}
                <span className="text-[var(--color-accent)] font-medium">
                  {email}
                </span>
                . Click the link to choose a new password.
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Didn&rsquo;t receive it? Check your spam folder or{" "}
                <button
                  onClick={() => setSent(false)}
                  className="text-[var(--color-accent)] hover:text-[var(--color-accent-hi)] transition-colors font-medium"
                >
                  try again
                </button>
                .
              </p>
            </motion.div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <motion.div variants={ITEM}>
                <p className="text-sm text-[var(--color-text-muted)] mb-5 leading-relaxed">
                  Enter your email and we&rsquo;ll send you a link to reset your
                  password.
                </p>
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
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-default)] px-4 py-3 text-[var(--color-text)] text-[15px] outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(255,138,61,0.12)] placeholder:text-[var(--color-text-muted)]"
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

              <Button
                variants={ITEM}
                type="submit"
                isLoading={loading}
                loadingText="Sending…"
                className="w-full justify-center"
              >
                Send reset link
                <ArrowRight size={15} weight="bold" />
              </Button>
            </form>
          )}
        </motion.div>

        <motion.p
          variants={ITEM}
          className="mt-6 text-center text-sm text-[var(--color-text-muted)]"
        >
          <Link
            href="/auth/sign-in"
            className="text-[var(--color-accent)] hover:text-[var(--color-accent-hi)] transition-colors font-medium"
          >
            Back to sign in
          </Link>
        </motion.p>
      </motion.div>
    </main>
  );
}

