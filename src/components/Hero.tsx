import Link from "next/link";
import HeroParticles from "./HeroParticles";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-screen flex items-center justify-center px-6 pt-28 md:pt-32 pb-20 md:pb-24 overflow-hidden"
    >
      <HeroParticles />

      <div className="relative z-10 max-w-4xl mx-auto text-center w-full">
        <p className="eyebrow mb-6 md:mb-8">Conduit · West Palm Beach</p>

        <h1 className="serif text-[44px] sm:text-[60px] md:text-[80px] leading-[0.95] tracking-[-0.02em] text-[#F5F1EA]">
          Conduit. <br className="sm:hidden" />
          <span className="text-[#8C8884]">The company building </span>
          <span className="text-[#F5F1EA]">Praxis.</span>
        </h1>

        <p className="mt-8 md:mt-10 text-[16px] md:text-[20px] text-[#8C8884] max-w-2xl mx-auto leading-relaxed">
          We&apos;re building the operating system for autonomous AI
          workforces. Voice, sales, engineering, ops, finance — running 24/7
          for the businesses that hire them.
        </p>

        <div className="mt-10 md:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
          <Link href="/auth/sign-up" className="btn-primary justify-center">
            Open Praxis Console <span aria-hidden="true">→</span>
          </Link>
          <a href="#products" className="btn-secondary justify-center">
            See what we&apos;re building
          </a>
        </div>

        <div className="mt-14 md:mt-20 flex flex-col items-center gap-2">
          <span className="block w-px h-8 bg-[#1F1C19]" />
          <span className="eyebrow scroll-hint">↓ scroll</span>
        </div>
      </div>
    </section>
  );
}
