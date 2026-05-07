"use client";

import { useEffect, useRef } from "react";

interface Props {
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  color: string;
  /** Number of bars across the width. */
  bars?: number;
  /** Minimum bar height in pixels (so a flat input still renders something). */
  minBarPx?: number;
}

/**
 * Canvas-rendered amplitude bars driven by a Web Audio AnalyserNode.
 * The component reads `analyserRef.current` every frame so callers can
 * swap the analyser in after construction without a re-render.
 */
export default function Waveform({
  analyserRef,
  color,
  bars = 28,
  minBarPx = 2,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf = 0;
    const buf = new Uint8Array(256);

    const draw = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const cssW = canvas.offsetWidth;
        const cssH = canvas.offsetHeight;
        if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
          canvas.width = cssW * dpr;
          canvas.height = cssH * dpr;
        }
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const w = canvas.width;
          const h = canvas.height;
          const analyser = analyserRef.current;
          if (analyser) {
            analyser.getByteFrequencyData(buf);
          } else {
            buf.fill(0);
          }
          const barW = w / bars;
          for (let i = 0; i < bars; i++) {
            const idx = Math.floor((i / bars) * buf.length);
            const v = buf[idx] / 255;
            const barH = Math.max(minBarPx * dpr, v * h * 0.9);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.25 + v * 0.7;
            ctx.fillRect(
              i * barW + 1,
              (h - barH) / 2,
              Math.max(2, barW - 2),
              barH,
            );
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [analyserRef, color, bars, minBarPx]);

  return <canvas ref={canvasRef} className="w-full h-12 block" />;
}
