import { createHash } from "crypto";

export function hashUserId(id: string): string {
  return createHash("sha256").update(id).digest("hex");
}

const PH_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties: Record<string, unknown> = {},
): Promise<void> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || !distinctId) return;
  try {
    await fetch(`${PH_HOST}/capture/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        distinct_id: distinctId,
        event,
        properties: { ...properties, $lib: "posthog-node" },
      }),
    });
  } catch {
    // Analytics failure is never fatal
  }
}
