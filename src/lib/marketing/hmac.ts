// HMAC pair to the marketing worker's src/auth.ts.
// MARKETING_WORKER_SECRET lives on both surfaces and must match exactly.

import { createHmac } from "node:crypto";

export function signMarketingSession(
  sessionId: string,
  timestamp: number,
): string {
  const secret = process.env.MARKETING_WORKER_SECRET;
  if (!secret) throw new Error("MARKETING_WORKER_SECRET is not set");
  return createHmac("sha256", secret)
    .update(`${sessionId}.${timestamp}`)
    .digest("hex");
}
