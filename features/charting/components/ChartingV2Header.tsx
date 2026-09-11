"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  ArrowDown01Icon,
  ViewIcon,
  Clock04Icon,
  CheckmarkCircle01Icon,
  File02Icon,
  FileVerifiedIcon,
  DashedLineCircleIcon,
} from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { ENCOUNTER_SHEET_OPTIONS } from "@/features/charting/data/dropdown-options";
import { useSelectedPatient } from "@/features/charting/lib/selected-patient";
import { addMinutesToTimeLabel } from "@/features/charting/lib/time";
import { ListenButton } from "@/features/charting/components/ListenButton";
import type { ChartSession } from "@/features/charting/types";
import type { ListenStatus } from "@/features/charting/lib/corti/types";

const SAVE_AS_OPTIONS = [
  { label: "Complete", icon: CheckmarkCircle01Icon },
  { label: "For Review", icon: File02Icon },
  { label: "Pending", icon: Clock04Icon },
  { label: "Ready For Exam", icon: FileVerifiedIcon },
  { label: "Void", icon: DashedLineCircleIcon },
];

export function ChartingV2Header({
  hasChart,
  chartSession,
  onStartCharting,
  onPreviewNote,
  listenStatus,
  onStartListening,
  onReopenListening,
  aiSyncIndicator,
}: {
  hasChart: boolean;
  chartSession: ChartSession | null;
  onStartCharting: () => void;
  onPreviewNote: () => void;
  listenStatus: ListenStatus;
  onStartListening: () => void;
  onReopenListening: () => void;
  aiSyncIndicator?: ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("Pending");
  const patient = useSelectedPatient();
  const apptEnd = addMinutesToTimeLabel(patient.timeStart, patient.durationMinutes);

  const sheetName = chartSession
    ? ENCOUNTER_SHEET_OPTIONS.find((o) => o.id === chartSession.encounterSheetId)
        ?.label
    : null;

  return (
    <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/appointments")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Back to appointments"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={17} strokeWidth={2} />
          </button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0FDFA] text-sm font-semibold text-primary">
            {patient.initials}
          </div>
          <div className="min-w-0">
            <div className="mb-1.5 flex min-w-0 items-center gap-2">
              <h1 className="min-w-0 shrink truncate text-sm font-semibold text-[#0A0A0A] leading-none">
                {patient.lastName}, {patient.firstName}
              </h1>
              {sheetName && (
                <span
                  title={sheetName}
                  className="inline-flex min-w-0 shrink items-center gap-1 truncate rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-500"
                >
                  <HugeiconsIcon icon={File02Icon} size={11} strokeWidth={2} className="shrink-0" />
                  <span className="truncate">{sheetName}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{patient.timeStart}</span>
              <HugeiconsIcon icon={ArrowRight02Icon} size={12} />
              <span>{apptEnd}</span>
              <span className="mx-0.5">·</span>
              <StatusBadge label={patient.visitType} variant="neutral" />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!hasChart ? (
            <button
              type="button"
              onClick={onStartCharting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus:outline-none"
            >
              Start Charting
            </button>
          ) : (
            <>
              {aiSyncIndicator}
              <ListenButton
                status={listenStatus}
                onStart={onStartListening}
                onReopen={onReopenListening}
              />
              <button
                type="button"
                onClick={onPreviewNote}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none"
              >
                <HugeiconsIcon icon={ViewIcon} size={15} strokeWidth={2} />
                Preview Note
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus:outline-none"
                  >
                    <HugeiconsIcon
                      icon={
                        SAVE_AS_OPTIONS.find((o) => o.label === status)?.icon ??
                        Clock04Icon
                      }
                      size={15}
                      strokeWidth={2}
                    />
                    {status}
                    <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2.5} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {SAVE_AS_OPTIONS.map(({ label, icon }) => (
                    <DropdownMenuItem
                      key={label}
                      onSelect={() => setStatus(label)}
                      className={label === status ? "bg-slate-100 font-semibold" : ""}
                    >
                      <HugeiconsIcon icon={icon} size={15} strokeWidth={2} className="mr-2 shrink-0" />
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
