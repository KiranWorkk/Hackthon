"use client";

import { StethoscopeIcon } from "@hugeicons/core-free-icons";
import { OverviewCard } from "@/features/charting/components/overview/OverviewCard";
import { OverviewEmptyState } from "@/features/charting/components/overview/OverviewEmptyState";
import { useSelectedPatientRecord } from "@/features/charting/lib/use-selected-patient-record";

export function ProblemsCard() {
  const { faceSheet } = useSelectedPatientRecord();
  return (
    <OverviewCard icon={StethoscopeIcon} title="Problem List">
      {faceSheet.problems.length === 0 ? (
        <OverviewEmptyState message="No problems recorded." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {faceSheet.problems.map((problem) => (
            <span
              key={problem.icdCode}
              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600"
            >
              {problem.name} — {problem.status}
            </span>
          ))}
        </div>
      )}
    </OverviewCard>
  );
}
