"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;

// ─── Demo script ────────────────────────────────────────────────────────────
type Scene = {
  specialist: string;
  role: string;
  accent: string;
  query: string;
  result: { label: string; body: string; mono?: boolean };
};

const SCENES: Scene[] = [
  {
    specialist: "Maya",
    role: "Marketing",
    accent: "#FF8A3D",
    query: "Draft a cold email for Series A founders running lean ops teams.",
    result: {
      label: "email · draft",
      body: `Subject: Your ops team just got 9× bigger

Hi [First Name],

Your engineering team ships fast. Why does ops still run on spreadsheets?

Praxis gives Series A teams a nine-person AI workforce — finance, legal, marketing, and more — ready day one. No hires. No ramp time.

Try it free → conduitai.io`,
    },
  },
  {
    specialist: "Kai",
    role: "Engineering",
    accent: "#818CF8",
    query: "Build a Stripe webhook handler that logs subscription events to Supabase.",
    result: {
      label: "code · TypeScript",
      mono: true,
      body: `import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const raw = await req.text();
  const event = stripe.webhooks
    .constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!);

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object;
    await supabase.from("subscriptions")
      .upsert({ id: sub.id, status: sub.status });
  }
  return NextResponse.json({ ok: true });
}`,
    },
  },
  {
    specialist: "Zara",
    role: "Sales",
    accent: "#34D399",
    query: "Surface the top 3 pipeline leads from this week, ranked by deal fit.",
    result: {
      label: "report · pipeline",
      body: `Pipeline Report · 7-day view

1  Acme Corp       $240k ARR fit
   CTO engaged · Demo booked Thu · High intent

2  Nova Systems    $180k ARR fit
   3 email opens · Last touch 2d ago · Needs follow-up

3  Bravo Inc       $120k ARR fit
   Trial started Mon · 4 sessions · Warm`,
    },
  },
];

const SCENE_DURATION = 15000; // ms per scene
const CHARS_PER_MS = 0.4;     // typing speed — chars per ms

// ─── CinematicDemo ──────────────────────────────────────────────────────────
function CinematicDemo() {
  const reduced = useReducedMotion();
  const [sceneIdx, setSceneIdx] = useState(0);
  const [phase, setPhase] = useState<"query" | "thinking" | "result">("query");
  const [typed, setTyped] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scene = SCENES[sceneIdx];
  const resultLen = scene.result.body.length;

  function clearTimers() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  useEffect(() => {
    if (reduced) {
      setPhase("result");
      setTyped(resultLen);
      return;
    }

    clearTimers();
    setPhase("query");
    setTyped(0);

    // 0.8s — show query, then switch to thinking
    timerRef.current = setTimeout(() => {
      setPhase("thinking");

      // 1.5s — switch to result and start typing
      timerRef.current = setTimeout(() => {
        setPhase("result");
        let chars = 0;
        intervalRef.current = setInterval(() => {
          chars += 1;
          setTyped(chars);
          if (chars >= resultLen) clearInterval(intervalRef.current!);
        }, Math.round(1 / CHARS_PER_MS));
      }, 1500);
    }, 800);

    // Advance to next scene after SCENE_DURATION
    const advanceTimer = setTimeout(() => {
      setSceneIdx((i) => (i + 1) % SCENES.length);
    }, SCENE_DURATION);

    return () => {
      clearTimers();
      clearTimeout(advanceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneIdx, reduced]);

  const visibleResult = scene.result.body.slice(0, typed);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0D0C0B 0%, #111018 100%)",
        boxShadow:
          "inset 0 0 0 1px rgba(255,138,61,0.12), 0 0 80px rgba(91,99,232,0.18), 0 32px 80px rgba(0,0,0,0.6)",
        minHeight: "420px",
      }}
    >
      {/* Atmospheric ember haze */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 20% 100%, rgba(255,138,61,0.06) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 80% 0%, rgba(91,99,232,0.08) 0%, transparent 60%)",
        }}
      />

      {/* ── Header bar ─────────────────────────────────────── */}
      <div
        className="relative flex items-center gap-2.5 px-5 py-3.5 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <span className="size-2.5 rounded-full bg-[#FF5F56]" />
        <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="size-2.5 rounded-full bg-[#27C840]" />
        <span
          className="ml-3 text-[11px] tracking-[0.14em] uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            color: "rgba(245,239,230,0.4)",
          }}
        >
          Praxis Console · {scene.specialist} · {scene.role}
        </span>

        {/* Scene progress dots */}
        <div className="ml-auto flex items-center gap-1.5">
          {SCENES.map((_, i) => (
            <button
              key={i}
              aria-label={`Scene ${i + 1}`}
              onClick={() => setSceneIdx(i)}
              className="size-1.5 rounded-full transition-all duration-300"
              style={{
                background: i === sceneIdx ? scene.accent : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Two-panel body ─────────────────────────────────── */}
      <div className="relative grid grid-cols-1 md:grid-cols-[1fr_1.2fr] min-h-[360px]">

        {/* Left: conversation rail */}
        <div
          className="flex flex-col gap-3 p-5 border-b md:border-b-0 md:border-r"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          <p
            className="text-[10px] uppercase tracking-[0.16em] mb-1"
            style={{ color: "rgba(245,239,230,0.3)", fontFamily: "var(--font-mono)" }}
          >
            Thread
          </p>

          {/* User message */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`query-${sceneIdx}`}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="flex gap-2.5"
            >
              <span
                className="mt-0.5 size-5 shrink-0 rounded grid place-items-center text-[10px] font-bold"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(245,239,230,0.6)" }}
              >
                U
              </span>
              <p className="text-[13px] leading-[1.55]" style={{ color: "rgba(245,239,230,0.75)" }}>
                {scene.query}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Specialist thinking / done */}
          <AnimatePresence>
            {(phase === "thinking" || phase === "result") && (
              <motion.div
                key={`specialist-${sceneIdx}`}
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="flex gap-2.5 items-start"
              >
                <span
                  className="mt-0.5 size-5 shrink-0 rounded grid place-items-center text-[10px] font-bold"
                  style={{ background: scene.accent + "22", color: scene.accent }}
                >
                  {scene.specialist[0]}
                </span>
                <div>
                  <p
                    className="text-[11px] font-medium mb-0.5"
                    style={{ color: scene.accent }}
                  >
                    {scene.specialist} · {scene.role}
                  </p>
                  {phase === "thinking" && !reduced ? (
                    <TypingDots />
                  ) : (
                    <p className="text-[12px]" style={{ color: "rgba(245,239,230,0.5)" }}>
                      ✓ Delivered
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: result card */}
        <div className="flex flex-col p-5">
          <p
            className="text-[10px] uppercase tracking-[0.16em] mb-3"
            style={{ color: "rgba(245,239,230,0.3)", fontFamily: "var(--font-mono)" }}
          >
            {scene.result.label}
          </p>

          <AnimatePresence mode="wait">
            {phase === "result" || reduced ? (
              <motion.div
                key={`result-${sceneIdx}`}
                initial={reduced ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex-1 relative"
              >
                <pre
                  className="text-[12px] leading-[1.7] whitespace-pre-wrap break-words"
                  style={{
                    fontFamily: scene.result.mono ? "var(--font-mono)" : "inherit",
                    color: "rgba(245,239,230,0.82)",
                  }}
                >
                  {reduced ? scene.result.body : visibleResult}
                  {!reduced && typed < resultLen && (
                    <span
                      className="inline-block w-[2px] h-[14px] ml-px align-middle animate-pulse"
                      style={{ background: scene.accent }}
                      aria-hidden
                    />
                  )}
                </pre>
              </motion.div>
            ) : (
              <motion.div
                key={`waiting-${sceneIdx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center"
              >
                <p className="text-[12px]" style={{ color: "rgba(245,239,230,0.25)" }}>
                  Waiting for {scene.specialist}…
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Footer status bar ──────────────────────────────── */}
      <div
        className="relative flex items-center gap-4 px-5 py-2.5 border-t"
        style={{
          borderColor: "rgba(255,255,255,0.05)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <span
          className="text-[10px] tracking-[0.12em] uppercase"
          style={{ color: "rgba(245,239,230,0.25)", fontFamily: "var(--font-mono)" }}
        >
          Praxis Flow
        </span>
        <span
          className="h-3 w-px"
          style={{ background: "rgba(255,255,255,0.1)" }}
          aria-hidden
        />
        <span
          className="text-[10px] tracking-[0.12em] uppercase"
          style={{ color: scene.accent + "99", fontFamily: "var(--font-mono)" }}
        >
          {phase === "query" ? "Reading…" : phase === "thinking" ? "Routing to specialist…" : "Delivered ✓"}
        </span>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 h-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full animate-bounce"
          style={{
            background: "rgba(245,239,230,0.4)",
            animationDelay: `${i * 150}ms`,
            animationDuration: "900ms",
          }}
        />
      ))}
    </span>
  );
}

// ─── Cinematic (main export) ─────────────────────────────────────────────────

const CAPTIONS = [
  "→ marketing room: campaign drafted live",
  "→ engineering bay: build deploying",
  "→ boardroom: roundtable in session",
];

export default function Cinematic() {
  return (
    <section className="relative conduit-bg-canvas overflow-hidden border-y border-[var(--color-edge-subtle)]">
      {/* Top gradient line */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 1.6, ease: EASE }}
        className="origin-left absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(91, 99, 232,0.6), transparent)",
        }}
        aria-hidden
      />

      <div className="relative conduit-container py-24 md:py-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="text-center max-w-[820px] mx-auto mb-12 md:mb-16"
        >
          <p className="conduit-caption conduit-caption-ember">
            Praxis Console · Live now
          </p>
          <h2 className="conduit-display-2xl mt-6">
            Walk into a company you don&rsquo;t have to staff.
          </h2>
          <p className="conduit-body-lg mt-6 max-w-[600px] mx-auto">
            Each specialist takes your request, reasons through it, and delivers
            a real artifact — drafted, built, or analyzed.
          </p>
        </motion.div>

        {/* Interactive demo panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.2, ease: EASE }}
          className="relative max-w-[1100px] mx-auto"
        >
          {/* Outer indigo aura */}
          <div
            aria-hidden
            className="absolute -inset-16 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(91, 99, 232,0.18) 0%, transparent 65%)",
              filter: "blur(40px)",
            }}
          />

          <CinematicDemo />
        </motion.div>

        {/* Mono captions */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.12, delayChildren: 0.4 },
            },
          }}
          className="mt-14 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 max-w-[1100px] mx-auto"
        >
          {CAPTIONS.map((c) => (
            <motion.div
              key={c}
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: EASE },
                },
              }}
              className="text-[13px] md:text-[14px] text-[var(--color-cream-soft)] tracking-[-0.005em] py-3 px-4 border-l border-[var(--color-edge)] bg-[var(--color-ink-surface)]/40"
              style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}
            >
              {c}
            </motion.div>
          ))}
        </motion.div>

        {/* Tertiary CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.8 }}
          className="text-center mt-12"
        >
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center gap-2 text-[14px] text-[var(--color-indigo-500)] hover:gap-3 transition-[gap]"
          >
            Open Praxis free
            <ArrowRight size={14} weight="bold" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
