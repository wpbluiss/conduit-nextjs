"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";

const EASE = [0.25, 1, 0.5, 1] as const;
const STEP = 0.08;

export default function Hero() {
  // Stable dust-mote positions (deterministic per seed)
  const dust = Array.from({ length: 14 }, (_, i) => {
    const seed = i * 137;
    return {
      id: i,
      left: `${(seed * 7) % 100}%`,
      top: `${(seed * 11) % 100}%`,
      delay: (i * 0.83) % 12,
      size: 1 + (i % 3) * 0.5,
      duration: 10 + (i % 5) * 2,
    };
  });

  return (
    <section
      id="top"
      className="relative overflow-hidden conduit-bg-canvas min-h-[100vh] pt-32 md:pt-44 pb-24"
    >
      <div className="conduit-mesh" aria-hidden />
      <div className="conduit-ember-radial" aria-hidden />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        {dust.map((d) => (
          <span
            key={d.id}
            className="conduit-dust"
            style={{
              left: d.left,
              top: d.top,
              width: `${d.size}px`,
              height: `${d.size}px`,
              animationDelay: `${d.delay}s`,
              animationDuration: `${d.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="relative conduit-container">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-12 lg:gap-20 items-center">
          {/* Left — text */}
          <div className="max-w-[640px]">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: STEP * 0 }}
              className="conduit-caption conduit-caption-ember"
            >
              Praxis · Operating system for AI workforces
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, ease: EASE, delay: STEP * 1 }}
              className="conduit-display-hero mt-6"
            >
              Stop hiring.
              <br />
              <span className="conduit-ember-text">Start deploying.</span>
            </motion.h1>
            {/*
              Option A — kept for A/B reference:
              The company that hires zero
              <br />
              <span className="conduit-ember-text">and ships everything.</span>
            */}

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: STEP * 2 }}
              className="conduit-body-lg mt-7 max-w-[560px]"
            >
              Conduit builds Praxis — the operating system for autonomous AI
              workforces. Voice, sales, engineering, ops, finance. Running 24/7
              for the businesses that hire them.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: STEP * 3 }}
              className="flex flex-col sm:flex-row gap-3 mt-8"
            >
              <Link href="/auth/sign-up" className="conduit-btn-primary">
                Open Praxis Console
                <ArrowRight size={16} weight="bold" />
              </Link>
              <Link href="/products" className="conduit-btn-secondary">
                See the product family
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: EASE, delay: STEP * 5 }}
              className="mt-14 md:mt-16 flex items-center gap-5 flex-wrap"
            >
              <span className="conduit-caption text-[var(--color-cream-mute)] mr-1">
                Already running on Praxis
              </span>
              <LunaroMark />
              <CustomerSlot label="Slot 02" />
              <CustomerSlot label="Slot 03" />
            </motion.div>
          </div>

          {/* Right — Console preview */}
          <motion.div
            initial={{ opacity: 0, x: 32, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: EASE, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <ConsolePreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function LunaroMark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="22" height="22" viewBox="0 0 16 16" aria-hidden>
        <circle cx="8" cy="8" r="6.2" fill="#7C5BFF" />
        <circle cx="11" cy="6" r="5" fill="#0A0908" />
      </svg>
      <span
        className="text-[14px] tracking-tight text-[var(--color-cream)]"
        style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
      >
        Lunaro Insurance
      </span>
    </div>
  );
}

function CustomerSlot({ label }: { label: string }) {
  return (
    <div className="px-3 py-1.5 border border-dashed border-[var(--color-edge)] rounded-md text-[11px] tracking-wider uppercase text-[var(--color-cream-faint)]">
      {label}
    </div>
  );
}

function ConsolePreview() {
  const team = [
    { name: "Atlas", color: "#C8C5BD", active: true },
    { name: "Marketing", color: "#FF8A3D" },
    { name: "Sales", color: "#34D399" },
    { name: "Engineering", color: "#60A5FA" },
    { name: "Finance", color: "#EAB308" },
    { name: "HR", color: "#EC4899" },
    { name: "Ops", color: "#14B8A6" },
  ];

  return (
    <div className="relative conduit-inverse rounded-2xl">
      <div
        aria-hidden
        className="absolute -inset-12 rounded-[40px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(91, 99, 232, 0.22) 0%, transparent 65%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="relative bg-[var(--color-ink-surface)] border border-[var(--color-edge)] rounded-2xl overflow-hidden"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgba(91, 99, 232, 0.14), 0 0 60px rgba(91, 99, 232, 0.20), 0 24px 64px rgba(15, 17, 21, 0.20)",
        }}
      >
        {/* Window chrome */}
        <div className="px-4 py-3 border-b border-[var(--color-edge-subtle)] flex items-center gap-3 bg-[var(--color-ink-surface-elevated)]">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6058]/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28C940]/60" />
          </div>
          <span
            className="text-[11px] text-[var(--color-cream-mute)] truncate"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            conduitai.io/app/workspace
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--color-conduit-success)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-conduit-success)] shadow-[0_0_6px_currentColor]" />
            Live
          </span>
        </div>

        {/* Body */}
        <div className="flex h-[460px]">
          {/* Sidebar */}
          <div className="w-[148px] border-r border-[var(--color-edge-subtle)] bg-[var(--color-ink-surface)] py-4 px-2.5">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-cream-mute)] mb-2.5 px-2 font-semibold">
              Team
            </p>
            <div className="space-y-0.5">
              {team.map((e) => (
                <div
                  key={e.name}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px]"
                  style={{
                    background: e.active
                      ? "rgba(91, 99, 232,0.07)"
                      : "transparent",
                    color: e.active
                      ? "var(--color-cream)"
                      : "var(--color-cream-soft)",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      background: e.color,
                      boxShadow: e.active ? `0 0 6px ${e.color}` : "none",
                    }}
                  />
                  {e.name}
                </div>
              ))}
            </div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-cream-mute)] mt-5 mb-2 px-2 font-semibold">
              Recent
            </p>
            <div className="space-y-1.5 px-2">
              {[
                "Q2 marketing plan",
                "Pipeline review",
                "Build: lunaro-v3",
              ].map((t) => (
                <p
                  key={t}
                  className="text-[11px] text-[var(--color-cream-mute)] truncate"
                >
                  {t}
                </p>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col bg-[var(--color-ink-canvas)]">
            <div className="flex-1 px-5 py-4 overflow-hidden space-y-4">
              <div className="flex justify-end">
                <div
                  className="max-w-[78%] px-3.5 py-2 text-[13px] text-[var(--color-cream)]"
                  style={{
                    background: "rgba(91, 99, 232, 0.12)",
                    border: "1px solid rgba(91, 99, 232, 0.28)",
                    borderRadius: "16px 16px 4px 16px",
                  }}
                >
                  Status check across the team.
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "#C8C5BD" }}
                  />
                  <span className="text-[10px] uppercase tracking-wider text-[var(--color-cream-mute)]">
                    Atlas · Chief of Staff
                  </span>
                </div>
                <div
                  className="text-[13px] text-[var(--color-cream)] px-3.5 py-2.5 max-w-[88%] leading-[1.6]"
                  style={{
                    background: "var(--color-ink-surface-elevated)",
                    borderLeft: "2px solid #C8C5BD",
                    borderRadius: "0 16px 16px 16px",
                  }}
                >
                  Here&apos;s where everyone is right now —
                  <br />
                  <span className="text-[var(--color-cream-soft)]">
                    Marketing has three drafts staged. Sales pipeline is up 12%
                    week-over-week. Engineering is mid-build on lunaro-v3,
                    deploy ETA seven minutes.
                  </span>
                </div>
              </div>

              <div
                className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[var(--color-cream-mute)] py-1.5 px-3 rounded-md w-fit"
                style={{
                  background: "rgba(96, 165, 250, 0.05)",
                  border: "1px solid rgba(96, 165, 250, 0.15)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#60A5FA" }}
                />
                Engineering is taking this from here
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[var(--color-edge-subtle)] bg-[var(--color-ink-surface)]">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full border bg-[var(--color-ink-canvas)]"
                style={{ borderColor: "var(--color-edge)" }}
              >
                <span className="text-[12px] text-[var(--color-cream-mute)] flex-1">
                  Talk to your team…
                </span>
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "var(--color-indigo-500)" }}
                >
                  <ArrowRight size={12} weight="bold" color="#0A0908" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
