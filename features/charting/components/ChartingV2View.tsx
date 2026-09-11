"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PanelRight } from "lucide-react";
import type {
  ChartingV2Section,
  ChartSession,
  VisitSheetComponent,
  VisitSheetItem,
  VisitSheetSoapGroup,
} from "@/features/charting/types";
import { ChartingV2Header } from "@/features/charting/components/ChartingV2Header";
import { ChartingV2Nav } from "@/features/charting/components/ChartingV2Nav";
import { ChartingV2FaceSheet } from "@/features/charting/components/overview/ChartingV2FaceSheet";
import { StartChartingDialog } from "@/features/charting/components/StartChartingDialog";
import { ChartingV2SoapSection } from "@/features/charting/components/soap/ChartingV2SoapSection";
import { AddOptionsDrawer } from "@/features/charting/components/soap/AddOptionsDrawer";
import { PendingApprovalBanner } from "@/features/charting/components/soap/PendingApprovalBanner";
import { PreviewNoteDialog } from "@/features/charting/components/preview/PreviewNoteDialog";
import { AiSyncIndicator } from "@/features/charting/components/AiSyncIndicator";
import {
  ChartDetailsSidebar,
  ChartDetailsSheet,
} from "@/features/charting/components/ChartDetailsSidebar";
import {
  ActionBridgeAside,
  ActionBridgeSheet,
} from "@/features/charting/components/action-bridge/ActionBridgePanel";
import { Button } from "@/components/ui/button";
import { ENCOUNTER_SHEET_DATA } from "@/features/charting/data/encounter-sheets";
import { useCortiListen } from "@/features/charting/lib/corti/use-corti-listen";
import { useMedicalCoding } from "@/features/charting/lib/corti/use-medical-coding";
import { useSoapOrchestrator } from "@/features/charting/lib/ai/use-soap-orchestrator";
import { applySoapUpdates, type SoapKey, type SoapSlot, type SoapUpdate } from "@/features/charting/lib/ai/soap-slots";
import { buildChartNoteText } from "@/features/charting/lib/note-utils";
import { useMockPatientFacts } from "@/features/charting/data/mock-patient-facts";

const HIGHLIGHT_DURATION_MS = 4000;

/** Fresh visit: keep the encounter sheet's component/item structure but clear any pre-filled narrative. */
function blankSoapGroups(groups: VisitSheetSoapGroup[]): VisitSheetSoapGroup[] {
  function blankComponent(component: VisitSheetComponent): VisitSheetComponent {
    return {
      ...component,
      items: component.items.map((item) => ({ ...item, generatedText: null })),
      children: component.children.map(blankComponent),
    };
  }

  return groups.map((group) => ({
    ...group,
    components: group.components.map(blankComponent),
  }));
}

type SoapSection = Exclude<ChartingV2Section, "overview">;

const SECTION_TO_SOAP: Record<
  SoapSection,
  "SUBJECTIVE" | "OBJECTIVE" | "ASSESSMENT" | "PLAN"
> = {
  subjective: "SUBJECTIVE",
  objective: "OBJECTIVE",
  assessment: "ASSESSMENT",
  plan: "PLAN",
};

const SECTION_LABEL: Record<SoapSection, string> = {
  subjective: "Subjective",
  objective: "Objective",
  assessment: "Assessment",
  plan: "Plan",
};

function isSoapSection(section: ChartingV2Section): section is SoapSection {
  return section in SECTION_TO_SOAP;
}

/**
 * Reconciles one component's items against the Add Options drawer's current
 * checked state: items outside the catalog's scope (e.g. a free-text
 * narrative item with no itmCode) are left untouched; catalog-governed items
 * are kept (with updated text) only while still checked, and removed the
 * moment they're unchecked — the drawer's "Add" is really "sync", not just
 * "append".
 */
function syncComponentItems(
  groups: VisitSheetSoapGroup[],
  targetPkey: number,
  desiredItems: VisitSheetItem[],
  catalogItemCodes: Set<string>
): VisitSheetSoapGroup[] {
  function updateComponent(component: VisitSheetComponent): VisitSheetComponent {
    if (component.emrCompntsPkey === targetPkey) {
      const desiredByCode = new Map(
        desiredItems.filter((item) => item.itmCode).map((item) => [item.itmCode as string, item])
      );

      const retained = component.items
        .filter(
          (item) =>
            !item.itmCode || !catalogItemCodes.has(item.itmCode) || desiredByCode.has(item.itmCode)
        )
        .map((item) => {
          if (!item.itmCode) return item;
          const desired = desiredByCode.get(item.itmCode);
          if (!desired) return item;
          desiredByCode.delete(item.itmCode); // handled — anything left over is a new addition
          return { ...item, generatedText: desired.generatedText };
        });

      return { ...component, items: [...retained, ...desiredByCode.values()] };
    }
    if (component.children.length === 0) return component;
    return { ...component, children: component.children.map(updateComponent) };
  }

  return groups.map((group) => ({
    ...group,
    components: group.components.map(updateComponent),
  }));
}

/**
 * Removes items anywhere in the tree whose pkey is in the given set. Item
 * pkeys are unique across the whole chart (real data uses its own pkey
 * ranges; AI-added items come from a synthetic counter starting at
 * 9,000,000), so this one function covers rejecting a single item, an
 * entire component's pending items, or every pending item in the chart —
 * no need to separately locate the owning component.
 */
function removeItemsByPkeys(
  groups: VisitSheetSoapGroup[],
  pkeysToRemove: Set<number>
): VisitSheetSoapGroup[] {
  if (pkeysToRemove.size === 0) return groups;

  function updateComponent(component: VisitSheetComponent): VisitSheetComponent {
    return {
      ...component,
      items: component.items.filter((item) => !pkeysToRemove.has(item.emrPatConCompntItmsPkey)),
      children: component.children.map(updateComponent),
    };
  }

  return groups.map((group) => ({
    ...group,
    components: group.components.map(updateComponent),
  }));
}

/** Every pending-approval pkey found within one component's subtree (itself + children). */
function collectPendingPkeysInComponent(
  component: VisitSheetComponent,
  pendingApprovalPkeys: Set<number>
): number[] {
  const found: number[] = [];
  function visit(c: VisitSheetComponent) {
    c.items.forEach((item) => {
      if (pendingApprovalPkeys.has(item.emrPatConCompntItmsPkey)) found.push(item.emrPatConCompntItmsPkey);
    });
    c.children.forEach(visit);
  }
  visit(component);
  return found;
}

/** Every item pkey currently charted anywhere in the tree — used to prune stale pending-approval pkeys after an Add Options sync removes items. */
function collectAllItemPkeys(groups: VisitSheetSoapGroup[]): Set<number> {
  const pkeys = new Set<number>();
  function visit(component: VisitSheetComponent) {
    component.items.forEach((item) => pkeys.add(item.emrPatConCompntItmsPkey));
    component.children.forEach(visit);
  }
  groups.forEach((group) => group.components.forEach(visit));
  return pkeys;
}

function findComponentByPkey(
  groups: VisitSheetSoapGroup[],
  targetPkey: number
): VisitSheetComponent | null {
  function visit(component: VisitSheetComponent): VisitSheetComponent | null {
    if (component.emrCompntsPkey === targetPkey) return component;
    for (const child of component.children) {
      const found = visit(child);
      if (found) return found;
    }
    return null;
  }
  for (const group of groups) {
    for (const component of group.components) {
      const found = visit(component);
      if (found) return found;
    }
  }
  return null;
}

export function ChartingV2View() {
  const [activeSection, setActiveSection] =
    useState<ChartingV2Section>("overview");
  const [hasChart, setHasChart] = useState(false);
  const [chartSession, setChartSession] = useState<ChartSession | null>(null);
  const [soapGroups, setSoapGroups] = useState<VisitSheetSoapGroup[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isChartDetailsSheetOpen, setIsChartDetailsSheetOpen] = useState(false);
  const [isActionBridgeOpen, setIsActionBridgeOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [addDrawerTarget, setAddDrawerTarget] =
    useState<VisitSheetComponent | null>(null);
  const [highlightedPkeys, setHighlightedPkeys] = useState<Set<number>>(new Set());
  const [pulsingSoap, setPulsingSoap] = useState<Set<SoapKey>>(new Set());
  /** AI-written items awaiting explicit user approval — unlike highlightedPkeys, this never auto-clears; only an explicit approve/remove click resolves it. */
  const [pendingApprovalPkeys, setPendingApprovalPkeys] = useState<Set<number>>(new Set());
  const soapGroupsRef = useRef(soapGroups);
  useEffect(() => {
    soapGroupsRef.current = soapGroups;
  }, [soapGroups]);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023.98px)");
    const update = () => setIsMobileViewport(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const {
    status: listenStatus,
    segments: transcriptSegments,
    speakers: transcriptSpeakers,
    facts: transcriptFacts,
    error: listenError,
    recorder: listenRecorder,
    start: startListening,
    stop: stopListening,
    pause: pauseListening,
    resume: resumeListening,
    renameSpeaker,
  } = useCortiListen();

  const patientNoteFacts = useMockPatientFacts();
  const {
    status: codingStatus,
    codes: medicalCodes,
    candidates: medicalCodeCandidates,
    error: codingError,
    predict: predictMedicalCodes,
    reset: resetMedicalCoding,
  } = useMedicalCoding();

  const runMedicalCoding = useCallback(() => {
    const noteText = buildChartNoteText(soapGroupsRef.current, patientNoteFacts);
    predictMedicalCodes(noteText);
  }, [patientNoteFacts, predictMedicalCodes]);

  /** Predict codes only once a listening session has actually finished (stopping -> idle), never on the initial idle state. */
  const prevListenStatusRef = useRef(listenStatus);
  useEffect(() => {
    const prev = prevListenStatusRef.current;
    prevListenStatusRef.current = listenStatus;
    if (prev === "stopping" && listenStatus === "idle") {
      runMedicalCoding();
    }
  }, [listenStatus, runMedicalCoding]);

  const handleStartListening = useCallback(() => {
    resetMedicalCoding();
    startListening();
    setIsActionBridgeOpen(true);
  }, [resetMedicalCoding, startListening]);

  const handleReopenListening = useCallback(() => {
    setIsActionBridgeOpen(true);
  }, []);

  const handleStopListening = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const handleCloseActionBridge = useCallback(() => {
    setIsActionBridgeOpen(false);
  }, []);

  const handleApproveItem = useCallback((pkey: number) => {
    setPendingApprovalPkeys((prev) => {
      if (!prev.has(pkey)) return prev;
      const next = new Set(prev);
      next.delete(pkey);
      return next;
    });
  }, []);

  const handleRemoveItem = useCallback((_component: VisitSheetComponent, item: VisitSheetItem) => {
    setSoapGroups((prev) => removeItemsByPkeys(prev, new Set([item.emrPatConCompntItmsPkey])));
    setPendingApprovalPkeys((prev) => {
      if (!prev.has(item.emrPatConCompntItmsPkey)) return prev;
      const next = new Set(prev);
      next.delete(item.emrPatConCompntItmsPkey);
      return next;
    });
  }, []);

  const handleApproveComponent = useCallback(
    (component: VisitSheetComponent) => {
      const toApprove = collectPendingPkeysInComponent(component, pendingApprovalPkeys);
      if (toApprove.length === 0) return;
      setPendingApprovalPkeys((prev) => {
        const next = new Set(prev);
        toApprove.forEach((pkey) => next.delete(pkey));
        return next;
      });
    },
    [pendingApprovalPkeys]
  );

  const handleRejectComponent = useCallback(
    (component: VisitSheetComponent) => {
      const toReject = new Set(collectPendingPkeysInComponent(component, pendingApprovalPkeys));
      if (toReject.size === 0) return;
      setSoapGroups((prev) => removeItemsByPkeys(prev, toReject));
      setPendingApprovalPkeys((prev) => {
        const next = new Set(prev);
        toReject.forEach((pkey) => next.delete(pkey));
        return next;
      });
    },
    [pendingApprovalPkeys]
  );

  const handleApproveAllPending = useCallback(() => {
    setPendingApprovalPkeys(new Set());
  }, []);

  const handleRejectAllPending = useCallback(() => {
    setSoapGroups((prev) => removeItemsByPkeys(prev, pendingApprovalPkeys));
    setPendingApprovalPkeys(new Set());
  }, [pendingApprovalPkeys]);

  const handleAiUpdates = useCallback((updates: SoapUpdate[], slots: SoapSlot[]) => {
    const { groups, touched } = applySoapUpdates(soapGroupsRef.current, updates, slots);
    if (touched.length === 0) return;

    setSoapGroups(groups);

    const pkeys = touched.map((t) => t.pkey);
    const soaps = Array.from(new Set(touched.map((t) => t.soap)));
    setHighlightedPkeys((prev) => new Set([...prev, ...pkeys]));
    setPulsingSoap((prev) => new Set([...prev, ...soaps]));
    setPendingApprovalPkeys((prev) => new Set([...prev, ...pkeys]));

    setTimeout(() => {
      setHighlightedPkeys((prev) => {
        const next = new Set(prev);
        pkeys.forEach((pkey) => next.delete(pkey));
        return next;
      });
    }, HIGHLIGHT_DURATION_MS);
    setTimeout(() => {
      setPulsingSoap((prev) => {
        const next = new Set(prev);
        soaps.forEach((soap) => next.delete(soap));
        return next;
      });
    }, HIGHLIGHT_DURATION_MS);
  }, []);

  const { syncStatus, syncError } = useSoapOrchestrator({
    listenStatus,
    segments: transcriptSegments,
    facts: transcriptFacts,
    soapGroups,
    onUpdates: handleAiUpdates,
  });

  const isSoapTab = isSoapSection(activeSection);
  const pulsingNavSections = new Set<ChartingV2Section>(
    (Object.entries(SECTION_TO_SOAP) as [SoapSection, SoapKey][])
      .filter(([, soap]) => pulsingSoap.has(soap))
      .map(([section]) => section)
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <ChartingV2Header
        hasChart={hasChart}
        chartSession={chartSession}
        onStartCharting={() => setIsDialogOpen(true)}
        onPreviewNote={() => setIsPreviewDialogOpen(true)}
        listenStatus={listenStatus}
        onStartListening={handleStartListening}
        onReopenListening={handleReopenListening}
        aiSyncIndicator={<AiSyncIndicator status={syncStatus} error={syncError} />}
      />
      <div className="flex min-h-0 flex-1">
        <ChartingV2Nav
          activeSection={activeSection}
          hasChart={hasChart}
          onSelect={setActiveSection}
          pulsingSections={pulsingNavSections}
        />
        <div className="flex min-h-0 flex-1 flex-col">
          {isSoapTab && (
            <div className="flex justify-end gap-2 border-b border-slate-200 bg-white px-6 py-2 lg:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChartDetailsSheetOpen(true)}
              >
                <PanelRight className="h-4 w-4" />
                Chart Details
              </Button>
            </div>
          )}
          {isSoapTab && (
            <PendingApprovalBanner
              count={pendingApprovalPkeys.size}
              onApproveAll={handleApproveAllPending}
              onRejectAll={handleRejectAllPending}
            />
          )}
          <div className="min-h-0 flex-1 overflow-y-auto bg-white">
            {activeSection === "overview" ? (
              <ChartingV2FaceSheet />
            ) : (
              <ChartingV2SoapSection
                title={SECTION_LABEL[activeSection]}
                components={
                  soapGroups.find(
                    (group) => group.soap === SECTION_TO_SOAP[activeSection]
                  )?.components ?? []
                }
                onAddOptions={setAddDrawerTarget}
                onEditItem={(component) => setAddDrawerTarget(component)}
                highlightedPkeys={highlightedPkeys}
                pendingApprovalPkeys={pendingApprovalPkeys}
                onApproveItem={handleApproveItem}
                onRemoveItem={handleRemoveItem}
                onApproveComponent={handleApproveComponent}
                onRejectComponent={handleRejectComponent}
              />
            )}
          </div>
        </div>
        {isSoapTab &&
          (isActionBridgeOpen ? (
            !isMobileViewport && (
              <ActionBridgeAside
                open={isActionBridgeOpen}
                status={listenStatus}
                recorder={listenRecorder}
                onPause={pauseListening}
                onResume={resumeListening}
                onStop={handleStopListening}
                onClose={handleCloseActionBridge}
                transcriptProps={{
                  status: listenStatus,
                  segments: transcriptSegments,
                  speakers: transcriptSpeakers,
                  facts: transcriptFacts,
                  error: listenError,
                  onRenameSpeaker: renameSpeaker,
                }}
                codingProps={{
                  status: codingStatus,
                  codes: medicalCodes,
                  candidates: medicalCodeCandidates,
                  error: codingError,
                  onRetry: runMedicalCoding,
                }}
              />
            )
          ) : (
            <ChartDetailsSidebar />
          ))}
      </div>
      <StartChartingDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onBeginCharting={(session) => {
          setChartSession(session);
          setSoapGroups(
            blankSoapGroups(
              structuredClone(ENCOUNTER_SHEET_DATA[session.encounterSheetId] ?? [])
            )
          );
          setHasChart(true);
          setIsDialogOpen(false);
          setActiveSection("subjective");
          resetMedicalCoding();
        }}
      />
      <AddOptionsDrawer
        open={addDrawerTarget !== null}
        onOpenChange={(open) => !open && setAddDrawerTarget(null)}
        component={addDrawerTarget}
        onAddItems={(items, catalogItemCodes) => {
          if (!addDrawerTarget) return;
          const nextGroups = syncComponentItems(
            soapGroups,
            addDrawerTarget.emrCompntsPkey,
            items,
            catalogItemCodes
          );
          setSoapGroups(nextGroups);

          // Clicking "Add" is itself a review action for this component's
          // catalog-governed items: anything unchecked is gone (pruned below
          // via stillCharted), and anything still checked — including a
          // previously AI-added item the user just looked at and confirmed —
          // no longer needs a separate approve click. Read the real pkeys
          // back from nextGroups rather than `items`, whose entries all carry
          // throwaway synthetic pkeys from the drawer regardless of whether
          // the item already existed (syncComponentItems preserves the real
          // pkey for anything retained).
          const stillCharted = collectAllItemPkeys(nextGroups);
          const syncedComponent = findComponentByPkey(nextGroups, addDrawerTarget.emrCompntsPkey);
          const reviewedPkeys = new Set(
            (syncedComponent?.items ?? [])
              .filter((item) => item.itmCode && catalogItemCodes.has(item.itmCode))
              .map((item) => item.emrPatConCompntItmsPkey)
          );
          setPendingApprovalPkeys((prev) => {
            const filtered = new Set(
              [...prev].filter((pkey) => stillCharted.has(pkey) && !reviewedPkeys.has(pkey))
            );
            return filtered.size === prev.size ? prev : filtered;
          });
        }}
      />
      <PreviewNoteDialog
        open={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
        soapGroups={soapGroups}
      />
      <ChartDetailsSheet
        open={isChartDetailsSheetOpen}
        onOpenChange={setIsChartDetailsSheetOpen}
      />
      <ActionBridgeSheet
        open={isActionBridgeOpen && isMobileViewport}
        onOpenChange={(open) => !open && setIsActionBridgeOpen(false)}
        status={listenStatus}
        recorder={listenRecorder}
        onPause={pauseListening}
        onResume={resumeListening}
        onStop={handleStopListening}
        onClose={handleCloseActionBridge}
        transcriptProps={{
          status: listenStatus,
          segments: transcriptSegments,
          speakers: transcriptSpeakers,
          facts: transcriptFacts,
          error: listenError,
          onRenameSpeaker: renameSpeaker,
        }}
        codingProps={{
          status: codingStatus,
          codes: medicalCodes,
          candidates: medicalCodeCandidates,
          error: codingError,
          onRetry: runMedicalCoding,
        }}
      />
    </div>
  );
}
