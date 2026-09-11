export type ListenStatus =
  | "idle"
  | "connecting"
  | "listening"
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
