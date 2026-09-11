"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, CheckmarkCircle01Icon, Alert02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { SyncStatus } from "@/features/charting/lib/ai/use-soap-orchestrator";

export function AiSyncIndicator({ status }: { status: SyncStatus }) {
  if (status === "idle") return null;

  return (
    <div
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors",
        status === "syncing" && "bg-[#F0FDFA] text-primary",
        status === "synced" && "text-slate-400",
        status === "error" && "bg-red-50 text-red-600"
      )}
    >
      {status === "syncing" && (
        <>
          <HugeiconsIcon icon={SparklesIcon} size={13} strokeWidth={2} className="animate-pulse" />
          Updating chart…
        </>
      )}
      {status === "synced" && (
        <>
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} strokeWidth={2} />
          Chart synced
        </>
      )}
      {status === "error" && (
        <>
          <HugeiconsIcon icon={Alert02Icon} size={13} strokeWidth={2} />
          AI sync issue
        </>
      )}
    </div>
  );
}
