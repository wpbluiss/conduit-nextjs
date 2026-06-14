"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "Praxis wrote our entire go-to-market playbook in a single sitting — copy, channel strategy, competitor map, the lot. I couldn't have shipped the product without it.",
    name: "Sarah M.",
    role: "Co-founder & CEO",
    company: "B2B SaaS startup",
    initial: "S",
  },
  {
    quote:
      "The engineering specialist caught a race condition in our webhook handler that my team missed for three sprints. It pays for itself every week.",
    name: "James T.",
    role: "CTO",
    company: "Fintech scale-up",
    initial: "J",
  },
  {
    quote:
      "I replaced a $9k/month fractional CMO with the marketing specialist. The first campaign it drafted outperformed our best human-written email by 34%.",
    name: "Priya K.",
    role: "Solo founder",
    company: "E-commerce brand",
    initial: "P",
  },
  {
    quote:
      "Our sales pipeline is 3× what it was six months ago. The sales specialist qualifies leads, drafts outreach, and follows up — all without me touching it.",
    name: "Daniel R.",
    role: "Head of Growth",
    company: "Series A startup",
    initial: "D",
  },
  {
    quote:
      "We spun up a voice specialist in an afternoon. First week, our support queue dropped 60%. Our team now handles edge cases only.",
    name: "Aiko W.",
    role: "Head of Operations",
    company: "Consumer app",
    initial: "A",
  },
  {
    quote:
      "Praxis drafts my engineering specs faster than I can review them. It's like having a senior engineer who works nights, weekends, and never misses a detail.",
    name: "Marcus B.",
    role: "Principal Engineer",
    company: "Dev-tools startup",
    initial: "M",
  },
] as const;

const INTERVAL_MS = 3000;

export default function TestimonialsCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = TESTIMONIALS.length;

  const advance = useCallback(
    (dir: 1 | -1) => {
      setActive((prev) => (prev + dir + total) % total);
    },
    [total],
  );

  // Auto-advance every 3 s unless hovered or user-paused.
  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(() => advance(1), INTERVAL_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, paused, advance]);

  return (
    <section
      id="testimonials"
      className="relative conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)] overflow-hidden"
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(91,99,232,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative conduit-container">
        {/* Heading */}
        <div className="text-center mb-12">
          <p className="conduit-caption conduit-caption-indigo mb-4">
            Social proof
          </p>
          <h2 className="conduit-display-xl">
            What founders are{" "}
            <span className="conduit-ember-text">saying</span>
          </h2>
        </div>

        {/* Carousel */}
        <div
          className="relative max-w-4xl mx-auto"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Slide track */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
              style={{ transform: `translateX(-${active * 100}%)` }}
              aria-live="polite"
              aria-atomic="true"
            >
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={t.name}
                  className="min-w-full px-2"
                  aria-hidden={i !== active}
                >
                  <div className="conduit-card p-8 md:p-10 flex flex-col gap-6">
                    {/* Quote mark */}
                    <svg
                      width="32"
                      height="24"
                      viewBox="0 0 32 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M0 24V14.4C0 6.4 4.267 1.6 12.8 0l1.6 2.4C9.6 3.6 7.2 6.133 7.2 10v.8H14V24H0Zm18 0V14.4C18 6.4 22.267 1.6 30.8 0l1.2 2.4C27.2 3.6 24.8 6.133 24.8 10v.8H32V24H18Z"
                        fill="currentColor"
                        className="text-[var(--color-accent)] opacity-40"
                      />
                    </svg>

                    <p className="conduit-body-md leading-relaxed text-[var(--color-cream)] text-lg md:text-xl">
                      &ldquo;{t.quote}&rdquo;
                    </p>

                    <div className="flex items-center gap-3 border-t border-[var(--color-edge-subtle)] pt-6">
                      {/* Avatar initial */}
                      <span
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold shrink-0"
                        style={{
                          background:
                            "color-mix(in srgb, var(--color-accent) 18%, var(--color-surface-elevated))",
                          color: "var(--color-accent)",
                          boxShadow:
                            "inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 30%, transparent)",
                        }}
                      >
                        {t.initial}
                      </span>
                      <div>
                        <span className="block text-sm font-medium text-[var(--color-cream)]">
                          {t.name}
                        </span>
                        <span className="block text-xs text-[var(--color-cream-mute)] mt-0.5">
                          {t.role} · {t.company}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prev / Next arrows */}
          <button
            type="button"
            onClick={() => advance(-1)}
            aria-label="Previous testimonial"
            className="absolute -left-4 md:-left-8 top-1/2 -translate-y-1/2 p-2 rounded-full text-[var(--color-cream-mute)] hover:text-[var(--color-cream)] bg-[var(--color-surface-elevated)] border border-[var(--color-edge-subtle)] hover:border-[var(--color-accent)] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => advance(1)}
            aria-label="Next testimonial"
            className="absolute -right-4 md:-right-8 top-1/2 -translate-y-1/2 p-2 rounded-full text-[var(--color-cream-mute)] hover:text-[var(--color-cream)] bg-[var(--color-surface-elevated)] border border-[var(--color-edge-subtle)] hover:border-[var(--color-accent)] transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Dot indicators */}
        <div
          className="flex items-center justify-center gap-2 mt-8"
          role="tablist"
          aria-label="Testimonial indicators"
        >
          {TESTIMONIALS.map((t, i) => (
            <button
              key={t.name}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Go to testimonial ${i + 1}`}
              onClick={() => setActive(i)}
              className={`rounded-full transition-all duration-300 ${
                i === active
                  ? "w-6 h-2 bg-[var(--color-accent)]"
                  : "w-2 h-2 bg-[var(--color-edge-subtle)] hover:bg-[var(--color-cream-mute)]"
              }`}
            />
          ))}
        </div>

        {/* Honesty note */}
        <p className="text-center text-[12px] text-[var(--color-cream-mute)] mt-8 opacity-60">
          Illustrative outcomes — real testimonials coming soon.
        </p>
      </div>
    </section>
  );
}
