import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ConduitAccount } from "@/lib/conduit/account";

export interface ApiKeyAuthResult {
  account: ConduitAccount;
  keyId: string;
}

/**
 * Validates an `Authorization: Bearer prx_…` header against the
 * conduit_api_keys table and returns the associated account.
 *
 * Uses the admin (service-role) client so RLS doesn't block the hash
 * lookup — but only for that one lookup. Returns null for any auth
 * failure so callers can fall back to session auth.
 */
export async function resolveApiKeyAuth(
  request: NextRequest,
): Promise<ApiKeyAuthResult | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer prx_")) return null;

  const token = authHeader.slice(7); // strip "Bearer "
  const hash = createHash("sha256").update(token).digest("hex");

  const admin = createSupabaseAdminClient();

  const { data: keyRow } = await admin
    .from("conduit_api_keys")
    .select("id, account_id")
    .eq("key_hash", hash)
    .is("revoked_at", null)
    .maybeSingle();

  if (!keyRow) return null;

  // Fire-and-forget last_used_at — don't block the response on this.
  admin
    .from("conduit_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id)
    .then(() => {});

  const { data: account } = await admin
    .from("conduit_accounts")
    .select("*")
    .eq("id", keyRow.account_id)
    .maybeSingle();

  if (!account) return null;

  return { account: account as ConduitAccount, keyId: keyRow.id };
}
