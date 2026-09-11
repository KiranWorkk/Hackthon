import type { Appointment } from "@/features/appointments/types";
import { patients } from "@/features/patients/data/patients";
import { calculateAge } from "@/lib/age";

interface AppointmentSeed {
  patientId: string;
  timeStart: string;
  durationMinutes: number;
  reason: string;
  status: Appointment["status"];
  type: string;
  encounterSheetId: string;
  checkedIn: string | null;
  examRoom: string | null;
  legalEntityProvider: string;
  renderingProvider: string;
  hasSuperBill: boolean;
  chartingStatus: Appointment["chartingStatus"];
}

const SEEDS: AppointmentSeed[] = [
  // Maria Alvarez — pat-1
  {
    patientId: "pat-1",
    timeStart: "08:00 AM",
    durationMinutes: 30,
    reason: "Annual physical",
    status: "Checked In",
    type: "Annual Physical",
    encounterSheetId: "annual-physical",
    checkedIn: "07:52 AM",
    examRoom: "Room 2",
    legalEntityProvider: "Northside Clinic",
    renderingProvider: "Dr. Adam Reyes",
    hasSuperBill: true,
    chartingStatus: "In Progress",
  },
  {
    patientId: "pat-1",
    timeStart: "08:00 AM",
    durationMinutes: 20,
    reason: "Follow-up: blood pressure",
    status: "Completed",
    type: "Follow-Up Visit",
    encounterSheetId: "follow-up-visit",
    checkedIn: "07:55 AM",
    examRoom: "Room 1",
    legalEntityProvider: "Northside Clinic",
    renderingProvider: "Dr. Adam Reyes",
    hasSuperBill: true,
    chartingStatus: "Signed",
  },
  {
    patientId: "pat-1",
    timeStart: "01:30 PM",
    durationMinutes: 15,
    reason: "Lab results review",
    status: "Confirmed",
    type: "Follow-Up Visit",
    encounterSheetId: "follow-up-visit",
    checkedIn: null,
    examRoom: null,
    legalEntityProvider: "Northside Clinic",
    renderingProvider: "Dr. Adam Reyes",
    hasSuperBill: false,
    chartingStatus: "Not Started",
  },

  // James Whitfield — pat-2
  {
    patientId: "pat-2",
    timeStart: "08:30 AM",
    durationMinutes: 20,
    reason: "Follow-up: hypertension",
    status: "Confirmed",
    type: "Follow-Up Visit",
    encounterSheetId: "follow-up-visit",
    checkedIn: null,
    examRoom: null,
    legalEntityProvider: "Northside Clinic",
    renderingProvider: "Dr. Adam Reyes",
    hasSuperBill: false,
    chartingStatus: "Not Started",
  },
  {
    patientId: "pat-2",
    timeStart: "02:00 PM",
    durationMinutes: 20,
    reason: "Medication refill",
    status: "No Show",
    type: "Follow-Up Visit",
    encounterSheetId: "follow-up-visit",
    checkedIn: null,
    examRoom: null,
    legalEntityProvider: "Northside Clinic",
    renderingProvider: "Dr. Adam Reyes",
    hasSuperBill: false,
    chartingStatus: "Not Started",
  },
  {
    patientId: "pat-2",
    timeStart: "10:00 AM",
    durationMinutes: 30,
    reason: "Annual physical",
    status: "Completed",
    type: "Annual Physical",
    encounterSheetId: "annual-physical",
    checkedIn: "09:50 AM",
    examRoom: "Room 3",
    legalEntityProvider: "Northside Clinic",
    renderingProvider: "Dr. Adam Reyes",
    hasSuperBill: true,
    chartingStatus: "Signed",
  },

  // Priya Natarajan — pat-3
  {
    patientId: "pat-3",
    timeStart: "09:00 AM",
    durationMinutes: 15,
    reason: "New patient intake",
    status: "Checked In",
    type: "New Patient Intake",
    encounterSheetId: "new-patient-intake",
    checkedIn: "08:45 AM",
    examRoom: "Room 4",
    legalEntityProvider: "Downtown Medical",
    renderingProvider: "Dr. Sarah Lin",
    hasSuperBill: false,
    chartingStatus: "Not Started",
  },
  {
    patientId: "pat-3",
    timeStart: "11:00 AM",
    durationMinutes: 15,
    reason: "Sports physical",
    status: "Pending",
    type: "New Patient Intake",
    encounterSheetId: "new-patient-intake",
    checkedIn: null,
    examRoom: null,
    legalEntityProvider: "Downtown Medical",
    renderingProvider: "Dr. Sarah Lin",
    hasSuperBill: false,
    chartingStatus: "Not Started",
  },

  // Linda Chen — pat-4
  {
    patientId: "pat-4",
    timeStart: "09:30 AM",
    durationMinutes: 30,
    reason: "Diabetes management",
    status: "Completed",
    type: "Follow-Up Visit",
    encounterSheetId: "follow-up-visit",
    checkedIn: "09:20 AM",
    examRoom: "Room 1",
    legalEntityProvider: "Downtown Medical",
    renderingProvider: "Dr. Sarah Lin",
    hasSuperBill: true,
    chartingStatus: "Signed",
  },
  {
    patientId: "pat-4",
    timeStart: "02:45 PM",
    durationMinutes: 20,
    reason: "Cholesterol follow-up",
    status: "Completed",
    type: "Follow-Up Visit",
    encounterSheetId: "follow-up-visit",
    checkedIn: "02:35 PM",
    examRoom: "Room 1",
    legalEntityProvider: "Downtown Medical",
    renderingProvider: "Dr. Sarah Lin",
    hasSuperBill: true,
    chartingStatus: "Signed",
  },
  {
    patientId: "pat-4",
    timeStart: "01:00 PM",
    durationMinutes: 30,
    reason: "Annual physical",
    status: "Confirmed",
    type: "Annual Physical",
    encounterSheetId: "annual-physical",
    checkedIn: null,
    examRoom: null,
    legalEntityProvider: "Downtown Medical",
    renderingProvider: "Dr. Sarah Lin",
    hasSuperBill: false,
    chartingStatus: "Not Started",
  },
  {
    patientId: "pat-4",
    timeStart: "04:30 PM",
    durationMinutes: 30,
    reason: "Cardiac follow-up",
    status: "Confirmed",
    type: "Follow-Up Visit",
    encounterSheetId: "follow-up-visit",
    checkedIn: null,
    examRoom: null,
    legalEntityProvider: "Downtown Medical",
    renderingProvider: "Dr. Sarah Lin",
    hasSuperBill: false,
    chartingStatus: "Not Started",
  },

  // Marcus Diallo — pat-5
  {
    patientId: "pat-5",
    timeStart: "10:00 AM",
    durationMinutes: 15,
    reason: "Lab results review",
    status: "Cancelled",
    type: "Follow-Up Visit",
    encounterSheetId: "follow-up-visit",
    checkedIn: null,
    examRoom: null,
    legalEntityProvider: "Northside Clinic",
    renderingProvider: "Dr. Adam Reyes",
    hasSuperBill: false,
    chartingStatus: "Not Started",
  },
  {
    patientId: "pat-5",
    timeStart: "10:45 AM",
    durationMinutes: 20,
    reason: "Post-op check",
    status: "Checked In",
    type: "Follow-Up Visit",
    encounterSheetId: "follow-up-visit",
    checkedIn: "10:30 AM",
    examRoom: "Room 3",
    legalEntityProvider: "Northside Clinic",
    renderingProvider: "Dr. Adam Reyes",
    hasSuperBill: true,
    chartingStatus: "In Progress",
  },
  {
    patientId: "pat-5",
    timeStart: "03:30 PM",
    durationMinutes: 30,
    reason: "Annual physical",
    status: "Checked In",
    type: "Annual Physical",
    encounterSheetId: "annual-physical",
    checkedIn: "03:18 PM",
    examRoom: "Room 3",
    legalEntityProvider: "Northside Clinic",
    renderingProvider: "Dr. Adam Reyes",
    hasSuperBill: true,
    chartingStatus: "In Progress",
  },
];

function formatDob(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${month}/${day}/${year}`;
}

export const mockAppointments: Appointment[] = SEEDS.map((seed, index) => {
  const patient = patients.find((p) => p.patientPkey === seed.patientId);
  if (!patient) {
    throw new Error(`mock-appointments: unknown patientId "${seed.patientId}"`);
  }
  return {
    id: String(index + 1),
    patientId: patient.patientPkey,
    encounterSheetId: seed.encounterSheetId,
    patientFirstName: patient.extFirstName,
    patientLastName: patient.extLastName,
    age: calculateAge(patient.extDateOfBirth) ?? 0,
    sex: patient.extSex,
    mrn: patient.medicalRecordNum,
    dob: formatDob(patient.extDateOfBirth),
    timeStart: seed.timeStart,
    durationMinutes: seed.durationMinutes,
    reason: seed.reason,
    status: seed.status,
    type: seed.type,
    checkedIn: seed.checkedIn,
    examRoom: seed.examRoom,
    caseName: `CASE-${1000 + index + 1}`,
    legalEntityProvider: seed.legalEntityProvider,
    renderingProvider: seed.renderingProvider,
    hasSuperBill: seed.hasSuperBill,
    chartingStatus: seed.chartingStatus,
  };
});
