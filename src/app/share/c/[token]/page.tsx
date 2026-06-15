import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";
import {
  DEPT_COLOR,
  DEPT_COLOR_SOFT,
  employeeLabel,
} from "@/components/conduit/EmployeeBadge";
import { MarkdownRenderer } from "@/components/conduit/MarkdownRenderer";
import type { EmployeeKey } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

const PAGE_SIZE = 200;

interface MessageRow {
  id: string;
  role: string;
  employee: string | null;
  content: string;
  created_at: string;
}

interface ConvoRow {
  id: string;
  title: string | null;
}

async function fetchSharedConversation(
  token: string,
): Promise<{ convo: ConvoRow; messages: MessageRow[] } | null> {
  const admin = createSupabaseAdminClient();

  const { data: convo } = await admin
    .from("conduit_conversations")
    .select("id, title")
    .eq("share_token", token)
    .maybeSingle();

  if (!convo) return null;

  const { data: messages } = await admin
    .from("conduit_messages")
    .select("id, role, employee, content, created_at")
    .eq("conversation_id", convo.id)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: true })
    .limit(PAGE_SIZE);

  return { convo: convo as ConvoRow, messages: (messages ?? []) as MessageRow[] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const result = await fetchSharedConversation(token);
  if (!result) return { title: "Not found — Praxis" };
  const title = result.convo.title || "Shared conversation";
  return {
    title: `${title} — Praxis`,
    description: "A conversation shared from Praxis AI specialist team.",
  };
}

const VALID_EMPLOYEES: EmployeeKey[] = [
  "jarvis",
  "marketing",
  "sales",
  "engineering",
  "finance",
  "compliance",
  "hr",
  "ops",
  "legal",
];

function asEmployee(s: string | null): EmployeeKey {
  return (s && VALID_EMPLOYEES.includes(s as EmployeeKey) ? s : "jarvis") as EmployeeKey;
}

export default async function SharedConversationPage({ params }: Props) {
  const { token } = await params;
  const result = await fetchSharedConversation(token);
  if (!result) return notFound();

  const { convo, messages } = result;
  const title = convo.title || "Praxis Conversation";

  const visibleMessages = messages.filter(
    (m: MessageRow) => m.role === "user" || (m.role === "assistant" && m.content.trim()),
  );

  return (
    <main className="praxis-root conduit-bg-canvas min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm"
        style={{ background: "color-mix(in srgb, var(--color-surface) 90%, transparent)" }}
      >
        <Link href="/" aria-label="Praxis home">
          <PraxisLogo size={28} withWordmark />
        </Link>
        <Link
          href="/auth/sign-up"
          className="text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hi)] transition-colors"
        >
          Try Praxis →
        </Link>
      </header>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        {/* Title */}
        <h1 className="serif text-2xl sm:text-3xl leading-snug mb-2 text-[var(--color-text)]">
          {title}
        </h1>
        <p className="text-xs text-[var(--color-text-muted)] mb-8">
          Read-only · Shared from Praxis
        </p>

        {/* Thread */}
        {visibleMessages.length === 0 ? (
          <div className="conduit-card p-10 text-center text-sm text-[var(--color-text-muted)]">
            This conversation has no messages.
          </div>
        ) : (
          <div className="space-y-4">
            {visibleMessages.map((m) => {
              if (m.role === "user") {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div
                      className="max-w-[85%] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed"
                      style={{
                        background: "var(--color-accent)",
                        color: "#fff",
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              }

              const emp = asEmployee(m.employee);
              const deptColor = DEPT_COLOR[emp];
              const deptColorSoft = DEPT_COLOR_SOFT[emp];
              const specialist = employeeLabel(emp);

              return (
                <div key={m.id} className="flex gap-3 items-start">
                  {/* Specialist badge */}
                  <div
                    className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold uppercase mt-0.5"
                    style={{ background: deptColorSoft, color: deptColor }}
                    title={specialist}
                  >
                    {specialist.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[10px] uppercase tracking-[0.14em] font-semibold mb-1"
                      style={{ color: deptColor }}
                    >
                      {specialist}
                    </p>
                    <div
                      className="conduit-card px-4 py-3 text-sm leading-relaxed rounded-2xl rounded-tl-sm"
                    >
                      <MarkdownRenderer content={m.content} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 pt-8 border-t border-[var(--color-border)] text-center">
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Delivered by{" "}
            <span className="font-medium text-[var(--color-text)]">Praxis</span>
            {" "}— your autonomous AI specialist team.
          </p>
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] text-white px-6 py-3 text-sm font-semibold hover:bg-[var(--color-accent-hi)] transition-colors"
          >
            Put your team to work →
          </Link>
        </div>
      </div>
    </main>
  );
}
