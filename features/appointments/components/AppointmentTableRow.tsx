"use client";

import { useRouter } from "next/navigation";
import { cn } from "cn";
import { FileCheck } from "lucide-react";
import type { Appointment } from "@/features/appointments/types";
import { StatusBadge, type StatusBadgeVariant } from "@/components/ui/status-badge";
import { setSelectedPatient } from "@/features/charting/lib/selected-patient";

const CHARTING_VARIANT: Record<Appointment["chartingStatus"], StatusBadgeVariant> = {
  "Not Started": "default",
  "In Progress": "info",
  Signed: "success",
};

export function AppointmentTableRow({
  appointment,
}: {
  appointment: Appointment;
}) {
  const router = useRouter();

  const navigate = () => {
    setSelectedPatient({
      firstName: appointment.patientFirstName,
      lastName: appointment.patientLastName,
      initials: `${appointment.patientFirstName[0]}${appointment.patientLastName[0]}`.toUpperCase(),
      age: appointment.age,
      sex: appointment.sex,
      mrn: appointment.mrn,
      dob: appointment.dob,
      timeStart: appointment.timeStart,
      durationMinutes: appointment.durationMinutes,
      visitType: appointment.type,
    });
    router.push("/charting");
  };

  return (
    <tr
      role="link"
      tabIndex={0}
      onClick={navigate}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate();
      }}
      className="cursor-pointer border-b border-slate-200 odd:bg-white even:bg-slate-50 hover:bg-slate-100"
    >
      <td className="sticky left-0 z-10 min-w-[150px] max-w-[150px] bg-inherit px-4 py-3.5 pl-6">
        <p
          className="truncate text-[13px] font-semibold text-[#0A0A0A]"
          title={`${appointment.patientLastName}, ${appointment.patientFirstName}`}
        >
          {appointment.patientLastName}, {appointment.patientFirstName}
        </p>
        <p className="text-xs text-slate-500">Age: {appointment.age}</p>
      </td>
      <td className="sticky left-[150px] z-10 min-w-[140px] bg-inherit px-4 py-3.5 shadow-[1px_0_0_0_#e2e8f0]">
        <p className="text-[13px] text-[#0A0A0A]">{appointment.timeStart}</p>
        <p className="text-xs text-slate-500">
          {appointment.durationMinutes} min
        </p>
      </td>
      <td className="px-4 py-3.5 text-[13px] text-[#0A0A0A]">
        {appointment.reason}
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge label={appointment.status} variant="neutral" />
      </td>
      <td className="px-4 py-3.5 text-[13px] text-[#0A0A0A]">
        {appointment.type}
      </td>
      <td className="px-4 py-3.5 text-[13px] text-[#0A0A0A]">
        {appointment.checkedIn ?? "--"}
      </td>
      <td className="px-4 py-3.5 text-[13px] text-[#0A0A0A]">
        {appointment.examRoom ?? "--"}
      </td>
      <td className="px-4 py-3.5 text-[13px] text-[#0A0A0A]">
        {appointment.caseName}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <StatusBadge
            label={appointment.chartingStatus}
            variant={CHARTING_VARIANT[appointment.chartingStatus]}
          />
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-medium text-slate-500"
            )}
          >
            <FileCheck className="h-3.5 w-3.5" />
            V2
          </span>
        </div>
      </td>
    </tr>
  );
}
