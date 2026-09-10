import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { mockPatient } from "@/features/charting/data/mock-face-sheet";
import type { ChartSession } from "@/features/charting/types";

export function ChartingV2Header({
  hasChart,
  chartSession,
  onStartCharting,
}: {
  hasChart: boolean;
  chartSession: ChartSession | null;
  onStartCharting: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 bg-brand-teal-tint">
          <AvatarFallback className="bg-brand-teal-tint text-sm font-medium text-brand-teal-dark">
            {mockPatient.initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {mockPatient.lastName}, {mockPatient.firstName}
          </p>
          <p className="text-xs text-slate-500">
            {mockPatient.mrn} · Age {mockPatient.age} · {mockPatient.sex}
            {chartSession && ` · DOS ${chartSession.dos}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge
          label={hasChart ? "In Progress" : "Not Started"}
          variant={hasChart ? "info" : "default"}
        />
        {!hasChart && (
          <Button onClick={onStartCharting} size="sm">
            Start Charting
          </Button>
        )}
      </div>
    </div>
  );
}
