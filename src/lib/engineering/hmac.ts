// HMAC pair to the worker's src/auth.ts. Praxis API is the only thing that
// mints these — the worker rejects anything older than 5 minutes or signed
// with a different key. ENGINEERING_WORKER_SECRET lives on both surfaces and
// must match exactly.

import { createHmac } from "node:crypto";

export function signSession(sessionId: string, timestamp: number): string {
  const secret = process.env.ENGINEERING_WORKER_SECRET;
  if (!secret) throw new Error("ENGINEERING_WORKER_SECRET is not set");
  return createHmac("sha256", secret)
    .update(`${sessionId}.${timestamp}`)
    .digest("hex");
}
