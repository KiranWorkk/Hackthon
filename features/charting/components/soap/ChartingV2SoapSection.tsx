import type { VisitSheetComponent, VisitSheetItem } from "@/features/charting/types";
import { SoapSectionCard } from "@/features/charting/components/soap/SoapSectionCard";

export function ChartingV2SoapSection({
  title,
  components,
  onAddOptions,
  onEditItem,
}: {
  title: string;
  components: VisitSheetComponent[];
  onAddOptions: (component: VisitSheetComponent) => void;
  onEditItem: (component: VisitSheetComponent, item: VisitSheetItem) => void;
}) {
  return (
    <div className="p-4">
      <h2 className="mb-4 px-1 text-base font-semibold text-[#0A0A0A]">
        {title}
      </h2>
      {components.length === 0 ? (
        <p className="px-1 text-sm text-slate-500">
          No content charted for this section yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {components.map((component) => (
            <SoapSectionCard
              key={component.emrCompntsPkey}
              component={component}
              onAddOptions={onAddOptions}
              onEditItem={onEditItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
