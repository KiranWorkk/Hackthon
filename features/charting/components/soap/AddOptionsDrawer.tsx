"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type {
  ComponentItemWrapper,
  VisitSheetComponent,
  VisitSheetItem,
} from "@/features/charting/types";
import { ITEM_CATALOG } from "@/features/charting/data/item-catalog";
import {
  getItemFieldType,
  isExParaOrRichText,
  isOptionListField,
} from "@/features/charting/lib/item-type-utils";

interface EntryState {
  checked: boolean;
  selectedValues: string[];
  text: string;
}

type StateMap = Record<string, EntryState>;

const EMPTY_STATE: EntryState = { checked: false, selectedValues: [], text: "" };

function matchesSearch(entry: ComponentItemWrapper, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const item = entry.emrCompntItms;
  if (
    item.itmName.toLowerCase().includes(q) ||
    (item.itmCode ?? "").toLowerCase().includes(q)
  ) {
    return true;
  }
  return item.dependentItems?.some((d) => matchesSearch(d, query)) ?? false;
}

function buildInitialState(
  entries: ComponentItemWrapper[],
  chartedItems: VisitSheetItem[]
): StateMap {
  const state: StateMap = {};

  function visit(entry: ComponentItemWrapper) {
    const item = entry.emrCompntItms;
    const charted = chartedItems.find((ci) => ci.itmCode === item.itmCode);
    if (charted) {
      const fieldType = getItemFieldType(item);
      const isOptionList = isOptionListField(fieldType);
      state[item.itmCode ?? item.itmName] = {
        checked: true,
        selectedValues: isOptionList
          ? (charted.generatedText ?? "").split(", ").filter(Boolean)
          : [],
        text: isOptionList ? "" : (charted.generatedText ?? ""),
      };
    }
    item.dependentItems?.forEach(visit);
  }

  entries.forEach(visit);
  return state;
}

function flattenChecked(
  entries: ComponentItemWrapper[],
  state: StateMap
): VisitSheetItem[] {
  const results: VisitSheetItem[] = [];

  for (const entry of entries) {
    const item = entry.emrCompntItms;
    const key = item.itmCode ?? item.itmName;
    const entryState = state[key] ?? EMPTY_STATE;

    if (entryState.checked) {
      const fieldType = getItemFieldType(item);
      const generatedText = isOptionListField(fieldType)
        ? entryState.selectedValues.join(", ")
        : entryState.text.trim();

      if (generatedText) {
        results.push({
          emrPatConCompntItmsPkey: Date.now() + Math.floor(Math.random() * 100000),
          itmName: item.itmName,
          itmCode: item.itmCode,
          generatedText,
          itmTemplate: item.attribute1,
          itmBeginText: null,
          itmEndText: null,
          attribute1: "Y",
        });
      }
    }

    if (item.dependentItems) {
      results.push(...flattenChecked(item.dependentItems, state));
    }
  }

  return results;
}

function ChoiceRow({
  entry,
  state,
  onToggleChecked,
  onToggleValue,
  onTextChange,
}: {
  entry: ComponentItemWrapper;
  state: StateMap;
  onToggleChecked: (key: string) => void;
  onToggleValue: (key: string, value: string) => void;
  onTextChange: (key: string, text: string) => void;
}) {
  const item = entry.emrCompntItms;
  const key = item.itmCode ?? item.itmName;
  const entryState = state[key] ?? EMPTY_STATE;
  const fieldType = getItemFieldType(item);
  const isRichText = isExParaOrRichText(fieldType);
  const isNumber = fieldType === "NUMBER";
  const isOptionList = isOptionListField(fieldType);
  const isTextArea = !isRichText && !isNumber && !isOptionList;

  return (
    <div>
      <div className="flex flex-col gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-3.5">
        <div
          onClick={() => onToggleChecked(key)}
          className="flex cursor-pointer items-start gap-3"
        >
          <Checkbox checked={entryState.checked} className="mt-0.5 shrink-0" />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="min-w-0 text-sm leading-snug font-medium text-slate-700">
              {item.itmName}
            </span>
            {item.itmCode && (
              <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                {item.itmCode}
              </span>
            )}
          </div>
        </div>

        {entryState.checked && isOptionList && item.emrCompntItmValues.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 pl-7">
            {item.emrCompntItmValues.map((value) => (
              <label
                key={value.emrCompntItmValuesPkey}
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-slate-600"
              >
                <Checkbox
                  checked={entryState.selectedValues.includes(value.valueName)}
                  onCheckedChange={() => onToggleValue(key, value.valueName)}
                />
                {value.valueName}
              </label>
            ))}
          </div>
        )}

        {entryState.checked && isOptionList && item.emrCompntItmValues.length === 0 && (
          <div className="pl-7">
            <Input
              value={entryState.text}
              onChange={(e) => onTextChange(key, e.target.value)}
              placeholder="Enter notes"
              className="h-8 text-xs"
            />
          </div>
        )}

        {entryState.checked && isNumber && (
          <div className="pl-7">
            <Input
              type="number"
              inputMode="decimal"
              value={entryState.text}
              onChange={(e) => onTextChange(key, e.target.value)}
              placeholder="Enter value"
              className="h-8 text-xs"
            />
          </div>
        )}

        {entryState.checked && isTextArea && (
          <div className="pl-7">
            <Textarea
              rows={2}
              value={entryState.text}
              onChange={(e) => onTextChange(key, e.target.value)}
              placeholder="Enter notes..."
              className="min-h-[60px] resize-none text-xs"
            />
          </div>
        )}

        {entryState.checked && isRichText && (
          <div className="pl-7">
            <Textarea
              rows={3}
              value={entryState.text}
              onChange={(e) => onTextChange(key, e.target.value)}
              placeholder="Enter notes..."
              className="min-h-[80px] resize-none text-xs"
            />
          </div>
        )}
      </div>

      {entryState.checked && item.dependentItems && item.dependentItems.length > 0 && (
        <div className="mt-2 flex flex-col gap-2 border-l-2 border-slate-100 pl-6">
          {item.dependentItems.map((dep) => (
            <ChoiceRow
              key={dep.emrConShtCompntItmsPkey}
              entry={dep}
              state={state}
              onToggleChecked={onToggleChecked}
              onToggleValue={onToggleValue}
              onTextChange={onTextChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AddOptionsDrawerBody({
  component,
  entries,
  onClose,
  onAddItems,
}: {
  component: VisitSheetComponent;
  entries: ComponentItemWrapper[];
  onClose: () => void;
  onAddItems: (items: VisitSheetItem[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [state, setState] = useState<StateMap>(() =>
    buildInitialState(entries, component.items)
  );

  const filteredEntries = useMemo(
    () => entries.filter((entry) => matchesSearch(entry, search)),
    [entries, search]
  );

  const toggleChecked = (key: string) => {
    setState((prev) => {
      const current = prev[key] ?? EMPTY_STATE;
      return { ...prev, [key]: { ...current, checked: !current.checked } };
    });
  };

  const toggleValue = (key: string, value: string) => {
    setState((prev) => {
      const current = prev[key] ?? EMPTY_STATE;
      const has = current.selectedValues.includes(value);
      return {
        ...prev,
        [key]: {
          ...current,
          selectedValues: has
            ? current.selectedValues.filter((v) => v !== value)
            : [...current.selectedValues, value],
        },
      };
    });
  };

  const setText = (key: string, text: string) => {
    setState((prev) => {
      const current = prev[key] ?? EMPTY_STATE;
      return { ...prev, [key]: { ...current, text } };
    });
  };

  const handleAdd = () => {
    const items = flattenChecked(entries, state);
    if (items.length > 0) onAddItems(items);
    onClose();
  };

  return (
    <>
      <SheetTitle className="sr-only">{component.compntName}</SheetTitle>
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-section-title text-slate-900">
              {component.compntName}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Select options to add
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="shrink-0 border-b border-slate-100 px-6 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search options"
              className="h-9 w-full border-slate-200 bg-white pl-10"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-4">
          {filteredEntries.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              No options found.
            </p>
          ) : (
            filteredEntries.map((entry) => (
              <ChoiceRow
                key={entry.emrConShtCompntItmsPkey}
                entry={entry}
                state={state}
                onToggleChecked={toggleChecked}
                onToggleValue={toggleValue}
                onTextChange={setText}
              />
            ))
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Add</Button>
        </div>
      </div>
    </>
  );
}

export function AddOptionsDrawer({
  open,
  onOpenChange,
  component,
  onAddItems,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component: VisitSheetComponent | null;
  onAddItems: (items: VisitSheetItem[]) => void;
}) {
  const entries = component?.compntCode
    ? (ITEM_CATALOG[component.compntCode] ?? [])
    : [];

  const handleClose = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={(next) => !next && handleClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!inset-y-4 !right-4 !h-[calc(100dvh-2rem)] !w-[calc(100vw-2rem)] gap-0 overflow-hidden !rounded-2xl border p-0 sm:!max-w-xl sm:!w-[calc(100vw-8rem)]"
      >
        {open && component && (
          <AddOptionsDrawerBody
            key={component.emrCompntsPkey}
            component={component}
            entries={entries}
            onClose={handleClose}
            onAddItems={onAddItems}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
