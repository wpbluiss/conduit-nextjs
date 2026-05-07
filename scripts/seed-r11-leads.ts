// One-shot seed for R11. Runs Overpass discovery + Reddit intent + Maps
// enrichment against the internal_account, all-in-one. Uses the service-role
// admin client to bypass RLS — same data shape as /api/sales/refresh-leads
// would produce in prod.
//
// Run: ./node_modules/.bin/tsx scripts/seed-r11-leads.ts
//
// Requires the following env (pulled from Vercel via `vercel env pull`):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY
//   ANTHROPIC_API_KEY (for Reddit intent — skipped silently if absent)

import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { discoverViaOverpass } from "../src/lib/lead-sources/overpass";
import { fetchRedditIntent } from "../src/lib/lead-sources/reddit";
import { enrichWithGoogleMaps } from "../src/lib/lead-sources/google-maps";
import type {
  IntentSignal,
  NormalizedLead,
  Vertical,
} from "../src/lib/lead-sources/types";

// Load prod env first (if pulled), then .env.local as override
config({ path: ".env.r11-pull" });
config({ path: ".env.local", override: true });

const VERTICAL: Vertical = "med_spa";
const CITIES = ["West Palm Beach", "Boca Raton", "Delray Beach", "Jupiter"];
const RADIUS_M = 20_000;
const VERTICAL_BOOST_TOP_N = 5;

async function findInternalAccount(supa: SupabaseClient) {
  const { data, error } = await supa
    .from("conduit_accounts")
    .select("id, name")
    .eq("internal_account", true)
    .limit(1);
  if (error) throw error;
  if (!data?.length) throw new Error("no internal_account");
  return data[0] as { id: string; name: string };
}

async function runOverpassPhase(
  supa: SupabaseClient,
  accountId: string,
): Promise<number> {
  console.log("\n=== PHASE 1: OVERPASS DISCOVERY ===");
  let totalAdded = 0;

  for (const city of CITIES) {
    console.log(`\nDiscovering ${VERTICAL} @ ${city}…`);
    let leads: NormalizedLead[] = [];
    try {
      leads = await discoverViaOverpass({
        vertical: VERTICAL,
        city,
        radiusM: RADIUS_M,
      });
    } catch (err) {
      console.error(`  overpass error:`, err);
      continue;
    }
    console.log(`  ${leads.length} candidates`);

    if (leads.length === 0) continue;

    const { data: existing } = await supa
      .from("sales_leads")
      .select("source, business_name, address")
      .eq("account_id", accountId)
      .eq("source", "overpass");

    const seen = new Set(
      (existing ?? []).map(
        (r) =>
          `${(r.business_name as string).toLowerCase()}::${((r.address as string | null) ?? "").toLowerCase()}`,
      ),
    );

    const newRows = leads
      .filter(
        (l) =>
          !seen.has(
            `${l.business_name.toLowerCase()}::${(l.address ?? "").toLowerCase()}`,
          ),
      )
      .map((l) => ({
        account_id: accountId,
        source: l.source,
        business_name: l.business_name,
        vertical: l.vertical,
        city: l.city,
        state: l.state,
        phone: l.phone ?? null,
        website: l.website ?? null,
        address: l.address ?? null,
        lat: l.lat ?? null,
        lng: l.lng ?? null,
        raw_payload: l.raw_payload,
      }));

    if (newRows.length === 0) {
      console.log(`  all already in DB`);
      continue;
    }
    const { error } = await supa.from("sales_leads").insert(newRows);
    if (error) {
      console.error(`  insert error:`, error);
      continue;
    }
    console.log(`  + ${newRows.length}`);
    totalAdded += newRows.length;
  }

  return totalAdded;
}

async function runRedditPhase(
  supa: SupabaseClient,
  accountId: string,
): Promise<{ signals: number; boosted: number }> {
  console.log("\n=== PHASE 2: REDDIT INTENT ===");
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("  ANTHROPIC_API_KEY unset, skipping");
    return { signals: 0, boosted: 0 };
  }

  const { data: subs } = await supa
    .from("reddit_lead_sources")
    .select("subreddit")
    .eq("active", true);
  const subredditNames = (subs ?? []).map((s) => s.subreddit as string);
  console.log(`  subreddits: ${subredditNames.join(", ")}`);

  let allSignals: IntentSignal[] = [];
  for (const city of CITIES) {
    console.log(`\nReddit intent for ${VERTICAL} @ ${city}…`);
    try {
      const sigs = await fetchRedditIntent({
        vertical: VERTICAL,
        city,
        subreddits: subredditNames,
      });
      console.log(`  ${sigs.length} signals`);
      allSignals = allSignals.concat(sigs);
    } catch (err) {
      console.error(`  reddit error:`, err);
    }
  }

  if (allSignals.length === 0) {
    console.log("  no signals captured");
    return { signals: 0, boosted: 0 };
  }

  console.log(`\nApplying ${allSignals.length} signals…`);
  let signalsApplied = 0;
  const boosted = new Set<string>();

  for (const sig of allSignals) {
    let leadId: string | null = null;

    if (sig.matched_business_name) {
      const pattern = `%${sig.matched_business_name.replace(/[%_]/g, "\\$&")}%`;
      const { data: matches } = await supa
        .from("sales_leads")
        .select("id")
        .eq("account_id", accountId)
        .eq("vertical", VERTICAL)
        .eq("city", sig.city ?? "")
        .ilike("business_name", pattern)
        .limit(1);
      leadId = (matches?.[0]?.id as string | undefined) ?? null;
    }

    const { error: insertErr } = await supa.from("lead_intent_signals").insert({
      account_id: accountId,
      lead_id: leadId,
      vertical: VERTICAL,
      city: sig.city,
      signal_text: sig.signal_text,
      signal_score: sig.signal_score,
      source_url: sig.source_url,
      source_type: sig.source_type,
    });
    if (insertErr) {
      console.error("  signal insert err:", insertErr);
      continue;
    }
    signalsApplied++;

    const targets = leadId
      ? [{ id: leadId, intent_signal_score: 0 }]
      : ((
          await supa
            .from("sales_leads")
            .select("id, intent_signal_score")
            .eq("account_id", accountId)
            .eq("vertical", VERTICAL)
            .eq("city", sig.city ?? "")
            .order("business_name", { ascending: true })
            .limit(VERTICAL_BOOST_TOP_N)
        ).data ?? []) as Array<{ id: string; intent_signal_score: number }>;

    for (const t of targets) {
      if (sig.signal_score <= (t.intent_signal_score ?? 0)) continue;
      const { error: updErr } = await supa
        .from("sales_leads")
        .update({
          intent_signal_score: sig.signal_score,
          intent_signal_text: sig.signal_text,
          updated_at: new Date().toISOString(),
        })
        .eq("id", t.id);
      if (updErr) continue;
      boosted.add(t.id);
    }
  }

  return { signals: signalsApplied, boosted: boosted.size };
}

async function runMapsPhase(
  supa: SupabaseClient,
  accountId: string,
): Promise<{ enriched: number; failed: number }> {
  console.log("\n=== PHASE 3: MAPS ENRICHMENT ===");
  const { data: candidates } = await supa
    .from("sales_leads")
    .select("id, business_name, address, city")
    .eq("account_id", accountId)
    .eq("vertical", VERTICAL)
    .gt("intent_signal_score", 0)
    .eq("enriched", false)
    .order("intent_signal_score", { ascending: false })
    .limit(15);

  const targets = (candidates ?? []).map((c) => ({
    id: c.id as string,
    business_name: c.business_name as string,
    address: c.address as string | null,
    city: c.city as string,
  }));
  console.log(`  candidates: ${targets.length}`);
  if (targets.length === 0) return { enriched: 0, failed: 0 };

  const results = await enrichWithGoogleMaps({
    leads: targets,
    maxFetches: 15,
  });

  let enriched = 0;
  let failed = 0;
  for (const r of results) {
    if (r.enriched) {
      await supa
        .from("sales_leads")
        .update({
          rating: r.rating ?? null,
          review_count: r.review_count ?? null,
          last_review_date: r.last_review_date ?? null,
          enriched: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", r.leadId);
      enriched++;
    } else {
      if (r.error === "no_rating_found") {
        await supa
          .from("sales_leads")
          .update({ enriched: true, updated_at: new Date().toISOString() })
          .eq("id", r.leadId);
      }
      failed++;
      console.log(`  [skip] ${r.leadId.slice(0, 8)}: ${r.error}`);
    }
  }
  return { enriched, failed };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("supabase env not set");

  const supa = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const account = await findInternalAccount(supa);
  console.log(`account: ${account.id} (${account.name})`);

  await runOverpassPhase(supa, account.id);
  const intent = await runRedditPhase(supa, account.id);
  console.log(`  signals applied: ${intent.signals}, leads boosted: ${intent.boosted}`);

  const enrich = await runMapsPhase(supa, account.id);
  console.log(`  enriched: ${enrich.enriched}, failed: ${enrich.failed}`);

  // Final state
  const { count: total } = await supa
    .from("sales_leads")
    .select("id", { count: "exact", head: true })
    .eq("account_id", account.id)
    .eq("vertical", VERTICAL);

  const { count: withIntent } = await supa
    .from("sales_leads")
    .select("id", { count: "exact", head: true })
    .eq("account_id", account.id)
    .eq("vertical", VERTICAL)
    .gt("intent_signal_score", 0);

  console.log("\n=== DEMO BAR CHECK ===");
  console.log(`med_spa leads total: ${total ?? 0} (need >= 15)`);
  console.log(`leads with intent_signal_score > 0: ${withIntent ?? 0} (need >= 3)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
