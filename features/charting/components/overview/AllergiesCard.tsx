"use client";

import { Leaf01Icon } from "@hugeicons/core-free-icons";
import { OverviewCard } from "@/features/charting/components/overview/OverviewCard";
import { OverviewEmptyState } from "@/features/charting/components/overview/OverviewEmptyState";
import { useSelectedPatientRecord } from "@/features/charting/lib/use-selected-patient-record";

export function AllergiesCard() {
  const { faceSheet } = useSelectedPatientRecord();
  return (
    <OverviewCard icon={Leaf01Icon} title="Allergies">
      {faceSheet.allergies.length === 0 ? (
        <OverviewEmptyState message="No allergies recorded." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {faceSheet.allergies.map((allergy) => (
            <span
              key={allergy.substance}
              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600"
            >
              {allergy.substance} — {allergy.reaction} ({allergy.severity})
            </span>
          ))}
        </div>
      )}
    </OverviewCard>
  );
}
