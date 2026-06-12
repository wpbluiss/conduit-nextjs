import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Minus,
} from "@phosphor-icons/react/dist/ssr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Pricing from "@/components/Pricing";
import { AnalyticsPageView } from "@/components/conduit/AnalyticsPageView";
import { PageHeader } from "@/components/marketing/PageHeader";

export const metadata: Metadata = {
  title: "Pricing — Three tiers, one workforce",
  description:
    "Free, Pro $29/mo, Enterprise $199/mo. Praxis Flow on every tier; Praxis Depth on Enterprise. Top up tokens any time.",
  openGraph: {
    title: "Pricing — Three tiers, one workforce",
    description:
      "Free, Pro $29/mo, Enterprise $199/mo. Praxis Flow on every tier; Praxis Depth on Enterprise. Top up tokens any time.",
    url: "https://conduitai.io/pricing",
    siteName: "Conduit AI",
    type: "website",
    images: [{ url: "/praxis-mark.png", width: 632, height: 961, alt: "Praxis" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — Three tiers, one workforce",
    description:
      "Free, Pro $29/mo, Enterprise $199/mo. Praxis Flow on every tier; Praxis Depth on Enterprise.",
    images: ["/praxis-mark.png"],
  },
};

type Cell = boolean | string;

const COMPARISON: { row: string; values: [Cell, Cell, Cell] }[] = [
  { row: "Praxis Flow (fast model)", values: [true, true, true] },
  { row: "Praxis Depth (extended thinking)", values: [false, false, true] },
  {
    row: "Atlas Chief of Staff",
    values: [true, true, true],
  },
  {
    row: "Specialist employees",
    values: ["Marketing", "+ Sales, Engineering", "All 9 incl. Finance, Compliance, HR, Ops, Legal"],
  },
  {
    row: "Monthly token allowance",
    values: ["50k", "1M", "5M"],
  },
  {
    row: "Voice mode",
    values: ["Voice input only", "30 min/day", "Unlimited"],
  },
  {
    row: "Roundtable mode",
    values: [false, "2-4 employees", "2-8 employees"],
  },
  {
    row: "Real lead pipelines (Sales)",
    values: [false, true, true],
  },
  {
    row: "Real builds (Engineering)",
    values: [false, true, true],
  },
  {
    row: "Memory rows",
    values: ["100", "500", "1,000"],
  },
  {
    row: "Multi-user workspace",
    values: [false, false, true],
  },
  {
    row: "Priority routing",
    values: [false, false, true],
  },
  {
    row: "Token top-ups",
    values: ["—", "$10/$25/$50", "$10/$25/$50"],
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Can I top up tokens?",
    a: "Yes. Pro and Enterprise can buy $10, $25, or $50 token packs from /app/settings/billing. Top-ups never expire. Free is allowance-only — upgrade to Pro to enable top-ups.",
  },
  {
    q: "What is Praxis Depth?",
    a: "Praxis Flow is the fast model — the one running on most turns. Praxis Depth is the extended-thinking variant: longer reasoning, harder problems, deeper analysis. Atlas decides when Depth is worth it, and it's available on Enterprise. Free and Pro both run Flow.",
  },
  {
    q: "How does multi-user work?",
    a: "Enterprise unlocks multi-user workspaces — invite teammates with role-based access, share memory, run roundtable as a team. The implementation is rolling out across Q3 2026; today it's a single-seat with the upgrade path stamped in.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — through /app/settings/billing or by emailing luis@conduitai.io. We'll prorate the unused portion. No multi-month contracts on Pro; Enterprise is month-to-month or annual at your choice.",
  },
  {
    q: "What happens when I hit the token cap?",
    a: "Free tier turns off the chat with a friendly notice when you hit the cap. Pro and Enterprise prompt you to top up. The cap rolls over automatically at the start of your next billing cycle.",
  },
  {
    q: "Do you offer custom enterprise plans?",
    a: "Yes — for teams replacing whole departments or running on-prem-style isolation, email luis@conduitai.io. We'll talk through token volume, employee customization, and SLA.",
  },
];

function CellRender({ value, popular }: { value: Cell; popular?: boolean }) {
  if (value === true) {
    return (
      <Check
        size={18}
        weight="bold"
        color={popular ? "#5B63E8" : "#9DD8B1"}
      />
    );
  }
  if (value === false) {
    return <Minus size={16} weight="regular" color="#5A5248" />;
  }
  return (
    <span className="text-[13px] text-[var(--color-cream-soft)] leading-[1.5]">
      {value}
    </span>
  );
}

export default function PricingPage() {
  return (
    <main className="conduit-bg-canvas">
      <AnalyticsPageView />
      <Navbar />

      <PageHeader
        caption="Pricing"
        title={
          <>
            Three tiers.{" "}
            <span className="conduit-ember-text">One workforce.</span>
          </>
        }
        subtitle="Free to start. Pro for solo founders running a real business. Enterprise for teams replacing whole departments. Top up tokens any time, no commitment."
      />

      {/* Tier cards (reuses homepage Pricing section) */}
      <Pricing />

      {/* Comparison table */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="max-w-[760px] mb-12 md:mb-16">
            <p className="conduit-caption conduit-caption-ember">Compare</p>
            <h2 className="conduit-display-2xl mt-5">
              Every line, side by side.
            </h2>
          </div>

          <div className="overflow-x-auto -mx-6 md:mx-0">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-[var(--color-edge)]">
                  <th className="text-left p-5 text-[13px] uppercase tracking-[0.06em] text-[var(--color-cream-mute)] font-semibold w-1/3">
                    Feature
                  </th>
                  <th className="text-center p-5 w-[20%]">
                    <span className="conduit-caption text-[var(--color-cream-mute)]">
                      Free
                    </span>
                    <p
                      className="text-[20px] mt-1 text-[var(--color-cream)]"
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontWeight: 500,
                      }}
                    >
                      $0
                    </p>
                  </th>
                  <th
                    className="text-center p-5 w-[20%] relative"
                    style={{
                      background: "rgba(91, 99, 232,0.04)",
                      borderRadius: "12px 12px 0 0",
                    }}
                  >
                    <span className="conduit-caption text-[var(--color-indigo-500)]">
                      Pro
                    </span>
                    <p
                      className="text-[20px] mt-1 text-[var(--color-cream)]"
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontWeight: 500,
                      }}
                    >
                      $29/mo
                    </p>
                  </th>
                  <th className="text-center p-5 w-[27%]">
                    <span className="conduit-caption text-[var(--color-cream-mute)]">
                      Enterprise
                    </span>
                    <p
                      className="text-[20px] mt-1 text-[var(--color-cream)]"
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontWeight: 500,
                      }}
                    >
                      $199/mo
                    </p>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr
                    key={row.row}
                    className="border-b border-[var(--color-edge-subtle)]"
                  >
                    <td className="p-5 text-[14px] text-[var(--color-cream)] align-top">
                      {row.row}
                    </td>
                    <td className="p-5 text-center align-top">
                      <CellRender value={row.values[0]} />
                    </td>
                    <td
                      className="p-5 text-center align-top"
                      style={{ background: "rgba(91, 99, 232,0.04)" }}
                    >
                      <CellRender value={row.values[1]} popular />
                    </td>
                    <td className="p-5 text-center align-top">
                      <CellRender value={row.values[2]} />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td />
                  <td className="p-5 text-center">
                    <Link
                      href="/auth/sign-up"
                      className="text-[13px] text-[var(--color-indigo-500)] inline-flex items-center gap-1 hover:gap-2 transition-[gap]"
                    >
                      Start free
                      <ArrowRight size={12} weight="bold" />
                    </Link>
                  </td>
                  <td
                    className="p-5 text-center"
                    style={{
                      background: "rgba(91, 99, 232,0.04)",
                      borderRadius: "0 0 12px 12px",
                    }}
                  >
                    <Link
                      href="/auth/sign-up?tier=pro"
                      className="conduit-btn-primary"
                      style={{ padding: "10px 16px", fontSize: "13px" }}
                    >
                      Start Pro
                    </Link>
                  </td>
                  <td className="p-5 text-center">
                    <Link
                      href="mailto:luis@conduitai.io?subject=Praxis%20Enterprise"
                      className="text-[13px] text-[var(--color-indigo-500)] inline-flex items-center gap-1 hover:gap-2 transition-[gap]"
                    >
                      Talk to founder
                      <ArrowRight size={12} weight="bold" />
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="conduit-prose">
            <p className="conduit-caption conduit-caption-ember">FAQ</p>
            <h2 className="conduit-display-2xl mt-5">
              Common questions, answered straight.
            </h2>

            <dl className="mt-12 space-y-3">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="conduit-card group p-6 md:p-7 cursor-pointer [&_summary]:list-none"
                >
                  <summary className="flex items-start justify-between gap-4">
                    <dt
                      className="text-[18px] md:text-[20px] tracking-[-0.01em] text-[var(--color-cream)]"
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontWeight: 500,
                      }}
                    >
                      {item.q}
                    </dt>
                    <span
                      aria-hidden
                      className="shrink-0 mt-1.5 w-6 h-6 rounded-full bg-[var(--color-ink-surface-elevated)] border border-[var(--color-edge)] flex items-center justify-center text-[var(--color-cream-mute)] group-hover:text-[var(--color-indigo-500)] group-hover:border-[var(--color-indigo-500)] transition-colors group-open:rotate-45 duration-300"
                      style={{ fontSize: "14px" }}
                    >
                      +
                    </span>
                  </summary>
                  <dd className="text-[15px] md:text-[16px] mt-4 text-[var(--color-cream-soft)] leading-[1.7]">
                    {item.a}
                  </dd>
                </details>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="conduit-section conduit-bg-canvas border-t border-[var(--color-edge-subtle)]">
        <div className="conduit-container">
          <div className="conduit-prose text-center">
            <p className="conduit-caption conduit-caption-ember">
              Need more?
            </p>
            <h2 className="conduit-display-xl mt-5">
              Custom token volumes, isolation, SLAs.
            </h2>
            <p className="conduit-body-lg mt-5">
              For teams replacing whole departments, ask about custom
              enterprise plans. Direct line, no sales gauntlet.
            </p>
            <Link
              href="mailto:luis@conduitai.io?subject=Praxis%20custom%20enterprise"
              className="conduit-btn-primary mt-9 inline-flex"
            >
              Email luis@conduitai.io
              <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
