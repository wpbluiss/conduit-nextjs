"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.25, 1, 0.5, 1] as const;

type Section = {
  n: string;
  title: string;
  body: string[];
  quote?: string;
};

const SECTION_CONTAINER = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function ApproachSections({
  sections,
}: {
  sections: Section[];
}) {
  const reduced = useReducedMotion();

  return (
    <>
      {sections.map((s, i) => (
        <motion.section
          key={s.n}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-12%" }}
          variants={SECTION_CONTAINER}
          className={`${i > 0 ? "pt-16 md:pt-20 mt-16 md:mt-20" : ""}`}
        >
          {i > 0 && (
            <div
              aria-hidden
              className="h-px mb-16 md:mb-20"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(91, 99, 232,0.4), transparent)",
              }}
            />
          )}

          <div className="flex items-baseline gap-5 mb-6">
            <motion.span
              variants={{
                hidden: { opacity: 0, x: reduced ? 0 : -12 },
                show: {
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.8, ease: EASE },
                },
              }}
              className="text-[44px] md:text-[56px] tracking-[-0.04em] text-[var(--color-indigo-500)] leading-[0.85]"
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 500,
              }}
            >
              {s.n}
            </motion.span>
            <motion.h2
              variants={{
                hidden: { opacity: 0, y: reduced ? 0 : 16 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.9, ease: EASE },
                },
              }}
              className="conduit-display-xl"
            >
              {s.title}
            </motion.h2>
          </div>

          <div className="space-y-6 text-[18px] md:text-[19px] text-[var(--color-cream-soft)] leading-[1.75]">
            {s.body.map((p, pi) => (
              <motion.p
                key={pi}
                variants={{
                  hidden: { opacity: 0, y: reduced ? 0 : 12 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.8,
                      ease: EASE,
                      delay: pi * 0.08,
                    },
                  },
                }}
              >
                {p}
              </motion.p>
            ))}
          </div>

          {s.quote && (
            <motion.blockquote
              variants={{
                hidden: { opacity: 0, x: reduced ? 0 : -8 },
                show: {
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.8, ease: EASE },
                },
              }}
              className="conduit-pullquote my-12 md:my-14"
            >
              {s.quote}
            </motion.blockquote>
          )}
        </motion.section>
      ))}
    </>
  );
}
