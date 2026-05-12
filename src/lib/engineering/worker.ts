// Praxis -> engineering worker bridge. Wraps the HMAC + POST so the API route
// stays focused on auth + DB. Returns true if the worker accepted the session
// (HTTP 202); false on any other shape, but does NOT throw — the session row
// is already inserted, so the UI can display "failed to start" without
// blocking the page render.

import { signSession } from "./hmac";

// Railway's dashboard shows worker domains host-only (no scheme). Operators
// have set ENGINEERING_WORKER_URL without "https://" before, which trips
// Node's fetch() with "Failed to parse URL". Normalize so missing schemes
// don't silently fail every build.
function resolveWorkerBase(): string | null {
  const raw = process.env.ENGINEERING_WORKER_URL?.trim();
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withScheme.replace(/\/$/, "");
}

export interface WorkerStartInput {
  sessionId: string;
  accountId: string;
  prompt: string;
  buildType?: string | null;
  parentSessionId?: string | null;
}

export async function startWorkerSession(
  input: WorkerStartInput,
): Promise<{ ok: boolean; status: number; error?: string }> {
  const base = resolveWorkerBase();
  if (!base) {
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
    const r = await fetch(`${base}/session`, {
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

/** R15.5: ask the worker to SIGTERM the claude subprocess for sessionId.
 *  Idempotent on the worker side — if the session has already finished
 *  or wasn't running on this worker instance, returns ok:true with
 *  found:false. The caller should still mark the DB row 'aborted'
 *  regardless, since user intent stands even if the worker is gone. */
export async function abortWorkerSession(
  sessionId: string,
): Promise<{ ok: boolean; status: number; found?: boolean; error?: string }> {
  const base = resolveWorkerBase();
  if (!base) {
    return { ok: false, status: 0, error: "worker_url_missing" };
  }
  const ts = Date.now();
  let sig: string;
  try {
    sig = signSession(sessionId, ts);
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : "sign_failed",
    };
  }
  try {
    const r = await fetch(
      `${base}/session/${sessionId}/abort`,
      {
        method: "POST",
        headers: {
          "x-engineering-worker-sig": sig,
          "x-engineering-worker-ts": String(ts),
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
