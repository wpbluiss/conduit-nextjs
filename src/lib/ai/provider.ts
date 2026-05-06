import Anthropic from "@anthropic-ai/sdk";

export type ProviderName = "anthropic" | "openai" | "together" | "groq";

export type EmployeeKey = "jarvis" | "marketing" | "sales" | "engineering";

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

const SONNET = "claude-sonnet-4-20250514";
const HAIKU = "claude-haiku-4-5-20251001";

// R2: most employees on Haiku. Engineering keeps Sonnet for when it executes for real in R6.
export function modelForEmployee(
  employee: EmployeeKey | undefined,
  opts: { creatorMode?: boolean } = {},
): string {
  if (opts.creatorMode) return HAIKU;
  switch (employee) {
    case "engineering":
      return SONNET;
    case "jarvis":
    case "marketing":
    case "sales":
    default:
      return HAIKU;
  }
}

const DEFAULT_MAX_TOKENS: Record<EmployeeKey, number> = {
  jarvis: 800,
  marketing: 4000,
  sales: 600,
  engineering: 1200,
};

export function maxTokensFor(employee: EmployeeKey | undefined): number {
  return employee ? DEFAULT_MAX_TOKENS[employee] : 1024;
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
