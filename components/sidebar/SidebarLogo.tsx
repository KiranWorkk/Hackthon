"use client";

import { PanelLeftClose, Stethoscope } from "lucide-react";
import { useSidebar } from "@/components/providers/sidebar-provider";

export function SidebarLogo() {
  const { isCollapsed, setIsCollapsed } = useSidebar();

  if (isCollapsed) {
    return (
      <div className="flex h-14 items-center justify-center border-b border-slate-200">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-brand-teal-dark hover:bg-slate-50"
          aria-label="Expand sidebar"
        >
          <Stethoscope className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
      <div className="flex items-center gap-2">
        <Stethoscope className="h-5 w-5 text-brand-teal-dark" />
        <span className="text-sm font-semibold text-slate-900">
          EHR Proto
        </span>
      </div>
      <button
        type="button"
        onClick={() => setIsCollapsed(true)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        aria-label="Collapse sidebar"
      >
        <PanelLeftClose className="h-4 w-4" />
      </button>
    </div>
  );
}
