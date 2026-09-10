import { Pill } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockMedications } from "@/features/charting/data/mock-face-sheet";

export function MedicationsCard() {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Pill className="h-4 w-4 text-brand-teal-dark" />
        <CardTitle className="text-sm font-semibold text-slate-900">
          Medications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {mockMedications.map((med) => (
          <div key={med.name} className="rounded-md border border-slate-200 px-3 py-2">
            <p className="text-sm font-medium text-slate-900">
              {med.name} — {med.dose}
            </p>
            <p className="text-xs text-slate-500">
              {med.frequency} · {med.prescriber}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
