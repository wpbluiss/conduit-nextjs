"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeSlash, Check, X } from "@phosphor-icons/react";
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

type StrengthLevel = "weak" | "fair" | "strong";

interface StrengthResult {
  level: StrengthLevel;
  score: number; // 0–4
  criteria: {
    length: boolean;
    uppercase: boolean;
    number: boolean;
    symbol: boolean;
  };
}

function evaluatePassword(pw: string): StrengthResult {
  const criteria = {
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  const metCount = Object.values(criteria).filter(Boolean).length;
  const isLong = pw.length >= 12;
  const allMet = metCount === 4;

  let level: StrengthLevel = "weak";
  if (allMet && isLong) level = "strong";
  else if (criteria.length && metCount >= 3) level = "fair";
  else if (criteria.length && metCount >= 2) level = "fair";

  return { level, score: metCount, criteria };
}

const STRENGTH_BAR: Record<StrengthLevel, { width: string; color: string; label: string }> = {
  weak: { width: "33%", color: "var(--color-pink)", label: "Weak" },
  fair: { width: "66%", color: "var(--color-amber)", label: "Fair" },
  strong: { width: "100%", color: "var(--color-green)", label: "Strong" },
};

const CRITERIA_LABELS: { key: keyof StrengthResult["criteria"]; label: string }[] = [
  { key: "length", label: "At least 8 characters" },
  { key: "uppercase", label: "Uppercase letter" },
  { key: "number", label: "Number" },
  { key: "symbol", label: "Symbol (!@#$…)" },
];

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const strength = password.length > 0 ? evaluatePassword(password) : null;
  const canSubmit = !strength || strength.level !== "weak";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
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
                className="w-full rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-default)] px-4 py-3 text-[var(--color-text)] text-[15px] outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(255,138,61,0.12)] placeholder:text-[var(--color-text-muted)]"
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
                className="w-full rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-default)] px-4 py-3 text-[var(--color-text)] text-[15px] outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(255,138,61,0.12)] placeholder:text-[var(--color-text-muted)]"
              />
            </motion.div>

            <motion.div variants={ITEM}>
              <label
                htmlFor="password"
                className="block text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)] mb-2"
              >
                Password
              </label>

              {/* Input + toggle */}
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  aria-describedby="password-strength-desc"
                  className="w-full rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-default)] px-4 py-3 pr-11 text-[var(--color-text)] text-[15px] outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(255,138,61,0.12)]"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
                >
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength meter */}
              {strength && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 space-y-2"
                  id="password-strength-desc"
                  role="status"
                  aria-live="polite"
                >
                  {/* Bar */}
                  <div className="flex items-center gap-3">
                    <div
                      className="flex-1 h-1 rounded-full overflow-hidden"
                      style={{ background: "var(--color-border-default)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: STRENGTH_BAR[strength.level].width,
                          background: STRENGTH_BAR[strength.level].color,
                        }}
                      />
                    </div>
                    <span
                      className="text-[11px] shrink-0"
                      style={{ color: STRENGTH_BAR[strength.level].color }}
                    >
                      {STRENGTH_BAR[strength.level].label}
                    </span>
                  </div>

                  {/* Criteria checklist */}
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1" aria-label="Password requirements">
                    {CRITERIA_LABELS.map(({ key, label }) => (
                      <li
                        key={key}
                        className="flex items-center gap-1.5 text-[11px]"
                        style={{
                          color: strength.criteria[key]
                            ? "var(--color-green)"
                            : "var(--color-text-muted)",
                        }}
                      >
                        {strength.criteria[key] ? (
                          <Check size={11} weight="bold" aria-hidden />
                        ) : (
                          <X size={11} weight="bold" aria-hidden />
                        )}
                        {label}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </motion.div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-[var(--color-pink)] leading-[1.5]"
                role="alert"
              >
                {error}
              </motion.p>
            )}

            {info && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-[var(--color-green)] leading-[1.5]"
                role="status"
              >
                {info}
              </motion.p>
            )}

            <motion.button
              variants={ITEM}
              type="submit"
              disabled={loading || !canSubmit}
              aria-disabled={!canSubmit}
              className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
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
              className="underline underline-offset-2 hover:text-[var(--color-accent)] transition-colors"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/legal/privacy"
              className="underline underline-offset-2 hover:text-[var(--color-accent)] transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Already have one?{" "}
            <Link
              href="/auth/sign-in"
              className="text-[var(--color-accent)] hover:text-[var(--color-accent-hi)] transition-colors font-medium"
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
