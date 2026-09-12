"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClinicalFact, ListenStatus, TranscriptSegment } from "@/features/charting/lib/corti/types";
import type { VisitSheetSoapGroup } from "@/features/charting/types";
import { buildSoapSlots, type SoapSlot, type SoapUpdate } from "@/features/charting/lib/ai/soap-slots";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

const SYNC_INTERVAL_MS = 18000;
// Cap how long a single sync waits on the server. Without this, a slow
// provider response holds inFlightRef locked indefinitely, silently eating
// every 18s tick in between and making the chart mapping look frozen. Set
// just above the API route's own worst case (2 attempts x 20s + a short
// retry gap, see app/api/soap-parser/route.ts) so a request that's actually
// about to succeed isn't aborted client-side out from under it.
const SYNC_TIMEOUT_MS = 45000;

/**
 * Periodically (while Corti is listening) sends the accumulated transcript +
 * extracted facts + the current chart's fillable slots to /api/soap-parser,
 * and hands any proposed updates to `onUpdates` for the caller to apply and
 * animate. Runs at most one request at a time; skips a tick if the previous
 * call hasn't returned yet.
 */
export function useSoapOrchestrator({
  listenStatus,
  segments,
  facts,
  soapGroups,
  onUpdates,
  onEvidenceUsed,
}: {
  listenStatus: ListenStatus;
  segments: TranscriptSegment[];
  facts: ClinicalFact[];
  soapGroups: VisitSheetSoapGroup[];
  onUpdates: (updates: SoapUpdate[], slots: SoapSlot[]) => void;
  /** Called with the ids of every final transcript segment that was part of a sync request which produced at least one chart update — used to mark that speech as "reflected in the chart" in the Evidence tab. Not per-field attribution (the model isn't asked which exact sentence grounded which exact slot), just "this batch of speech led to a change." */
  onEvidenceUsed?: (segmentIds: string[]) => void;
}) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const segmentsRef = useRef(segments);
  const factsRef = useRef(facts);
  const soapGroupsRef = useRef(soapGroups);
  const onUpdatesRef = useRef(onUpdates);
  const onEvidenceUsedRef = useRef(onEvidenceUsed);
  const inFlightRef = useRef(false);
  const pendingRerunRef = useRef(false);
  const prevListenStatusRef = useRef<ListenStatus>(listenStatus);
  const runSyncRef = useRef<() => void>(() => {});

  useEffect(() => {
    segmentsRef.current = segments;
    factsRef.current = facts;
    soapGroupsRef.current = soapGroups;
    onUpdatesRef.current = onUpdates;
    onEvidenceUsedRef.current = onEvidenceUsed;
  }, [segments, facts, soapGroups, onUpdates, onEvidenceUsed]);

  const runSync = useCallback(async () => {
    if (inFlightRef.current) {
      // A sync is already in flight (e.g. the periodic tick and the
      // end-of-session catch-up landed close together) — don't drop this
      // request, run it again right after the current one finishes so the
      // last bit of conversation never silently goes unsynced.
      pendingRerunRef.current = true;
      return;
    }

    const finalSegments = segmentsRef.current.filter((segment) => segment.isFinal);
    const transcript = finalSegments.map((segment) => segment.text).join(" ");
    const currentFacts = factsRef.current.filter((fact) => !fact.isDiscarded);
    if (!transcript.trim() && currentFacts.length === 0) return;

    const slots = buildSoapSlots(soapGroupsRef.current);
    if (slots.length === 0) return;

    inFlightRef.current = true;
    setSyncStatus("syncing");
    setSyncError(null);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), SYNC_TIMEOUT_MS);

    try {
      const res = await fetch("/api/soap-parser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          transcript,
          facts: currentFacts.map((fact) => ({ text: fact.text, group: fact.group })),
          slots: slots.map(({ slotId, compntName, itmName, itmCode, soap, currentValue, allowedValues }) => ({
            slotId,
            compntName,
            itmName,
            itmCode,
            soap,
            currentValue,
            allowedValues,
          })),
        }),
      });
      const body = (await res.json()) as { updates?: SoapUpdate[]; error?: string };
      if (!res.ok) throw new Error(body.error ?? "AI chart sync failed.");

      const updates = body.updates ?? [];
      if (updates.length > 0) {
        onUpdatesRef.current(updates, slots);
        onEvidenceUsedRef.current?.(finalSegments.map((segment) => segment.id));
      }

      setSyncStatus("synced");
      setLastSyncedAt(Date.now());
    } catch (err) {
      const isTimeout = err instanceof DOMException && err.name === "AbortError";
      setSyncError(
        isTimeout
          ? "AI chart sync timed out — will retry on the next pass."
          : err instanceof Error
            ? err.message
            : "AI chart sync failed."
      );
      setSyncStatus("error");
    } finally {
      clearTimeout(timeoutId);
      inFlightRef.current = false;
      if (pendingRerunRef.current) {
        pendingRerunRef.current = false;
        runSyncRef.current();
      }
    }
  }, []);

  useEffect(() => {
    runSyncRef.current = runSync;
  }, [runSync]);

  useEffect(() => {
    if (listenStatus !== "listening") return;
    const interval = setInterval(runSync, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [listenStatus, runSync]);

  // The periodic interval above only runs *during* "listening", so a session
  // shorter than SYNC_INTERVAL_MS (or one stopped between ticks) would
  // otherwise sync nothing. Fire an extra sync the moment listening starts
  // (fast first pass) and a guaranteed catch-up sync the moment it ends
  // (idle or error, after having been listening/stopping) so nothing said
  // since the last tick is ever left off the chart.
  useEffect(() => {
    const previous = prevListenStatusRef.current;
    prevListenStatusRef.current = listenStatus;

    const justStarted = previous !== "listening" && listenStatus === "listening";
    const wasActive = previous === "listening" || previous === "stopping";
    const justEnded = wasActive && (listenStatus === "idle" || listenStatus === "error");

    if (justStarted || justEnded) {
      runSync();
    }
  }, [listenStatus, runSync]);

  return { syncStatus, lastSyncedAt, syncError };
}
