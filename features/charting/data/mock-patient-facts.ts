"use client";

import { buildPatientNoteFacts } from "@/features/charting/lib/note-utils";
import { useSelectedPatient } from "@/features/charting/lib/selected-patient";

export function useMockPatientFacts() {
  const patient = useSelectedPatient();
  return buildPatientNoteFacts(patient.age, patient.sex);
}
