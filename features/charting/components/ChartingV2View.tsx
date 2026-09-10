"use client";

import { useState } from "react";
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
import {
  ChartDetailsSidebar,
  ChartDetailsSheet,
} from "@/features/charting/components/ChartDetailsSidebar";
import { Button } from "@/components/ui/button";
import { ENCOUNTER_SHEET_DATA } from "@/features/charting/data/encounter-sheets";

const SECTION_TO_SOAP: Record<
  Exclude<ChartingV2Section, "overview">,
  "SUBJECTIVE" | "OBJECTIVE" | "ASSESSMENT" | "PLAN"
> = {
  subjective: "SUBJECTIVE",
  objective: "OBJECTIVE",
  assessment: "ASSESSMENT",
  plan: "PLAN",
};

const SECTION_LABEL: Record<Exclude<ChartingV2Section, "overview">, string> = {
  subjective: "Subjective",
  objective: "Objective",
  assessment: "Assessment",
  plan: "Plan",
};

function addItemsToComponent(
  groups: VisitSheetSoapGroup[],
  targetPkey: number,
  newItems: VisitSheetItem[]
): VisitSheetSoapGroup[] {
  function updateComponent(component: VisitSheetComponent): VisitSheetComponent {
    if (component.emrCompntsPkey === targetPkey) {
      return { ...component, items: [...component.items, ...newItems] };
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
  const [addDrawerTarget, setAddDrawerTarget] =
    useState<VisitSheetComponent | null>(null);

  const isSoapTab = activeSection !== "overview";

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <ChartingV2Header
        hasChart={hasChart}
        chartSession={chartSession}
        onStartCharting={() => setIsDialogOpen(true)}
        onPreviewNote={() => setIsPreviewDialogOpen(true)}
      />
      <div className="flex min-h-0 flex-1">
        <ChartingV2Nav
          activeSection={activeSection}
          hasChart={hasChart}
          onSelect={setActiveSection}
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
              />
            )}
          </div>
        </div>
        {isSoapTab && <ChartDetailsSidebar />}
      </div>
      <StartChartingDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onBeginCharting={(session) => {
          setChartSession(session);
          setSoapGroups(
            structuredClone(ENCOUNTER_SHEET_DATA[session.encounterSheetId] ?? [])
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
        onAddItems={(items) => {
          if (!addDrawerTarget) return;
          setSoapGroups((prev) =>
            addItemsToComponent(prev, addDrawerTarget.emrCompntsPkey, items)
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
    </div>
  );
}
