import { Header } from "@/components/Header";
import { AppointmentsTable } from "@/features/appointments/components/AppointmentsTable";

export default function AppointmentsPage() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <Header
        title="Appointments"
        description="Manage and track all scheduled patient appointments."
      />
      <div className="min-h-0 flex-1 overflow-hidden p-3 md:p-6">
        <AppointmentsTable />
      </div>
    </div>
  );
}
