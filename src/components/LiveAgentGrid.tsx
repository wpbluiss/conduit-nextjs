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
  { name: "Contract Rev.", dept: "Legal" },
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
    <section className="relative py-20 md:py-32 px-6 border-t border-[#1F1C19] overflow-hidden">
      <div className="agent-grid-glow" aria-hidden="true" />
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-14 max-w-3xl mx-auto">
          <p className="eyebrow mb-4 inline-flex items-center">
            <span className="eyebrow-dot" style={{ color: "#22D3EE" }} aria-hidden="true" />
            32 agents deployed. All online.
          </p>
          <h2 className="serif text-[36px] md:text-[56px] text-[#F5F1EA]">
            Your workforce is awake.
          </h2>
        </div>

        <div className="grid grid-cols-4 lg:grid-cols-8 gap-0 border-t border-l border-[#1F1C19]">
          {AGENTS.map((a, idx) => (
            <article
              key={`${a.name}-${idx}`}
              className="agent-card relative border-r border-b border-[#1F1C19] bg-[#0D0B09] p-2 md:p-3 flex flex-col gap-1 min-h-[76px] md:min-h-[84px] transition-colors hover:border-[#22D3EE]"
            >
              <span
                className="agent-dot"
                style={{ animationDelay: `${(idx % 8) * 230}ms` }}
                aria-hidden="true"
              />
              <p className="text-[9px] md:text-[11px] uppercase tracking-[0.4px] md:tracking-[1px] text-[#F5F1EA] font-medium leading-[1.2] pr-3 md:pr-4">
                {a.name}
              </p>
              <p className="text-[9px] md:text-[10px] text-[#8C8884] tracking-[0.3px] md:tracking-[0.5px]">
                {a.dept}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-10 md:mt-12 text-center text-[14px] md:text-[15px] text-[#8C8884] italic">
          Every agent learning, improving, working — 24 hours a day.
        </p>
      </div>
    </section>
  );
}
