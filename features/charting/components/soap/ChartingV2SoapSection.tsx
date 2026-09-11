import type { VisitSheetComponent, VisitSheetItem } from "@/features/charting/types";
import { SoapSectionCard } from "@/features/charting/components/soap/SoapSectionCard";

export function ChartingV2SoapSection({
  title,
  components,
  onAddOptions,
  onEditItem,
  highlightedPkeys,
  pendingApprovalPkeys,
  onApproveItem,
  onRemoveItem,
  onApproveComponent,
  onRejectComponent,
}: {
  title: string;
  components: VisitSheetComponent[];
  onAddOptions: (component: VisitSheetComponent) => void;
  onEditItem: (component: VisitSheetComponent, item: VisitSheetItem) => void;
  highlightedPkeys?: Set<number>;
  /** Item pkeys written by the AI and still awaiting explicit user approval. */
  pendingApprovalPkeys?: Set<number>;
  onApproveItem?: (pkey: number) => void;
  onRemoveItem?: (component: VisitSheetComponent, item: VisitSheetItem) => void;
  /** Approve/reject every pending item within one component (and its children) at once. */
  onApproveComponent?: (component: VisitSheetComponent) => void;
  onRejectComponent?: (component: VisitSheetComponent) => void;
}) {
  return (
    <div className="p-4">
      <h2 className="mb-4 px-1 text-section-title text-slate-900">
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
  );
}
