"use client";

import { useEffect, useState } from "react";
import { mockPatient, mockAppointment } from "@/features/charting/data/mock-face-sheet";

const STORAGE_KEY = "charting:selected-patient";

export interface SelectedPatientIdentity {
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

export const DEFAULT_PATIENT: SelectedPatientIdentity = {
  firstName: mockPatient.firstName,
  lastName: mockPatient.lastName,
  initials: mockPatient.initials,
  age: mockPatient.age,
  sex: mockPatient.sex,
  mrn: mockPatient.mrn,
  dob: mockPatient.dob,
  timeStart: mockAppointment.start,
  durationMinutes: 20,
  visitType: mockAppointment.visitType,
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
  const [identity, setIdentity] = useState<SelectedPatientIdentity>(DEFAULT_PATIENT);

  useEffect(() => {
    const stored = getSelectedPatient();
    if (stored) setIdentity(stored);
  }, []);

  return identity;
}
