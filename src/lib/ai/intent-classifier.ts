import Anthropic from "@anthropic-ai/sdk";
import type { EmployeeKey } from "./provider";

export type IntentClass =
  | "routing"
  | "creative"
  | "reasoning"
  | "code"
  | "factual";

const VALID_INTENTS: IntentClass[] = [
  "routing",
  "creative",
  "reasoning",
  "code",
  "factual",
];

const CLASSIFIER_MODEL = "claude-haiku-4-5-20251001";

const CLASSIFIER_PROMPT = `You are an intent classifier. Read the user message and respond with ONE word from this list: routing, creative, reasoning, code, factual. No explanation, no punctuation, just the word.

routing = simple chat, classification, basic decisions
creative = writing content, marketing copy, social posts, blog posts, drafting messages
reasoning = strategic analysis, multi-step planning, complex business questions, prioritization
code = anything involving programming, architecture, technical implementation
factual = quick facts, definitions, lookups requiring no analysis`;

// LRU-ish cache: max 50 entries, evict oldest by Map insertion order.
const cache = new Map<string, IntentClass>();
const CACHE_MAX = 50;

function cacheKey(message: string, employee: EmployeeKey): string {
  return `${employee}::${message.slice(0, 200).toLowerCase().trim()}`;
}

function fromCache(key: string): IntentClass | undefined {
  const hit = cache.get(key);
  if (hit !== undefined) {
    // Re-insert to move to most-recent.
    cache.delete(key);
    cache.set(key, hit);
  }
  return hit;
}

function toCache(key: string, intent: IntentClass) {
  if (cache.size >= CACHE_MAX) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, intent);
}

function heuristicIntent(
  message: string,
  employee: EmployeeKey,
): IntentClass | null {
  const m = message.toLowerCase().trim();
  if (!m) return "routing";
  if (m.length < 24) return "routing";
  if (employee === "engineering") return "code";
  if (employee === "marketing") return "creative";
  return null;
}

/**
 * Classify the intent of a message. Returns "routing" on any failure so the
 * platform stays cheap when the classifier itself is unreachable.
 */
export async function classifyIntent(
  message: string,
  context: { employee: EmployeeKey; history?: { role: string; content: string }[] },
): Promise<IntentClass> {
  const heur = heuristicIntent(message, context.employee);
  if (heur) return heur;

  const key = cacheKey(message, context.employee);
  const cached = fromCache(key);
  if (cached) return cached;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "routing";

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: CLASSIFIER_MODEL,
      max_tokens: 8,
      system: CLASSIFIER_PROMPT,
      messages: [{ role: "user", content: message }],
    });
    const raw = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .toLowerCase()
      .replace(/[^a-z]/g, "")
      .trim();
    const intent = (VALID_INTENTS.includes(raw as IntentClass)
      ? raw
      : "routing") as IntentClass;
    toCache(key, intent);
    return intent;
  } catch (err) {
    console.error("intent classifier error", err);
    return "routing";
  }
}
