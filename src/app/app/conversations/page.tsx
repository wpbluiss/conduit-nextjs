import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { ConversationSearchBar } from "@/components/conduit/ConversationSearchBar";
import type { ConversationLabel } from "@/components/conduit/ConversationLabels";
import { ConversationLabelFilter } from "@/components/conduit/ConversationLabelFilter";
import {
  ConversationBulkSelect,
  type ConversationItem,
} from "@/components/conduit/ConversationBulkSelect";
import Link from "next/link";

export const dynamic = "force-dynamic";

const MAX_PINNED = 5;

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

  const { data: labelRows } = await supabase
    .from("conduit_conversation_labels")
    .select("id, name, color")
    .eq("account_id", account.id)
    .order("created_at", { ascending: true });
  const allLabels: ConversationLabel[] = labelRows ?? [];

  const { data: rows } = await supabase
    .from("conduit_conversations")
    .select("id, title, updated_at, dominant_employee, pinned, archived_at")
    .eq("account_id", account.id)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(200);

  const convoIds = (rows ?? []).map((c) => c.id as string);

  const { data: assignmentRows } = convoIds.length
    ? await supabase
        .from("conduit_conversation_label_assignments")
        .select("conversation_id, label_id")
        .in("conversation_id", convoIds)
    : { data: [] };

  const labelMap = new Map<string, ConversationLabel[]>();
  const labelById = new Map(allLabels.map((l) => [l.id, l]));
  for (const a of assignmentRows ?? []) {
    const cid = a.conversation_id as string;
    const lbl = labelById.get(a.label_id as string);
    if (!lbl) continue;
    if (!labelMap.has(cid)) labelMap.set(cid, []);
    labelMap.get(cid)!.push(lbl);
  }

  let conversations: ConversationItem[] = (rows ?? []).map((c) => ({
    id: c.id as string,
    title: c.title as string | null,
    updated_at: c.updated_at as string,
    dominant_employee: c.dominant_employee as string | null,
    pinned: Boolean(c.pinned),
    archived: Boolean((c as Record<string, unknown>).archived_at),
    labels: labelMap.get(c.id as string) ?? [],
  }));

  if (activeLabelId) {
    conversations = conversations.filter((c) =>
      c.labels.some((l) => l.id === activeLabelId),
    );
  }

  const hasConversations = conversations.length > 0;

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

        {allLabels.length > 0 && (
          <ConversationLabelFilter
            labels={allLabels}
            activeLabelId={activeLabelId ?? null}
          />
        )}

        {!hasConversations ? (
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
          <ConversationBulkSelect
            conversations={conversations}
            allLabels={allLabels}
            maxPinned={MAX_PINNED}
          />
        )}
      </div>
    </div>
  );
}
