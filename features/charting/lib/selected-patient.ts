"use client";

import { useSyncExternalStore } from "react";
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

// sessionStorage never changes from outside this tab while a charting page is
// mounted (it's written once, before navigating in), so there's nothing to
// subscribe to — but useSyncExternalStore still gives us a snapshot that's
// read lazily on the client and can differ from getServerSnapshot without
// triggering a hydration mismatch, unlike reading it in a useState initializer.
function subscribe() {
  return () => {};
}

// getSnapshot must return a referentially stable value between calls (React
// compares with Object.is), so the sessionStorage read/parse — which would
// otherwise produce a new object every call — is cached once per module load.
let cachedSnapshot: SelectedPatientIdentity | undefined;

function getSnapshot(): SelectedPatientIdentity {
  if (cachedSnapshot === undefined) {
    cachedSnapshot = getSelectedPatient() ?? DEFAULT_PATIENT;
  }
  return cachedSnapshot;
}

function getServerSnapshot(): SelectedPatientIdentity {
  return DEFAULT_PATIENT;
}

export function useSelectedPatient(): SelectedPatientIdentity {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
