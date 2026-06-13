"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { EnvelopeSimple, CheckCircle } from "@phosphor-icons/react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;
const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

function CheckYourEmailContent() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const reduced = useReducedMotion();
  const [resendState, setResendState] = useState<
    "idle" | "loading" | "sent" | "error"
  >("idle");

  async function handleResend() {
    if (!email || resendState === "loading") return;
    setResendState("loading");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setResendState(error ? "error" : "sent");
    } catch {
      setResendState("error");
    }
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
        initial={reduced ? false : "hidden"}
        animate="show"
        variants={CONTAINER}
        className="relative w-full max-w-[400px] flex flex-col items-center text-center"
      >
        {/* Logo */}
        <motion.div variants={ITEM} className="mb-10">
          <Link href="/" aria-label="Praxis">
            <PraxisLogo size={44} withWordmark glow />
          </Link>
        </motion.div>

        {/* Envelope icon */}
        <motion.div
          variants={ITEM}
          className="mb-8 flex items-center justify-center"
        >
          <div
            className="flex items-center justify-center w-20 h-20 rounded-2xl"
            style={{
              background: "rgba(91,99,232,0.08)",
              border: "1px solid rgba(91,99,232,0.18)",
            }}
          >
            <EnvelopeSimple
              size={40}
              weight="light"
              style={{ color: "var(--color-indigo-500, #5B63E8)" }}
            />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={ITEM}
          className="text-2xl mb-3"
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            color: "var(--color-ink-on-inverse)",
          }}
        >
          Check your email
        </motion.h1>

        {/* Body */}
        <motion.p
          variants={ITEM}
          className="text-sm mb-2 max-w-xs"
          style={{ color: "var(--color-ink-on-inverse-soft)", lineHeight: 1.65 }}
        >
          We sent a confirmation link to
        </motion.p>

        {email && (
          <motion.p
            variants={ITEM}
            className="text-sm mb-6 font-semibold"
            style={{ color: "var(--color-ink-on-inverse)" }}
          >
            {email}
          </motion.p>
        )}

        <motion.p
          variants={ITEM}
          className="text-sm mb-8 max-w-xs"
          style={{ color: "var(--color-ink-on-inverse-soft)", lineHeight: 1.65 }}
        >
          Click the link in the email to activate your account. The link expires
          in 24 hours.
        </motion.p>

        {/* Resend */}
        <motion.div variants={ITEM} className="w-full flex flex-col items-center gap-4">
          {resendState === "sent" ? (
            <div
              className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg"
              style={{
                background: "rgba(91,99,232,0.08)",
                border: "1px solid rgba(91,99,232,0.18)",
                color: "var(--color-indigo-500, #5B63E8)",
              }}
            >
              <CheckCircle size={16} weight="fill" />
              Verification email sent — check your inbox
            </div>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendState === "loading" || !email}
              className="text-sm transition-opacity disabled:opacity-40"
              style={{ color: "var(--color-ink-on-inverse-mute)" }}
            >
              {resendState === "loading"
                ? "Sending…"
                : resendState === "error"
                  ? "Failed — try again"
                  : "Didn't receive it? Resend"}
            </button>
          )}

          <Link
            href="/auth/sign-in"
            className="text-xs"
            style={{ color: "var(--color-ink-on-inverse-mute)" }}
          >
            Back to sign in →
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}

export default function CheckYourEmailPage() {
  return (
    <Suspense>
      <CheckYourEmailContent />
    </Suspense>
  );
}
