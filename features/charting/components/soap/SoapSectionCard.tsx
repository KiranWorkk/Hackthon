"use client";

import { useState } from "react";
import { ChevronDown, FileText, Plus } from "lucide-react";
import { cn } from "cn";
import type { VisitSheetComponent, VisitSheetItem } from "@/features/charting/types";
import { ItemCard } from "@/features/charting/components/soap/ItemCard";

export function SoapSectionCard({
  component,
  depth = 0,
  onAddOptions,
  onEditItem,
}: {
  component: VisitSheetComponent;
  depth?: number;
  onAddOptions: (component: VisitSheetComponent) => void;
  onEditItem: (component: VisitSheetComponent, item: VisitSheetItem) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const isNested = depth > 0;
  const hasExpandableContent =
    component.items.length > 0 || component.children.length > 0;

  return (
    <div
      className={cn(
        !isNested && "overflow-hidden rounded-xl border border-slate-200 bg-white"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          isNested ? "px-3 py-2" : "px-4 py-3"
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-lg bg-icon-badge text-primary",
              isNested ? "h-6 w-6" : "h-8 w-8"
            )}
          >
            <FileText className={isNested ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </div>
          <span
            className={cn(
              "truncate text-slate-800",
              isNested ? "text-xs font-medium" : "text-sm font-semibold"
            )}
          >
            {component.compntName}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => onAddOptions(component)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-700 transition-colors hover:bg-slate-50",
              isNested ? "h-6 px-2 text-[10px]" : "h-7 px-2.5 text-[11px]"
            )}
          >
            <Plus className={isNested ? "h-2.5 w-2.5" : "h-2.5 w-2.5"} />
            Add Options
          </button>
          {hasExpandableContent && (
            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className="text-slate-400 transition-colors hover:text-slate-600"
              aria-label={isOpen ? "Collapse" : "Expand"}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
          )}
        </div>
      </div>

      {isOpen && hasExpandableContent && (
        <div
          className={cn(
            "flex flex-col gap-3 px-4 py-3",
            !isNested && "border-t border-slate-100"
          )}
        >
          {component.items.map((item) => (
            <ItemCard
              key={item.emrPatConCompntItmsPkey}
              item={item}
              onClick={() => onEditItem(component, item)}
            />
          ))}

          {component.children.length > 0 && (
            <div className="flex flex-col gap-2 border-l-2 border-slate-100 pl-3">
              {component.children.map((child) => (
                <SoapSectionCard
                  key={child.emrCompntsPkey}
                  component={child}
                  depth={depth + 1}
                  onAddOptions={onAddOptions}
                  onEditItem={onEditItem}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
