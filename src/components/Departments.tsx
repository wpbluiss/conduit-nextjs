type Dept = {
  eyebrow: string;
  title: string;
  body: string;
  agents: string;
  accent: string;
};

const DEPTS: Dept[] = [
  {
    eyebrow: "ENGINEERING",
    title: "Engineering",
    body: "Architects, builds, and deploys software, automations, and integrations.",
    agents: "Architect, Builder, Deployer, Reviewer",
    accent: "#22D3EE",
  },
  {
    eyebrow: "SALES",
    title: "Sales",
    body: "Hunts leads, qualifies, books meetings, and closes deals on autopilot.",
    agents: "Hunter, Closer, Quoter, Pipeline Manager",
    accent: "#FF6B35",
  },
  {
    eyebrow: "SUPPORT",
    title: "Support",
    body: "Answers calls, replies to messages, and resolves tickets across every channel.",
    agents: "Voice Agent, Chat Agent, Ticket Resolver, Escalation Handler",
    accent: "#34D399",
  },
  {
    eyebrow: "MARKETING",
    title: "Marketing",
    body: "Writes content, runs campaigns, manages SEO, and grows your audience.",
    agents: "Content Writer, SEO Specialist, Campaign Manager, Social Lead",
    accent: "#F472B6",
  },
  {
    eyebrow: "OPERATIONS",
    title: "Operations",
    body: "Schedules, dispatches, audits, and keeps the business running smoothly.",
    agents: "Scheduler, Dispatcher, QA Auditor, Process Optimizer",
    accent: "#FBBF24",
  },
  {
    eyebrow: "FINANCE",
    title: "Finance",
    body: "Books, invoices, reconciles, and reports — accurate to the cent, every day.",
    agents: "Bookkeeper, Invoicer, Reconciler, Reporter",
    accent: "#34D399",
  },
  {
    eyebrow: "LEGAL",
    title: "Legal",
    body: "Reviews contracts, monitors compliance, and flags risk before it becomes a problem.",
    agents: "Contract Reviewer, Compliance Monitor, Risk Analyst",
    accent: "#A855F7",
  },
  {
    eyebrow: "HR",
    title: "Human Resources",
    body: "Recruits, onboards, schedules, and supports your team — human or AI.",
    agents: "Recruiter, Onboarder, Scheduler, Culture Lead",
    accent: "#F472B6",
  },
  {
    eyebrow: "PRODUCT",
    title: "Product",
    body: "Researches, designs, prototypes, and ships features your customers actually want.",
    agents: "Researcher, Designer, Prototyper, Product Manager",
    accent: "#22D3EE",
  },
];

export default function Departments() {
  return (
    <section id="departments" className="py-20 md:py-32 px-6 border-t border-[#1F1C19]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 md:mb-16 max-w-2xl">
          <p className="eyebrow mb-4">What they do</p>
          <h2 className="serif text-[36px] md:text-[56px] text-[#F5F1EA]">
            Specialized agents, not chatbots.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l border-[#1F1C19]">
          {DEPTS.map((d) => (
            <article
              key={d.eyebrow}
              className="dept-card group p-7 md:p-8 border-r border-b border-[#1F1C19] flex flex-col min-h-[240px]"
              style={{ ["--accent" as string]: d.accent } as React.CSSProperties}
            >
              <p className="dept-eyebrow eyebrow mb-5">{d.eyebrow}</p>
              <h3 className="serif text-[22px] md:text-[24px] text-[#F5F1EA] mb-3">{d.title}</h3>
              <p className="text-[14px] text-[#8C8884] leading-relaxed flex-1">
                {d.body}
              </p>
              <p className="mt-6 text-[10px] uppercase tracking-[1.5px] text-[#8C8884]">
                {d.agents}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
