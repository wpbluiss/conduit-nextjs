"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecordingState = "idle" | "requesting" | "recording" | "uploading";

export interface UseVoiceRecorderResult {
  supported: boolean;
  state: RecordingState;
  elapsedSeconds: number;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  cancel: () => void;
}

// Best codec to use on the current browser/OS.
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

export function useVoiceRecorder(
  onRecorded: (blob: Blob, mimeType: string) => Promise<void>,
): UseVoiceRecorderResult {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<RecordingState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeTypeRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupported(typeof MediaRecorder !== "undefined");
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const start = useCallback(async () => {
    if (!supported || state !== "idle") return;
    setError(null);
    setState("requesting");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("mic_denied");
      setState("idle");
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const mimeType = pickMimeType();
    mimeTypeRef.current = mimeType;

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      clearTimer();
      releaseStream();
      const resolvedMime = mimeTypeRef.current || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: resolvedMime });
      chunksRef.current = [];

      if (blob.size > 0) {
        setState("uploading");
        try {
          await onRecorded(blob, resolvedMime);
        } catch {
          setError("upload_failed");
        }
      }
      setState("idle");
      setElapsedSeconds(0);
    };

    recorder.onerror = () => {
      clearTimer();
      releaseStream();
      setError("recording_error");
      setState("idle");
      setElapsedSeconds(0);
    };

    recorder.start(250);
    setState("recording");
    setElapsedSeconds(0);

    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  }, [supported, state, onRecorded]);

  const stop = useCallback(() => {
    if (state !== "recording") return;
    mediaRecorderRef.current?.stop();
  }, [state]);

  const cancel = useCallback(() => {
    if (state !== "recording" && state !== "requesting") return;
    clearTimer();
    mediaRecorderRef.current?.stop();
    releaseStream();
    chunksRef.current = [];
    setState("idle");
    setElapsedSeconds(0);
  }, [state]);

  useEffect(() => {
    return () => {
      clearTimer();
      releaseStream();
    };
  }, []);

  return { supported, state, elapsedSeconds, error, start, stop, cancel };
}
