"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, Tick02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { VisitSheetItem } from "@/features/charting/types";
import { buildItemHtml } from "@/features/charting/lib/note-utils";
import { useMockPatientFacts } from "@/features/charting/data/mock-patient-facts";

export function ItemCard({
  item,
  onClick,
  justUpdated = false,
  isPendingApproval = false,
  onApprove,
  onRemove,
}: {
  item: VisitSheetItem;
  onClick?: () => void;
  /** True for a few seconds right after the AI orchestrator fills this item, to draw the eye. */
  justUpdated?: boolean;
  /** True while this AI-written item hasn't been explicitly approved or removed yet — stays true until the user acts, unlike justUpdated. */
  isPendingApproval?: boolean;
  onApprove?: () => void;
  onRemove?: () => void;
}) {
  const facts = useMockPatientFacts();
  const rendered = item.itmTemplate && item.generatedText ? buildItemHtml(item, facts) : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-lg border px-4 py-3.5 transition-all duration-700",
        isPendingApproval
          ? "border-amber-300 bg-amber-50/50"
          : justUpdated
            ? "border-primary/40 bg-[#F0FDFA] shadow-[0_0_0_3px_rgba(0,176,202,0.12)]"
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60",
        isPendingApproval && "pr-20"
      )}
    >
      {isPendingApproval ? (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onApprove?.();
            }}
            aria-label="Approve AI-generated item"
            title="Approve"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-colors hover:bg-emerald-200"
          >
            <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            aria-label="Remove AI-generated item"
            title="Remove"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 transition-colors hover:bg-red-200"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={13} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        justUpdated && (
          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-primary shadow-sm">
            <HugeiconsIcon icon={SparklesIcon} size={10} strokeWidth={2.5} />
            AI
          </span>
        )
      )}
      {rendered ? (
        <p
          className="text-sm text-slate-800"
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      ) : item.generatedText ? (
        <>
          <p className="text-sm text-slate-800">{item.itmName}</p>
          <p className="mt-0.5 text-sm text-slate-500">
            - <span>{item.generatedText}</span>
          </p>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-slate-700">
          {item.itmName}
        </p>
      )}
    </div>
  );
}
