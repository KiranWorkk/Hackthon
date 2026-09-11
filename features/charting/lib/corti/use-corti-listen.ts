"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type {
  ClinicalFact,
  ListenStatus,
  SpeakerInfo,
  TranscriptSegment,
} from "@/features/charting/lib/corti/types";

interface SessionResponse {
  accessToken: string;
  tenantName: string;
  environment: string;
  interactionId: string;
  websocketUrl: string;
}

interface RawTranscriptEntry {
  id?: string;
  transcript?: string;
  text?: string;
  final?: boolean;
  isFinal?: boolean;
  speakerId?: string | number;
  time?: { start?: number; end?: number };
  start?: number;
  end?: number;
}

interface RawFactEntry {
  id?: string;
  text?: string;
  group?: string;
  factGroup?: string;
  isDiscarded?: boolean;
  source?: string;
}

const SPEAKER_COLOR_COUNT = 4;

/** Picks a MediaRecorder mimeType the browser actually supports, in preference order. */
function pickAudioMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm"];
  for (const candidate of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return "audio/webm";
}

function normalizeSpeakerId(raw: string | number | undefined): string {
  if (raw === undefined || raw === null || raw === -1 || raw === "-1") return "unknown";
  return String(raw);
}

/**
 * Streams microphone audio to Corti's diarizing /streams endpoint so a
 * single-mic conversation (clinician + patient in the same room) comes back
 * speaker-separated. Flow: POST /api/corti/session mints a token and creates
 * a Corti "interaction" server-side, then the browser opens the returned
 * websocketUrl directly and streams raw audio chunks.
 *
 * Corti assigns speakerId per detected voice but has no concept of
 * "doctor"/"patient" — that mapping is app-layer, done here via
 * `renameSpeaker` (see SpeakerInfo).
 */
export function useCortiListen() {
  const [status, setStatus] = useState<ListenStatus>("idle");
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [speakerOrder, setSpeakerOrder] = useState<string[]>([]);
  const [speakerLabels, setSpeakerLabels] = useState<Record<string, string>>({});
  const [facts, setFacts] = useState<ClinicalFact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const teardownMedia = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecorder(null);
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      setStatus("stopping");
      ws.send(JSON.stringify({ type: "end" }));
    } else {
      teardownMedia();
      setStatus("idle");
    }
  }, [teardownMedia]);

  const registerSpeaker = useCallback((speakerId: string) => {
    setSpeakerOrder((prev) => (prev.includes(speakerId) ? prev : [...prev, speakerId]));
  }, []);

  const renameSpeaker = useCallback((speakerId: string, label: string) => {
    setSpeakerLabels((prev) => ({ ...prev, [speakerId]: label }));
  }, []);

  const pause = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.pause();
      setStatus("paused");
    }
  }, []);

  const resume = useCallback(() => {
    if (recorderRef.current?.state === "paused") {
      recorderRef.current.resume();
      setStatus("listening");
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setSegments([]);
    setSpeakerOrder([]);
    setSpeakerLabels({});
    setFacts([]);
    setStatus("connecting");

    try {
      const sessionRes = await fetch("/api/corti/session", { method: "POST" });
      const sessionBody = (await sessionRes.json()) as Partial<SessionResponse> & {
        error?: string;
      };
      if (!sessionRes.ok || !sessionBody.accessToken || !sessionBody.websocketUrl) {
        throw new Error(sessionBody.error ?? "Could not start a listening session.");
      }
      const { accessToken, tenantName, websocketUrl } = sessionBody as SessionResponse;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = pickAudioMimeType();

      // websocketUrl from Corti may already carry ?tenant-name=... — add to it rather than assuming a bare URL.
      // Built by hand (not URLSearchParams, which encodes spaces as "+") because Corti's
      // docs specifically show the bearer token space as %20 — a "+" here silently breaks auth.
      const hasTenantParam = /[?&]tenant-name=/.test(websocketUrl);
      const separator = websocketUrl.includes("?") ? "&" : "?";
      let wsUrl = websocketUrl;
      if (!hasTenantParam) {
        wsUrl += `${separator}tenant-name=${encodeURIComponent(tenantName)}`;
      }
      wsUrl += `${wsUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(`Bearer ${accessToken}`)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "config",
            configuration: {
              transcription: {
                primaryLanguage: "en",
                diarize: true,
                isMultichannel: false,
                participants: [{ channel: 0, role: "multiple" }],
              },
              // "facts" mode turns on Corti's FactsR clinical-fact extraction
              // (symptoms, history, meds, etc.) on top of the live transcript.
              // fast_init ramps extraction faster (~10s first pass) instead of
              // waiting the default ~60s, which matters for a short demo.
              mode: {
                type: "facts",
                outputLocale: "en",
                factGenerationInterval: "fast_init",
              },
            },
          })
        );
      };

      ws.onmessage = (event) => {
        if (typeof event.data !== "string") return;
        let msg: {
          type?: string;
          data?: RawTranscriptEntry[];
          fact?: RawFactEntry[];
          message?: string;
          detail?: string;
        };
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (process.env.NODE_ENV !== "production") {
          console.debug("[corti]", msg.type, msg);
        }

        if (msg.type === "error" || msg.type === "ERROR") {
          setError(msg.message ?? msg.detail ?? "Corti reported an error.");
          setStatus("error");
          teardownMedia();
          ws.close();
          return;
        }

        if (msg.type === "CONFIG_ACCEPTED") {
          setStatus("listening");
          const newRecorder = new MediaRecorder(stream, { mimeType });
          recorderRef.current = newRecorder;
          setRecorder(newRecorder);
          newRecorder.ondataavailable = (chunk) => {
            if (chunk.data.size === 0 || ws.readyState !== WebSocket.OPEN) return;
            chunk.data.arrayBuffer().then((buffer) => {
              if (ws.readyState === WebSocket.OPEN) ws.send(buffer);
            });
          };
          // Smaller timeslice = audio reaches Corti sooner (each chunk only
          // fires ondataavailable once it closes) — 300ms added a fixed
          // floor on top of Corti's own network/STT latency for every
          // utterance; 120ms trims that without meaningfully raising chunk
          // overhead.
          newRecorder.start(120);
          return;
        }

        if (msg.type === "transcript" && Array.isArray(msg.data)) {
          const entries = msg.data;
          setSegments((prev) => {
            // Keyed by id so a resent/corrected final segment (Corti can redeliver
            // the same id) replaces in place instead of duplicating — duplicate ids
            // as React keys is what was throwing the "same key" warning.
            const finalizedById = new Map(
              prev.filter((segment) => segment.isFinal).map((segment) => [segment.id, segment])
            );
            const interimBySpeaker = new Map(
              prev.filter((s) => !s.isFinal).map((s) => [s.speakerId, s])
            );

            for (const entry of entries) {
              const text = entry.transcript ?? entry.text ?? "";
              if (!text) continue;
              const isFinal = entry.final ?? entry.isFinal ?? false;
              const speakerId = normalizeSpeakerId(entry.speakerId);
              const start = entry.time?.start ?? entry.start ?? 0;
              const end = entry.time?.end ?? entry.end ?? 0;
              registerSpeaker(speakerId);

              if (isFinal) {
                const id = entry.id ?? `${speakerId}-${start}-${end}`;
                finalizedById.set(id, {
                  id,
                  text,
                  isFinal: true,
                  start,
                  end,
                  speakerId,
                });
                interimBySpeaker.delete(speakerId);
              } else {
                interimBySpeaker.set(speakerId, {
                  id: `interim-${speakerId}`,
                  text,
                  isFinal: false,
                  start,
                  end,
                  speakerId,
                });
              }
            }

            const finalized = Array.from(finalizedById.values()).sort((a, b) => a.start - b.start);
            return [...finalized, ...interimBySpeaker.values()];
          });
          return;
        }

        if (msg.type === "facts" && Array.isArray(msg.fact)) {
          const incoming = msg.fact;
          setFacts((prev) => {
            const byId = new Map(prev.map((fact) => [fact.id, fact]));
            for (const raw of incoming) {
              if (!raw.id || !raw.text) continue;
              byId.set(raw.id, {
                id: raw.id,
                text: raw.text,
                group: raw.group ?? raw.factGroup ?? "general",
                isDiscarded: raw.isDiscarded ?? false,
                source: raw.source ?? "core",
              });
            }
            return Array.from(byId.values());
          });
          return;
        }

        if (msg.type === "ENDED" || msg.type === "ended") {
          teardownMedia();
          setStatus("idle");
          ws.close();
        }
      };

      ws.onerror = () => {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[corti] websocket error", wsUrl.replace(/token=[^&]+/, "token=<redacted>"));
        }
      };

      ws.onclose = (closeEvent) => {
        teardownMedia();
        setStatus((current) => {
          if (current === "error") return current;
          // A close before we ever reached "listening" means the server rejected
          // the connection/config — surface the close code so it's diagnosable
          // instead of silently reverting to idle.
          if (current === "connecting" || current === "listening") {
            setError(
              closeEvent.reason ||
                `Corti closed the connection unexpectedly (code ${closeEvent.code}).`
            );
            return "error";
          }
          return "idle";
        });
      };
    } catch (err) {
      teardownMedia();
      setError(err instanceof Error ? err.message : "Could not start listening.");
      setStatus("error");
    }
  }, [registerSpeaker, teardownMedia]);

  const speakers = useMemo<SpeakerInfo[]>(
    () =>
      speakerOrder.map((speakerId, index) => ({
        speakerId,
        label: speakerLabels[speakerId] ?? `Speaker ${index + 1}`,
        colorIndex: index % SPEAKER_COLOR_COUNT,
      })),
    [speakerOrder, speakerLabels]
  );

  return {
    status,
    segments,
    speakers,
    facts,
    error,
    recorder,
    start,
    stop,
    pause,
    resume,
    renameSpeaker,
  };
}
