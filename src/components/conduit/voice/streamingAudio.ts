// R13 client-side streaming audio queue. Receives PCM16 chunks from the
// chat SSE stream, decodes them into AudioBuffers, and schedules them
// back-to-back so playback flows seamlessly. Designed to outlive a
// single message (one queue per browser tab, reused turn-after-turn).

const SAMPLE_RATE = 24_000;

interface QueueState {
  ctx: AudioContext;
  /** When the next scheduled chunk should start. Zero means "asap". */
  nextStartAt: number;
  /** Sources currently scheduled, so we can stop them on user interrupt. */
  scheduled: AudioBufferSourceNode[];
}

let state: QueueState | null = null;

function ensureCtx(): QueueState | null {
  if (state) return state;
  type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };
  const Ctor =
    window.AudioContext ||
    (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  state = {
    ctx: new Ctor({ sampleRate: SAMPLE_RATE }),
    nextStartAt: 0,
    scheduled: [],
  };
  return state;
}

/** Decode a base64-encoded PCM16 mono chunk into an AudioBuffer at 24kHz. */
function decodePcm(b64: string, ctx: AudioContext): AudioBuffer | null {
  if (!b64) return null;
  // atob + Uint8Array round-trip
  const bin = atob(b64);
  const len = bin.length;
  if (len < 2) return null;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
  // Reinterpret as little-endian Int16
  const pcm16 = new Int16Array(u8.buffer, u8.byteOffset, len / 2);
  const buffer = ctx.createBuffer(1, pcm16.length, SAMPLE_RATE);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < pcm16.length; i++) {
    channel[i] = pcm16[i] / 32768;
  }
  return buffer;
}

/** Push a chunk into the queue. Resumes the AudioContext if it was
 *  suspended (browsers suspend until a user gesture; the original chat
 *  message send IS that gesture, so this just covers the corner case). */
export function pushChunk(b64: string): void {
  const q = ensureCtx();
  if (!q) return;
  if (q.ctx.state === "suspended") void q.ctx.resume();
  const buf = decodePcm(b64, q.ctx);
  if (!buf) return;

  const startAt = Math.max(q.nextStartAt, q.ctx.currentTime + 0.02);
  const src = q.ctx.createBufferSource();
  src.buffer = buf;
  src.connect(q.ctx.destination);
  src.start(startAt);
  q.scheduled.push(src);
  src.onended = () => {
    q.scheduled = q.scheduled.filter((s) => s !== src);
  };
  q.nextStartAt = startAt + buf.duration;
}

/** Stop everything currently playing or scheduled. Safe to call repeatedly. */
export function stopAll(): void {
  if (!state) return;
  for (const src of state.scheduled) {
    try {
      src.stop();
    } catch {
      // ignore — already stopped
    }
  }
  state.scheduled = [];
  state.nextStartAt = state.ctx.currentTime;
}

export function isPlaying(): boolean {
  return Boolean(state && state.scheduled.length > 0);
}
