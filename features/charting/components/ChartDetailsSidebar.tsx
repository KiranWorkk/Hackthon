"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  File02Icon,
  PlusSignIcon,
  Upload04Icon,
} from "@hugeicons/core-free-icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CHART_DETAILS_DATA,
  ANATOMY_IMAGES_SECTION,
} from "@/features/charting/data/chart-details";
import type { ChartDetailSection } from "@/features/charting/data/chart-details";

const SECTIONS = [...CHART_DETAILS_DATA, ANATOMY_IMAGES_SECTION];

function ChartDetailsSectionCard({ section }: { section: ChartDetailSection }) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = section.icon;
  const count = section.items.length;

  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e0f5f8]">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-base font-medium text-[#0A0A0A]">
            {section.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {count > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white">
              {count}
            </span>
          )}
          <HugeiconsIcon
            icon={isOpen ? ArrowUp01Icon : ArrowDown01Icon}
            size={16}
            className="text-[#0A0A0A]"
          />
        </div>
      </button>

      {isOpen && (
        <>
          <div className="flex min-h-6 items-center justify-between px-3 pb-2.5">
            <span className="text-[10px] text-slate-500">
              Showing {count} of {count}
            </span>
            <button
              type="button"
              disabled
              className="ml-auto flex items-center gap-1 rounded-md bg-[#F5F5F5] px-2 py-0.5 text-xs font-medium text-[#171717] transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <HugeiconsIcon
                icon={section.actionLabel === "Upload" ? Upload04Icon : PlusSignIcon}
                size={10}
                className="text-[#171717]"
              />
              {section.actionLabel}
            </button>
          </div>

          <div className="min-h-24 border-t border-[#E5E5E5]">
            {count === 0 ? (
              <div className="flex items-center justify-center px-3 py-4">
                <span className="text-center text-[11px] text-slate-400">
                  {section.emptyMessage}
                </span>
              </div>
            ) : (
              section.items.map((item, i) => (
                <div
                  key={`${item.label}-${i}`}
                  className={
                    i < section.items.length - 1
                      ? "flex items-center justify-between border-b border-[#E5E5E5] px-3 py-2"
                      : "flex items-center justify-between px-3 py-2"
                  }
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <HugeiconsIcon
                      icon={File02Icon}
                      size={13}
                      className="shrink-0 text-[#0A0A0A]"
                    />
                    <span className="truncate text-xs leading-tight font-medium text-[#0A0A0A]">
                      {item.label}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function ChartDetailsSidebarContent() {
  return (
    <div className="space-y-3 p-4">
      {SECTIONS.map((section) => (
        <ChartDetailsSectionCard key={section.title} section={section} />
      ))}
    </div>
  );
}

export function ChartDetailsSidebar() {
  return (
    <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-slate-200 bg-white lg:block">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Chart Details</h2>
      </div>
      <ChartDetailsSidebarContent />
    </aside>
  );
}

export function ChartDetailsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[300px] p-0 sm:max-w-[300px]">
        <SheetHeader className="border-b border-slate-200">
          <SheetTitle>Chart Details</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto">
          <ChartDetailsSidebarContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}
