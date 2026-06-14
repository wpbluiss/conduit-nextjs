"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

const EASE = [0.25, 1, 0.5, 1] as const;

const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export function ScrollRevealCards({
  children,
  className,
  margin = "-8%",
}: {
  children: ReactNode;
  className?: string;
  margin?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin }}
      variants={CONTAINER}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScrollRevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={ITEM} className={className}>
      {children}
    </motion.div>
  );
}
