import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Pin } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, EMPLOYEE_ICON } from "@/components/conduit/EmployeeBadge";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";
import { PinConversationButton } from "@/components/conduit/PinConversationButton";
import { ConversationSearchBar } from "@/components/conduit/ConversationSearchBar";
import { ConversationLabelsDisplay, ConversationLabelManager } from "@/components/conduit/ConversationLabels";
import type { ConversationLabel } from "@/components/conduit/ConversationLabels";
import { ConversationLabelFilter } from "@/components/conduit/ConversationLabelFilter";
import { ConversationTitleEditor } from "@/components/conduit/ConversationTitleEditor";

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
  labels: ConversationLabel[];
};

function ConversationRow({
  c,
  atLimit,
  allLabels,
}: {
  c: Conversation;
  atLimit: boolean;
  allLabels: ConversationLabel[];
}) {
  const dom = c.dominant_employee as string | null;
  const isTeam = dom === "team";
  const empKey = (dom && TEAM.has(dom) ? dom : "jarvis") as EmployeeKey;
  const RecentIcon = EMPLOYEE_ICON[empKey];
  const color = DEPT_COLOR[empKey];

  return (
    <div className="group relative flex flex-col gap-1.5 px-4 py-3 rounded-lg conduit-card hover:border-[var(--color-accent)] transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <Link href={`/app?c=${c.id}`} className="flex items-center shrink-0" tabIndex={-1} aria-hidden>
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
        </Link>
        <ConversationTitleEditor conversationId={c.id} initialTitle={c.title} />
        <Link
          href={`/app?c=${c.id}`}
          aria-label={`Open ${c.title || "Untitled chat"}`}
          className="text-xs text-[var(--color-text-muted)] shrink-0 pr-2 hover:text-[var(--color-text)] transition-colors"
        >
          {relativeDate(c.updated_at)}
        </Link>
        <div className="shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <PinConversationButton
            conversationId={c.id}
            pinned={c.pinned}
            atLimit={atLimit && !c.pinned}
          />
        </div>
      </div>
      {/* Labels row */}
      <div className="pl-8">
        <ConversationLabelManager
          conversationId={c.id}
          assignedLabels={c.labels}
          allLabels={allLabels}
          onUpdate={() => {}}
        />
      </div>
    </div>
  );
}

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ label?: string; q?: string }>;
}) {
  const current = await getCurrentAccount();
  if (!current) redirect("/auth/sign-in?next=/app/conversations");
  const { account } = current;
  const supabase = await createSupabaseServerClient();
  const { label: activeLabelId } = await searchParams;

  // Fetch all account labels
  const { data: labelRows } = await supabase
    .from("conduit_conversation_labels")
    .select("id, name, color")
    .eq("account_id", account.id)
    .order("created_at", { ascending: true });
  const allLabels: ConversationLabel[] = labelRows ?? [];

  // Fetch conversations with their label assignments
  const convoQuery = supabase
    .from("conduit_conversations")
    .select("id, title, updated_at, dominant_employee, pinned")
    .eq("account_id", account.id)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(200);

  const { data: rows } = await convoQuery;
  const convoIds = (rows ?? []).map((c) => c.id as string);

  // Fetch label assignments for all fetched conversations
  const { data: assignmentRows } = convoIds.length
    ? await supabase
        .from("conduit_conversation_label_assignments")
        .select("conversation_id, label_id")
        .in("conversation_id", convoIds)
    : { data: [] };

  // Build a map: conversationId → label[]
  const labelMap = new Map<string, ConversationLabel[]>();
  const labelById = new Map(allLabels.map((l) => [l.id, l]));
  for (const a of assignmentRows ?? []) {
    const cid = a.conversation_id as string;
    const lbl = labelById.get(a.label_id as string);
    if (!lbl) continue;
    if (!labelMap.has(cid)) labelMap.set(cid, []);
    labelMap.get(cid)!.push(lbl);
  }

  let conversations: Conversation[] = (rows ?? []).map((c) => ({
    id: c.id as string,
    title: c.title as string | null,
    updated_at: c.updated_at as string,
    dominant_employee: c.dominant_employee as string | null,
    pinned: Boolean(c.pinned),
    labels: labelMap.get(c.id as string) ?? [],
  }));

  // Apply label filter if present
  if (activeLabelId) {
    conversations = conversations.filter((c) =>
      c.labels.some((l) => l.id === activeLabelId),
    );
  }

  const pinned = conversations.filter((c) => c.pinned);
  const unpinned = conversations.filter((c) => !c.pinned);
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

        <ConversationSearchBar />

        {/* Label filter chips */}
        {allLabels.length > 0 && (
          <ConversationLabelFilter
            labels={allLabels}
            activeLabelId={activeLabelId ?? null}
          />
        )}

        {conversations.length === 0 ? (
          <div className="conduit-card p-10 flex flex-col items-center text-center gap-4 max-w-sm mx-auto">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "var(--cx-accent-tint)",
                border: "1px solid rgba(124,108,255,0.20)",
              }}
            >
              <MessageSquare size={24} style={{ color: "var(--color-accent)" }} />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[var(--color-text)] mb-1">
                {activeLabelId ? "No conversations with this label" : "No conversations yet"}
              </p>
              <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
                {activeLabelId
                  ? "Try a different label filter or start a new conversation."
                  : "Ask Atlas anything — strategy, execution, or hand it to a specialist. Every exchange lives here."}
              </p>
            </div>
            {!activeLabelId && (
              <Link
                href="/app"
                className="conduit-btn-primary text-[13px] px-4 py-2"
              >
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
