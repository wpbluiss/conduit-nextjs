"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const EASE = [0.25, 1, 0.5, 1] as const;

export type ApproachSection = {
  n: string;
  title: string;
  body: string[];
  quote?: string;
};

function SectionBlock({
  section,
  index,
}: {
  section: ApproachSection;
  index: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });

  return (
    <section
      ref={ref}
      className={index > 0 ? "pt-16 md:pt-20 mt-16 md:mt-20" : ""}
    >
      {/* Divider that draws in from left */}
      {index > 0 && (
        <motion.div
          aria-hidden
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.4, ease: EASE }}
          className="origin-left h-px mb-16 md:mb-20"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(91,99,232,0.4), transparent)",
          }}
        />
      )}

      {/* Number + heading row — staggered entrance */}
      <motion.div
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
        }}
        className="flex items-baseline gap-5 mb-6"
      >
        <motion.span
          variants={{
            hidden: { opacity: 0, y: 24 },
            show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
          }}
          className="text-[44px] md:text-[56px] tracking-[-0.04em] text-[var(--color-indigo-500)] leading-[0.85] tabular-nums select-none"
          style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
        >
          {section.n}
        </motion.span>
        <motion.h2
          variants={{
            hidden: { opacity: 0, y: 16 },
            show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE } },
          }}
          className="conduit-display-xl"
        >
          {section.title}
        </motion.h2>
      </motion.div>

      {/* Body paragraphs — each slides up in sequence */}
      <motion.div
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        variants={{
          hidden: {},
          show: {
            transition: { staggerChildren: 0.08, delayChildren: 0.22 },
          },
        }}
        className="space-y-6 text-[18px] md:text-[19px] text-[var(--color-cream-soft)] leading-[1.75]"
      >
        {section.body.map((paragraph, pi) => (
          <motion.p
            key={pi}
            variants={{
              hidden: { opacity: 0, y: 14 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.7, ease: EASE },
              },
            }}
          >
            {paragraph}
          </motion.p>
        ))}
      </motion.div>

      {/* Pull-quote — slides in from left */}
      {section.quote && (
        <motion.blockquote
          initial={{ opacity: 0, x: -16 }}
          animate={
            inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }
          }
          transition={{ duration: 0.9, ease: EASE, delay: 0.48 }}
          className="conduit-pullquote my-12 md:my-14"
        >
          {section.quote}
        </motion.blockquote>
      )}
    </section>
  );
}

export function ApproachSections({
  sections,
}: {
  sections: ApproachSection[];
}) {
  return (
    <div className="conduit-prose">
      {sections.map((s, i) => (
        <SectionBlock key={s.n} section={s} index={i} />
      ))}
    </div>
  );
}
