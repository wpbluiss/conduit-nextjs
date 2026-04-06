"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const DEPARTMENTS = [
  { name: "Engineering", agents: 47, color: "#ff6b35", tasks: ["Code review", "CI/CD pipelines", "Bug triage", "Architecture"], status: "OPTIMAL", load: 87 },
  { name: "Sales", agents: 31, color: "#3b82f6", tasks: ["Lead scoring", "Outbound sequences", "Pipeline mgmt", "Forecasting"], status: "OPTIMAL", load: 92 },
  { name: "Marketing", agents: 24, color: "#f59e0b", tasks: ["Content generation", "Campaign analysis", "SEO optimization", "Social"], status: "SCALING", load: 78 },
  { name: "Customer Support", agents: 38, color: "#00c9ff", tasks: ["Ticket resolution", "Escalation routing", "Knowledge base", "CSAT"], status: "OPTIMAL", load: 95 },
  { name: "Finance", agents: 19, color: "#a855f7", tasks: ["Invoice processing", "Expense auditing", "Revenue forecast", "Compliance"], status: "OPTIMAL", load: 63 },
  { name: "Human Resources", agents: 15, color: "#f59e0b", tasks: ["Candidate screening", "Onboarding", "Benefits admin", "Policy Q&A"], status: "NOMINAL", load: 54 },
  { name: "Legal", agents: 12, color: "#ef4444", tasks: ["Contract review", "Risk assessment", "Compliance monitoring", "IP watch"], status: "NOMINAL", load: 41 },
  { name: "Operations", agents: 28, color: "#6366f1", tasks: ["Vendor management", "Inventory tracking", "Process optimization", "Logistics"], status: "OPTIMAL", load: 83 },
  { name: "Product", agents: 22, color: "#3b82f6", tasks: ["User research synthesis", "Spec writing", "Roadmap planning", "Metrics"], status: "SCALING", load: 71 },
];

function DeptCard({ dept, index }: { dept: (typeof DEPARTMENTS)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [0, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.95, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ y, opacity, scale }}
      className="group relative rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 hover:border-border2 hover:bg-card-hover transition-all duration-300 overflow-hidden"
    >
      <div
        className="absolute top-0 left-0 right-0 h-[1px] opacity-50 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${dept.color}, transparent)` }}
      />

      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-[family-name:var(--font-display)] font-semibold text-sm mb-1">{dept.name}</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full status-dot" style={{ backgroundColor: dept.color }} />
            <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-wider" style={{ color: dept.color }}>
              {dept.status}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums" style={{ color: dept.color }}>
            {dept.agents}
          </div>
          <div className="font-[family-name:var(--font-mono)] text-[10px] text-text3">AGENTS</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-text3">CAPACITY</span>
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-text3">{dept.load}%</span>
        </div>
        <div className="h-1 rounded-full bg-border2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${dept.load}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 + index * 0.06 }}
            className="h-full rounded-full"
            style={{ backgroundColor: dept.color }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {dept.tasks.map((task) => (
          <span key={task} className="px-2 py-0.5 rounded text-[10px] font-[family-name:var(--font-mono)] text-text3 border border-border bg-bg2/50">
            {task}
          </span>
        ))}
      </div>

      <div
        className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full opacity-[0.04] group-hover:opacity-[0.08] transition-opacity blur-2xl"
        style={{ backgroundColor: dept.color }}
      />
    </motion.div>
  );
}

export default function DepartmentGrid() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start start"],
  });
  const headerY = useTransform(scrollYProgress, [0, 1], [80, 0]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <section id="departments" ref={sectionRef} className="relative py-32 px-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple/[0.02] rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          style={{ y: headerY, opacity: headerOpacity }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border2 bg-card/50 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue" />
            <span className="font-[family-name:var(--font-mono)] text-xs text-text3 uppercase tracking-wider">Departments</span>
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-bold tracking-tight mb-4">
            9 departments.{" "}
            <span className="text-blue">236 agents.</span>
          </h2>
          <p className="text-text2 max-w-xl mx-auto">
            Every department in your organization gets its own dedicated AI
            workforce. Real-time coordination. Zero downtime.
          </p>

          <div className="flex flex-wrap justify-center gap-6 mt-8 mb-4">
            {[
              { label: "TOTAL AGENTS", value: "236", color: "text-orange" },
              { label: "UPTIME", value: "99.97%", color: "text-warm" },
              { label: "AVG RESPONSE", value: "1.2s", color: "text-blue" },
              { label: "TASKS / HR", value: "14,208", color: "text-purple" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`font-[family-name:var(--font-display)] text-xl font-bold tabular-nums ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="font-[family-name:var(--font-mono)] text-[10px] text-text3 tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEPARTMENTS.map((dept, i) => (
            <DeptCard key={dept.name} dept={dept} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
