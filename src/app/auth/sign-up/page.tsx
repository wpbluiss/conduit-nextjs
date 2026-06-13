"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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

function parseSupabaseSignUpError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already exists")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (lower.includes("password should be at least")) {
    return "Password must be at least 8 characters.";
  }
  if (lower.includes("password should contain")) {
    return "Password must include uppercase, lowercase, and a number.";
  }
  if (lower.includes("invalid email")) {
    return "Please enter a valid email address.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return message;
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"] as const;
const STRENGTH_COLORS = [
  "",
  "var(--color-pink)",
  "var(--color-yellow, #f59e0b)",
  "var(--color-green)",
  "var(--color-green)",
] as const;

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pwTouched, setPwTouched] = useState(false);

  const strength = checkPassword(password);
  const showStrength = pwTouched && password.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (strength.score < 4) {
      setError(`Password needs: ${strength.missing.join(", ")}.`);
      return;
    }

    setLoading(true);
    track("signup_started");
    const supabase = createSupabaseBrowserClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (signUpError) {
      setError(parseSupabaseSignUpError(signUpError.message));
      setLoading(false);
      return;
    }
    if (data.session) {
      track("signup_completed");
      router.replace("/app/workspace");
      router.refresh();
    } else {
      setInfo("Check your email to confirm your account. Once confirmed, you can sign in.");
      setLoading(false);
    }
  }

  return (
    <main className="conduit-bg-inverse min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-16">
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
          <p className="mt-3 text-sm text-[var(--color-ink-on-inverse-soft)]">
            Create your Praxis workspace
          </p>
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
                htmlFor="name"
                className="block text-xs uppercase tracking-[0.14em] text-[var(--color-ink-on-inverse-soft)] mb-2"
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
                className="w-full rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] px-4 py-3 text-[var(--color-ink-on-inverse)] text-[15px] outline-none transition-all duration-200 focus:border-[var(--color-ember-500)] focus:shadow-[0_0_0_3px_rgba(255,138,61,0.12)] placeholder:text-[var(--color-ink-on-inverse-mute)]"
              />
            </motion.div>

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
              <label
                htmlFor="password"
                className="block text-xs uppercase tracking-[0.14em] text-[var(--color-ink-on-inverse-soft)] mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPwTouched(true)}
                placeholder="Min. 8 characters"
                className="w-full rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] px-4 py-3 text-[var(--color-ink-on-inverse)] text-[15px] outline-none transition-all duration-200 focus:border-[var(--color-ember-500)] focus:shadow-[0_0_0_3px_rgba(255,138,61,0.12)]"
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
                    {/* Strength bar */}
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

            {error && (
              <motion.p
                key={error}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 leading-[1.5]"
              >
                {error}
              </motion.p>
            )}

            {info && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-emerald-400 leading-[1.5]"
              >
                {info}
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
          <p className="text-[11px] text-[var(--color-ink-on-inverse-mute)] leading-relaxed">
            By creating an account you agree to our{" "}
            <Link
              href="/legal/terms"
              className="underline underline-offset-2 hover:text-[var(--color-ember-300)] transition-colors"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/legal/privacy"
              className="underline underline-offset-2 hover:text-[var(--color-ember-300)] transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>
          <p className="text-sm text-[var(--color-ink-on-inverse-soft)]">
            Already have one?{" "}
            <Link
              href="/auth/sign-in"
              className="text-[var(--color-ember-500)] hover:text-[var(--color-ember-300)] transition-colors font-medium"
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
