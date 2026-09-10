import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockVitals } from "@/features/charting/data/mock-face-sheet";

const ROWS: { label: string; value: string }[] = [
  { label: "Blood Pressure", value: mockVitals.bp },
  { label: "Heart Rate", value: mockVitals.hr },
  { label: "Temperature", value: mockVitals.temp },
  { label: "Height", value: mockVitals.height },
  { label: "Weight", value: mockVitals.weight },
  { label: "BMI", value: mockVitals.bmi },
];

export function PatientVitalsCard() {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Activity className="h-4 w-4 text-brand-teal-dark" />
        <CardTitle className="text-sm font-semibold text-slate-900">
          Vitals
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {ROWS.map((row) => (
          <div key={row.label}>
            <p className="text-xs text-slate-500">{row.label}</p>
            <p className="text-sm font-medium text-slate-900">{row.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
