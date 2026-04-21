const MILESTONES = [
  {
    date: "FEB 2026",
    title: "Conduit AI launches",
    detail: "Single voice agent. First signup within 24 hours.",
  },
  {
    date: "MAR 2026",
    title: "First paying customer",
    detail: "AJ Cuts barbershop. $100. Proof the model works.",
  },
  {
    date: "APR 2026",
    title: "Pivot to virtual OS",
    detail: "32 AI employees across 9 departments. Built in days, not years.",
  },
  {
    date: "APR 2026",
    title: "Lunaro Insurance CRM",
    detail: "First white-label vertical deployment. Built and shipped in one weekend.",
  },
  {
    date: "TODAY",
    title: "You're reading this",
    detail: "And we're just getting started.",
  },
];

export default function Story() {
  return (
    <section id="story" className="py-32 px-6 border-t border-[#1F1C19]">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 lg:gap-24">
        <div>
          <p className="eyebrow mb-6">Built in public</p>
          <h2 className="serif text-[40px] md:text-[56px] text-[#F5F1EA] mb-10">
            21. No CS degree. Just shipping.
          </h2>
          <div className="space-y-6 text-[17px] text-[#8C8884] leading-[1.75]">
            <p>
              Conduit AI is built and operated by Luis Garcia, a 21-year-old
              founder from West Palm Beach, Florida. No engineering degree. No
              funding round. Just an obsession with replacing payroll with code
              that works.
            </p>
            <p>
              In a few weeks, Conduit went from a single voice agent answering
              missed calls to a full virtual operating system with 32 AI
              employees deployed across 9 departments — running real businesses,
              generating real revenue, with zero overhead.
            </p>
            <p className="text-[#F5F1EA]">
              This is what an entire company looks like when one person writes
              it.
            </p>
          </div>
        </div>

        <div className="relative pl-8">
          <span className="absolute left-0 top-2 bottom-2 w-px bg-[#1F1C19]" />
          <ol className="space-y-10">
            {MILESTONES.map((m) => (
              <li key={m.date + m.title} className="relative">
                <span className="absolute -left-[33px] top-[6px] w-[8px] h-[8px] bg-[#8C8884]" />
                <p className="eyebrow text-[#8C8884] mb-2">{m.date}</p>
                <h3 className="text-[18px] font-medium text-[#F5F1EA] mb-1.5">
                  {m.title}
                </h3>
                <p className="text-[14px] text-[#8C8884] leading-relaxed">
                  {m.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
