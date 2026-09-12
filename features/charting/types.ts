export interface VisitSheetItem {
  emrPatConCompntItmsPkey: number;
  emrPatConCompntItmsUkey?: string;
  emrConShtCompntItmsPkey?: number;
  emrConShtCompntItmsFkey?: number;
  emrCompntItmsFkey?: number;
  itmName: string | null;
  itmCode?: string | null;
  generatedText: string | null;
  itmTemplate: string | null;
  itmBeginText: string | null;
  itmEndText: string | null;
  attribute1?: string | null;
}

export interface VisitSheetComponent {
  emrCompntsPkey: number;
  emrConShtCompntsPkey?: number;
  emrConShtsPkey?: number;
  emrPatConCompntsPkey?: number;
  compntName: string;
  compntDescription: string | null;
  listOrder: number;
  compntCode: string | null;
  soap: "SUBJECTIVE" | "OBJECTIVE" | "ASSESSMENT" | "PLAN";
  items: VisitSheetItem[];
  children: VisitSheetComponent[];
}

export interface VisitSheetSoapGroup {
  soap: "SUBJECTIVE" | "OBJECTIVE" | "ASSESSMENT" | "PLAN";
  components: VisitSheetComponent[];
}

export interface VisitSheetVisitMeta {
  emrPatConsPkey: number;
  patientFkey: number;
  providerLegalEntityFkey: number;
  emrConShtsFkey: number;
  serviceLocationFkey: number;
  apptSchedulesFkey: number;
  dateOfService: string;
}

export interface VisitSheetResponse {
  visitMeta: VisitSheetVisitMeta | null;
  soapGroups: VisitSheetSoapGroup[];
}

export type ChartingV2Section =
  | "overview"
  | "subjective"
  | "objective"
  | "assessment"
  | "plan"
  | "evidence";

export interface ChartSession {
  providerId: string;
  encounterSheetId: string;
  cannedSheetId: string;
  locationId: string;
  dos: string;
}

export interface ComponentItemValue {
  emrCompntItmValuesPkey: number;
  valueName: string;
  itmValueSortOrder: number | null;
}

export interface ComponentItem {
  emrCompntItmsPkey: number;
  itmName: string;
  itmCode: string | null;
  /** Narrative template — same token syntax as VisitSheetItem.itmTemplate. */
  attribute1: string | null;
  /** Raw field-type string (e.g. "TEXT-AREA", "NUMBER", "CHECK-BOX"). */
  attribute11: string | null;
  emrCompntItmValues: ComponentItemValue[];
  /** Prototype-only augmentation — not part of the real API shape. */
  dependentItems?: ComponentItemWrapper[];
}

export interface ComponentItemWrapper {
  emrConShtCompntItmsPkey: number;
  emrConShtCompntsFkey: number;
  active: "Y" | "N";
  emrCompntItms: ComponentItem;
}
