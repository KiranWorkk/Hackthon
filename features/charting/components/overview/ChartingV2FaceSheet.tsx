import { PatientVitalsCard } from "@/features/charting/components/overview/PatientVitalsCard";
import { AllergiesCard } from "@/features/charting/components/overview/AllergiesCard";
import { MedicationsCard } from "@/features/charting/components/overview/MedicationsCard";
import { ProblemsCard } from "@/features/charting/components/overview/ProblemsCard";

export function ChartingV2FaceSheet() {
  return (
    <div className="grid gap-4 p-6 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <PatientVitalsCard />
          <AllergiesCard />
        </div>
        <MedicationsCard />
      </div>
      <div className="xl:col-span-1">
        <ProblemsCard />
      </div>
    </div>
  );
}
