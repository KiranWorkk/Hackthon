"use client";

/**
 * Lightweight, session-scoped consent audit trail. This is a prototype-level
 * implementation (matches the sessionStorage pattern used for the selected
 * patient elsewhere in this app) — a production system would persist this
 * server-side, tied to the encounter record, and retain it per the org's
 * HIPAA retention policy rather than only for the browser session.
 */

export interface ConsentRecord {
  patientId: string;
  patientName: string;
  consentedAt: string; // ISO 8601
  /** How the disclosure was delivered to the patient. */
  disclosureMethod: "audible-tts" | "browser-speech-synthesis" | "text-only";
  /** How consent was actually confirmed — the patient's spoken "yes" detected automatically, or a clinician clicking the manual button. */
  confirmationMethod: "voice-auto-detected" | "manual-button";
}

const STORAGE_KEY = "charting:consent-log";

function readLog(): ConsentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentRecord[]) : [];
  } catch {
    return [];
  }
}

export function recordConsent(record: ConsentRecord) {
  if (typeof window === "undefined") return;
  try {
    const log = readLog();
    log.push(record);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    // sessionStorage unavailable (private browsing, etc.) — non-fatal for a prototype.
  }
}

export function getLatestConsent(patientId: string): ConsentRecord | null {
  const log = readLog().filter((entry) => entry.patientId === patientId);
  return log.length > 0 ? log[log.length - 1] : null;
}
