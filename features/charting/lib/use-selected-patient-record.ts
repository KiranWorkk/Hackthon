"use client";

import { useSelectedPatient } from "@/features/charting/lib/selected-patient";
import { getPatientById, patients } from "@/features/patients/data/patients";
import type { Patient } from "@/features/patients/types";

/** Full patient record (incl. face sheet) for whoever is currently selected via row-click. */
export function useSelectedPatientRecord(): Patient {
  const { patientId } = useSelectedPatient();
  return getPatientById(patientId) ?? patients[0];
}
