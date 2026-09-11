"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Mic01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { ListenStatus } from "@/features/charting/lib/corti/types";

export function ListenButton({
  status,
  onStart,
  onStop,
}: {
  status: ListenStatus;
  onStart: () => void;
  onStop: () => void;
}) {
  const isListening = status === "listening";
  const isBusy = status === "connecting" || status === "stopping";

  return (
    <button
      type="button"
      onClick={isListening ? onStop : onStart}
      disabled={isBusy}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg border px-4 text-sm font-semibold transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        isListening
          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      )}
    >
      {isBusy ? (
        <HugeiconsIcon icon={Loading03Icon} size={15} strokeWidth={2} className="animate-spin" />
      ) : isListening ? (
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
      ) : (
        <HugeiconsIcon icon={Mic01Icon} size={15} strokeWidth={2} />
      )}
      {isListening ? "Listening…" : status === "connecting" ? "Connecting…" : "Listen"}
    </button>
  );
}
