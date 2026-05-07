// Service-role Supabase client for server-side jobs that bypass RLS:
// scraper pipelines, batch enrichment, cron tasks. Never import from a
// browser bundle. Cookie-bound user client lives in ./server.ts and stays
// the path for anything that needs auth.uid().

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function createSupabaseAdminClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set (admin client requires service role)",
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
