// Reddit JSON intent scraper. Public endpoints, no auth.
// Per-vertical keyword filter narrows posts before Haiku spends tokens on
// classification. Returns IntentSignal[] — vertical/city-level boosts when
// no specific business is named, lead-targeted boosts when one is.

import Anthropic from "@anthropic-ai/sdk";
import { type IntentSignal, type Vertical, sleep } from "./types";

const REDDIT_USER_AGENT =
  "ConduitAI/0.1 (lead-intent-scanner; contact:support@conduitai.io)";
const REDDIT_REQUEST_DELAY_MS = 2000;
const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const MAX_POSTS_PER_SUB = 50;

let lastRedditRequestAt = 0;

interface RedditPost {
  title: string;
  selftext: string;
  permalink: string;
  created_utc: number;
  author: string;
  subreddit: string;
}

interface RedditListingResponse {
  data?: {
    children: Array<{ data: RedditPost }>;
  };
}

const VERTICAL_KEYWORDS: Record<Vertical, string[]> = {
  med_spa: [
    "med spa",
    "medspa",
    "medical spa",
    "botox",
    "filler",
    "dysport",
    "laser hair",
    "laser treatment",
    "facial",
    "aesthetic",
    "dermatologist",
    "derm",
    "cosmetic",
    "rejuven",
    "skin treatment",
    "microneedling",
    "coolsculpting",
  ],
  dental: [
    "dentist",
    "dental",
    "orthodontist",
    "ortho",
    "teeth",
    "braces",
    "invisalign",
    "cavity",
    "cleaning",
    "root canal",
    "veneers",
    "implant",
  ],
  real_estate: [
    "realtor",
    "real estate",
    "real-estate",
    "agent",
    "broker",
    "buying a house",
    "selling my house",
    "selling our",
    "listing",
    "for sale by owner",
    "fsbo",
    "mortgage",
  ],
  restaurant: [
    "restaurant",
    "place to eat",
    "dinner",
    "lunch spot",
    "good food",
    "where to eat",
    "any recommendations for",
    "best food",
    "where should we eat",
  ],
  salon: [
    "salon",
    "haircut",
    "stylist",
    "hairdresser",
    "blowout",
    "color my hair",
    "hair color",
    "highlights",
    "barber",
    "manicure",
    "nail salon",
  ],
};

function redditRateLimit(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, REDDIT_REQUEST_DELAY_MS - (now - lastRedditRequestAt));
  lastRedditRequestAt = now + wait;
  return wait > 0 ? sleep(wait) : Promise.resolve();
}

async function fetchSubredditPosts(
  subreddit: string,
  limit: number,
): Promise<RedditPost[]> {
  await redditRateLimit();
  const url = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/new.json?limit=${limit}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": REDDIT_USER_AGENT,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`reddit ${res.status} ${res.statusText} for r/${subreddit}`);
  }
  const json = (await res.json()) as RedditListingResponse;
  return (json.data?.children ?? []).map((c) => c.data);
}

function matchesVertical(text: string, vertical: Vertical): boolean {
  const lower = text.toLowerCase();
  return VERTICAL_KEYWORDS[vertical].some((kw) => lower.includes(kw));
}

interface HaikuClassification {
  score: number;
  signal_text: string;
  business_name_mentioned: string | null;
}

const CLASSIFIER_SYSTEM = `You score Reddit posts for buying intent in a specific vertical + city.

Return ONLY valid JSON in this exact shape:
{"score": <0-100 integer>, "signal_text": "<<=120 char excerpt of the buying intent>", "business_name_mentioned": "<specific business name OR null>"}

Scoring:
- 0-20: not relevant / off-topic / no buying intent
- 21-50: vague interest, general curiosity
- 51-80: clear active search ("looking for", "any recommendations", "need a new", "switching from")
- 81-100: ready-to-buy ("appointment this week", "scheduling tomorrow", explicit budget)

If the post mentions a specific named business (e.g. "tried Glow Med Spa"), put that in business_name_mentioned. Otherwise null.

No prose, no markdown fences, no explanation. JUST the JSON object.`;

async function classifyPost(opts: {
  client: Anthropic;
  text: string;
  vertical: Vertical;
  city: string;
}): Promise<HaikuClassification | null> {
  const userMsg = `Vertical: ${opts.vertical}
City: ${opts.city}

Reddit post:
${opts.text.slice(0, 1500)}`;

  try {
    const res = await opts.client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 200,
      system: CLASSIFIER_SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    });
    const raw = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    // Strip ```json fences if Haiku adds them despite instructions
    const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(cleaned) as HaikuClassification;
    if (
      typeof parsed.score !== "number" ||
      typeof parsed.signal_text !== "string"
    ) {
      return null;
    }
    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      signal_text: parsed.signal_text.slice(0, 200),
      business_name_mentioned:
        typeof parsed.business_name_mentioned === "string" &&
        parsed.business_name_mentioned.trim()
          ? parsed.business_name_mentioned.trim()
          : null,
    };
  } catch (err) {
    console.error("[reddit] haiku classify failed:", err);
    return null;
  }
}

/**
 * Pull Reddit intent signals for a vertical + city across configured subs.
 *
 * Workflow per sub:
 *   1. Fetch /new.json (last MAX_POSTS_PER_SUB posts)
 *   2. Keyword-prefilter against VERTICAL_KEYWORDS
 *   3. Run Haiku scoring on survivors
 *   4. Keep signals with score > 20
 *
 * Skips Haiku entirely if ANTHROPIC_API_KEY is unset (returns []) so
 * non-prod environments don't break the pipeline.
 */
export async function fetchRedditIntent(opts: {
  vertical: Vertical;
  city: string;
  subreddits: string[];
  apiKey?: string;
  maxPostsPerSub?: number;
}): Promise<IntentSignal[]> {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[reddit] ANTHROPIC_API_KEY unset, skipping intent extraction");
    return [];
  }
  const client = new Anthropic({ apiKey });
  const limit = opts.maxPostsPerSub ?? MAX_POSTS_PER_SUB;
  const signals: IntentSignal[] = [];

  for (const sub of opts.subreddits) {
    let posts: RedditPost[] = [];
    try {
      posts = await fetchSubredditPosts(sub, limit);
    } catch (err) {
      console.error(`[reddit] fetch r/${sub} failed:`, err);
      continue;
    }

    for (const post of posts) {
      const text = `${post.title}\n${post.selftext ?? ""}`.trim();
      if (!matchesVertical(text, opts.vertical)) continue;

      const classification = await classifyPost({
        client,
        text,
        vertical: opts.vertical,
        city: opts.city,
      });
      if (!classification) continue;
      if (classification.score < 21) continue;

      signals.push({
        vertical: opts.vertical,
        city: opts.city,
        signal_text: classification.signal_text,
        signal_score: classification.score,
        source_url: `https://reddit.com${post.permalink}`,
        source_type: "reddit",
        matched_business_name: classification.business_name_mentioned,
      });
    }
  }
  return signals;
}
