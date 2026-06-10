import { getSnapshot } from "@/lib/finance/data";
import { PLANS, isPlus } from "@/lib/finance/plan";
import { Card, GradientText, Pill } from "@/components/finance/ui";
import { UpgradeButton, ManageBillingButton } from "@/components/finance/BillingButtons";
import { Check, Sparkle } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export default async function UpgradePage() {
  const snap = await getSnapshot();
  if (!snap) return null;
  const plus = isPlus(snap.household);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <div className="fin-mono text-[11px] uppercase tracking-[0.24em] text-[var(--fin-muted)]">Plans</div>
        <h1 className="fin-display text-2xl sm:text-3xl tracking-tight mt-1">
          {plus ? <>You&apos;re on <GradientText>Cadence Plus</GradientText></> : <>Unlock <GradientText>Cadence Plus</GradientText></>}
        </h1>
        <p className="text-sm text-[var(--fin-muted)] mt-1">
          {plus ? "Thanks for supporting Cadence — everything's unlocked." : "Bank sync, unlimited AI advisor, and the full private-bank experience."}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {(["free", "plus"] as const).map((key) => {
          const p = PLANS[key];
          const isThis = key === "plus" ? plus : !plus;
          return (
            <Card key={key} glow={key === "plus"} className={key === "plus" ? "" : "opacity-90"}>
              <div className="flex items-center justify-between">
                <div className="font-semibold flex items-center gap-2">
                  {key === "plus" && <Sparkle size={16} weight="fill" className="text-[#ffa876]" />}
                  {p.name}
                </div>
                {isThis && <Pill tone="green">current</Pill>}
              </div>
              <div className="mt-2">
                <span className="text-3xl font-semibold">{p.price}</span>
                {key === "plus" && <span className="text-sm text-[var(--fin-muted)]">/mo</span>}
              </div>
              <p className="text-xs text-[var(--fin-muted)] mt-1">{p.blurb}</p>
              <ul className="mt-4 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check size={15} className="text-[#ffa876] mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {key === "plus" && (
                <div className="mt-5">
                  {plus ? <ManageBillingButton /> : <UpgradeButton />}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <p className="text-[11px] text-[var(--fin-muted)]">
        Cancel anytime. Cadence is a budgeting &amp; education tool, not financial advice.
      </p>
    </div>
  );
}
