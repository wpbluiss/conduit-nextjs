type Tier = {
  name: string;
  price: string;
  priceSuffix?: string;
  tagline: string;
  features: string[];
  cta: { label: string; href: string; primary?: boolean };
  popular?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "STARTER",
    price: "$20",
    priceSuffix: "/mo",
    tagline: "For solopreneurs testing the water.",
    features: [
      "3 AI employees",
      "1 department",
      "Email + SMS channels",
      "Standard support",
    ],
    cta: { label: "Start Free", href: "#cta" },
  },
  {
    name: "GROWTH",
    price: "$249",
    priceSuffix: "/mo",
    tagline: "For businesses ready to scale without hiring.",
    features: [
      "12 AI employees",
      "3 departments",
      "Voice, SMS, email, chat",
      "Compliance AI included",
      "Priority support",
    ],
    cta: { label: "Get Started", href: "#cta", primary: true },
    popular: true,
  },
  {
    name: "ENTERPRISE",
    price: "$599+",
    priceSuffix: "/mo",
    tagline: "For companies replacing entire teams.",
    features: [
      "Unlimited AI employees",
      "All 9 departments",
      "Custom integrations",
      "White-label option",
      "Dedicated success manager",
    ],
    cta: { label: "Talk to Founder", href: "mailto:luis@conduitai.io" },
  },
];

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="mt-[5px] flex-shrink-0">
      <path
        d="M3 7l3 3 5-6"
        stroke="#D97706"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="square"
      />
    </svg>
  );
}

export default function Pricing() {
  return (
    <section id="pricing" className="py-32 px-6 border-t border-[#1F1C19]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <p className="eyebrow mb-4">Pricing</p>
          <h2 className="serif text-[40px] md:text-[56px] text-[#F5F1EA]">
            One platform. Three tiers. Zero payroll.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`relative p-10 bg-[#0A0908] flex flex-col ${
                t.popular
                  ? "border border-[#D97706] md:-mt-4 md:mb-[-1rem]"
                  : "border border-[#1F1C19]"
              }`}
            >
              {t.popular && (
                <span className="absolute -top-3 left-10 bg-[#D97706] text-[#0A0908] text-[10px] uppercase tracking-[1.8px] px-3 py-1 font-medium">
                  Most popular
                </span>
              )}
              <p className="eyebrow text-[#D97706] mb-5">{t.name}</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="serif text-[56px] text-[#F5F1EA] leading-none">
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
                    <Check />
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

        <p className="text-center mt-16 text-[14px] text-[#8C8884] max-w-2xl mx-auto">
          Or build your own stack. Per-employee add-ons from $5/mo. Credit-based
          usage available for high-volume operations.
        </p>
      </div>
    </section>
  );
}
