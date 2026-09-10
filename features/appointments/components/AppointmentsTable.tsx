"use client";

import { useMemo, useState } from "react";
import { mockAppointments } from "@/features/appointments/data/mock-appointments";
import { ITEMS_PER_PAGE } from "@/features/appointments/constants";
import { AppointmentsTableHeaderRow } from "@/features/appointments/components/AppointmentsTableHeaderRow";
import { AppointmentTableRow } from "@/features/appointments/components/AppointmentTableRow";
import { Toolbar } from "@/features/appointments/components/Toolbar";
import { Pagination } from "@/features/appointments/components/Pagination";

export function AppointmentsTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Toolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
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
      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
