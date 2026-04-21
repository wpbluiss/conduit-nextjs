type Agent = { name: string; dept: string };

const AGENTS: Agent[] = [
  { name: "Hunter", dept: "Sales" },
  { name: "Closer", dept: "Sales" },
  { name: "Quoter", dept: "Sales" },
  { name: "Pipeline Mgr", dept: "Sales" },
  { name: "Voice Agent", dept: "Support" },
  { name: "Chat Agent", dept: "Support" },
  { name: "Ticket Resolver", dept: "Support" },
  { name: "Escalation", dept: "Support" },
  { name: "Architect", dept: "Engineering" },
  { name: "Builder", dept: "Engineering" },
  { name: "Deployer", dept: "Engineering" },
  { name: "Reviewer", dept: "Engineering" },
  { name: "Content Writer", dept: "Marketing" },
  { name: "SEO Specialist", dept: "Marketing" },
  { name: "Campaign Mgr", dept: "Marketing" },
  { name: "Social Lead", dept: "Marketing" },
  { name: "Scheduler", dept: "Operations" },
  { name: "Dispatcher", dept: "Operations" },
  { name: "QA Auditor", dept: "Operations" },
  { name: "Process Opt.", dept: "Operations" },
  { name: "Bookkeeper", dept: "Finance" },
  { name: "Invoicer", dept: "Finance" },
  { name: "Reconciler", dept: "Finance" },
  { name: "Reporter", dept: "Finance" },
  { name: "Contract Review", dept: "Legal" },
  { name: "Compliance", dept: "Legal" },
  { name: "Risk Analyst", dept: "Legal" },
  { name: "Recruiter", dept: "HR" },
  { name: "Onboarder", dept: "HR" },
  { name: "Researcher", dept: "Product" },
  { name: "Designer", dept: "Product" },
  { name: "Product Mgr", dept: "Product" },
];

export default function LiveAgentGrid() {
  return (
    <section className="py-32 px-6 border-t border-[#1F1C19]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <p className="eyebrow mb-4">Live Workforce</p>
          <h2 className="serif text-[40px] md:text-[56px] text-[#F5F1EA]">
            32 agents. Online right now.
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-0 border-t border-l border-[#1F1C19]">
          {AGENTS.map((a, idx) => (
            <article
              key={`${a.name}-${idx}`}
              className="relative border-r border-b border-[#1F1C19] bg-[#0D0B09] p-3 flex flex-col gap-1.5 min-h-[84px]"
            >
              <span
                className="agent-dot"
                style={{ animationDelay: `${(idx % 8) * 230}ms` }}
                aria-hidden="true"
              />
              <p className="text-[11px] uppercase tracking-[1.2px] text-[#F5F1EA] font-medium leading-tight pr-5">
                {a.name}
              </p>
              <p className="text-[10px] text-[#8C8884] tracking-[0.6px]">
                {a.dept}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-12 text-center text-[15px] text-[#8C8884] italic">
          Every agent learning, improving, working — 24 hours a day.
        </p>
      </div>
    </section>
  );
}
