"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, Tick02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

export function PendingApprovalBanner({
  count,
  onApproveAll,
  onRejectAll,
}: {
  /** Total pending-approval items across the WHOLE chart, not just the active tab. */
  count: number;
  onApproveAll: () => void;
  onRejectAll: () => void;
}) {
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-6 py-2.5">
      <div className="flex items-center gap-1.5 text-sm font-medium text-amber-800">
        <HugeiconsIcon icon={SparklesIcon} size={15} strokeWidth={2} />
        {count} AI-generated {count === 1 ? "item" : "items"} awaiting review across this chart
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onApproveAll}
          className="inline-flex h-7 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={2.5} />
          Approve All
        </button>
        <button
          type="button"
          onClick={onRejectAll}
          className="inline-flex h-7 items-center gap-1 rounded-lg border border-red-300 bg-white px-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2.5} />
          Reject All
        </button>
      </div>
    </div>
  );
}
