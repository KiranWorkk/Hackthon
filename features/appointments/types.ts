export type AppointmentStatus =
  | "Confirmed"
  | "Checked In"
  | "Cancelled"
  | "No Show"
  | "Completed"
  | "Pending";

export type ChartingStatus = "Not Started" | "In Progress" | "Signed";

export interface Appointment {
  id: string;
  patientId: string;
  /** Matches an id in ENCOUNTER_SHEET_OPTIONS — pre-selects the Start Charting dialog. */
  encounterSheetId: string;
  patientFirstName: string;
  patientLastName: string;
  age: number;
  sex: "M" | "F";
  mrn: string;
  dob: string;
  timeStart: string;
  durationMinutes: number;
  reason: string;
  status: AppointmentStatus;
  type: string;
  checkedIn: string | null;
  examRoom: string | null;
  caseName: string;
  legalEntityProvider: string;
  renderingProvider: string;
  hasSuperBill: boolean;
  chartingStatus: ChartingStatus;
}
