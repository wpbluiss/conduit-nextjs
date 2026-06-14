import webpush from "web-push";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hi@conduitai.io";
  if (!publicKey || !privateKey) {
    throw new Error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToAccount(
  accountId: string,
  payload: PushPayload,
): Promise<void> {
  ensureVapid();
  const admin = createSupabaseAdminClient();
  const { data: subs } = await admin
    .from("conduit_push_subscriptions")
    .select("id, endpoint, keys")
    .eq("account_id", accountId);

  if (!subs?.length) return;

  const json = JSON.stringify(payload);
  const dead: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      const subscription = {
        endpoint: sub.endpoint as string,
        keys: sub.keys as { p256dh: string; auth: string },
      };
      try {
        await webpush.sendNotification(subscription, json);
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        // 404/410 means the subscription is no longer valid — remove it.
        if (status === 404 || status === 410) dead.push(sub.id as string);
        else console.error("push send error", status, (err as Error).message);
      }
    }),
  );

  if (dead.length > 0) {
    await admin
      .from("conduit_push_subscriptions")
      .delete()
      .in("id", dead);
  }
}
