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
  metadata?: { employee?: EmployeeKey; accountId?: string };
}

export interface CompletionResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  provider: ProviderName;
  model: string;
}

export interface StreamChunk {
  delta?: string;
  done?: boolean;
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
  provider?: ProviderName;
}

const SONNET = "claude-sonnet-4-20250514";
const HAIKU = "claude-haiku-4-5-20251001";

export function modelForEmployee(employee: EmployeeKey | undefined): string {
  switch (employee) {
    case "marketing":
    case "sales":
      return HAIKU;
    case "engineering":
    case "jarvis":
    default:
      return SONNET;
  }
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

export async function complete(req: CompletionRequest): Promise<CompletionResponse> {
  const provider = defaultProvider();
  const model = modelForEmployee(req.metadata?.employee);
  if (provider !== "anthropic") {
    throw new Error("PROVIDER_NOT_IMPLEMENTED");
  }
  const client = getAnthropic();
  const res = await client.messages.create({
    model,
    max_tokens: req.maxTokens ?? 2048,
    system: req.systemPrompt,
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
    provider,
    model,
  };
}

export async function* streamComplete(
  req: CompletionRequest,
): AsyncGenerator<StreamChunk> {
  const provider = defaultProvider();
  const model = modelForEmployee(req.metadata?.employee);
  if (provider !== "anthropic") {
    throw new Error("PROVIDER_NOT_IMPLEMENTED");
  }
  const client = getAnthropic();
  let inputTokens = 0;
  let outputTokens = 0;

  const stream = await client.messages.stream({
    model,
    max_tokens: req.maxTokens ?? 2048,
    system: req.systemPrompt,
    messages: toAnthropicMessages(req.messages),
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield { delta: event.delta.text };
    } else if (event.type === "message_start") {
      inputTokens = event.message.usage?.input_tokens ?? 0;
      outputTokens = event.message.usage?.output_tokens ?? 0;
    } else if (event.type === "message_delta") {
      outputTokens = event.usage?.output_tokens ?? outputTokens;
    }
  }

  yield {
    done: true,
    inputTokens,
    outputTokens,
    model,
    provider,
  };
}

// Friendly error message — never leaks provider names.
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
