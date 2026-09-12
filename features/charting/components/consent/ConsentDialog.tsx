"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { VolumeHighIcon, Mic01Icon, AlertCircleIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { recordConsent, type ConsentRecord } from "@/features/charting/lib/consent";
import { recordWavClip, blobToBase64, type RecordedClip } from "@/features/charting/lib/consent-audio";

const DISCLOSURE_TEXT =
  "This visit is being audio recorded and processed by an AI assistant to help create your clinical documentation. " +
  "The recording and any notes generated from it will be stored as part of your medical record and protected under HIPAA. " +
  "Do you consent to being recorded for this purpose?";

// Fixed listening window: record exactly this long, then send the clip off
// for transcription + classification — no early cutoff on silence.
const LISTEN_DURATION_MS = 10000;
// How long to show "Patient declined" before auto-closing, so the
// clinician has time to see what was detected without needing to click.
const DECLINE_AUTOCLOSE_MS = 3000;

type PlaybackState = "loading" | "playing" | "played" | "fallback" | "error";
type ConsentPhase = "idle" | "listening" | "analyzing" | "yes" | "no" | "unclear";

/** Speaks DISCLOSURE_TEXT via the browser's built-in speech synthesis — used when the OpenRouter TTS call fails or is slow, so getting consent is never blocked on a third-party API being up. */
function speakWithBrowserTts(onDone: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onDone();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(DISCLOSURE_TEXT);
  utterance.rate = 0.95;
  utterance.onend = onDone;
  utterance.onerror = onDone;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

/**
 * Records exactly LISTEN_DURATION_MS of mic audio, then sends it to
 * /api/consent-listen, which transcribes it and classifies it as
 * true/false/null consent in one call (openai/gpt-audio-mini, the same
 * cheap audio-capable model used for the disclosure voice — OpenRouter
 * doesn't expose a separate dedicated transcription endpoint). Reports the
 * transcript and verdict back via the callbacks; `signal` lets the caller
 * cut the recording short (dialog closed, Replay clicked).
 */
async function listenAndClassifyConsent(
  onResult: (transcript: string, consent: boolean | null) => void,
  onFailure: () => void,
  onRecordingDone: () => void,
  signal: AbortSignal
) {
  let clip: RecordedClip;
  try {
    clip = await recordWavClip(LISTEN_DURATION_MS, signal);
  } catch {
    // Intentional cancel (superseded/dialog closed) — say nothing. Anything
    // else (mic permission denied, no getUserMedia support) is a real
    // failure the caller needs to know about so it doesn't sit on
    // "Listening…" forever.
    if (!signal.aborted) onFailure();
    return;
  }
  if (signal.aborted) return;

  if (!clip.hasSpeech) {
    // Nothing audible was said — treat as "no response" without ever
    // calling the classifier. Sending silence to the model risks a
    // hallucinated transcript/verdict (confirmed directly: a silent clip
    // came back "consent: true"), which is not a risk worth taking on a
    // consent gate.
    onResult("", null);
    return;
  }

  onRecordingDone();

  try {
    const audioBase64 = await blobToBase64(clip.blob);
    const res = await fetch("/api/consent-listen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioBase64, format: "wav" }),
      signal,
    });
    if (signal.aborted) return;
    if (!res.ok) throw new Error("consent-listen request failed");
    const body = (await res.json()) as { transcript?: string; consent?: boolean | null };
    onResult(body.transcript ?? "", body.consent ?? null);
  } catch {
    if (signal.aborted) return;
    onFailure();
  }
}

/**
 * Owns the actual playback + consent state. Mounted fresh every time the
 * dialog opens (see ConsentDialog below) so state naturally resets on each
 * "Listen" click without needing to reset it imperatively from an effect.
 */
function ConsentDisclosureBody({
  patientId,
  patientName,
  onConfirm,
  onCancel,
}: {
  patientId: string;
  patientName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>("loading");
  const [consentPhase, setConsentPhase] = useState<ConsentPhase>("idle");
  const [heardText, setHeardText] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const listenAbortRef = useRef<AbortController | null>(null);
  const autoCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumped every beginPlayback() call; every async callback below checks it
  // against the id it captured before acting. Without this, an aborted call
  // (e.g. React StrictMode's dev-only double-invoke of this effect, or a
  // quick double click of Replay) still runs its .catch() handler — which
  // used to always fall back to the browser voice — *after* a newer call
  // has already started the real OpenRouter audio, so both play at once.
  const callIdRef = useRef(0);

  const finishConsent = useCallback(
    (
      disclosureMethod: ConsentRecord["disclosureMethod"],
      confirmationMethod: ConsentRecord["confirmationMethod"]
    ) => {
      const record: ConsentRecord = {
        patientId,
        patientName,
        consentedAt: new Date().toISOString(),
        disclosureMethod,
        confirmationMethod,
      };
      recordConsent(record);
      onConfirm();
    },
    [patientId, patientName, onConfirm]
  );

  // Called only from event/async callbacks (audio ended, TTS fallback
  // ended) — never synchronously from an effect body — so it doesn't run
  // into React's "don't setState synchronously in an effect" guidance.
  const startListeningForConsent = useCallback(
    (playbackMethod: "audible-tts" | "browser-speech-synthesis") => {
      listenAbortRef.current?.abort();
      const controller = new AbortController();
      listenAbortRef.current = controller;

      setConsentPhase("listening");
      setHeardText("");

      // Not awaited — this runs in the background and reports back via the
      // callbacks below.
      listenAndClassifyConsent(
        (transcript, consent) => {
          if (controller.signal.aborted) return;
          setHeardText(transcript);
          const phase = consent === true ? "yes" : consent === false ? "no" : "unclear";
          setConsentPhase(phase);
          if (phase === "yes") {
            finishConsent(playbackMethod, "voice-auto-detected");
          } else if (phase === "no") {
            autoCloseTimeoutRef.current = setTimeout(onCancel, DECLINE_AUTOCLOSE_MS);
          }
        },
        () => {
          if (controller.signal.aborted) return;
          setConsentPhase("unclear");
        },
        () => {
          // The fixed 10s recording window just ended — the rest is
          // upload + transcription/classification, worth its own status so
          // the UI doesn't look stuck for that last leg.
          if (controller.signal.aborted) return;
          setConsentPhase("analyzing");
        },
        controller.signal
      );
    },
    [finishConsent, onCancel]
  );

  const beginPlayback = useCallback(() => {
    cleanupRef.current?.();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();

    const callId = ++callIdRef.current;
    const isCurrent = () => callIdRef.current === callId;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    fetch("/api/consent-speech", { method: "POST", signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("consent-speech request failed");
        const body = (await res.json()) as { audioBase64?: string; format?: string };
        if (!body.audioBase64) throw new Error("no audio in response");
        if (!isCurrent()) return; // superseded while the request was in flight

        const audio = new Audio(`data:audio/${body.format ?? "wav"};base64,${body.audioBase64}`);
        audioRef.current = audio;
        setPlaybackState("playing");
        audio.onended = () => {
          if (!isCurrent()) return;
          setPlaybackState("played");
          startListeningForConsent("audible-tts");
        };
        audio.onerror = () => {
          if (!isCurrent()) return;
          speakWithBrowserTts(() => {
            if (!isCurrent()) return;
            setPlaybackState("fallback");
            startListeningForConsent("browser-speech-synthesis");
          });
        };
        await audio.play();
      })
      .catch((err) => {
        // Cancelled on purpose (superseded, or the abort timeout) — not a
        // real failure, say nothing and definitely don't speak over the
        // call that superseded this one.
        if (!isCurrent() || (err instanceof DOMException && err.name === "AbortError")) return;

        // OpenRouter unavailable/slow/erroring — never let that block
        // consent. Fall back to the browser's own voice so the disclosure
        // still gets spoken aloud.
        setPlaybackState("playing");
        speakWithBrowserTts(() => {
          if (!isCurrent()) return;
          setPlaybackState("fallback");
          startListeningForConsent("browser-speech-synthesis");
        });
      })
      .finally(() => clearTimeout(timeoutId));

    cleanupRef.current = () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [startListeningForConsent]);

  useEffect(() => {
    beginPlayback();
    return () => {
      callIdRef.current = callIdRef.current + 1; // invalidate any in-flight callback from this call
      cleanupRef.current?.();
      listenAbortRef.current?.abort();
      if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);
      audioRef.current?.pause();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, [beginPlayback]);

  const handleReplay = () => {
    listenAbortRef.current?.abort();
    if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current);
    setConsentPhase("idle");
    setPlaybackState("loading");
    beginPlayback();
  };

  const handleListenAgain = () => {
    startListeningForConsent(playbackState === "fallback" ? "browser-speech-synthesis" : "audible-tts");
  };

  const handleManualConfirm = () => {
    listenAbortRef.current?.abort();
    finishConsent(playbackState === "fallback" ? "browser-speech-synthesis" : "audible-tts", "manual-button");
  };

  const isSpeaking = playbackState === "loading" || playbackState === "playing";
  const isListening = consentPhase === "listening";
  const isAnalyzing = consentPhase === "analyzing";

  return (
    <>
      <DialogHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#F0FDFA]">
          <HugeiconsIcon
            icon={
              isSpeaking || isListening || isAnalyzing
                ? isListening
                  ? Mic01Icon
                  : VolumeHighIcon
                : CheckmarkCircle02Icon
            }
            size={18}
            strokeWidth={2}
            className={isListening ? "text-primary animate-pulse" : "text-primary"}
          />
        </div>
        <DialogTitle>Patient Consent Required</DialogTitle>
        <DialogDescription>
          {patientName || "The patient"} will hear this read aloud, then their spoken response is
          listened for automatically.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
        {DISCLOSURE_TEXT}
      </div>

      <div className="flex flex-col gap-1.5 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          {isSpeaking && <span>Playing disclosure aloud…</span>}
          {playbackState !== "loading" && playbackState !== "playing" && consentPhase === "idle" && (
            <span>Disclosure played.</span>
          )}
          {isListening && (
            <span className="flex items-center gap-1.5 font-medium text-primary">
              <HugeiconsIcon icon={Mic01Icon} size={13} strokeWidth={2} />
              Listening for the patient&rsquo;s response… (up to 10s)
            </span>
          )}
          {isAnalyzing && (
            <span className="flex items-center gap-1.5 font-medium text-primary">
              <HugeiconsIcon icon={Mic01Icon} size={13} strokeWidth={2} />
              Analyzing response…
            </span>
          )}
          {consentPhase === "yes" && (
            <span className="flex items-center gap-1 text-emerald-600">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} strokeWidth={2} />
              Consent detected — starting recording…
            </span>
          )}
          {consentPhase === "no" && (
            <span className="flex items-center gap-1 text-red-600">
              <HugeiconsIcon icon={AlertCircleIcon} size={13} strokeWidth={2} />
              Patient declined — closing…
            </span>
          )}
          {consentPhase === "unclear" && (
            <span className="flex items-center gap-1 text-amber-600">
              <HugeiconsIcon icon={AlertCircleIcon} size={13} strokeWidth={2} />
              Didn&rsquo;t catch a clear response — confirm manually below.
            </span>
          )}
          {playbackState === "error" && (
            <span className="flex items-center gap-1 text-amber-600">
              <HugeiconsIcon icon={AlertCircleIcon} size={13} strokeWidth={2} />
              Couldn&rsquo;t play audio — please read the statement above aloud.
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-slate-500"
            onClick={handleReplay}
          >
            Replay
          </Button>
          {consentPhase === "unclear" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-slate-500"
              onClick={handleListenAgain}
            >
              Listen again
            </Button>
          )}
        </div>
        {heardText && consentPhase !== "idle" && consentPhase !== "listening" && (
          <span className="italic text-slate-400">Heard: &ldquo;{heardText}&rdquo;</span>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleManualConfirm}>Patient Consents — Start Recording</Button>
      </DialogFooter>
    </>
  );
}

/**
 * Gate shown every time "Listen" is clicked, before any recording starts.
 * Plays the consent disclosure aloud (OpenRouter audio model, falling back
 * to the browser's own speech synthesis if that call fails or times out),
 * then automatically listens for the patient's spoken response — an
 * affirmative answer starts the Corti session with no button press; a
 * negative or unclear one falls back to the manual buttons below. Every
 * confirmation is written to the session's consent audit log (see
 * lib/consent.ts).
 */
export function ConsentDialog({
  open,
  patientId,
  patientName,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  patientId: string;
  patientName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-[480px]">
        {open && (
          <ConsentDisclosureBody
            patientId={patientId}
            patientName={patientName}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
