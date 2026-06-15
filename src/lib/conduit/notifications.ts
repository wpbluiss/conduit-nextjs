import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType =
  | "build_complete"
  | "artifact_ready"
  | "memory_saved"
  | "billing";

export async function insertNotification(
  supabase: SupabaseClient,
  opts: {
    accountId: string;
    type: NotificationType;
    title: string;
    body?: string;
    href?: string;
  },
) {
  await supabase.from("conduit_notifications").insert({
    account_id: opts.accountId,
    type: opts.type,
    title: opts.title,
    body: opts.body ?? null,
    href: opts.href ?? null,
  });
}
