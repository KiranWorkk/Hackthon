"use client";

import { PillIcon } from "@hugeicons/core-free-icons";
import { OverviewCard } from "@/features/charting/components/overview/OverviewCard";
import { OverviewEmptyState } from "@/features/charting/components/overview/OverviewEmptyState";
import { useSelectedPatientRecord } from "@/features/charting/lib/use-selected-patient-record";

export function MedicationsCard() {
  const { faceSheet } = useSelectedPatientRecord();
  return (
    <OverviewCard icon={PillIcon} title="Medications">
      {faceSheet.medications.length === 0 ? (
        <OverviewEmptyState message="No medications recorded." />
      ) : (
        <div className="flex flex-col gap-1.5">
          {faceSheet.medications.map((med) => (
            <p
              key={med.name}
              className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600"
            >
              {med.name} {med.dose} — {med.frequency} · {med.prescriber}
            </p>
          ))}
        </div>
      )}
    </OverviewCard>
  );
}
