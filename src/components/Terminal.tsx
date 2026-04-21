import TerminalTyper from "./TerminalTyper";

export default function Terminal() {
  return (
    <section id="terminal" className="py-32 px-6 border-t border-[#1F1C19]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <p className="eyebrow mb-4">Deploy in minutes, not quarters</p>
          <h2 className="serif text-[40px] md:text-[56px] text-[#F5F1EA]">
            One command. Entire department live.
          </h2>
        </div>

        <TerminalTyper />

        <p className="mt-12 text-center text-[17px] md:text-[18px] text-[#8C8884] italic">
          Or hire 4 humans for $280,000/year. Your call.
        </p>
      </div>
    </section>
  );
}
