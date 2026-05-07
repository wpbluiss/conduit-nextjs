// R13: server-side ElevenLabs streaming TTS for text-chat audio. Mirrors
// the worker's WS contract (eleven_turbo_v2_5, pcm_24000,
// optimize_streaming_latency=3) so a future refactor can collapse this
// into a shared package. Sentence-segments incoming token deltas and
// pushes whole sentences to the WS — gives the user audible feedback
// within ~500-900ms of the first sentence completing.

import WebSocket from "ws";
import { EventEmitter } from "node:events";

const ENDPOINT_BASE = "wss://api.elevenlabs.io/v1/text-to-speech";
const MODEL = process.env.ELEVENLABS_MODEL || "eleven_turbo_v2_5";
const INACTIVITY_TIMEOUT_S = "180";

export interface StreamingTtsEvents {
  audio: (pcm: Buffer) => void;
  done: () => void;
  error: (err: Error) => void;
}

export declare interface StreamingTts {
  on<K extends keyof StreamingTtsEvents>(
    event: K,
    listener: StreamingTtsEvents[K],
  ): this;
  emit<K extends keyof StreamingTtsEvents>(
    event: K,
    ...args: Parameters<StreamingTtsEvents[K]>
  ): boolean;
}

export class StreamingTts extends EventEmitter {
  private ws: WebSocket | null = null;
  private opened = false;
  private closing = false;
  private pendingText: string[] = [];

  constructor(
    private readonly voiceId: string,
    private readonly opts: {
      stability?: number;
      similarity?: number;
      speed?: number;
    } = {},
  ) {
    super();
  }

  connect(apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const params = new URLSearchParams({
        model_id: MODEL,
        output_format: "pcm_24000",
        optimize_streaming_latency: "3",
        inactivity_timeout: INACTIVITY_TIMEOUT_S,
      });
      const url = `${ENDPOINT_BASE}/${this.voiceId}/stream-input?${params.toString()}`;
      this.ws = new WebSocket(url, {
        headers: { "xi-api-key": apiKey },
      });
      this.ws.on("open", () => {
        this.ws?.send(
          JSON.stringify({
            text: " ",
            voice_settings: {
              stability: this.opts.stability ?? 0.5,
              similarity_boost: this.opts.similarity ?? 0.75,
              speed: this.opts.speed ?? 0.9,
            },
            xi_api_key: apiKey,
          }),
        );
        this.opened = true;
        // Flush anything that pushText queued before connect resolved.
        for (const t of this.pendingText) this.sendChunk(t);
        this.pendingText = [];
        resolve();
      });
      this.ws.on("message", (data) => this.handleMessage(data));
      this.ws.on("error", (err) => {
        if (!this.opened) reject(err);
        this.emit("error", err);
      });
      this.ws.on("close", () => {
        if (!this.closing) this.emit("done");
      });
    });
  }

  private handleMessage(raw: WebSocket.RawData) {
    let event: { audio?: string; isFinal?: boolean; error?: string };
    try {
      event = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (event.error) {
      this.emit("error", new Error(event.error));
      return;
    }
    if (event.audio) {
      this.emit("audio", Buffer.from(event.audio, "base64"));
    }
    if (event.isFinal) this.emit("done");
  }

  private sendChunk(text: string) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({ text, try_trigger_generation: true }),
    );
  }

  /** Queue a chunk of text. Safe to call before connect resolves — it'll
   *  flush in order once the WS is ready. */
  pushText(text: string) {
    if (this.closing) return;
    if (!this.opened) {
      this.pendingText.push(text);
      return;
    }
    this.sendChunk(text);
  }

  /** Flush + clean close. Server pushes any remaining audio then sends
   *  isFinal:true; the close handler emits "done". */
  end() {
    if (!this.opened || this.closing) return;
    this.closing = true;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ text: "" }));
      setTimeout(() => this.ws?.close(), 200);
    } else {
      this.ws?.close();
    }
  }

  abort() {
    this.closing = true;
    this.ws?.close();
  }
}

/**
 * Sentence segmenter for streaming token deltas. Holds an internal buffer;
 * each call appends `delta` and returns 0+ completed sentences. A "sentence"
 * ends at . ? ! followed by whitespace/end, or at a hard newline. Dotted
 * abbreviations (e.g. "U.S.") are not handled in v1 — TTS quality is fine
 * either way, just an extra split.
 */
export class SentenceSegmenter {
  private buffer = "";
  private readonly minLen: number;

  constructor(opts: { minSentenceLen?: number } = {}) {
    this.minLen = opts.minSentenceLen ?? 8;
  }

  push(delta: string): string[] {
    this.buffer += delta;
    const sentences: string[] = [];
    // Match a sentence ending: terminator + optional close-quote/paren + ws or eob
    const re = /([^.?!\n]+[.?!]+["')\]]?(?=\s|$)|[^.?!\n]+\n)/g;
    let lastEnd = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(this.buffer)) !== null) {
      const sentence = m[0].trim();
      if (sentence.length >= this.minLen) {
        sentences.push(sentence);
        lastEnd = m.index + m[0].length;
      }
    }
    if (lastEnd > 0) this.buffer = this.buffer.slice(lastEnd);
    return sentences;
  }

  /** Anything still in the buffer at end-of-stream — caller should flush
   *  this to TTS before closing the stream. */
  flush(): string {
    const remaining = this.buffer.trim();
    this.buffer = "";
    return remaining;
  }
}
