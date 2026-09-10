import { TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockAllergies } from "@/features/charting/data/mock-face-sheet";

export function AllergiesCard() {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <TriangleAlert className="h-4 w-4 text-status-error" />
        <CardTitle className="text-sm font-semibold text-slate-900">
          Allergies
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {mockAllergies.map((allergy) => (
          <div
            key={allergy.substance}
            className="flex items-center justify-between rounded-md border border-status-error-border bg-status-error-bg px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                {allergy.substance}
              </p>
              <p className="text-xs text-slate-500">{allergy.reaction}</p>
            </div>
            <span className="text-xs font-medium text-status-error">
              {allergy.severity}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
