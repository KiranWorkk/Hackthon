import { Header } from "@/components/Header";
import { AppointmentsTable } from "@/features/appointments/components/AppointmentsTable";

export default function AppointmentsPage() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <Header
        title="Appointments"
        description="Prototype view — dummy data, click a row to open Charting V2."
      />
      <div className="min-h-0 flex-1">
        <AppointmentsTable />
      </div>
    </div>
  );
}
