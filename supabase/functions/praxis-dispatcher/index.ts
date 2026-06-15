// Praxis Dispatcher — fires wired repos' autopilot via GITHUB_ORCHESTRATOR_TOKEN.
// body.repos = explicit list (full_names) to fire; omit to fire ALL wired+enabled.
// Crank throughput without GitHub cron limits or per-repo edits. Auth: x-praxis-secret.
// Gated on fleet_enabled. NOTE: triggers GitHub Actions minutes (private repos cost!).
// Crons: praxis_dispatch_flagship (every 15m, conduit-nextjs/public) +
//        praxis_dispatch_fleet (hourly, the private wired repos).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

function j(p: unknown, s = 200) {
  return new Response(JSON.stringify(p), { status: s, headers: { "Content-Type": "application/json" } });
}
async function getSecret(admin: any, name: string): Promise<string> {
  const env = Deno.env.get(name);
  if (env) return env;
  const { data } = await admin.from("conduit_secrets").select("value").eq("name", name).maybeSingle();
  return (data?.value as string | undefined) ?? "";
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return j({ ok: false, error: "method" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, svc, { auth: { persistSession: false, autoRefreshToken: false } });

  const secret = await getSecret(admin, "PRAXIS_CRON_SECRET");
  if (!secret || req.headers.get("x-praxis-secret") !== secret) return j({ ok: false, error: "unauthorized" }, 401);

  const { data: cfg } = await admin.from("praxis_config").select("fleet_enabled").eq("id", 1).maybeSingle();
  if (!cfg?.fleet_enabled) return j({ ok: true, skipped: "fleet_disabled" });

  const token = await getSecret(admin, "GITHUB_ORCHESTRATOR_TOKEN");
  if (!token) return j({ ok: false, error: "missing_github_token" }, 400);

  let body: any = {}; try { body = await req.json(); } catch {}
  const workflow = body.workflow ?? "claude-autopilot.yml";
  const wanted: string[] | undefined = Array.isArray(body.repos) ? body.repos : undefined;

  const { data: all } = await admin.from("praxis_repos").select("full_name, default_branch").eq("enabled", true).eq("agents_wired", true);
  const repos = (all ?? []).filter((r: any) => !wanted || wanted.includes(r.full_name));

  const results: Record<string, string> = {};
  for (const r of repos) {
    const res = await fetch(`https://api.github.com/repos/${r.full_name}/actions/workflows/${workflow}/dispatches`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json", "User-Agent": "praxis-dispatcher" },
      body: JSON.stringify({ ref: r.default_branch ?? "main" }),
    });
    results[r.full_name] = res.status === 204 ? "dispatched" : `err_${res.status}`;
  }
  await admin.from("praxis_runs").insert({ agent: "conductor", event: "dispatch", detail: { workflow, results } });
  return j({ ok: true, count: Object.keys(results).length, results });
});
