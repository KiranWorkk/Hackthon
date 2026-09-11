"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  File02Icon,
  PlusSignIcon,
  Tick02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { VisitSheetComponent, VisitSheetItem } from "@/features/charting/types";
import { ItemCard } from "@/features/charting/components/soap/ItemCard";

function countPending(component: VisitSheetComponent, pendingApprovalPkeys?: Set<number>): number {
  if (!pendingApprovalPkeys || pendingApprovalPkeys.size === 0) return 0;
  let count = component.items.filter((item) =>
    pendingApprovalPkeys.has(item.emrPatConCompntItmsPkey)
  ).length;
  for (const child of component.children) {
    count += countPending(child, pendingApprovalPkeys);
  }
  return count;
}

export function SoapSectionCard({
  component,
  depth = 0,
  onAddOptions,
  onEditItem,
  highlightedPkeys,
  pendingApprovalPkeys,
  onApproveItem,
  onRemoveItem,
  onApproveComponent,
  onRejectComponent,
}: {
  component: VisitSheetComponent;
  depth?: number;
  onAddOptions: (component: VisitSheetComponent) => void;
  onEditItem: (component: VisitSheetComponent, item: VisitSheetItem) => void;
  highlightedPkeys?: Set<number>;
  pendingApprovalPkeys?: Set<number>;
  onApproveItem?: (pkey: number) => void;
  onRemoveItem?: (component: VisitSheetComponent, item: VisitSheetItem) => void;
  onApproveComponent?: (component: VisitSheetComponent) => void;
  onRejectComponent?: (component: VisitSheetComponent) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const isNested = depth > 0;
  const hasExpandableContent =
    component.items.length > 0 || component.children.length > 0;
  const pendingCount = countPending(component, pendingApprovalPkeys);

  return (
    <div
      className={cn(
        !isNested &&
          "overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow",
        !isNested && !isOpen && "hover:shadow-sm"
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
            <HugeiconsIcon icon={File02Icon} size={isNested ? 12 : 14} />
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
        <div className="flex shrink-0 items-center gap-2">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="hidden text-[10px] font-medium text-amber-600 sm:inline">
                {pendingCount} pending
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onApproveComponent?.(component);
                }}
                aria-label="Approve all pending items in this section"
                title="Approve all"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-colors hover:bg-emerald-200"
              >
                <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRejectComponent?.(component);
                }}
                aria-label="Reject all pending items in this section"
                title="Reject all"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 transition-colors hover:bg-red-200"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2.5} />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => onAddOptions(component)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              isNested ? "h-6 px-2 text-[10px]" : "h-7 px-2.5 text-[11px]"
            )}
          >
            <HugeiconsIcon icon={PlusSignIcon} size={10} />
            Add Options
          </button>
          {hasExpandableContent && (
            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className="rounded text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={isOpen ? "Collapse" : "Expand"}
            >
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={16}
                className={cn(
                  "transition-transform duration-200 ease-out",
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
              justUpdated={highlightedPkeys?.has(item.emrPatConCompntItmsPkey) ?? false}
              isPendingApproval={pendingApprovalPkeys?.has(item.emrPatConCompntItmsPkey) ?? false}
              onApprove={() => onApproveItem?.(item.emrPatConCompntItmsPkey)}
              onRemove={() => onRemoveItem?.(component, item)}
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
                  highlightedPkeys={highlightedPkeys}
                  pendingApprovalPkeys={pendingApprovalPkeys}
                  onApproveItem={onApproveItem}
                  onRemoveItem={onRemoveItem}
                  onApproveComponent={onApproveComponent}
                  onRejectComponent={onRejectComponent}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
