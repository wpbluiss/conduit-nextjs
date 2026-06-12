// Praxis — Atlas call control plane (Vapi).
// Inspect Atlas's Vapi assistant, flip it to a realtime S2S voice, and place live
// calls to Luis. Read-modify-write on configure so we never clobber a working
// assistant. Auto-resolves the phone number UUID so the secret can be the number
// itself. Secrets: VAPI_API_KEY, VAPI_PHONE_NUMBER_ID, VAPI_ATLAS_ASSISTANT_ID, OWNER_PHONE.
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
function deepMerge(base: any, patch: any): any {
  if (patch === null || typeof patch !== "object" || Array.isArray(patch)) return patch;
  const out: any = Array.isArray(base) ? [] : { ...(base ?? {}) };
  for (const k of Object.keys(patch)) out[k] = deepMerge(base?.[k], patch[k]);
  return out;
}
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s || "");
// Resolve a Vapi phoneNumberId: accept a UUID as-is, otherwise look it up by
// matching the digits of the configured number (or just take the only one).
async function resolvePhoneId(key: string, given: string, ownerHint: string) {
  if (isUuid(given)) return { id: given, how: "given_uuid" };
  const list = await vapi(`/phone-number`, key);
  if (!list.ok || !Array.isArray(list.body) || !list.body.length) return { id: "", how: "lookup_failed", detail: { status: list.status, body: list.body } };
  const digits = (s: string) => (s || "").replace(/\D/g, "");
  const wantDigits = digits(given) || digits(ownerHint);
  const match = (wantDigits && list.body.find((p: any) => digits(p.number).endsWith(wantDigits.slice(-10)))) || list.body[0];
  return { id: match?.id ?? "", how: match ? "matched" : "first", number: match?.number };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return j({ ok: false, error: "method" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, svc, { auth: { persistSession: false, autoRefreshToken: false } });

  const secret = await getSecret(admin, "PRAXIS_CRON_SECRET");
  if (!secret || req.headers.get("x-praxis-secret") !== secret) return j({ ok: false, error: "unauthorized" }, 401);

  let body: any = {}; try { body = await req.json(); } catch {}
  const action = body.action ?? "inspect"; // inspect | list_numbers | configure | call | configure_and_call

  const vapiKey = await getSecret(admin, "VAPI_API_KEY");
  const assistantId = body.assistant_id ?? (await getSecret(admin, "VAPI_ATLAS_ASSISTANT_ID"));
  const phoneNumberRaw = body.phone_number_id ?? (await getSecret(admin, "VAPI_PHONE_NUMBER_ID"));
  const to = body.to ?? (await getSecret(admin, "OWNER_PHONE"));

  if (!vapiKey) return j({ ok: false, error: "missing_secrets", missing: ["VAPI_API_KEY"] }, 400);
  const log = async (event: string, detail: any) => { await admin.from("praxis_runs").insert({ agent: "atlas", event, detail }); };

  try {
    const out: any = { ok: true, action };

    if (action === "list_numbers") {
      const list = await vapi(`/phone-number`, vapiKey);
      out.numbers = Array.isArray(list.body) ? list.body.map((p: any) => ({ id: p.id, number: p.number, provider: p.provider })) : list.body;
      return j(out);
    }

    if (action === "inspect") {
      if (!assistantId) return j({ ok: false, error: "missing_secrets", missing: ["VAPI_ATLAS_ASSISTANT_ID"] }, 400);
      const a = await vapi(`/assistant/${assistantId}`, vapiKey);
      if (!a.ok) return j({ ok: false, error: "vapi_get_failed", status: a.status, body: a.body }, 502);
      out.assistant = { name: a.body?.name, model: a.body?.model, voice: a.body?.voice, transcriber: a.body?.transcriber };
      return j(out);
    }

    if (action === "configure" || action === "configure_and_call") {
      if (!assistantId) return j({ ok: false, error: "missing_secrets", missing: ["VAPI_ATLAS_ASSISTANT_ID"] }, 400);
      const patch = body.assistant_patch ?? (body.model ? { model: body.model } : null);
      if (!patch) return j({ ok: false, error: "no_patch" }, 400);
      const cur = await vapi(`/assistant/${assistantId}`, vapiKey);
      if (!cur.ok) return j({ ok: false, error: "vapi_get_failed", status: cur.status, body: cur.body }, 502);
      const merged = deepMerge({ model: cur.body?.model, voice: cur.body?.voice, transcriber: cur.body?.transcriber }, patch);
      const upd = await vapi(`/assistant/${assistantId}`, vapiKey, { method: "PATCH", body: JSON.stringify(merged) });
      if (!upd.ok) return j({ ok: false, error: "vapi_patch_failed", status: upd.status, body: upd.body }, 502);
      out.configured = { model: upd.body?.model, voice: upd.body?.voice };
      await log("vapi_configure", { result_model: upd.body?.model });
      if (action === "configure") return j(out);
    }

    // call (or tail of configure_and_call)
    if (!assistantId || !to) return j({ ok: false, error: "missing_secrets", missing: [!assistantId && "VAPI_ATLAS_ASSISTANT_ID", !to && "to/OWNER_PHONE"].filter(Boolean) }, 400);
    const resolved = await resolvePhoneId(vapiKey, phoneNumberRaw, to);
    if (!resolved.id) return j({ ok: false, error: "phone_number_unresolved", detail: resolved }, 502);
    const first = body.message ?? "Hey Luis, it's Atlas. This is a quick test of my new voice. How's it sound on your end?";
    const call = await vapi(`/call`, vapiKey, { method: "POST", body: JSON.stringify({
      phoneNumberId: resolved.id, assistantId, customer: { number: to },
      assistantOverrides: { firstMessage: first },
    }) });
    if (!call.ok) return j({ ok: false, error: "vapi_call_failed", status: call.status, body: call.body, phone_resolved: resolved }, 502);
    out.call = { id: call.body?.id, status: call.body?.status, to, phone_resolved: resolved };
    await log("vapi_call", { id: call.body?.id, to, how: resolved.how });
    return j(out);
  } catch (e) {
    const msg = String((e as Error).message ?? e).slice(0, 300);
    await log("error", { fn: "atlas-call", error: msg });
    return j({ ok: false, error: msg }, 500);
  }
});
