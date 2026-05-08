/**
 * ProofBar — quantified-stats row, mono numbers + caption labels.
 *
 * Cold, factual, real-company energy. Used above the Lunaro card on the
 * homepage and on /customers. Phase 4 gravity moment #3.
 */

"use client";

import { motion } from "framer-motion";

const EASE = [0.25, 1, 0.5, 1] as const;

export type ProofStat = {
  value: string;
  label: string;
};

export const PRAXIS_PRODUCTION_STATS: ProofStat[] = [
  { value: "1", label: "Vertical in production" },
  { value: "200+", label: "Contacts under management" },
  { value: "9", label: "Specialist employees" },
  { value: "24/7", label: "Uptime" },
];

export function ProofBar({
  stats = PRAXIS_PRODUCTION_STATS,
  caption = "Praxis in production",
  className = "",
}: {
  stats?: ProofStat[];
  caption?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.8, ease: EASE }}
      className={className}
    >
      {caption && (
        <p className="conduit-caption text-[var(--color-ink-tertiary)] mb-4">
          {caption}
        </p>
      )}
      <div className="conduit-proof-bar rounded-2xl overflow-hidden">
        {stats.map((s) => (
          <div key={s.label} className="conduit-proof-stat">
            <span className="conduit-proof-num">{s.value}</span>
            <span className="conduit-proof-label">{s.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
