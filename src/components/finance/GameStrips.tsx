import { Card } from "./ui";
import { fmtMoney } from "@/lib/finance/constants";
import type { Quest } from "@/lib/finance/gamify";
import type { ActivityItem } from "@/lib/finance/compute";
import { CheckCircle, Circle } from "@phosphor-icons/react/dist/ssr";

export function QuestsCard({ quests }: { quests: Quest[] }) {
  const done = quests.filter((q) => q.done).length;
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="fin-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fin-muted)]">This week&apos;s quests</div>
        <span className="text-[11px] text-[#ffa876]">{done}/{quests.length} done</span>
      </div>
      <div className="space-y-2">
        {quests.map((q) => (
          <div key={q.label} className="flex items-center justify-between text-sm">
            <span className={`flex items-center gap-2 ${q.done ? "text-white" : "text-[var(--fin-muted)]"}`}>
              {q.done
                ? <CheckCircle size={16} weight="fill" className="text-[#7cc6a0]" />
                : <Circle size={16} className="text-white/20" />}
              <span>{q.emoji} {q.label}</span>
            </span>
            <span className={`text-[11px] fin-mono ${q.done ? "text-[#7cc6a0]" : "text-[var(--fin-muted)]"}`}>+{q.xp} XP</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return null;
  return (
    <Card>
      <div className="fin-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fin-muted)] mb-3">Together · recent moves</div>
      <div className="space-y-2.5">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 min-w-0">
              <span>{it.emoji}</span>
              <span className="truncate">
                <span className={it.person === "Luis" ? "text-[#ffa876]" : it.person === "Delia" ? "text-[#7cc6a0]" : "text-white"}>{it.person}</span>
                <span className="text-[var(--fin-muted)]"> {it.text}</span>
              </span>
            </span>
            <span className={`shrink-0 fin-mono text-xs ${it.amount < 0 ? "text-[var(--fin-muted)]" : "text-white"}`}>
              {it.amount < 0 ? "−" : "+"}{fmtMoney(Math.abs(it.amount))}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
