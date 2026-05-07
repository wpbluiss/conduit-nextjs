// OpenStreetMap Overpass API — free HTTP, no auth, no ToS friction.
// Per-vertical OSM tag matrix. Queries by city centroid + radius.
// Returns normalized leads ready to upsert into sales_leads.

import {
  type NormalizedLead,
  type Vertical,
  resolveCity,
  sleep,
} from "./types";

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const DEFAULT_RADIUS_M = 15000;
const REQUEST_DELAY_MS = 2000;

let lastRequestAt = 0;

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

/**
 * Per-vertical Overpass QL filter clauses. Each entry is appended to
 * `node[...]` / `way[...]` and queried within a radius around the city
 * centroid.
 *
 * Overpass regex modifiers were unreliable for our queries — we cast a
 * wide net at the API level and post-filter by name keywords in JS.
 */
const VERTICAL_TAG_QUERIES: Record<Vertical, string[]> = {
  med_spa: [
    `["shop"="beauty"]`,
    `["healthcare"="clinic"]`,
    `["amenity"="clinic"]`,
    `["healthcare"="dermatology"]`,
  ],
  dental: [`["amenity"="dentist"]`, `["healthcare"="dentist"]`],
  real_estate: [
    `["office"="estate_agent"]`,
    `["office"="real_estate"]`,
    `["shop"="estate_agent"]`,
  ],
  restaurant: [`["amenity"="restaurant"]`],
  salon: [`["shop"="hairdresser"]`, `["shop"="beauty"]`],
};

/**
 * Vertical-specific name filters applied client-side after Overpass returns.
 * Empty array = keep everything (used when the OSM tag is already specific
 * enough — e.g. amenity=dentist).
 */
const VERTICAL_NAME_KEYWORDS: Record<Vertical, RegExp | null> = {
  med_spa: /spa|aesthetic|wellness|derm|cosmetic|botox|laser|rejuven|skin|medical/i,
  dental: null,
  real_estate: null,
  restaurant: null,
  salon: /salon|hair|nail|barber|stylist|cuts|color/i,
};

/**
 * Names we explicitly exclude from med_spa even if they match keywords —
 * pure nail salons, lash bars, etc. that happen to contain "spa" in the name.
 */
const VERTICAL_NAME_EXCLUDE: Record<Vertical, RegExp | null> = {
  med_spa: /\b(nails?|lash(es)?|brow|wax|tan|blow ?dry)\b/i,
  dental: null,
  real_estate: null,
  restaurant: null,
  salon: null,
};

function rateLimit(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, REQUEST_DELAY_MS - (now - lastRequestAt));
  lastRequestAt = now + wait;
  return wait > 0 ? sleep(wait) : Promise.resolve();
}

async function callOverpass(query: string): Promise<OverpassResponse> {
  await rateLimit();
  const body = new URLSearchParams();
  body.set("data", query);
  const res = await fetch(OVERPASS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent":
        "ConduitAI/0.1 (lead-discovery; contact:support@conduitai.io)",
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `overpass ${res.status} ${res.statusText}: ${text.slice(0, 200)}`,
    );
  }
  return (await res.json()) as OverpassResponse;
}

function buildQuery(
  vertical: Vertical,
  lat: number,
  lng: number,
  radiusM: number,
): string {
  const filters = VERTICAL_TAG_QUERIES[vertical];
  const around = `(around:${radiusM},${lat},${lng})`;
  const clauses = filters
    .flatMap((f) => [`node${f}${around};`, `way${f}${around};`])
    .join("");
  return `[out:json][timeout:25];(${clauses});out center tags;`;
}

function buildAddress(tags: Record<string, string>): string | null {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:unit"] ? `# ${tags["addr:unit"]}` : null,
  ]
    .filter(Boolean)
    .join(" ");
  const cityPart = [
    tags["addr:city"],
    tags["addr:state"],
    tags["addr:postcode"],
  ]
    .filter(Boolean)
    .join(", ");
  const full = [parts, cityPart].filter(Boolean).join(", ");
  return full || null;
}

function normalizePhone(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.length < 7) return null;
  return digits;
}

function normalizeWebsite(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function elementToLead(
  el: OverpassElement,
  vertical: Vertical,
  city: string,
  state: string,
): NormalizedLead | null {
  const tags = el.tags ?? {};
  const name = tags.name?.trim();
  if (!name) return null;

  const lat = el.lat ?? el.center?.lat ?? null;
  const lng = el.lon ?? el.center?.lon ?? null;

  return {
    source: "overpass",
    business_name: name,
    vertical,
    city,
    state,
    phone: normalizePhone(tags.phone || tags["contact:phone"]),
    website: normalizeWebsite(tags.website || tags["contact:website"]),
    address: buildAddress(tags),
    lat,
    lng,
    rating: null,
    review_count: null,
    raw_payload: {
      osm_type: el.type,
      osm_id: el.id,
      tags,
    },
  };
}

/**
 * Discover businesses in a vertical near a city via Overpass.
 *
 * Returns normalized leads with name + location + (optional) phone/website.
 * Rating/review_count are left null — Maps enrichment fills those later for
 * leads that pass the intent gate.
 */
export async function discoverViaOverpass(opts: {
  vertical: Vertical;
  city: string;
  radiusM?: number;
}): Promise<NormalizedLead[]> {
  const loc = resolveCity(opts.city);
  if (!loc) {
    throw new Error(`unknown city: ${opts.city}`);
  }
  const radius = opts.radiusM ?? DEFAULT_RADIUS_M;
  const query = buildQuery(opts.vertical, loc.lat, loc.lng, radius);
  const result = await callOverpass(query);

  const include = VERTICAL_NAME_KEYWORDS[opts.vertical];
  const exclude = VERTICAL_NAME_EXCLUDE[opts.vertical];

  // Dedupe by (lower-cased name + lat rounded to 4 decimals) — Overpass can
  // return the same business as both node + way.
  const seen = new Set<string>();
  const leads: NormalizedLead[] = [];
  for (const el of result.elements) {
    const lead = elementToLead(el, opts.vertical, loc.display, loc.state);
    if (!lead) continue;
    if (include && !include.test(lead.business_name)) continue;
    if (exclude && exclude.test(lead.business_name)) continue;
    const key = `${lead.business_name.toLowerCase()}::${lead.lat?.toFixed(4) ?? "x"}`;
    if (seen.has(key)) continue;
    seen.add(key);
    leads.push(lead);
  }
  return leads;
}
