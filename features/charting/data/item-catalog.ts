import type { ComponentItemValue, ComponentItemWrapper } from "@/features/charting/types";
import medicalHistoryCatalog from "@/features/charting/data/item-catalog/medical-history.json";
import surgeryProcCatalog from "@/features/charting/data/item-catalog/surgery-proc.json";
import socialHistoryCatalog from "@/features/charting/data/item-catalog/social-history.json";
import familyHistoryCatalog from "@/features/charting/data/item-catalog/family-history.json";
import allergyCatalog from "@/features/charting/data/item-catalog/allergy.json";
import currentMedicationCatalog from "@/features/charting/data/item-catalog/current-medication.json";

let idCounter = 1;
function nextId() {
  return idCounter++;
}

function values(names: string[]): ComponentItemValue[] {
  return names.map((valueName, idx) => ({
    emrCompntItmValuesPkey: nextId(),
    valueName,
    itmValueSortOrder: idx,
  }));
}

function wrap(
  compntFkey: number,
  item: {
    itmName: string;
    itmCode: string | null;
    attribute1: string | null;
    attribute11: string | null;
    emrCompntItmValues?: ComponentItemValue[];
    dependentItems?: ComponentItemWrapper[];
  }
): ComponentItemWrapper {
  return {
    emrConShtCompntItmsPkey: nextId(),
    emrConShtCompntsFkey: compntFkey,
    active: "Y",
    emrCompntItms: {
      emrCompntItmsPkey: nextId(),
      itmName: item.itmName,
      itmCode: item.itmCode,
      attribute1: item.attribute1,
      attribute11: item.attribute11,
      emrCompntItmValues: item.emrCompntItmValues ?? [],
      dependentItems: item.dependentItems,
    },
  };
}

const UOM_TEMPLATE = "#@ItemName#@: #@GeneratedText#@ #@UOM#@";
const PLAIN_TEMPLATE = "#@ItemName#@ #@GeneratedText#@";

export const ITEM_CATALOG: Record<string, ComponentItemWrapper[]> = {
  VITALS: [
    wrap(281, {
      itmName: "O2 Saturation",
      itmCode: "O2_SAT",
      attribute1: UOM_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(281, {
      itmName: "Weight",
      itmCode: "WEIGHT",
      attribute1: UOM_TEMPLATE,
      attribute11: "NUMBER",
    }),
    wrap(281, {
      itmName: "BSA (Body Surface Area)",
      itmCode: "BSA",
      attribute1: UOM_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(281, {
      itmName: "BMI (Body Mass Index)",
      itmCode: "BMI",
      attribute1: UOM_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(281, {
      itmName: "Respiratory Rate",
      itmCode: "RESP_RATE",
      attribute1: UOM_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(281, {
      itmName: "Height",
      itmCode: "HEIGHT",
      attribute1: UOM_TEMPLATE,
      attribute11: "NUMBER",
    }),
    wrap(281, {
      itmName: "Pulse",
      itmCode: "PULSE",
      attribute1: UOM_TEMPLATE,
      attribute11: "TEXT-AREA",
      dependentItems: [
        wrap(281, {
          itmName: "Rhythm",
          itmCode: "PULSE_RHYTHM",
          attribute1: PLAIN_TEMPLATE,
          attribute11: "CHECK-BOX",
          emrCompntItmValues: values(["Regular", "Irregular"]),
        }),
      ],
    }),
    wrap(281, {
      itmName: "Temperature",
      itmCode: "TEMP",
      attribute1: UOM_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    // Real EHR data: diastolic's template omits #@UOM#@ entirely.
    wrap(281, {
      itmName: "Blood Pressure Diastolic",
      itmCode: "BP_DIASTOLIC",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-FIELD",
    }),
    wrap(281, {
      itmName: "Blood Pressure Systolic",
      itmCode: "BP_SYSTOLIC",
      attribute1: UOM_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
  ],
  ROS: [
    wrap(295, {
      itmName: "Constitutional Symptoms",
      itmCode: "ROS_CONSTITUTIONAL",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "CHECK-BOX",
      dependentItems: [
        wrap(295, {
          itmName: "Fever",
          itmCode: "ROS_CONST_FEVER",
          attribute1: PLAIN_TEMPLATE,
          attribute11: "CHECK-BOX",
        }),
        wrap(295, {
          itmName: "Chills",
          itmCode: "ROS_CONST_CHILLS",
          attribute1: PLAIN_TEMPLATE,
          attribute11: "CHECK-BOX",
        }),
        wrap(295, {
          itmName: "Weight Loss",
          itmCode: "ROS_CONST_WEIGHT_LOSS",
          attribute1: PLAIN_TEMPLATE,
          attribute11: "CHECK-BOX",
        }),
      ],
    }),
    wrap(295, {
      itmName: "Cardiovascular",
      itmCode: "ROS_CARDIO",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "CHECK-BOX",
      emrCompntItmValues: values(["Chest Pain", "Palpitations", "Edema"]),
    }),
    wrap(295, {
      itmName: "Respiratory",
      itmCode: "ROS_RESP",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "CHECK-BOX",
      emrCompntItmValues: values(["Cough", "Shortness of Breath", "Wheezing"]),
    }),
  ],
  PE: [
    wrap(304, {
      itmName: "General Appearance",
      itmCode: "PE_GEN_APPEARANCE",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(304, {
      itmName: "HEENT",
      itmCode: "PE_HEENT",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(304, {
      itmName: "Cardiovascular",
      itmCode: "PE_CARDIOVASCULAR",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(304, {
      itmName: "Respiratory",
      itmCode: "PE_RESPIRATORY",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(304, {
      itmName: "Abdomen",
      itmCode: "PE_ABDOMEN",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(304, {
      itmName: "Musculoskeletal",
      itmCode: "PE_MUSCULOSKELETAL",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(304, {
      itmName: "Neurological",
      itmCode: "PE_NEUROLOGICAL",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(304, {
      itmName: "Skin",
      itmCode: "PE_SKIN",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "CHECK-BOX",
      emrCompntItmValues: values(["Normal", "Rash", "Jaundice"]),
    }),
  ],
  ASSESS: [
    wrap(2042, {
      itmName: "Diagnosis",
      itmCode: "ASSESS_DIAGNOSIS",
      attribute1: "#@ItemName#@ - #@GeneratedText#@",
      attribute11: "TEXT-AREA",
    }),
    wrap(2042, {
      itmName: "Additional Diagnosis",
      itmCode: "ASSESS_DX_NOTE",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(2042, {
      itmName: "Risk Factors",
      itmCode: "ASSESS_RISK",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "CHECK-BOX",
      emrCompntItmValues: values(["Smoking", "Obesity", "Family History"]),
    }),
  ],
  PLAN: [
    wrap(2000, {
      itmName: "Follow-Up",
      itmCode: "PLAN_FOLLOW_UP",
      attribute1: "#@ItemName#@: #@GeneratedText#@",
      attribute11: "TEXT-AREA",
    }),
    wrap(2000, {
      itmName: "Order Labs",
      itmCode: "PLAN_LABS",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "CHECK-BOX",
      emrCompntItmValues: values(["CBC", "CMP", "Lipid Panel", "TSH", "A1C"]),
    }),
    wrap(2000, {
      itmName: "Referral",
      itmCode: "PLAN_REFERRAL",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(2000, {
      itmName: "Additional Plan Notes",
      itmCode: "PLAN_NOTES",
      attribute1: "#@GeneratedText#@",
      attribute11: "RICH-TEXT",
    }),
  ],
  CC: [
    wrap(2301, {
      itmName: "Chief Complaint",
      itmCode: "CC_MAIN",
      attribute1: "#@GeneratedText#@",
      attribute11: "RICH-TEXT",
    }),
    wrap(2301, {
      itmName: "Onset",
      itmCode: "CC_ONSET",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(2301, {
      itmName: "Severity",
      itmCode: "CC_SEVERITY",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "CHECK-BOX",
      emrCompntItmValues: values(["Mild", "Moderate", "Severe"]),
    }),
  ],
  PMH: [
    wrap(270, {
      itmName: "Past Surgeries",
      itmCode: "PMH_SURGERIES",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(270, {
      itmName: "Chronic Conditions",
      itmCode: "PMH_CONDITIONS",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "CHECK-BOX",
      emrCompntItmValues: values(["Diabetes", "Hypertension", "Asthma"]),
    }),
  ],
  INTERVAL: [
    wrap(3000, {
      itmName: "New Symptoms Since Last Visit",
      itmCode: "INTERVAL_SYMPTOMS",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "CHECK-BOX",
      emrCompntItmValues: values(["Yes", "No"]),
    }),
    wrap(3000, {
      itmName: "Interval Notes",
      itmCode: "INTERVAL_NOTES",
      attribute1: "#@GeneratedText#@",
      attribute11: "RICH-TEXT",
    }),
  ],
  CARDIAC: [
    wrap(602, {
      itmName: "Murmur",
      itmCode: "CARDIAC_MURMUR",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "CHECK-BOX",
      emrCompntItmValues: values(["None", "Systolic", "Diastolic"]),
    }),
    wrap(602, {
      itmName: "Rhythm",
      itmCode: "CARDIAC_RHYTHM",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
  ],
  SUMMARY: [
    wrap(101, {
      itmName: "Summary Notes",
      itmCode: "SUMMARY_NOTES",
      attribute1: "#@GeneratedText#@",
      attribute11: "RICH-TEXT",
    }),
  ],
  BMI: [
    wrap(202, {
      itmName: "BMI Interpretation",
      itmCode: "BMI_INTERPRETATION",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "CHECK-BOX",
      emrCompntItmValues: values(["Underweight", "Normal", "Overweight", "Obese"]),
    }),
  ],
  LAB_RESULTS: [
    wrap(1020, {
      itmName: "Complete Blood Count (CBC)",
      itmCode: "LAB_CBC",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1020, {
      itmName: "Comprehensive Metabolic Panel (CMP)",
      itmCode: "LAB_CMP",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1020, {
      itmName: "Lipid Panel",
      itmCode: "LAB_LIPID_PANEL",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1020, {
      itmName: "Hemoglobin A1c",
      itmCode: "LAB_A1C",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1020, {
      itmName: "Thyroid Stimulating Hormone (TSH)",
      itmCode: "LAB_TSH",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1020, {
      itmName: "Urinalysis",
      itmCode: "LAB_URINALYSIS",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1020, {
      itmName: "Vitamin D",
      itmCode: "LAB_VITAMIN_D",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1020, {
      itmName: "Iron / Ferritin Panel",
      itmCode: "LAB_IRON_FERRITIN",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1020, {
      itmName: "PSA (Prostate-Specific Antigen)",
      itmCode: "LAB_PSA",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1020, {
      itmName: "Hepatitis Panel",
      itmCode: "LAB_HEPATITIS_PANEL",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
  ],
  IMAGING: [
    wrap(1030, {
      itmName: "Chest X-ray",
      itmCode: "IMAGING_CHEST_XRAY",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1030, {
      itmName: "Mammogram",
      itmCode: "IMAGING_MAMMOGRAM",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1030, {
      itmName: "Bone Density (DEXA)",
      itmCode: "IMAGING_DEXA",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1030, {
      itmName: "Abdominal Ultrasound",
      itmCode: "IMAGING_ABD_US",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1030, {
      itmName: "MRI Brain",
      itmCode: "IMAGING_MRI_BRAIN",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1030, {
      itmName: "CT Chest",
      itmCode: "IMAGING_CT_CHEST",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
  ],
  POC_TESTING: [
    wrap(1040, {
      itmName: "EKG (12-Lead)",
      itmCode: "POC_EKG",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1040, {
      itmName: "Fingerstick Glucose",
      itmCode: "POC_GLUCOSE",
      attribute1: UOM_TEMPLATE,
      attribute11: "NUMBER",
    }),
    wrap(1040, {
      itmName: "Urine Dipstick",
      itmCode: "POC_URINE_DIPSTICK",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1040, {
      itmName: "Rapid Strep Test",
      itmCode: "POC_RAPID_STREP",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "CHECK-BOX",
      emrCompntItmValues: values(["Positive", "Negative"]),
    }),
    wrap(1040, {
      itmName: "Rapid COVID-19 Test",
      itmCode: "POC_RAPID_COVID",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "CHECK-BOX",
      emrCompntItmValues: values(["Positive", "Negative"]),
    }),
    wrap(1040, {
      itmName: "Pregnancy Test (Urine hCG)",
      itmCode: "POC_PREGNANCY_TEST",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "CHECK-BOX",
      emrCompntItmValues: values(["Positive", "Negative"]),
    }),
    wrap(1040, {
      itmName: "Hemoglobin A1c (Point-of-Care)",
      itmCode: "POC_A1C",
      attribute1: UOM_TEMPLATE,
      attribute11: "NUMBER",
    }),
    wrap(1040, {
      itmName: "Peak Flow Measurement",
      itmCode: "POC_PEAK_FLOW",
      attribute1: UOM_TEMPLATE,
      attribute11: "NUMBER",
    }),
  ],
  IMMUNIZATION_GIVEN: [
    wrap(1050, {
      itmName: "Influenza Vaccine",
      itmCode: "IMMUNIZATION_FLU",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1050, {
      itmName: "Tdap Vaccine",
      itmCode: "IMMUNIZATION_TDAP",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1050, {
      itmName: "COVID-19 Vaccine",
      itmCode: "IMMUNIZATION_COVID",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1050, {
      itmName: "Pneumococcal Vaccine",
      itmCode: "IMMUNIZATION_PNEUMOCOCCAL",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1050, {
      itmName: "Shingles Vaccine (Shingrix)",
      itmCode: "IMMUNIZATION_SHINGLES",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1050, {
      itmName: "Hepatitis B Vaccine",
      itmCode: "IMMUNIZATION_HEP_B",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1050, {
      itmName: "HPV Vaccine (Gardasil)",
      itmCode: "IMMUNIZATION_HPV",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
    wrap(1050, {
      itmName: "MMR Vaccine",
      itmCode: "IMMUNIZATION_MMR",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "TEXT-AREA",
    }),
  ],
  // The six catalogs below are generated from real (anonymized) EMR catalog
  // exports rather than hand-written — see
  // features/charting/data/item-catalog/*.json and the transform notes in
  // that directory's source files for how itmCode was made unique per item
  // (the raw data shares one itmCode per category, which would collide with
  // this app's per-item keying) and how allergy.json was curated down from
  // the source's full ~180-item drug database to common/general allergens.
  MEDICAL_HISTORY: medicalHistoryCatalog as ComponentItemWrapper[],
  SURGERY_PROC: surgeryProcCatalog as ComponentItemWrapper[],
  SOCIAL_HISTORY: socialHistoryCatalog as ComponentItemWrapper[],
  FAMILY_HISTORY: familyHistoryCatalog as ComponentItemWrapper[],
  ALLERGY: allergyCatalog as ComponentItemWrapper[],
  CURRENT_MEDI: currentMedicationCatalog as ComponentItemWrapper[],
};
