"use client";

import { useState } from "react";
import { patients } from "@/features/patients/data/patients";
import { calculateAge } from "@/lib/age";

const STORAGE_KEY = "charting:selected-patient";

export interface SelectedPatientIdentity {
  patientId: string;
  firstName: string;
  lastName: string;
  initials: string;
  age: number;
  sex: "M" | "F";
  mrn: string;
  dob: string;
  timeStart: string;
  durationMinutes: number;
  visitType: string;
}

function formatDob(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${month}/${day}/${year}`;
}

const fallbackPatient = patients[0];

export const DEFAULT_PATIENT: SelectedPatientIdentity = {
  patientId: fallbackPatient.patientPkey,
  firstName: fallbackPatient.extFirstName,
  lastName: fallbackPatient.extLastName,
  initials: `${fallbackPatient.extFirstName[0]}${fallbackPatient.extLastName[0]}`.toUpperCase(),
  age: calculateAge(fallbackPatient.extDateOfBirth) ?? 0,
  sex: fallbackPatient.extSex,
  mrn: fallbackPatient.medicalRecordNum,
  dob: formatDob(fallbackPatient.extDateOfBirth),
  timeStart: "9:00 AM",
  durationMinutes: 20,
  visitType: "Follow-Up Visit",
};

export function setSelectedPatient(identity: SelectedPatientIdentity) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // sessionStorage unavailable (private browsing, etc.) — non-fatal for a prototype.
  }
}

export function getSelectedPatient(): SelectedPatientIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SelectedPatientIdentity) : null;
  } catch {
    return null;
  }
}

export function useSelectedPatient(): SelectedPatientIdentity {
  const [identity] = useState<SelectedPatientIdentity>(
    () => getSelectedPatient() ?? DEFAULT_PATIENT
  );

  return identity;
}
