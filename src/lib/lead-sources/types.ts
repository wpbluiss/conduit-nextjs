// Shared types for the R11 lead-source pipeline. Three modules, one shape.

export type Vertical =
  | "med_spa"
  | "dental"
  | "real_estate"
  | "restaurant"
  | "salon";

export const VERTICALS: Vertical[] = [
  "med_spa",
  "dental",
  "real_estate",
  "restaurant",
  "salon",
];

export const VERTICAL_LABELS: Record<Vertical, string> = {
  med_spa: "Med Spa",
  dental: "Dental",
  real_estate: "Real Estate",
  restaurant: "Restaurant",
  salon: "Salon",
};

export type LeadSource = "overpass" | "reddit" | "google_maps";

export interface NormalizedLead {
  source: LeadSource;
  business_name: string;
  vertical: Vertical;
  city: string;
  state: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  rating?: number | null;
  review_count?: number | null;
  raw_payload: Record<string, unknown>;
}

export interface IntentSignal {
  vertical: Vertical | null;
  city: string | null;
  signal_text: string;
  signal_score: number; // 0-100
  source_url: string;
  source_type: "reddit";
  matched_business_name?: string | null;
}

export interface EnrichmentResult {
  leadId: string;
  rating?: number | null;
  review_count?: number | null;
  last_review_date?: string | null;
  enriched: boolean;
  error?: string;
}

// City -> centroid + state. Adding a city = one map entry.
export interface CityLocation {
  lat: number;
  lng: number;
  state: string;
  // canonical display name; user-input city strings normalize to this key
  display: string;
}

export const CITY_LOCATIONS: Record<string, CityLocation> = {
  "west palm beach": {
    lat: 26.7153,
    lng: -80.0534,
    state: "FL",
    display: "West Palm Beach",
  },
  "boca raton": {
    lat: 26.3683,
    lng: -80.1289,
    state: "FL",
    display: "Boca Raton",
  },
  "delray beach": {
    lat: 26.4615,
    lng: -80.0728,
    state: "FL",
    display: "Delray Beach",
  },
  jupiter: {
    lat: 26.9342,
    lng: -80.0942,
    state: "FL",
    display: "Jupiter",
  },
};

export function cityKey(city: string): string {
  return city.trim().toLowerCase();
}

export function resolveCity(city: string): CityLocation | null {
  return CITY_LOCATIONS[cityKey(city)] ?? null;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
