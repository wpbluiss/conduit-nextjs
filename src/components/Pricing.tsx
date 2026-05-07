type Tier = {
  name: string;
  price: string;
  priceSuffix?: string;
  tagline: string;
  features: string[];
  cta: { label: string; href: string; primary?: boolean };
  popular?: boolean;
  checkColor: string;
};

// Mirrors the runtime tiers in src/lib/billing/tiers.ts so the marketing
// promise matches what the Praxis Console actually sells.
const TIERS: Tier[] = [
  {
    name: "FREE",
    price: "$0",
    priceSuffix: "/mo",
    tagline: "For founders kicking the tires.",
    features: [
      "Praxis Flow — fast model",
      "Atlas + Marketing employees",
      "50k tokens / month",
      "Voice input in chat",
    ],
    cta: { label: "Open Praxis", href: "/auth/sign-up" },
    checkColor: "#34D399",
  },
  {
    name: "PRO",
    price: "$29",
    priceSuffix: "/mo",
    tagline: "For solo founders running a real business.",
    features: [
      "Praxis Flow — adaptive routing",
      "Atlas + Marketing + Sales + Engineering",
      "1M tokens / month",
      "30 voice minutes per day",
      "Real lead pipelines (Sales) + real builds (Engineering)",
    ],
    cta: { label: "Start Pro", href: "/auth/sign-up?tier=pro", primary: true },
    popular: true,
    checkColor: "#FF8A3D",
  },
  {
    name: "ENTERPRISE",
    price: "$199",
    priceSuffix: "/mo",
    tagline: "For teams replacing whole departments.",
    features: [
      "Praxis Depth — extended thinking",
      "All 9 employees (Finance, Compliance, HR, Ops, Legal)",
      "5M tokens / month",
      "Unlimited voice + roundtable",
      "Multi-user (when shipped) + priority routing",
    ],
    cta: { label: "Talk to founder", href: "mailto:luis@conduitai.io" },
    checkColor: "#A855F7",
  },
];

function Check({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="mt-[5px] flex-shrink-0">
      <path
        d="M3 7l3 3 5-6"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="square"
      />
    </svg>
  );
}

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-32 px-6 border-t border-[#1F1C19]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14 md:mb-20 max-w-3xl mx-auto">
          <p className="eyebrow mb-4 inline-flex items-center">
            <span className="eyebrow-dot" style={{ color: "#FF8A3D" }} aria-hidden="true" />
            Pricing
          </p>
          <h2 className="serif text-[36px] md:text-[56px] text-[#F5F1EA]">
            Three tiers. One workforce.
          </h2>
          <p className="mt-5 text-[16px] md:text-[18px] text-[#8C8884] leading-relaxed">
            Praxis Flow runs everywhere; Praxis Depth (extended thinking)
            kicks in on Enterprise for the reasoning-heavy turns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`relative p-8 md:p-10 bg-[#0A0908] flex flex-col ${
                t.popular
                  ? "border border-[#FF8A3D] md:-mt-4 md:mb-[-1rem]"
                  : "border border-[#1F1C19]"
              }`}
            >
              {t.popular && (
                <span className="absolute -top-3 left-8 md:left-10 bg-[#FF8A3D] text-[#0A0908] text-[10px] uppercase tracking-[1.8px] px-3 py-1 font-medium">
                  Most popular
                </span>
              )}
              <p className="eyebrow text-[#8C8884] mb-5">{t.name}</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="serif text-[48px] md:text-[56px] text-[#F5F1EA] leading-none">
                  {t.price}
                </span>
                {t.priceSuffix && (
                  <span className="text-[18px] text-[#8C8884]">{t.priceSuffix}</span>
                )}
              </div>
              <p className="text-[14px] text-[#8C8884] mb-6">{t.tagline}</p>
              <div className="divider mb-6" />
              <ul className="space-y-3 mb-10 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[14px] text-[#F5F1EA]">
                    <Check color={t.checkColor} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={t.cta.href}
                className={`${t.cta.primary ? "btn-primary" : "btn-secondary"} justify-center`}
              >
                {t.cta.label} <span aria-hidden="true">→</span>
              </a>
            </div>
          ))}
        </div>

        <p className="text-center mt-12 md:mt-16 text-[14px] text-[#8C8884] max-w-2xl mx-auto">
          Top up tokens any time — $10 / $25 / $50 packs from the
          <a
            href="/app/settings/billing"
            className="text-[#F5F1EA] hover:text-[#FF8A3D] mx-1"
          >
            billing settings
          </a>
          inside the Console.
        </p>
      </div>
    </section>
  );
}
