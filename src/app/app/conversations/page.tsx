import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Pin } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, EMPLOYEE_ICON } from "@/components/conduit/EmployeeBadge";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";
import { PinConversationButton } from "@/components/conduit/PinConversationButton";
import { ConversationLabelChip, type Label } from "@/components/conduit/ConversationLabelChip";
import { ConversationsWithLabels } from "@/components/conduit/ConversationsWithLabels";
import { ConversationLabelPicker } from "@/components/conduit/ConversationLabelPicker";

export const dynamic = "force-dynamic";

const TEAM = new Set<string>(EMPLOYEE_ORDER);
const MAX_PINNED = 5;

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

type Conversation = {
  id: string;
  title: string | null;
  updated_at: string;
  dominant_employee: string | null;
  pinned: boolean;
  labels?: Label[];
};

function ConversationRow({
  c,
  atLimit,
  allLabels,
}: {
  c: Conversation;
  atLimit: boolean;
  allLabels: Label[];
}) {
  const dom = c.dominant_employee as string | null;
  const isTeam = dom === "team";
  const empKey = (dom && TEAM.has(dom) ? dom : "jarvis") as EmployeeKey;
  const RecentIcon = EMPLOYEE_ICON[empKey];
  const color = DEPT_COLOR[empKey];

  return (
    <div className="group relative flex items-center">
      <Link
        href={`/app?c=${c.id}`}
        className="flex flex-1 items-center gap-3 px-4 py-3 rounded-lg conduit-card hover:border-[var(--color-accent)] transition-colors min-w-0"
      >
        {isTeam ? (
          <span
            aria-hidden
            className="inline-block w-5 h-5 rounded-full shrink-0"
            style={{
              background:
                "conic-gradient(from 90deg, var(--color-dept-marketing), var(--color-dept-sales), var(--color-dept-engineering), var(--color-dept-jarvis), var(--color-dept-marketing))",
            }}
          />
        ) : (
          <span
            aria-hidden
            className="inline-flex items-center justify-center shrink-0 w-5 h-5 rounded-md"
            style={{
              background: `color-mix(in srgb, ${color} 18%, var(--color-surface-elevated))`,
              color,
              boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 60%, transparent)`,
            }}
          >
            <RecentIcon size={11} strokeWidth={2.5} />
          </span>
        )}
        <span className="flex-1 min-w-0 flex items-center gap-2">
          <span className="truncate text-sm">{c.title || "Untitled chat"}</span>
          {(c.labels ?? []).slice(0, 3).map((l) => (
            <ConversationLabelChip key={l.id} label={l} />
          ))}
        </span>
        <span className="text-xs text-[var(--color-text-muted)] shrink-0 pr-2">
          {relativeDate(c.updated_at)}
        </span>
      </Link>
      {/* Hover controls: label picker + pin button */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1">
        {allLabels.length > 0 && (
          <ConversationLabelPicker
            conversationId={c.id}
            allLabels={allLabels}
            assigned={c.labels ?? []}
          />
        )}
        <PinConversationButton
          conversationId={c.id}
          pinned={c.pinned}
          atLimit={atLimit && !c.pinned}
        />
      </div>
    </div>
  );
}

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ label?: string }>;
}) {
  const current = await getCurrentAccount();
  if (!current) redirect("/auth/sign-in?next=/app/conversations");
  const { account } = current;
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  const filterLabelId = params.label ?? null;

  // Fetch labels
  const { data: labelRows } = await supabase
    .from("conduit_labels")
    .select("id, name, color")
    .eq("account_id", account.id)
    .order("created_at", { ascending: true });
  const allLabels: Label[] = labelRows ?? [];

  // Fetch conversations
  let query = supabase
    .from("conduit_conversations")
    .select("id, title, updated_at, dominant_employee, pinned")
    .eq("account_id", account.id)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(200);

  // If filtering by label, join through the assignments table
  if (filterLabelId) {
    const { data: assignments } = await supabase
      .from("conduit_conversation_labels")
      .select("conversation_id")
      .eq("label_id", filterLabelId);
    const ids = (assignments ?? []).map((a) => a.conversation_id as string);
    if (ids.length === 0) {
      query = query.in("id", ["__no_match__"]);
    } else {
      query = query.in("id", ids);
    }
  }

  const { data: rows } = await query;
  const conversations: Conversation[] = rows ?? [];

  // Fetch all label assignments for visible conversations
  const convIds = conversations.map((c) => c.id);
  const labelsByConv: Record<string, Label[]> = {};
  if (convIds.length > 0) {
    const { data: assignRows } = await supabase
      .from("conduit_conversation_labels")
      .select("conversation_id, conduit_labels(id, name, color)")
      .in("conversation_id", convIds);

    for (const row of assignRows ?? []) {
      const cid = row.conversation_id as string;
      const label = row.conduit_labels as Label | null;
      if (label) {
        labelsByConv[cid] = [...(labelsByConv[cid] ?? []), label];
      }
    }
  }

  const withLabels: Conversation[] = conversations.map((c) => ({
    ...c,
    labels: labelsByConv[c.id] ?? [],
  }));

  const pinned = withLabels.filter((c) => c.pinned);
  const unpinned = withLabels.filter((c) => !c.pinned);
  const atLimit = pinned.length >= MAX_PINNED;

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="serif text-3xl mb-2 flex items-center gap-2">
          <MessageSquare size={22} /> Conversations
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          Your full chat history — click any conversation to continue it. Hover
          to star up to {MAX_PINNED}.
        </p>

        {/* Label filter + management (client component) */}
        <ConversationsWithLabels
          allLabels={allLabels}
          filterLabelId={filterLabelId}
        />

        {conversations.length === 0 ? (
          <div className="conduit-card p-10 flex flex-col items-center text-center gap-4 max-w-sm mx-auto">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(91,99,232,0.08)",
                border: "1px solid rgba(91,99,232,0.18)",
              }}
            >
              <MessageSquare size={24} style={{ color: "var(--color-accent)" }} />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[var(--color-text)] mb-1">
                {filterLabelId ? "No conversations with this label" : "No conversations yet"}
              </p>
              <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
                {filterLabelId
                  ? "Try a different filter or label more conversations."
                  : "Ask Atlas anything — strategy, execution, or hand it to a specialist. Every exchange lives here."}
              </p>
            </div>
            {!filterLabelId && (
              <Link href="/app" className="conduit-btn-primary text-[13px] px-4 py-2">
                Start your first conversation
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pinned section */}
            {pinned.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Pin
                    size={11}
                    className="text-[var(--color-amber)]"
                    style={{ fill: "currentColor" }}
                  />
                  <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-[var(--color-text-muted)]">
                    Pinned · {pinned.length}/{MAX_PINNED}
                  </span>
                </div>
                <div className="space-y-1">
                  {pinned.map((c) => (
                    <ConversationRow key={c.id} c={c} atLimit={atLimit} allLabels={allLabels} />
                  ))}
                </div>
              </div>
            )}

            {/* All conversations */}
            {unpinned.length > 0 && (
              <div>
                {pinned.length > 0 && (
                  <div className="mb-2">
                    <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-[var(--color-text-muted)]">
                      Recent
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  {unpinned.map((c) => (
                    <ConversationRow key={c.id} c={c} atLimit={atLimit} allLabels={allLabels} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
