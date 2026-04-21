export default function CaseStudy() {
  return (
    <section className="py-20 md:py-32 px-6 border-t border-[#1F1C19]">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 md:gap-12 lg:gap-20 items-start mb-12 md:mb-16">
          <div>
            <p className="eyebrow mb-4 inline-flex items-center">
              <span className="eyebrow-dot" style={{ color: "#34D399" }} aria-hidden="true" />
              Case study
            </p>
            <h2 className="serif text-[36px] md:text-[56px] text-[#F5F1EA] mb-8 md:mb-10">
              Lunaro: an insurance CRM, built in days.
            </h2>
            <div className="space-y-6 text-[17px] text-[#8C8884] leading-[1.75]">
              <p>
                In April 2026, Conduit shipped Lunaro — a full white-label
                insurance CRM for a partner agency in West Palm Beach.
                Multi-tenant architecture, 32 insurance-native AI employees,
                compliance AI with real CMS citations, calendar booking,
                quoting engine, commission tracking, and a producer licensing
                system.
              </p>
              <p>
                Every feature an insurance agency needs to operate. Built,
                tested, and shipped in a single weekend.
              </p>
              <p className="text-[#F5F1EA]">
                This is what Conduit does. We don&apos;t sell software. We
                deploy entire businesses.
              </p>
            </div>
          </div>

          <div className="relative aspect-[4/3] bg-[#14110F] border border-[#1F1C19] overflow-hidden">
            <div
              aria-label="Lunaro Insurance CRM dashboard"
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="absolute inset-0 opacity-[0.05]" style={{
                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 28px, #8C8884 28px, #8C8884 29px),
                                 repeating-linear-gradient(90deg, transparent, transparent 28px, #8C8884 28px, #8C8884 29px)`,
              }} />
              <div className="absolute top-5 left-5 right-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6B35]" />
                <span className="eyebrow text-[#8C8884]">LUNARO CRM</span>
                <span className="ml-auto text-[10px] text-[#8C8884]">v1.0</span>
              </div>
              <div className="relative z-10 text-center px-6">
                <p className="serif text-[40px] text-[#F5F1EA] mb-2">Lunaro</p>
                <p className="text-[12px] text-[#8C8884] uppercase tracking-[2px]">
                  Insurance operations, autonomous.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-3 text-left max-w-[280px] mx-auto">
                  {["Policies", "Quotes", "Commissions", "Compliance", "Producers", "Calendar"].map((k) => (
                    <div key={k} className="border border-[#1F1C19] px-2.5 py-2 text-[10px] uppercase tracking-[1px] text-[#8C8884]">
                      {k}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-t border-l border-[#1F1C19]">
          {[
            { stat: "11", label: "NEW TABLES", caption: "deployed in one sprint", color: "#22D3EE" },
            { stat: "32", label: "AI EMPLOYEES", caption: "insurance-trained", color: "#FF6B35" },
            { stat: "0/0/0/0", label: "AUTO-QA FINDINGS", caption: "clean on ship", color: "#34D399" },
            { stat: "990", label: "COMPLIANCE CHUNKS", caption: "CMS-cited", color: "#A855F7" },
          ].map((s) => (
            <div key={s.label} className="border-r border-b border-[#1F1C19] p-5 md:p-6">
              <p className="serif text-[28px] md:text-[32px] leading-none" style={{ color: s.color }}>
                {s.stat}
              </p>
              <p className="mt-3 eyebrow text-[#8C8884]">{s.label}</p>
              <p className="mt-2 text-[12px] text-[#8C8884]">{s.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
