import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { tierById } from "@/lib/billing/tiers";
import { discoverViaOverpass } from "@/lib/lead-sources/overpass";
import { fetchRedditIntent } from "@/lib/lead-sources/reddit";
import { enrichWithGoogleMaps } from "@/lib/lead-sources/google-maps";
import {
  type IntentSignal,
  type NormalizedLead,
  type Vertical,
  VERTICALS,
  resolveCity,
} from "@/lib/lead-sources/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const VALID_SOURCES = ["overpass", "reddit", "google_maps"] as const;
type Source = (typeof VALID_SOURCES)[number];

const DEFAULT_MAX_ENRICH = 15;
const HARD_MAX_ENRICH = 50;
const VERTICAL_BOOST_TOP_N = 5;

interface RefreshBody {
  vertical?: string;
  city?: string;
  sources?: string[];
  maxEnrich?: number;
}

function isVertical(v: unknown): v is Vertical {
  return typeof v === "string" && (VERTICALS as string[]).includes(v);
}

async function upsertLeads(
  supabase: SupabaseClient,
  accountId: string,
  leads: NormalizedLead[],
): Promise<{ added: number; skipped: number }> {
  if (leads.length === 0) return { added: 0, skipped: 0 };

  const { data: existing, error: existingErr } = await supabase
    .from("sales_leads")
    .select("source, business_name, address")
    .eq("account_id", accountId)
    .in(
      "source",
      Array.from(new Set(leads.map((l) => l.source))),
    );
  if (existingErr) throw existingErr;

  const dedupeKey = (
    source: string,
    name: string,
    address: string | null | undefined,
  ) => `${source}::${name.toLowerCase()}::${(address ?? "").toLowerCase()}`;

  const seen = new Set(
    (existing ?? []).map((r) =>
      dedupeKey(
        r.source as string,
        r.business_name as string,
        r.address as string | null,
      ),
    ),
  );

  const newRows = leads
    .filter(
      (l) => !seen.has(dedupeKey(l.source, l.business_name, l.address)),
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
    return { added: 0, skipped: leads.length };
  }

  const { error } = await supabase.from("sales_leads").insert(newRows);
  if (error) throw error;
  return { added: newRows.length, skipped: leads.length - newRows.length };
}

async function fetchActiveSubreddits(
  supabase: SupabaseClient,
  city: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("reddit_lead_sources")
    .select("subreddit, city")
    .eq("active", true);
  if (error) throw error;

  const cityLower = city.toLowerCase();
  // Prefer subs targeted at this city; fall back to global subs.
  const targeted = (data ?? []).filter(
    (r) => (r.city as string | null)?.toLowerCase() === cityLower,
  );
  const global = (data ?? []).filter((r) => !r.city);
  const all = [...targeted, ...global];
  return all.map((r) => r.subreddit as string);
}

async function applyIntentSignals(
  supabase: SupabaseClient,
  accountId: string,
  vertical: Vertical,
  city: string,
  signals: IntentSignal[],
): Promise<{ signalsApplied: number; leadsBoosted: number }> {
  if (signals.length === 0) return { signalsApplied: 0, leadsBoosted: 0 };

  let signalsApplied = 0;
  let leadsBoosted = 0;
  const boosted = new Set<string>();

  for (const sig of signals) {
    let leadId: string | null = null;

    if (sig.matched_business_name) {
      const pattern = `%${sig.matched_business_name.replace(/[%_]/g, "\\$&")}%`;
      const { data: matches } = await supabase
        .from("sales_leads")
        .select("id")
        .eq("account_id", accountId)
        .eq("vertical", vertical)
        .eq("city", city)
        .ilike("business_name", pattern)
        .limit(1);
      leadId = (matches?.[0]?.id as string | undefined) ?? null;
    }

    const { error: insertErr } = await supabase
      .from("lead_intent_signals")
      .insert({
        account_id: accountId,
        lead_id: leadId,
        vertical,
        city,
        signal_text: sig.signal_text,
        signal_score: sig.signal_score,
        source_url: sig.source_url,
        source_type: sig.source_type,
      });
    if (insertErr) {
      console.error("[refresh] signal insert failed:", insertErr);
      continue;
    }
    signalsApplied++;

    // Apply score: targeted to one lead, or top-N alphabetical for vertical-wide.
    const targets = leadId
      ? [{ id: leadId, intent_signal_score: 0 }]
      : ((
          await supabase
            .from("sales_leads")
            .select("id, intent_signal_score")
            .eq("account_id", accountId)
            .eq("vertical", vertical)
            .eq("city", city)
            .order("business_name", { ascending: true })
            .limit(VERTICAL_BOOST_TOP_N)
        ).data ?? []) as Array<{ id: string; intent_signal_score: number }>;

    for (const t of targets) {
      if (sig.signal_score <= (t.intent_signal_score ?? 0)) continue;
      const { error: updErr } = await supabase
        .from("sales_leads")
        .update({
          intent_signal_score: sig.signal_score,
          intent_signal_text: sig.signal_text,
          updated_at: new Date().toISOString(),
        })
        .eq("id", t.id);
      if (updErr) {
        console.error("[refresh] lead boost failed:", updErr);
        continue;
      }
      if (!boosted.has(t.id)) {
        boosted.add(t.id);
        leadsBoosted++;
      }
    }
  }

  return { signalsApplied, leadsBoosted };
}

async function fetchEnrichmentCandidates(
  supabase: SupabaseClient,
  accountId: string,
  vertical: Vertical,
  city: string,
  max: number,
): Promise<
  Array<{ id: string; business_name: string; address: string | null; city: string }>
> {
  const { data, error } = await supabase
    .from("sales_leads")
    .select("id, business_name, address, city")
    .eq("account_id", accountId)
    .eq("vertical", vertical)
    .eq("city", city)
    .gt("intent_signal_score", 0)
    .eq("enriched", false)
    .order("intent_signal_score", { ascending: false })
    .limit(max);
  if (error) throw error;
  return (data ?? []).map((d) => ({
    id: d.id as string,
    business_name: d.business_name as string,
    address: d.address as string | null,
    city: d.city as string,
  }));
}

async function applyEnrichmentResults(
  supabase: SupabaseClient,
  results: Awaited<ReturnType<typeof enrichWithGoogleMaps>>,
): Promise<{ enriched: number; failed: number }> {
  let enriched = 0;
  let failed = 0;
  for (const r of results) {
    if (r.enriched) {
      const { error } = await supabase
        .from("sales_leads")
        .update({
          rating: r.rating ?? null,
          review_count: r.review_count ?? null,
          last_review_date: r.last_review_date ?? null,
          enriched: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", r.leadId);
      if (error) {
        console.error("[refresh] enrich update failed:", error);
        failed++;
        continue;
      }
      enriched++;
      continue;
    }
    // Permanent failures (page loaded but no rating) get marked enriched=true
    // so we don't retry them. Transient failures (bot wall, network) leave
    // enriched=false for next run.
    if (r.error === "no_rating_found") {
      await supabase
        .from("sales_leads")
        .update({ enriched: true, updated_at: new Date().toISOString() })
        .eq("id", r.leadId);
    }
    failed++;
  }
  return { enriched, failed };
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const account = await getOrCreateAccount(supabase, user);
  const tier = tierById(account.tier_id);
  const allowed =
    Boolean(account.internal_account) || tier.allowedEmployees.includes("sales");
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: RefreshBody;
  try {
    body = (await request.json()) as RefreshBody;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!isVertical(body.vertical)) {
    return NextResponse.json({ error: "invalid_vertical" }, { status: 400 });
  }
  if (!body.city || !resolveCity(body.city)) {
    return NextResponse.json({ error: "invalid_city" }, { status: 400 });
  }

  const requestedSources = (body.sources ?? VALID_SOURCES).filter(
    (s): s is Source => (VALID_SOURCES as readonly string[]).includes(s),
  );
  const sources = requestedSources.length ? requestedSources : VALID_SOURCES;
  const maxEnrich = Math.min(
    Math.max(0, body.maxEnrich ?? DEFAULT_MAX_ENRICH),
    HARD_MAX_ENRICH,
  );

  const vertical = body.vertical as Vertical;
  const cityResolved = resolveCity(body.city)!;
  const city = cityResolved.display;

  const errors_per_source: Record<Source, string | null> = {
    overpass: null,
    reddit: null,
    google_maps: null,
  };
  let added = 0;
  let skipped = 0;
  let signals_found = 0;
  let leads_boosted = 0;
  let enriched = 0;

  if (sources.includes("overpass")) {
    try {
      const leads = await discoverViaOverpass({ vertical, city });
      const r = await upsertLeads(supabase, account.id, leads);
      added += r.added;
      skipped += r.skipped;
    } catch (err) {
      errors_per_source.overpass =
        err instanceof Error ? err.message : String(err);
    }
  }

  if (sources.includes("reddit")) {
    try {
      const subs = await fetchActiveSubreddits(supabase, city);
      if (subs.length > 0) {
        const signals = await fetchRedditIntent({
          vertical,
          city,
          subreddits: subs,
        });
        const r = await applyIntentSignals(
          supabase,
          account.id,
          vertical,
          city,
          signals,
        );
        signals_found = r.signalsApplied;
        leads_boosted = r.leadsBoosted;
      }
    } catch (err) {
      errors_per_source.reddit =
        err instanceof Error ? err.message : String(err);
    }
  }

  if (sources.includes("google_maps") && maxEnrich > 0) {
    try {
      const candidates = await fetchEnrichmentCandidates(
        supabase,
        account.id,
        vertical,
        city,
        maxEnrich,
      );
      if (candidates.length > 0) {
        const results = await enrichWithGoogleMaps({
          leads: candidates,
          maxFetches: maxEnrich,
        });
        const r = await applyEnrichmentResults(supabase, results);
        enriched = r.enriched;
      }
    } catch (err) {
      errors_per_source.google_maps =
        err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json({
    ok: true,
    added,
    updated: leads_boosted,
    skipped,
    signals_found,
    enriched,
    errors_per_source,
  });
}
