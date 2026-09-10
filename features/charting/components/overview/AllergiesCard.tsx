import { Leaf01Icon } from "@hugeicons/core-free-icons";
import { OverviewCard } from "@/features/charting/components/overview/OverviewCard";
import { OverviewEmptyState } from "@/features/charting/components/overview/OverviewEmptyState";
import { mockAllergies } from "@/features/charting/data/mock-face-sheet";

export function AllergiesCard() {
  return (
    <OverviewCard icon={Leaf01Icon} title="Allergies">
      {mockAllergies.length === 0 ? (
        <OverviewEmptyState message="No allergies recorded." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {mockAllergies.map((allergy) => (
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
