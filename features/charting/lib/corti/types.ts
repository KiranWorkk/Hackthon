export type ListenStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "paused"
  | "stopping"
  | "error";

export interface TranscriptSegment {
  id: string;
  text: string;
  isFinal: boolean;
  start: number;
  end: number;
  /** Diarized speaker id from Corti (e.g. "0", "speaker_1"), or "unknown" when unset. */
  speakerId: string;
}

export const SPEAKER_ROLE_CYCLE = ["Doctor", "Patient"] as const;

export interface SpeakerInfo {
  speakerId: string;
  /** Defaults to "Speaker N" (in order of first appearance) until relabeled. */
  label: string;
  /** Index into the speaker color palette, assigned in order of first appearance. */
  colorIndex: number;
}

/** A clinical fact extracted by Corti's FactsR from the live conversation. */
export interface ClinicalFact {
  id: string;
  text: string;
  /** Category key from Corti (e.g. "symptoms", "medical-history") — shown as-is, not remapped to a fixed list. */
  group: string;
  isDiscarded: boolean;
  source: string;
}

/** Coding systems supported by Corti's /v2/tools/coding/ endpoint. */
export type CodingSystem =
  | "icd10cm-outpatient"
  | "icd10cm-inpatient"
  | "icd10pcs"
  | "cpt";

/** A span of the input context text that supports a predicted code. */
export interface CodeEvidence {
  contextIndex: number;
  text: string;
  start: number;
  end: number;
}

/** A lower-ranked code Corti considered for the same evidence. */
export interface CodeAlternative {
  code: string;
  display: string;
}

/** One predicted (or candidate) medical code returned by Corti's coding tool. */
export interface PredictedCode {
  system: string;
  code: string;
  display: string;
  evidences: CodeEvidence[];
  alternatives: CodeAlternative[];
}

export type MedicalCodingStatus = "idle" | "loading" | "success" | "error";
