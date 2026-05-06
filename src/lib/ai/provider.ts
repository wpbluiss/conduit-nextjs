import Anthropic from "@anthropic-ai/sdk";
import type { IntentClass } from "./intent-classifier";
import type { ModelCeiling } from "@/lib/billing/tiers";

export type ProviderName = "anthropic" | "openai" | "together" | "groq";

export type EmployeeKey =
  | "jarvis"
  | "marketing"
  | "sales"
  | "engineering"
  | "finance"
  | "compliance"
  | "hr"
  | "ops"
  | "legal";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  systemPrompt: string;
  maxTokens?: number;
  metadata?: {
    employee?: EmployeeKey;
    accountId?: string;
    creatorMode?: boolean;
    creatorModeVersion?: number;
    intent?: IntentClass;
    tierCeiling?: ModelCeiling;
    internalAccount?: boolean;
  };
}

export interface CompletionResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  provider: ProviderName;
  model: string;
}

export interface StreamChunk {
  delta?: string;
  done?: boolean;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  model?: string;
  provider?: ProviderName;
}

const OPUS = "claude-opus-4-7";
const SONNET = "claude-sonnet-4-20250514";
const HAIKU = "claude-haiku-4-5-20251001";

/**
 * Conduit Adaptive — pick the model per request.
 *
 * Standard tier (Free / Pro): intent-based within Haiku/Sonnet.
 *   - reasoning + code → Sonnet
 *   - creative + routing + factual → Haiku
 *
 * Creator mode v1 (legacy): everything forced to Haiku.
 *
 * Creator mode v2 (Luis daily): Opus default with adaptive Sonnet fallback.
 *   - reasoning + code → Opus 4.7
 *   - creative + routing + factual → Sonnet 4
 *
 * Engineering keeps Sonnet on standard tier even on routing intent — it's the
 * fallback for the round before Engineering executes for real.
 */
export function modelForEmployee(
  employee: EmployeeKey | undefined,
  opts: {
    creatorMode?: boolean;
    creatorModeVersion?: number;
    intent?: IntentClass;
    tierCeiling?: ModelCeiling;
    internalAccount?: boolean;
  } = {},
): string {
  const intent = opts.intent ?? "routing";

  // Helper: clamp a chosen model to the account's tier ceiling.
  // Internal accounts bypass the ceiling entirely.
  const clamp = (model: string): string => {
    if (opts.internalAccount) return model;
    const ceiling = opts.tierCeiling ?? "opus";
    if (ceiling === "opus") return model;
    if (ceiling === "sonnet" && model === OPUS) return SONNET;
    if (ceiling === "haiku" && (model === OPUS || model === SONNET))
      return HAIKU;
    return model;
  };

  if (opts.creatorMode) {
    if ((opts.creatorModeVersion ?? 1) >= 2) {
      // v2: Opus-default adaptive
      if (intent === "reasoning" || intent === "code") return clamp(OPUS);
      return clamp(SONNET);
    }
    // v1: everything Haiku
    return HAIKU;
  }

  // Engineering: Sonnet baseline (no Haiku) until R7 real execution.
  if (employee === "engineering") return clamp(SONNET);

  // Legal + Compliance: Sonnet baseline — accuracy on these is non-negotiable
  // even on routine "what is HIPAA" questions.
  if (employee === "legal" || employee === "compliance")
    return clamp(SONNET);

  switch (intent) {
    case "reasoning":
    case "code":
      return clamp(SONNET);
    case "creative":
    case "routing":
    case "factual":
    default:
      return clamp(HAIKU);
  }
}

/**
 * Returns the ideal model for this turn ignoring the tier ceiling. Useful for
 * detecting when a downgrade happened so the UI can prompt an upgrade.
 */
export function idealModelForEmployee(
  employee: EmployeeKey | undefined,
  opts: {
    creatorMode?: boolean;
    creatorModeVersion?: number;
    intent?: IntentClass;
  } = {},
): string {
  return modelForEmployee(employee, { ...opts, tierCeiling: "opus" });
}

const DEFAULT_MAX_TOKENS: Record<EmployeeKey, number> = {
  jarvis: 800,
  marketing: 4000,
  sales: 600,
  engineering: 1200,
  finance: 1200,
  compliance: 1200,
  hr: 3000,
  ops: 2000,
  legal: 3000,
};

export function maxTokensFor(employee: EmployeeKey | undefined): number {
  return employee ? DEFAULT_MAX_TOKENS[employee] : 1024;
}

// Pricing table for cost estimator includes Opus 4.7.
// (Opus 4.7: $15 input / $75 output per MTok.)
export function pricingForModel(model: string): { input: number; output: number } | null {
  if (model === OPUS) return { input: 15, output: 75 };
  if (model === SONNET) return { input: 3, output: 15 };
  if (model === HAIKU) return { input: 1, output: 5 };
  return null;
}

export function defaultProvider(): ProviderName {
  return (process.env.CONDUIT_DEFAULT_PROVIDER as ProviderName) || "anthropic";
}

function getAnthropic(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("UPSTREAM_NOT_CONFIGURED");
  return new Anthropic({ apiKey: key });
}

function toAnthropicMessages(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
}

// System block carries cache_control so the Anthropic API ephemeral cache (5 min)
// reuses the prompt across follow-on turns in the same conversation.
function systemBlock(systemPrompt: string) {
  return [
    {
      type: "text" as const,
      text: systemPrompt,
      cache_control: { type: "ephemeral" as const },
    },
  ];
}

export async function complete(
  req: CompletionRequest,
): Promise<CompletionResponse> {
  const provider = defaultProvider();
  const model = modelForEmployee(req.metadata?.employee, {
    creatorMode: req.metadata?.creatorMode,
    creatorModeVersion: req.metadata?.creatorModeVersion,
    intent: req.metadata?.intent,
    tierCeiling: req.metadata?.tierCeiling,
    internalAccount: req.metadata?.internalAccount,
  });
  if (provider !== "anthropic") {
    throw new Error("PROVIDER_NOT_IMPLEMENTED");
  }
  const client = getAnthropic();
  const res = await client.messages.create({
    model,
    max_tokens: req.maxTokens ?? maxTokensFor(req.metadata?.employee),
    system: systemBlock(req.systemPrompt),
    messages: toAnthropicMessages(req.messages),
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return {
    content: text,
    inputTokens: res.usage.input_tokens,
    outputTokens: res.usage.output_tokens,
    cacheReadTokens: res.usage.cache_read_input_tokens ?? 0,
    cacheCreationTokens: res.usage.cache_creation_input_tokens ?? 0,
    provider,
    model,
  };
}

export async function* streamComplete(
  req: CompletionRequest,
): AsyncGenerator<StreamChunk> {
  const provider = defaultProvider();
  const model = modelForEmployee(req.metadata?.employee, {
    creatorMode: req.metadata?.creatorMode,
    creatorModeVersion: req.metadata?.creatorModeVersion,
    intent: req.metadata?.intent,
    tierCeiling: req.metadata?.tierCeiling,
    internalAccount: req.metadata?.internalAccount,
  });
  if (provider !== "anthropic") {
    throw new Error("PROVIDER_NOT_IMPLEMENTED");
  }
  const client = getAnthropic();

  const stream = client.messages.stream({
    model,
    max_tokens: req.maxTokens ?? maxTokensFor(req.metadata?.employee),
    system: systemBlock(req.systemPrompt),
    messages: toAnthropicMessages(req.messages),
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield { delta: event.delta.text };
    }
  }

  // finalMessage() guarantees both input and output usage are populated,
  // including cache_read_input_tokens / cache_creation_input_tokens.
  const final = await stream.finalMessage();
  yield {
    done: true,
    inputTokens: final.usage.input_tokens,
    outputTokens: final.usage.output_tokens,
    cacheReadTokens: final.usage.cache_read_input_tokens ?? 0,
    cacheCreationTokens: final.usage.cache_creation_input_tokens ?? 0,
    model,
    provider,
  };
}

export function friendlyErrorFor(employee: EmployeeKey | undefined): string {
  const name =
    employee === "marketing"
      ? "Marketing"
      : employee === "sales"
        ? "Sales"
        : employee === "engineering"
          ? "Engineering"
          : "Jarvis";
  return `${name} is taking a moment, try again.`;
}
