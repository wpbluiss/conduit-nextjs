// Praxis -> engineering worker bridge. Wraps the HMAC + POST so the API route
// stays focused on auth + DB. Returns true if the worker accepted the session
// (HTTP 202); false on any other shape, but does NOT throw — the session row
// is already inserted, so the UI can display "failed to start" without
// blocking the page render.

import { signSession } from "./hmac";

export interface WorkerStartInput {
  sessionId: string;
  accountId: string;
  prompt: string;
  buildType?: string | null;
}

export async function startWorkerSession(
  input: WorkerStartInput,
): Promise<{ ok: boolean; status: number; error?: string }> {
  const url = process.env.ENGINEERING_WORKER_URL;
  if (!url) {
    return { ok: false, status: 0, error: "worker_url_missing" };
  }
  const ts = Date.now();
  let sig: string;
  try {
    sig = signSession(input.sessionId, ts);
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : "sign_failed",
    };
  }

  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/session`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-engineering-worker-sig": sig,
        "x-engineering-worker-ts": String(ts),
      },
      body: JSON.stringify(input),
      // Worker responds 202 in <1s; 10s is generous slack.
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
