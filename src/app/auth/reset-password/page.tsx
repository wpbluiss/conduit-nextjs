"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";

const EASE = [0.25, 1, 0.5, 1] as const;
const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};
const ITEM = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

interface PasswordStrength {
  score: number; // 0-4
  missing: string[];
}

function checkPassword(pw: string): PasswordStrength {
  const checks = [
    { test: pw.length >= 8, label: "8+ characters" },
    { test: /[a-z]/.test(pw), label: "lowercase letter" },
    { test: /[A-Z]/.test(pw), label: "uppercase letter" },
    { test: /[0-9]/.test(pw), label: "number" },
  ];
  const missing = checks.filter((c) => !c.test).map((c) => c.label);
  return { score: 4 - missing.length, missing };
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"] as const;
const STRENGTH_COLORS = [
  "",
  "var(--color-pink)",
  "var(--color-yellow, #f59e0b)",
  "var(--color-green)",
  "var(--color-green)",
] as const;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pwTouched, setPwTouched] = useState(false);

  const strength = checkPassword(password);
  const showStrength = pwTouched && password.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (strength.score < 4) {
      setError(`Password needs: ${strength.missing.join(", ")}.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.replace("/app");
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
            Choose a new password
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
          <form onSubmit={onSubmit} className="space-y-5">
            <motion.div variants={ITEM}>
              <label
                htmlFor="password"
                className="block text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)] mb-2"
              >
                New password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPwTouched(true)}
                placeholder="Min. 8 characters"
                className="w-full rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-default)] px-4 py-3 text-[var(--color-text)] text-[15px] outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(255,138,61,0.12)]"
              />

              <AnimatePresence>
                {showStrength && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 overflow-hidden"
                  >
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          className="h-[3px] flex-1 rounded-full transition-all duration-300"
                          style={{
                            background:
                              n <= strength.score
                                ? STRENGTH_COLORS[strength.score]
                                : "var(--color-border-default)",
                          }}
                        />
                      ))}
                    </div>
                    <p
                      className="text-[11px] transition-colors duration-300"
                      style={{ color: STRENGTH_COLORS[strength.score] || "var(--color-text-muted)" }}
                    >
                      {strength.score === 4
                        ? STRENGTH_LABELS[4]
                        : `${STRENGTH_LABELS[strength.score] || "Needs"}: ${strength.missing.join(", ")}`}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div variants={ITEM}>
              <label
                htmlFor="confirm"
                className="block text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)] mb-2"
              >
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                className="w-full rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-default)] px-4 py-3 text-[var(--color-text)] text-[15px] outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(255,138,61,0.12)]"
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

            <motion.button
              variants={ITEM}
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-60"
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  Updating…
                </>
              ) : (
                <>
                  Update password
                  <ArrowRight size={15} weight="bold" />
                </>
              )}
            </motion.button>
          </form>
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
