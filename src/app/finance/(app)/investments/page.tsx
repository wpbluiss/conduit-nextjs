import { getSnapshot, refreshInvestmentPrices } from "@/lib/finance/data";
import { investmentsValue, investmentsCost } from "@/lib/finance/compute";
import { fmtMoney, INVESTMENT_BUCKETS } from "@/lib/finance/constants";
import { logInvestmentBuy } from "@/lib/finance/actions";
import { Card, SectionTitle, Pill, EmptyState } from "@/components/finance/ui";
import { MetricCard } from "@/components/finance/MetricCard";
import { FormModal, Field, SelectField } from "@/components/finance/forms";
import { UpdatePriceModal } from "@/components/finance/RowControls";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import type { Investment } from "@/lib/finance/types";

export const dynamic = "force-dynamic";

const bucketMeta: Record<string, { label: string; color: string }> = {
  luis: { label: "Luis", color: "#d9532a" },
  delia: { label: "Delia", color: "#ff8a3d" },
  daughter: { label: "Daughter (custodial)", color: "#ffa876" },
};

export default async function InvestmentsPage() {
  await refreshInvestmentPrices(); // live market sync before we read
  const snap = await getSnapshot();
  if (!snap) return null;
  const value = investmentsValue(snap.investments);
  const cost = investmentsCost(snap.investments);
  const gain = value - cost;
  const gainPct = cost > 0 ? (gain / cost) * 100 : 0;

  const buyModal = (
    <FormModal
      trigger={<><Plus size={16} /> Log a buy</>}
      triggerVariant="animate"
      title="Log an investment buy"
      description="e.g. bought $40 VOO in Delia's account."
      action={logInvestmentBuy}
    >
      <SelectField label="Bucket" name="bucket"
        options={INVESTMENT_BUCKETS.map((b) => ({ value: b, label: bucketMeta[b].label }))} defaultValue="luis" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ticker" name="ticker" placeholder="VOO" required />
        <Field label="Amount $" name="amount" type="number" step="0.01" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price / share" name="price" type="number" step="0.01" />
        <Field label="Date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
      </div>
      <Field label="Notes" name="notes" />
    </FormModal>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="fin-display text-2xl sm:text-3xl tracking-tight">Investments</h1>
          <p className="text-sm text-[var(--fin-muted)] mt-1">The long game — separate from the 15-month engine.</p>
        </div>
        {buyModal}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total value" value={value} tone="cyan" glow />
        <MetricCard label="Invested" value={cost} tone="violet" delay={0.05} />
        <MetricCard label="Gain / loss" value={gain} tone={gain >= 0 ? "green" : "pink"} delay={0.1} />
        <MetricCard label="Return" value={gainPct} prefix="" suffix="%" decimals={1} tone={gain >= 0 ? "green" : "pink"} delay={0.15} />
      </div>

      <Card className="!p-4">
        <p className="text-[12px] text-[var(--fin-muted)]">
          Honest horizon: the down payment is your 15-month priority. Investing compounds over years — keep
          contributions small and steady (Luis $25–50/check, Delia $25, Daughter $5–15) and don&apos;t expect
          short-term gains to move the home goal. <span className="text-[#7cc6a0]">Prices sync live</span> — crypto via
          CoinGecko, stocks &amp; ETFs via market data — every time you open this page.
        </p>
      </Card>

      {INVESTMENT_BUCKETS.map((bucket) => {
        const holdings = snap.investments.filter((i) => i.bucket === bucket);
        const bv = investmentsValue(holdings);
        const bc = investmentsCost(holdings);
        return (
          <Card key={bucket}>
            <SectionTitle
              eyebrow={bucketMeta[bucket].label}
              title={`${fmtMoney(bv)} · ${bc > 0 ? (((bv - bc) / bc) * 100).toFixed(1) : "0.0"}%`}
            />
            {holdings.length === 0 ? (
              <EmptyState>No holdings in this bucket yet.</EmptyState>
            ) : (
              <div className="divide-y divide-white/5">
                {holdings.map((h: Investment) => {
                  const hv = Number(h.shares) * Number(h.current_price);
                  const hg = hv - Number(h.cost_basis);
                  const hgp = h.cost_basis > 0 ? (hg / Number(h.cost_basis)) * 100 : 0;
                  return (
                    <div key={h.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{h.ticker}</span>
                          <Pill>{Number(h.shares).toFixed(4)} sh</Pill>
                        </div>
                        <div className="text-[11px] text-[var(--fin-muted)] mt-0.5">
                          Invested {fmtMoney(Number(h.cost_basis))} · @ {fmtMoney(Number(h.current_price), { cents: true })}/sh
                          {h.last_price_update && ` · upd ${new Date(h.last_price_update).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-semibold">{fmtMoney(hv, { cents: true })}</div>
                          <div className={`text-[11px] ${hg >= 0 ? "text-[#7cc6a0]" : "text-[#ffa876]"}`}>
                            {hg >= 0 ? "+" : ""}{fmtMoney(hg)} ({hgp.toFixed(1)}%)
                          </div>
                        </div>
                        <UpdatePriceModal id={h.id} ticker={h.ticker} price={Number(h.current_price)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
