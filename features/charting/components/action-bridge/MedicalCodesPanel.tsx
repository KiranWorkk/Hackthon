"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  StethoscopeIcon,
  Alert01Icon,
  Copy01Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type {
  MedicalCodingStatus,
  PredictedCode,
} from "@/features/charting/lib/corti/types";

const SYSTEM_LABEL: Record<string, string> = {
  "icd10cm-outpatient": "ICD-10-CM",
  "icd10cm-inpatient": "ICD-10-CM",
  icd10pcs: "ICD-10-PCS",
  cpt: "CPT",
  icd10: "ICD-10",
  icd10gm: "ICD-10-GM",
};

function systemLabel(system: string): string {
  return SYSTEM_LABEL[system] ?? system.toUpperCase();
}

function isProcedureSystem(system: string): boolean {
  return system === "cpt" || system === "icd10pcs";
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(code).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
      aria-label={`Copy code ${code}`}
    >
      <HugeiconsIcon
        icon={copied ? CheckmarkCircle02Icon : Copy01Icon}
        size={13}
        strokeWidth={2}
        className={copied ? "text-emerald-600" : undefined}
      />
    </button>
  );
}

function CodeRow({ item }: { item: PredictedCode }) {
  const evidenceText = item.evidences?.[0]?.text;
  const hasExtra = Boolean(evidenceText) || (item.alternatives?.length ?? 0) > 0;

  const header = (
    <div className="flex w-full min-w-0 items-start gap-2.5 py-0.5">
      <Badge
        variant="outline"
        className={cn(
          "mt-0.5 shrink-0 rounded-md border-0 px-1.5 py-0.5 font-mono text-[11px] font-semibold",
          isProcedureSystem(item.system) ? "bg-violet-50 text-violet-700" : "bg-[#F0FDFA] text-primary"
        )}
      >
        {item.code}
      </Badge>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-xs leading-snug font-medium text-slate-800">{item.display}</p>
        <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
          {systemLabel(item.system)}
        </p>
      </div>
      <CopyCodeButton code={item.code} />
    </div>
  );

  if (!hasExtra) {
    return <div className="border-b border-slate-100 px-4 py-2.5 last:border-b-0">{header}</div>;
  }

  return (
    <AccordionItem
      value={`${item.system}-${item.code}`}
      className="border-b border-slate-100 px-4 last:border-b-0"
    >
      <AccordionTrigger className="py-2.5 hover:no-underline [&>svg]:mt-1 [&>svg]:size-3.5!">
        {header}
      </AccordionTrigger>
      <AccordionContent className="pt-0 pb-2.5 pl-[calc(1.375rem+0.625rem)]">
        {evidenceText && (
          <p className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2 text-[11px] leading-relaxed text-slate-600 italic">
            &ldquo;{evidenceText}&rdquo;
          </p>
        )}
        {item.alternatives && item.alternatives.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.alternatives.map((alt) => (
              <span
                key={alt.code}
                title={alt.display}
                className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500"
              >
                {alt.code}
              </span>
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function CodeGroup({ title, items }: { title: string; items: PredictedCode[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between px-4 py-1.5">
        <span className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">{title}</span>
        <span className="text-[10px] font-semibold text-slate-400">{items.length}</span>
      </div>
      <Accordion type="multiple" className="border-y border-slate-100 bg-white">
        {items.map((item) => (
          <CodeRow key={`${item.system}-${item.code}`} item={item} />
        ))}
      </Accordion>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="px-4 py-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500">
        <HugeiconsIcon icon={Loading03Icon} size={13} strokeWidth={2} className="animate-spin text-primary" />
        Finding codeable evidence…
      </div>
      <div className="space-y-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Skeleton className="h-4 w-11 rounded-md" />
            <Skeleton className="h-3 flex-1 rounded" style={{ maxWidth: `${70 - i * 8}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0FDFA]">
        <HugeiconsIcon icon={StethoscopeIcon} size={18} strokeWidth={2} className="text-primary" />
      </div>
      <p className="text-sm font-semibold text-slate-700">No codes yet</p>
      <p className="max-w-[240px] text-xs text-slate-500">
        Stop the visit recording to generate ICD-10 and CPT codes from the completed chart.
      </p>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
        <HugeiconsIcon icon={Alert01Icon} size={18} strokeWidth={2} className="text-red-500" />
      </div>
      <p className="text-sm font-semibold text-slate-700">Couldn&apos;t predict codes</p>
      <p className="max-w-[260px] text-xs text-slate-500">{error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      >
        Try again
      </button>
    </div>
  );
}

export function MedicalCodesPanel({
  status,
  codes,
  candidates,
  error,
  onRetry,
}: {
  status: MedicalCodingStatus;
  codes: PredictedCode[];
  candidates: PredictedCode[];
  error: string | null;
  onRetry: () => void;
}) {
  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState error={error ?? "Something went wrong."} onRetry={onRetry} />;
  if (status === "idle") return <EmptyState />;

  const diagnosisCodes = codes.filter((c) => !isProcedureSystem(c.system));
  const procedureCodes = codes.filter((c) => isProcedureSystem(c.system));

  if (codes.length === 0 && candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <HugeiconsIcon icon={StethoscopeIcon} size={18} strokeWidth={2} className="text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-slate-700">No codes found</p>
        <p className="max-w-[240px] text-xs text-slate-500">
          Corti didn&apos;t find codeable evidence in this chart&apos;s note yet.
        </p>
      </div>
    );
  }

  return (
    <div className="py-3">
      <CodeGroup title="Diagnosis · ICD-10-CM" items={diagnosisCodes} />
      <CodeGroup title="Procedure · CPT / ICD-10-PCS" items={procedureCodes} />
      {candidates.length > 0 && (
        <div className="mt-1">
          <div className="px-4 py-1.5">
            <span className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
              Considered, not coded
            </span>
          </div>
          <div className="border-y border-slate-100 bg-slate-50/60">
            {candidates.map((item) => (
              <div
                key={`${item.system}-${item.code}`}
                className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-2 last:border-b-0"
              >
                <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-500">
                  {item.code}
                </span>
                <span className="min-w-0 truncate text-xs text-slate-500">{item.display}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
