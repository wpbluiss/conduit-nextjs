import Link from "next/link";

export default function PlatformTeaser() {
  return (
    <section
      id="platform"
      className="relative px-6 py-20 md:py-28 border-t border-[#1F1C19]"
    >
      <div className="max-w-4xl mx-auto text-center">
        <p className="eyebrow mb-6">The Platform</p>
        <h2 className="serif text-[32px] md:text-[44px] leading-[1.05] tracking-[-0.02em] text-[#F5F1EA]">
          Conduit is the platform where you talk to AI and an AI team
          builds your business.
        </h2>
        <p className="mt-6 text-[17px] md:text-[19px] text-[#8C8884] leading-relaxed">
          Marketing, sales, engineering, ops. All in one chat. Watch them
          work.
        </p>
        <div className="mt-8">
          <Link href="/auth/sign-up" className="btn-primary justify-center">
            Sign up free <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
