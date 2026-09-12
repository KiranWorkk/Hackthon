"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Mic01Icon, FileVerifiedIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { ListenStatus, SpeakerInfo, TranscriptSegment } from "@/features/charting/lib/corti/types";

const SPEAKER_DOT_COLORS = ["bg-sky-500", "bg-amber-500", "bg-emerald-500", "bg-violet-500"];
const SPEAKER_TEXT_COLORS = ["text-sky-700", "text-amber-700", "text-emerald-700", "text-violet-700"];

/**
 * A persistent, full-session record of everything the Corti transcript has
 * captured — unlike TranscriptPanel (which lives inside the ActionBridge
 * side panel and is easy to lose track of), this is its own nav section so
 * the underlying evidence for the chart is always a click away. Each final
 * segment is marked whether it was part of a sync that actually changed the
 * chart ("Reflected in chart") or not yet ("Not yet charted") — see
 * onEvidenceUsed in use-soap-orchestrator.ts for how that's tracked. This is
 * a coarse signal (which batch of speech led to *some* update), not
 * per-field attribution — the AI isn't asked which exact sentence grounded
 * which exact slot.
 */
export function EvidenceSection({
  status,
  segments,
  speakers,
  evidenceSegmentIds,
}: {
  status: ListenStatus;
  segments: TranscriptSegment[];
  speakers: SpeakerInfo[];
  evidenceSegmentIds: Set<string>;
}) {
  const speakerByIdMap = new Map(speakers.map((speaker) => [speaker.speakerId, speaker]));
  const sorted = [...segments].sort((a, b) => a.start - b.start);
  const usedCount = sorted.filter((s) => s.isFinal && evidenceSegmentIds.has(s.id)).length;
  const finalCount = sorted.filter((s) => s.isFinal).length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <h2 className="mb-1 text-base font-semibold text-slate-900">Evidences</h2>
      <p className="mb-5 text-sm text-slate-500">
        Every transcript segment captured this session, kept here for the life of the visit.
        Segments highlighted in green were part of a batch of speech that produced a chart
        update; the rest haven&rsquo;t been reflected in the chart yet.
      </p>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-center text-slate-400">
          <HugeiconsIcon icon={Mic01Icon} size={22} strokeWidth={1.5} />
          <p className="text-sm">
            {status === "listening"
              ? "Listening… transcript will appear here as the visit is captured."
              : "No transcript captured yet — start Listening to begin building the evidence record."}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {usedCount} of {finalCount} reflected in chart
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {sorted.map((segment) => {
              const speaker = speakerByIdMap.get(segment.speakerId);
              const colorIndex = speaker?.colorIndex ?? 0;
              const isInProgress = !segment.isFinal;
              const isUsed = segment.isFinal && evidenceSegmentIds.has(segment.id);

              return (
                <div
                  key={segment.id}
                  className={cn(
                    "flex gap-3 rounded-lg border px-3 py-2.5",
                    isInProgress
                      ? "border-dashed border-slate-200 bg-slate-50"
                      : isUsed
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-slate-200 bg-white"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                      isInProgress ? "animate-pulse bg-slate-300" : SPEAKER_DOT_COLORS[colorIndex]
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          isInProgress ? "text-slate-400" : SPEAKER_TEXT_COLORS[colorIndex]
                        )}
                      >
                        {speaker?.label ?? "Speaker"}
                      </span>
                      {isInProgress && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                          <HugeiconsIcon icon={Mic01Icon} size={10} strokeWidth={2} />
                          In progress
                        </span>
                      )}
                      {isUsed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={10} strokeWidth={2} />
                          Reflected in chart
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-sm leading-relaxed",
                        isInProgress ? "text-slate-400 italic" : "text-slate-800"
                      )}
                    >
                      {segment.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-6 flex items-start gap-2 rounded-lg border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-400">
        <HugeiconsIcon icon={FileVerifiedIcon} size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
        <span>
          &ldquo;Reflected in chart&rdquo; means this speech was included in a sync that changed at
          least one field — not a guarantee of exactly which field it grounded.
        </span>
      </div>
    </div>
  );
}
