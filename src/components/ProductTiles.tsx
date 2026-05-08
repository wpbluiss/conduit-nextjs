"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";

const EASE = [0.25, 1, 0.5, 1] as const;

type Status = "live" | "beta" | "soon";

type Card = {
  title: string;
  status: Status;
  tagline: string;
  body: string;
  cta: { label: string; href: string };
  Mark: () => React.ReactElement;
};

function ConsoleMark() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden fill="none">
      <rect
        x="6"
        y="12"
        width="52"
        height="36"
        rx="4"
        stroke="#D67817"
        strokeWidth="1.5"
      />
      <line
        x1="6"
        y1="22"
        x2="58"
        y2="22"
        stroke="#D67817"
        strokeWidth="1"
        opacity="0.55"
      />
      <circle cx="11" cy="17" r="1.2" fill="#D67817" />
      <circle cx="15" cy="17" r="1.2" fill="#D67817" opacity="0.6" />
      <circle cx="19" cy="17" r="1.2" fill="#D67817" opacity="0.4" />
      <line
        x1="14"
        y1="30"
        x2="32"
        y2="30"
        stroke="#D67817"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.45"
      />
      <line
        x1="14"
        y1="34"
        x2="24"
        y2="34"
        stroke="#D67817"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.45"
      />
      <line
        x1="34"
        y1="40"
        x2="50"
        y2="40"
        stroke="#D67817"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <line
        x1="38"
        y1="44"
        x2="50"
        y2="44"
        stroke="#D67817"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <line
        x1="22"
        y1="56"
        x2="42"
        y2="56"
        stroke="#D67817"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MobileMark() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden fill="none">
      <rect
        x="20"
        y="6"
        width="24"
        height="48"
        rx="4"
        stroke="#D67817"
        strokeWidth="1.5"
      />
      <line
        x1="26"
        y1="50"
        x2="38"
        y2="50"
        stroke="#D67817"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="32" cy="14" r="1" fill="#D67817" opacity="0.6" />
      <circle cx="32" cy="30" r="3" fill="#D67817" />
      <circle
        cx="32"
        cy="30"
        r="6"
        stroke="#D67817"
        strokeWidth="1"
        opacity="0.5"
        fill="none"
      />
      <path
        d="M 50 22 Q 56 30 50 38"
        stroke="#D67817"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
        fill="none"
      />
      <path
        d="M 14 22 Q 8 30 14 38"
        stroke="#D67817"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
        fill="none"
      />
      <path
        d="M 56 18 Q 62 30 56 42"
        stroke="#D67817"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
        fill="none"
      />
      <path
        d="M 8 18 Q 2 30 8 42"
        stroke="#D67817"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
        fill="none"
      />
    </svg>
  );
}

function HqMark() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden fill="none">
      <path
        d="M 8 56 L 8 24 L 32 12 L 56 24 L 56 56 Z"
        stroke="#D67817"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line
        x1="8"
        y1="24"
        x2="56"
        y2="24"
        stroke="#D67817"
        strokeWidth="1"
        opacity="0.5"
      />
      <line
        x1="32"
        y1="12"
        x2="32"
        y2="56"
        stroke="#D67817"
        strokeWidth="1"
        opacity="0.5"
      />
      <line
        x1="8"
        y1="40"
        x2="56"
        y2="40"
        stroke="#D67817"
        strokeWidth="1"
        opacity="0.5"
      />
      <rect x="14" y="29" width="5" height="5" fill="#D67817" opacity="0.85" />
      <rect x="22" y="29" width="5" height="5" fill="#D67817" opacity="0.4" />
      <rect x="37" y="29" width="5" height="5" fill="#D67817" opacity="0.85" />
      <rect x="45" y="29" width="5" height="5" fill="#D67817" opacity="0.4" />
      <rect x="14" y="46" width="5" height="5" fill="#D67817" opacity="0.4" />
      <rect x="22" y="46" width="5" height="5" fill="#D67817" opacity="0.85" />
      <rect x="37" y="46" width="5" height="5" fill="#D67817" opacity="0.4" />
      <rect x="45" y="46" width="5" height="5" fill="#D67817" opacity="0.85" />
    </svg>
  );
}

const CARDS: Card[] = [
  {
    title: "Praxis Console",
    status: "live",
    tagline: "Your AI workforce, in one place.",
    body: "Talk to Atlas, the Chief of Staff who actually remembers what you said three weeks ago — or hand the turn to one of nine specialists. Voice mode, real lead pipelines, real builds. Ships work today.",
    cta: { label: "Open the Console", href: "/auth/sign-up" },
    Mark: ConsoleMark,
  },
  {
    title: "Praxis Mobile",
    status: "beta",
    tagline: "Praxis in your pocket.",
    body: "Native iOS and Android. Voice-first conversations with your team between meetings. Push notifications when Atlas needs a decision or a lead heats up. TestFlight invites going out this week.",
    cta: { label: "Join the waitlist", href: "/products/praxis-mobile" },
    Mark: MobileMark,
  },
  {
    title: "Praxis HQ",
    status: "soon",
    tagline: "Walk through your AI headquarters.",
    body: "A 3D office where each employee has a desk, a presence, a voice. Step into the marketing room, watch a campaign drafted in real time, then walk to engineering to spin up a build. Cinematic spatial collaboration.",
    cta: { label: "Early access", href: "/products/praxis-hq" },
    Mark: HqMark,
  },
];

function StatusBadge({ status }: { status: Status }) {
  const text =
    status === "live" ? "Live" : status === "beta" ? "Beta · TestFlight" : "Q3 2026";
  const klass =
    status === "live"
      ? "conduit-badge-live"
      : status === "beta"
        ? "conduit-badge-beta"
        : "conduit-badge-soon";
  return (
    <span className={`conduit-badge ${klass}`}>
      {status === "live" ? <span className="conduit-badge-dot" /> : null}
      {text}
    </span>
  );
}

export default function ProductTiles() {
  return (
    <section
      id="products"
      className="relative conduit-section conduit-bg-canvas"
    >
      <div className="conduit-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="max-w-[640px] mb-14 md:mb-20"
        >
          <p className="conduit-caption conduit-caption-ember">Praxis</p>
          <h2 className="conduit-display-2xl mt-5">
            Three surfaces. <span className="conduit-ember-text">One workforce.</span>
          </h2>
          <p className="conduit-body-lg mt-5 max-w-[560px]">
            The Praxis product family runs on the same brain. Pick the surface
            that fits your moment.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CARDS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}
            >
              <Link
                href={c.cta.href}
                className="conduit-card group block p-7 md:p-8 h-full min-h-[480px] flex flex-col"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-[var(--color-ink-surface-elevated)] border border-[var(--color-edge-subtle)] group-hover:border-[rgba(214,120,23,0.35)] transition-colors">
                    <c.Mark />
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                <h3
                  className="text-[28px] md:text-[32px] leading-[1.05] tracking-[-0.02em] text-[var(--color-cream)]"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  {c.title}
                </h3>
                <p className="text-[16px] mt-2 text-[var(--color-ember-300)] tracking-[-0.005em]">
                  {c.tagline}
                </p>
                <p className="conduit-body-md mt-5 flex-1 leading-[1.6]">
                  {c.body}
                </p>
                <div className="mt-7 inline-flex items-center gap-1.5 text-[14px] text-[var(--color-ember-500)] font-medium group-hover:gap-2.5 transition-[gap]">
                  {c.cta.label}
                  <ArrowRight size={14} weight="bold" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
