type Dept = {
  eyebrow: string;
  title: string;
  body: string;
  agents: string;
};

const DEPTS: Dept[] = [
  {
    eyebrow: "ENGINEERING",
    title: "Engineering",
    body: "Architects, builds, and deploys software, automations, and integrations.",
    agents: "Architect, Builder, Deployer, Reviewer",
  },
  {
    eyebrow: "SALES",
    title: "Sales",
    body: "Hunts leads, qualifies, books meetings, and closes deals on autopilot.",
    agents: "Hunter, Closer, Quoter, Pipeline Manager",
  },
  {
    eyebrow: "SUPPORT",
    title: "Support",
    body: "Answers calls, replies to messages, and resolves tickets across every channel.",
    agents: "Voice Agent, Chat Agent, Ticket Resolver, Escalation Handler",
  },
  {
    eyebrow: "MARKETING",
    title: "Marketing",
    body: "Writes content, runs campaigns, manages SEO, and grows your audience.",
    agents: "Content Writer, SEO Specialist, Campaign Manager, Social Lead",
  },
  {
    eyebrow: "OPERATIONS",
    title: "Operations",
    body: "Schedules, dispatches, audits, and keeps the business running smoothly.",
    agents: "Scheduler, Dispatcher, QA Auditor, Process Optimizer",
  },
  {
    eyebrow: "FINANCE",
    title: "Finance",
    body: "Books, invoices, reconciles, and reports — accurate to the cent, every day.",
    agents: "Bookkeeper, Invoicer, Reconciler, Reporter",
  },
  {
    eyebrow: "LEGAL",
    title: "Legal",
    body: "Reviews contracts, monitors compliance, and flags risk before it becomes a problem.",
    agents: "Contract Reviewer, Compliance Monitor, Risk Analyst",
  },
  {
    eyebrow: "HR",
    title: "Human Resources",
    body: "Recruits, onboards, schedules, and supports your team — human or AI.",
    agents: "Recruiter, Onboarder, Scheduler, Culture Lead",
  },
  {
    eyebrow: "PRODUCT",
    title: "Product",
    body: "Researches, designs, prototypes, and ships features your customers actually want.",
    agents: "Researcher, Designer, Prototyper, Product Manager",
  },
];

export default function Departments() {
  return (
    <section id="departments" className="py-32 px-6 border-t border-[#1F1C19]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 max-w-2xl">
          <p className="eyebrow mb-4">What they do</p>
          <h2 className="serif text-[40px] md:text-[56px] text-[#F5F1EA]">
            Specialized agents, not chatbots.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l border-[#1F1C19]">
          {DEPTS.map((d) => (
            <article
              key={d.eyebrow}
              className="group p-8 border-r border-b border-[#1F1C19] transition-colors hover:border-[#D97706] flex flex-col min-h-[260px]"
            >
              <p className="eyebrow text-[#D97706] mb-5">{d.eyebrow}</p>
              <h3 className="serif text-[24px] text-[#F5F1EA] mb-3">{d.title}</h3>
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
