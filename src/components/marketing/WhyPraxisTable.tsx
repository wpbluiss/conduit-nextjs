import { Check, X } from "@phosphor-icons/react/dist/ssr";

const ROWS: { label: string; team: string; praxis: string; praxisPositive?: boolean }[] = [
  {
    label: "Annual cost",
    team: "~$600,000/yr\n(CMO + CTO + Sales lead + Legal + Ops salaries)",
    praxis: "$348–$1,188/yr\n(Pro to Enterprise, all 9 specialists)",
    praxisPositive: true,
  },
  {
    label: "Availability",
    team: "Business hours\n(9–5, Mon–Fri, time zones, PTO)",
    praxis: "24/7, no holidays\nNo sick days. No context switching.",
    praxisPositive: true,
  },
  {
    label: "Time to start",
    team: "3–6 months\n(Hiring, onboarding, ramp-up)",
    praxis: "Under 5 minutes\n(Sign up, describe your business, done)",
    praxisPositive: true,
  },
  {
    label: "Coverage breadth",
    team: "5 roles\n(and gaps between them)",
    praxis: "9 specialists\nMarketing, Sales, Engineering, Ops, Finance,\nLegal, HR, Compliance, Chief of Staff",
    praxisPositive: true,
  },
  {
    label: "Payroll risk",
    team: "High\n(Benefits, equity, management overhead)",
    praxis: "None\nCancel any time. No contracts.",
    praxisPositive: true,
  },
];

const ACCENT = "rgba(91,99,232,0.14)";
const ACCENT_BORDER = "rgba(91,99,232,0.25)";

export function WhyPraxisTable() {
  return (
    <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
      <div className="conduit-container">
        <div className="max-w-[640px] mb-12 md:mb-16">
          <p className="conduit-caption conduit-caption-ember">Why Praxis</p>
          <h2 className="conduit-display-2xl mt-5">
            Nine specialists. Zero payroll.
          </h2>
          <p className="mt-5 text-[17px] leading-[1.7] text-[var(--color-cream-mute)]">
            A full-time team covering your go-to-market, engineering, finance,
            and legal costs over $600,000 a year — before you sell a single
            dollar. Praxis gives you the same depth for the price of a Spotify
            subscription.
          </p>
        </div>

        {/* Mobile: stacked card per row */}
        <div className="md:hidden space-y-3">
          {ROWS.map((row) => (
            <div
              key={row.label}
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--color-edge-subtle)" }}
            >
              <div
                className="px-4 py-2 text-[11px] uppercase tracking-[0.12em] font-semibold text-[var(--color-cream-mute)]"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                {row.label}
              </div>
              <div className="grid grid-cols-2 divide-x divide-[var(--color-edge-subtle)]">
                <div className="px-4 py-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <X size={13} weight="bold" className="text-[var(--color-cream-mute)] shrink-0" />
                    <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-cream-mute)]">
                      Full-time team
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--color-cream-soft)] leading-[1.55] whitespace-pre-line">
                    {row.team}
                  </p>
                </div>
                <div className="px-4 py-4" style={{ background: ACCENT }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Check size={13} weight="bold" style={{ color: "#818CF8" }} className="shrink-0" />
                    <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: "#818CF8" }}>
                      Praxis
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--color-cream)] leading-[1.55] whitespace-pre-line">
                    {row.praxis}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: proper table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b border-[var(--color-edge)]">
                <th className="text-left p-5 text-[12px] uppercase tracking-[0.08em] text-[var(--color-cream-mute)] font-semibold w-1/4">
                  Area
                </th>
                <th className="text-left p-5 w-[37%]">
                  <div className="flex items-center gap-2">
                    <X size={14} weight="bold" className="text-[var(--color-cream-mute)]" />
                    <span className="text-[13px] font-semibold text-[var(--color-cream-mute)]">
                      Hiring a full-time team
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-[var(--color-cream-mute)] font-normal">
                    CMO + CTO + Sales + Legal + Ops
                  </p>
                </th>
                <th
                  className="text-left p-5 w-[37%] relative"
                  style={{
                    background: ACCENT,
                    borderRadius: "12px 12px 0 0",
                    border: `1px solid ${ACCENT_BORDER}`,
                    borderBottom: "none",
                  }}
                >
                  <div
                    aria-hidden
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: "#5B63E8", borderRadius: "12px 12px 0 0" }}
                  />
                  <div className="flex items-center gap-2">
                    <Check size={14} weight="bold" style={{ color: "#818CF8" }} />
                    <span className="text-[13px] font-semibold" style={{ color: "#818CF8" }}>
                      Praxis
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-[var(--color-cream-mute)] font-normal">
                    Nine specialists, one subscription
                  </p>
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-[var(--color-edge-subtle)]">
                  <td className="p-5 text-[13px] font-semibold text-[var(--color-cream)] align-top">
                    {row.label}
                  </td>
                  <td className="p-5 text-[14px] text-[var(--color-cream-mute)] align-top whitespace-pre-line leading-[1.6]">
                    {row.team}
                  </td>
                  <td
                    className="p-5 text-[14px] text-[var(--color-cream)] align-top whitespace-pre-line leading-[1.6]"
                    style={{ background: "rgba(91,99,232,0.07)" }}
                  >
                    {row.praxis}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
