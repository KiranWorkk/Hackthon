"use client";

import { useEffect, useRef } from "react";
import type { ListenStatus } from "@/features/charting/lib/corti/types";

const BAR_WIDTH = 2;
const BAR_GAP = 2;
const CANVAS_WIDTH = 220;
const CANVAS_HEIGHT = 32;
const ACTIVE_COLOR = "#008fa3";
const PAUSED_COLOR = "#cbd5e1";
const IDLE_COLOR = "#e2e8f0";

/**
 * Live bar-waveform driven by a Web Audio AnalyserNode tapping the recorder's
 * own MediaStream. Built in-house rather than via a canned "audio visualizer"
 * package: the obvious npm choice (react-audio-visualize) bundles a stale
 * JSX-runtime shim that reaches into React's pre-19 internal
 * `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher`,
 * which no longer exists under that name in React 19 and crashes on import.
 */
export function ListeningWaveform({
  recorder,
  status,
}: {
  recorder: MediaRecorder | null;
  status: ListenStatus;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stream = recorder?.stream;
    if (!canvas || !stream || status === "idle" || status === "error") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const barCount = Math.floor(CANVAS_WIDTH / (BAR_WIDTH + BAR_GAP));
    let rafId: number;

    const draw = () => {
      const isPaused = recorder.state === "paused";
      if (!isPaused) analyser.getByteFrequencyData(data);

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const color = isPaused ? PAUSED_COLOR : ACTIVE_COLOR;
      ctx.fillStyle = color;

      const step = Math.max(1, Math.floor(data.length / barCount));
      for (let i = 0; i < barCount; i++) {
        const sample = data[i * step] ?? 0;
        const amplitude = isPaused ? 2 : Math.max(2, (sample / 255) * CANVAS_HEIGHT);
        const x = i * (BAR_WIDTH + BAR_GAP);
        const y = (CANVAS_HEIGHT - amplitude) / 2;
        ctx.fillRect(x, y, BAR_WIDTH, amplitude);
      }

      rafId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafId);
      source.disconnect();
      analyser.disconnect();
      if (audioContext.state !== "closed") audioContext.close();
    };
  }, [recorder, status]);

  if (!recorder || status === "idle" || status === "error") {
    return (
      <div className="flex h-8 w-full items-center gap-[3px] overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="h-[3px] w-[2px] shrink-0 rounded-full"
            style={{ backgroundColor: IDLE_COLOR }}
          />
        ))}
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="h-8 w-full"
    />
  );
}
