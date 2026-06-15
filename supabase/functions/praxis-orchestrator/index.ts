// Praxis Conductor — cross-repo orchestrator.
// Watches merged PRs across all registered repos and files claude-queue issues in
// the downstream repo when one team's shipped work unblocks another (hub-and-spoke,
// Conductor as conductor). Custom auth: x-praxis-secret == PRAXIS_CRON_SECRET.
// Degrades safely: with no GITHUB_ORCHESTRATOR_TOKEN it can't reach GitHub, so it
// records the gap as an alert; any dispatch rows left in pending_auth are flushed
// automatically on the first run after the token is added. See ORCHESTRATOR.md.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const MODEL = "claude-haiku-4-5";
const PRICE = { input: 1.0, output: 5.0, cacheWrite: 1.25, cacheRead: 0.10 };
const AGENT = "conductor";
const UA = "praxis-conductor";

function j(p: unknown, s = 200) {
  return new Response(JSON.stringify(p), { status: s, headers: { "Content-Type": "application/json" } });
}
async function getSecret(admin: any, name: string): Promise<string> {
  const env = Deno.env.get(name);
  if (env) return env;
  const { data } = await admin.from("conduit_secrets").select("value").eq("name", name).maybeSingle();
  return (data?.value as string | undefined) ?? "";
}
async function callHaiku(key: string, system: string, userText: string, maxTokens = 1100) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userText }],
    }),
  });
  if (!resp.ok) { const t = await resp.text().catch(() => ""); throw new Error(`anthropic_${resp.status}: ${t.slice(0, 300)}`); }
  const data = await resp.json();
  const text = (data.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("").trim();
  const u = data.usage ?? {};
  const tokens_in = (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
  const tokens_out = u.output_tokens ?? 0;
  const cost = ((u.input_tokens ?? 0) * PRICE.input + (u.cache_creation_input_tokens ?? 0) * PRICE.cacheWrite +
    (u.cache_read_input_tokens ?? 0) * PRICE.cacheRead + (u.output_tokens ?? 0) * PRICE.output) / 1_000_000;
  return { text, tokens_in, tokens_out, cost };
}
function parseJsonArray(text: string): any[] {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try { const v = JSON.parse(cleaned); return Array.isArray(v) ? v : []; }
  catch {
    const m = cleaned.match(/\[[\s\S]*\]/);
    if (m) { try { const v = JSON.parse(m[0]); return Array.isArray(v) ? v : []; } catch {} }
    return [];
  }
}
async function gh(path: string, token: string, init?: RequestInit) {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": UA,
      ...(init?.headers ?? {}),
    },
  });
}
// Create an issue; if the target repo lacks the label (422), retry without labels
// so a missing 'claude-queue' label never silently drops a dispatch.
async function createIssue(target: string, token: string, title: string, body: string, labels: string[]) {
  let res = await gh(`/repos/${target}/issues`, token, { method: "POST", body: JSON.stringify({ title, body, labels }) });
  if (res.status === 422 && labels.length) {
    res = await gh(`/repos/${target}/issues`, token, { method: "POST", body: JSON.stringify({ title, body }) });
  }
  return res;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return j({ ok: false, error: "method" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, svc, { auth: { persistSession: false, autoRefreshToken: false } });

  const secret = await getSecret(admin, "PRAXIS_CRON_SECRET");
  if (!secret || req.headers.get("x-praxis-secret") !== secret) return j({ ok: false, error: "unauthorized" }, 401);

  const { data: cfg } = await admin.from("praxis_config").select("*").eq("id", 1).maybeSingle();
  if (!cfg) return j({ ok: false, error: "no_config" }, 500);
  if (!cfg.fleet_enabled) return j({ ok: true, agent: AGENT, skipped: "fleet_disabled" });

  const today = new Date().toISOString().slice(0, 10);
  let cfgSpend = Number(cfg.spend_today_usd);
  if (cfg.spend_date !== today) cfgSpend = 0;
  if (cfgSpend >= Number(cfg.daily_spend_cap_usd)) return j({ ok: true, agent: AGENT, skipped: "fleet_cap_reached" });

  await admin.from("praxis_agents").update({ heartbeat_at: new Date().toISOString() }).eq("name", AGENT);

  const { data: state0 } = await admin.from("praxis_orchestrator_state").select("*").eq("id", 1).maybeSingle();
  const state = state0 ?? { company_goal: "", github_polling_enabled: true };
  const key = await getSecret(admin, "ANTHROPIC_API_KEY");
  if (!key) return j({ ok: false, error: "missing_anthropic_key" }, 500);
  const ghToken = await getSecret(admin, "GITHUB_ORCHESTRATOR_TOKEN");

  // Race-tolerant accounting: append to the runs ledger; reconcile the daily
  // counter from the running total at the end (matches praxis_dispatch_ticks).
  const logRun = async (r: { tokens_in: number; tokens_out: number; cost: number }, event: string, detail: any) => {
    await admin.from("praxis_runs").insert({ agent: AGENT, event, detail, tokens_in: r.tokens_in, tokens_out: r.tokens_out, cost_usd: r.cost });
  };
  const markCreated = async (id: string, res: Response) => {
    const issue = await res.json();
    await admin.from("praxis_cross_repo_dispatches").update({ status: "created", github_issue_number: issue.number, github_issue_url: issue.html_url, dispatched_at: new Date().toISOString(), error: null }).eq("id", id);
  };
  const markFailed = async (id: string, res: Response) => {
    const t = await res.text().catch(() => "");
    await admin.from("praxis_cross_repo_dispatches").update({ status: res.status === 401 || res.status === 403 ? "pending_auth" : "error", error: `gh_${res.status}: ${t.slice(0, 200)}` }).eq("id", id);
  };

  const summary: any = { agent: AGENT, github: ghToken ? "authed" : "no_token", repos_polled: 0, prs_considered: 0, dispatches_created: 0, issues_filed: 0, flushed: 0 };

  try {
    // --- 1. Flush dispatches that were waiting on the token --------------------
    if (ghToken) {
      const { data: pending } = await admin.from("praxis_cross_repo_dispatches")
        .select("*").in("status", ["pending_auth", "ready"]).limit(20);
      for (const d of pending ?? []) {
        const res = await createIssue(d.target_repo, ghToken, d.issue_title, d.issue_body, d.labels ?? ["claude-queue"]);
        if (res.ok) { await markCreated(d.id, res); summary.flushed++; } else { await markFailed(d.id, res); }
      }
    }

    // --- 2. Poll merged PRs per repo, reason, queue downstream work ------------
    if (ghToken && state.github_polling_enabled) {
      const { data: repos } = await admin.from("praxis_repos").select("*").eq("enabled", true).eq("watch_merged_prs", true);
      const { data: allEdges } = await admin.from("praxis_repo_edges").select("*").eq("enabled", true);
      for (const repo of repos ?? []) {
        summary.repos_polled++;
        const since = repo.last_seen_merged_at ? new Date(repo.last_seen_merged_at).getTime() : 0;
        const res = await gh(`/repos/${repo.full_name}/pulls?state=closed&sort=updated&direction=desc&per_page=20`, ghToken);
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          await admin.from("praxis_repos").update({ last_polled_at: new Date().toISOString(), last_warning: `pulls_${res.status}: ${t.slice(0, 160)}` }).eq("id", repo.id);
          continue;
        }
        const pulls = await res.json();
        const merged = (pulls as any[]).filter((p) => p.merged_at && new Date(p.merged_at).getTime() > since)
          .sort((a, b) => new Date(a.merged_at).getTime() - new Date(b.merged_at).getTime());
        let newCursor = repo.last_seen_merged_at;
        const edges = (allEdges ?? []).filter((e: any) => e.from_repo === repo.full_name);
        for (const pr of merged) {
          summary.prs_considered++;
          newCursor = pr.merged_at;
          if (!edges.length) continue; // nothing downstream depends on this repo
          const sys = `You are Conductor, the cross-repo orchestrator for Luis Garcia's autonomous AI software company.\nCompany goal: ${state.company_goal}\n\nA pull request just MERGED in ${repo.full_name}. Decide whether it unblocks concrete downstream work in any dependent repo, using ONLY the dependency edges provided. Be conservative: most PRs (chores, refactors, deps, tiny fixes, docs) warrant NOTHING — return [] then. Only emit a dispatch when the merged work genuinely enables a specific next step described by an edge.\nReturn ONLY a JSON array. Each item: {"to_repo":"<owner/name from an edge>","issue_title":"<<=80 chars>","issue_body":"<concrete, actionable; reference the source PR; what to build + definition of done>","reasoning":"<one sentence>"}. The downstream repo has an autopilot that picks up issues labeled claude-queue, so write the body AS A TASK BRIEF for an engineer agent.`;
          const ask = `Source repo: ${repo.full_name}\nMerged PR #${pr.number}: ${pr.title}\nPR body:\n${(pr.body ?? "(no description)").slice(0, 1500)}\n\nDependency edges from ${repo.full_name}:\n${edges.map((e: any) => `- to ${e.to_repo} WHEN ${e.when_condition} => ${e.playbook}`).join("\n")}\n\nReturn the JSON array now.`;
          const r = await callHaiku(key, sys, ask, 1100);
          await logRun(r, "orchestrate", { source_repo: repo.full_name, pr: pr.number });
          cfgSpend += r.cost;
          const items = parseJsonArray(r.text);
          for (const it of items) {
            if (!it.to_repo || !it.issue_title || !it.issue_body) continue;
            if (!edges.some((e: any) => e.to_repo === it.to_repo)) continue; // must match an edge
            const labels = ["claude-queue"];
            const body = `${it.issue_body}\n\n---\n_Filed by Conductor (cross-repo orchestrator) because ${repo.full_name}#${pr.number} "${pr.title}" merged._\nSource PR: ${pr.html_url}\nReasoning: ${it.reasoning ?? ""}`;
            const title = String(it.issue_title).slice(0, 120);
            const ins = await admin.from("praxis_cross_repo_dispatches").insert({
              source_repo: repo.full_name, source_pr_number: pr.number, source_pr_title: pr.title, source_pr_url: pr.html_url,
              target_repo: it.to_repo, issue_title: title, issue_body: body, labels, reasoning: it.reasoning ?? null,
              status: "ready",
            }).select("id").maybeSingle();
            if (!ins.data) continue; // dedup conflict (already dispatched for this PR->repo)
            summary.dispatches_created++;
            const issRes = await createIssue(it.to_repo, ghToken, title, body, labels);
            if (issRes.ok) { await markCreated(ins.data.id, issRes); summary.issues_filed++; } else { await markFailed(ins.data.id, issRes); }
          }
        }
        await admin.from("praxis_repos").update({ last_seen_merged_at: newCursor, last_polled_at: new Date().toISOString(), last_warning: null }).eq("id", repo.id);
      }
    } else if (!ghToken) {
      // Surface the one blocking dependency, deduped to once per 12h.
      const { data: recent } = await admin.from("praxis_alerts").select("id").eq("source", "conductor").gte("created_at", new Date(Date.now() - 12 * 3600 * 1000).toISOString()).limit(1);
      if (!recent?.length) {
        await admin.from("praxis_alerts").insert({ severity: "warn", source: "conductor", message: "Conductor is live but cross-repo GitHub access is not provisioned. Add a GITHUB_ORCHESTRATOR_TOKEN secret (fine-grained PAT, Issues:write + Contents:read on the conduit repos) so it can watch merged PRs and file downstream issues.", needs_ack: true });
      }
    }

    // --- 3. Reconcile spend from the running total + stamp run ----------------
    await admin.from("praxis_config").update({ spend_today_usd: cfgSpend, spend_date: today }).eq("id", 1);
    await admin.from("praxis_orchestrator_state").update({ last_run_at: new Date().toISOString() }).eq("id", 1);
    return j({ ok: true, ...summary });
  } catch (e) {
    const msg = String((e as Error).message ?? e).slice(0, 400);
    await admin.from("praxis_agents").update({ last_error: msg }).eq("name", AGENT);
    await admin.from("praxis_runs").insert({ agent: AGENT, event: "error", detail: { error: msg } });
    return j({ ok: false, agent: AGENT, error: msg, ...summary }, 500);
  }
});
