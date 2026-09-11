"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClinicalFact, ListenStatus, TranscriptSegment } from "@/features/charting/lib/corti/types";
import type { VisitSheetSoapGroup } from "@/features/charting/types";
import { buildSoapSlots, type SoapSlot, type SoapUpdate } from "@/features/charting/lib/ai/soap-slots";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

const SYNC_INTERVAL_MS = 18000;

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
}: {
  listenStatus: ListenStatus;
  segments: TranscriptSegment[];
  facts: ClinicalFact[];
  soapGroups: VisitSheetSoapGroup[];
  onUpdates: (updates: SoapUpdate[], slots: SoapSlot[]) => void;
}) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const segmentsRef = useRef(segments);
  const factsRef = useRef(facts);
  const soapGroupsRef = useRef(soapGroups);
  const onUpdatesRef = useRef(onUpdates);
  const inFlightRef = useRef(false);
  const pendingRerunRef = useRef(false);
  const prevListenStatusRef = useRef<ListenStatus>(listenStatus);
  const runSyncRef = useRef<() => void>(() => {});

  useEffect(() => {
    segmentsRef.current = segments;
    factsRef.current = facts;
    soapGroupsRef.current = soapGroups;
    onUpdatesRef.current = onUpdates;
  }, [segments, facts, soapGroups, onUpdates]);

  const runSync = useCallback(async () => {
    if (inFlightRef.current) {
      // A sync is already in flight (e.g. the periodic tick and the
      // end-of-session catch-up landed close together) — don't drop this
      // request, run it again right after the current one finishes so the
      // last bit of conversation never silently goes unsynced.
      pendingRerunRef.current = true;
      return;
    }

    const transcript = segmentsRef.current
      .filter((segment) => segment.isFinal)
      .map((segment) => segment.text)
      .join(" ");
    const currentFacts = factsRef.current.filter((fact) => !fact.isDiscarded);
    if (!transcript.trim() && currentFacts.length === 0) return;

    const slots = buildSoapSlots(soapGroupsRef.current);
    if (slots.length === 0) return;

    inFlightRef.current = true;
    setSyncStatus("syncing");
    setSyncError(null);

    try {
      const res = await fetch("/api/soap-parser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      if (updates.length > 0) onUpdatesRef.current(updates, slots);

      setSyncStatus("synced");
      setLastSyncedAt(Date.now());
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "AI chart sync failed.");
      setSyncStatus("error");
    } finally {
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
