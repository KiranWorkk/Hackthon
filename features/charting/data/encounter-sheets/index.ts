import type { VisitSheetSoapGroup } from "@/features/charting/types";
import { annualPhysicalSoapGroups } from "@/features/charting/data/encounter-sheets/annual-physical";
import { followUpVisitSoapGroups } from "@/features/charting/data/encounter-sheets/follow-up-visit";
import { newPatientIntakeSoapGroups } from "@/features/charting/data/encounter-sheets/new-patient-intake";

export const ENCOUNTER_SHEET_DATA: Record<string, VisitSheetSoapGroup[]> = {
  "annual-physical": annualPhysicalSoapGroups,
  "follow-up-visit": followUpVisitSoapGroups,
  "new-patient-intake": newPatientIntakeSoapGroups,
};
