import HeadlineCycler from "./HeadlineCycler";
import HeroParticles from "./HeroParticles";
import LayeredBuilding from "./LayeredBuilding";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-screen flex items-center justify-center px-6 pt-32 pb-24 overflow-hidden"
    >
      <HeroParticles />
      <div className="hidden md:block">
        <LayeredBuilding />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center w-full">
        <p className="eyebrow mb-8">Virtual Business Operating System</p>

        <div className="md:hidden mb-10">
          <LayeredBuilding />
        </div>

        <HeadlineCycler />

        <p className="mt-10 text-[17px] md:text-[20px] text-[#8C8884] max-w-2xl mx-auto leading-relaxed">
          Conduit deploys autonomous AI employees across every department of your
          business. Voice, sales, support, finance, ops, marketing — all running
          24/7. One platform. Zero payroll.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#cta" className="btn-primary">
            Request Access <span aria-hidden="true">→</span>
          </a>
          <a href="#terminal" className="btn-secondary">
            See it in action
          </a>
        </div>

        <div className="mt-20 flex flex-col items-center gap-2">
          <span className="block w-px h-8 bg-[#1F1C19]" />
          <span className="eyebrow scroll-hint">↓ scroll</span>
        </div>
      </div>
    </section>
  );
}
