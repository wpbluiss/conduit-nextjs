// Praxis — Atlas call control plane (Vapi).
// Lets the fleet (and operators, via x-praxis-secret) inspect Atlas's Vapi assistant,
// flip it to a realtime speech-to-speech voice, and place live calls to Luis.
// Read-modify-write on configure so we never clobber a working assistant — we merge
// only what's provided.
// Secrets: VAPI_API_KEY, VAPI_PHONE_NUMBER_ID, VAPI_ATLAS_ASSISTANT_ID, OWNER_PHONE.
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
async function vapi(path: string, key: string, init?: RequestInit) {
  const res = await fetch(`https://api.vapi.ai${path}`, {
    ...init,
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const text = await res.text().catch(() => "");
  let body: any = null; try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 500) }; }
  return { ok: res.ok, status: res.status, body };
}
// Deep-merge patch into base (objects merge, scalars/arrays from patch win).
function deepMerge(base: any, patch: any): any {
  if (patch === null || typeof patch !== "object" || Array.isArray(patch)) return patch;
  const out: any = Array.isArray(base) ? [] : { ...(base ?? {}) };
  for (const k of Object.keys(patch)) out[k] = deepMerge(base?.[k], patch[k]);
  return out;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return j({ ok: false, error: "method" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, svc, { auth: { persistSession: false, autoRefreshToken: false } });

  const secret = await getSecret(admin, "PRAXIS_CRON_SECRET");
  if (!secret || req.headers.get("x-praxis-secret") !== secret) return j({ ok: false, error: "unauthorized" }, 401);

  let body: any = {}; try { body = await req.json(); } catch {}
  const action = body.action ?? "inspect"; // inspect | configure | call | configure_and_call

  const vapiKey = await getSecret(admin, "VAPI_API_KEY");
  const assistantId = body.assistant_id ?? (await getSecret(admin, "VAPI_ATLAS_ASSISTANT_ID"));
  const phoneNumberId = body.phone_number_id ?? (await getSecret(admin, "VAPI_PHONE_NUMBER_ID"));
  const to = body.to ?? (await getSecret(admin, "OWNER_PHONE"));

  const missing = [["VAPI_API_KEY", vapiKey], ["VAPI_ATLAS_ASSISTANT_ID", assistantId]].filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) return j({ ok: false, error: "missing_secrets", missing, hint: "Add these as Supabase Edge Function secrets, then retry." }, 400);

  const log = async (event: string, detail: any) => { await admin.from("praxis_runs").insert({ agent: "atlas", event, detail }); };

  try {
    const out: any = { ok: true, action };

    if (action === "inspect") {
      const a = await vapi(`/assistant/${assistantId}`, vapiKey);
      if (!a.ok) return j({ ok: false, error: "vapi_get_failed", status: a.status, body: a.body }, 502);
      out.assistant = { name: a.body?.name, model: a.body?.model, voice: a.body?.voice, transcriber: a.body?.transcriber, firstMessage: a.body?.firstMessage };
      await log("vapi_inspect", { model: a.body?.model, voice: a.body?.voice });
      return j(out);
    }

    if (action === "configure" || action === "configure_and_call") {
      // Merge only the provided patch into the live assistant (no clobber).
      const patch = body.assistant_patch ?? (body.model ? { model: body.model } : null);
      if (!patch) return j({ ok: false, error: "no_patch", hint: "Pass assistant_patch (or model) describing the realtime S2S config to merge." }, 400);
      const cur = await vapi(`/assistant/${assistantId}`, vapiKey);
      if (!cur.ok) return j({ ok: false, error: "vapi_get_failed", status: cur.status, body: cur.body }, 502);
      const merged = deepMerge({ model: cur.body?.model, voice: cur.body?.voice, transcriber: cur.body?.transcriber }, patch);
      const upd = await vapi(`/assistant/${assistantId}`, vapiKey, { method: "PATCH", body: JSON.stringify(merged) });
      if (!upd.ok) return j({ ok: false, error: "vapi_patch_failed", status: upd.status, body: upd.body }, 502);
      out.configured = { model: upd.body?.model, voice: upd.body?.voice };
      await log("vapi_configure", { patch, result_model: upd.body?.model });
      if (action === "configure") return j(out);
    }

    // action === "call" or tail of configure_and_call
    if (!phoneNumberId || !to) return j({ ok: false, error: "missing_secrets", missing: [!phoneNumberId && "VAPI_PHONE_NUMBER_ID", !to && "to/OWNER_PHONE"].filter(Boolean) }, 400);
    const first = body.message ?? "Hey Luis, it's Atlas. This is a quick test of my new real-time voice. If this sounds natural and quick, we're in business. How's it sound on your end?";
    const call = await vapi(`/call`, vapiKey, { method: "POST", body: JSON.stringify({
      phoneNumberId, assistantId, customer: { number: to },
      assistantOverrides: { firstMessage: first },
    }) });
    if (!call.ok) return j({ ok: false, error: "vapi_call_failed", status: call.status, body: call.body }, 502);
    out.call = { id: call.body?.id, status: call.body?.status, to };
    await log("vapi_call", { id: call.body?.id, to });
    return j(out);
  } catch (e) {
    const msg = String((e as Error).message ?? e).slice(0, 300);
    await log("error", { fn: "atlas-call", error: msg });
    return j({ ok: false, error: msg }, 500);
  }
});
