"use client";

import { motion } from "framer-motion";
import { ALL_EMPLOYEES } from "@/lib/conduit/employees";
import { EMPLOYEE_ICON } from "@/components/conduit/EmployeeBadge";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.25, 1, 0.5, 1] as const;

const BIOS: Record<string, string> = {
  jarvis:
    "Routes every request to the right specialist and stays in the loop to coordinate hand-offs and close gaps. One message reaches your whole team — Atlas is the connective tissue.",
  marketing:
    "Writes blog posts, social captions, ad copy, and launch announcements in your brand's voice. Tell Marketing the goal; it handles the brief, the draft, and the publish.",
  sales:
    "Builds cold-outreach sequences, researches prospects, and drafts follow-up emails that convert. Hand Sales a list of leads and a product one-pager; it comes back with a working campaign.",
  engineering:
    "Takes a ticket or a Figma link and turns it into working code with a PR, build logs, and a deploy preview. Engineering is the only specialist that ships files directly to your repo.",
  finance:
    "Models your P&L, projects cash flow, calculates commissions, and flags anomalies in real time. Give Finance your numbers and get back a clear picture of where your business stands.",
  compliance:
    "Maps relevant regulations to your industry, flags exposure, and drafts internal policies that satisfy auditors. Compliance watches the rulebook so you never have to read it yourself.",
  hr:
    "Writes job descriptions, offer letters, and employee handbooks that match your culture and jurisdiction. When someone is joining or leaving, HR handles the paperwork trail end-to-end.",
  ops:
    "Turns vague processes into documented SOPs, schedules recurring tasks, and coordinates internal logistics. Operations keeps the machine running so your team is never blocked waiting on each other.",
  legal:
    "First-drafts NDAs, contractor agreements, and basic licensing terms ready for attorney review. Legal removes the blank-page problem from every contract negotiation.",
};

const CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const CARD_ITEM = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.65, ease: EASE } },
};

export default function SpecialistShowcase() {
  const reduced = useReducedMotion();

  return (
    <section
      id="meet-the-team"
      className="conduit-section conduit-bg-inverse relative overflow-hidden border-t border-[var(--color-border-on-inverse)]"
    >
      <div className="conduit-mesh-inverse" aria-hidden />

      <div className="relative conduit-container">
        {/* Section header */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-12%" }}
          transition={{ duration: 0.85, ease: EASE }}
          className="text-center mb-14 md:mb-18"
        >
          <p className="conduit-caption conduit-caption-ember">
            Nine specialists. Zero payroll.
          </p>
          <h2 className="conduit-display-2xl mt-5">
            Meet your{" "}
            <span className="conduit-text-gradient-inverse">team.</span>
          </h2>
          <p className="conduit-body-lg mt-5 max-w-[520px] mx-auto">
            Each specialist runs autonomously, hands off seamlessly, and shares
            one unified memory of your business.
          </p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          initial={reduced ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, margin: "-5%" }}
          variants={reduced ? undefined : CONTAINER}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {ALL_EMPLOYEES.map((emp) => {
            const Icon = EMPLOYEE_ICON[emp.id];
            const bio = BIOS[emp.id] ?? emp.tagline;
            return (
              <motion.div
                key={emp.id}
                variants={reduced ? undefined : CARD_ITEM}
              >
                <SpecialistCard
                  icon={<Icon size={20} strokeWidth={1.75} />}
                  name={emp.name}
                  role={emp.role}
                  bio={bio}
                  color={emp.color}
                  colorSoft={emp.colorSoft}
                  reduced={reduced}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function SpecialistCard({
  icon,
  name,
  role,
  bio,
  color,
  colorSoft,
  reduced,
}: {
  icon: React.ReactNode;
  name: string;
  role: string;
  bio: string;
  color: string;
  colorSoft: string;
  reduced: boolean;
}) {
  return (
    <motion.div
      className="conduit-card-inverse relative overflow-hidden h-full p-5 flex flex-col gap-3 cursor-default"
      whileHover={
        reduced
          ? {}
          : {
              y: -4,
              boxShadow: `0 0 0 1px ${color}40, 0 8px 28px ${color}26, 0 16px 48px rgba(0,0,0,0.35)`,
              borderColor: `${color}55`,
            }
      }
      transition={{ duration: 0.22, ease: EASE }}
    >
      {/* Per-dept corner radial accent */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 90% 70% at 0% 0%, ${color}12 0%, transparent 65%)`,
        }}
      />

      {/* Icon + name/role row */}
      <div className="relative flex items-center gap-3">
        <div
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: colorSoft, color }}
        >
          {icon}
        </div>
        <div>
          <div
            className="text-[15px] font-semibold leading-[1.2] text-[var(--color-ink-on-inverse)]"
          >
            {name}
          </div>
          <div
            className="text-[11px] uppercase tracking-[0.12em] mt-0.5 font-medium"
            style={{ color }}
          >
            {role}
          </div>
        </div>
      </div>

      {/* Bio */}
      <p className="relative text-[13px] text-[var(--color-ink-on-inverse-soft)] leading-[1.65] flex-1">
        {bio}
      </p>
    </motion.div>
  );
}
