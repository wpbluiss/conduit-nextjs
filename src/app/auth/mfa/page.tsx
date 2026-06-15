"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";
import { SpinnerIcon } from "@/components/conduit/PraxisButton";

const EASE = [0.25, 1, 0.5, 1] as const;
const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};
const ITEM = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export default function MFAPage() {
  return (
    <Suspense fallback={<MFAShell />}>
      <MFAForm />
    </Suspense>
  );
}

function MFAShell() {
  return <main className="praxis-root conduit-bg-canvas min-h-screen" />;
}

type Mode = "totp" | "backup";

function MFAForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/app/workspace";

  const [mode, setMode] = useState<Mode>("totp");
  const [code, setCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setCode("");
    setBackupCode("");
  }

  async function onTOTPSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();

      const { data: factorsData, error: listErr } = await supabase.auth.mfa.listFactors();
      if (listErr || !factorsData) {
        setError("Could not load authenticator factors. Please sign in again.");
        return;
      }
      const factor = factorsData.totp.find((f: { id: string; status: string }) => f.status === "verified");
      if (!factor) {
        router.replace(next);
        router.refresh();
        return;
      }

      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      });
      if (cErr || !challenge) {
        setError(cErr?.message ?? "Challenge failed. Try again.");
        return;
      }

      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challenge.id,
        code,
      });
      if (vErr) {
        setError("Incorrect code. Please check your authenticator app.");
        setCode("");
        return;
      }

      router.replace(next);
      router.refresh();
    });
  }

  async function onBackupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/conduit/auth/backup-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: backupCode }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          json.error === "invalid_code"
            ? "Invalid backup code. Double-check and try again."
            : json.error === "no_backup_codes"
              ? "No backup codes on file. Contact support."
              : "Something went wrong. Try again.",
        );
        setBackupCode("");
        return;
      }
      // TOTP factor deleted server-side; refresh session so redirect proceeds.
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.refreshSession();
      router.replace(next);
      router.refresh();
    });
  }

  return (
    <main className="conduit-bg-inverse min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-16">
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
        className="relative w-full max-w-[380px]"
      >
        <motion.div variants={ITEM} className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center justify-center" aria-label="Praxis">
            <PraxisLogo size={48} withWordmark glow />
          </Link>
          <p className="mt-3 text-sm text-[var(--color-ink-on-inverse-soft)]">
            Two-factor authentication
          </p>
        </motion.div>

        <motion.div
          variants={ITEM}
          className="rounded-2xl border border-[rgba(255,255,255,0.08)] p-8"
          style={{
            background: "var(--color-bg-inverse-elevated)",
            boxShadow:
              "inset 0 0 0 1px rgba(255,138,61,0.07), 0 24px 64px rgba(10,9,8,0.55)",
          }}
        >
          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-[rgba(255,255,255,0.08)] mb-6">
            <button
              type="button"
              onClick={() => switchMode("totp")}
              className={`flex-1 py-2 text-[13px] font-medium transition-colors ${
                mode === "totp"
                  ? "bg-[rgba(255,255,255,0.06)] text-[var(--color-ink-on-inverse)]"
                  : "text-[var(--color-ink-on-inverse-mute)] hover:text-[var(--color-ink-on-inverse-soft)]"
              }`}
            >
              Authenticator
            </button>
            <button
              type="button"
              onClick={() => switchMode("backup")}
              className={`flex-1 py-2 text-[13px] font-medium transition-colors border-l border-[rgba(255,255,255,0.08)] ${
                mode === "backup"
                  ? "bg-[rgba(255,255,255,0.06)] text-[var(--color-ink-on-inverse)]"
                  : "text-[var(--color-ink-on-inverse-mute)] hover:text-[var(--color-ink-on-inverse-soft)]"
              }`}
            >
              Backup code
            </button>
          </div>

          <AnimatePresence mode="wait">
            {mode === "totp" ? (
              <motion.div
                key="totp"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18, ease: EASE }}
              >
                <p className="text-sm text-[var(--color-ink-on-inverse-soft)] mb-5">
                  Enter the 6-digit code from your authenticator app to continue.
                </p>
                <form onSubmit={onTOTPSubmit} className="space-y-5">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    disabled={isPending}
                    autoFocus
                    className="w-full rounded-lg text-center text-2xl tracking-[0.4em] font-mono bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] px-4 py-3 text-[var(--color-ink-on-inverse)] outline-none transition-all duration-200 focus:border-[var(--color-ember-500)] focus:shadow-[0_0_0_3px_rgba(255,138,61,0.12)] disabled:opacity-50"
                  />
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-400 leading-[1.5]"
                    >
                      {error}
                    </motion.p>
                  )}
                  <button
                    type="submit"
                    disabled={isPending || code.length !== 6}
                    className="conduit-auth-btn w-full justify-center disabled:opacity-60"
                  >
                    {isPending ? (
                      <><SpinnerIcon size={15} />Verifying…</>
                    ) : (
                      "Verify"
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="backup"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18, ease: EASE }}
              >
                <p className="text-sm text-[var(--color-ink-on-inverse-soft)] mb-5">
                  Enter one of your saved backup codes. Each code can only be used once.
                  After use, your authenticator will be removed — re-enroll in Settings.
                </p>
                <form onSubmit={onBackupSubmit} className="space-y-5">
                  <input
                    type="text"
                    autoComplete="off"
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value.replace(/\s/g, "").toLowerCase())}
                    placeholder="a1b2c3d4e5"
                    disabled={isPending}
                    autoFocus
                    className="w-full rounded-lg text-center text-lg tracking-[0.2em] font-mono bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] px-4 py-3 text-[var(--color-ink-on-inverse)] outline-none transition-all duration-200 focus:border-[var(--color-ember-500)] focus:shadow-[0_0_0_3px_rgba(255,138,61,0.12)] disabled:opacity-50"
                  />
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-400 leading-[1.5]"
                    >
                      {error}
                    </motion.p>
                  )}
                  <button
                    type="submit"
                    disabled={isPending || backupCode.length < 8}
                    className="conduit-auth-btn w-full justify-center disabled:opacity-60"
                  >
                    {isPending ? (
                      <><SpinnerIcon size={15} />Verifying…</>
                    ) : (
                      "Use backup code"
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </main>
  );
}
