import Link from "next/link";

export default function FinalCTA() {
  return (
    <section
      id="cta"
      className="relative py-24 md:py-32 px-6 bg-[#14110F] border-t border-[#1F1C19] overflow-hidden"
    >
      <div className="cta-mesh" aria-hidden="true" />
      <div className="relative max-w-4xl mx-auto text-center">
        <h2 className="serif text-[40px] md:text-[64px] text-[#F5F1EA] leading-[1.05]">
          Stop hiring. Start deploying.
        </h2>
        <p className="mt-6 md:mt-8 text-[17px] md:text-[20px] text-[#8C8884] max-w-2xl mx-auto leading-relaxed">
          Praxis is live. Free to start. The Console is the door.
        </p>
        <div className="mt-10 md:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/auth/sign-up"
            className="btn-primary text-[16px]"
            style={{ padding: "20px 44px" }}
          >
            Open Praxis Console <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/products"
            className="btn-secondary text-[16px]"
            style={{ padding: "20px 32px" }}
          >
            See the product family
          </Link>
        </div>
        <p className="mt-8 text-[14px] text-[#8C8884]">
          Or email{" "}
          <a
            href="mailto:luis@conduitai.io"
            className="text-[#F5F1EA] underline underline-offset-4 decoration-[#FF8A3D]/50 hover:decoration-[#FF8A3D]"
          >
            luis@conduitai.io
          </a>{" "}
          directly.
        </p>
      </div>
    </section>
  );
}
