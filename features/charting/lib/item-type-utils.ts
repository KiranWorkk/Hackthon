import type { ComponentItem } from "@/features/charting/types";

export type ItemFieldType =
  | "EX-PARAGRAPH"
  | "RICH-TEXT"
  | "CHECK-BOX"
  | "COMBO-BOX"
  | "RADIO-BUTTON"
  | "DROPDOWN"
  | "TEXT-AREA"
  | "NUMBER"
  | "UNKNOWN";

const ALIASES: Record<Exclude<ItemFieldType, "UNKNOWN">, string[]> = {
  "EX-PARAGRAPH": ["EX-PARAGRAPH", "EXPARAGRAPH"],
  "RICH-TEXT": ["RICH-TEXT", "RICHTEXT"],
  "CHECK-BOX": ["CHECK-BOX", "CHECKBOX", "OPTIONS"],
  "COMBO-BOX": ["COMBO-BOX", "COMBOBOX", "COMBO"],
  "RADIO-BUTTON": ["RADIO-BUTTON", "RADIOBUTTON", "RADIO"],
  DROPDOWN: ["DROPDOWN", "DROP-DOWN", "SELECT"],
  "TEXT-AREA": ["TEXT-AREA", "TEXTAREA"],
  NUMBER: ["NUMBER", "NUMERIC"],
};

function matchAlias(value: string): ItemFieldType | null {
  for (const [type, aliases] of Object.entries(ALIASES) as [
    Exclude<ItemFieldType, "UNKNOWN">,
    string[],
  ][]) {
    if (aliases.includes(value)) return type;
  }
  return null;
}

function isGeneratedTextOnlyTemplate(attribute1: string | null | undefined) {
  if (!attribute1) return false;
  return (
    !attribute1.includes("#@ItemName#@") &&
    attribute1.includes("#@GeneratedText#@")
  );
}

export function getItemFieldType(
  item: Pick<ComponentItem, "attribute11" | "attribute1" | "itmCode">
): ItemFieldType {
  const attr11 = (item.attribute11 ?? "").trim().toUpperCase();

  if (attr11) {
    const matched = matchAlias(attr11);
    if (matched === "TEXT-AREA" && isGeneratedTextOnlyTemplate(item.attribute1)) {
      return "EX-PARAGRAPH";
    }
    if (matched) return matched;
  }

  const code = (item.itmCode ?? "").trim().toUpperCase();
  if (code) {
    const matched = matchAlias(code);
    if (matched) return matched;
  }

  if (isGeneratedTextOnlyTemplate(item.attribute1)) {
    return "EX-PARAGRAPH";
  }

  return "TEXT-AREA";
}

export function isExParaOrRichText(fieldType: ItemFieldType): boolean {
  return fieldType === "EX-PARAGRAPH" || fieldType === "RICH-TEXT";
}

export function isOptionListField(fieldType: ItemFieldType): boolean {
  return (
    fieldType === "CHECK-BOX" ||
    fieldType === "COMBO-BOX" ||
    fieldType === "RADIO-BUTTON" ||
    fieldType === "DROPDOWN"
  );
}
