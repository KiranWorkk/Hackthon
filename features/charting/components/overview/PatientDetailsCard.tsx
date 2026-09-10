"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import { useSelectedPatient } from "@/features/charting/lib/selected-patient";

export function PatientDetailsCard() {
  const patient = useSelectedPatient();
  const ageSexText = [patient.sex, `${patient.age} years old`]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F0FDFA] font-semibold text-primary">
        {patient.initials}
      </div>
      <div className="min-w-0">
        <div className="mb-1 text-sm font-semibold text-[#0A0A0A]">
          {patient.lastName}, {patient.firstName}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{ageSexText}</span>
          <span className="mx-0.5">·</span>
          <span>{patient.mrn}</span>
          <span className="mx-0.5">·</span>
          <span className="inline-flex items-center gap-1">
            <HugeiconsIcon icon={Calendar03Icon} size={13} className="text-slate-400" />
            {patient.dob}
          </span>
        </div>
      </div>
    </div>
  );
}
