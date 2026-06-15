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
  hasRail,
}: {
  section: ApproachSection;
  index: number;
  reduced: boolean;
  hasRail: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  const active = inView || reduced;

  const [leadSentence, leadRest] = splitFirstSentence(section.body[0]);
  const tailParagraphs = section.body.slice(1);

  return (
    <section ref={ref} id={`approach-${section.n}`} className={index > 0 ? "mt-24 md:mt-28" : ""}>
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
              "linear-gradient(90deg, transparent, rgba(214,120,23,0.55), transparent)",
          }}
        />
      )}

      <div className="relative">
        {/* Ghost numeral — large decorative background number, editorial magazine style.
            z-index: -1 places it behind flow children within this positioned parent. */}
        <span
          aria-hidden
          className="absolute select-none pointer-events-none leading-none tabular-nums hidden sm:block"
          style={{
            top: "-0.12em",
            right: 0,
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(7rem, 14vw, 12rem)",
            fontWeight: 800,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            color: "var(--color-ink-primary)",
            opacity: 0.04,
            zIndex: -1,
          }}
        >
          {section.n}
        </span>

        {/* Section number — gutter label. Hidden on xl when rail nav is present. */}
        <motion.span
          aria-hidden
          initial={reduced ? false : { opacity: 0 }}
          animate={active ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className={`absolute top-[0.25rem] -left-14 text-[11px] tracking-[0.2em] uppercase text-[var(--color-accent)] select-none tabular-nums ${hasRail ? "hidden lg:block xl:hidden" : "hidden lg:block"}`}
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

        {/* Step 2 — lead sentence (ember, larger). Uses --color-ember-500 (#D67817)
            directly rather than --color-accent (#FF8A3D) for better contrast on the
            bone canvas and visual alignment with the pull-quote border. */}
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={active ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, ease: EASE, delay: reduced ? 0 : 0.08 }}
          className="text-xl md:text-2xl font-medium leading-[1.45] mb-6"
          style={{ color: "var(--color-ember-500)" }}
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
                hidden: { opacity: 0, y: 14 },
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
                hidden: { opacity: 0, y: 14 },
                show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
              }}
            >
              {paragraph}
            </motion.p>
          ))}
        </motion.div>

        {/* Pull-quote — slides up + fades, slight scale from 0.98 for tactile depth */}
        {section.quote && (
          <motion.blockquote
            initial={reduced ? false : { opacity: 0, y: 20, scale: 0.98 }}
            animate={
              active
                ? { opacity: 1, y: 0, scale: 1 }
                : reduced
                ? {}
                : { opacity: 0, y: 20, scale: 0.98 }
            }
            transition={{ duration: 1.0, ease: EASE, delay: 0.52 }}
            className="conduit-pullquote my-16 md:my-20"
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
  hasRail = false,
}: {
  sections: ApproachSection[];
  hasRail?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <div className={hasRail ? "max-w-[720px]" : "conduit-prose"}>
      {sections.map((s, i) => (
        <SectionBlock key={s.n} section={s} index={i} reduced={reduced} hasRail={hasRail} />
      ))}
    </div>
  );
}
