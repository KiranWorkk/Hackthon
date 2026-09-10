export interface AppointmentsColumn {
  key: string;
  label: string;
  headerClassName?: string;
  cellClassName?: string;
}

export const APPOINTMENTS_TABLE_HEADERS: AppointmentsColumn[] = [
  {
    key: "patientName",
    label: "Patient Name",
    headerClassName:
      "sticky left-0 z-20 bg-slate-100 pl-6 min-w-[150px] max-w-[150px]",
    cellClassName:
      "sticky left-0 z-10 bg-inherit pl-6 min-w-[150px] max-w-[150px]",
  },
  {
    key: "timeDuration",
    label: "Time & Duration",
    headerClassName:
      "sticky left-[150px] z-20 bg-slate-100 min-w-[140px] shadow-[1px_0_0_0_#e2e8f0]",
    cellClassName:
      "sticky left-[150px] z-10 bg-inherit min-w-[140px] shadow-[1px_0_0_0_#e2e8f0]",
  },
  { key: "reason", label: "Reason" },
  { key: "status", label: "Status" },
  { key: "type", label: "Type" },
  { key: "checkedIn", label: "Checked In" },
  { key: "examRoom", label: "Exam Room" },
  { key: "caseName", label: "Case Name" },
  { key: "chartingStatus", label: "Charting" },
];

export const ITEMS_PER_PAGE = 10;
