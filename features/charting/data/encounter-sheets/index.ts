import type { VisitSheetSoapGroup } from "@/features/charting/types";
import annualPhysicalSoapGroups from "@/features/charting/data/encounter-sheets/annual-physical.json";
import followUpVisitSoapGroups from "@/features/charting/data/encounter-sheets/follow-up-visit.json";
import newPatientIntakeSoapGroups from "@/features/charting/data/encounter-sheets/new-patient-intake.json";

export const ENCOUNTER_SHEET_DATA: Record<string, VisitSheetSoapGroup[]> = {
  "annual-physical": annualPhysicalSoapGroups as VisitSheetSoapGroup[],
  "follow-up-visit": followUpVisitSoapGroups as VisitSheetSoapGroup[],
  "new-patient-intake": newPatientIntakeSoapGroups as VisitSheetSoapGroup[],
};
