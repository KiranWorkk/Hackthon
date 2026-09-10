export const mockPatient = {
  firstName: "Maria",
  lastName: "Alvarez",
  mrn: "MRN-100234",
  age: 34,
  sex: "F" as const,
  initials: "MA",
};

export const mockVitals = {
  bp: "118/76",
  hr: "72 bpm",
  temp: "98.4 °F",
  height: "5'6\"",
  weight: "142 lb",
  bmi: "22.9",
  recordedAt: "2026-09-08T08:15:00Z",
};

export const mockAllergies = [
  { substance: "Penicillin", reaction: "Hives", severity: "Moderate" },
  { substance: "Peanuts", reaction: "Anaphylaxis", severity: "Severe" },
];

export const mockMedications = [
  {
    name: "Lisinopril",
    dose: "10 mg",
    frequency: "Once daily",
    prescriber: "Dr. Adam Reyes",
  },
  {
    name: "Metformin",
    dose: "500 mg",
    frequency: "Twice daily",
    prescriber: "Dr. Adam Reyes",
  },
];

export const mockProblems = [
  {
    name: "Essential hypertension",
    icdCode: "I10",
    status: "Active",
    onsetDate: "2022-03-14",
  },
  {
    name: "Type 2 diabetes mellitus",
    icdCode: "E11.9",
    status: "Active",
    onsetDate: "2021-11-02",
  },
  {
    name: "Seasonal allergic rhinitis",
    icdCode: "J30.2",
    status: "Resolved",
    onsetDate: "2019-05-20",
  },
];
