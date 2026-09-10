import type { VisitSheetComponent, VisitSheetSoapGroup } from "@/features/charting/types";
import {
  buildItemHtml,
  collectChildValues,
  componentHasContent,
  type PatientNoteFacts,
} from "@/features/charting/lib/note-utils";
import { mockPatient } from "@/features/charting/data/mock-face-sheet";

const SOAP_ORDER: VisitSheetSoapGroup["soap"][] = [
  "SUBJECTIVE",
  "OBJECTIVE",
  "ASSESSMENT",
  "PLAN",
];

const SOAP_LABEL: Record<VisitSheetSoapGroup["soap"], string> = {
  SUBJECTIVE: "Subjective",
  OBJECTIVE: "Objective",
  ASSESSMENT: "Assessment",
  PLAN: "Plan",
};

function ComponentParagraph({
  component,
  facts,
}: {
  component: VisitSheetComponent;
  facts: PatientNoteFacts;
}) {
  if (!componentHasContent(component)) return null;

  const itemLines = component.items
    .filter((item) => item.attribute1 !== "N")
    .map((item) => buildItemHtml(item, facts))
    .filter(Boolean);

  const childLines = collectChildValues(component.children, facts);

  return (
    <p className="mb-3 text-sm leading-relaxed text-slate-800">
      <span className="font-semibold text-slate-900">
        {component.compntName}:
      </span>{" "}
      {itemLines.map((line, idx) => (
        <span key={idx} dangerouslySetInnerHTML={{ __html: `${line} ` }} />
      ))}
      {childLines.map((line, idx) => (
        <span key={`child-${idx}`} className="mt-1 block text-slate-600">
          {line}
        </span>
      ))}
    </p>
  );
}

function SoapSection({
  group,
  facts,
}: {
  group: VisitSheetSoapGroup;
  facts: PatientNoteFacts;
}) {
  const visibleComponents = group.components.filter(componentHasContent);
  if (visibleComponents.length === 0) return null;

  return (
    <section className="mb-5">
      <h3 className="mb-2 text-sm font-bold tracking-wide text-slate-900 uppercase">
        {SOAP_LABEL[group.soap]}
      </h3>
      {visibleComponents.map((component) => (
        <ComponentParagraph
          key={component.emrCompntsPkey}
          component={component}
          facts={facts}
        />
      ))}
    </section>
  );
}

export function NotePreviewContent({
  soapGroups,
  facts,
}: {
  soapGroups: VisitSheetSoapGroup[];
  facts: PatientNoteFacts;
}) {
  const orderedGroups = SOAP_ORDER.map((soap) =>
    soapGroups.find((group) => group.soap === soap)
  ).filter((group): group is VisitSheetSoapGroup => Boolean(group));

  return (
    <div className="mx-auto max-w-2xl bg-white p-6">
      <header className="mb-6 border-b border-slate-200 pb-4">
        <p className="text-sm font-semibold text-slate-900">
          {mockPatient.lastName}, {mockPatient.firstName}
        </p>
        <p className="text-xs text-slate-500">
          {mockPatient.mrn} · Age {facts.age} · {facts.gender || "—"}
        </p>
      </header>
      {orderedGroups.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing charted yet.</p>
      ) : (
        orderedGroups.map((group) => (
          <SoapSection key={group.soap} group={group} facts={facts} />
        ))
      )}
    </div>
  );
}
