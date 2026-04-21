import ConstellationSVG from "./ConstellationSVG";

export default function Constellation() {
  return (
    <section className="py-20 md:py-32 px-6 border-t border-[#1F1C19]">
      <div className="max-w-6xl mx-auto text-center">
        <p className="eyebrow mb-6 inline-flex items-center">
          <span className="eyebrow-dot" style={{ color: "#A855F7" }} aria-hidden="true" />
          32 AI Employees. 9 Departments. One Company.
        </p>
        <h2 className="serif text-[36px] md:text-[56px] text-[#F5F1EA] max-w-3xl mx-auto mb-16 md:mb-20">
          Every role you&apos;d hire for. Already deployed.
        </h2>

        <div className="mb-16 md:mb-20 mx-auto scale-90 md:scale-100 origin-top">
          <ConstellationSVG />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 max-w-4xl mx-auto">
          {[
            { stat: "32+", label: "AI employees", caption: "deployed across departments" },
            { stat: "9", label: "Departments", caption: "fully staffed by AI" },
            { stat: "24/7", label: "Always on", caption: "no breaks. no payroll." },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center pt-6 border-t border-[#A855F7]/40"
            >
              <p className="serif text-[48px] md:text-[56px] text-[#F5F1EA] leading-none">{s.stat}</p>
              <p className="mt-3 eyebrow text-[#F5F1EA]">{s.label}</p>
              <p className="mt-2 text-[13px] text-[#8C8884]">{s.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
