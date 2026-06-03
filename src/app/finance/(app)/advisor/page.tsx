import { getAiMessages } from "@/lib/finance/data";
import { AdvisorChat } from "@/components/finance/AdvisorChat";

export const dynamic = "force-dynamic";

export default async function AdvisorPage() {
  const rows = await getAiMessages(40);
  const initial = rows.map((r) => ({
    role: r.role as "user" | "assistant",
    content: r.content,
  }));
  return (
    <div className="space-y-4">
      <div>
        <h1 className="fin-display text-2xl sm:text-3xl tracking-tight">Advisor</h1>
        <p className="text-sm text-[var(--fin-muted)] mt-1">
          Your private wealth team — celebratory on wins, honest on risk.
        </p>
      </div>
      <AdvisorChat initial={initial} />
    </div>
  );
}
