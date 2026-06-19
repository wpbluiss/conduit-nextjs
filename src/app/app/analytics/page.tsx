import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { AnimatedStat } from "@/components/conduit/ui/AnimatedStat";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const current = await getCurrentAccount();
  if (!current) redirect("/auth/sign-in?next=/app/analytics");
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  // Last 7 days window for top three cards.
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const accountConvosQ = await supabase
    .from("conduit_conversations")
    .select("id")
    .eq("account_id", account.id);
  const convoIds = (accountConvosQ.data ?? []).map((c) => c.id as string);

  const [conversationsThisWeek, voiceSessionsThisWeek, memoryCount] =
    await Promise.all([
      convoIds.length
        ? supabase
            .from("conduit_messages")
            .select("conversation_id")
            .eq("role", "user")
            .gte("created_at", weekStart.toISOString())
            .in("conversation_id", convoIds)
        : Promise.resolve({ data: [] as { conversation_id: string }[] }),
      supabase
        .from("conduit_voice_sessions")
        .select("duration_seconds, started_at")
        .eq("account_id", account.id)
        .gte("started_at", weekStart.toISOString())
        .not("duration_seconds", "is", null),
      supabase
        .from("conduit_memory")
        .select("id", { count: "exact", head: true })
        .eq("account_id", account.id)
        .is("archived_at", null),
    ]);

  const conversationConvoIds = new Set(
    (conversationsThisWeek.data ?? []).map((m) => m.conversation_id as string),
  );
  const conversationCount = conversationConvoIds.size;

  const voiceSeconds = (voiceSessionsThisWeek.data ?? []).reduce(
    (sum, s) => sum + ((s.duration_seconds as number | null) ?? 0),
    0,
  );
  const voiceMinutes = Math.round(voiceSeconds / 60);

  const memoryNotes = memoryCount.count ?? 0;

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="cx-label">
            Praxis Console · Analytics
          </p>
          <h1 className="cx-heading-3xl mt-2">Analytics</h1>
          <p className="mt-3 cx-body text-[var(--color-text-muted)] max-w-xl">
            What your team has been up to. Last 7 days unless noted.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <Card
            label="Conversations this week"
            numericValue={conversationCount}
            sub="User-initiated turns across all employees"
          />
          <Card
            label="Voice minutes this week"
            numericValue={voiceMinutes}
            format={(n) => `${n.toLocaleString()} min`}
            sub="Talk time across solo + roundtable rooms"
          />
          <Card
            label="Memory notes saved"
            numericValue={memoryNotes}
            sub="Cross-conversation context Atlas tracks"
          />
        </div>

        <div className="conduit-card p-6 md:p-8">
          <div className="cx-label text-[var(--color-accent-hi)] mb-2">
            Coming soon
          </div>
          <h2 className="cx-heading-xl mb-3">
            More analytics coming soon
          </h2>
          <p className="cx-type-base text-[var(--color-text-muted)] leading-relaxed max-w-2xl">
            Per-employee work output, build success rate, lead conversion,
            cost-per-conversation, time-to-first-response, and a weekly
            digest you can export. The numbers above are real — the rest is
            on the way.
          </p>
        </div>
      </div>
    </div>
  );
}

function Card({
  label,
  numericValue,
  format,
  sub,
}: {
  label: string;
  numericValue: number;
  format?: (n: number) => string;
  sub: string;
}) {
  return (
    <div className="conduit-card p-5">
      <div className="cx-label">
        {label}
      </div>
      <div className="mt-2">
        <AnimatedStat value={numericValue} format={format} />
      </div>
      <div className="cx-type-xs text-[var(--color-text-muted)] mt-1.5 leading-snug">
        {sub}
      </div>
    </div>
  );
}
