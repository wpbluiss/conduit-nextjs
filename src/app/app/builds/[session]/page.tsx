// Cinema route — durable URL for one Engineering build.
// Contract: specs/engineering-build-trust/contracts/cinema-route.md

import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { BuildCinema } from "@/components/conduit/builds/cinema/BuildCinema";
import { PraxisRoomBinder } from "@/components/conduit/praxis/PraxisCanvasTintProvider";
import type { SessionRow, LogRow } from "@/hooks/useBuildSession";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ session: string }>;
}

export default async function CinemaPage({ params }: Ctx) {
  const { session: sessionId } = await params;
  if (!sessionId) notFound();

  const current = await getCurrentAccount();
  if (!current) {
    redirect(`/auth/sign-in?next=/app/builds/${sessionId}`);
  }
  const { account } = current;

  const supabase = await createSupabaseServerClient();

  const [{ data: sessionRow }, { data: logRows }] = await Promise.all([
    supabase
      .from("conduit_engineering_sessions")
      .select(
        "id, prompt, build_type, status, deploy_url, github_repo, total_input_tokens, total_output_tokens, error_message, started_at, completed_at, created_at, parent_session_id, conversation_id",
      )
      .eq("id", sessionId)
      .maybeSingle(),
    supabase
      .from("conduit_engineering_logs")
      .select("id, ts, level, message")
      .eq("session_id", sessionId)
      .order("ts", { ascending: true })
      .limit(200),
  ]);

  if (!sessionRow) {
    // RLS-scoped lookup returns null for not-owned + truly-not-found.
    notFound();
  }

  const internalAccount = Boolean(account.internal_account);
  const initialSession = sessionRow as unknown as SessionRow;
  const initialLogs = (logRows ?? []) as unknown as LogRow[];

  return (
    <>
      <PraxisRoomBinder employee="engineering" />
      <BuildCinema
        initialSession={initialSession}
        initialLogs={initialLogs}
        internalAccount={internalAccount}
      />
    </>
  );
}
