// Praxis -> marketing worker bridge. Mirrors the engineering worker
// bridge — HMAC + POST, returns ok/non-throwing so the API handler
// can mark the row failed without crashing the request.

import { signMarketingSession } from "./hmac";

export interface MarketingWorkerStartInput {
  sessionId: string;
  accountId: string;
  prompt: string;
  brand?: {
    name?: string | null;
    audience?: string | null;
    voice?: string | null;
  } | null;
  referenceImageUrl?: string | null;
}

export async function startMarketingWorkerSession(
  input: MarketingWorkerStartInput,
): Promise<{ ok: boolean; status: number; error?: string }> {
  const url = process.env.MARKETING_WORKER_URL;
  if (!url) {
    return { ok: false, status: 0, error: "worker_url_missing" };
  }
  const ts = Date.now();
  let sig: string;
  try {
    sig = signMarketingSession(input.sessionId, ts);
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : "sign_failed",
    };
  }
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/generate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-marketing-worker-sig": sig,
        "x-marketing-worker-ts": String(ts),
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(10_000),
    });
    if (r.status >= 200 && r.status < 300) {
      return { ok: true, status: r.status };
    }
    const body = await r.text().catch(() => "");
    return { ok: false, status: r.status, error: body.slice(0, 240) };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : "fetch_failed",
    };
  }
}

export async function abortMarketingWorkerSession(
  sessionId: string,
): Promise<{ ok: boolean; status: number; found?: boolean; error?: string }> {
  const url = process.env.MARKETING_WORKER_URL;
  if (!url) return { ok: false, status: 0, error: "worker_url_missing" };
  const ts = Date.now();
  let sig: string;
  try {
    sig = signMarketingSession(sessionId, ts);
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : "sign_failed",
    };
  }
  try {
    const r = await fetch(
      `${url.replace(/\/$/, "")}/session/${sessionId}/abort`,
      {
        method: "POST",
        headers: {
          "x-marketing-worker-sig": sig,
          "x-marketing-worker-ts": String(ts),
        },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (r.status >= 200 && r.status < 300) {
      const j = (await r.json().catch(() => ({}))) as { found?: boolean };
      return { ok: true, status: r.status, found: j.found ?? false };
    }
    const body = await r.text().catch(() => "");
    return { ok: false, status: r.status, error: body.slice(0, 240) };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : "fetch_failed",
    };
  }
}
