"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Mic01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import {
  SPEAKER_ROLE_CYCLE,
  type ClinicalFact,
  type ListenStatus,
  type SpeakerInfo,
  type TranscriptSegment,
} from "@/features/charting/lib/corti/types";

function groupFacts(facts: ClinicalFact[]): { group: string; facts: ClinicalFact[] }[] {
  const byGroup = new Map<string, ClinicalFact[]>();
  for (const fact of facts) {
    if (fact.isDiscarded) continue;
    const list = byGroup.get(fact.group) ?? [];
    list.push(fact);
    byGroup.set(fact.group, list);
  }
  return Array.from(byGroup.entries()).map(([group, groupFacts]) => ({ group, facts: groupFacts }));
}

function formatGroupLabel(group: string): string {
  return group.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const SPEAKER_DOT_COLORS = ["bg-sky-500", "bg-amber-500", "bg-emerald-500", "bg-violet-500"];
const SPEAKER_TEXT_COLORS = [
  "text-sky-700",
  "text-amber-700",
  "text-emerald-700",
  "text-violet-700",
];

function nextSpeakerLabel(current: string): string {
  const cycleIndex = SPEAKER_ROLE_CYCLE.indexOf(current as (typeof SPEAKER_ROLE_CYCLE)[number]);
  if (cycleIndex === -1) return SPEAKER_ROLE_CYCLE[0];
  if (cycleIndex === SPEAKER_ROLE_CYCLE.length - 1) return "Unlabeled";
  return SPEAKER_ROLE_CYCLE[cycleIndex + 1];
}

export function TranscriptPanel({
  status,
  segments,
  speakers,
  facts,
  error,
  onRenameSpeaker,
}: {
  status: ListenStatus;
  segments: TranscriptSegment[];
  speakers: SpeakerInfo[];
  facts: ClinicalFact[];
  error: string | null;
  onRenameSpeaker: (speakerId: string, label: string) => void;
}) {
  const hasText = segments.length > 0;
  const speakerByIdMap = new Map(speakers.map((speaker) => [speaker.speakerId, speaker]));
  const factGroups = groupFacts(facts);

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <h2 className="mb-1 text-base font-semibold text-slate-900">Transcript</h2>
      <p className="mb-5 text-sm text-slate-500">
        Live speech-to-text from the Listen button, captured via Corti with speaker
        separation. Click a speaker&rsquo;s name to label who they are (Doctor / Patient).
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {speakers.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Speakers:</span>
          {speakers.map((speaker) => (
            <button
              key={speaker.speakerId}
              type="button"
              onClick={() =>
                onRenameSpeaker(speaker.speakerId, nextSpeakerLabel(speaker.label))
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
              title="Click to relabel (Doctor / Patient)"
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  SPEAKER_DOT_COLORS[speaker.colorIndex]
                )}
              />
              {speaker.label}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-[240px] rounded-xl border border-slate-200 bg-white p-4">
        {!hasText ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-slate-400">
            <HugeiconsIcon icon={Mic01Icon} size={22} strokeWidth={1.5} />
            <p className="text-sm">
              {status === "listening"
                ? "Listening… start speaking."
                : status === "connecting"
                  ? "Connecting to Corti…"
                  : "Press Listen in the header to start capturing the conversation."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {segments.map((segment) => {
              const speaker = speakerByIdMap.get(segment.speakerId);
              const colorIndex = speaker?.colorIndex ?? 0;
              return (
                <div key={segment.id} className="flex gap-3">
                  <span
                    className={cn(
                      "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                      SPEAKER_DOT_COLORS[colorIndex]
                    )}
                  />
                  <div>
                    <span
                      className={cn(
                        "mr-2 text-xs font-semibold",
                        SPEAKER_TEXT_COLORS[colorIndex]
                      )}
                    >
                      {speaker?.label ?? "Speaker"}
                    </span>
                    <span
                      className={cn(
                        "text-sm leading-relaxed text-slate-800",
                        !segment.isFinal && "text-slate-400 italic"
                      )}
                    >
                      {segment.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="mb-1 flex items-center gap-1.5">
          <HugeiconsIcon icon={SparklesIcon} size={15} strokeWidth={2} className="text-primary" />
          <h3 className="text-sm font-semibold text-slate-900">Extracted Clinical Facts</h3>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Auto-extracted by Corti FactsR as the conversation streams in — not yet wired into
          the SOAP chart.
        </p>

        {factGroups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">
            {status === "listening" || status === "connecting"
              ? "Facts appear here after the first ~10 seconds of conversation."
              : "No facts extracted yet."}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {factGroups.map(({ group, facts: groupFacts }) => (
              <div key={group} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {formatGroupLabel(group)}
                </div>
                <ul className="flex flex-col gap-1.5">
                  {groupFacts.map((fact) => (
                    <li key={fact.id} className="text-sm leading-relaxed text-slate-800">
                      {fact.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
