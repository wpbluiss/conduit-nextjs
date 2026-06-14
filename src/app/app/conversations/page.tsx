import { redirect } from "next/navigation";
import Link from "next/link";
import { Archive, MessageSquare, Pin } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { ConversationSearchBar } from "@/components/conduit/ConversationSearchBar";
import { ConversationLabelFilter } from "@/components/conduit/ConversationLabelFilter";
import type { ConversationLabel } from "@/components/conduit/ConversationLabels";
import { BulkConversationManager } from "@/components/conduit/BulkConversationManager";
import type { ConversationItem } from "@/components/conduit/BulkConversationManager";

export const dynamic = "force-dynamic";

const MAX_PINNED = 5;

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ label?: string; q?: string; show_archived?: string }>;
}) {
  const current = await getCurrentAccount();
  if (!current) redirect("/auth/sign-in?next=/app/conversations");
  const { account } = current;
  const supabase = await createSupabaseServerClient();
  const { label: activeLabelId, show_archived } = await searchParams;
  const showArchived = show_archived === "1";

  // Fetch all account labels
  const { data: labelRows } = await supabase
    .from("conduit_conversation_labels")
    .select("id, name, color")
    .eq("account_id", account.id)
    .order("created_at", { ascending: true });
  const allLabels: ConversationLabel[] = labelRows ?? [];

  // Base query — filter by archived state (requires 044_conversation_archive migration)
  const baseQuery = supabase
    .from("conduit_conversations")
    .select("id, title, updated_at, dominant_employee, pinned, archived_at")
    .eq("account_id", account.id);

  const { data: rows } = await (showArchived
    ? baseQuery.not("archived_at", "is", null)
    : baseQuery.is("archived_at", null)
  )
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(200);

  const convoIds = (rows ?? []).map((c) => c.id as string);

  // Fetch label assignments for all fetched conversations
  const { data: assignmentRows } = convoIds.length
    ? await supabase
        .from("conduit_conversation_label_assignments")
        .select("conversation_id, label_id")
        .in("conversation_id", convoIds)
    : { data: [] };

  // Build map: conversationId → label[]
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
    title: (c.title ?? null) as string | null,
    updated_at: c.updated_at as string,
    dominant_employee: (c.dominant_employee ?? null) as string | null,
    pinned: Boolean(c.pinned),
    archived: (c as Record<string, unknown>).archived_at !== null,
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
        <div className="flex items-center justify-between mb-2">
          <h1 className="serif text-3xl flex items-center gap-2">
            <MessageSquare size={22} /> Conversations
          </h1>
          <Link
            href={showArchived ? "/app/conversations" : "/app/conversations?show_archived=1"}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: showArchived
                ? "color-mix(in srgb, var(--color-accent) 12%, transparent)"
                : "var(--color-surface-elevated)",
              border: "1px solid var(--color-border)",
              color: showArchived ? "var(--color-accent)" : "var(--color-text-muted)",
            }}
          >
            <Archive size={12} />
            {showArchived ? "Hide archived" : "Archived"}
          </Link>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          {showArchived
            ? "Archived conversations — right-click to select and unarchive in bulk."
            : "Your full chat history — click any conversation to continue it. Right-click to select and archive in bulk."}
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
                background: "rgba(91,99,232,0.08)",
                border: "1px solid rgba(91,99,232,0.18)",
              }}
            >
              {showArchived ? (
                <Archive size={24} style={{ color: "var(--color-accent)" }} />
              ) : (
                <MessageSquare size={24} style={{ color: "var(--color-accent)" }} />
              )}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[var(--color-text)] mb-1">
                {showArchived
                  ? "No archived conversations"
                  : activeLabelId
                    ? "No conversations with this label"
                    : "No conversations yet"}
              </p>
              <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
                {showArchived
                  ? "Archived conversations will appear here."
                  : activeLabelId
                    ? "Try a different label filter or start a new conversation."
                    : "Ask Atlas anything — strategy, execution, or hand it to a specialist. Every exchange lives here."}
              </p>
            </div>
            {!activeLabelId && !showArchived && (
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
            {/* Pinned section — only in default (non-archived) view */}
            {!showArchived && pinned.length > 0 && (
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
                <BulkConversationManager
                  conversations={pinned}
                  allLabels={allLabels}
                  atLimit={atLimit}
                  showArchived={false}
                />
              </div>
            )}

            {/* Recent / all section */}
            {(showArchived ? conversations : unpinned).length > 0 && (
              <div>
                {!showArchived && pinned.length > 0 && (
                  <div className="mb-2">
                    <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-[var(--color-text-muted)]">
                      Recent
                    </span>
                  </div>
                )}
                <BulkConversationManager
                  conversations={showArchived ? conversations : unpinned}
                  allLabels={allLabels}
                  atLimit={atLimit}
                  showArchived={showArchived}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
