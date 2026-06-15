import { fmtMoney } from "@/lib/finance/constants";

export interface DayMark { day: number; amount: number; overdue: boolean }

export function BillCalendar({
  year, month, marks, todayDay,
}: {
  year: number; month: number; marks: DayMark[]; todayDay: number | null;
}) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = first.getDay(); // 0 Sun
  const byDay = new Map(marks.map((m) => [m.day, m]));
  const monthLabel = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div className="text-sm font-semibold mb-3">{monthLabel}</div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-[10px] fin-mono uppercase text-[var(--fin-muted)] pb-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`b${i}`} />;
          const m = byDay.get(day);
          const isToday = day === todayDay;
          return (
            <div
              key={day}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[11px] relative ${
                isToday ? "bg-white/10 text-white" : "text-[var(--fin-muted)]"
              } ${m ? "border border-[#ff8a3d]/30" : ""}`}
            >
              <span className={m ? "text-white font-medium" : ""}>{day}</span>
              {m && (
                <span className={`text-[8px] leading-none mt-0.5 ${m.overdue ? "text-[#f0888c]" : "text-[#ffa876]"}`}>
                  {fmtMoney(m.amount)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--fin-muted)] fin-mono">
        <span><span className="inline-block w-2 h-2 rounded-full bg-[#ffa876] mr-1" />bill due</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-[#f0888c] mr-1" />overdue</span>
      </div>
    </div>
  );
}
