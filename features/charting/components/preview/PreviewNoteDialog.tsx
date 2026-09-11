"use client";

import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NotePreviewContent } from "@/features/charting/components/preview/NotePreviewContent";
import type { VisitSheetSoapGroup } from "@/features/charting/types";
import { useMockPatientFacts } from "@/features/charting/data/mock-patient-facts";
import { useSelectedPatientRecord } from "@/features/charting/lib/use-selected-patient-record";

export function PreviewNoteDialog({
  open,
  onOpenChange,
  soapGroups,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  soapGroups: VisitSheetSoapGroup[];
}) {
  const facts = useMockPatientFacts();
  const patient = useSelectedPatientRecord();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] flex-col gap-0 p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 flex-row items-center gap-3 space-y-0 border-b border-slate-100 px-6 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-icon-badge">
            <Printer className="h-[18px] w-[18px] text-primary" />
          </div>
          <DialogTitle className="text-section-title text-slate-900">
            Note Preview
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto bg-white">
          <NotePreviewContent soapGroups={soapGroups} facts={facts} patient={patient} />
        </div>
        <DialogFooter className="shrink-0 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
