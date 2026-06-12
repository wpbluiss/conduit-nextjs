// Praxis — Atlas board brief + outbound "ETA call" / Telegram text.
// Composes a status brief from the fleet's own data, logs it, texts Luis via the
// Jarvis/Atlas Telegram bot, and (when Vapi creds exist) phones him to read it out.
// Custom auth: x-praxis-secret.
// Call needs: VAPI_API_KEY, VAPI_PHONE_NUMBER_ID, VAPI_ATLAS_ASSISTANT_ID + a target
// (body.to or OWNER_PHONE). Text needs: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const MODEL = "claude-haiku-4-5";
const PRICE = { input: 1.0, output: 5.0, cacheWrite: 1.25, cacheRead: 0.10 };

function j(p: unknown, s = 200) {
  return new Response(JSON.stringify(p), { status: s, headers: { "Content-Type": "application/json" } });
}
async function getSecret(admin: any, name: string): Promise<string> {
  const env = Deno.env.get(name);
  if (env) return env;
  const { data } = await admin.from("conduit_secrets").select("value").eq("name", name).maybeSingle();
  return (data?.value as string | undefined) ?? "";
}
async function callHaiku(key: string, system: string, userText: string, maxTokens = 700) {
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
function parseObj(text: string): any {
  const c = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(c); } catch { const m = c.match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]); } catch {} } return {}; }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return j({ ok: false, error: "method" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, svc, { auth: { persistSession: false, autoRefreshToken: false } });

  const secret = await getSecret(admin, "PRAXIS_CRON_SECRET");
  if (!secret || req.headers.get("x-praxis-secret") !== secret) return j({ ok: false, error: "unauthorized" }, 401);

  let body: any = {}; try { body = await req.json(); } catch {}
  const kind = body.kind ?? "eta";
  const wantCall = body.call === true;     // call only when explicitly asked (Vapi costs)
  const wantText = body.text !== false;    // text by default
  const today = new Date().toISOString().slice(0, 10);

  const key = await getSecret(admin, "ANTHROPIC_API_KEY");
  if (!key) return j({ ok: false, error: "missing_anthropic_key" }, 500);

  try {
    // --- Gather metrics from the fleet's own data ---------------------------
    const [{ data: cfg }, { data: state }] = await Promise.all([
      admin.from("praxis_config").select("spend_today_usd, daily_spend_cap_usd").eq("id", 1).maybeSingle(),
      admin.from("praxis_orchestrator_state").select("company_goal, last_run_at").eq("id", 1).maybeSingle(),
    ]);
    const { data: tasks } = await admin.from("praxis_tasks").select("status, updated_at");
    const counts: Record<string, number> = {};
    let doneToday = 0;
    for (const t of tasks ?? []) {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
      if (t.status === "done" && String(t.updated_at).slice(0, 10) === today) doneToday++;
    }
    const { count: dispTotal } = await admin.from("praxis_cross_repo_dispatches").select("id", { count: "exact", head: true });
    const { count: dispToday } = await admin.from("praxis_cross_repo_dispatches").select("id", { count: "exact", head: true }).gte("created_at", today + "T00:00:00Z");
    const { data: blockers } = await admin.from("praxis_alerts").select("message").eq("needs_ack", true).is("acked_at", null).order("created_at", { ascending: false }).limit(5);
    const metrics = {
      done_today: doneToday, tasks_by_status: counts, dispatches_total: dispTotal ?? 0, dispatches_today: dispToday ?? 0,
      spend_today_usd: Number(cfg?.spend_today_usd ?? 0), spend_cap_usd: Number(cfg?.daily_spend_cap_usd ?? 0),
      open_blockers: (blockers ?? []).map((b: any) => b.message), orchestrator_last_run: state?.last_run_at,
    };

    // --- Atlas writes the brief + spoken script ----------------------------
    const sys = `You are Atlas, Luis Garcia's AI chief of staff at Conduit/Praxis (you used to go by Jarvis). Write a status update from real metrics. Return ONLY JSON: {"title":"...","summary":"<=110 words, written for a phone text — punchy, plain, no markdown","spoken_text":"<=80 words, FIRST PERSON, natural spoken phone voice as if you just called Luis — warm, confident; open with 'Hey Luis, it's Atlas'","eta_text":"one plain line projecting the finish line"}. Be honest; if blockers exist, name the top one. Don't invent numbers.`;
    const ask = `Today: ${today}\nCompany goal: ${state?.company_goal ?? ""}\nMetrics: ${JSON.stringify(metrics)}`;
    const r = await callHaiku(key, sys, ask, 700);
    await admin.from("praxis_runs").insert({ agent: "atlas", event: "brief", detail: { kind }, tokens_in: r.tokens_in, tokens_out: r.tokens_out, cost_usd: r.cost });
    const brief = parseObj(r.text);
    const channels: string[] = [];

    // --- Text via Telegram -------------------------------------------------
    let text_status = "skipped"; let text_detail: any = null;
    if (wantText) {
      const tgToken = await getSecret(admin, "TELEGRAM_BOT_TOKEN");
      const tgChat = body.chat_id ?? (await getSecret(admin, "TELEGRAM_CHAT_ID"));
      if (tgToken && tgChat) {
        const msg = `🧭 Atlas — ${brief.title ?? "update"}\n\n${brief.summary ?? ""}\n\n⏱ ${brief.eta_text ?? ""}`;
        const tres = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: tgChat, text: msg, disable_web_page_preview: true }),
        });
        const tt = await tres.text().catch(() => "");
        if (tres.ok) { text_status = "sent"; channels.push("telegram"); } else { text_status = "failed"; text_detail = { status: tres.status, body: tt.slice(0, 200) }; }
      } else { text_status = "skipped_no_creds"; }
    }

    // --- Call via Vapi (only when asked + creds exist) ---------------------
    let call_status = "skipped"; let call_detail: any = null;
    if (wantCall) {
      const vapiKey = await getSecret(admin, "VAPI_API_KEY");
      const phoneNumberId = await getSecret(admin, "VAPI_PHONE_NUMBER_ID");
      const assistantId = await getSecret(admin, "VAPI_ATLAS_ASSISTANT_ID");
      const to = body.to ?? (await getSecret(admin, "OWNER_PHONE"));
      if (vapiKey && phoneNumberId && assistantId && to) {
        const vres = await fetch("https://api.vapi.ai/call", {
          method: "POST", headers: { "Authorization": `Bearer ${vapiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumberId, assistantId, customer: { number: to },
            assistantOverrides: { firstMessage: brief.spoken_text ?? "Hey Luis, it's Atlas with a quick update.", variableValues: { eta: brief.eta_text ?? "", summary: brief.summary ?? "" } } }),
        });
        const vtext = await vres.text().catch(() => "");
        if (vres.ok) { call_status = "placed"; channels.push("call"); call_detail = { id: (() => { try { return JSON.parse(vtext).id; } catch { return null; } })() }; }
        else { call_status = "failed"; call_detail = { status: vres.status, body: vtext.slice(0, 300) }; }
      } else {
        call_status = "skipped_no_creds";
        call_detail = { missing: [["VAPI_API_KEY", vapiKey], ["VAPI_PHONE_NUMBER_ID", phoneNumberId], ["VAPI_ATLAS_ASSISTANT_ID", assistantId], ["to/OWNER_PHONE", to]].filter(([, v]) => !v).map(([k]) => k) };
      }
    }

    const { data: saved } = await admin.from("praxis_briefs").insert({
      kind, title: brief.title ?? "Atlas update", summary: brief.summary ?? null, spoken_text: brief.spoken_text ?? null,
      eta_text: brief.eta_text ?? null, metrics, channel: channels.join(",") || "none", call_status,
      call_detail: { call: call_detail, text: { status: text_status, detail: text_detail } },
    }).select("id").maybeSingle();

    return j({ ok: true, brief_id: saved?.id, text_status, call_status, channels, title: brief.title, eta: brief.eta_text, summary_preview: (brief.summary ?? "").slice(0, 200) });
  } catch (e) {
    const msg = String((e as Error).message ?? e).slice(0, 300);
    await admin.from("praxis_runs").insert({ agent: "atlas", event: "error", detail: { fn: "atlas-brief", error: msg } });
    return j({ ok: false, error: msg }, 500);
  }
});
