import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ArtifactsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const account = await getOrCreateAccount(supabase, user);

  const { data: artifacts } = await supabase
    .from("conduit_artifacts")
    .select("id, type, title, produced_by, created_at, conversation_id")
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="serif text-3xl mb-2">Artifacts</h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-8">
          Everything your team has produced.
        </p>
        {(!artifacts || artifacts.length === 0) && (
          <p className="text-sm text-[var(--color-text-muted)]">
            Nothing yet. Ask Marketing to write you something.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(artifacts ?? []).map((a) => (
            <Link
              key={a.id}
              href={`/app?c=${a.conversation_id}`}
              className="hairline px-4 py-4 hover:border-[var(--color-accent)] transition-colors flex flex-col gap-2"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                <FileText size={12} />
                {a.type.replace("_", " ")} · by {a.produced_by}
              </div>
              <div className="serif text-lg leading-snug">{a.title}</div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {new Date(a.created_at).toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
