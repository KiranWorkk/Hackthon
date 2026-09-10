import { ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { mockProblems } from "@/features/charting/data/mock-face-sheet";

export function ProblemsCard() {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <ClipboardList className="h-4 w-4 text-brand-teal-dark" />
        <CardTitle className="text-sm font-semibold text-slate-900">
          Problem List
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {mockProblems.map((problem) => (
          <div
            key={problem.icdCode}
            className="flex items-start justify-between gap-2 rounded-md border border-slate-200 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                {problem.name}
              </p>
              <p className="text-xs text-slate-500">
                {problem.icdCode} · onset {problem.onsetDate}
              </p>
            </div>
            <StatusBadge
              label={problem.status}
              variant={problem.status === "Active" ? "warning" : "default"}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
