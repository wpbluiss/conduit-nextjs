"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "@phosphor-icons/react";

type Cell = boolean | string;

export const COMPARISON: { row: string; values: [Cell, Cell, Cell] }[] = [
  { row: "Praxis Flow (fast model)", values: [true, true, true] },
  { row: "Praxis Depth (extended thinking)", values: [false, false, true] },
  { row: "Atlas Chief of Staff", values: [true, true, true] },
  {
    row: "Specialist employees",
    values: [
      "Marketing",
      "+ Sales, Engineering",
      "All 9 incl. Finance, Compliance, HR, Ops, Legal",
    ],
  },
  { row: "Monthly token allowance", values: ["50k", "1M", "5M"] },
  { row: "Voice mode", values: ["Voice input only", "30 min/day", "Unlimited"] },
  { row: "Roundtable mode", values: [false, "2-4 employees", "2-8 employees"] },
  { row: "Real lead pipelines (Sales)", values: [false, true, true] },
  { row: "Real builds (Engineering)", values: [false, true, true] },
  { row: "Memory rows", values: ["100", "500", "1,000"] },
  { row: "Multi-user workspace", values: [false, false, true] },
  { row: "Priority routing", values: [false, false, true] },
  { row: "Token top-ups", values: ["—", "$10/$25/$50", "$10/$25/$50"] },
];

const TIERS = [
  { label: "Free", price: "$0", colIndex: 0 as const, popular: false },
  { label: "Pro", price: "$29/mo", colIndex: 1 as const, popular: true },
  { label: "Enterprise", price: "$199/mo", colIndex: 2 as const, popular: false },
] as const;

function CellRender({ value, popular }: { value: Cell; popular?: boolean }) {
  if (value === true) {
    return (
      <Check size={18} weight="bold" color={popular ? "#5B63E8" : "#16A34A"} />
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

const TIER_CTAS = [
  <Link
    key="free"
    href="/auth/sign-up"
    className="text-[13px] text-[var(--color-indigo-500)] inline-flex items-center gap-1 hover:gap-2 transition-[gap]"
  >
    Start free <ArrowRight size={12} weight="bold" />
  </Link>,
  <Link
    key="pro"
    href="/auth/sign-up?tier=pro"
    className="conduit-btn-primary"
    style={{ padding: "10px 16px", fontSize: "13px" }}
  >
    Start Pro
  </Link>,
  <Link
    key="enterprise"
    href="mailto:luis@conduitai.io?subject=Praxis%20Enterprise"
    className="text-[13px] text-[var(--color-indigo-500)] inline-flex items-center gap-1 hover:gap-2 transition-[gap]"
  >
    Talk to founder <ArrowRight size={12} weight="bold" />
  </Link>,
];

export function PricingComparisonTable() {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(1); // default: Pro

  return (
    <>
      {/* ── Mobile view — segmented control + single-tier column ── */}
      <div className="md:hidden">
        {/* Tier selector */}
        <div
          className="flex rounded-xl p-1 mb-6"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--color-edge)" }}
          role="tablist"
          aria-label="Select pricing tier"
        >
          {TIERS.map((t) => (
            <button
              key={t.colIndex}
              role="tab"
              aria-selected={activeTab === t.colIndex}
              onClick={() => setActiveTab(t.colIndex)}
              className="flex-1 py-2 px-3 rounded-lg text-[13px] font-medium transition-all duration-200"
              style={
                activeTab === t.colIndex
                  ? {
                      background: t.popular
                        ? "rgba(91, 99, 232, 0.18)"
                        : "rgba(255,255,255,0.08)",
                      color: t.popular
                        ? "var(--color-indigo-400, #818CF8)"
                        : "var(--color-cream)",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    }
                  : {
                      color: "var(--color-cream-mute)",
                    }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tier header */}
        {TIERS.filter((t) => t.colIndex === activeTab).map((t) => (
          <div
            key={t.colIndex}
            className="mb-4 px-4 py-3 rounded-xl"
            style={{
              background: t.popular
                ? "rgba(91, 99, 232, 0.08)"
                : "rgba(255,255,255,0.03)",
              border: t.popular
                ? "1px solid rgba(91, 99, 232, 0.2)"
                : "1px solid var(--color-edge-subtle)",
            }}
          >
            {t.popular && (
              <span className="conduit-badge conduit-badge-popular mb-1 block w-fit">
                Most popular
              </span>
            )}
            <p
              className="text-[22px] leading-none"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 500, color: "var(--color-cream)" }}
            >
              {t.price}
            </p>
            <p className="mt-1 text-[12px] text-[var(--color-cream-mute)]">{t.label} plan</p>
          </div>
        ))}

        {/* Feature rows — mobile */}
        <div className="divide-y divide-[var(--color-edge-subtle)]">
          {COMPARISON.map((row) => {
            const value = row.values[activeTab];
            const popular = activeTab === 1;
            return (
              <div key={row.row} className="flex items-center justify-between py-3.5 gap-4">
                <span className="text-[14px] text-[var(--color-cream)] flex-1 min-w-0 pr-2">
                  {row.row}
                </span>
                <span className="flex-shrink-0 flex items-center">
                  <CellRender value={value} popular={popular} />
                </span>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-6 flex justify-center">
          {TIER_CTAS[activeTab]}
        </div>
      </div>

      {/* ── Desktop view — full 3-column table ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-[var(--color-edge)]">
              <th className="text-left p-5 text-[13px] uppercase tracking-[0.06em] text-[var(--color-cream-mute)] font-semibold w-1/3">
                Feature
              </th>
              <th className="text-center p-5 w-[20%]">
                <span className="conduit-caption text-[var(--color-cream-mute)]">Free</span>
                <p
                  className="text-[20px] mt-1 text-[var(--color-cream)]"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  $0
                </p>
              </th>
              <th
                className="text-center p-5 w-[20%] relative"
                style={{ background: "rgba(91, 99, 232, 0.08)", borderRadius: "12px 12px 0 0" }}
              >
                <div
                  aria-hidden
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: "var(--color-indigo-500)", borderRadius: "12px 12px 0 0" }}
                />
                <span className="conduit-caption text-[var(--color-indigo-500)]">Pro</span>
                <p
                  className="text-[20px] mt-1 text-[var(--color-cream)]"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  $29/mo
                </p>
                <div className="mt-2 flex justify-center">
                  <span className="conduit-badge conduit-badge-popular">Most popular</span>
                </div>
              </th>
              <th className="text-center p-5 w-[27%]">
                <span className="conduit-caption text-[var(--color-cream-mute)]">Enterprise</span>
                <p
                  className="text-[20px] mt-1 text-[var(--color-cream)]"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  $199/mo
                </p>
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row) => (
              <tr key={row.row} className="border-b border-[var(--color-edge-subtle)]">
                <td className="p-5 text-[14px] text-[var(--color-cream)] align-top">{row.row}</td>
                <td className="p-5 text-center align-top">
                  <CellRender value={row.values[0]} />
                </td>
                <td
                  className="p-5 text-center align-top"
                  style={{ background: "rgba(91, 99, 232, 0.07)" }}
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
              <td className="p-5 text-center">{TIER_CTAS[0]}</td>
              <td
                className="p-5 text-center"
                style={{ background: "rgba(91, 99, 232,0.04)", borderRadius: "0 0 12px 12px" }}
              >
                {TIER_CTAS[1]}
              </td>
              <td className="p-5 text-center">{TIER_CTAS[2]}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
