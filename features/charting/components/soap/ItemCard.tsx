import type { VisitSheetItem } from "@/features/charting/types";
import { buildItemHtml } from "@/features/charting/lib/note-utils";
import { MOCK_PATIENT_FACTS } from "@/features/charting/data/mock-patient-facts";

export function ItemCard({
  item,
  onClick,
}: {
  item: VisitSheetItem;
  onClick?: () => void;
}) {
  const rendered = item.itmTemplate
    ? buildItemHtml(item, MOCK_PATIENT_FACTS)
    : null;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-slate-200 px-4 py-3.5 transition-colors hover:border-slate-300 hover:bg-slate-50/60"
    >
      {rendered ? (
        <p
          className="text-sm text-slate-800"
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      ) : item.generatedText ? (
        <>
          <p className="text-sm text-slate-800">{item.itmName}</p>
          <p className="mt-0.5 text-sm text-slate-500">
            - <span>{item.generatedText}</span>
          </p>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-slate-700">
          {item.itmName}
        </p>
      )}
    </div>
  );
}
