"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { VisitSheetItem } from "@/features/charting/types";
import { buildItemHtml } from "@/features/charting/lib/note-utils";
import { useMockPatientFacts } from "@/features/charting/data/mock-patient-facts";

export function ItemCard({
  item,
  onClick,
  justUpdated = false,
}: {
  item: VisitSheetItem;
  onClick?: () => void;
  /** True for a few seconds right after the AI orchestrator fills this item, to draw the eye. */
  justUpdated?: boolean;
}) {
  const facts = useMockPatientFacts();
  const rendered = item.itmTemplate && item.generatedText ? buildItemHtml(item, facts) : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-lg border px-4 py-3.5 transition-all duration-700",
        justUpdated
          ? "border-primary/40 bg-[#F0FDFA] shadow-[0_0_0_3px_rgba(0,176,202,0.12)]"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
      )}
    >
      {justUpdated && (
        <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-primary shadow-sm">
          <HugeiconsIcon icon={SparklesIcon} size={10} strokeWidth={2.5} />
          AI
        </span>
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
