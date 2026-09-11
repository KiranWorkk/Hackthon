"use client";

import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, PauseIcon, PlayIcon, StopIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TranscriptPanel } from "@/features/charting/components/TranscriptPanel";
import { ListeningWaveform } from "@/features/charting/components/action-bridge/ListeningWaveform";
import { MedicalCodesPanel } from "@/features/charting/components/action-bridge/MedicalCodesPanel";
import { useElapsedTimer } from "@/features/charting/lib/use-elapsed-timer";
import type {
  ClinicalFact,
  ListenStatus,
  MedicalCodingStatus,
  PredictedCode,
  SpeakerInfo,
  TranscriptSegment,
} from "@/features/charting/lib/corti/types";

const PANEL_WIDTH = 380;

interface ActionBridgeTranscriptProps {
  status: ListenStatus;
  segments: TranscriptSegment[];
  speakers: SpeakerInfo[];
  facts: ClinicalFact[];
  error: string | null;
  onRenameSpeaker: (speakerId: string, label: string) => void;
}

interface MedicalCodingProps {
  status: MedicalCodingStatus;
  codes: PredictedCode[];
  candidates: PredictedCode[];
  error: string | null;
  onRetry: () => void;
}

interface ActionBridgeContentProps {
  status: ListenStatus;
  recorder: MediaRecorder | null;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onClose: () => void;
  transcriptProps: ActionBridgeTranscriptProps;
  codingProps: MedicalCodingProps;
}

function statusLabel(status: ListenStatus): string {
  switch (status) {
    case "listening":
      return "Listening to visit…";
    case "paused":
      return "Paused";
    case "connecting":
      return "Connecting…";
    case "stopping":
      return "Ending session…";
    case "error":
      return "Connection issue";
    default:
      return "Not listening";
  }
}

function ActionBridgePanelContent({
  status,
  recorder,
  onPause,
  onResume,
  onStop,
  onClose,
  transcriptProps,
  codingProps,
}: ActionBridgeContentProps) {
  const elapsed = useElapsedTimer(status);
  const isListening = status === "listening";
  const isPaused = status === "paused";
  const canToggle = isListening || isPaused;
  const canStop = status !== "idle" && status !== "stopping";

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-200 px-4 py-3.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0FDFA]">
            <HugeiconsIcon icon={SparklesIcon} size={16} strokeWidth={2} className="text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-slate-900">ActionBridge</h2>
              <Badge
                variant="outline"
                className="border-primary/30 bg-[#F0FDFA] text-[10px] font-semibold tracking-wide text-primary uppercase"
              >
                Beta
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              From conversation to clinical action
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-slate-400 transition-colors hover:text-slate-600"
          aria-label="Close ActionBridge"
        >
          <X className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="shrink-0 border-b border-slate-200 px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <span className="relative flex h-2 w-2 shrink-0">
              {isListening && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              )}
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  isListening ? "bg-red-500" : isPaused ? "bg-amber-500" : "bg-slate-300"
                )}
              />
            </span>
            {statusLabel(status)}
          </div>
          <span className="font-mono text-xs text-slate-400">{elapsed}</span>
        </div>
        <div className="mb-2.5 min-w-0">
          <ListeningWaveform recorder={recorder} status={status} />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={isPaused ? onResume : onPause}
            disabled={!canToggle}
            className="inline-flex h-8 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HugeiconsIcon icon={isPaused ? PlayIcon : PauseIcon} size={13} strokeWidth={2} className="shrink-0" />
            <span className="truncate">{isPaused ? "Resume" : "Pause"}</span>
          </button>
          <button
            type="button"
            onClick={onStop}
            disabled={!canStop}
            className="inline-flex h-8 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HugeiconsIcon icon={StopIcon} size={13} strokeWidth={2} className="shrink-0" />
            <span className="truncate">Stop</span>
          </button>
        </div>
      </div>

      <Tabs defaultValue="codes" className="flex min-h-0 flex-1 flex-col gap-0">
        <TabsList
          variant="line"
          className="w-full shrink-0 justify-start gap-4 rounded-none border-b border-slate-200 bg-transparent px-4"
        >
          <TabsTrigger value="codes" className="gap-1.5">
            Medical Codes
            {codingProps.status === "success" && codingProps.codes.length > 0 && (
              <Badge
                variant="outline"
                className="h-4 min-w-4 rounded-full border-0 bg-[#F0FDFA] px-1 text-[10px] font-bold text-primary"
              >
                {codingProps.codes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
        </TabsList>
        <TabsContent value="codes" className="min-h-0 flex-1 overflow-y-auto">
          <MedicalCodesPanel {...codingProps} />
        </TabsContent>
        <TabsContent value="transcript" className="min-h-0 flex-1 overflow-y-auto">
          <TranscriptPanel {...transcriptProps} compact />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function ActionBridgeAside({
  open,
  ...contentProps
}: { open: boolean } & ActionBridgeContentProps) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          key="action-bridge"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: PANEL_WIDTH, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="hidden shrink-0 overflow-hidden border-l border-slate-200 bg-white lg:block"
        >
          <div style={{ width: PANEL_WIDTH }} className="h-full">
            <ActionBridgePanelContent {...contentProps} />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export function ActionBridgeSheet({
  open,
  onOpenChange,
  ...contentProps
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} & ActionBridgeContentProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[380px] p-0 sm:max-w-[380px]"
        showCloseButton={false}
      >
        <SheetTitle className="sr-only">ActionBridge</SheetTitle>
        <ActionBridgePanelContent {...contentProps} />
      </SheetContent>
    </Sheet>
  );
}
