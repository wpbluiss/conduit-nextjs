"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const DEPARTMENTS = [
  { name: "Engineering", agents: 47, color: "#ff6b35", tasks: ["Code review", "CI/CD", "Bug triage", "Architecture"], load: 87 },
  { name: "Sales", agents: 31, color: "#3b82f6", tasks: ["Lead scoring", "Outbound", "Pipeline", "Forecasting"], load: 92 },
  { name: "Marketing", agents: 24, color: "#f59e0b", tasks: ["Content", "Campaigns", "SEO", "Social"], load: 78 },
  { name: "Support", agents: 38, color: "#00c9ff", tasks: ["Tickets", "Escalation", "Knowledge base", "CSAT"], load: 95 },
  { name: "Finance", agents: 19, color: "#a855f7", tasks: ["Invoices", "Expenses", "Forecasting", "Compliance"], load: 63 },
  { name: "HR", agents: 15, color: "#f59e0b", tasks: ["Screening", "Onboarding", "Benefits", "Policy"], load: 54 },
  { name: "Legal", agents: 12, color: "#ef4444", tasks: ["Contracts", "Risk", "Compliance", "IP watch"], load: 41 },
  { name: "Operations", agents: 28, color: "#6366f1", tasks: ["Vendors", "Inventory", "Processes", "Logistics"], load: 83 },
  { name: "Product", agents: 22, color: "#3b82f6", tasks: ["Research", "Specs", "Roadmap", "Metrics"], load: 71 },
];

function Card({ dept, index }: { dept: typeof DEPARTMENTS[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const y = useTransform(scrollYProgress, [0, 1], [50, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <motion.div ref={ref} style={{ y, opacity }}
      className="group relative rounded-xl border border-border bg-card/50 p-5 hover:border-border2 hover:bg-card-hover transition-all duration-300 overflow-hidden gpu-layer">
      <div className="absolute top-0 left-0 right-0 h-[1px] opacity-40 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${dept.color}, transparent)` }} />
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] font-semibold text-sm">{dept.name}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dept.color }} />
            <span className="font-[family-name:var(--font-mono)] text-[10px]" style={{ color: dept.color }}>OPTIMAL</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-[family-name:var(--font-display)] text-2xl font-bold tabular-nums" style={{ color: dept.color }}>{dept.agents}</div>
          <div className="font-[family-name:var(--font-mono)] text-[9px] text-text3">AGENTS</div>
        </div>
      </div>
      <div className="mb-3">
        <div className="h-1 rounded-full bg-border2 overflow-hidden">
          <motion.div initial={{ width: 0 }} whileInView={{ width: `${dept.load}%` }} viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 + index * 0.05 }}
            className="h-full rounded-full" style={{ backgroundColor: dept.color }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-[family-name:var(--font-mono)] text-[9px] text-text3">CAPACITY</span>
          <span className="font-[family-name:var(--font-mono)] text-[9px] text-text3">{dept.load}%</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {dept.tasks.map(t => (
          <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-[family-name:var(--font-mono)] text-text3 border border-border bg-bg2/50">{t}</span>
        ))}
      </div>
      <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full opacity-[0.04] group-hover:opacity-[0.08] transition-opacity blur-2xl"
        style={{ backgroundColor: dept.color }} />
    </motion.div>
  );
}

export default function DepartmentGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.3"] });
  const headY = useTransform(scrollYProgress, [0, 1], [60, 0]);
  const headOp = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <section id="departments" ref={ref} className="relative py-20 px-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple/[0.02] rounded-full blur-[150px]" />
      </div>
      <div className="relative max-w-6xl mx-auto">
        <motion.div style={{ y: headY, opacity: headOp }} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border2 bg-card/50 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue" />
            <span className="font-[family-name:var(--font-mono)] text-xs text-text3 uppercase tracking-wider">Departments</span>
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-bold tracking-tight mb-4">
            9 departments. <span className="text-blue">236 agents.</span>
          </h2>
          <p className="text-text2 max-w-xl mx-auto">Every department gets its own dedicated AI workforce. Real-time coordination. Zero downtime.</p>
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            {[
              { label: "TOTAL AGENTS", value: "236", color: "text-orange" },
              { label: "UPTIME", value: "99.97%", color: "text-warm" },
              { label: "AVG RESPONSE", value: "1.2s", color: "text-blue" },
              { label: "TASKS/HR", value: "14,208", color: "text-purple" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`font-[family-name:var(--font-display)] text-xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
                <div className="font-[family-name:var(--font-mono)] text-[9px] text-text3 tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {DEPARTMENTS.map((d, i) => <Card key={d.name} dept={d} index={i} />)}
        </div>
      </div>
    </section>
  );
}
