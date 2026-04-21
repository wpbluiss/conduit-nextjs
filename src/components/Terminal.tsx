import TerminalTyper from "./TerminalTyper";

export default function Terminal() {
  return (
    <section id="terminal" className="py-20 md:py-32 px-6 border-t border-[#1F1C19]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
          <p className="eyebrow mb-4 inline-flex items-center">
            <span className="eyebrow-dot" style={{ color: "#FBBF24" }} aria-hidden="true" />
            Deploy in minutes, not quarters
          </p>
          <h2 className="serif text-[36px] md:text-[56px] text-[#F5F1EA]">
            One command. Entire department live.
          </h2>
        </div>

        <TerminalTyper />

        <p className="mt-10 md:mt-12 text-center text-[16px] md:text-[18px] text-[#8C8884] italic">
          Or hire 4 humans for $280,000/year. Your call.
        </p>
      </div>
    </section>
  );
}
