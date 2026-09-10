"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const Icon = section.icon;
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Icon className="h-4 w-4 text-brand-teal-dark" />
          {section.title}
        </span>
        <Button variant="ghost" size="sm" disabled className="h-7 gap-1 px-2">
          <Plus className="h-3.5 w-3.5" />
          {section.actionLabel}
        </Button>
      </div>
      {section.items.length > 0 ? (
        <ul className="space-y-1.5">
          {section.items.map((item) => (
            <li key={item.label} className="text-xs">
              <p className="font-medium text-slate-800">{item.label}</p>
              <p className="text-slate-500">{item.meta}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-400">{section.emptyMessage}</p>
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
