"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;

export type ApproachSection = {
  n: string;
  title: string;
  body: string[];
  quote?: string;
};

// Split the first sentence off so it can receive lead-sentence styling
function splitFirstSentence(text: string): [string, string] {
  const m = text.match(/^(.+?[.!?])\s+([\s\S]+)$/);
  if (m) return [m[1], m[2]];
  return [text, ""];
}

function SectionBlock({
  section,
  index,
  reduced,
}: {
  section: ApproachSection;
  index: number;
  reduced: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  const active = inView || reduced;

  const [leadSentence, leadRest] = splitFirstSentence(section.body[0]);
  const tailParagraphs = section.body.slice(1);

  return (
    <section ref={ref} className={index > 0 ? "mt-24 md:mt-28" : ""}>
      {/* Divider — ember tint, draws in from left */}
      {index > 0 && (
        <motion.div
          aria-hidden
          initial={{ scaleX: 0 }}
          animate={active ? { scaleX: 1 } : {}}
          transition={{ duration: 1.4, ease: EASE }}
          className="origin-left h-px mb-24 md:mb-28"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,138,61,0.3), transparent)",
          }}
        />
      )}

      <div className="relative">
        {/* Section number — Linear-style gutter label, large screens only */}
        <motion.span
          aria-hidden
          initial={reduced ? false : { opacity: 0 }}
          animate={active ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="hidden lg:block absolute top-[0.25rem] -left-14 text-[11px] tracking-[0.2em] uppercase text-[var(--color-accent)] select-none tabular-nums"
        >
          {section.n}
        </motion.span>

        {/* Step 1 — heading */}
        <motion.h2
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={active ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.85, ease: EASE }}
          className="conduit-display-xl mb-7"
        >
          {/* Inline section number on narrow viewports */}
          <span className="lg:hidden text-[11px] tracking-[0.2em] uppercase text-[var(--color-accent)] align-middle mr-3 tabular-nums">
            {section.n}
          </span>
          {section.title}
        </motion.h2>

        {/* Step 2 — lead sentence (ember, larger) */}
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={active ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, ease: EASE, delay: reduced ? 0 : 0.08 }}
          className="text-xl md:text-2xl font-medium text-[var(--color-accent)] leading-[1.45] mb-6"
        >
          {leadSentence}
        </motion.p>

        {/* Step 3 — rest of body paragraphs, staggered */}
        <motion.div
          initial="hidden"
          animate={active ? "show" : "hidden"}
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.08,
                delayChildren: reduced ? 0 : 0.16,
              },
            },
          }}
          className="space-y-6 text-[18px] md:text-[19px] text-[var(--color-cream-soft)] leading-[1.75]"
        >
          {leadRest && (
            <motion.p
              variants={{
                hidden: { opacity: 1, y: 14 },
                show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
              }}
            >
              {leadRest}
            </motion.p>
          )}
          {tailParagraphs.map((paragraph, pi) => (
            <motion.p
              key={pi}
              variants={{
                hidden: { opacity: 1, y: 14 },
                show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
              }}
            >
              {paragraph}
            </motion.p>
          ))}
        </motion.div>

        {/* Pull-quote — slides in from left */}
        {section.quote && (
          <motion.blockquote
            initial={{ opacity: 1, x: reduced ? 0 : -16 }}
            animate={
              active ? { opacity: 1, x: 0 } : { opacity: 1, x: reduced ? 0 : -16 }
            }
            transition={{ duration: 0.9, ease: EASE, delay: 0.48 }}
            className="conduit-pullquote my-12 md:my-14"
          >
            {section.quote}
          </motion.blockquote>
        )}
      </div>
    </section>
  );
}

export function ApproachSections({
  sections,
}: {
  sections: ApproachSection[];
}) {
  const reduced = useReducedMotion();
  return (
    <div className="conduit-prose">
      {sections.map((s, i) => (
        <SectionBlock key={s.n} section={s} index={i} reduced={reduced} />
      ))}
    </div>
  );
}
