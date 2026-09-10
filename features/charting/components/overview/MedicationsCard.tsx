import { PillIcon } from "@hugeicons/core-free-icons";
import { OverviewCard } from "@/features/charting/components/overview/OverviewCard";
import { OverviewEmptyState } from "@/features/charting/components/overview/OverviewEmptyState";
import { mockMedications } from "@/features/charting/data/mock-face-sheet";

export function MedicationsCard() {
  return (
    <OverviewCard icon={PillIcon} title="Medications">
      {mockMedications.length === 0 ? (
        <OverviewEmptyState message="No medications recorded." />
      ) : (
        <div className="flex flex-col gap-1.5">
          {mockMedications.map((med) => (
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
