"use client";

import { cn } from "@/lib/utils";
import type { ChartingV2Section } from "@/features/charting/types";

const PATIENT_ITEMS: { key: ChartingV2Section; label: string }[] = [
  { key: "overview", label: "Overview" },
];

const CHARTING_ITEMS: { key: ChartingV2Section; label: string }[] = [
  { key: "subjective", label: "Subjective" },
  { key: "objective", label: "Objective" },
  { key: "assessment", label: "Assessment" },
  { key: "plan", label: "Plan" },
  { key: "evidence", label: "Evidences" },
];

function NavGroup({
  label,
  items,
  activeSection,
  onSelect,
  pulsingSections,
}: {
  label: string;
  items: { key: ChartingV2Section; label: string }[];
  activeSection: ChartingV2Section;
  onSelect: (section: ChartingV2Section) => void;
  pulsingSections?: Set<ChartingV2Section>;
}) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          const isActive = item.key === activeSection;
          const isPulsing = pulsingSections?.has(item.key) ?? false;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                isActive
                  ? "bg-[#F0FDFA] font-semibold text-primary"
                  : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              )}
            >
              {item.label}
              {isPulsing && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ChartingV2Nav({
  activeSection,
  hasChart,
  onSelect,
  pulsingSections,
}: {
  activeSection: ChartingV2Section;
  hasChart: boolean;
  onSelect: (section: ChartingV2Section) => void;
  pulsingSections?: Set<ChartingV2Section>;
}) {
  return (
    <nav className="hidden w-[190px] shrink-0 flex-col border-r border-slate-200 bg-white pt-4 px-2 lg:flex">
      <NavGroup
        label="Patient"
        items={PATIENT_ITEMS}
        activeSection={activeSection}
        onSelect={onSelect}
      />
      {hasChart && (
        <NavGroup
          label="Charting"
          items={CHARTING_ITEMS}
          activeSection={activeSection}
          onSelect={onSelect}
          pulsingSections={pulsingSections}
        />
      )}
    </nav>
  );
}
