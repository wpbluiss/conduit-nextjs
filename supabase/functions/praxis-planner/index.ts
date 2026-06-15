// Praxis Planner — keeps every repo's claude-queue stocked with meaningful work.
// For each enabled repo: count open claude-queue issues; if below LOW_WATER, ask
// Haiku to propose the next most valuable issues (guided by the company goal, the
// repo's role, existing open titles, and recently merged PRs), then file them via
// the GITHUB_ORCHESTRATOR_TOKEN. Every filed issue goes through the dispatch outbox
// for audit. Custom auth: x-praxis-secret. Respects fleet_enabled + daily cap.
// Cron: praxis_planner, every 2h at :40. Deployed as edge fn praxis-planner.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const MODEL = "claude-haiku-4-5";
const PRICE = { input: 1.0, output: 5.0, cacheWrite: 1.25, cacheRead: 0.10 };
const AGENT = "conductor";
const UA = "praxis-planner";
const LOW_WATER = 3;   // refill when open queue drops below this
const REFILL_TO = 4;   // top up to this many

function j(p: unknown, s = 200) {
  return new Response(JSON.stringify(p), { status: s, headers: { "Content-Type": "application/json" } });
}
async function getSecret(admin: any, name: string): Promise<string> {
  const env = Deno.env.get(name);
  if (env) return env;
  const { data } = await admin.from("conduit_secrets").select("value").eq("name", name).maybeSingle();
  return (data?.value as string | undefined) ?? "";
}
async function gh(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": UA, ...(init?.headers ?? {}) },
  });
  const text = await res.text().catch(() => "");
  let body: any = null; try { body = text ? JSON.parse(text) : null; } catch {}
  return { ok: res.ok, status: res.status, body };
}
async function callHaiku(key: string, system: string, userText: string, maxTokens = 1400) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userText }] }),
  });
  if (!resp.ok) { const t = await resp.text().catch(() => ""); throw new Error(`anthropic_${resp.status}: ${t.slice(0, 200)}`); }
  const data = await resp.json();
  const text = (data.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("").trim();
  const u = data.usage ?? {};
  const cost = ((u.input_tokens ?? 0) * PRICE.input + (u.cache_creation_input_tokens ?? 0) * PRICE.cacheWrite +
    (u.cache_read_input_tokens ?? 0) * PRICE.cacheRead + (u.output_tokens ?? 0) * PRICE.output) / 1_000_000;
  return { text, tokens_in: (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0), tokens_out: u.output_tokens ?? 0, cost };
}
function parseJsonArray(text: string): any[] {
  const c = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try { const v = JSON.parse(c); return Array.isArray(v) ? v : []; }
  catch { const m = c.match(/\[[\s\S]*\]/); if (m) { try { const v = JSON.parse(m[0]); return Array.isArray(v) ? v : []; } catch {} } return []; }
}
async function createIssue(target: string, token: string, title: string, body: string, labels: string[]) {
  let res = await gh(`/repos/${target}/issues`, token, { method: "POST", body: JSON.stringify({ title, body, labels }) });
  if (res.status === 422 && labels.length) res = await gh(`/repos/${target}/issues`, token, { method: "POST", body: JSON.stringify({ title, body }) });
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
  if (!cfg?.fleet_enabled) return j({ ok: true, skipped: "fleet_disabled" });
  const today = new Date().toISOString().slice(0, 10);
  let spend = cfg.spend_date === today ? Number(cfg.spend_today_usd) : 0;
  if (spend >= Number(cfg.daily_spend_cap_usd)) return j({ ok: true, skipped: "cap_reached" });

  const key = await getSecret(admin, "ANTHROPIC_API_KEY");
  const ghToken = await getSecret(admin, "GITHUB_ORCHESTRATOR_TOKEN");
  if (!key || !ghToken) return j({ ok: false, error: "missing_secrets", missing: [!key && "ANTHROPIC_API_KEY", !ghToken && "GITHUB_ORCHESTRATOR_TOKEN"].filter(Boolean) }, 400);

  const { data: state } = await admin.from("praxis_orchestrator_state").select("company_goal").eq("id", 1).maybeSingle();
  const { data: repos } = await admin.from("praxis_repos").select("*").eq("enabled", true);
  const summary: any = { ok: true, repos_checked: 0, issues_filed: 0, details: {} };

  try {
    for (const repo of repos ?? []) {
      summary.repos_checked++;
      const open = await gh(`/repos/${repo.full_name}/issues?labels=claude-queue&state=open&per_page=20`, ghToken);
      if (!open.ok || !Array.isArray(open.body)) { summary.details[repo.full_name] = `queue_check_failed_${open.status}`; continue; }
      const openTitles = open.body.filter((i: any) => !i.pull_request).map((i: any) => i.title);
      if (openTitles.length >= LOW_WATER) { summary.details[repo.full_name] = `stocked(${openTitles.length})`; continue; }

      const merged = await gh(`/repos/${repo.full_name}/pulls?state=closed&sort=updated&direction=desc&per_page=5`, ghToken);
      const mergedTitles = Array.isArray(merged.body) ? merged.body.filter((p: any) => p.merged_at).map((p: any) => p.title) : [];
      const want = REFILL_TO - openTitles.length;

      const sys = `You are the Planner for Luis Garcia's autonomous AI software company.\nCompany goal: ${state?.company_goal ?? ""}\n\nYou keep a repo's engineering queue stocked with the NEXT MOST VALUABLE work. Issues are picked up by an autonomous Claude Code agent (it can read/write code, run builds, open PRs — it CANNOT set env vars/secrets, configure third-party dashboards, or do human-only tasks; never propose those). Propose concrete, single-session, high-leverage engineering tasks that move the company goal: user-facing features, reliability, conversion, polish, tests. Avoid duplicating existing open issues. Each issue body must be a clear task brief: goal, concrete scope, acceptance criteria. Return ONLY a JSON array of exactly ${want} items: [{"title":"<=80 chars","body":"..."}].`;
      const ask = `Repo: ${repo.full_name}\nRepo role: ${repo.role ?? ""}\nOpen queue titles (do NOT duplicate): ${JSON.stringify(openTitles)}\nRecently merged PRs: ${JSON.stringify(mergedTitles)}\nReturn the JSON array now.`;
      const r = await callHaiku(key, sys, ask, 1400);
      await admin.from("praxis_runs").insert({ agent: AGENT, event: "plan_github", detail: { repo: repo.full_name, want }, tokens_in: r.tokens_in, tokens_out: r.tokens_out, cost_usd: r.cost });
      spend += r.cost;
      if (spend >= Number(cfg.daily_spend_cap_usd)) { summary.details[repo.full_name] = "cap_hit_mid_run"; break; }

      let filed = 0;
      for (const it of parseJsonArray(r.text).slice(0, want)) {
        if (!it.title || !it.body) continue;
        const body = `${it.body}\n\n---\n_Filed by Planner (autonomous backlog keeper) to keep this repo's queue stocked toward the company goal._`;
        const ins = await admin.from("praxis_cross_repo_dispatches").insert({
          source_repo: "planner", target_repo: repo.full_name, issue_title: String(it.title).slice(0, 120), issue_body: body,
          labels: ["claude-queue"], reasoning: "planner_refill", status: "ready",
        }).select("id").maybeSingle();
        const res = await createIssue(repo.full_name, ghToken, String(it.title).slice(0, 120), body, ["claude-queue"]);
        if (res.ok && ins.data) {
          await admin.from("praxis_cross_repo_dispatches").update({ status: "created", github_issue_number: res.body?.number, github_issue_url: res.body?.html_url, dispatched_at: new Date().toISOString() }).eq("id", ins.data.id);
          filed++; summary.issues_filed++;
        } else if (ins.data) {
          await admin.from("praxis_cross_repo_dispatches").update({ status: "error", error: `gh_${res.status}` }).eq("id", ins.data.id);
        }
      }
      summary.details[repo.full_name] = `refilled(+${filed})`;
    }
    await admin.from("praxis_config").update({ spend_today_usd: spend, spend_date: today }).eq("id", 1);
    return j(summary);
  } catch (e) {
    const msg = String((e as Error).message ?? e).slice(0, 300);
    await admin.from("praxis_runs").insert({ agent: AGENT, event: "error", detail: { fn: "planner", error: msg } });
    return j({ ok: false, error: msg, ...summary }, 500);
  }
});
