export interface DropdownOption {
  id: string;
  label: string;
}

export const PROVIDER_OPTIONS: DropdownOption[] = [
  { id: "prov-1", label: "Dr. Adam Reyes" },
  { id: "prov-2", label: "Dr. Sarah Lin" },
  { id: "prov-3", label: "Dr. Michael Osei" },
  { id: "prov-4", label: "Dr. Priya Chandran" },
];

export const ENCOUNTER_SHEET_OPTIONS: DropdownOption[] = [
  { id: "annual-physical", label: "Annual Physical" },
  { id: "follow-up-visit", label: "Follow-Up Visit" },
  { id: "new-patient-intake", label: "New Patient Intake" },
];

export const CANNED_SHEET_OPTIONS: Record<string, DropdownOption[]> = {
  "annual-physical": [
    { id: "canned-ap-1", label: "Standard Annual Physical" },
    { id: "canned-ap-2", label: "Medicare Wellness Visit" },
  ],
  "follow-up-visit": [
    { id: "canned-fu-1", label: "Chronic Condition Follow-Up" },
    { id: "canned-fu-2", label: "Post-Op Follow-Up" },
    { id: "canned-fu-3", label: "Medication Check" },
  ],
  "new-patient-intake": [
    { id: "canned-np-1", label: "New Patient — General" },
    { id: "canned-np-2", label: "New Patient — Pediatric" },
  ],
};

export const LOCATION_OPTIONS: DropdownOption[] = [
  { id: "loc-1", label: "Northside Clinic — Main" },
  { id: "loc-2", label: "Downtown Medical — Suite 200" },
  { id: "loc-3", label: "Westview Annex" },
];
