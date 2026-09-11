import type {
  VisitSheetComponent,
  VisitSheetItem,
  VisitSheetSoapGroup,
} from "@/features/charting/types";
import { ITEM_CATALOG } from "@/features/charting/data/item-catalog";

export type SoapKey = "SUBJECTIVE" | "OBJECTIVE" | "ASSESSMENT" | "PLAN";

/** A fillable slot in the currently loaded encounter sheet, exposed to the AI parser. */
export interface SoapSlot {
  slotId: string;
  compntName: string;
  itmName: string;
  itmCode: string | null;
  soap: SoapKey;
  currentValue: string;
  /**
   * Exact values this field accepts (e.g. ["Mild","Moderate","Severe"]) — the
   * AI must choose from this list verbatim (comma-separate for multi-select
   * checkbox fields) instead of writing free text, when present.
   */
  allowedValues: string[] | null;
  /** True when this slot doesn't exist on the chart yet — it's an addable item from the catalog. */
  isNew: boolean;
  /** Internal — which component to attach a new item to; not sent to the AI. */
  compntPkey: number;
  /** Internal — narrative template (attribute1) to give a newly-added item. */
  template: string | null;
}

export interface SoapUpdate {
  slotId: string;
  generatedText: string;
}

export interface ApplySoapUpdatesResult {
  groups: VisitSheetSoapGroup[];
  /** Items that actually changed or were added — used to drive UI highlight animations. */
  touched: { pkey: number; soap: SoapKey }[];
}

/**
 * Stable id for one EXISTING item slot within a component — shared by
 * buildSoapSlots (sent to the AI) and applySoapUpdates (applies the AI's
 * response back), so they MUST stay in lockstep.
 */
function makeExistingSlotId(component: VisitSheetComponent, itmName: string | null, pkey: number): string {
  const componentKey = component.compntCode ?? String(component.emrCompntsPkey);
  return `${componentKey}::${itmName ?? `item-${pkey}`}`;
}

/** Stable id for a not-yet-added catalog item slot, namespaced separately from existing-item ids. */
function makeCatalogSlotId(compntCode: string, itmCode: string): string {
  return `${compntCode}::catalog::${itmCode}`;
}

/**
 * Safety cap on how many not-yet-charted catalog items one component can
 * forward to the AI per sync tick. Catalog files are meant to be small
 * (a dozen or two items); this only kicks in if one grows unexpectedly large
 * and would otherwise balloon the /api/soap-parser payload sent every 18s.
 * The full catalog is always available in the manual "Add Options" drawer
 * regardless of this cap — it only limits what's proactively offered to the AI.
 */
const MAX_CATALOG_SLOTS_PER_COMPONENT = 25;

/**
 * Some real catalog items carry very large value lists (a Family History
 * member's condition list runs ~42 options, Medical History's Cardiovascular
 * ~79) — sending every one of those on every 18s sync tick, for every
 * component across the whole encounter sheet, bloats the AI prompt into the
 * tens of thousands of tokens. That risks the request failing outright and,
 * even when it succeeds, drowns out smaller/simpler slots (e.g. a 3-option
 * Marital Status) in the noise. Past this size, drop the value constraint
 * for the AI and let it write free text instead — full-fidelity value
 * checklists still work as before in the manual "Add Options" drawer,
 * which reads ITEM_CATALOG directly and never goes through this cap.
 */
const MAX_ALLOWED_VALUES_FOR_AI = 30;

let syntheticPkeyCounter = 9_000_000;
function nextSyntheticPkey(): number {
  return syntheticPkeyCounter++;
}

/**
 * Flattens the current chart tree into slots the AI can target by id —
 * both items already on the sheet, AND addable items from that component's
 * catalog entry (features/charting/data/item-catalog.ts) that aren't
 * charted yet, so the AI isn't limited to whatever narrow set of fields the
 * encounter sheet happened to ship with. Catalog entries with dependentItems
 * are skipped (those are conditionally-revealed in the manual "Add Options"
 * UI and don't translate cleanly to an automatic add). Skips inactive items.
 */
export function buildSoapSlots(groups: VisitSheetSoapGroup[]): SoapSlot[] {
  const slots: SoapSlot[] = [];

  function walk(component: VisitSheetComponent) {
    const chartedItmCodes = new Set(component.items.map((item) => item.itmCode).filter(Boolean));

    for (const item of component.items) {
      if (item.attribute1 === "N") continue;
      slots.push({
        slotId: makeExistingSlotId(component, item.itmName, item.emrPatConCompntItmsPkey),
        compntName: component.compntName,
        itmName: item.itmName ?? "",
        itmCode: item.itmCode ?? null,
        soap: component.soap,
        currentValue: item.generatedText ?? "",
        allowedValues: null,
        isNew: false,
        compntPkey: component.emrCompntsPkey,
        template: item.itmTemplate,
      });
    }

    if (component.compntCode) {
      const catalogEntries = (ITEM_CATALOG[component.compntCode] ?? []).slice(
        0,
        MAX_CATALOG_SLOTS_PER_COMPONENT
      );
      for (const entry of catalogEntries) {
        const catalogItem = entry.emrCompntItms;
        if (!catalogItem.itmCode || chartedItmCodes.has(catalogItem.itmCode)) continue;
        slots.push({
          slotId: makeCatalogSlotId(component.compntCode, catalogItem.itmCode),
          compntName: component.compntName,
          itmName: catalogItem.itmName,
          itmCode: catalogItem.itmCode,
          soap: component.soap,
          currentValue: "",
          allowedValues:
            catalogItem.emrCompntItmValues.length > 0 &&
            catalogItem.emrCompntItmValues.length <= MAX_ALLOWED_VALUES_FOR_AI
              ? catalogItem.emrCompntItmValues.map((v) => v.valueName)
              : null,
          isNew: true,
          compntPkey: component.emrCompntsPkey,
          template: catalogItem.attribute1,
        });
      }
    }

    component.children.forEach(walk);
  }

  for (const group of groups) {
    group.components.forEach(walk);
  }

  return slots;
}

/** Applies AI-proposed slot updates onto the chart tree: fills existing items and adds new ones from the catalog. */
export function applySoapUpdates(
  groups: VisitSheetSoapGroup[],
  updates: SoapUpdate[],
  slots: SoapSlot[]
): ApplySoapUpdatesResult {
  const slotById = new Map(slots.map((slot) => [slot.slotId, slot]));
  const updateMap = new Map(
    updates
      .filter((update) => update.generatedText?.trim())
      .map((update) => [update.slotId, update.generatedText.trim()])
  );
  const touched: ApplySoapUpdatesResult["touched"] = [];

  const newItemsByComponent = new Map<number, VisitSheetItem[]>();
  for (const [slotId, generatedText] of updateMap) {
    const slot = slotById.get(slotId);
    if (!slot || !slot.isNew) continue;
    const pkey = nextSyntheticPkey();
    const list = newItemsByComponent.get(slot.compntPkey) ?? [];
    list.push({
      emrPatConCompntItmsPkey: pkey,
      itmName: slot.itmName,
      itmCode: slot.itmCode,
      generatedText,
      itmTemplate: slot.template,
      itmBeginText: null,
      itmEndText: null,
      attribute1: "Y",
    });
    newItemsByComponent.set(slot.compntPkey, list);
    touched.push({ pkey, soap: slot.soap });
  }

  function updateComponent(component: VisitSheetComponent): VisitSheetComponent {
    const items = component.items.map((item) => {
      const slotId = makeExistingSlotId(component, item.itmName, item.emrPatConCompntItmsPkey);
      const newText = updateMap.get(slotId);
      if (newText === undefined || newText === item.generatedText) return item;
      touched.push({ pkey: item.emrPatConCompntItmsPkey, soap: component.soap });
      return { ...item, generatedText: newText };
    });

    const additions = newItemsByComponent.get(component.emrCompntsPkey);
    const allItems = additions ? [...items, ...additions] : items;
    const children = component.children.map(updateComponent);
    return { ...component, items: allItems, children };
  }

  const newGroups = groups.map((group) => ({
    ...group,
    components: group.components.map(updateComponent),
  }));

  return { groups: newGroups, touched };
}
