import type { ComponentItemValue, ComponentItemWrapper } from "@/features/charting/types";

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
      itmName: "Skin",
      itmCode: "PE_SKIN",
      attribute1: PLAIN_TEMPLATE,
      attribute11: "CHECK-BOX",
      emrCompntItmValues: values(["Normal", "Rash", "Jaundice"]),
    }),
  ],
  ASSESS: [
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
};
