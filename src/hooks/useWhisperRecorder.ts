"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type WhisperState = "idle" | "recording" | "transcribing" | "error";

export interface UseWhisperRecorderResult {
  supported: boolean;
  state: WhisperState;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  cancel: () => void;
}

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const mt of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mt)) {
      return mt;
    }
  }
  return "";
}

export function useWhisperRecorder(
  onTranscript: (text: string) => void,
): UseWhisperRecorderResult {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<WhisperState>("idle");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupported(typeof MediaRecorder !== "undefined");
  }, []);

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const start = useCallback(async () => {
    if (!supported || state !== "idle") return;
    cancelledRef.current = false;
    setError(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("mic_denied");
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      releaseStream();
      if (cancelledRef.current) {
        setState("idle");
        return;
      }
      const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
      chunksRef.current = [];

      if (blob.size === 0) {
        setState("idle");
        return;
      }

      setState("transcribing");
      try {
        const form = new FormData();
        form.append("audio", blob, `audio.${mimeType.split("/")[1]?.split(";")[0] ?? "webm"}`);
        const resp = await fetch("/api/conduit/transcribe", {
          method: "POST",
          body: form,
        });
        if (!resp.ok) {
          setError("transcription_failed");
          setState("error");
          return;
        }
        const json = (await resp.json()) as { transcript?: string };
        const text = (json.transcript ?? "").trim();
        if (text) onTranscript(text);
        setState("idle");
      } catch {
        setError("transcription_failed");
        setState("error");
      }
    };

    recorder.onerror = () => {
      releaseStream();
      setError("recording_error");
      setState("error");
    };

    recorder.start(250);
    setState("recording");
  }, [supported, state, onTranscript]);

  const stop = useCallback(() => {
    if (state !== "recording") return;
    mediaRecorderRef.current?.stop();
  }, [state]);

  const cancel = useCallback(() => {
    if (state === "idle") return;
    cancelledRef.current = true;
    mediaRecorderRef.current?.stop();
    releaseStream();
    chunksRef.current = [];
    setState("idle");
    setError(null);
  }, [state]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      releaseStream();
    };
  }, []);

  return { supported, state, error, start, stop, cancel };
}
