"use client";

import { useMemo, useState } from "react";
import { mockAppointments } from "@/features/appointments/data/mock-appointments";
import { ITEMS_PER_PAGE } from "@/features/appointments/constants";
import { AppointmentsTableHeaderRow } from "@/features/appointments/components/AppointmentsTableHeaderRow";
import { AppointmentTableRow } from "@/features/appointments/components/AppointmentTableRow";
import { Toolbar } from "@/features/appointments/components/Toolbar";

export function AppointmentsTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    return mockAppointments.filter((appt) => {
      const matchesSearch = search
        ? `${appt.patientFirstName} ${appt.patientLastName}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true;
      const matchesStatus = status ? appt.status === status : true;
      return matchesSearch && matchesStatus;
    });
  }, [search, status]);

  const visible = filtered.slice(0, ITEMS_PER_PAGE);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Toolbar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
      />
      <div className="flex-1 overflow-auto border-t border-slate-200">
        <table className="w-full border-collapse">
          <thead>
            <AppointmentsTableHeaderRow />
          </thead>
          <tbody>
            {visible.map((appointment) => (
              <AppointmentTableRow
                key={appointment.id}
                appointment={appointment}
              />
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-slate-500">
            No appointments match your filters.
          </p>
        )}
      </div>
    </div>
  );
}
