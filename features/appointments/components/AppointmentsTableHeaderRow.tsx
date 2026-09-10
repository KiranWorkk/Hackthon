import { cn } from "cn";
import { APPOINTMENTS_TABLE_HEADERS } from "@/features/appointments/constants";

export function AppointmentsTableHeaderRow() {
  return (
    <tr className="h-11 bg-slate-100 text-xs font-semibold text-slate-500">
      {APPOINTMENTS_TABLE_HEADERS.map((col) => (
        <th
          key={col.key}
          className={cn("px-4 text-left whitespace-nowrap", col.headerClassName)}
        >
          {col.label}
        </th>
      ))}
    </tr>
  );
}
