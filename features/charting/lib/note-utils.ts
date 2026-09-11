import type { VisitSheetComponent, VisitSheetItem } from "@/features/charting/types";

export const UOM_DICTIONARY: Record<string, string> = {
  O2_SAT: "%",
  WEIGHT: "lb",
  BSA: "m²",
  BMI: "kg/m²",
  RESP_RATE: "breaths/min",
  HEIGHT: "in",
  PULSE: "bpm",
  TEMP: "°F",
  BP_DIASTOLIC: "mmHg",
  BP_SYSTOLIC: "mmHg",
};

export function resolveUom(itmCode: string | null | undefined): string {
  if (!itmCode) return "";
  return UOM_DICTIONARY[itmCode.toUpperCase()] ?? "";
}

/**
 * Substitutes #@ItemName#@ / #@GeneratedText#@ / #@UOM#@ tokens into an item's
 * template. Returns null when there is no template so the caller can fall
 * back to the bare generated text.
 */
export function renderItemTemplate(
  item: Pick<VisitSheetItem, "itmName" | "generatedText" | "itmTemplate" | "itmCode">
): string | null {
  if (!item.itmTemplate) return null;

  let result = item.itmTemplate;
  result = result.split("#@ItemName#@").join(item.itmName ?? "");
  result = result.split("#@GeneratedText#@").join(item.generatedText ?? "");
  result = result.split("#@UOM#@").join(resolveUom(item.itmCode));

  return result.replace(/\s+/g, " ").trim();
}

export interface PatientNoteFacts {
  age: number;
  gender: "Male" | "Female" | "";
  pronoun: "he" | "she" | "";
}

export function buildPatientNoteFacts(
  age: number,
  extSex: string | null | undefined
): PatientNoteFacts {
  const sex = (extSex ?? "").toUpperCase();
  if (sex === "M") return { age, gender: "Male", pronoun: "he" };
  if (sex === "F") return { age, gender: "Female", pronoun: "she" };
  return { age, gender: "", pronoun: "" };
}

const TOKEN_VALUE_BY_NAME = (facts: PatientNoteFacts): Record<string, string> => ({
  age: String(facts.age),
  gender: facts.gender,
  he_she: facts.pronoun,
});

function capitalizeSentences(text: string): string {
  return text.replace(/(^\s*\w|[.!?]\s+\w)/g, (match) => match.toUpperCase());
}

/**
 * Case-insensitively substitutes #@age#@ / #@Gender#@ / #@He_She#@ tokens
 * (any casing) with patient facts, then capitalizes sentence starts so the
 * substituted narrative reads naturally.
 */
export function applyPatientNoteTokens(
  text: string | null | undefined,
  facts: PatientNoteFacts
): string {
  if (!text) return "";
  const values = TOKEN_VALUE_BY_NAME(facts);

  const substituted = text.replace(/#@(\w+)#@/g, (match, tokenName: string) => {
    const value = values[tokenName.toLowerCase()];
    return value !== undefined ? value : match;
  });

  return capitalizeSentences(substituted);
}

/**
 * Composes the display/print HTML for one item: patient tokens are applied
 * to itmName/generatedText FIRST, then the item's own template substitutes
 * those already-resolved values (UOM resolution is itmCode-based and is
 * untouched by the patient-token pass, so ordering here doesn't affect it).
 */
export function buildItemHtml(
  item: VisitSheetItem,
  facts: PatientNoteFacts
): string {
  const tokenName = applyPatientNoteTokens(item.itmName, facts);
  const tokenGeneratedText = applyPatientNoteTokens(item.generatedText, facts);

  const rendered = renderItemTemplate({
    itmName: tokenName,
    generatedText: tokenGeneratedText,
    itmTemplate: item.itmTemplate,
    itmCode: item.itmCode,
  });

  if (rendered) return rendered;
  return tokenGeneratedText || tokenName;
}

function isItemActive(item: VisitSheetItem): boolean {
  return item.attribute1 !== "N";
}

/**
 * Recursively walks a component's children, comma-joining each child's item
 * values (after patient-token substitution) into "Child Name - v1, v2" lines.
 */
export function collectChildValues(
  children: VisitSheetComponent[],
  facts: PatientNoteFacts
): string[] {
  const lines: string[] = [];

  for (const child of children) {
    const values = child.items
      .filter(isItemActive)
      .map((item) => applyPatientNoteTokens(item.generatedText, facts))
      .filter(Boolean);

    if (values.length > 0) {
      lines.push(`${child.compntName} - ${values.join(", ")}`);
    }

    lines.push(...collectChildValues(child.children, facts));
  }

  return lines;
}

export function componentHasContent(component: VisitSheetComponent): boolean {
  const hasItems = component.items.some(
    (item) => isItemActive(item) && item.generatedText
  );
  if (hasItems) return true;
  return component.children.some(componentHasContent);
}
