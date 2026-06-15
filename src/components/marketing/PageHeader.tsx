/**
 * PageHeader — shared institutional hero header for deep pages.
 * Used by /engineering, /changelog, /trust, /careers.
 */

"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

const EASE = [0.25, 1, 0.5, 1] as const;

const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};
const ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE } },
};

export function PageHeader({
  caption,
  title,
  subtitle,
  children,
}: {
  caption: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden conduit-hero-section">
      <div className="conduit-mesh" aria-hidden />
      <div className="conduit-indigo-radial" aria-hidden />
      <div className="relative conduit-container">
        <motion.div
          initial="hidden"
          animate="show"
          variants={CONTAINER}
          className="max-w-[820px]"
        >
          <motion.p variants={ITEM} className="conduit-caption conduit-caption-ember">
            {caption}
          </motion.p>
          <motion.h1 variants={ITEM} className="conduit-display-hero mt-6">
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p variants={ITEM} className="conduit-body-lg mt-6 max-w-[640px]">
              {subtitle}
            </motion.p>
          )}
          {children && (
            <motion.div variants={ITEM} className="mt-10">
              {children}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
