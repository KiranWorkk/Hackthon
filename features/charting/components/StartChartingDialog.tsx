"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  PROVIDER_OPTIONS,
  ENCOUNTER_SHEET_OPTIONS,
  CANNED_SHEET_OPTIONS,
  LOCATION_OPTIONS,
} from "@/features/charting/data/dropdown-options";
import type { ChartSession } from "@/features/charting/types";

export function StartChartingDialog({
  open,
  onOpenChange,
  onBeginCharting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBeginCharting: (session: ChartSession) => void;
}) {
  const [providerId, setProviderId] = useState("");
  const [encounterSheetId, setEncounterSheetId] = useState("");
  const [cannedSheetId, setCannedSheetId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [dos, setDos] = useState<Date>(new Date());
  const [dosPopoverOpen, setDosPopoverOpen] = useState(false);

  const cannedSheetOptions = useMemo(
    () => (encounterSheetId ? CANNED_SHEET_OPTIONS[encounterSheetId] ?? [] : []),
    [encounterSheetId]
  );

  const canSubmit =
    providerId && encounterSheetId && cannedSheetId && locationId;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onBeginCharting({
      providerId,
      encounterSheetId,
      cannedSheetId,
      locationId,
      dos: format(dos, "yyyy-MM-dd"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Start Charting</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Select value={providerId} onValueChange={setProviderId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Location</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Encounter Sheet</Label>
            <Select
              value={encounterSheetId}
              onValueChange={(value) => {
                setEncounterSheetId(value);
                setCannedSheetId("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select encounter sheet" />
              </SelectTrigger>
              <SelectContent>
                {ENCOUNTER_SHEET_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Canned Sheet</Label>
            <Select
              value={cannedSheetId}
              onValueChange={setCannedSheetId}
              disabled={!encounterSheetId}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    encounterSheetId
                      ? "Select canned sheet"
                      : "Select an encounter sheet first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {cannedSheetOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Date of Service</Label>
            <Popover open={dosPopoverOpen} onOpenChange={setDosPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start font-normal sm:w-[220px]"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dos, "yyyy-MM-dd")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dos}
                  onSelect={(date) => {
                    if (date) setDos(date);
                    setDosPopoverOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={handleSubmit}>
            Begin Charting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
