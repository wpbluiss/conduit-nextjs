export default function Founding() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Every missed call is a missed opportunity
        </h2>
        <p className="text-lg text-[var(--muted)] mb-8 max-w-xl mx-auto">
          Start your free 14-day trial. No setup fee. No contracts. Cancel anytime before day 14 and pay nothing.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://app.conduitai.io/login"
            className="px-8 py-3.5 rounded-full bg-[var(--cyan)] text-[var(--bg)] font-semibold text-base hover:brightness-110 transition-all"
          >
            Start Your Free Trial
          </a>
          <a
            href="tel:+15617303316"
            className="px-8 py-3.5 rounded-full border border-white/20 text-white font-medium text-base hover:bg-white/5 transition-all"
          >
            Call Demo: (561) 730-3316
          </a>
        </div>
      </div>
    </section>
  );
}
