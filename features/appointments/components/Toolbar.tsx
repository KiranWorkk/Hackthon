"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppointmentStatus } from "@/features/appointments/types";

const STATUS_OPTIONS: AppointmentStatus[] = [
  "Confirmed",
  "Checked In",
  "Cancelled",
  "No Show",
  "Completed",
  "Pending",
];

export function Toolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-6 py-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search patients..."
          className="pl-9"
        />
      </div>
      <Select
        value={status}
        onValueChange={(value) => onStatusChange(value === "all" ? "" : value)}
      >
        <SelectTrigger className="w-full xl:w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
