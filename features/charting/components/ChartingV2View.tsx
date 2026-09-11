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
import { useSoapOrchestrator } from "@/features/charting/lib/ai/use-soap-orchestrator";
import { applySoapUpdates, type SoapKey, type SoapSlot, type SoapUpdate } from "@/features/charting/lib/ai/soap-slots";

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

  const handleStartListening = useCallback(() => {
    startListening();
    setIsActionBridgeOpen(true);
  }, [startListening]);

  const handleReopenListening = useCallback(() => {
    setIsActionBridgeOpen(true);
  }, []);

  const handleStopListening = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const handleCloseActionBridge = useCallback(() => {
    setIsActionBridgeOpen(false);
  }, []);

  const handleAiUpdates = useCallback((updates: SoapUpdate[], slots: SoapSlot[]) => {
    const { groups, touched } = applySoapUpdates(soapGroupsRef.current, updates, slots);
    if (touched.length === 0) return;

    setSoapGroups(groups);

    const pkeys = touched.map((t) => t.pkey);
    const soaps = Array.from(new Set(touched.map((t) => t.soap)));
    setHighlightedPkeys((prev) => new Set([...prev, ...pkeys]));
    setPulsingSoap((prev) => new Set([...prev, ...soaps]));

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

  const { syncStatus } = useSoapOrchestrator({
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
        aiSyncIndicator={<AiSyncIndicator status={syncStatus} />}
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
        }}
      />
      <AddOptionsDrawer
        open={addDrawerTarget !== null}
        onOpenChange={(open) => !open && setAddDrawerTarget(null)}
        component={addDrawerTarget}
        onAddItems={(items, catalogItemCodes) => {
          if (!addDrawerTarget) return;
          setSoapGroups((prev) =>
            syncComponentItems(prev, addDrawerTarget.emrCompntsPkey, items, catalogItemCodes)
          );
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
      />
    </div>
  );
}
