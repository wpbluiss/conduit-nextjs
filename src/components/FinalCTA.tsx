export default function FinalCTA() {
  return (
    <section
      id="cta"
      className="py-32 px-6 bg-[#14110F] border-t border-[#1F1C19]"
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="serif text-[44px] md:text-[64px] text-[#F5F1EA]">
          Stop hiring. Start deploying.
        </h2>
        <p className="mt-8 text-[18px] md:text-[20px] text-[#8C8884] max-w-2xl mx-auto leading-relaxed">
          The future of work is autonomous. Conduit puts you on the right side
          of it.
        </p>
        <div className="mt-12">
          <a
            href="mailto:luis@conduitai.io?subject=Request%20Access%20-%20Conduit%20AI"
            className="btn-primary text-[16px]"
            style={{ padding: "20px 48px" }}
          >
            Request Access <span aria-hidden="true">→</span>
          </a>
        </div>
        <p className="mt-8 text-[14px] text-[#8C8884]">
          Or email{" "}
          <a
            href="mailto:luis@conduitai.io"
            className="text-[#F5F1EA] underline underline-offset-4 decoration-[#FF6B35]/50 hover:decoration-[#FF6B35]"
          >
            luis@conduitai.io
          </a>{" "}
          directly.
        </p>
      </div>
    </section>
  );
}
