"use client";

import { motion } from "framer-motion";
import { ALL_EMPLOYEES } from "@/lib/conduit/employees";
import type { EmployeeId } from "@/lib/conduit/employees";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;

// Second sentence for each specialist card — first sentence comes from employee.tagline
const BIOS: Record<EmployeeId, string> = {
  jarvis:
    "Routes every task to the right specialist and surfaces the executive summary you need, when you need it.",
  marketing:
    "From blog posts to ad scripts to brand decks — written, designed, and ready to publish.",
  sales:
    "Writes outreach sequences, qualifies leads, and keeps your pipeline moving around the clock.",
  engineering:
    "Ships real, production-ready code to GitHub — from a one-line brief to a merged PR.",
  finance:
    "Turns your numbers into a clear picture of runway, risk, and what to do next.",
  compliance:
    "Gives you licensing, privacy, and risk guidance so you can move fast without unpleasant surprises.",
  hr:
    "Keeps your people systems structured while you stay focused on building the team.",
  ops:
    "Documents how your business works so anyone can pick it up and nothing falls through the cracks.",
  legal:
    "From client agreements to BAAs — with a note to loop in your attorney when stakes are high.",
};

export default function SpecialistShowcase() {
  const reduced = useReducedMotion();

  return (
    <section
      id="specialist-team"
      className="relative conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)] overflow-hidden"
    >
      {/* Subtle top-center glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 30% at 50% 0%, rgba(91,99,232,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative conduit-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: reduced ? 0 : 0.7, ease: EASE }}
          className="text-center mb-14"
        >
          <p className="conduit-caption conduit-caption-indigo">Meet your team</p>
          <h2 className="conduit-display-xl mt-4">
            Nine specialists.{" "}
            <span className="conduit-ember-text">Zero payroll.</span>
          </h2>
          <p
            className="conduit-body-lg mt-5 max-w-xl mx-auto"
            style={{ color: "var(--color-cream-mute, #a99fc7)" }}
          >
            Every Praxis account ships with a full specialist team — on day one,
            for a flat monthly rate.
          </p>
        </motion.div>

        {/* 9-card grid */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-8%" }}
          variants={{
            hidden: {},
            show: {
              transition: reduced ? {} : { staggerChildren: 0.06 },
            },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {ALL_EMPLOYEES.map((emp, idx) => (
            <motion.div
              key={emp.id}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: reduced ? 0 : 0.6, ease: EASE },
                },
              }}
              whileHover={
                reduced
                  ? {}
                  : { y: -4, transition: { duration: 0.2, ease: "easeOut" } }
              }
              className={`conduit-card p-6 flex flex-col gap-4 cursor-default ${
                idx === 0 ? "sm:col-span-2 lg:col-span-1" : ""
              }`}
              style={
                idx === 0
                  ? {
                      borderColor: "rgba(91,99,232,0.25)",
                      background:
                        "linear-gradient(135deg, rgba(91,99,232,0.05) 0%, transparent 60%)",
                    }
                  : undefined
              }
            >
              {/* Avatar circle */}
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-semibold shrink-0"
                  style={{
                    background: emp.colorSoft,
                    color: emp.color,
                  }}
                >
                  {emp.initial}
                </div>
                <div className="pt-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[15px] font-semibold leading-tight"
                      style={{ color: emp.color }}
                    >
                      {emp.name}
                    </span>
                    {idx === 0 && (
                      <span
                        className="text-[10px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          background: "rgba(91,99,232,0.15)",
                          color: "var(--color-indigo-300, #a8affb)",
                        }}
                      >
                        Chief of Staff
                      </span>
                    )}
                  </div>
                  <span
                    className="block text-[12px] mt-0.5"
                    style={{ color: "var(--color-cream-mute, #a99fc7)" }}
                  >
                    {emp.role}
                  </span>
                </div>
              </div>

              {/* Bio */}
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: "var(--color-cream-mute, #a99fc7)" }}
              >
                {emp.tagline} {BIOS[emp.id]}
              </p>

              {/* Dept color accent bar */}
              <div
                className="mt-auto h-0.5 rounded-full w-8"
                style={{ background: emp.color, opacity: 0.5 }}
                aria-hidden
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
