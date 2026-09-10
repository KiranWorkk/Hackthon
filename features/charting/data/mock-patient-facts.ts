import { buildPatientNoteFacts } from "@/features/charting/lib/note-utils";
import { mockPatient } from "@/features/charting/data/mock-face-sheet";

export const MOCK_PATIENT_FACTS = buildPatientNoteFacts(
  mockPatient.age,
  mockPatient.sex
);
