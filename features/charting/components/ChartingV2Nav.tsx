"use client";

import { cn } from "cn";
import {
  LayoutDashboard,
  MessageSquareText,
  Stethoscope,
  ClipboardCheck,
  ListChecks,
} from "lucide-react";
import type { ChartingV2Section } from "@/features/charting/types";

const NAV_ITEMS: { key: ChartingV2Section; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "subjective", label: "Subjective", icon: MessageSquareText },
  { key: "objective", label: "Objective", icon: Stethoscope },
  { key: "assessment", label: "Assessment", icon: ClipboardCheck },
  { key: "plan", label: "Plan", icon: ListChecks },
];

export function ChartingV2Nav({
  activeSection,
  hasChart,
  onSelect,
}: {
  activeSection: ChartingV2Section;
  hasChart: boolean;
  onSelect: (section: ChartingV2Section) => void;
}) {
  return (
    <nav className="hidden w-[190px] shrink-0 flex-col gap-1 border-r border-slate-200 bg-white p-3 lg:flex">
      {NAV_ITEMS.map((item) => {
        const isSoapItem = item.key !== "overview";
        const disabled = isSoapItem && !hasChart;
        const isActive = activeSection === item.key;
        const Icon = item.icon;

        return (
          <button
            key={item.key}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(item.key)}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors",
              disabled && "cursor-not-allowed text-slate-300",
              !disabled &&
                (isActive
                  ? "bg-brand-teal-tint font-medium text-brand-teal-dark"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                disabled
                  ? "text-slate-300"
                  : isActive
                    ? "text-brand-teal-dark"
                    : "text-slate-500"
              )}
            />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
