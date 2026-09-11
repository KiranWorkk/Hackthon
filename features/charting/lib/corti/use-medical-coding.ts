"use client";

import { useCallback, useState } from "react";
import type {
  MedicalCodingStatus,
  PredictedCode,
} from "@/features/charting/lib/corti/types";

interface CodingResponse {
  codes?: PredictedCode[];
  candidates?: PredictedCode[];
  error?: string;
}

/**
 * Predicts ICD-10-CM/CPT codes for the finished chart note via
 * POST /api/corti/coding. Meant to be triggered once, after the ambient
 * voice session has fully stopped — not a live/streaming feature like
 * useCortiListen.
 */
export function useMedicalCoding() {
  const [status, setStatus] = useState<MedicalCodingStatus>("idle");
  const [codes, setCodes] = useState<PredictedCode[]>([]);
  const [candidates, setCandidates] = useState<PredictedCode[]>([]);
  const [error, setError] = useState<string | null>(null);

  const predict = useCallback(async (noteText: string) => {
    if (!noteText.trim()) {
      setStatus("error");
      setError("Nothing was charted during this visit yet.");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/corti/coding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: noteText }),
      });
      const body = (await res.json()) as CodingResponse;
      if (!res.ok) {
        throw new Error(body.error ?? "Could not predict medical codes.");
      }
      setCodes(body.codes ?? []);
      setCandidates(body.candidates ?? []);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not predict medical codes.");
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setCodes([]);
    setCandidates([]);
    setError(null);
  }, []);

  return { status, codes, candidates, error, predict, reset };
}
