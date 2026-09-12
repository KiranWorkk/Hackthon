"use client";

/**
 * Records mic audio via MediaRecorder (the same, proven-reliable API this
 * app already uses for the Corti session — see use-corti-listen.ts) and
 * decodes it to raw PCM client-side so it can be re-encoded as WAV.
 * OpenAI's audio-input chat models (used server-side to transcribe the
 * patient's consent response) only accept "wav" or "mp3" — confirmed by
 * testing directly against the API, which rejects "webm" (MediaRecorder's
 * native output) with a 400 — hence the decode-and-re-encode step.
 *
 * An earlier version of this used ScriptProcessorNode to capture raw PCM
 * directly, which is deprecated and a plausible silent-failure point in
 * some browsers; MediaRecorder is the same capture path already proven to
 * work reliably in this codebase.
 */

// Audio models will happily transcribe pure silence into fabricated speech
// rather than report "nothing was said" — confirmed directly: a 2s silent
// clip sent to the classification endpoint came back as
// {"transcript":"Sure, that's fine.","consent":true}. For a consent gate
// that's a real safety problem (recording could auto-start on dead air), so
// silence is detected deterministically here, client-side, before the clip
// is ever sent for transcription.
const SILENCE_RMS_THRESHOLD = 0.015;

export interface RecordedClip {
  blob: Blob;
  /** False when the clip's RMS never rose above the silence floor — caller should skip transcription entirely rather than risk a hallucinated result. */
  hasSpeech: boolean;
}

function pickMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm"];
  for (const candidate of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return "";
}

export async function recordWavClip(durationMs: number, signal?: AbortSignal): Promise<RecordedClip> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  try {
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    const recorderStopped = new Promise<void>((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = (event) => reject(event instanceof Error ? event : new Error("MediaRecorder error"));
    });

    recorder.start();

    try {
      await new Promise<void>((resolve, reject) => {
        if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
        const timer = setTimeout(resolve, durationMs);
        signal?.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true }
        );
      });
    } finally {
      if (recorder.state !== "inactive") recorder.stop();
    }

    await recorderStopped;

    const recordedBlob = new Blob(chunks, { type: mimeType || "audio/webm" });
    if (recordedBlob.size === 0) {
      // Nothing was ever captured (e.g. stopped immediately on abort) —
      // treat as silence rather than attempting to decode an empty blob.
      return { blob: encodeWav(new Float32Array(0), 48000), hasSpeech: false };
    }

    const arrayBuffer = await recordedBlob.arrayBuffer();
    const AudioContextCtor =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const decodeContext = new AudioContextCtor();
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await decodeContext.decodeAudioData(arrayBuffer);
    } finally {
      await decodeContext.close().catch(() => {});
    }

    const samples = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    return { blob: encodeWav(samples, sampleRate), hasSpeech: computeRms(samples) >= SILENCE_RMS_THRESHOLD };
  } catch (err) {
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    if (!isAbort) {
      console.error("[consent-audio] recordWavClip failed —", err);
    }
    throw err;
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}

function computeRms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sumSquares = 0;
  for (let i = 0; i < samples.length; i++) sumSquares += samples[i] * samples[i];
  return Math.sqrt(sumSquares / samples.length);
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate (mono, 16-bit)
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the "data:audio/wav;base64," prefix — the API route only wants the payload.
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
