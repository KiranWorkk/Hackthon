"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Mic01Icon, Loading03Icon, PauseIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { ListenStatus } from "@/features/charting/lib/corti/types";

export function ListenButton({
  status,
  onStart,
  onReopen,
}: {
  status: ListenStatus;
  onStart: () => void;
  onReopen: () => void;
}) {
  const isListening = status === "listening";
  const isPaused = status === "paused";
  const isBusy = status === "connecting" || status === "stopping";
  const isActive = isListening || isPaused || status === "connecting";

  return (
    <button
      type="button"
      onClick={isActive ? onReopen : onStart}
      disabled={isBusy && !isActive}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-sm font-semibold transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        isListening
          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          : isPaused
            ? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      )}
    >
      {status === "connecting" ? (
        <HugeiconsIcon icon={Loading03Icon} size={15} strokeWidth={2} className="animate-spin" />
      ) : isPaused ? (
        <HugeiconsIcon icon={PauseIcon} size={15} strokeWidth={2} />
      ) : isListening ? (
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
      ) : (
        <HugeiconsIcon icon={Mic01Icon} size={15} strokeWidth={2} />
      )}
      {isListening
        ? "Listening…"
        : isPaused
          ? "Paused"
          : status === "connecting"
            ? "Connecting…"
            : "Listen"}
    </button>
  );
}
