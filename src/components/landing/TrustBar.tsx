"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;

const CUSTOMERS = [
  {
    name: "Lunaro",
    sector: "Insurance",
    use: "Sales specialist closing 40% more warm leads",
    mark: "LU",
  },
  {
    name: "Meridian",
    sector: "SaaS",
    use: "Engineering specialist shipping weekly product updates",
    mark: "MD",
  },
  {
    name: "Apex",
    sector: "Commerce",
    use: "Marketing specialist producing 20+ content pieces/month",
    mark: "AX",
  },
  {
    name: "Clarity",
    sector: "Media",
    use: "Voice specialist qualifying inbound inquiries 24/7",
    mark: "CL",
  },
  {
    name: "Beacon",
    sector: "Analytics",
    use: "Ops specialist running weekly reporting on autopilot",
    mark: "BC",
  },
  {
    name: "Orbit",
    sector: "Platform",
    use: "Finance specialist preparing board reports on demand",
    mark: "OR",
  },
] as const;

function CompanyMark({ mark }: { mark: string }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      aria-hidden
      fill="none"
      className="shrink-0"
    >
      <rect
        width="40"
        height="40"
        rx="10"
        fill="var(--color-bg-surface-subtle)"
        stroke="var(--color-edge-subtle)"
        strokeWidth="1"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        fontFamily="var(--font-sans, system-ui)"
        fill="var(--color-ink-secondary)"
      >
        {mark}
      </text>
    </svg>
  );
}

export default function TrustBar() {
  const reduced = useReducedMotion();

  return (
    <motion.section
      aria-label="Founders already running on Praxis"
      initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{ duration: reduced ? 0 : 0.65, ease: EASE }}
      className="conduit-bg-canvas border-b border-[var(--color-edge-subtle)]"
    >
      <div className="conduit-container py-10 md:py-12">
        <p
          className="text-center text-[11px] uppercase tracking-[0.1em] font-semibold mb-8"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          Founders already running on Praxis
        </p>

        {/* Horizontal scroll on mobile, centred row on md+ */}
        <div
          className="flex gap-4 overflow-x-auto pb-2 md:overflow-x-visible md:pb-0 md:justify-center [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {CUSTOMERS.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-5%" }}
              transition={{
                duration: reduced ? 0 : 0.55,
                ease: EASE,
                delay: reduced ? 0 : i * 0.07,
              }}
              className="flex flex-col items-center gap-2.5 shrink-0 w-[136px] md:w-[148px]"
            >
              <CompanyMark mark={c.mark} />

              <div className="text-center">
                <p
                  className="text-[13px] font-semibold leading-none"
                  style={{ color: "var(--color-ink-primary)" }}
                >
                  {c.name}
                </p>
                <p
                  className="text-[11px] mt-1"
                  style={{ color: "var(--color-ink-tertiary)" }}
                >
                  {c.sector}
                </p>
              </div>

              <p
                className="text-center text-[11px] leading-[1.45]"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                {c.use}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
