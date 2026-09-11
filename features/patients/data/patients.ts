import type { Patient } from "@/features/patients/types";

export const patients: Patient[] = [
  {
    patientPkey: "pat-1",
    extFirstName: "Maria",
    extLastName: "Alvarez",
    extDateOfBirth: "1992-03-14",
    extSex: "F",
    extPhone: "(555) 201-4487",
    medicalRecordNum: "MRN-100001",
    planName: "Standard Life Plan",
    faceSheet: {
      allergies: [
        { substance: "Penicillin", reaction: "Hives", severity: "Moderate" },
        { substance: "Peanuts", reaction: "Anaphylaxis", severity: "Severe" },
      ],
      medications: [
        { name: "Lisinopril", dose: "10 mg", frequency: "Once daily", prescriber: "Dr. Adam Reyes" },
        { name: "Metformin", dose: "500 mg", frequency: "Twice daily", prescriber: "Dr. Adam Reyes" },
      ],
      problems: [
        { name: "Essential hypertension", icdCode: "I10", status: "Active", onsetDate: "2022-03-14" },
        { name: "Type 2 diabetes mellitus", icdCode: "E11.9", status: "Active", onsetDate: "2021-11-02" },
        { name: "Seasonal allergic rhinitis", icdCode: "J30.2", status: "Resolved", onsetDate: "2019-05-20" },
      ],
    },
  },
  {
    patientPkey: "pat-2",
    extFirstName: "James",
    extLastName: "Whitfield",
    extDateOfBirth: "1968-06-02",
    extSex: "M",
    extPhone: "(555) 384-1120",
    medicalRecordNum: "MRN-100002",
    planName: "Premier Health Plan",
    faceSheet: {
      allergies: [{ substance: "Sulfa drugs", reaction: "Rash", severity: "Mild" }],
      medications: [
        { name: "Amlodipine", dose: "5 mg", frequency: "Once daily", prescriber: "Dr. Adam Reyes" },
        { name: "Atorvastatin", dose: "20 mg", frequency: "Once nightly", prescriber: "Dr. Adam Reyes" },
      ],
      problems: [
        { name: "Essential hypertension", icdCode: "I10", status: "Active", onsetDate: "2018-01-09" },
        { name: "Hyperlipidemia", icdCode: "E78.5", status: "Active", onsetDate: "2020-07-30" },
      ],
    },
  },
  {
    patientPkey: "pat-3",
    extFirstName: "Priya",
    extLastName: "Natarajan",
    extDateOfBirth: "1999-11-09",
    extSex: "F",
    extPhone: "(555) 902-7734",
    medicalRecordNum: "MRN-100003",
    planName: "Standard Life Plan",
    faceSheet: {
      allergies: [],
      medications: [],
      problems: [
        { name: "Iron deficiency anemia", icdCode: "D50.9", status: "Active", onsetDate: "2025-06-11" },
      ],
    },
  },
  {
    patientPkey: "pat-4",
    extFirstName: "Linda",
    extLastName: "Chen",
    extDateOfBirth: "1955-01-17",
    extSex: "F",
    extPhone: "(555) 664-3390",
    medicalRecordNum: "MRN-100005",
    planName: "Medicare Advantage",
    faceSheet: {
      allergies: [
        { substance: "Latex", reaction: "Contact dermatitis", severity: "Mild" },
        { substance: "Codeine", reaction: "Nausea", severity: "Moderate" },
      ],
      medications: [
        { name: "Metformin", dose: "1000 mg", frequency: "Twice daily", prescriber: "Dr. Sarah Lin" },
        { name: "Glipizide", dose: "5 mg", frequency: "Once daily", prescriber: "Dr. Sarah Lin" },
        { name: "Losartan", dose: "50 mg", frequency: "Once daily", prescriber: "Dr. Sarah Lin" },
      ],
      problems: [
        { name: "Type 2 diabetes mellitus", icdCode: "E11.9", status: "Active", onsetDate: "2014-02-18" },
        { name: "Essential hypertension", icdCode: "I10", status: "Active", onsetDate: "2016-09-01" },
        { name: "Osteoarthritis, knee", icdCode: "M17.9", status: "Active", onsetDate: "2021-04-22" },
      ],
    },
  },
  {
    patientPkey: "pat-5",
    extFirstName: "Marcus",
    extLastName: "Diallo",
    extDateOfBirth: "1981-04-30",
    extSex: "M",
    extPhone: "(555) 773-5561",
    medicalRecordNum: "MRN-100006",
    planName: "Premier Health Plan",
    faceSheet: {
      allergies: [{ substance: "Ibuprofen", reaction: "GI upset", severity: "Mild" }],
      medications: [
        { name: "Omeprazole", dose: "20 mg", frequency: "Once daily", prescriber: "Dr. Adam Reyes" },
      ],
      problems: [
        { name: "GERD", icdCode: "K21.9", status: "Active", onsetDate: "2023-01-15" },
      ],
    },
  },
];

export function getPatientById(patientPkey: string): Patient | undefined {
  return patients.find((patient) => patient.patientPkey === patientPkey);
}
