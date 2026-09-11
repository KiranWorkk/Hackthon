export interface PatientAllergy {
  substance: string;
  reaction: string;
  severity: "Mild" | "Moderate" | "Severe";
}

export interface PatientMedication {
  name: string;
  dose: string;
  frequency: string;
  prescriber: string;
}

export interface PatientProblem {
  name: string;
  icdCode: string;
  status: "Active" | "Resolved";
  onsetDate: string;
}

export interface PatientFaceSheet {
  allergies: PatientAllergy[];
  medications: PatientMedication[];
  problems: PatientProblem[];
}

/** Shape mirrors patientMaster fields surfaced by api_emr_node's appointments/patients services. */
export interface Patient {
  patientPkey: string;
  extFirstName: string;
  extLastName: string;
  extDateOfBirth: string;
  extSex: "M" | "F";
  extPhone: string;
  medicalRecordNum: string;
  planName: string;
  faceSheet: PatientFaceSheet;
}
