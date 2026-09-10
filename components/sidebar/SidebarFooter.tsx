"use client";

import { mockUser } from "@/components/sidebar/sidebar-data";
import { useSidebar } from "@/components/providers/sidebar-provider";

export function SidebarFooter() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="mt-auto space-y-2 px-4 pb-6">
      <div
        className={`mt-2 flex items-center rounded-lg border-t border-slate-100 p-2 pt-4 ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E0F5F8] text-sm font-bold text-primary">
            {mockUser.initials}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold leading-none text-slate-900">
                {mockUser.name}
              </span>
              <span className="mt-1 truncate text-xs text-slate-500">
                {mockUser.email}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
